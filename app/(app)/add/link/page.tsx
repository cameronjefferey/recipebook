"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { importUrlAction, type ImportState } from "@/lib/actions/import";
import { BackLink, Button, ErrorNote, Field, Input } from "@/components/ui";

type PdfStep = "idle" | "uploading" | "reading" | "done" | "error";

export default function LinkPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState<ImportState, FormData>(
    importUrlAction,
    {},
  );

  const pdfRef = useRef<HTMLInputElement>(null);
  const [pdfStep, setPdfStep] = useState<PdfStep>("idle");
  const [pdfError, setPdfError] = useState<string | null>(null);

  async function handlePdf(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPdfStep("uploading");
    setPdfError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const up = await fetch("/api/captures", { method: "POST", body: form });
      if (!up.ok) {
        const data = await up.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed.");
      }
      const { id } = await up.json();

      setPdfStep("reading");
      const tr = await fetch(`/api/captures/${id}/transcribe`, { method: "POST" });
      const result = await tr.json().catch(() => ({}));
      if (!tr.ok) throw new Error(result.error ?? "Could not read that PDF.");

      setPdfStep("done");
      router.push(`/add/review/${id}`);
    } catch (err) {
      setPdfStep("error");
      setPdfError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

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

        {state.suggestPdf && (
          <div className="mt-6 space-y-3 border-t border-line pt-5">
            <p className="font-bold">Upload a saved PDF instead</p>
            <p className="text-[0.9rem] text-muted">
              In your browser, open the page and choose{" "}
              <strong>File → Print → Save as PDF</strong>, then upload it here.
            </p>

            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                handlePdf(e.target.files);
                e.target.value = "";
              }}
            />

            {pdfStep === "idle" && (
              <Button
                type="button"
                className="w-full"
                onClick={() => pdfRef.current?.click()}
              >
                Upload PDF
              </Button>
            )}
            {pdfStep === "uploading" && (
              <p className="text-center text-[0.9rem] text-muted">Sending…</p>
            )}
            {pdfStep === "reading" && (
              <p className="text-center text-[0.9rem] text-muted">
                Reading the recipe…
              </p>
            )}
            {pdfStep === "done" && (
              <p className="text-center text-[0.9rem] text-muted">
                Done — opening the recipe…
              </p>
            )}
            {pdfStep === "error" && <ErrorNote>{pdfError}</ErrorNote>}
          </div>
        )}
      </div>
    </div>
  );
}
