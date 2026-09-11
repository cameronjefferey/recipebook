import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookRecipes,
  bookShares,
  books,
  households,
  recipeImages,
  recipes,
} from "@/lib/db/schema";
import { firstImages } from "@/lib/recipes";
import { isUuid } from "@/lib/ids";
import type { BookLeaf, BookOrder, BookRecipe } from "@/lib/books";

/** The same choices the owner has, minus the letter dividers. */
function sharedOrder(order: BookOrder) {
  const byTitle = sql`lower(${recipes.title})`;
  switch (order) {
    case "recent":
      return [desc(recipes.createdAt)];
    case "loved":
      return [desc(recipes.timesCooked), byTitle];
    default:
      return [byTitle];
  }
}

/* ------------------------------------------------------------------ *
 * Handing a book to somebody. The token in the link is the whole
 * credential, so every read is scoped by it and by nothing else.
 * ------------------------------------------------------------------ */

/** 128 bits, url-safe. Long enough that guessing is not a threat model. */
export function mintToken() {
  return randomBytes(16).toString("base64url");
}

export type Share = {
  id: string;
  recipientName: string;
  token: string;
  lastViewedAt: Date | null;
  viewCount: number;
  createdAt: Date;
  canAdd: boolean;
  /** set once they have opened it while signed in */
  acceptedAt: Date | null;
};

export async function listShares(
  householdId: string,
  bookId: string,
): Promise<Share[]> {
  return db
    .select({
      id: bookShares.id,
      recipientName: bookShares.recipientName,
      token: bookShares.token,
      lastViewedAt: bookShares.lastViewedAt,
      viewCount: bookShares.viewCount,
      createdAt: bookShares.createdAt,
      canAdd: bookShares.canAdd,
      acceptedAt: bookShares.acceptedAt,
    })
    .from(bookShares)
    .innerJoin(books, eq(books.id, bookShares.bookId))
    .where(
      and(eq(bookShares.bookId, bookId), eq(books.householdId, householdId)),
    )
    .orderBy(asc(bookShares.createdAt));
}

export type SharedBook = {
  shareId: string;
  bookId: string;
  bookName: string;
  recipientName: string;
  householdName: string;
  ownerHouseholdId: string;
  lastViewedAt: Date | null;
};

/** The one place a token turns into permission. Null means no such share. */
export async function resolveShare(token: string): Promise<SharedBook | null> {
  if (!token || token.length > 128) return null;

  const [row] = await db
    .select({
      shareId: bookShares.id,
      bookId: books.id,
      bookName: books.name,
      recipientName: bookShares.recipientName,
      householdName: households.name,
      ownerHouseholdId: books.householdId,
      lastViewedAt: bookShares.lastViewedAt,
    })
    .from(bookShares)
    .innerJoin(books, eq(books.id, bookShares.bookId))
    .innerJoin(households, eq(households.id, books.householdId))
    .where(eq(bookShares.token, token))
    .limit(1);

  return row ?? null;
}

/**
 * Debounced, because a server component can render more than once for a single
 * visit and "last looked at 3 seconds ago" should not be an artefact of that.
 */
export async function recordView(shareId: string, lastViewedAt: Date | null) {
  if (lastViewedAt && Date.now() - lastViewedAt.getTime() < 60_000) return;
  await db
    .update(bookShares)
    .set({ viewCount: sql`${bookShares.viewCount} + 1`, lastViewedAt: new Date() })
    .where(eq(bookShares.id, shareId));
}

/** The recipes inside a shared book, ordered the way the guest asked for. */
export async function listSharedPages(
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
    .innerJoin(bookRecipes, eq(bookRecipes.recipeId, recipes.id))
    .where(eq(bookRecipes.bookId, bookId))
    .orderBy(...sharedOrder(order))
    .limit(300);

  if (rows.length === 0) return [];

  const covers = await firstImages(rows.map((r) => r.id));
  return rows.map((r): BookLeaf => {
    const recipe: BookRecipe = {
      ...r,
      imageId: covers.get(r.id)?.id ?? null,
      rotation: covers.get(r.id)?.rotation ?? 0,
    };
    return { kind: "recipe", key: recipe.id, recipe };
  });
}

/**
 * An image is visible to a recipient only if it hangs off a recipe that is in
 * the very book they were given. Scoping by household instead would quietly
 * hand over the photographs of every other book in the box.
 */
export async function sharedImage(token: string, imageId: string) {
  if (!token || !isUuid(imageId)) return null;

  const [image] = await db
    .select({
      mime: recipeImages.mime,
      bytes: recipeImages.bytes,
    })
    .from(recipeImages)
    .innerJoin(bookRecipes, eq(bookRecipes.recipeId, recipeImages.recipeId))
    .innerJoin(bookShares, eq(bookShares.bookId, bookRecipes.bookId))
    .where(and(eq(recipeImages.id, imageId), eq(bookShares.token, token)))
    .limit(1);

  return image ?? null;
}

/** Books on the shelf that are currently in somebody else's hands. */
export async function shareCounts(householdId: string) {
  const rows = await db
    .select({ bookId: bookShares.bookId, n: sql<number>`count(*)::int` })
    .from(bookShares)
    .innerJoin(books, eq(books.id, bookShares.bookId))
    .where(eq(books.householdId, householdId))
    .groupBy(bookShares.bookId);

  return new Map(rows.map((r) => [r.bookId, r.n]));
}