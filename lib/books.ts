import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Ingredient, Instruction } from "@/lib/db/schema";
import { books, bookFavorites, bookRecipes, recipes, recipeTags } from "@/lib/db/schema";
import { firstImages, listCategories } from "@/lib/recipes";
import { bookAccess, sharedWithMe } from "@/lib/access";
import type { CurrentUser } from "@/lib/auth";

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
  { id: "unfiled", name: "Not in a box", blurb: "still to be sorted" },
] as const;

export type SmartBookId = (typeof SMART_BOOKS)[number]["id"];

const SMART_IDS = new Set<string>(SMART_BOOKS.map((b) => b.id));

export function isSmartBook(id: string) {
  return SMART_IDS.has(id);
}

/**
 * Recipes belonging to a book, as a WHERE clause on `recipes`.
 *
 * The standing books describe this household's own collection, so they stay
 * scoped to it. A real book does not: once shared it can hold recipes from
 * several houses, and everyone let in should see all of them, so membership
 * of the book is the whole test.
 */
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
      return sql`EXISTS (SELECT 1 FROM ${bookRecipes} WHERE ${bookRecipes.recipeId} = ${recipes.id} AND ${bookRecipes.bookId} = ${bookId}::uuid)`;
  }
}

export type ShelfBook = {
  id: string;
  name: string;
  blurb: string | null;
  smart: boolean;
  favorite: boolean;
  count: number;
  coverId: string | null;
  rotation: number;
};

/** A book somebody else owns, sitting on this shelf because they shared it. */
export type SharedShelfBook = ShelfBook & {
  ownerName: string;
  canAdd: boolean;
};

/**
 * Everything needed to draw the shelf in three queries, rather than a count
 * and a cover per book. A household has a few hundred recipes at most, so the
 * tallying is cheaper done here than in round trips.
 */
export async function listShelf(user: CurrentUser): Promise<{
  smart: ShelfBook[];
  mine: ShelfBook[];
  shared: SharedShelfBook[];
}> {
  const householdId = user.householdId;
  const [rows, mineRows, sharedRows, favoriteRows] = await Promise.all([
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
    sharedWithMe(user),
    db
      .select({ bookId: bookFavorites.bookId })
      .from(bookFavorites)
      .where(eq(bookFavorites.householdId, householdId)),
  ]);
  const favoriteIds = new Set(favoriteRows.map((f) => f.bookId));

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
      favorite: favoriteIds.has(id),
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

  // A shared book holds recipes this household does not own, so its contents
  // cannot be counted from `rows` and have to be asked for separately.
  const sharedIds = sharedRows.map((b) => b.id);
  const sharedMembers = sharedIds.length
    ? await db
        .select({
          bookId: bookRecipes.bookId,
          recipeId: bookRecipes.recipeId,
        })
        .from(bookRecipes)
        .innerJoin(recipes, eq(recipes.id, bookRecipes.recipeId))
        .where(inArray(bookRecipes.bookId, sharedIds))
        .orderBy(desc(recipes.createdAt))
    : [];

  const sharedCovers = await firstImages(
    sharedMembers.map((m) => m.recipeId),
  );
  const bySharedBook = new Map<string, string[]>();
  for (const m of sharedMembers) {
    if (!bySharedBook.has(m.bookId)) bySharedBook.set(m.bookId, []);
    bySharedBook.get(m.bookId)!.push(m.recipeId);
  }

  const shared: SharedShelfBook[] = sharedRows.map((b) => {
    const members = bySharedBook.get(b.id) ?? [];
    const cover = members.map((r) => sharedCovers.get(r)).find(Boolean);
    return {
      id: b.id,
      name: b.name,
      blurb: null,
      smart: false,
      favorite: favoriteIds.has(b.id),
      count: members.length,
      coverId: cover?.id ?? null,
      rotation: cover?.rotation ?? 0,
      ownerName: b.ownerName,
      canAdd: b.canAdd,
    };
  });

  return { smart, mine, shared };
}

export type ResolvedBook = {
  id: string;
  name: string;
  smart: boolean;
  favorite: boolean;
  /** somebody else's book, on this shelf because it was shared */
  ownerName: string | null;
  canAdd: boolean;
  canManage: boolean;
};

/**
 * Takes the whole user rather than a household id, because a book on this
 * shelf is not necessarily this household's: `scopeOf` stops filtering by
 * household for a real book, and this is the check that earns it.
 */
export async function resolveBook(
  user: CurrentUser,
  id: string,
): Promise<ResolvedBook | null> {
  const [favorite] = await db
    .select({ bookId: bookFavorites.bookId })
    .from(bookFavorites)
    .where(
      and(
        eq(bookFavorites.householdId, user.householdId),
        eq(bookFavorites.bookId, id),
      ),
    )
    .limit(1);
  const starred = !!favorite;

  const smart = SMART_BOOKS.find((b) => b.id === id);
  if (smart) {
    return {
      id: smart.id,
      name: smart.name,
      smart: true,
      favorite: starred,
      ownerName: null,
      canAdd: false,
      canManage: false,
    };
  }

  const access = await bookAccess(user, id);
  if (!access) return null;

  return {
    id: access.bookId,
    name: access.name,
    smart: false,
    favorite: starred,
    ownerName: access.role === "owner" ? null : access.ownerName,
    canAdd: access.canAdd,
    canManage: access.canManage,
  };
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

function textSearch(q: string): SQL {
  const needle = `%${q}%`;
  return or(
    ilike(recipes.title, needle),
    ilike(recipes.description, needle),
    ilike(recipes.notes, needle),
    ilike(recipes.category, needle),
    ilike(recipes.sourceName, needle),
    sql`${recipes.ingredients}::text ILIKE ${needle}`,
    sql`${recipes.instructions}::text ILIKE ${needle}`,
    sql`EXISTS (SELECT 1 FROM ${recipeTags} WHERE ${recipeTags.recipeId} = ${recipes.id} AND ${recipeTags.tag} ILIKE ${needle})`,
  )!;
}

export async function listBookPages(
  householdId: string,
  bookId: string,
  order: BookOrder,
  q?: string,
): Promise<BookLeaf[]> {
  const needle = q?.trim();
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
    .where(
      needle
        ? and(scopeOf(householdId, bookId), textSearch(needle))
        : scopeOf(householdId, bookId),
    )
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
 * File a recipe into the box that shares its category name.
 *
 * An existing box is used quietly. A new box is made only when the cook asked
 * (`createIfMissing`), so a mistyped category cannot mint a divider on its own.
 */
export async function fileUnderCategory(
  householdId: string,
  recipeId: string,
  category: string | null | undefined,
  options?: { createIfMissing?: boolean },
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

  if (!existing && !options?.createIfMissing) return;

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

/** Category names already on cards, plus the boxes on the shelf. */
export async function listDividers(householdId: string): Promise<{
  names: string[];
  books: string[];
}> {
  const [categories, own] = await Promise.all([
    listCategories(householdId),
    db
      .select({ name: books.name })
      .from(books)
      .where(eq(books.householdId, householdId))
      .orderBy(asc(books.name)),
  ]);

  const seen = new Set<string>();
  const unique = (values: string[]) => {
    const out: string[] = [];
    for (const raw of values) {
      const name = raw.trim();
      const key = name.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(name);
    }
    return out;
  };

  const boxNames = unique(own.map((b) => b.name));
  seen.clear();
  const names = unique([...categories, ...boxNames]).sort((a, b) =>
    a.localeCompare(b),
  );
  return { names, books: boxNames };
}

/**
 * Books this recipe sits in, plus every book it could go in: this household's
 * own, and any shared one they have been given leave to add to. Offering the
 * latter is the whole point of a shared book — it is how a recipe of yours
 * reaches somebody else's shelf.
 */
export async function booksForRecipe(user: CurrentUser, recipeId: string) {
  const [own, shared, filed] = await Promise.all([
    db
      .select({ id: books.id, name: books.name })
      .from(books)
      .where(eq(books.householdId, user.householdId))
      .orderBy(asc(books.position), asc(books.name)),
    sharedWithMe(user),
    db
      .select({ bookId: bookRecipes.bookId })
      .from(bookRecipes)
      .where(eq(bookRecipes.recipeId, recipeId)),
  ]);

  const inBook = new Set(filed.map((m) => m.bookId));
  return [
    ...own.map((b) => ({
      id: b.id,
      name: b.name,
      inBook: inBook.has(b.id),
      ownerName: null as string | null,
    })),
    ...shared
      .filter((b) => b.canAdd)
      .map((b) => ({
        id: b.id,
        name: b.name,
        inBook: inBook.has(b.id),
        ownerName: b.ownerName,
      })),
  ];
}
