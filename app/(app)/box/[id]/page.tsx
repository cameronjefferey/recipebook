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
import { BoxSearch } from "@/components/box-search";
import { FavoriteStar } from "@/components/favorite-star";
import { BackLink, ButtonLink } from "@/components/ui";
import { plannedRecipeIds } from "@/lib/grocery";

export default async function OpenBoxPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ by?: string; at?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { by, at, q } = await searchParams;

  const book = await resolveBook(user, id);
  if (!book) notFound();

  const order = toBookOrder(by);
  const [pages, plannedIds] = await Promise.all([
    listBookPages(user.householdId, book.id, order, q),
    user.mealPlanEnabled
      ? plannedRecipeIds(user.householdId)
      : Promise.resolve(null),
  ]);
  const theirs = !!book.ownerName;

  const openAt = at
    ? pages.findIndex((p) => p.kind === "recipe" && p.recipe.id === at)
    : -1;

  return (
    // `main` is already exactly the leftover screen, so the book just fills it
    // and the pager takes what the title, pills and buttons do not want.
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="relative flex items-center gap-1">
        <BackLink href="/box" label="Boxes">
          Boxes
        </BackLink>
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-xl">{book.name}</h1>
          {theirs ? (
            <p className="hand -mt-0.5 truncate text-[0.85rem] text-browned">
              {book.canAdd
                ? `from ${book.ownerName} · you can add to this`
                : `from ${book.ownerName}`}
            </p>
          ) : null}
        </div>
        {book.smart ? null : (
          <FavoriteStar
            bookId={book.id}
            name={book.name}
            favorite={book.favorite}
          />
        )}
        {book.smart || theirs ? null : (
          <BookMenu
            bookId={book.id}
            name={book.name}
            shareHref={`/box/${book.id}/share`}
          />
        )}
      </div>

      <BoxSearch action={`/box/${book.id}`} query={q} preserve={{ by }} />

      {q && pages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-display text-2xl text-pink">Nothing matched</p>
          <p className="hand mt-2 text-browned">
            “{q}” is not in {book.name}
          </p>
          <ButtonLink
            href={by ? `/box/${book.id}?by=${by}` : `/box/${book.id}`}
            variant="secondary"
            className="mt-6"
          >
            Show the cards
          </ButtonLink>
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {book.id === "all" ? (
            <>
              <p className="font-display text-2xl text-pink">The box is empty</p>
              <p className="hand mt-2 text-browned">
                start with a card from the kitchen drawer
              </p>
              <ButtonLink href="/add" className="mt-6">
                Add the first recipe
              </ButtonLink>
            </>
          ) : (
            <>
              <p className="font-display text-2xl text-pink">This box is empty</p>
              <p className="hand mt-2 text-browned">
                file a card into this one from the recipe
              </p>
              <ButtonLink href="/box/all" variant="secondary" className="mt-6">
                Flip through Everything
              </ButtonLink>
            </>
          )}
        </div>
      ) : (
        <BookClient
          basePath={`/box/${book.id}`}
          query={q}
          pages={pages}
          plannedIds={plannedIds}
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
