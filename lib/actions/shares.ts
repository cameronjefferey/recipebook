"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookShares, books } from "@/lib/db/schema";
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
    createdBy: user.id,
  });

  revalidatePath(`/book/${bookId}/share`);
  revalidatePath("/book");
  return {};
}

/** Taking the link back. The row goes, so the link stops working at once. */
export async function revokeShare(shareId: string) {
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

  await db.delete(bookShares).where(eq(bookShares.id, shareId));

  revalidatePath(`/book/${share.bookId}/share`);
  revalidatePath("/book");
}
