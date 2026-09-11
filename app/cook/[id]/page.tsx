import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { CookMode } from "@/components/cook-mode";

export default async function CookPage({
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

  return (
    <CookMode
      id={recipe.id}
      title={recipe.title}
      servings={recipe.servings}
      ingredients={recipe.ingredients}
      instructions={recipe.instructions}
    />
  );
}
