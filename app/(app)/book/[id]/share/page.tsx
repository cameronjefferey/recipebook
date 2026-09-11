import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isSmartBook, resolveBook } from "@/lib/books";
import { listShares } from "@/lib/sharing";
import { ShareManager } from "@/components/share-manager";
import { ChevronLeft } from "@/components/icons";

export default async function ShareBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  // The standing books describe themselves from the whole collection, so there
  // is no fixed thing to hand over. Sharing is for books you made.
  if (isSmartBook(id)) notFound();

  const book = await resolveBook(user, id);
  // Only the household that owns a book may hand it on; a book shared with you
  // is not yours to pass around.
  if (!book || book.smart || !book.canManage) notFound();

  const shares = await listShares(user.householdId, book.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1">
        <Link
          href={`/book/${book.id}`}
          aria-label="Back to the book"
          className="tap -ml-3 flex items-center justify-center text-pink"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="font-display min-w-0 flex-1 truncate text-xl">
          Share {book.name}
        </h1>
      </div>

      <p className="text-[0.95rem] text-muted">
        Everyone gets a link of their own. They can read this one book and
        nothing else, they cannot change anything, and they do not need an
        account.
      </p>

      <ShareManager bookId={book.id} bookName={book.name} shares={shares} />
    </div>
  );
}
