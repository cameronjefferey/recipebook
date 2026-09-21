import { redirect } from "next/navigation";

/** Search lives on the box. Old links still land there. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  const search = params.toString();
  redirect(search ? `/box/all?${search}` : "/box/all");
}
