import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipeImages, recipes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { visibleRecipe } from "@/lib/access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });

  // Follows the recipe rather than the household: a shared book shows other
  // people's recipes, and a recipe without its photograph is half a recipe.
  const [image] = await db
    .select({ mime: recipeImages.mime, bytes: recipeImages.bytes })
    .from(recipeImages)
    .innerJoin(recipes, eq(recipes.id, recipeImages.recipeId))
    .where(and(eq(recipeImages.id, id), visibleRecipe(user)))
    .limit(1);

  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.mime,
      // Originals are never rewritten, so this can be cached hard. Private
      // because it is somebody's personal recipe box.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
