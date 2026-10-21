"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import type { ShelfBook, SharedShelfBook } from "@/lib/books";
import { ShareIcon } from "@/components/icons";
import { FavoriteStar } from "@/components/favorite-star";

/** Long enough to watch the lid lift and the cards settle, not a blink. */
const OPEN_MS = 560;

/**
 * A tin on the shelf. Tap it and the lid hinges back the way a real recipe
 * box does — thick enough that it never vanishes edge-on.
 *
 * Given `onSelect`, the tin is a toggle: the lid stays up while it is the
 * one chosen and the wall beneath re-deals to its cards. Otherwise it is a
 * real link to the box's own page (modified click, long-press, screen reader
 * all work), briefly delayed so the motion has somewhere to finish.
 */
export function BoxCard({
  book,
  sharedWith = 0,
  from,
  selected = false,
  onSelect,
  size = "shelf",
}: {
  book: ShelfBook | SharedShelfBook;
  /** how many people this household has given it to */
  sharedWith?: number;
  /** whose box it is, when it is not ours */
  from?: string;
  /** lid up: this is the box the wall is showing */
  selected?: boolean;
  onSelect?: () => void;
  /** "row" is the smaller tin that sits above the wall of cards */
  size?: "shelf" | "row";
}) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const href = `/box/${book.id}`;

  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || opening) return;
    e.preventDefault();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }
    setOpening(true);
    setTimeout(() => router.push(href), OPEN_MS);
  };

  const isOpen = onSelect ? selected : opening;
  const face = <TinBody book={book} from={from} sharedWith={sharedWith} />;

  return (
    <div
      className={`box-card${isOpen ? " is-open" : ""}${size === "row" ? " box-card--row" : ""}`}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={selected ? `Close ${book.name}` : `Open ${book.name}`}
          className="tap absolute inset-0 rounded-[5px] text-left"
        >
          {face}
        </button>
      ) : (
        <Link
          href={href}
          onClick={open}
          aria-label={`Open ${book.name}`}
          className="absolute inset-0"
        >
          {face}
        </Link>
      )}

      {/* Outside the tap target, so a tap never opens the box. */}
      <div
        className={`absolute z-10 ${
          size === "row" ? "top-[2%] left-[2%]" : "top-[34%] left-[8%]"
        }`}
      >
        <FavoriteStar
          bookId={book.id}
          name={book.name}
          favorite={book.favorite}
        />
      </div>
    </div>
  );
}

function TinBody({
  book,
  from,
  sharedWith,
}: {
  book: ShelfBook | SharedShelfBook;
  from?: string;
  sharedWith: number;
}) {
  return (
    <>
      {/* The well, with index cards standing in it. Hidden by the lid
            until it lifts; they fan a little as if the lid had been
            holding them down. */}
      <div className="box-well" aria-hidden>
        <span className="box-index" />
        <span className="box-index" />
        <span className="box-index" />
        <span className="box-index" />
        <span className="box-index" />
      </div>

      {/* Front of the tin, label pasted on. */}
      <div className="box-front">
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

        <div className="box-label">
          <h3 className="font-display truncate text-[0.92rem] leading-tight">
            {book.name}
          </h3>
          <p className="mt-0.5 truncate text-[0.68rem] text-muted">
            {book.blurb ??
              `${book.count} ${book.count === 1 ? "recipe" : "recipes"}`}
          </p>
          {book.blurb ? (
            <p className="truncate text-[0.68rem] text-muted">
              {book.count} {book.count === 1 ? "recipe" : "recipes"}
            </p>
          ) : null}
          {from ? (
            <p className="hand mt-0.5 truncate text-[0.72rem] text-browned">
              from {from}
            </p>
          ) : null}
        </div>
      </div>

      {/* Lid: a real piece of tin, hinged at the back. Top, underside,
            and a front lip so it never goes edge-on into nothing. */}
      <div className="box-lid">
        <div className="box-lid-under" />
        <div className="box-lid-top">
          <span className="box-lid-hinge" />
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
        <div className="box-lid-lip">
          <span className="box-lid-tab" />
        </div>
      </div>
    </>
  );
}
