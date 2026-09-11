import "server-only";
import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Ingredient, Instruction } from "@/lib/db/schema";
import { books, bookRecipes, recipes } from "@/lib/db/schema";
import { firstImages } from "@/lib/recipes";

/* ------------------------------------------------------------------ *
 * The shelf. Each book is a collection of recipes; a recipe belongs to
 * as many books as it likes, because a thing can be both a weeknight
 * dinner and one the children will actually eat.
 * ------------------------------------------------------------------ */

export type BookOrder = "title" | "recent" | "loved";

// Three fit across a phone without scrolling. Randomness is the die button in
// the pager, which turns to a page without disturbing the order.
export const BOOK_ORDERS: { key: BookOrder; label: string }[] = [
  { key: "title", label: "A–Z" },
  { key: "recent", label: "Newest" },
  { key: "loved", label: "Best loved" },
];

export function toBookOrder(value: string | undefined): BookOrder {
  return BOOK_ORDERS.some((o) => o.key === value)
    ? (value as BookOrder)
    : "title";
}

/**
 * Books that are always on the shelf and cannot be edited: they describe
 * themselves from the recipes, so they are never out of date.
 */
export const SMART_BOOKS = [
  { id: "all", name: "Everything", blurb: "the whole box" },
  { id: "keepers", name: "Keepers", blurb: "the ones with a ribbon" },
  { id: "want-to-try", name: "Want to try", blurb: "not made yet" },
  { id: "loved", name: "Best loved", blurb: "cooked the most" },
  { id: "unfiled", name: "Not in a book", blurb: "still to be sorted" },
] as const;

export type SmartBookId = (typeof SMART_BOOKS)[number]["id"];

const SMART_IDS = new Set<string>(SMART_BOOKS.map((b) => b.id));
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSmartBook(id: string) {
  return SMART_IDS.has(id);
}

/** Recipes belonging to a book, as a WHERE clause on `recipes`. */
function scopeOf(householdId: string, bookId: string): SQL {
  const mine = eq(recipes.householdId, householdId);
  switch (bookId) {
    case "all":
      return mine;
    case "keepers":
      return and(mine, eq(recipes.status, "keeper"))!;
    case "want-to-try":
      return and(mine, eq(recipes.status, "want_to_try"))!;
    case "loved":
      return and(mine, sql`${recipes.timesCooked} >= 1`)!;
    case "unfiled":
      return and(
        mine,
        sql`NOT EXISTS (SELECT 1 FROM ${bookRecipes} WHERE ${bookRecipes.recipeId} = ${recipes.id})`,
      )!;
    default:
      return and(
        mine,
        sql`EXISTS (SELECT 1 FROM ${bookRecipes} WHERE ${bookRecipes.recipeId} = ${recipes.id} AND ${bookRecipes.bookId} = ${bookId}::uuid)`,
      )!;
  }
}

export type ShelfBook = {
  id: string;
  name: string;
  blurb: string | null;
  smart: boolean;
  count: number;
  coverId: string | null;
  rotation: number;
};

/**
 * Everything needed to draw the shelf in three queries, rather than a count
 * and a cover per book. A household has a few hundred recipes at most, so the
 * tallying is cheaper done here than in round trips.
 */
export async function listShelf(householdId: string): Promise<{
  smart: ShelfBook[];
  mine: ShelfBook[];
}> {
  const [rows, mineRows] = await Promise.all([
    db
      .select({
        id: recipes.id,
        status: recipes.status,
        timesCooked: recipes.timesCooked,
      })
      .from(recipes)
      .where(eq(recipes.householdId, householdId))
      .orderBy(desc(recipes.createdAt)),
    db
      .select({ id: books.id, name: books.name, position: books.position })
      .from(books)
      .where(eq(books.householdId, householdId))
      .orderBy(asc(books.position), asc(books.name)),
  ]);

  const ids = rows.map((r) => r.id);
  const [memberships, covers] = await Promise.all([
    ids.length
      ? db
          .select({
            bookId: bookRecipes.bookId,
            recipeId: bookRecipes.recipeId,
          })
          .from(bookRecipes)
          .where(inArray(bookRecipes.recipeId, ids))
      : Promise.resolve([]),
    firstImages(ids),
  ]);

  const filed = new Set(memberships.map((m) => m.recipeId));
  const byBook = new Map<string, string[]>();
  for (const m of memberships) {
    if (!byBook.has(m.bookId)) byBook.set(m.bookId, []);
    byBook.get(m.bookId)!.push(m.recipeId);
  }

  // `rows` is newest first, so the first match is also the freshest cover.
  const shelfBook = (
    id: string,
    name: string,
    blurb: string | null,
    smart: boolean,
    members: string[],
  ): ShelfBook => {
    const cover = members.map((r) => covers.get(r)).find(Boolean);
    return {
      id,
      name,
      blurb,
      smart,
      count: members.length,
      coverId: cover?.id ?? null,
      rotation: cover?.rotation ?? 0,
    };
  };

  const inOrder = (keep: (r: (typeof rows)[number]) => boolean) =>
    rows.filter(keep).map((r) => r.id);

  const smart = SMART_BOOKS.map((b) => {
    const members =
      b.id === "all"
        ? ids
        : b.id === "keepers"
          ? inOrder((r) => r.status === "keeper")
          : b.id === "want-to-try"
            ? inOrder((r) => r.status === "want_to_try")
            : b.id === "loved"
              ? inOrder((r) => r.timesCooked >= 1)
              : inOrder((r) => !filed.has(r.id));
    return shelfBook(b.id, b.name, b.blurb, true, members);
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  const mine = mineRows.map((b) => {
    const members = (byBook.get(b.id) ?? []).sort(
      (a, z) => (order.get(a) ?? 0) - (order.get(z) ?? 0),
    );
    return shelfBook(b.id, b.name, null, false, members);
  });

  return { smart, mine };
}

export type ResolvedBook = { id: string; name: string; smart: boolean };

export async function resolveBook(
  householdId: string,
  id: string,
): Promise<ResolvedBook | null> {
  const smart = SMART_BOOKS.find((b) => b.id === id);
  if (smart) return { id: smart.id, name: smart.name, smart: true };

  // Anything else has to look like a uuid before it reaches the ::uuid cast.
  if (!UUID.test(id)) return null;

  const [row] = await db
    .select({ id: books.id, name: books.name })
    .from(books)
    .where(and(eq(books.id, id), eq(books.householdId, householdId)))
    .limit(1);

  return row ? { ...row, smart: false } : null;
}

export type BookRecipe = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  servings: number | null;
  servingsText: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
  notes: string | null;
  status: "none" | "keeper" | "want_to_try" | "nope";
  timesCooked: number;
  sourceName: string | null;
  imageId: string | null;
  rotation: number;
};

/** A leaf of an open book: a letter divider, or a recipe. */
export type BookLeaf =
  | { kind: "divider"; key: string; name: string; count: number }
  | { kind: "recipe"; key: string; recipe: BookRecipe };

function orderClause(order: BookOrder) {
  const byTitle = sql`lower(${recipes.title})`;
  switch (order) {
    case "title":
      return [byTitle];
    case "recent":
      return [desc(recipes.createdAt)];
    case "loved":
      return [desc(recipes.timesCooked), byTitle];
  }
}

/**
 * Below this, letter dividers outnumber the recipes and the book turns into
 * mostly signposts. A short book is easier read straight through.
 */
const DIVIDERS_FROM = 12;

/** First letter of a title, for the A to Z dividers. */
function initialOf(title: string) {
  const c = title.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
}

export async function listBookPages(
  householdId: string,
  bookId: string,
  order: BookOrder,
): Promise<BookLeaf[]> {
  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      category: recipes.category,
      servings: recipes.servings,
      servingsText: recipes.servingsText,
      prepMinutes: recipes.prepMinutes,
      cookMinutes: recipes.cookMinutes,
      ingredients: recipes.ingredients,
      instructions: recipes.instructions,
      notes: recipes.notes,
      status: recipes.status,
      timesCooked: recipes.timesCooked,
      sourceName: recipes.sourceName,
    })
    .from(recipes)
    .where(scopeOf(householdId, bookId))
    .orderBy(...orderClause(order))
    .limit(300);

  if (rows.length === 0) return [];

  const covers = await firstImages(rows.map((r) => r.id));
  const list: BookRecipe[] = rows.map((r) => ({
    ...r,
    imageId: covers.get(r.id)?.id ?? null,
    rotation: covers.get(r.id)?.rotation ?? 0,
  }));

  // Only the alphabet gets dividers. The other orderings have no natural
  // breaks, and inventing some would just be furniture.
  if (order !== "title" || list.length < DIVIDERS_FROM) {
    return list.map((recipe) => ({ kind: "recipe", key: recipe.id, recipe }));
  }

  const counts = new Map<string, number>();
  for (const r of list) {
    const c = initialOf(r.title);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }

  const pages: BookLeaf[] = [];
  let open: string | null = null;
  for (const recipe of list) {
    const c = initialOf(recipe.title);
    if (c !== open) {
      open = c;
      pages.push({
        kind: "divider",
        key: `divider-${c}`,
        name: c,
        count: counts.get(c) ?? 0,
      });
    }
    pages.push({ kind: "recipe", key: recipe.id, recipe });
  }
  return pages;
}

/**
 * File a new recipe into the book named after its category, making the book if
 * the shelf has not got one yet. Without this the shelf would slowly go stale:
 * transcription suggests a category, and everything new would otherwise pile up
 * in "Not in a book" however carefully it had been labelled.
 */
export async function fileUnderCategory(
  householdId: string,
  recipeId: string,
  category: string | null | undefined,
) {
  const name = category?.trim().replace(/\s+/g, " ").slice(0, 60);
  if (!name) return;

  const [existing] = await db
    .select({ id: books.id })
    .from(books)
    .where(
      and(
        eq(books.householdId, householdId),
        sql`lower(${books.name}) = lower(${name})`,
      ),
    )
    .limit(1);

  const bookId =
    existing?.id ??
    (
      await db
        .insert(books)
        .values({ householdId, name })
        .returning({ id: books.id })
    )[0].id;

  await db
    .insert(bookRecipes)
    .values({ bookId, recipeId })
    .onConflictDoNothing();
}

/** Books this recipe sits in, plus every book available to put it in. */
export async function booksForRecipe(householdId: string, recipeId: string) {
  const [all, mine] = await Promise.all([
    db
      .select({ id: books.id, name: books.name })
      .from(books)
      .where(eq(books.householdId, householdId))
      .orderBy(asc(books.position), asc(books.name)),
    db
      .select({ bookId: bookRecipes.bookId })
      .from(bookRecipes)
      .where(eq(bookRecipes.recipeId, recipeId)),
  ]);

  const inBook = new Set(mine.map((m) => m.bookId));
  return all.map((b) => ({ ...b, inBook: inBook.has(b.id) }));
}
