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
import { CheckIcon, ChevronRight, PencilIcon } from "@/components/icons";
import { Button, HandHeading } from "@/components/ui";

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

/**
 * One card, read. The front of the card is what she needs to cook from:
 * title, how many it serves, the list, the steps, the note in the margin, and
 * one button that says Start cooking. Everything that files, marks or edits
 * the card lives on the back, below.
 */
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
  const [cooked, setCooked] = useState(recipe.timesCooked);
  const [justLogged, setJustLogged] = useState(false);
  const [, startTransition] = useTransition();

  const original = images.find((i) => i.kind === "original") ?? images[0];
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

  const servingsText = recipe.servingsText?.trim();
  const facts = [
    servingsText
      ? /^\d+([–-]\d+)?$/.test(servingsText)
        ? `Serves ${servingsText}`
        : servingsText
      : recipe.servings
        ? `Serves ${recipe.servings}`
        : null,
    recipe.prepMinutes ? `${recipe.prepMinutes} min prep` : null,
    recipe.cookMinutes ? `${recipe.cookMinutes} min cook` : null,
    cooked ? `cooked ${cooked}×` : null,
  ].filter(Boolean);

  return (
    <article className="pb-10">
      <div className="no-print mb-1">
        <BackButton fallback="/box" label="Back to the box" showLabel />
      </div>

      <div className="card-sheet">
        {status === "keeper" ? (
          <span className="ribbon no-print hidden md:block" aria-hidden />
        ) : null}

        <header className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display ruled text-[2.1rem] leading-[1.1] text-balance md:text-[2.6rem]">
              {recipe.title}
            </h1>
            {facts.length ? (
              <p className="mt-2 text-[0.95rem] text-muted">{facts.join(" · ")}</p>
            ) : null}
          </div>

          {original ? (
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              aria-expanded={showOriginal}
              aria-label={
                showOriginal ? "Hide the original card" : "See the original card"
              }
              className="no-print index-card relative mt-1 h-[4.75rem] w-[4.75rem] shrink-0 rotate-2 overflow-hidden border border-line p-0.5 transition-transform active:scale-95 md:h-24 md:w-24"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${original.id}`}
                alt=""
                className="h-full w-full object-cover"
                style={{ rotate: `${original.rotation}deg` }}
              />
            </button>
          ) : null}
        </header>

        {showOriginal && original ? (
          <figure className="no-print mt-4 overflow-hidden rounded-[3px] border border-line bg-sink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/images/${original.id}`}
              alt={`The original card for ${recipe.title}`}
              className="mx-auto max-h-[70dvh] w-full object-contain"
              style={{ rotate: `${original.rotation}deg` }}
            />
            <figcaption className="hand px-4 py-2 text-[0.95rem]">
              the card as it was written
            </figcaption>
          </figure>
        ) : null}

        {recipe.description ? (
          <p className="mt-4 max-w-[62ch] text-[1.05rem] leading-relaxed text-muted">
            {recipe.description}
          </p>
        ) : null}

        {/* The one thing to do with a recipe, kept under the thumb on a
            phone while she reads, and in the card's own header on a tablet. */}
        <div className="no-print mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 md:mt-5">
          <span className="hand text-[1.05rem]">Make</span>
          <div
            className="flex items-center gap-1 rounded-full bg-pink-soft p-1"
            role="group"
            aria-label="Scale the recipe"
          >
            {[0.5, 1, 2, 3].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFactor(f)}
                aria-pressed={factor === f}
                className={`tap h-11 min-w-11 rounded-full px-2 text-[1rem] font-bold transition-colors ${
                  factor === f ? "bg-pink-deep text-page" : "text-pink-deep"
                }`}
              >
                {f === 0.5 ? "½×" : `${f}×`}
              </button>
            ))}
          </div>
          <span className="hand text-[1.05rem]">the recipe</span>
        </div>

        {/* Kept under the thumb on a phone while she reads down the list;
            on a tablet the whole card is in view and it just sits here. */}
        <div className="no-print sticky top-0 z-20 -mx-4 mt-3 bg-page/95 px-4 py-2.5 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:py-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/cook/${recipe.id}?x=${factor}`}
              className="tap inline-flex min-w-0 flex-1 items-center justify-center rounded-full bg-pink px-6 text-[1.15rem] font-bold text-page shadow-[0_2px_6px_#382a2226] md:max-w-[20rem]"
            >
              Start cooking
            </Link>
            {planned !== null ? (
              <MealPlanToggle recipeId={recipe.id} planned={planned} />
            ) : null}
          </div>
        </div>

        <div className="mt-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-x-10">
          <section>
            <HandHeading className="ruled mb-3">Ingredients</HandHeading>

            {groups.map((group, gi) => {
              // A heading that names a component recipe is a way through to it.
              const heading = partByGroup.get(group.name);
              return (
                <div key={gi} className="mb-4">
                  {group.name && heading ? (
                    <Link
                      href={`/r/${heading.id}`}
                      className="hand mb-1 flex items-center gap-0.5 text-[1.05rem] text-pink-deep"
                    >
                      {group.name}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : group.name ? (
                    <h3 className="hand mb-1 text-[1.05rem]">{group.name}</h3>
                  ) : null}
                  <ul>
                    {group.items.map((ing, i) => {
                      const key = `${gi}-${i}`;
                      const done = checked.has(key);
                      const part = ing.component
                        ? partByUrl.get(ing.component)
                        : undefined;
                      return (
                        <li key={key} className="flex items-start">
                          <button
                            type="button"
                            onClick={() => toggle(key)}
                            aria-pressed={done}
                            className={`no-select -mx-2 flex min-h-12 flex-1 items-start gap-3 rounded-lg px-2 py-2.5 text-left text-[1.05rem] leading-snug ${
                              done ? "text-muted line-through" : ""
                            }`}
                          >
                            <span
                              className={`mt-0.5 h-5 w-5 shrink-0 rounded-[4px] border-2 ${
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
                              className="tap -mr-2 flex shrink-0 items-center justify-center text-pink-deep"
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

          <section className="mt-2 md:mt-0">
            <HandHeading className="ruled mb-3">Steps</HandHeading>
            {stepGroups.map((group, gi) => (
              <div key={gi} className="mb-4">
                {group.name ? (
                  <h3 className="hand mb-1 text-[1.05rem]">{group.name}</h3>
                ) : null}
                <ol className="space-y-3.5">
                  {group.items.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-display w-6 shrink-0 text-right text-[1.35rem] leading-[1.6] text-pink-deep">
                        {i + 1}
                      </span>
                      <p className="max-w-[62ch] text-[1.08rem] leading-relaxed">
                        {step.text}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        </div>

        {recipe.notes ? (
          <aside className="mt-6 -rotate-[0.4deg] rounded-[3px] bg-sink px-4 py-3 md:mr-[20%]">
            <p className="hand text-[1.15rem] whitespace-pre-wrap">{recipe.notes}</p>
          </aside>
        ) : null}

        {recipe.sourceName || recipe.sourceUrl ? (
          <p className="mt-5 text-[0.9rem] text-muted">
            From{" "}
            {recipe.sourceUrl ? (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {recipe.sourceName ?? recipe.sourceUrl}
              </a>
            ) : (
              recipe.sourceName
            )}
          </p>
        ) : null}
      </div>

      {/* The back of the card: marks, filing, fixing. Never printed. */}
      <div className="no-print mt-8 space-y-7 px-1 md:px-2">
        {mine ? (
          <section>
            <HandHeading className="mb-2">What did we think?</HandHeading>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    const next = status === key ? "none" : key;
                    setLocalStatus(next);
                    startTransition(() => setStatus(recipe.id, next));
                  }}
                  aria-pressed={status === key}
                  className={`tap inline-flex h-12 items-center rounded-full border px-5 text-[1rem] font-bold transition-colors ${
                    status === key
                      ? "border-pink-deep bg-pink-deep text-page"
                      : "border-line bg-card text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {mine ? <BookPicker recipeId={recipe.id} books={books} /> : null}

        {tags.length ? (
          <section>
            <HandHeading className="mb-2">Also under</HandHeading>
            <ul className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/box?q=${encodeURIComponent(tag)}`}
                    className="tap inline-flex h-12 items-center rounded-full bg-pink-soft px-4 text-[0.95rem] font-bold text-pink-deep"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {mine ? (
          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <div>
              <HandHeading className="mb-1">Keeping count</HandHeading>
              <p className="mb-3 text-[0.95rem] text-muted">
                {cooked === 0
                  ? "Never cooked yet. Tap when you make it and the card starts to show its use."
                  : `Cooked ${cooked} ${cooked === 1 ? "time" : "times"} so far. Tap when you make it again.`}
              </p>
              <Button
                variant={justLogged ? "primary" : "secondary"}
                className="min-w-[13rem]"
                aria-live="polite"
                onClick={() => {
                  setCooked((n) => n + 1);
                  setJustLogged(true);
                  startTransition(() => logCook(recipe.id));
                }}
              >
                {justLogged ? (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    Counted, that makes {cooked}
                  </>
                ) : (
                  "I cooked this today"
                )}
              </Button>
            </div>
            {/* Rare things, written small: pencil in a change, keep flipping,
                or throw the card out. None of them earns a button. */}
            <div className="-ml-2 mt-2 flex flex-col items-start gap-1">
              <Link
                href={`/r/${recipe.id}/edit`}
                className="tap inline-flex items-center gap-1.5 rounded-full px-2 text-[1rem] font-bold text-browned"
              >
                <PencilIcon className="h-5 w-5" />
                Edit this card
              </Link>
              <Link
                href={`/box/all?at=${recipe.id}`}
                className="tap inline-flex items-center gap-1.5 rounded-full px-2 text-[1rem] font-bold text-browned"
              >
                Flip through from here
                <ChevronRight className="h-4 w-4" />
              </Link>
              <ThrowCard id={recipe.id} title={recipe.title} />
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
