import Link from "next/link";
import { desc, eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { captures } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { CaptureClient } from "@/components/capture-client";
import { Card } from "@/components/ui";

export default async function AddPage() {
  const user = await requireUser();

  // Photos taken earlier that were never turned into recipes.
  const waiting = await db
    .select({
      id: captures.id,
      status: captures.status,
      createdAt: captures.createdAt,
    })
    .from(captures)
    .where(
      and(
        eq(captures.householdId, user.householdId),
        inArray(captures.status, ["ready", "failed", "pending"]),
      ),
    )
    .orderBy(desc(captures.createdAt))
    .limit(20);

  return (
    <div className="space-y-6">
      <p className="hand">a photo, a link, or write it down</p>

      <CaptureClient />

      {waiting.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-display text-xl">Waiting for you</h2>
          <p className="text-[0.9rem] text-muted">
            Photos you took earlier that are not in the box yet.
          </p>
          {waiting.map((capture) => (
            <Card key={capture.id} className="flex items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/captures/${capture.id}/image`}
                alt=""
                className="h-14 w-14 shrink-0 rounded-[3px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[0.95rem] font-bold">
                  {capture.status === "ready"
                    ? "Ready to check"
                    : capture.status === "failed"
                      ? "Could not be read"
                      : "Not read yet"}
                </p>
                <p className="text-[0.85rem] text-muted">
                  {capture.createdAt.toLocaleDateString()}
                </p>
              </div>
              {capture.status === "ready" ? (
                <Link
                  href={`/add/review/${capture.id}`}
                  className="tap inline-flex items-center rounded-full bg-pink px-4 text-[0.9rem] font-bold text-page"
                >
                  Review
                </Link>
              ) : null}
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}
