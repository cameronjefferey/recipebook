"use client";

import { useState, useTransition } from "react";
import { createBookWithRecipe, setRecipeInBook } from "@/lib/actions/books";
import { CheckIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";

type Choice = {
  id: string;
  name: string;
  inBook: boolean;
  /** set when the book belongs to somebody else and they allow contributions */
  ownerName?: string | null;
};

/** Which books this recipe lives in. Toggling is immediate. */
export function BookPicker({
  recipeId,
  books,
}: {
  recipeId: string;
  books: Choice[];
}) {
  const [choices, setChoices] = useState(books);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [, startTransition] = useTransition();

  const toggle = (id: string) => {
    const next = !choices.find((c) => c.id === id)?.inBook;
    setChoices((prev) =>
      prev.map((c) => (c.id === id ? { ...c, inBook: next } : c)),
    );
    startTransition(() => setRecipeInBook(recipeId, id, next));
  };

  const addBook = () => {
    const clean = name.trim();
    if (!clean) return;
    setName("");
    setAdding(false);
    startTransition(() => createBookWithRecipe(recipeId, clean));
  };

  return (
    <section className="no-print">
      <h2 className="font-display mb-2 text-xl">In these books</h2>

      <ul className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <li key={choice.id}>
            <button
              onClick={() => toggle(choice.id)}
              aria-pressed={choice.inBook}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[0.9rem] font-bold ${
                choice.inBook
                  ? "border-pink bg-pink text-page"
                  : "border-line bg-card text-muted"
              }`}
            >
              {choice.inBook ? <CheckIcon className="h-4 w-4" /> : null}
              {choice.name}
              {choice.ownerName ? (
                <span className="font-normal opacity-70">
                  · {choice.ownerName}
                </span>
              ) : null}
            </button>
          </li>
        ))}

        {adding ? null : (
          <li>
            <button
              onClick={() => setAdding(true)}
              className="inline-flex h-10 items-center rounded-full border border-dashed border-pink-mid px-4 text-[0.9rem] font-bold text-pink"
            >
              + New book
            </button>
          </li>
        )}
      </ul>

      {adding ? (
        <div className="mt-3 flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addBook();
              }
            }}
            placeholder="Name the book"
            aria-label="New book name"
            maxLength={60}
            autoFocus
          />
          <Button onClick={addBook} className="shrink-0 px-5">
            Add
          </Button>
          <Button
            variant="secondary"
            className="shrink-0 px-4"
            onClick={() => {
              setName("");
              setAdding(false);
            }}
          >
            Cancel
          </Button>
        </div>
      ) : null}
    </section>
  );
}
