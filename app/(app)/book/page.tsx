import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listShelf, type ShelfBook, type SharedShelfBook } from "@/lib/books";
import { shareCounts } from "@/lib/sharing";
import { planCount } from "@/lib/grocery";
import { NewBookForm } from "@/components/new-book-form";
import { ShareIcon, CartIcon, ChevronRight } from "@/components/icons";
import { Eyebrow } from "@/components/ui";

export default async function ShelfPage() {
  const user = await requireUser();
  const [{ smart, mine, shared }, sharedOut, planned] = await Promise.all([
    listShelf(user),
    shareCounts(user.householdId),
    planCount(user.householdId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">The shelf</h1>
        <p className="hand mt-1">pick a book and start flipping</p>
      </div>

      <Link
        href="/plan"
        className="flex items-center justify-between rounded-card border border-pink-mid bg-pink-soft px-4 py-3 text-pink active:brightness-95"
      >
        <span className="flex items-center gap-2 font-bold">
          <CartIcon className="h-5 w-5" />
          {planned > 0
            ? `${planned} cooking this week`
            : "Plan what you're cooking this week"}
        </span>
        <ChevronRight className="h-5 w-5" />
      </Link>

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
                <BookCover book={book} sharedWith={sharedOut.get(book.id) ?? 0} />
              </li>
            ))}
          </ul>
        )}
        <NewBookForm />
      </section>

      {shared.length > 0 ? (
        <section className="space-y-3">
          <Eyebrow>Shared with you</Eyebrow>
          <ul className="grid grid-cols-2 gap-3">
            {shared.map((book) => (
              <li key={book.id}>
                <BookCover book={book} from={book.ownerName} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
  from,
}: {
  book: ShelfBook | SharedShelfBook;
  /** how many people this household has given it to */
  sharedWith?: number;
  /** whose book it is, when it is not ours */
  from?: string;
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
        {from ? (
          <p className="hand mt-0.5 truncate text-[0.8rem] text-browned">
            from {from}
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
