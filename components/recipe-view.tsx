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

  const meta = [
    recipe.servingsText ?? (recipe.servings ? `Serves ${recipe.servings}` : null),
    recipe.prepMinutes ? `${recipe.prepMinutes} min prep` : null,
    recipe.cookMinutes ? `${recipe.cookMinutes} min cook` : null,
    recipe.timesCooked ? `cooked ${recipe.timesCooked}×` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-[34rem] pb-8">
      <div className="no-print mb-1 flex items-end justify-between">
        <BackButton fallback="/box" label="Back" />
        {recipe.category ? (
          <span className="divider-tab">{recipe.category}</span>
        ) : null}
      </div>

      <article className="reading-card">
        {status === "keeper" ? <span className="keeper-mark">keeper</span> : null}

        <h1 className="font-display text-[1.7rem] leading-tight">{recipe.title}</h1>

        <div className="no-print margin-row">
          {[0.5, 1, 2, 3].map((f) => (
            <button
              key={f}
              onClick={() => setFactor(f)}
              className={`tap margin-word ${factor === f ? "margin-on" : ""}`}
            >
              {f === 0.5 ? "½×" : `${f}×`}
            </button>
          ))}
          {planned !== null ? (
            <MealPlanToggle recipeId={recipe.id} planned={planned} />
          ) : null}
          <Link href={`/cook/${recipe.id}?x=${factor}`} className="tap margin-word">
            Start cooking
          </Link>
        </div>

        <div className="ruled-lines mt-2">
          {recipe.description ? <p className="text-muted">{recipe.description}</p> : null}
          {meta ? <p>{meta}</p> : null}
          {recipe.notes ? <p className="hand">{recipe.notes}</p> : null}

          <p className="hand mt-2">Ingredients</p>
          {groups.map((group, gi) => {
            const heading = partByGroup.get(group.name);
            return (
              <div key={gi}>
                {group.name && heading ? (
                  <Link href={`/r/${heading.id}`} className="hand text-ink">
                    {group.name}
                  </Link>
                ) : group.name ? (
                  <p className="hand">{group.name}</p>
                ) : null}
                {group.items.map((ing, i) => {
                  const key = `${gi}-${i}`;
                  const done = checked.has(key);
                  const part = ing.component ? partByUrl.get(ing.component) : undefined;
                  return (
                    <p key={key} className="flex items-baseline gap-2">
                      <button
                        onClick={() => toggle(key)}
                        className={`min-h-12 flex-1 text-left ${done ? "text-muted line-through" : ""}`}
                      >
                        {formatIngredient(ing)}
                      </button>
                      {part ? (
                        <Link href={`/r/${part.id}`} className="margin-word shrink-0" aria-label={`Open ${part.title}`}>
                          open
                        </Link>
                      ) : null}
                    </p>
                  );
                })}
              </div>
            );
          })}

          <p className="hand mt-2">Steps</p>
          {stepGroups.map((group, gi) => (
            <div key={gi}>
              {group.name ? <p className="hand">{group.name}</p> : null}
              {group.items.map((step, i) => (
                <p key={i}>
                  {i + 1}. {step.text}
                </p>
              ))}
            </div>
          ))}

          {recipe.sourceName || recipe.sourceUrl ? (
            <p className="text-muted">
              From{" "}
              {recipe.sourceUrl ? (
                <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {recipe.sourceName ?? recipe.sourceUrl}
                </a>
              ) : (
                recipe.sourceName
              )}
            </p>
          ) : null}
        </div>

        {tags.length ? (
          <p className="no-print mt-2 text-muted">
            {tags.map((tag, i) => (
              <span key={tag}>
                {i > 0 ? " · " : null}
                <Link href={`/recipes?tag=${encodeURIComponent(tag)}`} className="underline underline-offset-2">
                  {tag}
                </Link>
              </span>
            ))}
          </p>
        ) : null}

        {original ? (
          <section className="no-print mt-2">
            <button onClick={() => setShowOriginal((v) => !v)} className="tap margin-word">
              {showOriginal ? "Hide the original" : "See the original"}
            </button>
            {showOriginal ? (
              <div className="mt-2 overflow-hidden">
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

        {mine ? <BookPicker recipeId={recipe.id} books={books} /> : null}

        <div className="no-print margin-row">
          {mine
            ? STATUSES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    const next = status === key ? "none" : key;
                    setLocalStatus(next);
                    startTransition(() => setStatus(recipe.id, next));
                  }}
                  className={`tap margin-word ${status === key ? "margin-on" : ""}`}
                >
                  {label}
                </button>
              ))
            : null}
          {mine ? (
            <ButtonLink href={`/r/${recipe.id}/edit`} variant="secondary">
              Correct this card
            </ButtonLink>
          ) : null}
          {mine ? (
            <Button variant="secondary" onClick={() => startTransition(() => logCook(recipe.id))}>
              I made this
            </Button>
          ) : null}
          <Link href={`/box/all?at=${recipe.id}`} className="tap margin-word">
            Flip through from here
          </Link>
          {mine ? <ThrowCard id={recipe.id} title={recipe.title} /> : null}
        </div>
      </article>
    </div>
  );
}
