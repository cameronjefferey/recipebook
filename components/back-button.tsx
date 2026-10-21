"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "@/components/icons";

/**
 * A recipe is reached from all over — the grid, a box, search, this week's
 * plan, another recipe's ingredient link — so there is no one fixed parent
 * to send somebody back to. Retracing actual browser history gets that
 * right; a bare URL never opened from within the app (a bookmark, a fresh
 * PWA launch) is the one case it can't, so that falls back to `fallback`.
 */
export function BackButton({
  fallback,
  label = "Back",
  showLabel = false,
}: {
  fallback: string;
  label?: string;
  /** Print the word beside the arrow. The arrow alone is for tight rows. */
  showLabel?: boolean;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      aria-label={showLabel ? undefined : label}
      className={`tap flex shrink-0 items-center justify-center gap-0.5 text-pink-deep ${
        showLabel ? "-ml-2 pr-3 text-[1rem] font-bold" : "-ml-3"
      }`}
    >
      <ChevronLeft className="h-6 w-6" />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
