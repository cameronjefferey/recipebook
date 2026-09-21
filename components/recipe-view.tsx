"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Ingredient, Instruction } from "@/lib/db/schema";
import {
  formatIngredient,
  groupIngredients,
  groupInstructions,
  scaleIngredient,
} from "@/lib/ingredients";
import { logCook, setStatus } from "@/lib/actions/recipes";
import { BookPicker } from "@/components/book-picker";
import { MealPlanToggle } from "@/components/meal-plan-toggle";
import { BackButton } from "@/components/back-button";
import { ThrowCard } from "@/components/throw-card";
import { ChevronRight } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui";

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

/** A recipe this one is partly made of, already on the shelf. */
type Component = {
  /** the address the ingredient points with, which is how it is matched */
  url: string;
  id: string;
  title: string;
  /** the heading its own ingredients and steps were folded in under */
  group: string;
};

export function RecipeView({
  recipe,
  images,
  tags,
  books,
  components = [],
  mine = true,
  planned,
}: {
  recipe: Recipe;
  images: { id: string; kind: "original" | "photo"; rotation: number }[];
  tags: string[];
  books: { id: string; name: string; inBook: boolean }[];
  components?: Component[];
  /**
   * False when this is somebody else's recipe, met through a book they
   * shared. It stays fully readable and cookable; what goes is everything
   * that would write to it, because their box is not ours to annotate.
   */
  mine?: boolean;
  /** on this household's "cooking this week" list, or null if meal planning is turned off */
  planned: boolean | null;
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

  const partByUrl = new Map(components.map((c) => [c.url, c]));
  const partByGroup = new Map(components.map((c) => [c.group, c]));

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <article className="space-y-6 pb-8">
      <div className="no-print">
        <BackButton fallback="/box" label="Back" />
      </div>

      <header>
        <h1 className="font-display ruled text-3xl leading-tight">{recipe.title}</h1>
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

      <div className="no-print sticky top-0 z-20 -mx-4 space-y-2 bg-page px-4 py-2 md:static md:mx-0 md:bg-transparent md:px-0">
        <div className="flex flex-wrap items-center gap-2">
          {[0.5, 1, 2, 3].map((f) => (
            <button
              key={f}
              onClick={() => setFactor(f)}
              className={`tap h-12 min-w-12 rounded-full px-3 text-[0.95rem] font-bold ${
                factor === f ? "bg-pink text-page" : "bg-pink-soft text-pink"
              }`}
            >
              {f === 0.5 ? "½×" : `${f}×`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {planned !== null ? (
            <MealPlanToggle recipeId={recipe.id} planned={planned} />
          ) : null}
          <Link
            href={`/cook/${recipe.id}?x=${factor}`}
            className="tap inline-flex min-w-[9rem] flex-1 items-center justify-center rounded-full bg-pink px-6 font-bold text-page"
          >
            Start cooking
          </Link>
        </div>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        {(mine ? STATUSES : []).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              const next = status === key ? "none" : key;
              setLocalStatus(next);
              startTransition(() => setStatus(recipe.id, next));
            }}
            className={`tap inline-flex h-12 items-center rounded-full border px-4 text-[0.9rem] font-bold ${
              status === key
                ? "border-pink bg-pink text-page"
                : "border-line bg-card text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mine ? (
        <div className="no-print">
          <ButtonLink href={`/r/${recipe.id}/edit`} variant="secondary" className="w-full">
            Correct this card
          </ButtonLink>
        </div>
      ) : null}

      {mine ? <BookPicker recipeId={recipe.id} books={books} /> : null}

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
        <h2 className="font-display ruled mb-3 text-xl">Ingredients</h2>

        {groups.map((group, gi) => {
          // A heading that names a component recipe is a way through to it.
          const heading = partByGroup.get(group.name);
          return (
            <div key={gi} className="mb-4">
              {group.name && heading ? (
                <Link
                  href={`/r/${heading.id}`}
                  className="mb-1 flex items-center gap-1 text-[0.8rem] font-bold tracking-wide text-pink uppercase"
                >
                  {group.name}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : group.name ? (
                <h3 className="mb-1 text-[0.8rem] font-bold tracking-wide text-browned uppercase">
                  {group.name}
                </h3>
              ) : null}
              <ul className="space-y-1">
                {group.items.map((ing, i) => {
                  const key = `${gi}-${i}`;
                  const done = checked.has(key);
                  const part = ing.component
                    ? partByUrl.get(ing.component)
                    : undefined;
                  return (
                    <li key={key} className="flex items-start">
                      <button
                        onClick={() => toggle(key)}
                        className={`no-select flex min-h-12 flex-1 items-start gap-3 rounded-lg px-2 py-2 text-left text-[1.05rem] ${
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
                      {/* Beside the tick rather than inside it, so that
                          checking off an ingredient and opening the recipe it
                          stands for are not the same tap. */}
                      {part ? (
                        <Link
                          href={`/r/${part.id}`}
                          aria-label={`Open ${part.title}`}
                          className="tap -mr-2 flex shrink-0 items-center justify-center text-pink"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

      <section>
        <h2 className="font-display ruled mb-3 text-xl">Steps</h2>
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
                href={`/recipes?tag=${encodeURIComponent(tag)}`}
                className="tap inline-flex h-12 items-center rounded-full bg-pink-soft px-4 text-[0.9rem] font-bold text-pink"
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
        {mine ? (
          <>
            <Button
              variant="secondary"
              onClick={() => startTransition(() => logCook(recipe.id))}
            >
              I made this
            </Button>
            <Link
              href={`/box/all?at=${recipe.id}`}
              className="tap inline-flex items-center justify-center rounded-full text-[0.9rem] font-bold text-browned"
            >
              Flip through from here
            </Link>
            <ThrowCard id={recipe.id} title={recipe.title} />
          </>
        ) : null}
      </div>
    </article>
  );
}
