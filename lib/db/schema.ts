import {
  pgSchema,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";

export const pinkbox = pgSchema("pinkbox");

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

/** A quantity kept as a fraction so "1 1/2" survives a round trip and scales exactly. */
export type Ingredient = {
  /** null for things like "salt and pepper" */
  quantity: number | null;
  /** second number of a range, e.g. "6-7 tablespoons" */
  quantityMax?: number | null;
  unit: string | null;
  item: string;
  note?: string | null;
  /** e.g. "For the crust" */
  group?: string | null;
  /** transcription was unsure; surfaced for confirmation in review */
  uncertain?: boolean;
};

export type Instruction = {
  text: string;
  group?: string | null;
  uncertain?: boolean;
};

export const recipeStatus = pinkbox.enum("recipe_status", [
  "none",
  "keeper",
  "want_to_try",
  "nope",
]);

export const sourceKind = pinkbox.enum("source_kind", [
  "card_photo",
  "page_photo",
  "web",
  "manual",
]);

export const imageKind = pinkbox.enum("image_kind", ["original", "photo"]);

export const captureStatus = pinkbox.enum("capture_status", [
  "pending",
  "transcribing",
  "ready",
  "failed",
  /** turned into one or more recipes */
  "filed",
  /** reviewed and thrown away */
  "discarded",
]);

export const households = pinkbox.table("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pinkbox.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pinkbox.table(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const recipes = pinkbox.table(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),

    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),

    servings: integer("servings"),
    /** preserves phrasing like "Makes about 2 cups" */
    servingsText: text("servings_text"),
    prepMinutes: integer("prep_minutes"),
    cookMinutes: integer("cook_minutes"),

    ingredients: jsonb("ingredients").$type<Ingredient[]>().notNull().default([]),
    instructions: jsonb("instructions")
      .$type<Instruction[]>()
      .notNull()
      .default([]),
    notes: text("notes"),

    status: recipeStatus("status").notNull().default("none"),
    sourceKind: sourceKind("source_kind").notNull().default("manual"),
    sourceUrl: text("source_url"),
    /** "Cook's Country, Dec/Jan 2017, p.11" or "Grandma Ruth's card" */
    sourceName: text("source_name"),

    /** transcribed but not yet confirmed by a human */
    needsReview: boolean("needs_review").notNull().default(false),

    timesCooked: integer("times_cooked").notNull().default(0),
    lastCookedAt: timestamp("last_cooked_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("recipes_household_idx").on(t.householdId),
    index("recipes_household_created_idx").on(t.householdId, t.createdAt),
  ],
);

/**
 * The photo is the source of truth, so originals are kept forever and are
 * never overwritten by edits to the transcription. Index cards and cookbook
 * pages both routinely spill onto a second image, hence many rows per recipe.
 */
export const recipeImages = pinkbox.table(
  "recipe_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    kind: imageKind("kind").notNull().default("original"),
    mime: text("mime").notNull(),
    bytes: bytea("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    /** Clockwise degrees to display upright. Book pages are often shot sideways. */
    rotation: integer("rotation").notNull().default(0),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("recipe_images_recipe_idx").on(t.recipeId, t.sort)],
);

export const recipeTags = pinkbox.table(
  "recipe_tags",
  {
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.tag] }), index("recipe_tags_tag_idx").on(t.tag)],
);

/**
 * A recipe book on the shelf: "Breakfast", "Sides", "What the kids will eat".
 * Membership is many-to-many on purpose, because a recipe is routinely both a
 * weeknight dinner and one the children will actually accept.
 */
export const books = pinkbox.table(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** lower sorts nearer the left of the shelf; ties break on name */
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("books_household_name_idx").on(t.householdId, t.name)],
);

export const bookRecipes = pinkbox.table(
  "book_recipes",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.bookId, t.recipeId] }),
    index("book_recipes_recipe_idx").on(t.recipeId),
  ],
);

export const cookLog = pinkbox.table(
  "cook_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    cookedAt: timestamp("cooked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cook_log_recipe_idx").on(t.recipeId)],
);

/**
 * A photographed page waiting to be transcribed. Decoupled from `recipes` so a
 * whole stack can be shot in one sitting and reviewed later, and so one page
 * yielding several recipes is a normal case rather than a special one.
 */
export const captures = pinkbox.table(
  "captures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    mime: text("mime").notNull(),
    bytes: bytea("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    rotation: integer("rotation").notNull().default(0),
    status: captureStatus("status").notNull().default("pending"),
    /** ParsedPage from lib/ai/schema.ts once transcription succeeds */
    result: jsonb("result"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("captures_household_idx").on(t.householdId, t.createdAt)],
);
