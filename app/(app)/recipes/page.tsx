import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/recipes";
import { BoxGrid } from "@/components/box-grid";
import { BackLink, ButtonLink } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  keeper: "Keepers",
  want_to_try: "Want to try",
  nope: "Nope",
};

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; tag?: string }>;
}) {
  const user = await requireUser();
  const filters = await searchParams;

  const recipes = await listRecipes(user.householdId, filters);
  const heading = filters.tag || filters.category || STATUS_LABELS[filters.status ?? ""];

  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, ...patch })) {
      if (v) next.set(k, v);
    }
    const s = next.toString();
    return s ? `/recipes?${s}` : "/recipes";
  };

  const slips = [
    filters.status
      ? {
          key: "status",
          label: STATUS_LABELS[filters.status] ?? filters.status,
          href: qs({ status: undefined }),
        }
      : null,
    filters.category
      ? {
          key: "category",
          label: filters.category,
          href: qs({ category: undefined }),
        }
      : null,
    filters.tag
      ? { key: "tag", label: filters.tag, href: qs({ tag: undefined }) }
      : null,
  ].filter((slip) => slip !== null);

  const narrowed = slips.length > 0;

  return (
    <div className="space-y-4">
      {slips.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {slips.map((slip) => (
            <li key={slip.key}>
              <Link
                href={slip.href}
                className="tap inline-flex h-12 items-center gap-2 rounded-full bg-pink-soft px-4 text-[0.95rem] font-bold text-pink"
              >
                {slip.label}
                <span aria-hidden>×</span>
                <span className="sr-only">Clear {slip.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {recipes.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-2xl text-pink">
            {narrowed ? "Nothing under that" : "The box is empty"}
          </p>
          <p className="hand mt-2 text-browned">
            {narrowed
              ? "clear it and the cards come back"
              : "start with a card from the kitchen drawer"}
          </p>
          <ButtonLink
            href={narrowed ? "/recipes" : "/add"}
            variant={narrowed ? "secondary" : undefined}
            className="mt-6"
          >
            {narrowed ? "Show everything" : "Put a card in"}
          </ButtonLink>
        </div>
      ) : (
        <BoxGrid
          recipes={recipes}
          planEnabled={user.mealPlanEnabled}
          lead={
            <>
              <BackLink href="/box" label="Back to the box" />
              {heading ? (
                <h1 className="font-display min-w-0 truncate text-2xl">
                  {heading}
                </h1>
              ) : (
                <p className="hand min-w-0 truncate">every card, laid out</p>
              )}
            </>
          }
        />
      )}
    </div>
  );
}
