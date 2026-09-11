import { requireUser } from "@/lib/auth";
import { BOOK_ORDERS, listBookPages, toBookOrder } from "@/lib/recipes";
import { BookClient } from "@/components/book-client";
import { ButtonLink } from "@/components/ui";

export default async function FlipThroughPage({
  searchParams,
}: {
  searchParams: Promise<{ by?: string; at?: string }>;
}) {
  const user = await requireUser();
  const { by, at } = await searchParams;

  const order = toBookOrder(by);
  const pages = await listBookPages(user.householdId, order);

  if (pages.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl text-pink">Nothing to flip through</p>
        <p className="hand mt-2 text-browned">the book starts at one recipe</p>
        <ButtonLink href="/add" className="mt-6">
          Add the first recipe
        </ButtonLink>
      </div>
    );
  }

  const openAt = at
    ? pages.findIndex((p) => p.kind === "recipe" && p.recipe.id === at)
    : -1;

  return (
    <BookClient
      pages={pages}
      initialIndex={openAt > 0 ? openAt : 0}
      orders={BOOK_ORDERS.map(({ key, label }) => ({
        key,
        label,
        active: order === key,
      }))}
    />
  );
}
