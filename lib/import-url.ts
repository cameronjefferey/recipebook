import "server-only";
import { parseIngredient } from "@/lib/ingredients";
import { transcribeText } from "@/lib/ai/transcribe";
import type { Ingredient, Instruction } from "@/lib/db/schema";

export type ImportedRecipe = {
  title: string;
  description: string | null;
  category: string | null;
  servings: number | null;
  servingsText: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
  notes: string | null;
  tags: string[];
  sourceName: string;
  /** true when this came from the model rather than the site's own markup */
  needsReview: boolean;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

function collectNodes(json: any): any[] {
  if (Array.isArray(json)) return json.flatMap(collectNodes);
  if (json && typeof json === "object") {
    const nested = json["@graph"] ? collectNodes(json["@graph"]) : [];
    return [json, ...nested];
  }
  return [];
}

function isRecipeNode(node: any) {
  const type = node?.["@type"];
  return Array.isArray(type) ? type.includes("Recipe") : type === "Recipe";
}

function textOf(value: any): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(" ");
  if (value && typeof value === "object") return textOf(value.text ?? value.name);
  return "";
}

function flattenInstructions(value: any, group: string | null = null): Instruction[] {
  if (!value) return [];
  if (typeof value === "string") {
    // Some sites dump the whole method into one string.
    return value
      .split(/\r?\n|(?<=\.)\s{2,}/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text, group }));
  }
  if (Array.isArray(value)) return value.flatMap((v) => flattenInstructions(v, group));

  const type = value["@type"];
  if (type === "HowToSection") {
    return flattenInstructions(value.itemListElement, textOf(value.name) || group);
  }
  const text = textOf(value);
  return text ? [{ text, group }] : [];
}

function parseServings(value: any): { servings: number | null; text: string | null } {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null) return { servings: null, text: null };
  const text = String(raw);
  const match = text.match(/\d+/);
  return { servings: match ? Number(match[0]) : null, text };
}

/** ISO 8601 duration, e.g. PT1H30M. */
function parseMinutes(value: any): number | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return null;
  const minutes = Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
  return minutes || null;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ")
    .trim();
}

export async function importFromUrl(url: string): Promise<ImportedRecipe> {
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
  });
  if (!response.ok) throw new Error("That page could not be opened.");

  const html = await response.text();
  const host = parsedUrl.hostname.replace(/^www\./, "");

  // Most recipe sites publish schema.org/Recipe. That path is exact and free,
  // so the model is only a fallback.
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const script of scripts) {
    let json: unknown;
    try {
      json = JSON.parse(script[1].trim());
    } catch {
      continue;
    }
    const node = collectNodes(json).find(isRecipeNode);
    if (!node) continue;

    const yieldInfo = parseServings(node.recipeYield);
    const ingredients: Ingredient[] = (node.recipeIngredient ?? [])
      .map((line: unknown) => String(line))
      .filter(Boolean)
      .map((line: string) => parseIngredient(line));

    const instructions = flattenInstructions(node.recipeInstructions);
    if (!ingredients.length && !instructions.length) continue;

    const categories = node.recipeCategory;
    const keywords = node.keywords;

    return {
      title: textOf(node.name) || "Untitled recipe",
      description: textOf(node.description) || null,
      category: Array.isArray(categories)
        ? textOf(categories[0]) || null
        : textOf(categories) || null,
      servings: yieldInfo.servings,
      servingsText: yieldInfo.text,
      prepMinutes: parseMinutes(node.prepTime),
      cookMinutes: parseMinutes(node.cookTime),
      ingredients,
      instructions,
      notes: null,
      tags: (typeof keywords === "string"
        ? keywords.split(",")
        : Array.isArray(keywords)
          ? keywords.map(textOf)
          : []
      )
        .map((t: string) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8),
      sourceName: host,
      needsReview: false,
    };
  }

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
