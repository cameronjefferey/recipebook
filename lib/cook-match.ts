import type { Ingredient } from "@/lib/db/schema";

/**
 * Words that look like food but are how the card describes it, not what
 * to look for in a step. "ground turkey" should match "turkey"; "small
 * red onion" should match "onion".
 */
const SKIP = new Set([
  "a",
  "an",
  "and",
  "or",
  "the",
  "of",
  "with",
  "for",
  "to",
  "in",
  "on",
  "into",
  "from",
  "plus",
  "optional",
  "fresh",
  "dried",
  "unsalted",
  "salted",
  "ground",
  "large",
  "small",
  "medium",
  "chopped",
  "minced",
  "sliced",
  "diced",
  "grated",
  "shredded",
  "crushed",
  "whole",
  "raw",
  "cooked",
  "thin",
  "thick",
  "extra",
  "virgin",
  "all",
  "purpose",
  "white",
  "red",
  "black",
  "green",
  "yellow",
  "sweet",
  "hot",
  "juice",
  "zest",
  "water",
  "mixture",
  "pinch",
  "taste",
  "dash",
  "stick",
  "sticks",
  "can",
  "cans",
  "package",
  "packages",
]);

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function needlesFor(item: string): string[] {
  const phrase = normalize(item);
  if (!phrase) return [];
  const words = phrase.split(" ").filter((w) => w.length >= 3 && !SKIP.has(w));
  const out: string[] = [];
  if (phrase.length >= 4) out.push(phrase);
  if (words.length >= 2) out.push(words.slice(-2).join(" "));
  for (const word of words) out.push(word);
  return [...new Set(out)].sort((a, b) => b.length - a.length);
}

function haystack(text: string) {
  return ` ${normalize(text)} `;
}

function mentions(hay: string, needle: string) {
  const body = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(` ${body}(?:es|s)? `).test(hay);
}

/**
 * Which ingredients a step is talking about, as indexes into the list.
 * Longer names win: "olive oil" beats a lone "oil" sitting next to it.
 */
export function ingredientsMentionedIn(
  stepText: string,
  ingredients: Ingredient[],
): number[] {
  const hay = haystack(stepText);
  const scored: { at: number; score: number }[] = [];

  ingredients.forEach((ing, at) => {
    const needles = needlesFor(ing.item);
    const hit = needles.find((needle) => mentions(hay, needle));
    if (hit) scored.push({ at, score: hit.length });
  });

  scored.sort((a, b) => b.score - a.score);
  const taken = new Set<number>();
  const out: number[] = [];
  for (const { at } of scored) {
    if (taken.has(at)) continue;
    taken.add(at);
    out.push(at);
  }
  return out.sort((a, b) => a - b);
}

export function leftoverIngredients(
  steps: { text: string }[],
  ingredients: Ingredient[],
): number[] {
  const mentioned = new Set<number>();
  for (const step of steps) {
    for (const at of ingredientsMentionedIn(step.text, ingredients)) {
      mentioned.add(at);
    }
  }
  return ingredients.map((_, at) => at).filter((at) => !mentioned.has(at));
}
