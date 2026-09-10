import { loadEnvFile } from "node:process";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  households,
  users,
  sessions,
  recipes,
  recipeTags,
  type Ingredient,
  type Instruction,
} from "../lib/db/schema";
import { parseIngredient } from "../lib/ingredients";

try {
  loadEnvFile(".env.local");
} catch {}

const ing = (lines: string[], group?: string): Ingredient[] =>
  lines.map((l) => parseIngredient(l, group ?? null));

const steps = (lines: string[], group?: string): Instruction[] =>
  lines.map((text) => ({ text, group: group ?? null }));

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  const [household] = await db
    .insert(households)
    .values({ name: "The Pink Recipe Box", inviteCode: "piecrust" })
    .returning();

  const [user] = await db
    .insert(users)
    .values({
      householdId: household.id,
      email: "mom@example.com",
      name: "Mom",
      passwordHash: await bcrypt.hash("piecrust123", 10),
    })
    .returning();

  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    id: createHash("sha256")
      .update(token + (process.env.SESSION_SECRET ?? ""))
      .digest("hex"),
    userId: user.id,
    expiresAt: new Date(Date.now() + 30 * 864e5),
  });

  // Modelled on the real sample pages, including a folded-in component recipe.
  const [burgers] = await db
    .insert(recipes)
    .values({
      householdId: household.id,
      createdBy: user.id,
      title: "Crispy Skillet Turkey Burgers",
      description:
        "A juicy turkey burger with genuinely crispy edges, from a panade of panko and mayonnaise.",
      category: "Mains",
      servings: 4,
      ingredients: [
        ...ing([
          "1 pound ground turkey",
          "1 cup panko bread crumbs",
          "2 ounces Monterey Jack cheese, shredded",
          "1/4 cup mayonnaise",
          "salt and pepper",
          "1 tablespoon vegetable oil",
          "4 hamburger buns, toasted and buttered",
        ]),
        ...ing(
          [
            "1 small red onion, halved and sliced thin",
            "2 jalapeno chiles, stemmed and sliced into thin rings",
            "1 cup white wine vinegar",
            "2 tablespoons lime juice",
            "1 tablespoon sugar",
            "1 teaspoon salt",
          ],
          "Pickled Onions",
        ),
      ],
      instructions: [
        ...steps([
          "Combine turkey, panko, Monterey Jack, mayonnaise, 1/2 teaspoon salt, and 1/2 teaspoon pepper in bowl.",
          "Using your hands, pat turkey mixture into four 3/4-inch-thick patties, about 4 inches in diameter. Season patties with salt and pepper.",
          "Heat oil in 12-inch nonstick skillet over medium heat until shimmering. Add patties and cook until well browned and meat registers 160 degrees, about 5 minutes per side.",
          "Place burgers on buns and serve.",
        ]),
        ...steps(
          [
            "Combine onion and jalapenos in medium bowl.",
            "Bring vinegar, lime juice, sugar, and salt to boil in small saucepan. Pour vinegar mixture over onion mixture and let sit for at least 30 minutes.",
          ],
          "Pickled Onions",
        ),
      ],
      notes:
        "Use 93 percent lean ground turkey, not 99 percent fat-free ground turkey breast, or the burgers will be tough.",
      status: "keeper",
      sourceKind: "page_photo",
      sourceName: "Cook's Country, Dec/Jan 2017, p. 11",
      timesCooked: 7,
      lastCookedAt: new Date(),
    })
    .returning();

  const [tart] = await db
    .insert(recipes)
    .values({
      householdId: household.id,
      createdBy: user.id,
      title: "Easy Peach and Blackberry Tart",
      description:
        "A rustic free-form tart with no top crust and no fussy crimping.",
      category: "Desserts",
      servings: 6,
      ingredients: ing([
        "1.5 cups all-purpose flour",
        "1/4 teaspoon salt",
        "10 tablespoons unsalted butter, cut into 1/2-inch pieces and chilled",
        "6-7 tablespoons ice water",
        "1 pound peaches, halved, pitted, and cut into 1/2-inch-thick wedges",
        "5 ounces blackberries",
        "6 tablespoons sugar",
      ]),
      instructions: steps([
        "Process flour and salt in food processor until combined, about 3 seconds. Scatter butter over top and pulse until mixture resembles coarse crumbs, about 10 pulses.",
        "Sprinkle 6 tablespoons ice water over mixture. Using rubber spatula, stir and press dough until it sticks together, adding up to 1 tablespoon more ice water if it will not come together.",
        "Turn dough onto lightly floured counter, form into a 4-inch disk, wrap tightly in plastic wrap, and refrigerate for 1 hour.",
        "Adjust oven rack to lower-middle position and heat oven to 375 degrees. Line rimmed baking sheet with parchment paper.",
        "Roll dough into 12-inch circle on lightly floured counter, then transfer to prepared sheet. Mound fruit in center, leaving a 2-inch border around edge. Fold dough up over fruit, overlapping every 2 inches.",
        "Bake until crust is deep golden brown and fruit is bubbling, 45 to 50 minutes. Let cool for 30 minutes and serve.",
      ]),
      notes:
        "Easy Apricot and Blueberry Tart: substitute apricots for peaches and blueberries for blackberries.\n\nEasy Plum and Raspberry Tart: substitute plums for peaches and raspberries for blackberries. Do not use frozen raspberries.",
      status: "want_to_try",
      sourceKind: "page_photo",
      sourceName: "Cook's Country, Aug/Sep 2017, p. 24",
    })
    .returning();

  const [carrots] = await db
    .insert(recipes)
    .values({
      householdId: household.id,
      createdBy: user.id,
      title: "Glazed Carrots with Lemon",
      category: "Sides",
      servings: 4,
      servingsText: "Serves 4",
      prepMinutes: 20,
      cookMinutes: 20,
      ingredients: ing([
        "1.25 pounds carrots, fairly thickly sliced",
        "3 tablespoons butter",
        "2 pearl onions, chopped",
        "strained juice and zest of 1/2 lemon",
        "1 teaspoon sesame seeds",
        "1 sprig fresh flat-leaf parsley, chopped",
        "olive oil, for drizzling",
        "salt and pepper",
      ]),
      instructions: steps([
        "Put the carrots in a bowl, add water to cover and a pinch of salt, and let soak for 15 minutes, then drain.",
        "Melt the butter in a pan, add the onions, and cook over low heat, stirring occasionally, for 5 minutes.",
        "Add the lemon juice and zest and cook for a further 10 minutes, then add the carrots, season with salt and pepper, and cook for an additional 10 minutes.",
        "Meanwhile, toast the sesame seeds in a heavy skillet for a few seconds until they give off their aroma.",
        "Remove the pan of carrots from the heat, transfer to a warm serving dish, and sprinkle with the parsley and sesame seeds. Drizzle with olive oil and serve.",
      ]),
      status: "none",
      sourceKind: "page_photo",
      sourceName: "The Silver Spoon, p. 504",
      timesCooked: 2,
    })
    .returning();

  await db.insert(recipeTags).values([
    { recipeId: burgers.id, tag: "turkey" },
    { recipeId: burgers.id, tag: "burgers" },
    { recipeId: burgers.id, tag: "skillet" },
    { recipeId: tart.id, tag: "peach" },
    { recipeId: tart.id, tag: "summer" },
    { recipeId: carrots.id, tag: "carrots" },
    { recipeId: carrots.id, tag: "lemon" },
  ]);

  await client.end();

  console.log("seeded");
  console.log("  email:    mom@example.com");
  console.log("  password: piecrust123");
  console.log(`  session:  ${token}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
