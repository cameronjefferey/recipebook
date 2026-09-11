import type { Ingredient, Instruction } from "@/lib/db/schema";

const VULGAR: Array<[number, string]> = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

const ASCII_FRACTION = /^(\d+)\/(\d+)$/;

/** 1.5 -> "1½". Cooks read fractions, not decimals. */
export function formatQuantity(n: number): string {
  const whole = Math.floor(n);
  const frac = n - whole;

  if (frac < 0.01) return String(whole);

  let best: string | null = null;
  let bestDiff = 0.02;
  for (const [value, glyph] of VULGAR) {
    const diff = Math.abs(frac - value);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = glyph;
    }
  }

  if (best) return whole ? `${whole}${best}` : best;

  // Nothing close to a familiar fraction, so show a short decimal.
  return String(Math.round(n * 100) / 100);
}

/** Abbreviations never take an "s": 200 g, not 200 gs. */
const ABBREVIATIONS = new Set([
  "g", "kg", "mg", "ml", "l", "oz", "lb", "tsp", "tbsp", "qt", "pt", "fl oz",
]);

/** Metric mass and volume read better closed up: 200g, 350ml. */
const ATTACHED = new Set(["g", "kg", "mg", "ml", "l"]);

function pluralizeUnit(unit: string, qty: number | null) {
  if (!unit || ABBREVIATIONS.has(unit)) return unit;
  if (qty === null || qty <= 1) return unit;
  if (/(s|sh|ch|x)$/i.test(unit)) return unit + "es";
  return unit + "s";
}

/** Rebuild the human line so it can be edited as ordinary text. */
export function formatIngredient(ing: Ingredient): string {
  const parts: string[] = [];

  if (ing.quantity !== null && ing.quantity !== undefined) {
    const q = formatQuantity(ing.quantity);
    const amount =
      ing.quantityMax != null ? `${q}-${formatQuantity(ing.quantityMax)}` : q;
    parts.push(
      ing.unit && ATTACHED.has(ing.unit) ? `${amount}${ing.unit}` : amount,
    );
  }
  if (ing.unit && !(ing.quantity != null && ATTACHED.has(ing.unit))) {
    parts.push(pluralizeUnit(ing.unit, ing.quantity ?? null));
  }
  if (ing.item) parts.push(ing.item);

  const line = parts.join(" ").trim();
  return ing.note ? `${line}, ${ing.note}` : line;
}

const UNITS = new Set([
  "cup", "cups", "tablespoon", "tablespoons", "tbsp", "teaspoon", "teaspoons",
  "tsp", "ounce", "ounces", "oz", "pound", "pounds", "lb", "lbs", "gram",
  "grams", "g", "kilogram", "kg", "milliliter", "ml", "liter", "l", "pinch",
  "pinches", "dash", "clove", "cloves", "sprig", "sprigs", "stick", "sticks",
  "can", "cans", "package", "packages", "slice", "slices", "quart", "quarts",
  "pint", "pints", "gallon", "head", "heads", "bunch", "bunches", "stalk",
  "stalks", "piece", "pieces",
]);

function parseNumber(token: string): number | null {
  for (const [value, glyph] of VULGAR) {
    if (token === glyph) return value;
    if (token.endsWith(glyph)) {
      const whole = Number(token.slice(0, -glyph.length));
      if (!Number.isNaN(whole)) return whole + value;
    }
  }
  const frac = token.match(ASCII_FRACTION);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const num = Number(token);
  return Number.isNaN(num) ? null : num;
}

/**
 * Turn an edited line back into structured data so scaling keeps working.
 * Deliberately forgiving: anything it cannot classify stays in `item`, which
 * is always shown to the cook verbatim.
 */
export function parseIngredient(line: string, group?: string | null): Ingredient {
  // Metric recipes write "200g caster sugar" with no space, which would
  // otherwise be read as an unquantified item and refuse to scale.
  const trimmed = line.trim().replace(/^(\d+(?:[.,]\d+)?)([a-zA-Z]+)\b/, "$1 $2");
  if (!trimmed) return { quantity: null, unit: null, item: "", group };

  // A trailing clause after a comma is preparation, not part of the item.
  const commaAt = trimmed.indexOf(",");
  const head = commaAt === -1 ? trimmed : trimmed.slice(0, commaAt);
  const note = commaAt === -1 ? null : trimmed.slice(commaAt + 1).trim() || null;

  const tokens = head.split(/\s+/);
  let quantity: number | null = null;
  let quantityMax: number | null = null;
  let i = 0;

  const range = tokens[0]?.match(/^([\d./¼-¾⅐-⅞]+)[-–]([\d./¼-¾⅐-⅞]+)$/);
  if (range) {
    quantity = parseNumber(range[1]);
    quantityMax = parseNumber(range[2]);
    i = 1;
  } else {
    const first = parseNumber(tokens[0] ?? "");
    if (first !== null) {
      quantity = first;
      i = 1;
      // "1 1/2 cups" arrives as two separate numeric tokens.
      const second = parseNumber(tokens[1] ?? "");
      if (second !== null && second < 1 && Number.isInteger(first)) {
        quantity = first + second;
        i = 2;
      }
    }
  }

  let unit: string | null = null;
  const maybeUnit = tokens[i]?.toLowerCase().replace(/\.$/, "");
  if (maybeUnit && UNITS.has(maybeUnit)) {
    unit = maybeUnit.replace(/s$/, "");
    i += 1;
  }

  return {
    quantity,
    quantityMax,
    unit,
    item: tokens.slice(i).join(" "),
    note,
    group,
  };
}

/** Scaling only touches numbers; wording is left exactly as the cook wrote it. */
export function scaleIngredient(ing: Ingredient, factor: number): Ingredient {
  if (factor === 1 || ing.quantity === null || ing.quantity === undefined) {
    return ing;
  }
  return {
    ...ing,
    quantity: ing.quantity * factor,
    quantityMax:
      ing.quantityMax != null ? ing.quantityMax * factor : ing.quantityMax,
  };
}

/** Preserve heading order while grouping, e.g. "For the crust" before "For the filling". */
export function groupIngredients(list: Ingredient[]) {
  const groups = new Map<string, Ingredient[]>();
  for (const ing of list) {
    const key = ing.group?.trim() || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }
  return Array.from(groups, ([name, items]) => ({ name, items }));
}

export function groupInstructions(list: Instruction[]) {
  const groups = new Map<string, Instruction[]>();
  for (const step of list) {
    const key = step.group?.trim() || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(step);
  }
  return Array.from(groups, ([name, items]) => ({ name, items }));
}
