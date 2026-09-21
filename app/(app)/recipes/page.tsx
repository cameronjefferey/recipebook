import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listRecipes, listCategories } from "@/lib/recipes";
import { BoxGrid } from "@/components/box-grid";
import { ButtonLink } from "@/components/ui";

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

  const [recipes, categories] = await Promise.all([
    listRecipes(user.householdId, filters),
    listCategories(user.householdId),
  ]);

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
      <div>
        <h1 className="font-display text-2xl">The cards</h1>
        <p className="hand mt-1">pick a few, or open one</p>
      </div>

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

      {categories.length > 0 ? (
        <nav className="-mx-4 overflow-x-auto px-4">
          <ul className="flex gap-2">
            {categories.map((category) => {
              const active = filters.category === category;
              return (
                <li key={category}>
                  <Link
                    href={qs({ category: active ? undefined : category })}
                    className={`tap inline-flex h-12 items-center rounded-full px-4 text-[0.95rem] font-bold whitespace-nowrap ${
                      active ? "bg-pink text-page" : "bg-pink-soft text-pink"
                    }`}
                  >
                    {category}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {recipes.length === 0 ? (
        narrowed ? (
          <div className="py-16 text-center">
            <p className="font-display text-2xl text-pink">Nothing under that</p>
            <p className="hand mt-2 text-browned">clear it and the cards come back</p>
            <ButtonLink href="/recipes" variant="secondary" className="mt-6">
              Show everything
            </ButtonLink>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-display text-2xl text-pink">The box is empty</p>
            <p className="hand mt-2 text-browned">
              start with a card from the kitchen drawer
            </p>
            <ButtonLink href="/add" className="mt-6">
              Add the first recipe
            </ButtonLink>
          </div>
        )
      ) : (
        <BoxGrid recipes={recipes} planEnabled={user.mealPlanEnabled} />
      )}
    </div>
  );
}
