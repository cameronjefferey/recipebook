"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createBook, type BookState } from "@/lib/actions/books";
import { Button, ErrorNote, Input } from "@/components/ui";

export function NewBookForm() {
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
        className="tap text-[0.95rem] font-bold text-pink"
      >
        + Name a box
      </button>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <ErrorNote>{state.error}</ErrorNote>
      <div className="flex gap-2">
        <Input
          name="name"
          placeholder="Breakfast, Sides, What the kids eat…"
          aria-label="New box name"
          maxLength={60}
          required
          autoFocus
        />
        <Button type="submit" disabled={pending} className="shrink-0 px-5">
          {pending ? "…" : "Add"}
        </Button>
      </div>
    </form>
  );
}
