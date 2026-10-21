"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient, Instruction } from "@/lib/db/schema";
import { formatIngredient, scaleIngredient } from "@/lib/ingredients";
import {
  ingredientsMentionedIn,
  leftoverIngredients,
} from "@/lib/cook-match";
import { logCook } from "@/lib/actions/recipes";

type CookView = "step" | "card" | "list";

const VIEW_KEY = "pinkbox-cook-view";

const VIEWS: { key: CookView; label: string }[] = [
  { key: "step", label: "This step" },
  { key: "card", label: "All steps" },
  { key: "list", label: "The list" },
];

export function CookMode({
  id,
  title,
  servings,
  ingredients,
  instructions,
  initialFactor = 1,
}: {
  id: string;
  title: string;
  servings: number | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
  initialFactor?: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [factor, setFactor] = useState(initialFactor);
  const [view, setView] = useState<CookView>("step");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();
  const sentinel = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_KEY);
      if (stored === "step" || stored === "card" || stored === "list") {
        setView(stored);
      }
    } catch {
      // private mode; the default still works
    }
  }, []);

  const chooseView = (next: CookView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // ignore
    }
  };

  // Keep the screen on. Hands are covered in flour; nobody wants to tap to
  // wake the phone between steps.
  useEffect(() => {
    let cancelled = false;

    async function acquire() {
      try {
        if (!("wakeLock" in navigator)) return;
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await lock.release();
          return;
        }
        sentinel.current = lock;
      } catch {
        // Denied or unsupported; cooking still works, the screen just dims.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      sentinel.current?.release().catch(() => {});
      sentinel.current = null;
    };
  }, []);

  const steps = instructions.length
    ? instructions
    : [{ text: "No steps written down." }];
  const last = step >= steps.length - 1;
  const scaled = ingredients.map((i) => scaleIngredient(i, factor));
  const leftover = leftoverIngredients(steps, scaled);

  const groups: { name: string; items: { ing: Ingredient; at: number }[] }[] =
    [];
  scaled.forEach((ing, at) => {
    const name = ing.group?.trim() ?? "";
    const group = groups.find((g) => g.name === name);
    if (group) group.items.push({ ing, at });
    else groups.push({ name, items: [{ ing, at }] });
  });

  const leave = () => router.replace(`/r/${id}`);

  function finish() {
    startTransition(async () => {
      await logCook(id);
      router.replace(`/r/${id}`);
    });
  }

  const toggleChecked = (at: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(at)) next.delete(at);
      else next.add(at);
      return next;
    });

  const SCALES = [0.5, 1, 2, 3] as const;
  const nextFactor =
    SCALES[(SCALES.indexOf(factor as (typeof SCALES)[number]) + 1) % SCALES.length] ?? 1;
  const scaleLabel = factor === 0.5 ? "½×" : `${factor}×`;
  const nextLabel = nextFactor === 0.5 ? "½×" : `${nextFactor}×`;
  const servingNote =
    servings != null ? `serves ${Math.round(servings * factor)}` : null;

  const amountList = (indexes: number[], compact = false) =>
    indexes.length === 0 ? null : (
      <ul className={compact ? "mt-3 space-y-0.5" : "space-y-1"}>
        {indexes.map((at) => {
          const done = checked.has(at);
          return (
            <li key={at}>
              <button
                onClick={() => toggleChecked(at)}
                className={`flex min-h-12 w-full items-start gap-3 rounded-lg px-2 py-2 text-left ${
                  compact ? "text-[1.05rem]" : "text-[1.25rem]"
                } ${done ? "text-muted line-through" : ""}`}
              >
                <span
                  className={`mt-1.5 h-6 w-6 shrink-0 rounded border-2 ${
                    done ? "border-pink bg-pink" : "border-pink-mid"
                  }`}
                />
                <span>{formatIngredient(scaled[at])}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );

  const ingredientPane = () => (
    <>
      {servingNote ? (
        <p className="hand mb-3 text-browned">{servingNote}</p>
      ) : null}
      {groups.map((group) => (
        <div key={group.name || "all"} className="mb-4">
          {group.name ? (
            <h2 className="mb-1 text-[0.9rem] font-bold tracking-wide text-browned uppercase">
              {group.name}
            </h2>
          ) : null}
          {amountList(group.items.map((item) => item.at))}
        </div>
      ))}
    </>
  );

  const stepAmounts = ingredientsMentionedIn(steps[step].text, scaled);

  const nextPrev = (
    <div className="pb-safe flex shrink-0 items-stretch gap-2 bg-page px-4 pt-2">
      <button
        onClick={() => setStep((s) => Math.max(0, s - 1))}
        disabled={step === 0}
        className="h-12 flex-1 rounded-full border border-line bg-card text-[1.05rem] font-bold disabled:opacity-40"
      >
        Back
      </button>
      {last ? (
        <button
          onClick={finish}
          className="h-12 flex-[2] rounded-full bg-pink text-[1.05rem] font-bold text-page"
        >
          I made this
        </button>
      ) : (
        <button
          onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
          className="h-12 flex-[2] rounded-full bg-pink text-[1.05rem] font-bold text-page"
        >
          Next
        </button>
      )}
    </div>
  );

  const stepPane = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        <p className="mb-4 text-[0.9rem] font-bold tracking-wide text-browned uppercase">
          Step {step + 1} of {steps.length}
          {steps[step].group ? ` · ${steps[step].group}` : ""}
        </p>
        <p className="text-[1.6rem] leading-snug">{steps[step].text}</p>
        {stepAmounts.length ? (
          <div className="mt-5">
            <p className="hand text-[1.05rem] text-browned">for this step</p>
            {amountList(stepAmounts, true)}
          </div>
        ) : (
          <p className="hand mt-5 text-muted">
            this step does not name a quantity — the list has the rest
          </p>
        )}
      </div>
      {nextPrev}
    </>
  );

  const cardPane = (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3 pb-8">
      {leftover.length ? (
        <section className="mb-6">
          <p className="hand mb-1 text-[1.1rem] text-browned">have these ready</p>
          {amountList(leftover, true)}
        </section>
      ) : null}
      {steps.map((s, i) => (
        <section key={i} className="mb-6 border-t border-line pt-4">
          <p className="mb-2 text-[0.8rem] font-bold tracking-wide text-browned uppercase">
            Step {i + 1}
            {s.group ? ` · ${s.group}` : ""}
          </p>
          <p className="text-[1.25rem] leading-snug">{s.text}</p>
          {amountList(ingredientsMentionedIn(s.text, scaled), true)}
        </section>
      ))}
      <button
        onClick={finish}
        className="tap mt-2 w-full rounded-full bg-pink py-4 text-lg font-bold text-page"
      >
        I made this
      </button>
    </div>
  );

  return (
    <div className="no-select flex h-dvh flex-col bg-page">
      <header className="pt-safe shrink-0">
        <div className="mx-auto flex h-11 max-w-lg items-center gap-2 px-3 md:max-w-[60rem]">
          <button
            onClick={leave}
            className="-ml-1 shrink-0 px-2 text-[0.95rem] font-bold text-muted"
          >
            Done
          </button>
          <p className="font-display min-w-0 flex-1 truncate text-lg leading-none">
            {title}
          </p>
          <button
            onClick={() => setFactor(nextFactor)}
            aria-label={`Scaled ${scaleLabel}${servingNote ? `, ${servingNote}` : ""}. Change to ${nextLabel}.`}
            className={`h-9 shrink-0 rounded-full px-3 text-[0.85rem] font-bold ${
              factor === 1 ? "bg-pink-soft text-pink" : "bg-pink text-page"
            }`}
          >
            {scaleLabel}
          </button>
        </div>
        <div className="px-3 pb-2">
          <div
            className="mx-auto flex w-full max-w-lg gap-1 rounded-full bg-sink p-1 md:max-w-[60rem]"
            role="group"
            aria-label="How to show the recipe"
          >
            {VIEWS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => chooseView(key)}
                aria-pressed={view === key}
                className={`tap h-11 flex-1 rounded-full text-[1rem] font-bold transition-colors ${
                  view === key
                    ? "bg-pink-deep text-page shadow-[0_1px_3px_#382a2233]"
                    : "text-browned"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 md:max-w-[60rem]">
        {view === "step" ? (
          <>
            <aside className="hidden min-h-0 w-[42%] overflow-y-auto border-r border-line px-5 py-4 md:block">
              {ingredientPane()}
            </aside>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">{stepPane}</div>
          </>
        ) : view === "card" ? (
          cardPane
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-3 pb-8">
            {ingredientPane()}
          </div>
        )}
      </div>
    </div>
  );
}
