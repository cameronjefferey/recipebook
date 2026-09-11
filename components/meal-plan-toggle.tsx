"use client";

import { useOptimistic, useTransition } from "react";
import { setPlanned } from "@/lib/actions/plan";
import { CalendarIcon, CheckIcon } from "@/components/icons";

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
      className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[0.85rem] font-bold ${
        isPlanned
          ? "border-pink bg-pink text-page"
          : "border-line bg-card text-muted"
      }`}
    >
      {isPlanned ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <CalendarIcon className="h-4 w-4" />
      )}
      {isPlanned ? "Cooking this week" : "Cook this week"}
    </button>
  );
}
