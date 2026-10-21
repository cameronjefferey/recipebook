"use client";

import { useOptimistic, useTransition } from "react";
import { setPlanned } from "@/lib/actions/plan";

function apply(_state: boolean, next: boolean) {
  return next;
}

/**
 * "Cook this week" is a personal note on top of any recipe you can see, not
 * a change to the recipe itself, so unlike the status chips it shows up even
 * on a recipe that belongs to somebody else.
 */
export function MealPlanToggle({
  recipeId,
  planned,
}: {
  recipeId: string;
  planned: boolean;
}) {
  const [isPlanned, patch] = useOptimistic(planned, apply);
  const [, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        const next = !isPlanned;
        startTransition(async () => {
          patch(next);
          await setPlanned(recipeId, next);
        });
      }}
      aria-pressed={isPlanned}
      className={`tap inline-flex h-12 shrink-0 items-center rounded-full border px-4 text-[1rem] font-bold ${
        isPlanned
          ? "border-pink-deep bg-pink-deep text-page"
          : "border-line bg-card text-ink"
      }`}
    >
      {isPlanned ? "Cooking this week" : "Cook this week"}
    </button>
  );
}
