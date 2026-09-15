"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import type { ShelfBook, SharedShelfBook } from "@/lib/books";
import { ShareIcon } from "@/components/icons";

/** Long enough to read as a real lid lifting, short enough not to feel slow. */
const OPEN_MS = 340;

/**
 * A box on the shelf. Tap it and the lid tips back on its hinge before the
 * page underneath takes over — the navigation is real (a modified click, a
 * long-press, a screen reader all still work as a plain link), just briefly
 * delayed so the animation has somewhere to finish.
 */
export function BoxCard({
  book,
  sharedWith = 0,
  from,
}: {
  book: ShelfBook | SharedShelfBook;
  /** how many people this household has given it to */
  sharedWith?: number;
  /** whose box it is, when it is not ours */
  from?: string;
}) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const href = `/box/${book.id}`;

  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || opening) return;
    e.preventDefault();
    setOpening(true);
    setTimeout(() => router.push(href), OPEN_MS);
  };

  return (
    <Link
      href={href}
      onClick={open}
      aria-label={`Open ${book.name}`}
      className="box-card relative block aspect-3/4"
    >
      {/* The box itself, front-on. */}
      <div className="absolute inset-x-0 top-[24%] bottom-0 overflow-hidden rounded-card bg-pink shadow-[0_1px_3px_#382a2214]">
        {book.coverId ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/images/${book.coverId}`}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
            style={{ rotate: `${book.rotation}deg` }}
          />
        ) : null}

        {/* A label pasted on the front, the way a real recipe box has one. */}
        <div className="absolute inset-x-3 bottom-3 -rotate-1 rounded-lg border border-pink-mid/50 bg-card/95 px-2.5 py-2 text-center shadow-sm">
          <h3 className="font-display truncate text-[1rem] leading-tight">
            {book.name}
          </h3>
          <p className="mt-0.5 truncate text-[0.72rem] text-muted">
            {book.blurb ?? `${book.count} ${book.count === 1 ? "recipe" : "recipes"}`}
          </p>
          {book.blurb ? (
            <p className="truncate text-[0.72rem] text-muted">
              {book.count} {book.count === 1 ? "recipe" : "recipes"}
            </p>
          ) : null}
          {from ? (
            <p className="hand mt-0.5 truncate text-[0.78rem] text-browned">
              from {from}
            </p>
          ) : null}
        </div>
      </div>

      {/* A peek of what's inside, hidden under the lid until it lifts. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-[18%] flex justify-center gap-1"
      >
        <span className="h-3.5 w-6 -rotate-6 rounded-[2px] bg-butter" />
        <span className="h-4 w-6 rotate-2 rounded-[2px] bg-card" />
        <span className="h-3.5 w-6 -rotate-2 rounded-[2px] bg-pink-soft" />
      </div>

      {/* The lid, hinged at the top and tipped back on tap. */}
      <div
        className="box-lid absolute inset-x-0 top-0 h-[30%] rounded-t-card bg-pink-mid shadow-[0_2px_3px_#382a2222]"
        style={opening ? { transform: "rotateX(-120deg)", opacity: 0.9 } : undefined}
      >
        {/* A little tab, like the flap on a real box lid. */}
        <span className="absolute bottom-1.5 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-pink/60" />

        {sharedWith > 0 ? (
          <span
            title={`Shared with ${sharedWith} ${sharedWith === 1 ? "person" : "people"}`}
            className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-card/90 px-1.5 py-0.5 text-[0.65rem] font-bold text-browned"
          >
            <ShareIcon className="h-2.5 w-2.5" />
            {sharedWith}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
