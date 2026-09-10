"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { recipes, recipeTags } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { importFromUrl } from "@/lib/import-url";

export type ImportState = { error?: string };

export async function importUrlAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const user = await requireUser();
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { error: "Paste a link first." };

  let recipeId: string;
  try {
    const imported = await importFromUrl(url);

    const [row] = await db
      .insert(recipes)
      .values({
        householdId: user.householdId,
        createdBy: user.id,
        title: imported.title,
        description: imported.description,
        category: imported.category,
        servings: imported.servings,
        servingsText: imported.servingsText,
        prepMinutes: imported.prepMinutes,
        cookMinutes: imported.cookMinutes,
        ingredients: imported.ingredients,
        instructions: imported.instructions,
        notes: imported.notes,
        sourceKind: "web",
        sourceUrl: url,
        sourceName: imported.sourceName,
        needsReview: imported.needsReview,
      })
      .returning({ id: recipes.id });

    if (imported.tags.length) {
      await db
        .insert(recipeTags)
        .values(imported.tags.map((tag) => ({ recipeId: row.id, tag })))
        .onConflictDoNothing();
    }

    recipeId = row.id;
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "That link could not be read.",
    };
  }

  revalidatePath("/box");
  redirect(`/r/${recipeId}`);
}
