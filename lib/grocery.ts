import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  recipes,
  mealPlanItems,
  groceryExtras,
  groceryChecked,
  type Ingredient,
} from "@/lib/db/schema";
import { visibleRecipe } from "@/lib/access";
import { loadComponents, withComponents } from "@/lib/component-recipes";
import { formatIngredient } from "@/lib/ingredients";
import { groceryAisle, groceryAisleFromText, type GroceryAisle } from "@/lib/grocery-aisle";
import { firstImages } from "@/lib/recipes";
import type { CurrentUser } from "@/lib/auth";

/* ------------------------------------------------------------------ *
 * Meal planning: one running "this week" list per household, and the
 * grocery list it implies. Nothing here is a calendar — there are no
 * days, just a set of recipes and whether each is on the list.
 * ------------------------------------------------------------------ */

export type PlannedRecipe = {
  id: string;
  title: string;
  category: string | null;
  servings: number | null;
  imageId: string | null;
  rotation: number;
};

export type GroceryLine = {
  /** stable across reloads, so a checkmark survives them */
  key: string;
  text: string;
  /** which planned recipes contributed to this line, when more than one did */
  from: string[];
  checked: boolean;
  aisle: GroceryAisle;
};

export type ExtraItem = {
  id: string;
  text: string;
  checked: boolean;
  aisle: GroceryAisle;
};

/** How many recipes are marked for this week, for a badge on the shelf. */
export async function planCount(householdId: string) {
  const rows = await db
    .select({ recipeId: mealPlanItems.recipeId })
    .from(mealPlanItems)
    .where(eq(mealPlanItems.householdId, householdId));
  return rows.length;
}

/** Recipe ids on this household's "cooking this week" list. */
export async function plannedRecipeIds(householdId: string) {
  const rows = await db
    .select({ recipeId: mealPlanItems.recipeId })
    .from(mealPlanItems)
    .where(eq(mealPlanItems.householdId, householdId));
  return rows.map((row) => row.recipeId);
}

export async function isPlanned(user: CurrentUser, recipeId: string) {
  const [row] = await db
    .select({ recipeId: mealPlanItems.recipeId })
    .from(mealPlanItems)
    .where(
      and(
        eq(mealPlanItems.householdId, user.householdId),
        eq(mealPlanItems.recipeId, recipeId),
      ),
    )
    .limit(1);
  return !!row;
}

function normalise(text: string) {
  return text.trim().toLowerCase();
}

function itemKey(ing: Ingredient) {
  return `${normalise(ing.item)}|${normalise(ing.unit ?? "")}`;
}

function dedupe(values: string[]) {
  return [...new Set(values)].sort();
}

/**
 * One line per distinct thing to buy. Two recipes both calling for "2 cloves
 * garlic" become one line reading "4 cloves garlic." Anything that cannot be
 * added up cleanly — a range like "6-7 tablespoons," no quantity at all, a
 * different unit — keeps its own line rather than being guessed at, though an
 * exact repeat ("cotija cheese, for topping" twice) still collapses into one.
 */
export function combineIngredients(
  entries: { ingredient: Ingredient; recipeTitle: string }[],
): Omit<GroceryLine, "checked">[] {
  const groups = new Map<
    string,
    { ingredient: Ingredient; recipeTitle: string }[]
  >();
  for (const entry of entries) {
    const key = itemKey(entry.ingredient);
    const list = groups.get(key);
    if (list) list.push(entry);
    else groups.set(key, [entry]);
  }

  const lines: Omit<GroceryLine, "checked">[] = [];

  for (const [key, group] of groups) {
    const summable = group.every(
      (e) => e.ingredient.quantity != null && e.ingredient.quantityMax == null,
    );

    if (summable) {
      const total = group.reduce((sum, e) => sum + (e.ingredient.quantity ?? 0), 0);
      const notes = new Set(group.map((e) => e.ingredient.note ?? ""));
      const merged: Ingredient = {
        quantity: total,
        unit: group[0].ingredient.unit,
        item: group[0].ingredient.item,
        note: notes.size === 1 ? group[0].ingredient.note ?? null : null,
      };
      lines.push({
        key: `sum:${key}`,
        text: formatIngredient(merged),
        from: dedupe(group.map((e) => e.recipeTitle)),
        aisle: groceryAisle(merged.item, merged.unit),
      });
      continue;
    }

    // Not summable as a group — but two recipes asking for the exact same
    // unquantified thing ("salt and pepper," twice) still collapse into one.
    const byText = new Map<
      string,
      { ingredient: Ingredient; recipeTitle: string }[]
    >();
    for (const entry of group) {
      const text = formatIngredient(entry.ingredient);
      const list = byText.get(text);
      if (list) list.push(entry);
      else byText.set(text, [entry]);
    }
    for (const [text, dupes] of byText) {
      lines.push({
        key: `line:${key}:${text}`,
        text,
        from: dedupe(dupes.map((e) => e.recipeTitle)),
        aisle: groceryAisle(dupes[0].ingredient.item, dupes[0].ingredient.unit),
      });
    }
  }

  return lines.sort((a, b) => a.text.localeCompare(b.text));
}

/** Recipes marked for this week, and the grocery list they add up to. */
export async function loadPlan(user: CurrentUser) {
  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      householdId: recipes.householdId,
      category: recipes.category,
      servings: recipes.servings,
      ingredients: recipes.ingredients,
      instructions: recipes.instructions,
    })
    .from(mealPlanItems)
    .innerJoin(recipes, eq(recipes.id, mealPlanItems.recipeId))
    .where(
      and(
        eq(mealPlanItems.householdId, user.householdId),
        // A book's access can be taken back after it was planned from; this
        // is what keeps a recipe you can no longer see off your own list.
        visibleRecipe(user),
      ),
    )
    .orderBy(asc(mealPlanItems.addedAt));

  const [covers, entryGroups, extrasRows, checkedRows] = await Promise.all([
    firstImages(rows.map((r) => r.id)),
    Promise.all(
      rows.map(async (recipe) => {
        // Ingredients that are themselves recipes are flattened to what they
        // are actually made of — you shop for corn and cotija, not for a
        // pointer to another recipe.
        const componentsByUrl = await loadComponents(
          user,
          recipe.householdId,
          recipe.ingredients,
        );
        const { ingredients } = withComponents(recipe, componentsByUrl);
        return ingredients
          .filter((ing) => !ing.component && ing.item.trim())
          .map((ingredient) => ({ ingredient, recipeTitle: recipe.title }));
      }),
    ),
    db
      .select()
      .from(groceryExtras)
      .where(eq(groceryExtras.householdId, user.householdId))
      .orderBy(asc(groceryExtras.createdAt)),
    db
      .select({ key: groceryChecked.key })
      .from(groceryChecked)
      .where(eq(groceryChecked.householdId, user.householdId)),
  ]);

  const checkedKeys = new Set(checkedRows.map((r) => r.key));

  return {
    planned: rows.map((r): PlannedRecipe => ({
      id: r.id,
      title: r.title,
      category: r.category,
      servings: r.servings,
      imageId: covers.get(r.id)?.id ?? null,
      rotation: covers.get(r.id)?.rotation ?? 0,
    })),
    groceryLines: combineIngredients(entryGroups.flat()).map(
      (line): GroceryLine => ({ ...line, checked: checkedKeys.has(line.key) }),
    ),
    extras: extrasRows.map((e): ExtraItem => ({
      id: e.id,
      text: e.text,
      checked: e.checked,
      aisle: groceryAisleFromText(e.text),
    })),
  };
}
