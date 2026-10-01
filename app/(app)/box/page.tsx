import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listBookPages, listShelf } from "@/lib/books";
import { NewBookForm } from "@/components/new-book-form";
import { BoxSearch } from "@/components/box-search";
import { FavoriteStar } from "@/components/favorite-star";

export default async function BoxPage() {
  const user = await requireUser();
  const [{ smart, mine, shared }, pages] = await Promise.all([
    listShelf(user),
    listBookPages(user.householdId, "all", "title"),
  ]);
  const front = pages.find((page) => page.kind === "recipe");
  const everything = smart.find((book) => book.id === "all");

  // Favorites sit first among the dividers you named. The standing views
  // stay a row of tabs, not a second shelf of tins.
  const named = [
    ...mine.filter((b) => b.favorite),
    ...shared.filter((b) => b.favorite),
    ...mine.filter((b) => !b.favorite),
    ...shared.filter((b) => !b.favorite),
  ];

  return (
    <div className="mx-auto flex w-full max-w-[40rem] flex-col items-center">
      <div className="no-scrollbar flex w-full gap-2 overflow-x-auto pb-1">
        {smart.map((book) => (
          <Link
            key={book.id}
            href={`/box/${book.id}`}
            className={`divider-tab ${book.id === "all" ? "divider-on" : ""}`}
            aria-current={book.id === "all" ? "page" : undefined}
          >
            {book.name}
          </Link>
        ))}
      </div>

      <article className="reading-card mt-0">
        {front && front.kind === "recipe" ? (
          <>
            {front.recipe.status === "keeper" ? <span className="keeper-mark">keeper</span> : null}
            <h2 className="font-display text-[1.7rem] leading-tight">{front.recipe.title}</h2>
            <div className="ruled-lines mt-2">
              {front.recipe.description ? <p className="text-muted">{front.recipe.description}</p> : null}
              <p>
                {front.recipe.servingsText ??
                  (front.recipe.servings ? `Serves ${front.recipe.servings}` : "A card from the box")}
              </p>
              <p className="text-muted">
                {everything
                  ? `${everything.count} ${everything.count === 1 ? "card" : "cards"} in the whole box`
                  : null}
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-[1.7rem] leading-tight">The box is empty</h2>
            <p className="hand mt-3">start with a card from the kitchen drawer</p>
          </>
        )}
        <div className="margin-row">
          {front && front.kind === "recipe" ? (
            <Link href={`/r/${front.recipe.id}`} className="tap margin-word">
              open
            </Link>
          ) : (
            <Link href="/add" className="tap margin-word">
              add a card
            </Link>
          )}
          <Link href="/box/all" className="tap margin-word">
            next card
          </Link>
        </div>
      </article>

      <div className="mt-8 w-full">
        <p className="hand">your dividers</p>
        {named.length > 0 ? (
          <ul className="mt-1 flex flex-wrap items-end gap-2">
            {named.map((book) => (
              <li key={book.id} className="flex items-end">
                <Link href={`/box/${book.id}`} className="divider-tab">
                  {book.name}
                </Link>
                <FavoriteStar bookId={book.id} name={book.name} favorite={book.favorite} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-muted">Name a box if you want a divider of your own.</p>
        )}
        {shared.length > 0 ? (
          <p className="hand mt-2">
            shared: {shared.map((b) => `${b.name} from ${b.ownerName}`).join(", ")}
          </p>
        ) : null}
        <div className="mt-2">
          <NewBookForm />
        </div>
        <div className="mt-4">
          <BoxSearch action="/box/all" />
        </div>
      </div>
    </div>
  );
}
