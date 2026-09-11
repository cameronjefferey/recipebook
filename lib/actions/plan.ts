"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  recipes,
  mealPlanItems,
  groceryExtras,
  groceryChecked,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { visibleRecipe, canSeeRecipe } from "@/lib/access";
import { isUuid } from "@/lib/ids";

function touchPlan(recipeId?: string) {
  revalidatePath("/plan");
  revalidatePath("/book");
  if (recipeId) revalidatePath(`/r/${recipeId}`);
}

/** Mark a recipe as cooking this week, or take it off the list. */
export async function setPlanned(recipeId: string, planned: boolean) {
  const user = await requireUser();
  if (!(await canSeeRecipe(user, recipeId))) return;

  if (planned) {
    await db
      .insert(mealPlanItems)
      .values({ householdId: user.householdId, recipeId, addedBy: user.id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(mealPlanItems)
      .where(
        and(
          eq(mealPlanItems.householdId, user.householdId),
          eq(mealPlanItems.recipeId, recipeId),
        ),
      );
  }

  touchPlan(recipeId);
}

/** Add several at once, from the box grid's select mode. */
export async function addManyToPlan(recipeIds: string[]) {
  const user = await requireUser();
  const ids = [...new Set(recipeIds)].filter(isUuid);
  if (!ids.length) return { added: 0 };

  // Only recipes this household is actually allowed to see make it onto
  // their own list, whoever is asking.
  const visible = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(inArray(recipes.id, ids), visibleRecipe(user)));
  if (!visible.length) return { added: 0 };

  const inserted = await db
    .insert(mealPlanItems)
    .values(
      visible.map((r) => ({
        householdId: user.householdId,
        recipeId: r.id,
        addedBy: user.id,
      })),
    )
    .onConflictDoNothing()
    .returning({ recipeId: mealPlanItems.recipeId });

  touchPlan();
  return { added: inserted.length };
}

/** Something to buy that no recipe called for. */
export async function addGroceryExtra(text: string) {
  const user = await requireUser();
  const clean = text.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!clean) return;

  await db
    .insert(groceryExtras)
    .values({ householdId: user.householdId, text: clean, addedBy: user.id });

  touchPlan();
}

export async function setGroceryExtraChecked(id: string, checked: boolean) {
  const user = await requireUser();
  await db
    .update(groceryExtras)
    .set({ checked })
    .where(
      and(eq(groceryExtras.id, id), eq(groceryExtras.householdId, user.householdId)),
    );
  touchPlan();
}

export async function removeGroceryExtra(id: string) {
  const user = await requireUser();
  await db
    .delete(groceryExtras)
    .where(
      and(eq(groceryExtras.id, id), eq(groceryExtras.householdId, user.householdId)),
    );
  touchPlan();
}

/** Cross a combined ingredient line off, or back on. */
export async function setGroceryChecked(key: string, checked: boolean) {
  const user = await requireUser();
  if (checked) {
    await db
      .insert(groceryChecked)
      .values({ householdId: user.householdId, key })
      .onConflictDoNothing();
  } else {
    await db
      .delete(groceryChecked)
      .where(
        and(
          eq(groceryChecked.householdId, user.householdId),
          eq(groceryChecked.key, key),
        ),
      );
  }
  touchPlan();
}

/** Clear the week and start again: the plan, the checkmarks, and anything added by hand. */
export async function startNewWeek() {
  const user = await requireUser();
  await Promise.all([
    db.delete(mealPlanItems).where(eq(mealPlanItems.householdId, user.householdId)),
    db.delete(groceryExtras).where(eq(groceryExtras.householdId, user.householdId)),
    db.delete(groceryChecked).where(eq(groceryChecked.householdId, user.householdId)),
  ]);
  touchPlan();
}
