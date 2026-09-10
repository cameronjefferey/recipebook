import Form from "next/form";
import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/recipes";
import { RecipeCard } from "@/components/recipe-card";
import { Input } from "@/components/ui";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;

  const results = q ? await listRecipes(user.householdId, { q }) : [];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl">Search</h1>

      <Form action="/search">
        <Input
          name="q"
          defaultValue={q}
          type="search"
          autoFocus
          placeholder="Chicken, or a name you remember"
          aria-label="Search your recipes"
        />
      </Form>

      {q ? (
        results.length ? (
          <ul className="grid grid-cols-2 gap-3">
            {results.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-10 text-center text-muted">
            Nothing matched “{q}”.
          </p>
        )
      ) : (
        <p className="py-10 text-center text-muted">
          Search titles, notes, and ingredients.
        </p>
      )}
    </div>
  );
}
