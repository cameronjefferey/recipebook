import { desc, eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { captures } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";

const ACCEPTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/** Photos are downscaled in the browser; this is a backstop against a stray upload. */
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (!ACCEPTED.has(file.type)) {
    return Response.json(
      { error: "Please use a photo or a PDF." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "That file is too large." }, { status: 413 });
  }

  const width = Number(form.get("width")) || null;
  const height = Number(form.get("height")) || null;

  const [row] = await db
    .insert(captures)
    .values({
      householdId: user.householdId,
      userId: user.id,
      mime: file.type,
      bytes: Buffer.from(await file.arrayBuffer()),
      width,
      height,
    })
    .returning({ id: captures.id });

  return Response.json({ id: row.id });
}

/** The review queue: everything photographed but not yet turned into recipes. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const rows = await db
    .select({
      id: captures.id,
      status: captures.status,
      error: captures.error,
      createdAt: captures.createdAt,
    })
    .from(captures)
    .where(
      and(
        eq(captures.householdId, user.householdId),
        ne(captures.status, "discarded"),
      ),
    )
    .orderBy(desc(captures.createdAt))
    .limit(50);

  return Response.json({ captures: rows });
}
