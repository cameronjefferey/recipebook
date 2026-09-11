import "server-only";
import { and, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookRecipes,
  bookShares,
  books,
  households,
  recipes,
} from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import type { CurrentUser } from "@/lib/auth";

/* ------------------------------------------------------------------ *
 * Who may see what, and who may change it.
 *
 * A book can hold recipes from more than one house once it is shared, so
 * the two questions come apart: you can read anything in a book you have
 * been let into, but a recipe is only ever yours to alter if your house
 * owns it. Both rules live here, and nowhere else, because the moment
 * they are restated somewhere they will disagree.
 * ------------------------------------------------------------------ */

export type BookRole = "owner" | "contributor" | "reader";

export type BookAccess = {
  bookId: string;
  name: string;
  /** the household whose book it is */
  ownerHouseholdId: string;
  ownerName: string;
  role: BookRole;
  /** may put their own recipes in */
  canAdd: boolean;
  /** may rename, delete and share it */
  canManage: boolean;
};

/**
 * How this person stands in relation to one book: theirs, one they have been
 * let into, or nothing at all.
 */
export async function bookAccess(
  user: CurrentUser,
  bookId: string,
): Promise<BookAccess | null> {
  if (!isUuid(bookId)) return null;

  const [row] = await db
    .select({
      bookId: books.id,
      name: books.name,
      ownerHouseholdId: books.householdId,
      ownerName: households.name,
      shareId: bookShares.id,
      canAdd: bookShares.canAdd,
    })
    .from(books)
    .innerJoin(households, eq(households.id, books.householdId))
    .leftJoin(
      bookShares,
      and(eq(bookShares.bookId, books.id), eq(bookShares.userId, user.id)),
    )
    .where(eq(books.id, bookId))
    // The same book can be handed to the same person twice. Take the kindest
    // of those rows, so what they may do does not depend on row order.
    .orderBy(desc(bookShares.canAdd))
    .limit(1);

  if (!row) return null;

  const owned = row.ownerHouseholdId === user.householdId;
  if (!owned && !row.shareId) return null;

  return {
    bookId: row.bookId,
    name: row.name,
    ownerHouseholdId: row.ownerHouseholdId,
    ownerName: row.ownerName,
    role: owned ? "owner" : row.canAdd ? "contributor" : "reader",
    canAdd: owned || !!row.canAdd,
    canManage: owned,
  };
}

/**
 * Books that are not this household's but have been accepted onto this
 * person's shelf. Kept separate from their own, so the shelf never pretends
 * somebody else's book is theirs to rename.
 */
export async function sharedWithMe(user: CurrentUser) {
  return db
    .select({
      id: books.id,
      name: books.name,
      canAdd: bookShares.canAdd,
      ownerHouseholdId: books.householdId,
      ownerName: households.name,
    })
    .from(bookShares)
    .innerJoin(books, eq(books.id, bookShares.bookId))
    .innerJoin(households, eq(households.id, books.householdId))
    .where(
      and(
        eq(bookShares.userId, user.id),
        sql`${books.householdId} <> ${user.householdId}`,
      ),
    )
    .orderBy(books.name);
}

/**
 * A recipe is readable in three cases: this household owns it, it sits in a
 * book this person has been let into, or it sits in a book this household
 * owns. That last one is easy to forget and the feature is pointless without
 * it — it is how the owner reads what a contributor put in her own book.
 */
export function visibleRecipe(user: CurrentUser): SQL {
  return or(
    eq(recipes.householdId, user.householdId),
    sql`EXISTS (
      SELECT 1 FROM ${bookRecipes}
      JOIN ${bookShares} ON ${bookShares.bookId} = ${bookRecipes.bookId}
      WHERE ${bookRecipes.recipeId} = ${recipes.id}
        AND ${bookShares.userId} = ${user.id}
    )`,
    sql`EXISTS (
      SELECT 1 FROM ${bookRecipes}
      JOIN ${books} ON ${books.id} = ${bookRecipes.bookId}
      WHERE ${bookRecipes.recipeId} = ${recipes.id}
        AND ${books.householdId} = ${user.householdId}
    )`,
  )!;
}

/** Reading is wide; writing is not. A recipe is only yours if your house owns it. */
export function ownsRecipe(user: CurrentUser): SQL {
  return eq(recipes.householdId, user.householdId);
}

/**
 * The same rule as `visibleRecipe`, for one recipe, when what is wanted is a
 * yes or no rather than a clause.
 */
export async function canSeeRecipe(user: CurrentUser, recipeId: string) {
  if (!isUuid(recipeId)) return false;
  const [row] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), visibleRecipe(user)))
    .limit(1);
  return !!row;
}
