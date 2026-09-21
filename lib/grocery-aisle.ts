import { parseIngredient } from "@/lib/ingredients";

/**
 * Aisles in the order you actually walk a grocery store, produce first and
 * the paper goods last. Unknowns go in Pantry rather than inventing a
 * leftover pile — most of what a recipe asks for lives there anyway.
 */
export const GROCERY_AISLES = [
  "Produce",
  "Meat & seafood",
  "Dairy",
  "Bread",
  "Frozen",
  "Cans & jars",
  "Baking",
  "Spices",
  "Pantry",
  "Household",
] as const;

export type GroceryAisle = (typeof GROCERY_AISLES)[number];

/** First matching aisle wins, so more specific lists sit above broader ones. */
const RULES: { aisle: GroceryAisle; words: string[] }[] = [
  {
    aisle: "Household",
    words: [
      "aluminum foil",
      "foil",
      "parchment",
      "paper towel",
      "plastic wrap",
      "saran wrap",
      "wax paper",
      "ziploc",
      "zip top",
      "toothpick",
      "skewer",
      "coffee filter",
    ],
  },
  {
    aisle: "Frozen",
    words: [
      "frozen",
      "ice cream",
      "popsicle",
      "pie crust",
      "puff pastry",
      "phyllo",
      "filo",
    ],
  },
  {
    // Broth before meat, so "chicken broth" is not a package of chicken.
    aisle: "Cans & jars",
    words: [
      "broth",
      "stock",
      "tomato paste",
      "tomato sauce",
      "crushed tomato",
      "diced tomato",
      "canned",
      "coconut milk",
      "evaporated milk",
      "condensed milk",
      "pumpkin puree",
    ],
  },
  {
    aisle: "Dairy",
    words: [
      "milk",
      "butter",
      "buttermilk",
      "cream",
      "half and half",
      "sour cream",
      "yogurt",
      "yoghurt",
      "egg",
      "cheese",
      "cheddar",
      "mozzarella",
      "parmesan",
      "parmigiano",
      "pecorino",
      "ricotta",
      "cotija",
      "feta",
      "gouda",
      "gruyere",
      "provolone",
      "swiss",
      "monterey jack",
      "cream cheese",
      "mascarpone",
      "ghee",
    ],
  },
  {
    aisle: "Baking",
    words: [
      "flour",
      "sugar",
      "brown sugar",
      "powdered sugar",
      "confectioner",
      "baking powder",
      "baking soda",
      "yeast",
      "cocoa",
      "chocolate chip",
      "chocolate chips",
      "cornstarch",
      "corn starch",
      "vanilla extract",
      "vanilla bean",
      "molasses",
      "shortening",
      "sprinkles",
    ],
  },
  {
    aisle: "Bread",
    words: [
      "bread",
      "bun",
      "roll",
      "baguette",
      "bagel",
      "pita",
      "naan",
      "tortilla",
      "wrap",
      "panko",
      "breadcrumb",
      "bread crumb",
      "english muffin",
      "ciabatta",
      "croissant",
    ],
  },
  {
    aisle: "Meat & seafood",
    words: [
      "chicken",
      "turkey",
      "beef",
      "pork",
      "lamb",
      "veal",
      "steak",
      "ground turkey",
      "ground beef",
      "ground pork",
      "sausage",
      "bacon",
      "ham",
      "prosciutto",
      "pancetta",
      "salami",
      "pepperoni",
      "hot dog",
      "salmon",
      "tuna",
      "shrimp",
      "prawn",
      "cod",
      "tilapia",
      "halibut",
      "trout",
      "fish",
      "crab",
      "scallop",
      "lobster",
      "clam",
      "mussel",
      "anchovy",
      "sardine",
    ],
  },
  {
    aisle: "Spices",
    words: [
      "salt and pepper",
      "salt",
      "black pepper",
      "white pepper",
      "peppercorn",
      "pepper flake",
      "red pepper flake",
      "garlic powder",
      "onion powder",
      "chili powder",
      "chilli powder",
      "cayenne",
      "paprika",
      "cumin",
      "cinnamon",
      "nutmeg",
      "ground clove",
      "ginger powder",
      "turmeric",
      "oregano",
      "thyme",
      "rosemary",
      "sage",
      "bay leaf",
      "bay leaves",
      "seasoning",
      "spice",
    ],
  },
  {
    aisle: "Produce",
    words: [
      "garlic",
      "onion",
      "shallot",
      "leek",
      "scallion",
      "green onion",
      "spring onion",
      "bell pepper",
      "jalapeno",
      "jalapeño",
      "chile",
      "chili",
      "chilli",
      "tomato",
      "tomatillo",
      "avocado",
      "lettuce",
      "spinach",
      "kale",
      "arugula",
      "cabbage",
      "carrot",
      "celery",
      "cucumber",
      "zucchini",
      "courgette",
      "squash",
      "pumpkin",
      "potato",
      "yam",
      "sweet potato",
      "broccoli",
      "cauliflower",
      "asparagus",
      "green bean",
      "snap pea",
      "pea",
      "corn",
      "mushroom",
      "ginger",
      "lemon",
      "lime",
      "orange",
      "apple",
      "banana",
      "berry",
      "strawberry",
      "blueberry",
      "blackberry",
      "raspberry",
      "peach",
      "pear",
      "plum",
      "mango",
      "pineapple",
      "grape",
      "watermelon",
      "melon",
      "cilantro",
      "coriander",
      "parsley",
      "basil",
      "mint",
      "dill",
      "chive",
      "herb",
      "salad",
      "greens",
      "radish",
      "beet",
      "turnip",
      "parsnip",
      "eggplant",
      "aubergine",
      "okra",
      "fennel",
      "artichoke",
    ],
  },
  {
    aisle: "Cans & jars",
    words: [
      "black bean",
      "pinto bean",
      "kidney bean",
      "garbanzo",
      "chickpea",
      "bean",
      "lentil",
      "green olive",
      "black olive",
      "kalamata",
      "capers",
      "pickle",
      "salsa",
      "pasta sauce",
      "marinara",
      "applesauce",
    ],
  },
  {
    aisle: "Pantry",
    words: [
      "oil",
      "vinegar",
      "soy sauce",
      "fish sauce",
      "worcestershire",
      "hot sauce",
      "ketchup",
      "mustard",
      "mayonnaise",
      "mayo",
      "honey",
      "maple",
      "jam",
      "jelly",
      "peanut butter",
      "almond butter",
      "tahini",
      "pasta",
      "spaghetti",
      "noodle",
      "rice",
      "quinoa",
      "couscous",
      "oat",
      "cereal",
      "nut",
      "almond",
      "walnut",
      "pecan",
      "cashew",
      "pistachio",
      "peanut",
      "sesame",
      "seed",
      "raisin",
      "date",
      "coconut",
      "wine",
      "beer",
      "broth",
    ],
  },
];

const CAN_UNITS = new Set(["can", "cans", "jar", "jars"]);

function escapeRe(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mentions(haystack: string, words: string[]) {
  return words.some((word) => {
    const body = escapeRe(normalize(word));
    // Optional trailing s/es so "carrot" catches "carrots" and "tomato"
    // catches "tomatoes", without "pea" stealing "peach".
    return new RegExp(`(?:^| )${body}(?:es|s)?(?:$| )`).test(` ${haystack} `);
  });
}

/**
 * Which aisle a thing belongs in. `item` is the food itself ("garlic"),
 * not the printed line; the unit is a hint when the card said "1 can".
 */
export function groceryAisle(
  item: string,
  unit?: string | null,
): GroceryAisle {
  const text = normalize(item);
  if (!text) return "Pantry";

  const u = (unit ?? "").toLowerCase().replace(/s$/, "");
  if (CAN_UNITS.has(u) || CAN_UNITS.has(unit ?? "")) return "Cans & jars";

  for (const { aisle, words } of RULES) {
    if (mentions(text, words)) return aisle;
  }

  // A lonely "pepper" is the shaker, not a bell pepper — those already
  // matched Produce as "bell pepper" above.
  if (/(?:^| )pepper(?:s)?(?:$| )/.test(` ${text} `)) return "Spices";

  return "Pantry";
}

/** Hand-added lines have no structured item, so read the words they typed. */
export function groceryAisleFromText(text: string): GroceryAisle {
  const parsed = parseIngredient(text);
  return groceryAisle(parsed.item || text, parsed.unit);
}

export function groupByAisle<T extends { aisle: GroceryAisle }>(
  items: T[],
): { aisle: GroceryAisle; items: T[] }[] {
  const buckets = new Map<GroceryAisle, T[]>(
    GROCERY_AISLES.map((aisle) => [aisle, []]),
  );
  for (const item of items) {
    buckets.get(item.aisle)!.push(item);
  }
  return GROCERY_AISLES.flatMap((aisle) => {
    const grouped = buckets.get(aisle)!;
    return grouped.length ? [{ aisle, items: grouped }] : [];
  });
}
