"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import {
  setPlanned,
  addGroceryExtra,
  setGroceryExtraChecked,
  removeGroceryExtra,
  setGroceryChecked,
  startNewWeek,
} from "@/lib/actions/plan";
import { Eyebrow, Input, Button } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

type Planned = {
  id: string;
  title: string;
  servings: number | null;
  imageId: string | null;
  rotation: number;
};

type Line = { key: string; text: string; from: string[]; checked: boolean };
type Extra = { id: string; text: string; checked: boolean };

type State = { planned: Planned[]; lines: Line[]; extras: Extra[] };

type Action =
  | { kind: "unplan"; id: string }
  | { kind: "line"; key: string; checked: boolean }
  | { kind: "extraChecked"; id: string; checked: boolean }
  | { kind: "extraRemoved"; id: string }
  | { kind: "extraAdded"; id: string; text: string };

function apply(state: State, action: Action): State {
  switch (action.kind) {
    case "unplan":
      return { ...state, planned: state.planned.filter((p) => p.id !== action.id) };
    case "line":
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.key === action.key ? { ...l, checked: action.checked } : l,
        ),
      };
    case "extraChecked":
      return {
        ...state,
        extras: state.extras.map((e) =>
          e.id === action.id ? { ...e, checked: action.checked } : e,
        ),
      };
    case "extraRemoved":
      return { ...state, extras: state.extras.filter((e) => e.id !== action.id) };
    case "extraAdded":
      return {
        ...state,
        extras: [...state.extras, { id: action.id, text: action.text, checked: false }],
      };
  }
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
        checked ? "border-pink bg-pink" : "border-pink-mid bg-card"
      }`}
    >
      {checked ? <CheckIcon className="h-3.5 w-3.5 text-page" /> : null}
    </span>
  );
}

export function PlanClient({
  planned,
  groceryLines,
  extras,
}: {
  planned: Planned[];
  groceryLines: Line[];
  extras: Extra[];
}) {
  const [state, patch] = useOptimistic<State, Action>(
    { planned, lines: groceryLines, extras },
    apply,
  );
  const [pending, startTransition] = useTransition();
  const [extraText, setExtraText] = useState("");

  const unplan = (id: string) => {
    startTransition(async () => {
      patch({ kind: "unplan", id });
      await setPlanned(id, false);
    });
  };

  const toggleLine = (key: string, checked: boolean) => {
    startTransition(async () => {
      patch({ kind: "line", key, checked });
      await setGroceryChecked(key, checked);
    });
  };

  const toggleExtra = (id: string, checked: boolean) => {
    startTransition(async () => {
      patch({ kind: "extraChecked", id, checked });
      await setGroceryExtraChecked(id, checked);
    });
  };

  const removeExtra = (id: string) => {
    startTransition(async () => {
      patch({ kind: "extraRemoved", id });
      await removeGroceryExtra(id);
    });
  };

  const addExtra = () => {
    const text = extraText.trim();
    if (!text) return;
    setExtraText("");
    startTransition(async () => {
      patch({ kind: "extraAdded", id: `pending:${Math.random()}`, text });
      await addGroceryExtra(text);
    });
  };

  const hasAnything = state.planned.length > 0 || state.extras.length > 0;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Eyebrow>Cooking this week</Eyebrow>
        {state.planned.length === 0 ? (
          <p className="text-[0.95rem] text-muted">
            Nothing yet. Open a recipe and tap &ldquo;Cook this week,&rdquo; or{" "}
            <Link href="/box" className="font-bold text-pink underline">
              select a few from the box
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {state.planned.map((recipe) => (
              <li
                key={recipe.id}
                className="flex items-center gap-3 rounded-card border border-line bg-card p-2"
              >
                <Link
                  href={`/r/${recipe.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sink">
                    {recipe.imageId ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/api/images/${recipe.imageId}`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                        style={{ rotate: `${recipe.rotation}deg` }}
                      />
                    ) : (
                      <span className="font-display text-lg text-pink-mid">
                        {recipe.title.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{recipe.title}</span>
                    {recipe.servings ? (
                      <span className="block text-[0.8rem] text-muted">
                        serves {recipe.servings}
                      </span>
                    ) : null}
                  </span>
                </Link>
                <button
                  onClick={() => unplan(recipe.id)}
                  aria-label={`Take ${recipe.title} off this week`}
                  className="tap shrink-0 px-2 text-[0.85rem] font-bold text-jam"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <Eyebrow>Grocery list</Eyebrow>

        {state.lines.length === 0 && state.extras.length === 0 ? (
          <p className="text-[0.95rem] text-muted">
            Add a few meals above and the ingredients will gather here.
          </p>
        ) : (
          <ul className="space-y-1">
            {state.lines.map((line) => (
              <li key={line.key}>
                <button
                  onClick={() => toggleLine(line.key, !line.checked)}
                  aria-pressed={line.checked}
                  className="tap flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left text-[1.05rem]"
                >
                  <Checkbox checked={line.checked} />
                  <span className={line.checked ? "text-muted line-through" : ""}>
                    {line.text}
                    {line.from.length > 1 ? (
                      <span className="mt-0.5 block text-[0.75rem] font-normal text-muted no-underline">
                        for {line.from.join(", ")}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
            {state.extras.map((extra) => (
              <li key={extra.id} className="flex items-center gap-1">
                <button
                  onClick={() => toggleExtra(extra.id, !extra.checked)}
                  aria-pressed={extra.checked}
                  className="tap flex flex-1 items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[1.05rem]"
                >
                  <Checkbox checked={extra.checked} />
                  <span className={extra.checked ? "text-muted line-through" : ""}>
                    {extra.text}
                  </span>
                </button>
                <button
                  onClick={() => removeExtra(extra.id)}
                  aria-label={`Remove ${extra.text}`}
                  className="tap shrink-0 px-3 text-lg text-muted"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Input
            value={extraText}
            onChange={(e) => setExtraText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addExtra();
              }
            }}
            placeholder="Add something else, like paper towels"
            aria-label="Add an item to the grocery list"
            maxLength={80}
          />
          <Button onClick={addExtra} className="shrink-0 px-5">
            Add
          </Button>
        </div>
      </section>

      {hasAnything ? (
        <div className="pt-2 text-center">
          <button
            disabled={pending}
            onClick={() => {
              if (!confirm("Clear this week's plan and grocery list?")) return;
              startTransition(() => startNewWeek());
            }}
            className="tap px-2 text-[0.9rem] font-bold text-muted underline disabled:opacity-50"
          >
            Start a new week
          </button>
        </div>
      ) : null}
    </div>
  );
}
