"use client";

import { useOptimistic, useState, useTransition } from "react";
import { createBookWithRecipe, setRecipeInBook } from "@/lib/actions/books";
import { CheckIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";

type Choice = {
  id: string;
  name: string;
  inBook: boolean;
  /** set when the book belongs to somebody else and they allow contributions */
  ownerName?: string | null;
  /** on its way to the server and not yet a real book */
  pending?: boolean;
};

type Patch =
  | { kind: "toggle"; id: string; inBook: boolean }
  | { kind: "add"; name: string };

function apply(choices: Choice[], patch: Patch): Choice[] {
  if (patch.kind === "toggle") {
    return choices.map((c) =>
      c.id === patch.id ? { ...c, inBook: patch.inBook } : c,
    );
  }
  return [
    ...choices,
    { id: `pending:${patch.name}`, name: patch.name, inBook: true, pending: true },
  ];
}

/**
 * Which boxes this recipe lives in. Toggling shows at once and is confirmed
 * behind the scenes.
 *
 * The list is read from the server on every render rather than copied into
 * state, because making a box adds something only the server knows the id of:
 * held in `useState` the new box would be saved and then never appear.
 */
export function BookPicker({
  recipeId,
  books,
}: {
  recipeId: string;
  books: Choice[];
}) {
  const [choices, patch] = useOptimistic(books, apply);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [, startTransition] = useTransition();

  const toggle = (id: string) => {
    const next = !choices.find((c) => c.id === id)?.inBook;
    startTransition(async () => {
      patch({ kind: "toggle", id, inBook: next });
      await setRecipeInBook(recipeId, id, next);
    });
  };

  const addBook = () => {
    const clean = name.trim();
    if (!clean) return;
    setName("");
    setAdding(false);

    // Naming a box you already have files the recipe into that one rather
    // than making a second box of the same name, so show that instead of a
    // duplicate chip that would vanish a moment later.
    const same = choices.find(
      (c) => c.name.toLowerCase() === clean.toLowerCase() && !c.ownerName,
    );
    if (same) {
      if (!same.inBook) toggle(same.id);
      return;
    }

    startTransition(async () => {
      patch({ kind: "add", name: clean });
      await createBookWithRecipe(recipeId, clean);
    });
  };

  return (
    <section className="no-print">
      <h2 className="mb-2 text-[0.72rem] font-bold tracking-[0.14em] text-browned uppercase">
        In these boxes
      </h2>

      <ul className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <li key={choice.id}>
            <button
              onClick={() => toggle(choice.id)}
              aria-pressed={choice.inBook}
              disabled={choice.pending}
              className={`tap inline-flex h-12 items-center gap-1.5 rounded-full border px-4 text-[0.9rem] font-bold ${
                choice.inBook
                  ? "border-pink bg-pink text-page"
                  : "border-line bg-card text-muted"
              } ${choice.pending ? "opacity-60" : ""}`}
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
              className="tap inline-flex h-12 items-center rounded-full border border-dashed border-pink-mid px-4 text-[0.9rem] font-bold text-pink"
            >
              + New box
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
            placeholder="Name the box"
            aria-label="New box name"
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
