"use client";

import { useActionState } from "react";
import { importUrlAction, type ImportState } from "@/lib/actions/import";
import { BackLink, Button, ErrorNote, Field, Input } from "@/components/ui";

export default function LinkPage() {
  const [state, action, pending] = useActionState<ImportState, FormData>(
    importUrlAction,
    {},
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <BackLink href="/add" label="Back to Add" />
        <h1 className="font-display text-2xl">Paste a web link</h1>
      </div>

      <div className="index-sheet">
        <form action={action} className="space-y-4">
          <ErrorNote>{state.error}</ErrorNote>

          <Field label="Link" hint="From any recipe website.">
            <Input
              name="url"
              type="url"
              inputMode="url"
              required
              autoCapitalize="none"
              placeholder="https://…"
            />
          </Field>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Reading the page…" : "Add to my box"}
          </Button>
        </form>
      </div>
    </div>
  );
}
