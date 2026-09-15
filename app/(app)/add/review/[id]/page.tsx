import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { captures } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { parsedPageSchema } from "@/lib/ai/schema";
import { ReviewClient } from "@/components/review-client";
import { BackLink } from "@/components/ui";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [capture] = await db
    .select()
    .from(captures)
    .where(and(eq(captures.id, id), eq(captures.householdId, user.householdId)))
    .limit(1);

  if (!capture) notFound();

  const parsed = parsedPageSchema.safeParse(capture.result);
  if (!parsed.success) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <BackLink href="/add" label="Back to Add" />
          <h1 className="font-display text-2xl">Still working on this one</h1>
        </div>
        <p className="text-muted">
          {capture.error ??
            "This photo has not finished being read yet. Try again from the Add screen."}
        </p>
      </div>
    );
  }

  return (
    <ReviewClient
      captureId={capture.id}
      page={parsed.data}
      imageUrl={`/api/captures/${capture.id}/image`}
    />
  );
}
