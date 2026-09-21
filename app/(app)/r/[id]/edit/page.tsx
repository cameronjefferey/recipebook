import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeImages, recipeTags } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { listDividers } from "@/lib/books";
import { ingredientLines, instructionLines } from "@/lib/ingredients";
import { CorrectCard } from "@/components/correct-card";

export default async function EditRecipePage({
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

  const [images, tags, dividers] = await Promise.all([
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
    listDividers(user.householdId),
  ]);

  const original = images.find((image) => image.kind === "original") ?? images[0];

  return (
    <CorrectCard
      id={recipe.id}
      title={recipe.title}
      description={recipe.description ?? ""}
      category={recipe.category ?? ""}
      notes={recipe.notes ?? ""}
      sourceName={recipe.sourceName ?? ""}
      tags={tags.map((row) => row.tag).join(", ")}
      ingredientText={ingredientLines(recipe.ingredients)}
      instructionText={instructionLines(recipe.instructions)}
      names={dividers.names}
      books={dividers.books}
      image={
        original
          ? { url: `/api/images/${original.id}`, rotation: original.rotation }
          : null
      }
    />
  );
}
