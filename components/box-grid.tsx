"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { RecipeCard as Card } from "@/lib/recipes";
import { RecipeCard } from "@/components/recipe-card";
import { addManyToPlan } from "@/lib/actions/plan";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui";

/**
 * The box grid, with an optional select mode for picking several recipes at
 * once and dropping them straight onto this week's plan. Ordinary browsing
 * never notices it is there — and if the household has turned meal planning
 * off in Settings, it is not there at all.
 */
export function BoxGrid({
  recipes,
  planEnabled = true,
}: {
  recipes: Card[];
  planEnabled?: boolean;
}) {
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stopSelecting = () => {
    setSelecting(false);
    setPicked(new Set());
  };

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelected = () => {
    const ids = [...picked];
    startTransition(async () => {
      const { added } = await addManyToPlan(ids);
      stopSelecting();
      setMessage(
        added > 0
          ? `Added ${added} ${added === 1 ? "recipe" : "recipes"} to this week.`
          : "Already on this week's list.",
      );
    });
  };

  return (
    <div className="space-y-3">
      {planEnabled ? (
        <div className="flex min-h-8 items-center justify-between gap-3">
          {message ? (
            <p className="hand text-[0.95rem] text-browned">
              {message} <Link href="/plan" className="underline">See the list</Link>
            </p>
          ) : (
            <span />
          )}
          <button
            onClick={() => {
              setMessage(null);
              if (selecting) stopSelecting();
              else setSelecting(true);
            }}
            className="tap shrink-0 px-2 text-[0.9rem] font-bold text-pink"
          >
            {selecting ? "Cancel" : "Select"}
          </button>
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-3">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="relative">
            <div
              className={selecting ? "pointer-events-none" : ""}
              aria-hidden={selecting || undefined}
            >
              <RecipeCard recipe={recipe} />
            </div>
            {selecting ? (
              <button
                onClick={() => toggle(recipe.id)}
                aria-pressed={picked.has(recipe.id)}
                aria-label={`Select ${recipe.title}`}
                className="tap absolute inset-0 z-10 rounded-card"
              >
                <span
                  className={`absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-sm ${
                    picked.has(recipe.id)
                      ? "border-pink bg-pink text-page"
                      : "border-card bg-card/90 text-transparent"
                  }`}
                >
                  <CheckIcon className="h-4 w-4" />
                </span>
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {selecting && picked.size > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4">
          <Button onClick={addSelected} disabled={pending} className="shadow-lg">
            Add {picked.size} to this week
          </Button>
        </div>
      ) : null}
    </div>
  );
}
