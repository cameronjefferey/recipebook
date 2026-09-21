"use client";

import { useMemo, useState, useTransition } from "react";
import type { ParsedPage, ParsedRecipe } from "@/lib/ai/schema";
import { formatIngredient } from "@/lib/ingredients";
import { saveFromCapture, type ReviewedRecipe } from "@/lib/actions/recipes";
import { CategoryField } from "@/components/category-field";
import { LineEditor } from "@/components/line-editor";
import { BackLink, Button, Card, ErrorNote, Field, Input, Textarea } from "@/components/ui";

type Line = { text: string; uncertain: boolean };

type Draft = {
  role: ParsedRecipe["role"];
  disposition: "separate" | "merge" | "skip";
  title: string;
  description: string;
  category: string;
  servings: string;
  servingsText: string;
  sourceName: string;
  notes: string;
  tags: string[];
  ingredients: Line[];
  instructions: Line[];
  complete: boolean;
  confidence: ParsedRecipe["confidence"];
  makeBox: boolean;
};

function toDraft(r: ParsedRecipe, pageSource?: string | null): Draft {
  const ingredients: Line[] = [];
  let group: string | null = null;
  for (const ing of r.ingredients) {
    const g = ing.group?.trim() || null;
    if (g && g !== group) {
      ingredients.push({ text: `# ${g}`, uncertain: false });
      group = g;
    }
    ingredients.push({
      text: formatIngredient(ing),
      uncertain: Boolean(ing.uncertain),
    });
  }

  const instructions: Line[] = [];
  group = null;
  for (const step of r.instructions) {
    const g = step.group?.trim() || null;
    if (g && g !== group) {
      instructions.push({ text: `# ${g}`, uncertain: false });
      group = g;
    }
    instructions.push({ text: step.text, uncertain: Boolean(step.uncertain) });
  }

  return {
    role: r.role,
    // A "recipe follows" component belongs with its parent by default; the
    // cook can promote it to its own card if they want it on its own.
    disposition: r.role === "main" ? "separate" : "merge",
    title: r.title,
    description: r.description ?? "",
    category: r.category ?? "",
    servings: r.servings ? String(r.servings) : "",
    servingsText: r.servingsText ?? "",
    sourceName: r.sourceName ?? pageSource ?? "",
    notes: r.notes ?? "",
    tags: r.tags,
    ingredients,
    instructions,
    complete: r.complete,
    confidence: r.confidence,
    makeBox: false,
  };
}

export function ReviewClient({
  captureId,
  page,
  imageUrl,
  dividers,
}: {
  captureId: string;
  page: ParsedPage;
  imageUrl: string;
  dividers: { names: string[]; books: string[] };
}) {
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    page.recipes.map((r) => toDraft(r, page.sourceName)),
  );
  const [zoomed, setZoomed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const mainTitle =
    drafts.find((d) => d.role === "main")?.title ?? "the main recipe";

  const uncertainCount = useMemo(
    () =>
      drafts.reduce(
        (n, d) =>
          n +
          d.ingredients.filter((l) => l.uncertain).length +
          d.instructions.filter((l) => l.uncertain).length,
        0,
      ),
    [drafts],
  );

  const patch = (i: number, p: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d, j) => (j === i ? { ...d, ...p } : d)));

  const patchLine = (
    i: number,
    field: "ingredients" | "instructions",
    j: number,
    text: string,
  ) =>
    setDrafts((prev) =>
      prev.map((d, k) =>
        k === i
          ? {
              ...d,
              [field]: d[field].map((l, m) =>
                // Editing a flagged line is the cook confirming it.
                m === j ? { text, uncertain: false } : l,
              ),
            }
          : d,
      ),
    );

  const addLine = (i: number, field: "ingredients" | "instructions") =>
    setDrafts((prev) =>
      prev.map((d, k) =>
        k === i
          ? { ...d, [field]: [...d[field], { text: "", uncertain: false }] }
          : d,
      ),
    );

  const removeLine = (
    i: number,
    field: "ingredients" | "instructions",
    j: number,
  ) =>
    setDrafts((prev) =>
      prev.map((d, k) =>
        k === i ? { ...d, [field]: d[field].filter((_, m) => m !== j) } : d,
      ),
    );

  function save() {
    setError(null);
    const payload: ReviewedRecipe[] = drafts.map((d) => ({
      include: d.disposition !== "skip",
      mergeIntoMain: d.disposition === "merge",
      role: d.role,
      title: d.title,
      description: d.description || null,
      category: d.category || null,
      servings: d.servings ? Number(d.servings) : null,
      servingsText: d.servingsText || null,
      sourceName: d.sourceName || null,
      notes: d.notes || null,
      tags: d.tags.map((tag) => tag.trim()).filter(Boolean),
      makeBox: d.makeBox,
      ingredientLines: d.ingredients.map((l) => l.text),
      instructionLines: d.instructions.map((l) => l.text),
    }));

    startTransition(async () => {
      try {
        await saveFromCapture(captureId, payload);
      } catch (err) {
        // redirect() throws by design; only surface genuine failures.
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  return (
    <div className="space-y-5 pb-8">
      <header>
        <div className="flex items-center gap-1">
          <BackLink href="/add" label="Back to Add" />
          <h1 className="font-display text-2xl">Check the transcription</h1>
        </div>
        <p className="mt-1 text-[0.95rem] text-muted">
          The photo is kept for good. Fix anything that came out wrong.
        </p>
      </header>

      <button
        onClick={() => setZoomed(true)}
        className="block w-full overflow-hidden rounded-card border border-line bg-card"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="The photo you took"
          className="max-h-72 w-full object-contain"
          style={{ rotate: `${page.rotation}deg` }}
        />
        <span className="block px-3 py-2 text-[0.85rem] text-muted">
          Tap to see the original full size
        </span>
      </button>

      {zoomed ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-2"
          onClick={() => setZoomed(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="The photo you took"
            className="max-h-full max-w-full object-contain"
            style={{ rotate: `${page.rotation}deg` }}
          />
          <Button
            variant="secondary"
            className="absolute top-4 right-4"
            onClick={() => setZoomed(false)}
          >
            Close
          </Button>
        </div>
      ) : null}

      {page.pageNote ? (
        <p className="rounded-xl bg-butter/25 px-4 py-3 text-[0.95rem]">
          {page.pageNote}
        </p>
      ) : null}

      {uncertainCount > 0 ? (
        <p className="rounded-xl bg-butter/25 px-4 py-3 text-[0.95rem]">
          {uncertainCount} {uncertainCount === 1 ? "line was" : "lines were"} hard
          to read, marked below. Compare them against the photo.
        </p>
      ) : null}

      <ErrorNote>{error}</ErrorNote>

      {drafts.map((draft, i) => (
        <Card key={i} className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <input
              value={draft.title}
              onChange={(e) => patch(i, { title: e.target.value })}
              className="font-display min-w-0 flex-1 border-b border-line bg-transparent pb-1 text-xl focus:border-pink focus:outline-none"
            />
            {draft.role !== "main" ? (
              <span className="mt-1 shrink-0 rounded-full bg-pink-soft px-3 py-1 text-[0.72rem] font-bold tracking-wide text-pink uppercase">
                {draft.role}
              </span>
            ) : null}
          </div>

          {!draft.complete ? (
            <p className="rounded-xl bg-butter/25 px-3 py-2 text-[0.9rem]">
              This one looks cut off by the edge of the photo.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {(draft.role === "main"
              ? (["separate", "skip"] as const)
              : (["merge", "separate", "skip"] as const)
            ).map((option) => (
              <button
                key={option}
                onClick={() => patch(i, { disposition: option })}
                className={`tap inline-flex h-12 items-center rounded-full border px-4 text-[0.9rem] font-bold ${
                  draft.disposition === option
                    ? "border-pink bg-pink text-page"
                    : "border-line bg-page text-muted"
                }`}
              >
                {option === "separate" && "Its own recipe"}
                {option === "merge" &&
                  (draft.role === "component"
                    ? `Part of ${mainTitle}`
                    : `Note on ${mainTitle}`)}
                {option === "skip" && "Skip"}
              </button>
            ))}
          </div>

          {draft.disposition === "skip" ? null : (
            <>
          <Field label="Serves">
            <Input
              inputMode="numeric"
              value={draft.servings}
              onChange={(e) => patch(i, { servings: e.target.value })}
            />
          </Field>

          <CategoryField
            names={dividers.names}
            books={dividers.books}
            value={draft.category}
            onChange={(category) => patch(i, { category })}
            makeBox={draft.makeBox}
            onMakeBox={(makeBox) => patch(i, { makeBox })}
          />

          <Field label="A short note">
            <Textarea
              rows={2}
              value={draft.description}
              onChange={(e) => patch(i, { description: e.target.value })}
              placeholder="Who it's from, or when you make it"
            />
          </Field>

              <LineEditor
                label="Ingredients"
                hint="One per line. Start a line with # for a heading."
                lines={draft.ingredients}
                onChange={(j, text) => patchLine(i, "ingredients", j, text)}
                onRemove={(j) => removeLine(i, "ingredients", j)}
                onAdd={() => addLine(i, "ingredients")}
              />

              <LineEditor
                label="Steps"
                lines={draft.instructions}
                multiline
                onChange={(j, text) => patchLine(i, "instructions", j, text)}
                onRemove={(j) => removeLine(i, "instructions", j)}
                onAdd={() => addLine(i, "instructions")}
              />

              <Field label="Notes">
                <Textarea
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => patch(i, { notes: e.target.value })}
                  placeholder="Anything written in the margin"
                />
              </Field>

              <Field label="Tags" hint="A comma between each one.">
                <Input
                  value={draft.tags.join(", ")}
                  onChange={(e) =>
                    patch(i, {
                      tags: e.target.value.split(",").map((tag) => tag.trim()),
                    })
                  }
                  placeholder="holiday, sunday"
                />
              </Field>

              <Field label="Where it came from">
                <Input
                  value={draft.sourceName}
                  onChange={(e) => patch(i, { sourceName: e.target.value })}
                  placeholder="Grandma's card, or a cookbook"
                />
              </Field>
            </>
          )}
        </Card>
      ))}

      <Button onClick={save} disabled={pending} className="w-full">
        {pending ? "Filing it away…" : "Save to my box"}
      </Button>
    </div>
  );
}

