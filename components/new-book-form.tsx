"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createBook, type BookState } from "@/lib/actions/books";
import { Button, ErrorNote, Input } from "@/components/ui";
import { PlusIcon } from "@/components/icons";

/**
 * Names a new box. Under the wall it is a dashed pill, the outline of a
 * divider not yet written on; the form opens in place when tapped.
 */
export function NewBookForm({ asPill = false }: { asPill?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<BookState, FormData>(
    createBook,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  // Only tuck it away after a real save, never because the page merely
  // rendered with an empty state.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          asPill
            ? "tap inline-flex items-center gap-1.5 rounded-full border border-dashed border-pink-mid px-4 text-[1rem] font-bold text-pink-deep"
            : "tap text-[0.95rem] font-bold text-pink-deep"
        }
      >
        {asPill ? <PlusIcon className="h-5 w-5" /> : "+ "}
        Name a box
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-2"
    >
      <ErrorNote>{state.error}</ErrorNote>
      <div className="flex gap-2">
        <Input
          name="name"
          placeholder="Breakfast, Holidays, What the kids eat…"
          aria-label="New box name"
          maxLength={60}
          required
          autoFocus
        />
        <Button type="submit" disabled={pending} className="shrink-0 px-5">
          {pending ? "…" : "Add"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 px-4"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
