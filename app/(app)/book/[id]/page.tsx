import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  BOOK_ORDERS,
  listBookPages,
  resolveBook,
  toBookOrder,
} from "@/lib/books";
import { BookClient } from "@/components/book-client";
import { BookMenu } from "@/components/book-menu";
import { ChevronLeft } from "@/components/icons";
import { ButtonLink } from "@/components/ui";

export default async function OpenBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ by?: string; at?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { by, at } = await searchParams;

  const book = await resolveBook(user.householdId, id);
  if (!book) notFound();

  const order = toBookOrder(by);
  const pages = await listBookPages(user.householdId, book.id, order);

  const openAt = at
    ? pages.findIndex((p) => p.kind === "recipe" && p.recipe.id === at)
    : -1;

  return (
    // `main` is already exactly the leftover screen, so the book just fills it
    // and the pager takes what the title, pills and buttons do not want.
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="relative flex items-center gap-1">
        <Link
          href="/book"
          aria-label="Back to the shelf"
          className="tap -ml-3 flex items-center justify-center text-pink"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="font-display min-w-0 flex-1 truncate text-xl">
          {book.name}
        </h1>
        {book.smart ? null : (
          <>
            <Link
              href={`/book/${book.id}/share`}
              className="tap flex items-center justify-center px-2 text-[0.85rem] font-bold text-browned"
            >
              Share
            </Link>
            <BookMenu bookId={book.id} name={book.name} />
          </>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-display text-2xl text-pink">This book is empty</p>
          <p className="hand mt-2 text-browned">
            open a recipe and file it in here
          </p>
          <ButtonLink href="/box" variant="secondary" className="mt-6">
            Go to the box
          </ButtonLink>
        </div>
      ) : (
        <BookClient
          basePath={`/book/${book.id}`}
          pages={pages}
          initialIndex={openAt > 0 ? openAt : 0}
          orders={BOOK_ORDERS.map(({ key, label }) => ({
            key,
            label,
            active: order === key,
          }))}
        />
      )}
    </div>
  );
}
