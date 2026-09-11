"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookRecipes, bookShares, books, recipes, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { mintToken } from "@/lib/sharing";

export type ShareState = { error?: string };

/** The book has to be this household's before anything is minted against it. */
async function ownBook(householdId: string, bookId: string) {
  const [book] = await db
    .select({ id: books.id })
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.householdId, householdId)))
    .limit(1);
  return book ?? null;
}

export async function shareBook(
  bookId: string,
  _prev: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const user = await requireUser();

  const recipientName = String(formData.get("recipientName") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
  if (!recipientName) return { error: "Who is it for?" };

  if (!(await ownBook(user.householdId, bookId))) {
    return { error: "That book is no longer here." };
  }

  await db.insert(bookShares).values({
    bookId,
    recipientName,
    token: mintToken(),
    canAdd: formData.get("canAdd") === "on",
    createdBy: user.id,
  });

  revalidatePath(`/book/${bookId}/share`);
  revalidatePath("/book");
  return {};
}

/** Whether this person may put their own recipes in, changed after the fact. */
export async function setShareCanAdd(shareId: string, canAdd: boolean) {
  const user = await requireUser();

  const [share] = await db
    .select({ bookId: bookShares.bookId })
    .from(bookShares)
    .innerJoin(books, eq(books.id, bookShares.bookId))
    .where(
      and(eq(bookShares.id, shareId), eq(books.householdId, user.householdId)),
    )
    .limit(1);
  if (!share) return;

  await db.update(bookShares).set({ canAdd }).where(eq(bookShares.id, shareId));
  revalidatePath(`/book/${share.bookId}/share`);
}

/**
 * Taking the link back. The row goes, so the link stops working at once, and
 * anything the guest had put in the book leaves with them: those recipes are
 * theirs, and the owner could not edit them anyway.
 */
export async function revokeShare(shareId: string) {
  const user = await requireUser();

  const [share] = await db
    .select({
      bookId: bookShares.bookId,
      /** null until they have opened it with an account, so nothing to remove */
      guestHouseholdId: users.householdId,
    })
    .from(bookShares)
    .innerJoin(books, eq(books.id, bookShares.bookId))
    .leftJoin(users, eq(users.id, bookShares.userId))
    .where(
      and(eq(bookShares.id, shareId), eq(books.householdId, user.householdId)),
    )
    .limit(1);
  if (!share) return;

  await db.delete(bookShares).where(eq(bookShares.id, shareId));

  // Only this person's contributions. Taking Carol's link back must not empty
  // the book of everything Dave put in it as well.
  if (share.guestHouseholdId && share.guestHouseholdId !== user.householdId) {
    await db.delete(bookRecipes).where(
      and(
        eq(bookRecipes.bookId, share.bookId),
        sql`EXISTS (
          SELECT 1 FROM ${recipes}
          WHERE ${recipes.id} = ${bookRecipes.recipeId}
            AND ${recipes.householdId} = ${share.guestHouseholdId}
        )`,
      ),
    );
  }

  revalidatePath(`/book/${share.bookId}/share`);
  revalidatePath(`/book/${share.bookId}`);
  revalidatePath("/book");
}

/**
 * Keeping a shared book on your own shelf. Until this the link is the only way
 * back to it, which is fine for somebody who will never make an account and no
 * use at all to somebody who has one.
 */
export async function acceptShare(token: string) {
  const user = await requireUser();

  const [share] = await db
    .select({
      id: bookShares.id,
      bookId: bookShares.bookId,
      userId: bookShares.userId,
      householdId: books.householdId,
    })
    .from(bookShares)
    .innerJoin(books, eq(books.id, bookShares.bookId))
    .where(eq(bookShares.token, token))
    .limit(1);

  // Already claimed by somebody else, or it is your own book anyway.
  if (!share) return;
  if (share.userId && share.userId !== user.id) return;
  if (share.householdId === user.householdId) return;

  await db
    .update(bookShares)
    .set({ userId: user.id, acceptedAt: new Date() })
    .where(eq(bookShares.id, share.id));

  revalidatePath("/book");
  redirect(`/book/${share.bookId}`);
}
