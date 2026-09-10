import { z } from "zod";

export const ingredientSchema = z.object({
  quantity: z.number().nullable(),
  quantityMax: z.number().nullable().optional(),
  unit: z.string().nullable(),
  item: z.string(),
  note: z.string().nullable().optional(),
  group: z.string().nullable().optional(),
  uncertain: z.boolean().optional(),
});

export const instructionSchema = z.object({
  text: z.string(),
  group: z.string().nullable().optional(),
  uncertain: z.boolean().optional(),
});

/**
 * A photographed page often holds more than one recipe. The samples that drove
 * this: a magazine spread with a main recipe plus a "recipe follows" component,
 * a cookbook page with two unrelated recipes where one is cut off, and a page
 * with a main tart plus two fruit variations.
 */
export const parsedRecipeSchema = z.object({
  title: z.string(),
  role: z.enum(["main", "component", "variation"]),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  servings: z.number().int().nullable().optional(),
  servingsText: z.string().nullable().optional(),
  prepMinutes: z.number().int().nullable().optional(),
  cookMinutes: z.number().int().nullable().optional(),
  sourceName: z.string().nullable().optional(),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(instructionSchema),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()),
  /** false when the recipe runs off the edge of the photo */
  complete: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
});

export const parsedPageSchema = z.object({
  /** clockwise degrees needed to make the text upright */
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
  sourceName: z.string().nullable().optional(),
  recipes: z.array(parsedRecipeSchema),
  /** anything the cook should know, e.g. "continues on the next page" */
  pageNote: z.string().nullable().optional(),
});

export type ParsedRecipe = z.infer<typeof parsedRecipeSchema>;
export type ParsedPage = z.infer<typeof parsedPageSchema>;

/** JSON Schema mirror of the above, used as the Anthropic tool definition. */
export const parsedPageJsonSchema = {
  type: "object" as const,
  properties: {
    rotation: {
      type: "integer",
      enum: [0, 90, 180, 270],
      description:
        "Clockwise degrees the image must be rotated for the text to read upright. 0 if already upright.",
    },
    sourceName: {
      type: ["string", "null"],
      description:
        "Publication or book this page came from, with issue and page number if visible, e.g. \"Cook's Country, Dec/Jan 2017, p. 11\". Null for a handwritten card.",
    },
    pageNote: {
      type: ["string", "null"],
      description:
        "Anything important about the page itself, such as a recipe continuing beyond the edge.",
    },
    recipes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          role: {
            type: "string",
            enum: ["main", "component", "variation"],
            description:
              "main: a standalone recipe. component: a sub-recipe the main one calls for, such as a sauce or pickle marked 'recipe follows'. variation: a short substitution on the main recipe rather than a full recipe.",
          },
          description: {
            type: ["string", "null"],
            description:
              "One or two sentence summary. Do not copy the long magazine essay.",
          },
          category: {
            type: ["string", "null"],
            description:
              "One of: Breakfast, Mains, Sides, Soups, Salads, Breads, Desserts, Drinks, Sauces, Snacks.",
          },
          servings: { type: ["integer", "null"] },
          servingsText: {
            type: ["string", "null"],
            description: "Yield exactly as written, e.g. \"Makes about 2 cups\".",
          },
          prepMinutes: { type: ["integer", "null"] },
          cookMinutes: { type: ["integer", "null"] },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                quantity: {
                  type: ["number", "null"],
                  description:
                    "Decimal. 1 1/2 becomes 1.5. Null for things like 'salt and pepper'.",
                },
                quantityMax: {
                  type: ["number", "null"],
                  description: "Upper bound for a range like '6-7 tablespoons'.",
                },
                unit: {
                  type: ["string", "null"],
                  description: "Singular and lowercase: cup, tablespoon, ounce, pound, clove.",
                },
                item: { type: "string" },
                note: {
                  type: ["string", "null"],
                  description:
                    "Preparation detail, e.g. 'halved, pitted, and cut into wedges'.",
                },
                group: {
                  type: ["string", "null"],
                  description: "Heading this falls under, e.g. 'For the crust'.",
                },
                uncertain: {
                  type: "boolean",
                  description: "True if the handwriting or print could not be read confidently.",
                },
              },
              required: ["quantity", "unit", "item"],
            },
          },
          instructions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                group: { type: ["string", "null"] },
                uncertain: { type: "boolean" },
              },
              required: ["text"],
            },
          },
          notes: {
            type: ["string", "null"],
            description:
              "Cook's notes, storage advice, or a handwritten annotation in the margin.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "A few lowercase keywords, e.g. ['turkey', 'burgers', 'skillet'].",
          },
          complete: {
            type: "boolean",
            description: "False if the recipe is cut off by the edge of the photo.",
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: [
          "title",
          "role",
          "ingredients",
          "instructions",
          "tags",
          "complete",
          "confidence",
        ],
      },
    },
  },
  required: ["rotation", "recipes"],
};
