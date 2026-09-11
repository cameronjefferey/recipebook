/**
 * Fill in component recipes for recipes imported before the app knew to look
 * for them.
 *
 *   npx tsx scripts/rescan-components.ts              # say what would change
 *   npx tsx scripts/rescan-components.ts --write      # change it
 *   DATABASE_URL=... npx tsx scripts/rescan-components.ts --write
 *
 * Re-fetches each recipe's source page and does one thing: marks the
 * ingredients that were a link to another recipe, bringing that recipe in if
 * it is not here already. Titles, steps, notes, tags and photographs are not
 * touched. A page that has moved, gone, or lost its markup is skipped.
 */
import { loadEnvFile } from "node:process";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { recipes, recipeTags, type Ingredient } from "../lib/db/schema";
import { formatIngredient } from "../lib/ingredients";
import { parseRecipeJsonLd } from "../lib/recipe-jsonld";
import { sourceKeyOf } from "../lib/source-key";

try {
  loadEnvFile(".env.local");
} catch {}

const WRITE = process.argv.includes("--write");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required.");
  process.exit(2);
}

const client = postgres(url);
const db = drizzle(client);

const same = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const lineKey = (ing: Ingredient) => same(formatIngredient(ing));

async function fetchPage(target: string) {
  const parsed = new URL(target);
  const response = await fetch(target, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PinkRecipeBox/1.0; personal recipe archive)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return {
    html: await response.text(),
    host: parsed.hostname.replace(/^www\./, ""),
    finalUrl: response.url || target,
  };
}

async function main() {
const all = await db
  .select({
    id: recipes.id,
    title: recipes.title,
    householdId: recipes.householdId,
    createdBy: recipes.createdBy,
    sourceUrl: recipes.sourceUrl,
    ingredients: recipes.ingredients,
  })
  .from(recipes)
  .where(isNotNull(recipes.sourceUrl));

console.log(`${all.length} imported recipes to look at${WRITE ? "" : "  (dry run)"}\n`);

let changed = 0;
let broughtIn = 0;

for (const recipe of all) {
  let fresh;
  try {
    const { html, host, finalUrl } = await fetchPage(recipe.sourceUrl!);
    fresh = parseRecipeJsonLd(html, host, finalUrl);
  } catch (err) {
    console.log(`  --  ${recipe.title}: could not read the page (${(err as Error).message})`);
    continue;
  }
  if (!fresh) {
    console.log(`  --  ${recipe.title}: no recipe markup on the page any more`);
    continue;
  }

  const links = new Map<string, string>();
  for (const ing of fresh.ingredients) {
    if (ing.component) links.set(lineKey(ing), ing.component);
  }
  if (!links.size) continue;

  // Only lines that still read the same are marked, so a page rewritten since
  // it was saved cannot put a link against the wrong ingredient.
  const marked = recipe.ingredients.map((ing) => {
    const href = links.get(lineKey(ing));
    return href && !ing.component ? { ...ing, component: href } : ing;
  });
  const wanted = new Map<string, string>();
  for (const ing of marked) {
    const key = sourceKeyOf(ing.component);
    if (key && !wanted.has(key)) wanted.set(key, ing.component!);
  }
  if (!wanted.size) continue;

  // What is already on the shelf, and what has to be fetched.
  const present = new Set(
    (
      await db
        .select({ sourceKey: recipes.sourceKey })
        .from(recipes)
        .where(
          and(
            eq(recipes.householdId, recipe.householdId),
            inArray(recipes.sourceKey, [...wanted.keys()]),
          ),
        )
    )
      .map((r) => r.sourceKey)
      .filter((k): k is string => !!k),
  );

  const names: string[] = [];
  for (const [key, href] of wanted) {
    if (present.has(key)) continue;
    try {
      const { html, host, finalUrl } = await fetchPage(href);
      const part = parseRecipeJsonLd(html, host, finalUrl);
      if (!part) continue;

      if (WRITE) {
        const bare = part.ingredients.map((ing) => {
          const copy = { ...ing };
          delete copy.component;
          return copy;
        });
        const [row] = await db
          .insert(recipes)
          .values({
            householdId: recipe.householdId,
            createdBy: recipe.createdBy,
            title: part.title,
            description: part.description,
            category: part.category,
            servings: part.servings,
            servingsText: part.servingsText,
            prepMinutes: part.prepMinutes,
            cookMinutes: part.cookMinutes,
            ingredients: bare,
            instructions: part.instructions,
            notes: part.notes,
            sourceKind: "web",
            sourceUrl: href,
            sourceKey: key,
            sourceName: part.sourceName,
            needsReview: part.needsReview,
          })
          .returning({ id: recipes.id });
        if (part.tags.length) {
          await db
            .insert(recipeTags)
            .values(part.tags.map((tag) => ({ recipeId: row.id, tag })))
            .onConflictDoNothing();
        }
      }
      present.add(key);
      names.push(part.title);
      broughtIn++;
    } catch {
      // Leave it unmarked rather than pointing at a recipe that is not here.
    }
  }

  const final = marked.map((ing) => {
    const key = sourceKeyOf(ing.component);
    if (!ing.component || (key && present.has(key))) return ing;
    const copy = { ...ing };
    delete copy.component;
    return copy;
  });

  const linked = final.filter((i) => i.component);
  if (!linked.length) continue;

  if (WRITE) {
    await db
      .update(recipes)
      .set({ ingredients: final, updatedAt: new Date() })
      .where(eq(recipes.id, recipe.id));
  }
  changed++;
  console.log(
    `  ok  ${recipe.title}: ${linked.length} ingredient${linked.length === 1 ? "" : "s"} ` +
      `now a recipe${names.length ? ` (added ${names.join(", ")})` : " (already on the shelf)"}`,
  );
}

console.log(
  `\n${changed} recipe${changed === 1 ? "" : "s"} linked up, ${broughtIn} new recipe${
    broughtIn === 1 ? "" : "s"
  } brought in${WRITE ? "" : " — nothing written, run again with --write"}`,
);

await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
