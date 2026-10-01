"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BookLeaf, BookRecipe } from "@/lib/books";
import {
  formatIngredient,
  groupIngredients,
  groupInstructions,
} from "@/lib/ingredients";
import { MealPlanToggle } from "@/components/meal-plan-toggle";

/**
 * The box read as a book. Pages are a horizontal scroll-snap track, so the
 * swipe is the browser's own: no gesture handling, and it keeps momentum,
 * rubber-banding and accessibility for free. Arrow keys and the buttons drive
 * the same scroll.
 */
export function BookClient({
  pages,
  initialIndex,
  orders,
  basePath,
  query,
  imageBase = "/api/images",
  showActions = true,
  plannedIds = null,
}: {
  pages: BookLeaf[];
  initialIndex: number;
  orders: { key: string; label: string; active: boolean }[];
  /** where the ordering pills point, e.g. "/book/<id>" */
  basePath: string;
  /** kept on the order links so a search is not thrown away */
  query?: string;
  /** photo URLs hang off this, so a guest can be served through their token */
  imageBase?: string;
  /** off for guests, who have nowhere to open or cook a recipe */
  showActions?: boolean;
  /**
   * Ids on this week's list. Null when meal planning is off, so the
   * control stays hidden. An empty list still shows "Cook this week".
   */
  plannedIds?: string[] | null;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(initialIndex);

  /** Recipe pages are numbered; chapter dividers are not. */
  const numbers = useMemo(() => {
    let n = 0;
    return pages.map((p) => (p.kind === "recipe" ? ++n : 0));
  }, [pages]);
  const total = useMemo(
    () => pages.reduce((n, p) => n + (p.kind === "recipe" ? 1 : 0), 0),
    [pages],
  );

  const goTo = useCallback(
    (to: number, smooth = true) => {
      const el = trackRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(pages.length - 1, to));
      el.scrollTo({
        left: clamped * el.clientWidth,
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [pages.length],
  );

  // Follow the scroll position rather than assuming our own button presses
  // won, so a thumb swipe and a click stay in agreement.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = el.clientWidth || 1;
        const next = Math.round(el.scrollLeft / width);
        setIndex(Math.max(0, Math.min(pages.length - 1, next)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, [pages.length]);

  // Arriving from a recipe opens the book at that page, already turned.
  useEffect(() => {
    const el = trackRef.current;
    if (el && initialIndex > 0) el.scrollLeft = initialIndex * el.clientWidth;
  }, [initialIndex]);

  // A rotation or a resized window would otherwise leave us between pages.
  useEffect(() => {
    const onResize = () => goTo(index, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [goTo, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  const surprise = useCallback(() => {
    const recipePages = pages.flatMap((p, i) => (p.kind === "recipe" ? [i] : []));
    if (recipePages.length < 2) return;
    let next = index;
    while (next === index) {
      next = recipePages[Math.floor(Math.random() * recipePages.length)];
    }
    goTo(next);
  }, [goTo, index, pages]);

  // Which letter we are under is whatever divider we last passed.
  const section = useMemo(() => {
    for (let i = Math.min(index, pages.length - 1); i >= 0; i--) {
      const page = pages[i];
      if (page.kind === "divider") return page.name;
    }
    return null;
  }, [index, pages]);

  const currentOrder = orders.find((o) => o.active) ?? orders[0];
  const nextOrder =
    orders[
      (orders.findIndex((o) => o.key === currentOrder.key) + 1) % orders.length
    ];

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[34rem] flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="no-scrollbar min-w-0 flex-1">
          <ul className="flex gap-2">
            <li>
              <Link
                href={orderHref(basePath, nextOrder.key, query)}
                className="tap margin-word margin-on"
                aria-label={`Sorted by ${currentOrder.label}. Change to ${nextOrder.label}.`}
              >
                {currentOrder.label}
              </Link>
            </li>
          </ul>
        </div>
        {total > 1 ? (
          <button onClick={surprise} className="tap margin-word shrink-0">
            surprise
          </button>
        ) : null}
      </div>

      <div
        ref={trackRef}
        role="region"
        aria-label="Recipe pages"
        className="no-scrollbar -mx-4 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {pages.map((page, i) => (
          <div
            key={page.key}
            className="w-full shrink-0 snap-center snap-always px-4"
          >
            {page.kind === "divider" ? (
              <DividerLeaf name={page.name} count={page.count} />
            ) : (
              <RecipeLeaf
                recipe={page.recipe}
                number={numbers[i]}
                total={total}
                near={Math.abs(i - index) <= 1}
                imageBase={imageBase}
                showActions={showActions}
                plannedIds={plannedIds}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="tap margin-word disabled:opacity-35"
        >
          back
        </button>

        <p className="hand min-w-0 truncate text-center">{section ?? "\u00a0"}</p>

        <button
          onClick={() => goTo(index + 1)}
          disabled={index === pages.length - 1}
          className="tap margin-word disabled:opacity-35"
        >
          next card
        </button>
      </div>
    </div>
  );
}

function orderHref(basePath: string, key: string, query?: string) {
  const params = new URLSearchParams({ by: key });
  if (query?.trim()) params.set("q", query.trim());
  return `${basePath}?${params}`;
}

function DividerLeaf({ name, count }: { name: string; count: number }) {
  return (
    <div className="reading-card flex h-full min-h-[24rem] flex-col items-center justify-center text-center">
      <span className="divider-tab">{name}</span>
      <h2 className="font-display mt-6 text-5xl leading-none text-ink">{name}</h2>
      <p className="mt-4">
        {count} {count === 1 ? "recipe" : "recipes"}
      </p>
    </div>
  );
}

/**
 * `near` keeps the body of far-off pages out of the DOM. Every page still
 * renders its photo and title, so flicking quickly never shows a blank leaf.
 */
function RecipeLeaf({
  recipe,
  number,
  total,
  near,
  imageBase,
  showActions,
  plannedIds,
}: {
  recipe: BookRecipe;
  number: number;
  total: number;
  near: boolean;
  imageBase: string;
  showActions: boolean;
  plannedIds: string[] | null;
}) {
  const ingredients = groupIngredients(recipe.ingredients);
  const steps = groupInstructions(recipe.instructions);

  const meta = [
    recipe.servingsText ??
      (recipe.servings ? `Serves ${recipe.servings}` : null),
    recipe.prepMinutes ? `${recipe.prepMinutes} min prep` : null,
    recipe.cookMinutes ? `${recipe.cookMinutes} min cook` : null,
    recipe.timesCooked ? `cooked ${recipe.timesCooked}×` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="reading-card no-scrollbar flex h-full min-h-[28rem] flex-col overflow-y-auto">
      {recipe.status === "keeper" ? <span className="keeper-mark">keeper</span> : null}
      {recipe.imageId ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${imageBase}/${recipe.imageId}`}
          alt=""
          loading="lazy"
          className="float-right ml-3 h-16 w-16 object-cover"
          style={{ rotate: `${recipe.rotation}deg` }}
        />
      ) : null}

      <div className="flex flex-1 flex-col">
        <h2 className="font-display text-[1.7rem] leading-tight">{recipe.title}</h2>
        {meta ? <p className="mt-1 text-muted">{meta}</p> : null}

        {showActions ? (
          <div className="margin-row justify-start">
            {plannedIds ? (
              <MealPlanToggle
                recipeId={recipe.id}
                planned={plannedIds.includes(recipe.id)}
              />
            ) : null}
            <Link href={`/cook/${recipe.id}`} className="tap margin-word">
              Start cooking
            </Link>
            <Link href={`/r/${recipe.id}`} className="tap margin-word">
              Open
            </Link>
          </div>
        ) : null}

        {near ? (
          <>
            {recipe.description ? (
              <p className="mt-3 text-[0.95rem] text-muted">
                {recipe.description}
              </p>
            ) : null}

            {recipe.ingredients.length ? (
              <section className="mt-5">
                <h3 className="hand mb-1">Ingredients</h3>
                {ingredients.map((group, gi) => (
                  <div key={gi} className="mb-3">
                    {group.name ? (
                      <h4 className="hand">
                        {group.name}
                      </h4>
                    ) : null}
                    <ul className="space-y-1">
                      {group.items.map((ing, i) => (
                        <li key={i} className="flex gap-2 text-[0.98rem]">
                          <span className="text-muted">·</span>
                          <span>{formatIngredient(ing)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ) : null}

            {recipe.instructions.length ? (
              <section className="mt-3">
                <h3 className="hand mb-1">Steps</h3>
                {steps.map((group, gi) => (
                  <div key={gi} className="mb-3">
                    {group.name ? (
                      <h4 className="hand">
                        {group.name}
                      </h4>
                    ) : null}
                    <ol className="space-y-2">
                      {group.items.map((step, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-[0.98rem] leading-relaxed">
                            {step.text}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </section>
            ) : null}

            {recipe.notes ? (
              <section className="mt-3">
                <p className="hand whitespace-pre-wrap">{recipe.notes}</p>
              </section>
            ) : null}

            {showActions ? (
              <div className="margin-row">
                <Link href={`/r/${recipe.id}`} className="tap margin-word">
                  Open
                </Link>
                <Link href={`/cook/${recipe.id}`} className="tap margin-word">
                  Start cooking
                </Link>
              </div>
            ) : null}
          </>
        ) : null}

        <p className="mt-auto pt-4 text-center text-muted">
          {number} of {total}
        </p>
      </div>
    </article>
  );
}
