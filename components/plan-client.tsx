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
import { CategoryIcon } from "@/lib/category-icon";
import {
  groceryAisleFromText,
  groupByAisle,
  type GroceryAisle,
} from "@/lib/grocery-aisle";

type Planned = {
  id: string;
  title: string;
  category: string | null;
  servings: number | null;
  imageId: string | null;
  rotation: number;
};

type Line = {
  key: string;
  text: string;
  from: string[];
  checked: boolean;
  aisle: GroceryAisle;
};
type Extra = { id: string; text: string; checked: boolean; aisle: GroceryAisle };

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
        extras: [
          ...state.extras,
          {
            id: action.id,
            text: action.text,
            checked: false,
            aisle: groceryAisleFromText(action.text),
          },
        ],
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

  const grocery = groupByAisle([
    ...state.lines.map((line) => ({ ...line, kind: "line" as const })),
    ...state.extras.map((extra) => ({ ...extra, kind: "extra" as const })),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Eyebrow>Cooking this week</Eyebrow>
        {state.planned.length === 0 ? (
          <p className="text-[0.95rem] text-muted">
            Nothing yet. Open a recipe and tap &ldquo;Cook this week,&rdquo; or{" "}
            <Link href="/recipes" className="font-bold text-pink underline">
              pick a few cards
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {state.planned.map((recipe) => (
              <li
                key={recipe.id}
                className="flex items-center gap-3 rounded-[3px] border border-line bg-card p-2"
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
                      <CategoryIcon category={recipe.category} className="h-6 w-6 text-pink-mid" />
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

        {grocery.length === 0 ? (
          <p className="text-[0.95rem] text-muted">
            Add a few meals above and the ingredients will gather here.
          </p>
        ) : (
          <div className="space-y-5">
            {grocery.map(({ aisle, items }) => (
              <div key={aisle} className="space-y-1">
                <h2 className="hand px-2 text-[1.15rem] text-browned">{aisle}</h2>
                <ul>
                  {items.map((item) =>
                    item.kind === "line" ? (
                      <li key={item.key}>
                        <button
                          onClick={() => toggleLine(item.key, !item.checked)}
                          aria-pressed={item.checked}
                          className="tap flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left text-[1.05rem]"
                        >
                          <Checkbox checked={item.checked} />
                          <span className={item.checked ? "text-muted line-through" : ""}>
                            {item.text}
                            {item.from.length > 1 ? (
                              <span className="mt-0.5 block text-[0.75rem] font-normal text-muted no-underline">
                                for {item.from.join(", ")}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    ) : (
                      <li key={item.id} className="flex items-center gap-1">
                        <button
                          onClick={() => toggleExtra(item.id, !item.checked)}
                          aria-pressed={item.checked}
                          className="tap flex flex-1 items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[1.05rem]"
                        >
                          <Checkbox checked={item.checked} />
                          <span className={item.checked ? "text-muted line-through" : ""}>
                            {item.text}
                          </span>
                        </button>
                        <button
                          onClick={() => removeExtra(item.id)}
                          aria-label={`Remove ${item.text}`}
                          className="tap shrink-0 px-3 text-lg text-muted"
                        >
                          ×
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </div>
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
            placeholder="Milk, foil…"
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
