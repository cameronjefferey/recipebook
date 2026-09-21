import { requireUser } from "@/lib/auth";
import { listShelf, type ShelfBook, type SharedShelfBook } from "@/lib/books";
import { shareCounts } from "@/lib/sharing";
import { NewBookForm } from "@/components/new-book-form";
import { BoxCard } from "@/components/box-card";
import { BoxSearch } from "@/components/box-search";
import { Eyebrow } from "@/components/ui";
import Link from "next/link";

export default async function BoxPage() {
  const user = await requireUser();
  const [{ smart, mine, shared }, sharedOut] = await Promise.all([
    listShelf(user),
    shareCounts(user.householdId),
  ]);

  // Stars pin the tins you made (or were given). The standing views are
  // always one tap from the top, so they do not also live as tins.
  const favorites = [
    ...mine.filter((b) => b.favorite),
    ...shared.filter((b) => b.favorite),
  ];
  const restMine = mine.filter((b) => !b.favorite);
  const restShared = shared.filter((b) => !b.favorite);

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <section className="space-y-2">
          <p className="hand">flip through a pile</p>
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            {smart.map((book) => (
              <li key={book.id}>
                <Link
                  href={`/box/${book.id}`}
                  aria-label={`Open ${book.name}`}
                  className="tap flex h-full min-h-12 flex-col justify-center rounded-[3px] border border-line border-l-4 border-l-pink bg-card px-3 py-2 shadow-[0_1px_2px_#382a2210]"
                >
                  <h3 className="font-display text-[1.3rem] leading-none text-ink">
                    {book.name}
                  </h3>
                  <p className="mt-1 text-[0.78rem] leading-snug text-muted">
                    {book.count} {book.count === 1 ? "recipe" : "recipes"}
                    {book.blurb ? ` · ${book.blurb}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <BoxSearch action="/box/all" />
      </div>

      {favorites.length > 0 ? (
        <section className="space-y-3">
          <Eyebrow>Favorites</Eyebrow>
          <TinGrid books={favorites} sharedOut={sharedOut} />
        </section>
      ) : null}

      <section className="space-y-3">
        <Eyebrow>Your boxes</Eyebrow>
        {restMine.length > 0 ? (
          <TinGrid books={restMine} sharedOut={sharedOut} />
        ) : mine.length === 0 ? (
          <p className="text-[0.95rem] text-muted">
            Name a box if you want a divider of your own.
          </p>
        ) : null}
        <NewBookForm />
      </section>

      {restShared.length > 0 ? (
        <section className="space-y-3">
          <Eyebrow>Shared with you</Eyebrow>
          <TinGrid books={restShared} />
        </section>
      ) : null}
    </div>
  );
}

function TinGrid({
  books,
  sharedOut,
}: {
  books: (ShelfBook | SharedShelfBook)[];
  sharedOut?: Map<string, number>;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {books.map((book) => (
        <li key={book.id}>
          <BoxCard
            book={book}
            sharedWith={sharedOut?.get(book.id) ?? 0}
            from={"ownerName" in book ? book.ownerName : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
