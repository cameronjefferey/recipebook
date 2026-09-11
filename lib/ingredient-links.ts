import { sameSite } from "@/lib/source-key";

/**
 * Some ingredients are recipes: "1½ cups Mexican street corn salad" is a whole
 * other job, and the page says so by linking the words. schema.org throws that
 * away — `recipeIngredient` is plain text by definition — so the link has to be
 * recovered from the page itself and matched back onto the parsed lines.
 */

const NAMED: Record<string, string> = {
  amp: "&",
  nbsp: " ",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  frac12: "1/2",
  frac14: "1/4",
  frac34: "3/4",
};

/** Fractions reach us as glyphs in the page and as "1/2" in the markup. */
const VULGAR: Record<string, string> = {
  "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4",
  "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5", "⅙": "1/6",
  "⅚": "5/6", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8",
};

function decodeEntities(text: string) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z0-9]+);/gi, (whole, name) => NAMED[name.toLowerCase()] ?? whole);
}

function textOf(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, " "));
}

/**
 * Down to the letters and digits, so "1  avocado (chopped and divided)" from
 * the markup and "1 avocado, chopped and divided" from the page are one line.
 */
export function normaliseLine(text: string) {
  let out = text;
  for (const [glyph, ascii] of Object.entries(VULGAR)) out = out.split(glyph).join(` ${ascii} `);
  return out
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Closing </li> is optional in HTML and plenty of sites leave it out, so read
 * each item up to whatever ends it.
 */
function listItems(html: string) {
  const items: string[] = [];
  const open = /<li\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = open.exec(html))) {
    const rest = html.slice(match.index + match[0].length, match.index + 4000);
    const end = rest.search(/<li\b|<\/li>|<\/ul>|<\/ol>/i);
    items.push(end === -1 ? rest : rest.slice(0, end));
  }
  return items;
}

/**
 * Same-site paths that are never a recipe. The first few are ordinary
 * WordPress archives; /go/ and /recommends/ are how affiliate links are
 * dressed up to look like part of the site.
 */
const NOT_A_RECIPE =
  /\/(go|recommends|shop|product|category|tag|author|page|wp-content|wp-admin|feed)\//i;

function linkIn(item: string, pageUrl: string) {
  for (const anchor of item.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = normaliseLine(textOf(anchor[2]));
    // "*" and "here" hang off notes rather than naming anything.
    if (label.length < 3) continue;

    let href: URL;
    try {
      href = new URL(decodeEntities(anchor[1]), pageUrl);
    } catch {
      continue;
    }
    if (href.protocol !== "http:" && href.protocol !== "https:") continue;

    // Off-site is shopping — the sea salt and the sriracha both point at
    // Amazon. A recipe worth keeping is one the same cook wrote.
    if (!sameSite(href.href, pageUrl)) continue;
    if (NOT_A_RECIPE.test(href.pathname)) continue;

    href.hash = "";
    if (href.href.replace(/\/$/, "") === pageUrl.replace(/\/$/, "")) continue;

    return href.href;
  }
  return null;
}

/**
 * For each ingredient line, the address it linked to in the page, or null.
 * Lines are matched by their words, because the markup and the page agree on
 * those even when they disagree about brackets and whitespace.
 */
export function ingredientLinks(
  html: string,
  pageUrl: string,
  lines: string[],
): (string | null)[] {
  const found = new Map<string, string>();

  for (const item of listItems(html)) {
    if (!item.includes("<a")) continue;
    const key = normaliseLine(textOf(item));
    if (!key || found.has(key)) continue;
    const href = linkIn(item, pageUrl);
    if (href) found.set(key, href);
  }

  return lines.map((line) => found.get(normaliseLine(line)) ?? null);
}
