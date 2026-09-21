"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { updateRecipe } from "@/lib/actions/recipes";
import { CategoryField } from "@/components/category-field";
import { LineEditor } from "@/components/line-editor";
import { ThrowCard } from "@/components/throw-card";
import { BackLink, Button, Field, Input, Textarea } from "@/components/ui";

type Line = { text: string; uncertain: boolean };

function linesOf(text: string[]): Line[] {
  return text.length
    ? text.map((line) => ({ text: line, uncertain: false }))
    : [{ text: "", uncertain: false }];
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Filing it away…" : "Save this card"}
    </Button>
  );
}

export function CorrectCard({
  id,
  title,
  description,
  category,
  notes,
  sourceName,
  tags,
  ingredientText,
  instructionText,
  names,
  books,
  image,
}: {
  id: string;
  title: string;
  description: string;
  category: string;
  notes: string;
  sourceName: string;
  tags: string;
  ingredientText: string[];
  instructionText: string[];
  names: string[];
  books: string[];
  image: { url: string; rotation: number } | null;
}) {
  const [name, setName] = useState(title);
  const [blurb, setBlurb] = useState(description);
  const [picked, setPicked] = useState(category);
  const [makeBox, setMakeBox] = useState(false);
  const [margin, setMargin] = useState(notes);
  const [source, setSource] = useState(sourceName);
  const [tagText, setTagText] = useState(tags);
  const [ingredients, setIngredients] = useState<Line[]>(() => linesOf(ingredientText));
  const [steps, setSteps] = useState<Line[]>(() => linesOf(instructionText));

  const patch =
    (setter: typeof setIngredients) => (index: number, text: string) =>
      setter((prev) => prev.map((line, i) => (i === index ? { text, uncertain: false } : line)));

  const remove = (setter: typeof setIngredients) => (index: number) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const add = (setter: typeof setIngredients) => () =>
    setter((prev) => [...prev, { text: "", uncertain: false }]);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-1">
        <BackLink href={`/r/${id}`} label="Back to the card" />
        <h1 className="font-display text-2xl">Correct this card</h1>
      </div>

      <div className={image ? "md:grid md:grid-cols-2 md:items-start md:gap-8" : ""}>
        {image ? (
          <div className="md:sticky md:top-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt="The original card"
              className="w-full rounded-card border border-line bg-card object-contain"
              style={{ rotate: `${image.rotation}deg` }}
            />
            <p className="hand mt-2">the original, for checking</p>
          </div>
        ) : null}

        <form action={updateRecipe.bind(null, id)} className="space-y-4">
          <input type="hidden" name="category" value={picked} />
          <input type="hidden" name="makeBox" value={makeBox ? "yes" : ""} />
          <input
            type="hidden"
            name="ingredients"
            value={ingredients.map((line) => line.text).join("\n")}
          />
          <input
            type="hidden"
            name="instructions"
            value={steps.map((line) => line.text).join("\n")}
          />

          <Field label="Name">
            <Input
              name="title"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="A short note">
            <Textarea
              name="description"
              rows={2}
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              placeholder="Who it's from, or when you make it"
            />
          </Field>

          <CategoryField
            names={names}
            books={books}
            value={picked}
            onChange={setPicked}
            makeBox={makeBox}
            onMakeBox={setMakeBox}
          />

          <LineEditor
            label="Ingredients"
            hint="One per line. Start a line with # for a heading."
            lines={ingredients}
            onChange={patch(setIngredients)}
            onRemove={remove(setIngredients)}
            onAdd={add(setIngredients)}
          />

          <LineEditor
            label="Steps"
            lines={steps}
            multiline
            onChange={patch(setSteps)}
            onRemove={remove(setSteps)}
            onAdd={add(setSteps)}
          />

          <Field label="In the margin">
            <Textarea
              name="notes"
              rows={3}
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              placeholder="A substitution, or something to remember"
            />
          </Field>

          <Field label="Where it came from">
            <Input
              name="sourceName"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Grandma's card, or a cookbook"
            />
          </Field>

          <Field label="Tags" hint="A comma between each one.">
            <Input
              name="tags"
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="holiday, sunday"
            />
          </Field>

          <SaveButton />
        </form>
      </div>

      <ThrowCard id={id} title={name || title} />
    </div>
  );
}
