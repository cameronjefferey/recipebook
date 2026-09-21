"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient, Instruction } from "@/lib/db/schema";
import { formatIngredient, scaleIngredient } from "@/lib/ingredients";
import { logCook } from "@/lib/actions/recipes";

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
  const [showIngredients, setShowIngredients] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();
  const sentinel = useRef<WakeLockSentinel | null>(null);

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

    // The lock is dropped whenever the tab is hidden, so re-take it on return.
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

  const steps = instructions.length ? instructions : [{ text: "No steps written down." }];
  const last = step >= steps.length - 1;
  const scaled = ingredients.map((i) => scaleIngredient(i, factor));

  // Grouped, so a folded-in component is named rather than tipped in among
  // the rest. Ticking is by position in the flat list, which is what the
  // checkboxes were counting before there were headings.
  const groups: { name: string; items: { ing: Ingredient; at: number }[] }[] = [];
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

  const ingredientPane = () => (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[0.5, 1, 2, 3].map((f) => (
          <button
            key={f}
            onClick={() => setFactor(f)}
            className={`tap h-12 min-w-12 rounded-full px-3 font-bold ${
              factor === f ? "bg-pink text-page" : "bg-pink-soft text-pink"
            }`}
          >
            {f === 0.5 ? "½×" : `${f}×`}
          </button>
        ))}
        {servings ? (
          <span className="ml-1 text-muted">
            serves {Math.round(servings * factor)}
          </span>
        ) : null}
      </div>

      {groups.map((group) => (
        <div key={group.name || "all"} className="mb-4">
          {group.name ? (
            <h2 className="mb-1 text-[0.9rem] font-bold tracking-wide text-browned uppercase">
              {group.name}
            </h2>
          ) : null}
          <ul className="space-y-1">
            {group.items.map(({ ing, at }) => {
              const done = checked.has(at);
              return (
                <li key={at}>
                  <button
                    onClick={() => toggleChecked(at)}
                    className={`flex min-h-12 w-full items-start gap-3 rounded-lg px-2 py-3 text-left text-[1.25rem] ${
                      done ? "text-muted line-through" : ""
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-6 w-6 shrink-0 rounded border-2 ${
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
    </>
  );

  const stepPane = (
    <>
      <div className="flex flex-1 flex-col justify-center px-6 py-6">
        <p className="mb-4 text-[0.9rem] font-bold tracking-wide text-browned uppercase">
          Step {step + 1} of {steps.length}
          {steps[step].group ? ` · ${steps[step].group}` : ""}
        </p>
        <p className="text-[1.6rem] leading-snug">{steps[step].text}</p>
      </div>

      <div className="pb-safe flex items-stretch gap-3 px-5 pb-4">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="h-16 flex-1 rounded-full border border-line bg-card text-lg font-bold disabled:opacity-40"
        >
          Back
        </button>
        {last ? (
          <button
            onClick={finish}
            className="h-16 flex-2 rounded-full bg-pink text-lg font-bold text-page"
          >
            I made this
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="h-16 flex-2 rounded-full bg-pink text-lg font-bold text-page"
          >
            Next
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="no-select flex h-dvh flex-col bg-page">
      <header className="pt-safe flex items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={leave}
          className="tap -ml-2 px-2 font-bold text-muted"
        >
          Done
        </button>
        <p className="font-display truncate text-lg">{title}</p>
        <button
          onClick={() => setShowIngredients((v) => !v)}
          className="tap -mr-2 px-2 font-bold text-pink md:hidden"
        >
          {showIngredients ? "Steps" : "Ingredients"}
        </button>
        <span className="tap hidden md:block" aria-hidden />
      </header>

      {/* Phone swaps list and step, and the checks stay put either way.
          A wide screen keeps both: the list on the left, the step on the right. */}
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 md:max-w-[60rem]">
        <aside className="hidden min-h-0 w-[42%] overflow-y-auto border-r border-line px-5 py-4 md:block">
          {ingredientPane()}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {showIngredients ? (
            <div className="flex-1 overflow-y-auto px-5 pb-8 md:hidden">{ingredientPane()}</div>
          ) : null}
          <div
            className={`${showIngredients ? "hidden md:flex" : "flex"} min-h-0 flex-1 flex-col`}
          >
            {stepPane}
          </div>
        </div>
      </div>
    </div>
  );
}
