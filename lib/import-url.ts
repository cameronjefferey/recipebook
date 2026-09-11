import "server-only";
import { transcribeText } from "@/lib/ai/transcribe";
import {
  parseRecipeJsonLd,
  stripHtml,
  type ImportedRecipe,
} from "@/lib/recipe-jsonld";

export type { ImportedRecipe };

export async function fetchPage(url: string) {
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("That does not look like a web address.");
  }

  const response = await fetch(url, {
    headers: {
      // Some recipe sites serve a stub to unknown clients.
      "User-Agent":
        "Mozilla/5.0 (compatible; PinkRecipeBox/1.0; personal recipe archive)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    // A recipe brings its components in with it, so a slow site must not be
    // allowed to hold the whole import open.
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("That page could not be opened.");

  return {
    html: await response.text(),
    host: parsedUrl.hostname.replace(/^www\./, ""),
    // Where we ended up after redirects, which is what relative links in the
    // page are relative to.
    finalUrl: response.url || url,
  };
}

export async function importFromUrl(url: string): Promise<ImportedRecipe> {
  const { html, host, finalUrl } = await fetchPage(url);

  const fromMarkup = parseRecipeJsonLd(html, host, finalUrl);
  if (fromMarkup) return fromMarkup;

  // No usable markup, so read the page text with the model.
  const page = await transcribeText(stripHtml(html).slice(0, 60_000), host);
  const first = page.recipes.find((r) => r.role === "main") ?? page.recipes[0];
  if (!first) throw new Error("No recipe was found on that page.");

  return {
    title: first.title,
    description: first.description ?? null,
    category: first.category ?? null,
    servings: first.servings ?? null,
    servingsText: first.servingsText ?? null,
    prepMinutes: first.prepMinutes ?? null,
    cookMinutes: first.cookMinutes ?? null,
    ingredients: first.ingredients,
    instructions: first.instructions,
    notes: first.notes ?? null,
    tags: first.tags,
    sourceName: host,
    needsReview: true,
  };
}
