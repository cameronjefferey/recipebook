import { notFound } from "next/navigation";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeImages, recipeTags } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { booksForRecipe } from "@/lib/books";
import { RecipeView } from "@/components/recipe-view";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.householdId, user.householdId)))
    .limit(1);

  if (!recipe) notFound();

  const [images, tags, books] = await Promise.all([
    db
      .select({
        id: recipeImages.id,
        kind: recipeImages.kind,
        rotation: recipeImages.rotation,
      })
      .from(recipeImages)
      .where(eq(recipeImages.recipeId, id))
      .orderBy(asc(recipeImages.sort)),
    db
      .select({ tag: recipeTags.tag })
      .from(recipeTags)
      .where(eq(recipeTags.recipeId, id)),
    booksForRecipe(user.householdId, id),
  ]);

  return (
    <RecipeView
      recipe={{
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        servings: recipe.servings,
        servingsText: recipe.servingsText,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        notes: recipe.notes,
        status: recipe.status,
        sourceName: recipe.sourceName,
        sourceUrl: recipe.sourceUrl,
        timesCooked: recipe.timesCooked,
      }}
      images={images}
      tags={tags.map((t) => t.tag)}
      books={books}
    />
  );
}
