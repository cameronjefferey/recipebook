"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { BookLeaf, BookRecipe } from "@/lib/books";
import {
  formatIngredient,
  groupIngredients,
  groupInstructions,
} from "@/lib/ingredients";
import { ChevronLeft, ChevronRight, DieIcon } from "@/components/icons";

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
  bookId,
}: {
  pages: BookLeaf[];
  initialIndex: number;
  orders: { key: string; label: string; active: boolean }[];
  bookId: string;
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="no-scrollbar -mx-4 min-w-0 flex-1 overflow-x-auto px-4">
          <ul className="flex gap-2">
            {orders.map(({ key, label, active }) => (
              <li key={key}>
                <Link
                  href={`/book/${bookId}?by=${key}`}
                  className={pill(active)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Bordered rather than filled, so it does not read as a fourth pill. */}
        <button
          onClick={surprise}
          aria-label="Turn to a recipe at random"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-card text-pink active:brightness-95"
        >
          <DieIcon className="h-5 w-5" />
        </button>
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
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <PageButton
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          label="Previous page"
        >
          <ChevronLeft className="h-6 w-6" />
        </PageButton>

        <p className="min-w-0 truncate text-center text-[0.8rem] font-bold tracking-wide text-browned uppercase">
          {section ?? "\u00a0"}
        </p>

        <PageButton
          onClick={() => goTo(index + 1)}
          disabled={index === pages.length - 1}
          label="Next page"
        >
          <ChevronRight className="h-6 w-6" />
        </PageButton>
      </div>
    </div>
  );
}

function pill(active: boolean) {
  return `inline-flex h-9 items-center rounded-full px-3 text-[0.85rem] font-bold whitespace-nowrap ${
    active ? "bg-pink text-page" : "bg-pink-soft text-pink"
  }`;
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="tap flex shrink-0 items-center justify-center rounded-full border border-line bg-card text-pink disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function DividerLeaf({ name, count }: { name: string; count: number }) {
  return (
    <div className="book-page flex h-full flex-col items-center justify-center rounded-card border border-line px-8 text-center">
      <h2 className="font-display text-6xl leading-none text-pink">{name}</h2>
      <span className="mt-5 h-px w-14 bg-pink-mid" />
      <p className="hand mt-4">
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
}: {
  recipe: BookRecipe;
  number: number;
  total: number;
  near: boolean;
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
    <article className="book-page no-scrollbar relative flex h-full flex-col overflow-y-auto rounded-card border border-line">
      {recipe.status === "keeper" ? <span className="ribbon" /> : null}

      {/* Capped, not a fixed ratio: a page is short, and the recipe has to be
          readable without scrolling past a full-bleed photograph first. */}
      {recipe.imageId ? (
        <div className="h-40 max-h-[38%] shrink-0 overflow-hidden bg-sink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/images/${recipe.imageId}`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ rotate: `${recipe.rotation}deg` }}
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
        <h2 className="font-display text-2xl leading-tight">{recipe.title}</h2>
        {meta ? <p className="mt-1 text-[0.82rem] text-muted">{meta}</p> : null}

        {near ? (
          <>
            {recipe.description ? (
              <p className="mt-3 text-[0.95rem] text-muted">
                {recipe.description}
              </p>
            ) : null}

            {recipe.ingredients.length ? (
              <section className="mt-5">
                <h3 className="font-display mb-2 text-lg">Ingredients</h3>
                {ingredients.map((group, gi) => (
                  <div key={gi} className="mb-3">
                    {group.name ? (
                      <h4 className="mb-1 text-[0.75rem] font-bold tracking-wide text-browned uppercase">
                        {group.name}
                      </h4>
                    ) : null}
                    <ul className="space-y-1">
                      {group.items.map((ing, i) => (
                        <li key={i} className="flex gap-2 text-[0.98rem]">
                          <span className="text-pink-mid">·</span>
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
                <h3 className="font-display mb-2 text-lg">Steps</h3>
                {steps.map((group, gi) => (
                  <div key={gi} className="mb-3">
                    {group.name ? (
                      <h4 className="mb-1 text-[0.75rem] font-bold tracking-wide text-browned uppercase">
                        {group.name}
                      </h4>
                    ) : null}
                    <ol className="space-y-2">
                      {group.items.map((step, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="font-display shrink-0 text-pink">
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
              <section className="mt-3 rounded-card bg-sink p-3">
                <p className="hand whitespace-pre-wrap">{recipe.notes}</p>
              </section>
            ) : null}

            <div className="mt-5 flex gap-2">
              <Link
                href={`/r/${recipe.id}`}
                className="tap flex flex-1 items-center justify-center rounded-full border border-line bg-card text-[0.9rem] font-bold text-ink"
              >
                Open
              </Link>
              <Link
                href={`/cook/${recipe.id}`}
                className="tap flex flex-1 items-center justify-center rounded-full bg-pink text-[0.9rem] font-bold text-page"
              >
                Start cooking
              </Link>
            </div>
          </>
        ) : null}

        <p className="font-display mt-auto pt-5 text-center text-[0.82rem] text-muted">
          {number} of {total}
        </p>
      </div>
    </article>
  );
}
