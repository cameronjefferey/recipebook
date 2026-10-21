import "server-only";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookRecipes, recipes, recipeImages, recipeTags } from "@/lib/db/schema";
import { visibleRecipe } from "@/lib/access";
import type { CurrentUser } from "@/lib/auth";

/**
 * One card on the wall of the open box. Carries enough to draw it, file it
 * under a divider, and find it by typing, so the whole box can be narrowed on
 * the device without going back to the server for every keystroke.
 */
export type WallCard = {
  id: string;
  title: string;
  category: string | null;
  status: "none" | "keeper" | "want_to_try" | "nope";
  timesCooked: number;
  createdAt: string;
  imageId: string | null;
  rotation: number;
  /** whose it is: false for a recipe met through a shared box */
  mine: boolean;
  /** boxes (books) this card is filed in */
  bookIds: string[];
  /** lower-cased words worth matching: title, category, ingredients, source, tags */
  haystack: string;
};

/**
 * Every recipe this person may read, with its box memberships. A household
 * has a few hundred recipes at most, so sending them all once and narrowing on
 * the device is cheaper, and feels faster, than a round trip per tap.
 */
export async function listWall(user: CurrentUser): Promise<WallCard[]> {
  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      category: recipes.category,
      status: recipes.status,
      timesCooked: recipes.timesCooked,
      createdAt: recipes.createdAt,
      householdId: recipes.householdId,
      ingredients: recipes.ingredients,
      sourceName: recipes.sourceName,
    })
    .from(recipes)
    .where(visibleRecipe(user))
    .orderBy(sql`lower(${recipes.title})`)
    .limit(600);

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [covers, memberships, tags] = await Promise.all([
    firstImages(ids),
    db
      .select({ bookId: bookRecipes.bookId, recipeId: bookRecipes.recipeId })
      .from(bookRecipes)
      .where(inArray(bookRecipes.recipeId, ids)),
    db
      .select({ recipeId: recipeTags.recipeId, tag: recipeTags.tag })
      .from(recipeTags)
      .where(inArray(recipeTags.recipeId, ids)),
  ]);

  const booksOf = new Map<string, string[]>();
  for (const m of memberships) {
    if (!booksOf.has(m.recipeId)) booksOf.set(m.recipeId, []);
    booksOf.get(m.recipeId)!.push(m.bookId);
  }
  const tagsOf = new Map<string, string[]>();
  for (const t of tags) {
    if (!tagsOf.has(t.recipeId)) tagsOf.set(t.recipeId, []);
    tagsOf.get(t.recipeId)!.push(t.tag);
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    timesCooked: r.timesCooked,
    createdAt: r.createdAt.toISOString(),
    imageId: covers.get(r.id)?.id ?? null,
    rotation: covers.get(r.id)?.rotation ?? 0,
    mine: r.householdId === user.householdId,
    bookIds: booksOf.get(r.id) ?? [],
    haystack: [
      r.title,
      r.category,
      r.sourceName,
      ...(tagsOf.get(r.id) ?? []),
      ...r.ingredients.map((i) => i.item),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));
}

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
export async function firstImages(recipeIds: string[]) {
  if (recipeIds.length === 0) {
    return new Map<string, { id: string; rotation: number }>();
  }
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
