import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Ingredient, Instruction } from "@/lib/db/schema";
import { recipes, recipeImages, recipeTags } from "@/lib/db/schema";

export type RecipeCard = {
  id: string;
  title: string;
  category: string | null;
  status: "none" | "keeper" | "want_to_try" | "nope";
  servings: number | null;
  timesCooked: number;
  imageId: string | null;
  rotation: number;
};

export type BoxFilters = {
  status?: string;
  category?: string;
  tag?: string;
  q?: string;
};

export async function listRecipes(
  householdId: string,
  filters: BoxFilters = {},
): Promise<RecipeCard[]> {
  const where = [eq(recipes.householdId, householdId)];

  if (
    filters.status &&
    ["keeper", "want_to_try", "nope"].includes(filters.status)
  ) {
    where.push(eq(recipes.status, filters.status as "keeper"));
  }
  if (filters.category) where.push(eq(recipes.category, filters.category));

  if (filters.q) {
    const needle = `%${filters.q}%`;
    where.push(
      or(
        ilike(recipes.title, needle),
        ilike(recipes.description, needle),
        ilike(recipes.notes, needle),
        // Ingredients live in JSONB, so search their text form.
        sql`${recipes.ingredients}::text ILIKE ${needle}`,
      )!,
    );
  }

  if (filters.tag) {
    where.push(
      sql`EXISTS (SELECT 1 FROM ${recipeTags} WHERE ${recipeTags.recipeId} = ${recipes.id} AND ${recipeTags.tag} = ${filters.tag})`,
    );
  }

  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      category: recipes.category,
      status: recipes.status,
      servings: recipes.servings,
      timesCooked: recipes.timesCooked,
    })
    .from(recipes)
    .where(and(...where))
    .orderBy(desc(recipes.createdAt))
    .limit(300);

  if (rows.length === 0) return [];

  const firstImage = await firstImages(rows.map((r) => r.id));

  return rows.map((r) => ({
    ...r,
    imageId: firstImage.get(r.id)?.id ?? null,
    rotation: firstImage.get(r.id)?.rotation ?? 0,
  }));
}

/**
 * Cover image per recipe. One extra query rather than a lateral join, for
 * readability. The box is a few hundred recipes at most.
 */
async function firstImages(recipeIds: string[]) {
  const images = await db
    .select({
      id: recipeImages.id,
      recipeId: recipeImages.recipeId,
      rotation: recipeImages.rotation,
      sort: recipeImages.sort,
    })
    .from(recipeImages)
    .where(inArray(recipeImages.recipeId, recipeIds))
    .orderBy(recipeImages.sort);

  const first = new Map<string, { id: string; rotation: number }>();
  for (const img of images) {
    if (!first.has(img.recipeId)) {
      first.set(img.recipeId, { id: img.id, rotation: img.rotation });
    }
  }
  return first;
}

/* ------------------------------------------------------------------ *
 * Flip-through view: the box read as a book, a recipe to a page.
 * ------------------------------------------------------------------ */

export type BookOrder = "chapter" | "title" | "recent" | "loved" | "shuffle";

export const BOOK_ORDERS: { key: BookOrder; label: string }[] = [
  { key: "chapter", label: "By chapter" },
  { key: "title", label: "A to Z" },
  { key: "recent", label: "Newest" },
  { key: "loved", label: "Best loved" },
  { key: "shuffle", label: "Shuffle" },
];

export function toBookOrder(value: string | undefined): BookOrder {
  return BOOK_ORDERS.some((o) => o.key === value)
    ? (value as BookOrder)
    : "chapter";
}

export type BookRecipe = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  servings: number | null;
  servingsText: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
  notes: string | null;
  status: "none" | "keeper" | "want_to_try" | "nope";
  timesCooked: number;
  sourceName: string | null;
  imageId: string | null;
  rotation: number;
};

/** A leaf of the book: either a chapter divider or a recipe. */
export type BookLeaf =
  | { kind: "chapter"; key: string; name: string; count: number }
  | { kind: "recipe"; key: string; recipe: BookRecipe };

const UNFILED = "Odds and ends";

/** Chapter a recipe belongs to, or null when the ordering has no chapters. */
function chapterFor(recipe: BookRecipe, order: BookOrder): string | null {
  if (order === "chapter") return recipe.category?.trim() || UNFILED;
  if (order === "title") {
    const initial = recipe.title.trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(initial) ? initial : "#";
  }
  return null;
}

function orderBy(order: BookOrder) {
  const byTitle = sql`lower(${recipes.title})`;
  switch (order) {
    // Postgres sorts NULLs last on ASC, so uncategorised falls to the back.
    case "chapter":
      return [asc(recipes.category), byTitle];
    case "title":
      return [byTitle];
    case "recent":
      return [desc(recipes.createdAt)];
    case "loved":
      return [desc(recipes.timesCooked), byTitle];
    case "shuffle":
      return [sql`random()`];
  }
}

export async function listBookPages(
  householdId: string,
  order: BookOrder,
): Promise<BookLeaf[]> {
  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      category: recipes.category,
      servings: recipes.servings,
      servingsText: recipes.servingsText,
      prepMinutes: recipes.prepMinutes,
      cookMinutes: recipes.cookMinutes,
      ingredients: recipes.ingredients,
      instructions: recipes.instructions,
      notes: recipes.notes,
      status: recipes.status,
      timesCooked: recipes.timesCooked,
      sourceName: recipes.sourceName,
    })
    .from(recipes)
    .where(eq(recipes.householdId, householdId))
    .orderBy(...orderBy(order))
    .limit(300);

  if (rows.length === 0) return [];

  const firstImage = await firstImages(rows.map((r) => r.id));

  const list: BookRecipe[] = rows.map((r) => ({
    ...r,
    imageId: firstImage.get(r.id)?.id ?? null,
    rotation: firstImage.get(r.id)?.rotation ?? 0,
  }));

  // Count each chapter up front so its divider can say how much is inside.
  const counts = new Map<string, number>();
  for (const recipe of list) {
    const name = chapterFor(recipe, order);
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const pages: BookLeaf[] = [];
  let openChapter: string | null = null;

  for (const recipe of list) {
    const name = chapterFor(recipe, order);
    if (name && name !== openChapter) {
      openChapter = name;
      pages.push({
        kind: "chapter",
        key: `chapter-${name}`,
        name,
        count: counts.get(name) ?? 0,
      });
    }
    pages.push({ kind: "recipe", key: recipe.id, recipe });
  }

  return pages;
}

export async function listCategories(householdId: string) {
  const rows = await db
    .selectDistinct({ category: recipes.category })
    .from(recipes)
    .where(eq(recipes.householdId, householdId));
  return rows
    .map((r) => r.category)
    .filter((c): c is string => Boolean(c))
    .sort();
}
