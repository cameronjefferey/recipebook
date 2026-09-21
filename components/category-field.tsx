"use client";

import { useState } from "react";
import { Input } from "@/components/ui";

function chip(on: boolean) {
  return `tap inline-flex h-12 items-center rounded-full border px-4 text-[0.9rem] font-bold ${
    on ? "border-pink bg-pink text-page" : "border-line bg-card text-ink"
  }`;
}

/**
 * Existing dividers as chips, plus "a new one". A brand-new name does not
 * become a box unless she asks.
 */
export function CategoryField({
  names,
  books,
  value,
  onChange,
  makeBox,
  onMakeBox,
}: {
  names: string[];
  books: string[];
  value: string;
  onChange: (value: string) => void;
  makeBox: boolean;
  onMakeBox: (value: boolean) => void;
}) {
  const trimmed = value.trim();
  const match = names.find((name) => name.toLowerCase() === trimmed.toLowerCase());
  const bookMatch = books.some((name) => name.toLowerCase() === trimmed.toLowerCase());
  const [writing, setWriting] = useState(() => trimmed !== "" && !match);

  const pick = (name: string) => {
    setWriting(false);
    onMakeBox(false);
    onChange(name);
  };

  return (
    <fieldset>
      <legend className="mb-1.5 block text-[0.8rem] font-bold tracking-wide text-browned uppercase">
        Category
      </legend>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => pick("")} className={chip(!writing && !trimmed)}>
          None
        </button>
        {names.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => pick(name)}
            className={chip(!writing && match === name)}
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setWriting(true);
            if (match) onChange("");
          }}
          className={chip(writing)}
        >
          A new one
        </button>
      </div>

      {writing ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Baking"
          aria-label="New category"
          maxLength={60}
          className="mt-3"
        />
      ) : null}

      {bookMatch ? (
        <p className="hand mt-2 text-[0.95rem]">already a box, so it goes there</p>
      ) : trimmed ? (
        <label className="tap mt-2 flex items-center gap-3 text-[0.95rem]">
          <input
            type="checkbox"
            checked={makeBox}
            onChange={(e) => onMakeBox(e.target.checked)}
            className="h-6 w-6 shrink-0 accent-pink"
          />
          Make a box called {trimmed}
        </label>
      ) : null}
    </fieldset>
  );
}
