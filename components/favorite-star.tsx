"use client";

import { useOptimistic, useTransition } from "react";
import { setBookFavorite } from "@/lib/actions/books";
import { StarIcon } from "@/components/icons";

function apply(_state: boolean, next: boolean) {
  return next;
}

/**
 * A star on a box. Lives outside the box's own link so tapping it never
 * opens the lid — it just pins the box to the top of the shelf, or takes
 * the pin off.
 */
export function FavoriteStar({
  bookId,
  name,
  favorite,
}: {
  bookId: string;
  name: string;
  favorite: boolean;
}) {
  const [starred, patch] = useOptimistic(favorite, apply);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        const next = !starred;
        startTransition(async () => {
          patch(next);
          await setBookFavorite(bookId, next);
        });
      }}
      aria-pressed={starred}
      aria-label={starred ? `Unfavorite ${name}` : `Favorite ${name}`}
      className="tap flex items-center justify-center"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-card/90 shadow-sm ${
          starred ? "text-butter" : "text-browned"
        }`}
      >
        <StarIcon className="h-5 w-5" filled={starred} />
      </span>
    </button>
  );
}
