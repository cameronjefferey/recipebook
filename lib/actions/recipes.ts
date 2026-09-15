"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  captures,
  recipes,
  recipeImages,
  recipeTags,
  cookLog,
  type Ingredient,
  type Instruction,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { fileUnderCategory } from "@/lib/books";
import { parseIngredient } from "@/lib/ingredients";

/** A line beginning with # is a section heading, e.g. "# For the crust". */
function linesToIngredients(lines: string[]): Ingredient[] {
  const out: Ingredient[] = [];
  let group: string | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      group = line.replace(/^#+\s*/, "") || null;
      continue;
    }
    out.push(parseIngredient(line, group));
  }
  return out;
}

function linesToInstructions(lines: string[]): Instruction[] {
  const out: Instruction[] = [];
  let group: string | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      group = line.replace(/^#+\s*/, "") || null;
      continue;
    }
    out.push({ text: line, group });
  }
  return out;
}

export type ReviewedRecipe = {
  include: boolean;
  /** components and variations default to folding into the main recipe */
  mergeIntoMain: boolean;
  role: "main" | "component" | "variation";
  title: string;
  description?: string | null;
  category?: string | null;
  servings?: number | null;
  servingsText?: string | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  sourceName?: string | null;
  ingredientLines: string[];
  instructionLines: string[];
  notes?: string | null;
  tags: string[];
};

export async function saveFromCapture(
  captureId: string,
  reviewed: ReviewedRecipe[],
) {
  const user = await requireUser();

  const [capture] = await db
    .select()
    .from(captures)
    .where(
      and(eq(captures.id, captureId), eq(captures.householdId, user.householdId)),
    )
    .limit(1);
  if (!capture) throw new Error("That photo is no longer here.");

  const kept = reviewed.filter((r) => r.include);
  if (kept.length === 0) {
    await db
      .update(captures)
      .set({ status: "discarded" })
      .where(eq(captures.id, captureId));
    redirect("/recipes");
  }

  const standalone = kept.filter((r) => r.role === "main" || !r.mergeIntoMain);
  const merged = kept.filter((r) => r.role !== "main" && r.mergeIntoMain);
  const primary = standalone[0];

  const createdIds: string[] = [];

  for (const entry of standalone) {
    let ingredients = linesToIngredients(entry.ingredientLines);
    let instructions = linesToInstructions(entry.instructionLines);
    let notes = entry.notes ?? null;

    // Fold components and variations into the first standalone recipe: a
    // "recipe follows" pickle becomes its own labelled section, while a
    // variation is only a substitution note.
    if (entry === primary) {
      for (const extra of merged) {
        if (extra.role === "component") {
          ingredients = [
            ...ingredients,
            ...linesToIngredients(extra.ingredientLines).map((ing) => ({
              ...ing,
              group: ing.group ?? extra.title,
            })),
          ];
          instructions = [
            ...instructions,
            ...linesToInstructions(extra.instructionLines).map((step) => ({
              ...step,
              group: step.group ?? extra.title,
            })),
          ];
        } else {
          const body = [
            ...extra.ingredientLines,
            ...extra.instructionLines,
          ]
            .map((l) => l.trim())
            .filter(Boolean)
            .join(" ");
          notes = [notes, `${extra.title}: ${body}`].filter(Boolean).join("\n\n");
        }
      }
    }

    const [row] = await db
      .insert(recipes)
      .values({
        householdId: user.householdId,
        createdBy: user.id,
        title: entry.title.trim() || "Untitled recipe",
        description: entry.description ?? null,
        category: entry.category ?? null,
        servings: entry.servings ?? null,
        servingsText: entry.servingsText ?? null,
        prepMinutes: entry.prepMinutes ?? null,
        cookMinutes: entry.cookMinutes ?? null,
        ingredients,
        instructions,
        notes,
        sourceKind: capture.mime === "application/pdf" ? "page_photo" : "card_photo",
        sourceName: entry.sourceName ?? null,
        needsReview: false,
      })
      .returning({ id: recipes.id });

    createdIds.push(row.id);

    await fileUnderCategory(user.householdId, row.id, entry.category);

    // Each recipe keeps its own copy of the photo, so it stays self-contained
    // and deleting one recipe never orphans or strands another's original.
    await db.insert(recipeImages).values({
      recipeId: row.id,
      householdId: user.householdId,
      kind: "original",
      mime: capture.mime,
      bytes: capture.bytes,
      width: capture.width,
      height: capture.height,
      rotation: capture.rotation,
    });

    const tags = entry.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (tags.length) {
      await db
        .insert(recipeTags)
        .values(tags.map((tag) => ({ recipeId: row.id, tag })))
        .onConflictDoNothing();
    }
  }

  await db
    .update(captures)
    .set({ status: "filed" })
    .where(eq(captures.id, captureId));

  revalidatePath("/recipes");
  revalidatePath("/box");
  redirect(createdIds.length === 1 ? `/r/${createdIds[0]}` : "/recipes");
}

export async function setStatus(
  recipeId: string,
  status: "none" | "keeper" | "want_to_try" | "nope",
) {
  const user = await requireUser();
  await db
    .update(recipes)
    .set({ status, updatedAt: new Date() })
    .where(
      and(eq(recipes.id, recipeId), eq(recipes.householdId, user.householdId)),
    );
  revalidatePath("/recipes");
  revalidatePath(`/r/${recipeId}`);
}

export async function logCook(recipeId: string) {
  const user = await requireUser();
  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(
      and(eq(recipes.id, recipeId), eq(recipes.householdId, user.householdId)),
    )
    .limit(1);
  if (!recipe) return;

  await db.insert(cookLog).values({ recipeId, userId: user.id });
  await db
    .update(recipes)
    .set({
      timesCooked: sql`${recipes.timesCooked} + 1`,
      lastCookedAt: new Date(),
    })
    .where(eq(recipes.id, recipeId));

  revalidatePath("/recipes");
  revalidatePath(`/r/${recipeId}`);
}

export async function deleteRecipe(recipeId: string) {
  const user = await requireUser();
  await db
    .delete(recipes)
    .where(
      and(eq(recipes.id, recipeId), eq(recipes.householdId, user.householdId)),
    );
  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function createManualRecipe(formData: FormData) {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("A recipe needs a name.");

  const category = String(formData.get("category") ?? "").trim() || null;

  const [row] = await db
    .insert(recipes)
    .values({
      householdId: user.householdId,
      createdBy: user.id,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      category,
      servings: Number(formData.get("servings")) || null,
      ingredients: linesToIngredients(
        String(formData.get("ingredients") ?? "").split("\n"),
      ),
      instructions: linesToInstructions(
        String(formData.get("instructions") ?? "").split("\n"),
      ),
      notes: String(formData.get("notes") ?? "").trim() || null,
      sourceKind: "manual",
    })
    .returning({ id: recipes.id });

  await fileUnderCategory(user.householdId, row.id, category);

  revalidatePath("/recipes");
  revalidatePath("/box");
  redirect(`/r/${row.id}`);
}
