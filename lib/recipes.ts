import "server-only";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
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

  // One extra query rather than a lateral join, for readability. The box is a
  // few hundred recipes at most.
  const images = await db
    .select({
      id: recipeImages.id,
      recipeId: recipeImages.recipeId,
      rotation: recipeImages.rotation,
      sort: recipeImages.sort,
    })
    .from(recipeImages)
    .where(
      inArray(
        recipeImages.recipeId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(recipeImages.sort);

  const firstImage = new Map<string, { id: string; rotation: number }>();
  for (const img of images) {
    if (!firstImage.has(img.recipeId)) {
      firstImage.set(img.recipeId, { id: img.id, rotation: img.rotation });
    }
  }

  return rows.map((r) => ({
    ...r,
    imageId: firstImage.get(r.id)?.id ?? null,
    rotation: firstImage.get(r.id)?.rotation ?? 0,
  }));
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
