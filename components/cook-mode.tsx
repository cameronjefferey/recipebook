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
}: {
  id: string;
  title: string;
  servings: number | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [factor, setFactor] = useState(1);
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

  function finish() {
    startTransition(async () => {
      await logCook(id);
      router.push(`/r/${id}`);
    });
  }

  return (
    <div className="no-select flex min-h-dvh flex-col bg-page">
      <header className="pt-safe flex items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => router.push(`/r/${id}`)}
          className="tap -ml-2 px-2 font-bold text-muted"
        >
          Done
        </button>
        <p className="font-display truncate text-lg">{title}</p>
        <button
          onClick={() => setShowIngredients((v) => !v)}
          className="tap -mr-2 px-2 font-bold text-pink"
        >
          {showIngredients ? "Steps" : "Ingredients"}
        </button>
      </header>

      {showIngredients ? (
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          <div className="mb-4 flex items-center gap-2">
            {[0.5, 1, 2, 3].map((f) => (
              <button
                key={f}
                onClick={() => setFactor(f)}
                className={`h-11 min-w-13 rounded-full px-3 font-bold ${
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

          <ul className="space-y-1">
            {scaled.map((ing, i) => {
              const done = checked.has(i);
              return (
                <li key={i}>
                  <button
                    onClick={() =>
                      setChecked((prev) => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })
                    }
                    className={`flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left text-[1.25rem] ${
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
      ) : (
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
      )}
    </div>
  );
}
