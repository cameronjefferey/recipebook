import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BOOK_ORDERS, toBookOrder } from "@/lib/books";
import { listSharedPages, recordView, resolveShare } from "@/lib/sharing";
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
        <p className="text-[0.75rem] text-muted">
          The Pink Recipe Box · you are reading a shared book
        </p>
      </footer>

      {/* Suspended so the book is not held up by a bookkeeping write. */}
      <Suspense fallback={null}>
        <RecordVisit shareId={share.shareId} lastViewedAt={share.lastViewedAt} />
      </Suspense>
    </div>
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
