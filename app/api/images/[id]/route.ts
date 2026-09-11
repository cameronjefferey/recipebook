import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipeImages } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });

  const [image] = await db
    .select()
    .from(recipeImages)
    .where(
      and(eq(recipeImages.id, id), eq(recipeImages.householdId, user.householdId)),
    )
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
