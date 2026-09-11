import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { captures } from "@/lib/db/schema";
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

  const [capture] = await db
    .select({
      mime: captures.mime,
      bytes: captures.bytes,
    })
    .from(captures)
    .where(and(eq(captures.id, id), eq(captures.householdId, user.householdId)))
    .limit(1);

  if (!capture) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(capture.bytes), {
    headers: {
      "Content-Type": capture.mime,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
