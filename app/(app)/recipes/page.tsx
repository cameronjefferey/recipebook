import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listRecipes, listCategories } from "@/lib/recipes";
import { BoxGrid } from "@/components/box-grid";
import { ButtonLink } from "@/components/ui";

const STATUS_FILTERS = [
  { key: "", label: "Everything" },
  { key: "keeper", label: "Keepers" },
  { key: "want_to_try", label: "Want to try" },
  { key: "nope", label: "Nope" },
];

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

  return (
    <div className="space-y-4">
      {/* Tab dividers, the way a real recipe box is organised. */}
      <nav className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2 pb-1">
          {STATUS_FILTERS.map(({ key, label }) => {
            const active = (filters.status ?? "") === key;
            return (
              <li key={key || "all"}>
                <Link
                  href={qs({ status: key || undefined })}
                  className={`inline-flex h-10 items-center rounded-t-lg border-x border-t px-4 text-[0.9rem] font-bold whitespace-nowrap ${
                    active
                      ? "border-line bg-card text-pink"
                      : "border-transparent bg-sink text-muted"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {categories.length > 0 ? (
        <nav className="-mx-4 overflow-x-auto px-4">
          <ul className="flex gap-2">
            {categories.map((category) => {
              const active = filters.category === category;
              return (
                <li key={category}>
                  <Link
                    href={qs({ category: active ? undefined : category })}
                    className={`inline-flex h-9 items-center rounded-full px-4 text-[0.85rem] font-bold whitespace-nowrap ${
                      active
                        ? "bg-pink text-page"
                        : "bg-pink-soft text-pink"
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
        <div className="py-16 text-center">
          <p className="font-display text-2xl text-pink">The box is empty</p>
          <p className="hand mt-2 text-browned">
            start with a card from the kitchen drawer
          </p>
          <ButtonLink href="/add" className="mt-6">
            Add the first recipe
          </ButtonLink>
        </div>
      ) : (
        <BoxGrid recipes={recipes} planEnabled={user.mealPlanEnabled} />
      )}
    </div>
  );
}
