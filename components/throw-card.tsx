"use client";

import { useState, useTransition } from "react";
import { deleteRecipe } from "@/lib/actions/recipes";
import { Button } from "@/components/ui";

export function ThrowCard({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap inline-flex items-center justify-center text-[0.95rem] font-bold text-jam"
      >
        Throw this card out
      </button>
    );
  }

  return (
    <div className="rounded-card bg-sink p-4">
      <p className="text-[1.05rem]">
        Throw out {title}? The photo goes with it.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="danger"
          disabled={pending}
          onClick={() => startTransition(() => deleteRecipe(id))}
        >
          {pending ? "Throwing it out…" : "Throw it out"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Keep it
        </Button>
      </div>
    </div>
  );
}
