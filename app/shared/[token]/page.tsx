import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BOOK_ORDERS, toBookOrder } from "@/lib/books";
import { listSharedPages, recordView, resolveShare } from "@/lib/sharing";
import { getCurrentUser } from "@/lib/auth";
import { acceptShare } from "@/lib/actions/shares";
import { BookClient } from "@/components/book-client";

/**
 * A shared book is reachable by anyone holding the link, so it must never turn
 * up in a search result. The recipes are somebody's own.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  // The token is in the URL, so it must not ride along in a Referer header.
  referrer: "no-referrer",
};

export default async function SharedBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ by?: string }>;
}) {
  const { token } = await params;
  const { by } = await searchParams;
  const order = toBookOrder(by);

  const share = await resolveShare(token);
  if (!share) notFound();

  // Somebody with an account should not have to keep the email to come back to
  // this, so it can be put on their own shelf instead.
  const user = await getCurrentUser();
  const canKeep = !!user && user.householdId !== share.ownerHouseholdId;

  const pages = await listSharedPages(share.bookId, order);

  return (
    <div className="flex h-dvh flex-col">
      <header className="pt-safe shrink-0 bg-pink px-5 py-3 text-page">
        <p className="font-display truncate text-xl leading-none">
          {share.bookName}
        </p>
        <p className="mt-1 truncate text-[0.8rem] opacity-90">
          shared with {share.recipientName} from {share.householdName}
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col px-4 py-4">
        {pages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-display text-2xl text-pink">
              Nothing in here yet
            </p>
            <p className="hand mt-2 text-browned">
              this book has not been filled in
            </p>
          </div>
        ) : (
          <BookClient
            basePath={`/shared/${token}`}
            imageBase={`/api/shared/${token}/images`}
            showActions={false}
            pages={pages}
            initialIndex={0}
            orders={BOOK_ORDERS.map(({ key, label }) => ({
              key,
              label,
              active: key === order,
            }))}
          />
        )}
      </main>

      <footer className="pb-safe shrink-0 px-5 pb-3 text-center">
        {canKeep ? (
          <KeepOnMyShelf token={token} />
        ) : (
          <p className="text-[0.75rem] text-muted">
            The Pink Recipe Box · you are reading a shared book
          </p>
        )}
      </footer>

      {/* Suspended so the book is not held up by a bookkeeping write. */}
      <Suspense fallback={null}>
        <RecordVisit shareId={share.shareId} lastViewedAt={share.lastViewedAt} />
      </Suspense>
    </div>
  );
}

/** A plain form, so it works before any JavaScript has arrived. */
function KeepOnMyShelf({ token }: { token: string }) {
  return (
    <form action={acceptShare.bind(null, token)}>
      <button
        type="submit"
        className="tap inline-flex items-center justify-center rounded-full bg-pink px-6 text-[0.9rem] font-bold text-page"
      >
        Keep this on my shelf
      </button>
    </form>
  );
}

async function RecordVisit({
  shareId,
  lastViewedAt,
}: {
  shareId: string;
  lastViewedAt: Date | null;
}) {
  await recordView(shareId, lastViewedAt);
  return null;
}
