import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { visibleRecipe } from "@/lib/access";
import { isUuid } from "@/lib/ids";
import { loadComponents, withComponents } from "@/lib/component-recipes";
import { CookMode } from "@/components/cook-mode";

const SCALES = [0.5, 1, 2, 3] as const;

export default async function CookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ x?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { x } = await searchParams;
  const initialFactor = SCALES.find((scale) => String(scale) === x) ?? 1;
  if (!isUuid(id)) notFound();

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), visibleRecipe(user)))
    .limit(1);

  if (!recipe) notFound();

  // Cooking this means cooking its parts, and their steps come first.
  const { ingredients, instructions } = withComponents(
    recipe,
    await loadComponents(user, recipe.householdId, recipe.ingredients),
  );

  return (
    <CookMode
      id={recipe.id}
      title={recipe.title}
      servings={recipe.servings}
      ingredients={ingredients}
      instructions={instructions}
      initialFactor={initialFactor}
    />
  );
}
