import { redirect } from "next/navigation";

/**
 * The old photo grid. The box itself is now the one front door, so anything
 * that still points here is sent there, carrying whatever it was narrowed to
 * as a search.
 */
export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; tag?: string; q?: string }>;
}) {
  const { status, category, tag, q } = await searchParams;
  const params = new URLSearchParams();
  if (status === "keeper") params.set("d", "keepers");
  else if (status === "want_to_try") params.set("d", "want-to-try");
  const query = q ?? tag ?? category;
  if (query) params.set("q", query);
  redirect(params.size ? `/box?${params}` : "/box");
}
