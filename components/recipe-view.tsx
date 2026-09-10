"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Ingredient, Instruction } from "@/lib/db/schema";
import {
  formatIngredient,
  groupIngredients,
  scaleIngredient,
} from "@/lib/ingredients";
import { logCook, setStatus } from "@/lib/actions/recipes";
import { Button } from "@/components/ui";

type Recipe = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  servings: number | null;
  servingsText: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
  notes: string | null;
  status: "none" | "keeper" | "want_to_try" | "nope";
  sourceName: string | null;
  sourceUrl: string | null;
  timesCooked: number;
};

const STATUSES = [
  { key: "keeper", label: "Keeper" },
  { key: "want_to_try", label: "Want to try" },
  { key: "nope", label: "Nope" },
] as const;

export function RecipeView({
  recipe,
  images,
  tags,
}: {
  recipe: Recipe;
  images: { id: string; kind: "original" | "photo"; rotation: number }[];
  tags: string[];
}) {
  const [factor, setFactor] = useState(1);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showOriginal, setShowOriginal] = useState(false);
  const [status, setLocalStatus] = useState(recipe.status);
  const [, startTransition] = useTransition();

  const original = images.find((i) => i.kind === "original");
  const groups = groupIngredients(
    recipe.ingredients.map((i) => scaleIngredient(i, factor)),
  );
  const stepGroups = groupInstructions(recipe.instructions);

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <article className="space-y-6 pb-8">
      <header>
        <h1 className="font-display text-3xl leading-tight">{recipe.title}</h1>
        {recipe.description ? (
          <p className="mt-2 text-muted">{recipe.description}</p>
        ) : null}

        <p className="mt-2 text-[0.85rem] text-muted">
          {[
            recipe.servingsText ??
              (recipe.servings ? `Serves ${recipe.servings}` : null),
            recipe.prepMinutes ? `${recipe.prepMinutes} min prep` : null,
            recipe.cookMinutes ? `${recipe.cookMinutes} min cook` : null,
            recipe.timesCooked ? `cooked ${recipe.timesCooked}×` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <div className="no-print flex flex-wrap gap-2">
        {STATUSES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              const next = status === key ? "none" : key;
              setLocalStatus(next);
              startTransition(() => setStatus(recipe.id, next));
            }}
            className={`rounded-full border px-4 py-2 text-[0.85rem] font-bold ${
              status === key
                ? "border-pink bg-pink text-page"
                : "border-line bg-card text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {original ? (
        <section className="no-print">
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className="tap w-full rounded-card border border-line bg-card px-4 text-left font-bold text-pink"
          >
            {showOriginal ? "Hide the original" : "See the original"}
          </button>
          {showOriginal ? (
            <div className="mt-3 overflow-hidden rounded-card border border-line bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${original.id}`}
                alt={`The original ${recipe.title}`}
                className="w-full object-contain"
                style={{ rotate: `${original.rotation}deg` }}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Ingredients</h2>
          <div className="no-print flex items-center gap-1">
            {[0.5, 1, 2, 3].map((f) => (
              <button
                key={f}
                onClick={() => setFactor(f)}
                className={`h-9 min-w-11 rounded-full px-2 text-[0.85rem] font-bold ${
                  factor === f ? "bg-pink text-page" : "bg-pink-soft text-pink"
                }`}
              >
                {f === 0.5 ? "½×" : `${f}×`}
              </button>
            ))}
          </div>
        </div>

        {groups.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.name ? (
              <h3 className="mb-1 text-[0.8rem] font-bold tracking-wide text-browned uppercase">
                {group.name}
              </h3>
            ) : null}
            <ul className="space-y-1">
              {group.items.map((ing, i) => {
                const key = `${gi}-${i}`;
                const done = checked.has(key);
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className={`no-select flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left text-[1.05rem] ${
                        done ? "text-muted line-through" : ""
                      }`}
                    >
                      <span
                        className={`mt-1 h-5 w-5 shrink-0 rounded border-2 ${
                          done ? "border-pink bg-pink" : "border-pink-mid"
                        }`}
                      />
                      <span>{formatIngredient(ing)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display mb-3 text-xl">Steps</h2>
        {stepGroups.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.name ? (
              <h3 className="mb-1 text-[0.8rem] font-bold tracking-wide text-browned uppercase">
                {group.name}
              </h3>
            ) : null}
            <ol className="space-y-3">
              {group.items.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display shrink-0 text-lg text-pink">
                    {i + 1}
                  </span>
                  <p className="text-[1.05rem] leading-relaxed">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      {recipe.notes ? (
        <section className="rounded-card bg-sink p-4">
          <h2 className="mb-1 text-[0.8rem] font-bold tracking-wide text-browned uppercase">
            Notes
          </h2>
          <p className="hand whitespace-pre-wrap">{recipe.notes}</p>
        </section>
      ) : null}

      {tags.length ? (
        <ul className="no-print flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/box?tag=${encodeURIComponent(tag)}`}
                className="inline-flex h-8 items-center rounded-full bg-pink-soft px-3 text-[0.8rem] font-bold text-pink"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {recipe.sourceName || recipe.sourceUrl ? (
        <p className="text-[0.85rem] text-muted">
          From{" "}
          {recipe.sourceUrl ? (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {recipe.sourceName ?? recipe.sourceUrl}
            </a>
          ) : (
            recipe.sourceName
          )}
        </p>
      ) : null}

      <div className="no-print flex flex-col gap-3">
        <Link
          href={`/cook/${recipe.id}`}
          className="tap inline-flex items-center justify-center rounded-full bg-pink px-6 font-bold text-page"
        >
          Start cooking
        </Link>
        <Button
          variant="secondary"
          onClick={() => startTransition(() => logCook(recipe.id))}
        >
          I made this
        </Button>
      </div>
    </article>
  );
}

function groupInstructions(list: Instruction[]) {
  const groups = new Map<string, Instruction[]>();
  for (const step of list) {
    const key = step.group?.trim() || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(step);
  }
  return Array.from(groups, ([name, items]) => ({ name, items }));
}
