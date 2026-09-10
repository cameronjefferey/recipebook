"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { downscale } from "@/lib/downscale";
import { Button, Card, ErrorNote } from "@/components/ui";
import { CameraIcon, LinkIcon, PencilIcon, PhotoIcon } from "@/components/icons";

type Job = {
  key: string;
  name: string;
  preview: string;
  captureId?: string;
  state: "preparing" | "uploading" | "reading" | "done" | "error";
  found?: number;
  error?: string;
};

export function CaptureClient() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const update = (key: string, patch: Partial<Job>) =>
    setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...patch } : j)));

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setFatal(null);

    const files = Array.from(fileList);
    const queued: Job[] = files.map((file, i) => ({
      key: `${Date.now()}-${i}`,
      name: file.name || `Photo ${i + 1}`,
      preview: URL.createObjectURL(file),
      state: "preparing",
    }));
    setJobs((prev) => [...queued, ...prev]);

    // Sequential rather than parallel: a stack of cards on a phone connection
    // uploads more reliably one at a time, and it keeps API cost predictable.
    for (let i = 0; i < files.length; i++) {
      const job = queued[i];
      try {
        const { blob, width, height } = await downscale(files[i]);

        update(job.key, { state: "uploading" });
        const form = new FormData();
        form.append(
          "file",
          new File([blob], "capture.jpg", { type: blob.type || files[i].type }),
        );
        form.append("width", String(width));
        form.append("height", String(height));

        const uploaded = await fetch("/api/captures", {
          method: "POST",
          body: form,
        });
        if (!uploaded.ok) throw new Error((await uploaded.json()).error ?? "Upload failed.");
        const { id } = await uploaded.json();

        update(job.key, { state: "reading", captureId: id });
        const read = await fetch(`/api/captures/${id}/transcribe`, {
          method: "POST",
        });
        const result = await read.json();
        if (!read.ok) throw new Error(result.error ?? "Could not read that photo.");

        update(job.key, {
          state: "done",
          found: result.result?.recipes?.length ?? 0,
        });
      } catch (err) {
        update(job.key, {
          state: "error",
          error: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    }

    router.refresh();
  }

  const ready = jobs.filter((j) => j.state === "done" && (j.found ?? 0) > 0);

  return (
    <div className="space-y-4">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <ErrorNote>{fatal}</ErrorNote>

      <button
        onClick={() => cameraRef.current?.click()}
        className="tap flex w-full flex-col items-center gap-2 rounded-card bg-pink px-6 py-8 text-page shadow-sm active:brightness-95"
      >
        <CameraIcon className="h-10 w-10" />
        <span className="font-display text-2xl">Take a photo</span>
        <span className="text-[0.9rem] opacity-90">
          A recipe card, or a page from a cookbook
        </span>
      </button>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => libraryRef.current?.click()}
          className="tap flex items-center gap-3 rounded-card border border-line bg-card px-5 py-4 text-left active:brightness-95"
        >
          <PhotoIcon className="h-6 w-6 shrink-0 text-pink" />
          <span>
            <span className="block font-bold">Choose photos</span>
            <span className="block text-[0.9rem] text-muted">
              Pick several at once
            </span>
          </span>
        </button>

        <Link
          href="/add/link"
          className="tap flex items-center gap-3 rounded-card border border-line bg-card px-5 py-4 text-left active:brightness-95"
        >
          <LinkIcon className="h-6 w-6 shrink-0 text-pink" />
          <span>
            <span className="block font-bold">Paste a web link</span>
            <span className="block text-[0.9rem] text-muted">
              From a recipe website
            </span>
          </span>
        </Link>

        <Link
          href="/add/write"
          className="tap flex items-center gap-3 rounded-card border border-line bg-card px-5 py-4 text-left active:brightness-95"
        >
          <PencilIcon className="h-6 w-6 shrink-0 text-pink" />
          <span>
            <span className="block font-bold">Type it in</span>
            <span className="block text-[0.9rem] text-muted">
              Write the recipe yourself
            </span>
          </span>
        </Link>
      </div>

      {jobs.length > 0 ? (
        <section className="space-y-2 pt-2">
          <h2 className="font-display text-xl">Reading your photos</h2>
          {jobs.map((job) => (
            <Card key={job.key} className="flex items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={job.preview}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.95rem] font-bold">{job.name}</p>
                <p className="text-[0.9rem] text-muted">
                  {job.state === "preparing" && "Getting it ready…"}
                  {job.state === "uploading" && "Sending…"}
                  {job.state === "reading" && "Reading the recipe…"}
                  {job.state === "done" &&
                    (job.found
                      ? `Found ${job.found} recipe${job.found > 1 ? "s" : ""}`
                      : "No recipe found on this one")}
                  {job.state === "error" && (
                    <span className="text-jam">{job.error}</span>
                  )}
                </p>
              </div>
              {job.state === "done" && (job.found ?? 0) > 0 ? (
                <Link
                  href={`/add/review/${job.captureId}`}
                  className="tap inline-flex items-center rounded-full bg-pink px-4 text-[0.9rem] font-bold text-page"
                >
                  Review
                </Link>
              ) : null}
            </Card>
          ))}

          {ready.length > 1 ? (
            <Button
              className="w-full"
              onClick={() => router.push(`/add/review/${ready[0].captureId}`)}
            >
              Review {ready.length} photos
            </Button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
