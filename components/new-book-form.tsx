"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBook, type BookState } from "@/lib/actions/books";
import { Button, ErrorNote, Input } from "@/components/ui";

export function NewBookForm() {
  const [state, action, pending] = useActionState<BookState, FormData>(
    createBook,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box after a book is made, so several can be added in a row.
  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

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
        />
        <Button type="submit" disabled={pending} className="shrink-0 px-5">
          {pending ? "…" : "Add"}
        </Button>
      </div>
    </form>
  );
}
