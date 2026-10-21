import { requireUser } from "@/lib/auth";
import { listShelf } from "@/lib/books";
import { shareCounts } from "@/lib/sharing";
import { listWall } from "@/lib/recipes";
import { BoxWall, type Divider, type Tin } from "@/components/box-wall";
import { NewBookForm } from "@/components/new-book-form";

/**
 * The front door is the open box: the household's tins in a row, every card
 * she can read spread out beneath, the standing dividers along the top of the
 * wall. Nothing stands between opening the app and seeing the food.
 */
export default async function BoxPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; q?: string }>;
}) {
  const user = await requireUser();
  const [{ mine, shared }, sharedOut, cards, { d, q }] = await Promise.all([
    listShelf(user),
    shareCounts(user.householdId),
    listWall(user),
    searchParams,
  ]);

  // Starred boxes stand on the counter as tins; every other box is a divider
  // tab. Keepers and Want to try are marks on the cards, not boxes, so they
  // sit with Everything at the front of the row.
  const dividers: Divider[] = [
    { id: "all", name: "Everything", kind: "all" },
    { id: "keepers", name: "Keepers", kind: "keepers" },
    { id: "want-to-try", name: "Want to try", kind: "want" },
    ...mine.map((b) => ({
      id: b.id,
      name: b.name,
      kind: "box" as const,
      count: b.count,
      starred: b.favorite,
    })),
    ...shared.map((b) => ({
      id: b.id,
      name: b.name,
      kind: "shared" as const,
      ownerName: b.ownerName,
      count: b.count,
      starred: b.favorite,
    })),
  ];

  const tins: Tin[] = [
    ...mine
      .filter((b) => b.favorite)
      .map((book) => ({ book, sharedWith: sharedOut.get(book.id) ?? 0 })),
    ...shared
      .filter((b) => b.favorite)
      .map((book) => ({ book, from: book.ownerName })),
  ];

  const initialDivider = dividers.some((x) => x.id === d) ? d! : "all";

  return (
    <BoxWall
      cards={cards}
      dividers={dividers}
      tins={tins}
      initialDivider={initialDivider}
      initialQuery={q?.trim() ?? ""}
      newBox={<NewBookForm asPill />}
    />
  );
}
