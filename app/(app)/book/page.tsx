import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listShelf, type ShelfBook } from "@/lib/books";
import { NewBookForm } from "@/components/new-book-form";
import { Eyebrow } from "@/components/ui";

export default async function ShelfPage() {
  const user = await requireUser();
  const { smart, mine } = await listShelf(user.householdId);

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
                <BookCover book={book} />
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

function BookCover({ book }: { book: ShelfBook }) {
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

      {/* the spine, always pink, always down the left */}
      <span className="absolute inset-y-0 left-0 w-2.5 bg-pink" />

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
    </Link>
  );
}
