"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { books, bookRecipes, recipes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";

export type BookState = { error?: string };

function clean(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 60);
}

/** Returns the existing book when the name is already on the shelf. */
async function upsertBook(householdId: string, name: string) {
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
  if (existing) return existing.id;

  const [row] = await db
    .insert(books)
    .values({ householdId, name })
    .returning({ id: books.id });
  return row.id;
}

export async function createBook(
  _prev: BookState,
  formData: FormData,
): Promise<BookState> {
  const user = await requireUser();
  const name = clean(String(formData.get("name") ?? ""));
  if (!name) return { error: "Give the book a name." };

  await upsertBook(user.householdId, name);
  revalidatePath("/book");
  return {};
}

export async function renameBook(bookId: string, name: string) {
  const user = await requireUser();
  const next = clean(name);
  if (!next) return;

  await db
    .update(books)
    .set({ name: next })
    .where(and(eq(books.id, bookId), eq(books.householdId, user.householdId)));

  revalidatePath("/book");
  revalidatePath(`/book/${bookId}`);
}

export async function deleteBook(bookId: string) {
  const user = await requireUser();
  // Only the book goes; the recipes inside it stay in the box.
  await db
    .delete(books)
    .where(and(eq(books.id, bookId), eq(books.householdId, user.householdId)));

  revalidatePath("/book");
  redirect("/book");
}

/** Put a recipe into a book, or take it out again. */
export async function setRecipeInBook(
  recipeId: string,
  bookId: string,
  inBook: boolean,
) {
  const user = await requireUser();

  // Both sides have to belong to this household before anything is written.
  const [[recipe], [book]] = await Promise.all([
    db
      .select({ id: recipes.id })
      .from(recipes)
      .where(
        and(eq(recipes.id, recipeId), eq(recipes.householdId, user.householdId)),
      )
      .limit(1),
    db
      .select({ id: books.id })
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.householdId, user.householdId)))
      .limit(1),
  ]);
  if (!recipe || !book) return;

  if (inBook) {
    await db
      .insert(bookRecipes)
      .values({ bookId, recipeId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(bookRecipes)
      .where(
        and(eq(bookRecipes.bookId, bookId), eq(bookRecipes.recipeId, recipeId)),
      );
  }

  revalidatePath("/book");
  revalidatePath(`/book/${bookId}`);
  revalidatePath(`/r/${recipeId}`);
}

/** Make a new book and drop this recipe straight into it. */
export async function createBookWithRecipe(recipeId: string, name: string) {
  const user = await requireUser();
  const bookName = clean(name);
  if (!bookName) return;

  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(
      and(eq(recipes.id, recipeId), eq(recipes.householdId, user.householdId)),
    )
    .limit(1);
  if (!recipe) return;

  const bookId = await upsertBook(user.householdId, bookName);
  await db
    .insert(bookRecipes)
    .values({ bookId, recipeId })
    .onConflictDoNothing();

  revalidatePath("/book");
  revalidatePath(`/r/${recipeId}`);
}
