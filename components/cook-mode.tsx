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
    <div className="ruled-lines">
      <div className="margin-row justify-start">
        {[0.5, 1, 2, 3].map((f) => (
          <button
            key={f}
            onClick={() => setFactor(f)}
            className={`tap margin-word ${factor === f ? "margin-on" : ""}`}
          >
            {f === 0.5 ? "½×" : `${f}×`}
          </button>
        ))}
        {servings ? (
          <span className="text-muted">serves {Math.round(servings * factor)}</span>
        ) : null}
      </div>
      {groups.map((group) => (
        <div key={group.name || "all"}>
          {group.name ? <p className="hand">{group.name}</p> : null}
          {group.items.map(({ ing, at }) => {
            const done = checked.has(at);
            return (
              <button
                key={at}
                onClick={() => toggleChecked(at)}
                className={`block min-h-12 w-full text-left ${done ? "text-muted line-through" : ""}`}
              >
                {formatIngredient(ing)}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const stepPane = (
    <div>
      <p className="hand">
        step {step + 1} of {steps.length}
        {steps[step].group ? ` · ${steps[step].group}` : ""}
      </p>
      <p className="mt-2 text-[1.25rem] leading-snug">{steps[step].text}</p>
      <div className="margin-row mt-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="tap margin-word disabled:opacity-40"
        >
          back
        </button>
        {last ? (
          <button onClick={finish} className="tap margin-word margin-on">
            I made this
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="tap margin-word margin-on"
          >
            next
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="no-select flex min-h-dvh items-start justify-center bg-page px-4 py-6">
      <article className="reading-card wide">
        <div className="mb-2 flex items-start justify-between gap-3">
          <button onClick={leave} className="tap margin-word shrink-0">
            done
          </button>
          <h1 className="font-display min-w-0 flex-1 truncate text-center text-[1.45rem]">{title}</h1>
          <button
            onClick={() => setShowIngredients((v) => !v)}
            className="tap margin-word shrink-0 md:hidden"
          >
            {showIngredients ? "the step" : "ingredients"}
          </button>
        </div>

        {/* Phone swaps list and step. A wide screen keeps both, side by side,
            in the same card so neither half is an empty page. */}
        <div className="md:grid md:grid-cols-2 md:items-start md:gap-8">
          <div className={showIngredients ? "md:block" : "hidden md:block"}>{ingredientPane()}</div>
          <div className={showIngredients ? "hidden md:block" : "block"}>{stepPane}</div>
        </div>
      </article>
    </div>
  );
}
