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
      className={`tap margin-word ${isPlanned ? "margin-on" : ""}`}
    >
      {isPlanned ? "Cooking this week" : "Cook this week"}
    </button>
  );
}
