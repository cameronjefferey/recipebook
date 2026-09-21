import Link from "next/link";
import type { RecipeCard as Card } from "@/lib/recipes";

/** Wear builds with use, then levels off so a favourite never looks ruined. */
function splatterOpacity(timesCooked: number) {
  return Math.min(timesCooked / 10, 1) * 0.5;
}

/** A little lean, stable per card, the way a real stack never sits square. */
function cardTilt(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 3)) % 9;
  return (n - 4) * 0.45;
}

export function RecipeCard({ recipe }: { recipe: Card }) {
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
      className="dog-ear index-card group relative block min-h-[9.25rem] overflow-hidden border border-line px-3 pt-3.5 pb-3 active:brightness-[0.98]"
      style={{ rotate: `${cardTilt(recipe.id)}deg` }}
    >
      {recipe.status === "keeper" ? <span className="ribbon" /> : null}

      {recipe.imageId ? (
        <span className="absolute top-2.5 right-2.5 h-12 w-12 overflow-hidden rounded-[2px] border border-line bg-sink shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/images/${recipe.imageId}`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ rotate: `${recipe.rotation}deg` }}
          />
        </span>
      ) : null}

      <h3
        className={`font-display relative text-[1.15rem] leading-snug ${
          recipe.imageId ? "pr-14" : recipe.status === "keeper" ? "pr-9" : "pr-6"
        }`}
      >
        {recipe.title}
      </h3>
      {note ? (
        <p className="relative mt-2 text-[0.8rem] text-muted">{note}</p>
      ) : null}

      <span
        className="splatter"
        style={{ "--splat": splatterOpacity(recipe.timesCooked) } as React.CSSProperties}
      />
      {cooked ? <span className="dog-ear-fold" /> : null}
    </Link>
  );
}
