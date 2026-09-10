import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { captures } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { transcribePage } from "@/lib/ai/transcribe";

/**
 * Runs the transcription inline. There is no queue on the free plan, so the
 * client awaits this call, but status lives in the database so closing the app
 * mid-transcription leaves a resumable capture rather than a lost one.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const [capture] = await db
    .select()
    .from(captures)
    .where(and(eq(captures.id, id), eq(captures.householdId, user.householdId)))
    .limit(1);

  if (!capture) return new Response("Not found", { status: 404 });

  if (capture.status === "ready") {
    return Response.json({ status: "ready", result: capture.result });
  }

  await db
    .update(captures)
    .set({ status: "transcribing", error: null })
    .where(eq(captures.id, id));

  try {
    const result = await transcribePage({
      mime: capture.mime,
      bytes: capture.bytes,
    });

    await db
      .update(captures)
      .set({ status: "ready", result, rotation: result.rotation, error: null })
      .where(eq(captures.id, id));

    return Response.json({ status: "ready", result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not read that photo.";
    await db
      .update(captures)
      .set({ status: "failed", error: message })
      .where(eq(captures.id, id));

    return Response.json({ status: "failed", error: message }, { status: 500 });
  }
}
