import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listShelf, type ShelfBook } from "@/lib/books";
import { shareCounts } from "@/lib/sharing";
import { NewBookForm } from "@/components/new-book-form";
import { ShareIcon } from "@/components/icons";
import { Eyebrow } from "@/components/ui";

export default async function ShelfPage() {
  const user = await requireUser();
  const [{ smart, mine }, shared] = await Promise.all([
    listShelf(user.householdId),
    shareCounts(user.householdId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">The shelf</h1>
        <p className="hand mt-1">pick a book and start flipping</p>
      </div>

      <section className="space-y-3">
        <Eyebrow>Your books</Eyebrow>
        {mine.length === 0 ? (
          <p className="text-[0.95rem] text-muted">
            No books yet. Make one below, then file recipes into it from the
            recipe itself.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {mine.map((book) => (
              <li key={book.id}>
                <BookCover book={book} sharedWith={shared.get(book.id) ?? 0} />
              </li>
            ))}
          </ul>
        )}
        <NewBookForm />
      </section>

      <section className="space-y-3">
        <Eyebrow>Always here</Eyebrow>
        <ul className="grid grid-cols-2 gap-3">
          {smart.map((book) => (
            <li key={book.id}>
              <BookCover book={book} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function BookCover({
  book,
  sharedWith = 0,
}: {
  book: ShelfBook;
  sharedWith?: number;
}) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="relative block aspect-3/4 overflow-hidden rounded-l-sm rounded-r-card border border-line bg-sink shadow-[0_1px_3px_#382a2214] active:brightness-[0.98]"
    >
      {book.coverId ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/api/images/${book.coverId}`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          style={{ rotate: `${book.rotation}deg` }}
        />
      ) : null}

      <div className="relative flex h-full flex-col justify-end bg-gradient-to-t from-card via-card/90 to-transparent p-3 pl-5">
        <h3 className="font-display text-[1.05rem] leading-tight">
          {book.name}
        </h3>
        <p className="mt-0.5 text-[0.75rem] text-muted">
          {book.blurb ?? `${book.count} ${book.count === 1 ? "recipe" : "recipes"}`}
        </p>
        {book.blurb ? (
          <p className="text-[0.75rem] text-muted">
            {book.count} {book.count === 1 ? "recipe" : "recipes"}
          </p>
        ) : null}
      </div>

      {sharedWith > 0 ? (
        <span
          title={`Shared with ${sharedWith} ${sharedWith === 1 ? "person" : "people"}`}
          className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[0.7rem] font-bold text-browned"
        >
          <ShareIcon className="h-3 w-3" />
          {sharedWith}
        </span>
      ) : null}

      {/* Last, so it paints over the gradient and runs the full height. */}
      <span className="absolute inset-y-0 left-0 w-2.5 bg-pink" />
    </Link>
  );
}
