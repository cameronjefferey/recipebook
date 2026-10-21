"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { WallCard } from "@/lib/recipes";
import type { ShelfBook, SharedShelfBook } from "@/lib/books";
import { setBookFavorite } from "@/lib/actions/books";
import { RecipeCard } from "@/components/recipe-card";
import { BoxCard } from "@/components/box-card";
import { ButtonLink } from "@/components/ui";
import {
  ChevronDown,
  ChevronRight,
  SearchIcon,
  StarIcon,
} from "@/components/icons";

export type Divider = {
  id: string;
  name: string;
  /** a standing divider the box always has, or one the household named */
  kind: "all" | "box" | "shared" | "keepers" | "want";
  ownerName?: string | null;
  /** how many cards are filed under it */
  count?: number;
  /** starred: shown as a tin on the counter rather than a tab in the row */
  starred?: boolean;
};

/** A starred box as a tin in the row above the wall. */
export type Tin = {
  book: ShelfBook | SharedShelfBook;
  /** whose box it is, when it is not ours */
  from?: string;
  /** how many people this household has given it to */
  sharedWith?: number;
};

type Order = "title" | "recent" | "loved";

const ORDERS: { key: Order; label: string }[] = [
  { key: "title", label: "A to Z" },
  { key: "recent", label: "Newest first" },
  { key: "loved", label: "Most cooked" },
];

/** How many named boxes stand in the row before the rest fold away. */
const ROW_LIMIT = 6;
/** Past this many, the full list is grouped under letters. */
const LETTER_GROUPS_FROM = 12;

function belongs(card: WallCard, divider: Divider) {
  switch (divider.kind) {
    case "all":
      return true;
    case "keepers":
      return card.status === "keeper";
    case "want":
      return card.status === "want_to_try";
    default:
      return card.bookIds.includes(divider.id);
  }
}

function matches(card: WallCard, words: string[]) {
  return words.every((w) => card.haystack.includes(w));
}

function nameMatches(d: Divider, words: string[]) {
  const name = d.name.toLowerCase();
  return words.every((w) => name.includes(w));
}

function byName(a: Divider, b: Divider) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

/**
 * The open box: starred tins on the counter, the standing dividers and the
 * most-used named ones along the top of the wall, the cards spread beneath.
 * Lifting a tin's lid, picking a divider, or typing a few letters re-deals
 * the same wall in place, so she never leaves the screen she is looking at.
 *
 * A household can end up with dozens of boxes (Vegetarian, Summer veggies,
 * Carrots…). The row shows the fullest few; the rest live one tap away under
 * "All boxes", alphabetically, and the search line finds a box by name as
 * readily as it finds a card.
 */
export function BoxWall({
  cards,
  dividers,
  tins,
  initialDivider,
  initialQuery,
  newBox,
}: {
  cards: WallCard[];
  /** every way the wall can be narrowed, tins included */
  dividers: Divider[];
  /** the starred boxes, ours and shared */
  tins: Tin[];
  initialDivider: string;
  initialQuery: string;
  /** the "name a box" control, rendered under the wall */
  newBox?: ReactNode;
}) {
  const [dividerId, setDividerId] = useState(initialDivider);
  const [query, setQuery] = useState(initialQuery);
  const [order, setOrder] = useState<Order>("title");
  const [allOpen, setAllOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const divider =
    dividers.find((d) => d.id === dividerId) ?? dividers[0];

  // Keep the address honest so Back, and a reload, land on the same view.
  useEffect(() => {
    const params = new URLSearchParams();
    if (divider.kind !== "all") params.set("d", divider.id);
    if (query.trim()) params.set("q", query.trim());
    const next = params.size ? `/box?${params}` : "/box";
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [divider, query]);

  // A chosen divider can only sit on the wall's edge from the last row. When
  // the row wraps, the tabs close into chips instead of pretending.
  const tabsRef = useRef<HTMLDivElement>(null);
  const [wrapped, setWrapped] = useState(false);
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const measure = () => {
      const first = el.firstElementChild as HTMLElement | null;
      setWrapped(!!first && el.clientHeight > first.offsetHeight + 6);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dividers.length]);

  const words = useMemo(
    () => deferredQuery.toLowerCase().split(/\s+/).filter(Boolean),
    [deferredQuery],
  );

  const standing = dividers.filter(
    (d) => d.kind !== "box" && d.kind !== "shared",
  );
  const named = useMemo(
    () =>
      dividers
        .filter((d) => (d.kind === "box" || d.kind === "shared") && !d.starred)
        .sort(byName),
    [dividers],
  );

  // Which named boxes stand in the row right now. Typing narrows the row to
  // boxes with that name; otherwise the fullest few, with the chosen one
  // always kept in view.
  const { rowBoxes, folded, boxHits } = useMemo(() => {
    if (words.length > 0) {
      const hits = named.filter((d) => nameMatches(d, words));
      return { rowBoxes: hits, folded: [] as Divider[], boxHits: hits.length };
    }
    if (named.length <= ROW_LIMIT) {
      return { rowBoxes: named, folded: [] as Divider[], boxHits: 0 };
    }
    const byUse = [...named].sort(
      (a, b) => (b.count ?? 0) - (a.count ?? 0) || byName(a, b),
    );
    const row = byUse.slice(0, ROW_LIMIT);
    if (!row.some((d) => d.id === divider.id)) {
      const chosen = named.find((d) => d.id === divider.id);
      if (chosen) row.splice(ROW_LIMIT - 1, 1, chosen);
    }
    row.sort(byName);
    const rowIds = new Set(row.map((d) => d.id));
    return {
      rowBoxes: row,
      folded: named.filter((d) => !rowIds.has(d.id)),
      boxHits: 0,
    };
  }, [named, words, divider.id]);

  const pick = (d: Divider) => {
    setDividerId(d.id);
    setAllOpen(false);
    // She typed the box's name to find it; the search has done its job.
    if (words.length > 0 && nameMatches(d, words)) setQuery("");
  };

  const shown = useMemo(() => {
    const kept = cards.filter(
      (c) => belongs(c, divider) && (words.length === 0 || matches(c, words)),
    );
    if (order === "recent") {
      kept.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (order === "loved") {
      kept.sort(
        (a, b) =>
          b.timesCooked - a.timesCooked ||
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
    }
    return kept;
  }, [cards, divider, words, order]);

  const narrowed = divider.kind !== "all" || words.length > 0;
  const boxEmpty = cards.length === 0;
  const isBox = divider.kind === "box" || divider.kind === "shared";

  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Search your recipes and boxes</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
          placeholder="Chicken, carrots, or a box's name"
          className="tap w-full rounded-xl border border-line bg-card py-2.5 pr-4 pl-12 text-[1.05rem] text-ink placeholder:text-muted/80 focus:border-pink focus:outline-none"
        />
      </label>

      {tins.length > 0 ? (
        <ul
          className="flex flex-wrap items-end gap-x-3 gap-y-2 px-1 pt-1"
          aria-label="Starred boxes"
        >
          {tins.map(({ book, from, sharedWith }) => (
            <li key={book.id} className="w-[6.25rem] sm:w-[7.25rem]">
              <BoxCard
                book={book}
                from={from}
                sharedWith={sharedWith}
                size="row"
                selected={divider.id === book.id}
                onSelect={() =>
                  setDividerId(divider.id === book.id ? dividers[0].id : book.id)
                }
              />
            </li>
          ))}
        </ul>
      ) : null}

      <div
        ref={tabsRef}
        className="divider-tabs"
        data-wrapped={wrapped ? "true" : undefined}
        role="tablist"
        aria-label="Dividers"
      >
        {standing.map((d) => (
          <Tab key={d.id} d={d} selected={d.id === divider.id} onPick={pick} />
        ))}
        {rowBoxes.map((d) => (
          <Tab
            key={d.id}
            d={d}
            selected={d.id === divider.id}
            onPick={pick}
            hit={boxHits > 0}
          />
        ))}
        {folded.length > 0 ? (
          <button
            type="button"
            onClick={() => setAllOpen((v) => !v)}
            aria-expanded={allOpen}
            aria-controls="all-boxes"
            className="divider-tab divider-tab--more"
          >
            All {named.length} boxes
            <ChevronDown
              className={`h-4 w-4 transition-transform ${allOpen ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </div>

      <div className="divider-wall">
        {allOpen && folded.length > 0 ? (
          <AllBoxes
            boxes={named}
            selectedId={divider.id}
            onPick={pick}
            onClose={() => setAllOpen(false)}
          />
        ) : null}

        {isBox && !boxEmpty ? (
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <h2 className="font-display min-w-0 truncate text-[1.5rem] leading-none text-ink">
              {divider.name}
              {divider.kind === "shared" && divider.ownerName ? (
                <span className="ml-2 text-[0.95rem] font-normal text-muted">
                  from {divider.ownerName}
                </span>
              ) : null}
            </h2>
            <StarBox divider={divider} />
          </div>
        ) : null}

        {boxEmpty ? (
          <Empty
            title="The box is empty"
            line="start with a card from the kitchen drawer"
            action={<ButtonLink href="/add">Put a card in</ButtonLink>}
          />
        ) : shown.length === 0 ? (
          <Empty
            title={boxHits > 0 ? "No cards, but a box" : "Nothing here"}
            line={
              boxHits > 0
                ? `no card called “${deferredQuery.trim()}”; the ${
                    boxHits === 1 ? "box above is" : "boxes above are"
                  } named that`
                : words.length > 0
                  ? `nothing called “${deferredQuery.trim()}”${
                      divider.kind !== "all" ? ` in ${divider.name}` : ""
                    }`
                  : isBox
                    ? "open a recipe and file it under this box"
                    : divider.kind === "keepers"
                      ? "mark a card Keeper and it shows up here"
                      : "mark a card Want to try and it shows up here"
            }
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDividerId(dividers[0].id);
                }}
                className="tap rounded-full border border-line bg-card px-6 text-[1.1rem] font-bold text-ink"
              >
                Show everything
              </button>
            }
          />
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2 px-1">
              <p className="hand min-w-0 flex-1 text-[1rem]">
                {narrowed ? (
                  <>
                    {shown.length} {shown.length === 1 ? "card" : "cards"}
                    {isBox ? " in this box" : divider.kind !== "all" ? ` under ${divider.name}` : ""}
                  </>
                ) : (
                  <>
                    {shown.length} {shown.length === 1 ? "card" : "cards"} in the box
                  </>
                )}
              </p>
              <label className="shrink-0">
                <span className="sr-only">Order</span>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value as Order)}
                  className="tap rounded-full border border-line bg-card px-3 text-[0.9rem] font-bold text-ink"
                >
                  {ORDERS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <ul className="grid grid-cols-2 gap-x-3 gap-y-4 px-1 pb-2 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((card, i) => (
                <li key={card.id}>
                  <RecipeCard recipe={card} priority={i < 4} />
                </li>
              ))}
            </ul>
          </>
        )}

        {divider.kind === "box" && !boxEmpty ? (
          <div className="flex justify-end px-1 pt-1">
            <Link
              href={`/box/${divider.id}`}
              className="tap inline-flex items-center gap-0.5 rounded-full px-2 text-[0.95rem] font-bold text-pink-deep"
            >
              Rename or share {divider.name}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>

      {newBox ? <div className="px-1 pt-1">{newBox}</div> : null}
    </div>
  );
}

/**
 * Starring a box turns it into a tin on the counter; unstarring puts it back
 * in the row of tabs. Lives in the wall so it is there whichever way the box
 * was reached.
 */
function StarBox({ divider }: { divider: Divider }) {
  const [starred, patch] = useOptimistic(!!divider.starred, (_s, n: boolean) => n);
  const [, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        const next = !starred;
        startTransition(async () => {
          patch(next);
          await setBookFavorite(divider.id, next);
        });
      }}
      aria-pressed={starred}
      className={`tap inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.95rem] font-bold ${
        starred
          ? "border-pink-deep bg-pink-deep text-page"
          : "border-line bg-card text-ink"
      }`}
    >
      <StarIcon
        className={`h-5 w-5 ${starred ? "text-butter" : "text-browned"}`}
        filled={starred}
      />
      {starred ? "Starred" : "Star this box"}
    </button>
  );
}

function Tab({
  d,
  selected,
  onPick,
  hit = false,
}: {
  d: Divider;
  selected: boolean;
  onPick: (d: Divider) => void;
  /** found by name through the search line */
  hit?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => onPick(d)}
      className="divider-tab"
      data-hit={hit ? "true" : undefined}
    >
      {d.name}
      {d.kind === "shared" && d.ownerName ? (
        <span className="count">from {d.ownerName}</span>
      ) : null}
    </button>
  );
}

/**
 * Every named box, A to Z, inside the wall. Past a dozen they are grouped
 * under their first letter so a long list can be skimmed like an index.
 */
function AllBoxes({
  boxes,
  selectedId,
  onPick,
  onClose,
}: {
  boxes: Divider[];
  selectedId: string;
  onPick: (d: Divider) => void;
  onClose: () => void;
}) {
  const grouped = boxes.length >= LETTER_GROUPS_FROM;
  const groups = useMemo(() => {
    if (!grouped) return [{ letter: "", boxes }];
    const map = new Map<string, Divider[]>();
    for (const b of boxes) {
      const letter = /^[a-z]/i.test(b.name) ? b.name[0].toUpperCase() : "#";
      map.set(letter, [...(map.get(letter) ?? []), b]);
    }
    return [...map.entries()].map(([letter, bs]) => ({ letter, boxes: bs }));
  }, [boxes, grouped]);

  return (
    <section
      id="all-boxes"
      className="mb-4 rounded-[5px] bg-sink px-3 pt-2.5 pb-3"
      aria-label="All boxes"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="font-display text-[1.25rem] leading-none text-browned">
          All your boxes, A to Z
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="tap -mr-2 rounded-full px-3 text-[0.9rem] font-bold text-pink-deep"
        >
          Close
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {groups.map(({ letter, boxes: bs }, gi) => (
          <div
            key={letter || "all"}
            className={`flex flex-wrap items-center gap-1.5 ${gi > 0 ? "ml-2" : ""}`}
          >
            {letter ? (
              <span
                className="font-display w-4 text-[1.25rem] leading-none text-pink-deep"
                aria-hidden
              >
                {letter}
              </span>
            ) : null}
            {bs.map((d) => {
              const selected = d.id === selectedId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onPick(d)}
                  aria-pressed={selected}
                  className={`tap inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[1rem] font-bold ${
                    selected
                      ? "border-pink-deep bg-pink-deep text-page"
                      : "border-line bg-card text-ink"
                  }`}
                >
                  {d.name}
                  {d.count ? (
                    <span
                      className={`text-[0.8rem] font-normal ${
                        selected ? "text-page/85" : "text-muted"
                      }`}
                    >
                      {d.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function Empty({
  title,
  line,
  action,
}: {
  title: string;
  line: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <p className="font-display text-[1.9rem] leading-tight text-pink-deep">{title}</p>
      <p className="hand mt-2 max-w-[28ch] text-balance">{line}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}
