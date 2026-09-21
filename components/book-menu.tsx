"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteBook, renameBook } from "@/lib/actions/books";
import { Button, Input } from "@/components/ui";

/** Rename, share, or remove a box. Deleting the box never deletes its recipes. */
export function BookMenu({
  bookId,
  name,
  shareHref,
}: {
  bookId: string;
  name: string;
  shareHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="tap flex items-center justify-center px-2 text-[0.85rem] font-bold text-browned"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="absolute inset-x-0 top-0 z-40 -mx-4 border-b border-line bg-card p-4 shadow-sm">
      <form
        action={() => {
          startTransition(async () => {
            await renameBook(bookId, value);
            setOpen(false);
          });
        }}
        className="space-y-3"
      >
        <Input
          name="name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Box name"
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setValue(name);
              setOpen(false);
            }}
          >
            Cancel
          </Button>
        </div>
        {shareHref ? (
          <Link
            href={shareHref}
            className="tap inline-flex w-full items-center justify-center rounded-full border border-line bg-card px-6 text-[0.95rem] font-bold"
          >
            Share this box
          </Link>
        ) : null}
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          className="w-full"
          onClick={() => {
            if (!confirm(`Delete the box "${name}"? The recipes stay.`)) return;
            startTransition(() => deleteBook(bookId));
          }}
        >
          Delete this box
        </Button>
      </form>
    </div>
  );
}
