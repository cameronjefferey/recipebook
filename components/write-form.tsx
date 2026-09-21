"use client";

import { useState } from "react";
import { createManualRecipe } from "@/lib/actions/recipes";
import { CategoryField } from "@/components/category-field";
import { Button, Field, Input, Textarea } from "@/components/ui";

export function WriteForm({
  names,
  books,
}: {
  names: string[];
  books: string[];
}) {
  const [category, setCategory] = useState("");
  const [makeBox, setMakeBox] = useState(false);

  return (
    <form action={createManualRecipe} className="space-y-4">
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="makeBox" value={makeBox ? "yes" : ""} />

      <Field label="Name">
        <Input name="title" required placeholder="Grandma's pot roast" />
      </Field>

      <Field label="Serves">
        <Input name="servings" inputMode="numeric" />
      </Field>

      <CategoryField
        names={names}
        books={books}
        value={category}
        onChange={setCategory}
        makeBox={makeBox}
        onMakeBox={setMakeBox}
      />

      <Field label="A short note">
        <Textarea name="description" rows={2} />
      </Field>

      <Field
        label="Ingredients"
        hint="One per line. Start a line with # for a heading."
      >
        <Textarea
          name="ingredients"
          rows={8}
          placeholder={"2 pounds chuck roast\n1 tablespoon olive oil\nsalt and pepper"}
        />
      </Field>

      <Field label="Steps" hint="One step per line.">
        <Textarea name="instructions" rows={8} />
      </Field>

      <Field label="In the margin">
        <Textarea name="notes" rows={2} />
      </Field>

      <Button type="submit" className="w-full">
        Save to my box
      </Button>
    </form>
  );
}
