import Link from "next/link";
import type { RecipeCard as Card } from "@/lib/recipes";
import { CategoryIcon } from "@/lib/category-icon";

/** Wear builds with use, then levels off so a favourite never looks ruined. */
function splatterOpacity(timesCooked: number) {
  return Math.min(timesCooked / 10, 1) * 0.5;
}

export function RecipeCard({ recipe }: { recipe: Card }) {
  const cooked = recipe.timesCooked > 0;

  return (
    <Link
      href={`/r/${recipe.id}`}
      className="dog-ear group relative block overflow-hidden rounded-card border border-line bg-card shadow-[0_1px_3px_#382a2214] active:brightness-[0.98]"
    >
      {recipe.status === "keeper" ? <span className="ribbon" /> : null}

      <div className="relative aspect-4/3 bg-sink">
        {recipe.imageId ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/images/${recipe.imageId}`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ rotate: `${recipe.rotation}deg` }}
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <CategoryIcon category={recipe.category} className="h-10 w-10 text-pink-mid" />
          </span>
        )}
      </div>

      <div className="relative p-3">
        <h3 className="font-display line-clamp-2 text-[1.05rem] leading-snug">
          {recipe.title}
        </h3>
        <p className="mt-1 text-[0.8rem] text-muted">
          {[
            recipe.category,
            recipe.servings ? `serves ${recipe.servings}` : null,
            cooked
              ? `cooked ${recipe.timesCooked}×`
              : recipe.status === "want_to_try"
                ? "want to try"
                : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <span
        className="splatter"
        style={{ "--splat": splatterOpacity(recipe.timesCooked) } as React.CSSProperties}
      />
      {cooked ? <span className="dog-ear-fold" /> : null}
    </Link>
  );
}
