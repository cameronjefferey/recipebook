import "server-only";
import { and, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeTags } from "@/lib/db/schema";
import type { Ingredient, Instruction } from "@/lib/db/schema";
import type { CurrentUser } from "@/lib/auth";
import { visibleRecipe } from "@/lib/access";
import { fetchPage } from "@/lib/import-url";
import { parseRecipeJsonLd, type ImportedRecipe } from "@/lib/recipe-jsonld";
import { sourceKeyOf } from "@/lib/source-key";

/**
 * A recipe that another recipe is partly made of — the street corn salad
 * inside the street corn kale salad. Nothing about it is special; it is an
 * ordinary recipe that something else points at.
 */
export type ComponentRecipe = {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
};

/**
 * A page can lean on a couple of others; if it appears to lean on a dozen, the
 * links are decoration and following them would turn one paste into a spree.
 */
const MOST_COMPONENTS = 4;

/** The heading a component's own ingredients and steps are filed under. */
export function componentGroup(title: string) {
  return `For the ${title}`;
}

function withoutComponent(ing: Ingredient): Ingredient {
  if (!ing.component) return ing;
  const bare = { ...ing };
  delete bare.component;
  return bare;
}

function keysOf(ingredients: Ingredient[]) {
  const keys = new Map<string, string>();
  for (const ing of ingredients) {
    const key = sourceKeyOf(ing.component);
    if (key && !keys.has(key)) keys.set(key, ing.component!);
  }
  return keys;
}

async function findByKey(
  householdId: string,
  keys: string[],
  also?: SQL,
) {
  if (!keys.length) return [];
  return db
    .select({
      id: recipes.id,
      title: recipes.title,
      sourceKey: recipes.sourceKey,
      ingredients: recipes.ingredients,
      instructions: recipes.instructions,
    })
    .from(recipes)
    .where(
      and(
        eq(recipes.householdId, householdId),
        inArray(recipes.sourceKey, keys),
        also,
      ),
    );
}

/** Write an imported recipe to the shelf. Used for the one you asked for and for its parts. */
export async function saveImported(
  user: CurrentUser,
  url: string,
  imported: ImportedRecipe,
  ingredients: Ingredient[] = imported.ingredients,
) {
  const [row] = await db
    .insert(recipes)
    .values({
      householdId: user.householdId,
      createdBy: user.id,
      title: imported.title,
      description: imported.description,
      category: imported.category,
      servings: imported.servings,
      servingsText: imported.servingsText,
      prepMinutes: imported.prepMinutes,
      cookMinutes: imported.cookMinutes,
      ingredients,
      instructions: imported.instructions,
      notes: imported.notes,
      sourceKind: "web",
      sourceUrl: url,
      sourceKey: sourceKeyOf(url),
      sourceName: imported.sourceName,
      needsReview: imported.needsReview,
    })
    .returning({ id: recipes.id });

  if (imported.tags.length) {
    await db
      .insert(recipeTags)
      .values(imported.tags.map((tag) => ({ recipeId: row.id, tag })))
      .onConflictDoNothing();
  }

  return row.id;
}

/**
 * Bring in the recipes this ingredient list points at, and hand back the list
 * with the pointers that came to nothing removed, so the page never offers a
 * recipe that is not there.
 *
 * One level deep. The street corn salad comes in with the salad; whatever the
 * street corn salad links to does not, or one paste could walk a whole site.
 * A part that cannot be read is skipped rather than failing the import — you
 * asked for the salad, and you should get it.
 */
export async function bringInComponents(
  user: CurrentUser,
  ingredients: Ingredient[],
): Promise<Ingredient[]> {
  const wanted = keysOf(ingredients);
  if (!wanted.size) return ingredients;

  const known = new Set(
    (await findByKey(user.householdId, [...wanted.keys()]))
      .map((r) => r.sourceKey)
      .filter((k): k is string => !!k),
  );

  const missing = [...wanted]
    .filter(([key]) => !known.has(key))
    .slice(0, MOST_COMPONENTS);

  const added = await Promise.all(
    missing.map(async ([key, url]) => {
      try {
        const { html, host, finalUrl } = await fetchPage(url);
        // Only pages that publish their own markup. Reading a part with the
        // model would be slow, and guessy, for something nobody asked for.
        const part = parseRecipeJsonLd(html, host, finalUrl);
        if (!part) return null;

        // Depth stops here, so the part's own links are dropped rather than
        // left dangling at a recipe that was never brought in.
        await saveImported(user, url, part, part.ingredients.map(withoutComponent));
        return key;
      } catch {
        return null;
      }
    }),
  );

  const resolved = new Set([...known, ...added.filter((k): k is string => !!k)]);

  return ingredients.map((ing) => {
    const key = sourceKeyOf(ing.component);
    return key && resolved.has(key) ? ing : withoutComponent(ing);
  });
}

/**
 * The component recipes an ingredient list points at, by the address it points
 * with.
 *
 * Two rules, and both matter. The parts belong to whoever owns the recipe, not
 * to whoever is reading it — otherwise opening a salad somebody shared would
 * quietly fold *your* street corn salad into *her* recipe. And a part still
 * has to be one you are allowed to see, so sharing one recipe out of a book
 * does not hand over everything it happens to mention.
 */
export async function loadComponents(
  user: CurrentUser,
  ownerHouseholdId: string,
  ingredients: Ingredient[],
): Promise<Map<string, ComponentRecipe>> {
  const wanted = keysOf(ingredients);
  if (!wanted.size) return new Map();

  const rows = await findByKey(
    ownerHouseholdId,
    [...wanted.keys()],
    visibleRecipe(user),
  );
  const byKey = new Map(rows.map((r) => [r.sourceKey!, r]));

  const out = new Map<string, ComponentRecipe>();
  for (const [key, url] of wanted) {
    const row = byKey.get(key);
    if (row) {
      out.set(url, {
        id: row.id,
        title: row.title,
        ingredients: row.ingredients,
        instructions: row.instructions,
      });
    }
  }
  return out;
}

/**
 * Fold the components into the recipe so that everything downstream — the
 * ingredient list, the shopping it implies, cook mode — sees one recipe.
 *
 * Their ingredients go after the recipe's own, under a heading naming the
 * part. Their steps go *before* it, because you make the street corn salad
 * and then build the salad, never the other way round.
 */
export function withComponents(
  recipe: { ingredients: Ingredient[]; instructions: Instruction[] },
  components: Map<string, ComponentRecipe>,
) {
  if (!components.size) {
    return { ingredients: recipe.ingredients, instructions: recipe.instructions };
  }

  // In the order the cook meets them, and only once even if two lines point
  // at the same part.
  const seen = new Set<string>();
  const parts: ComponentRecipe[] = [];
  for (const ing of recipe.ingredients) {
    const part = ing.component ? components.get(ing.component) : undefined;
    if (part && !seen.has(part.id)) {
      seen.add(part.id);
      parts.push(part);
    }
  }

  const ingredients = [
    ...recipe.ingredients,
    ...parts.flatMap((part) =>
      part.ingredients.map((ing) => ({
        ...ing,
        // A part's own internal headings would be adrift once folded in here.
        group: componentGroup(part.title),
      })),
    ),
  ];

  const instructions = [
    ...parts.flatMap((part) =>
      part.instructions.map((step) => ({
        ...step,
        group: componentGroup(part.title),
      })),
    ),
    ...recipe.instructions,
  ];

  return { ingredients, instructions };
}
