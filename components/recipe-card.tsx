import Link from "next/link";
import type { WallCard } from "@/lib/recipes";
import { CategoryIcon } from "@/lib/category-icon";

/** Wear builds with use, then levels off so a favourite never looks ruined. */
function splatterOpacity(timesCooked: number) {
  return Math.min(timesCooked / 10, 1) * 0.5;
}

/** A little lean, stable per card, the way a real stack never sits square. */
const TILTS = [-1.2, -0.6, 0.6, 1.2];

/** A handled card is never quite square; none of these is near zero. */
function cardTilt(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 3)) % 97;
  return TILTS[n % TILTS.length];
}

/**
 * One card on the wall. The photograph is the face of the card, because that
 * is how a card is recognised in a real box: the stain, the colour of the
 * paper, the plate. A card with no photo shows its title on the ruled lines
 * instead, the way a freshly written one would.
 */
export function RecipeCard({
  recipe,
  imageBase = "/api/images",
  priority = false,
}: {
  recipe: Pick<
    WallCard,
    "id" | "title" | "category" | "status" | "timesCooked" | "imageId" | "rotation"
  >;
  imageBase?: string;
  /** the first row of cards is above the fold; let the browser know */
  priority?: boolean;
}) {
  const cooked = recipe.timesCooked > 0;
  const note = [
    recipe.category,
    cooked
      ? `cooked ${recipe.timesCooked}×`
      : recipe.status === "want_to_try"
        ? "want to try"
        : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/r/${recipe.id}`}
      className="dog-ear index-card group relative flex h-full flex-col overflow-hidden border border-line transition-transform duration-200 ease-out active:scale-[0.985]"
      style={{ rotate: `${cardTilt(recipe.id)}deg` }}
    >
      {recipe.status === "keeper" ? <span className="ribbon z-10" /> : null}

      {recipe.imageId ? (
        <span className="relative block aspect-[4/3] w-full overflow-hidden bg-sink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${imageBase}/${recipe.imageId}`}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="h-full w-full object-cover"
            style={{ rotate: `${recipe.rotation}deg` }}
          />
        </span>
      ) : (
        // No photo yet: the title is written straight onto the ruled lines,
        // sized to the rule so it sits on them the way handwriting does.
        <span className="relative block aspect-[4/3] w-full px-3 pt-[0.45rem]">
          <span className="font-display line-clamp-4 pr-7 text-[1.3rem] leading-[1.65rem]">
            {recipe.title}
          </span>
          <CategoryIcon
            category={recipe.category}
            className="absolute right-2.5 bottom-2 h-7 w-7 text-pink-mid"
          />
        </span>
      )}

      <span className="relative flex flex-1 flex-col px-3 pt-2.5 pb-3">
        {recipe.imageId ? (
          <span className="font-display line-clamp-2 text-[1.25rem] leading-tight">
            {recipe.title}
          </span>
        ) : null}
        {note ? (
          <span
            className={`text-[0.82rem] leading-snug text-muted ${recipe.imageId ? "mt-1" : ""}`}
          >
            {note}
          </span>
        ) : null}
      </span>

      <span
        className="splatter"
        style={{ "--splat": splatterOpacity(recipe.timesCooked) } as React.CSSProperties}
      />
      {cooked ? <span className="dog-ear-fold" /> : null}
    </Link>
  );
}
