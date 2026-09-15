import {
  BreadIcon,
  CupcakeIcon,
  DrinkIcon,
  EggIcon,
  JarIcon,
  PotIcon,
  SaladIcon,
  SidePlateIcon,
  SnackIcon,
  SoupIcon,
  UtensilsIcon,
} from "@/components/icons";

type Bucket =
  | "dessert"
  | "soup"
  | "salad"
  | "bread"
  | "drink"
  | "sauce"
  | "snack"
  | "breakfast"
  | "side"
  | "main"
  | "other";

// Checked in order, against whatever a recipe's category actually says —
// which is anything from the AI's own tidy ten (lib/ai/schema.ts) to
// something a site's own markup called it ("Lunch/Dinner", "low sugar").
// A word said by more than one bucket goes to whichever reads truest for
// most recipes that would use it.
const RULES: { bucket: Bucket; test: RegExp }[] = [
  { bucket: "dessert", test: /dessert|cake|cookie|sweet|treat|candy|pie|brownie/i },
  { bucket: "soup", test: /soup|stew|chili|broth/i },
  { bucket: "salad", test: /salad/i },
  { bucket: "bread", test: /bread|loaf|baking|dough|muffin|scone/i },
  { bucket: "drink", test: /drink|beverage|cocktail|smoothie|juice|tea|coffee/i },
  { bucket: "sauce", test: /sauce|dressing|dip|condiment|jam|preserve|pickle/i },
  { bucket: "snack", test: /snack|appetizer|starter|finger food/i },
  { bucket: "breakfast", test: /breakfast|brunch|pancake|waffle|egg/i },
  { bucket: "side", test: /side/i },
  {
    bucket: "main",
    test: /main|dinner|lunch|entr[ée]e|curry|chicken|beef|pork|turkey|fish|salmon|pasta|rice|casserole|roast|grill|taco|burger/i,
  },
];

function bucketOf(category: string | null): Bucket {
  if (category) {
    for (const { bucket, test } of RULES) {
      if (test.test(category)) return bucket;
    }
  }
  return "other";
}

/** A steady stand-in for a recipe with no photo, guessed from its category. */
export function CategoryIcon({
  category,
  className,
}: {
  category: string | null;
  className?: string;
}) {
  switch (bucketOf(category)) {
    case "dessert":
      return <CupcakeIcon className={className} />;
    case "soup":
      return <SoupIcon className={className} />;
    case "salad":
      return <SaladIcon className={className} />;
    case "bread":
      return <BreadIcon className={className} />;
    case "drink":
      return <DrinkIcon className={className} />;
    case "sauce":
      return <JarIcon className={className} />;
    case "snack":
      return <SnackIcon className={className} />;
    case "breakfast":
      return <EggIcon className={className} />;
    case "side":
      return <SidePlateIcon className={className} />;
    case "main":
      return <PotIcon className={className} />;
    default:
      return <UtensilsIcon className={className} />;
  }
}
