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
  /**
   * This ingredient is a recipe in its own right, like "1½ cups Mexican
   * street corn salad": the address of that recipe. Kept as the address
   * rather than an id so the two find each other whichever order they are
   * brought in, and whether or not the other one is here yet.
   */
  component?: string | null;
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
  // A household-wide preference, not a security boundary: turning it off
  // just hides the tab, the toggle, and "Select" — the plan and list
  // already on it are left alone, and come right back if switched on again.
  mealPlanEnabled: boolean("meal_plan_enabled").notNull().default(true),
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
    /**
     * `sourceUrl` with the protocol, "www.", query and trailing slash taken
     * off, so one recipe linking to another matches however the address was
     * written. See `sourceKeyOf`.
     */
    sourceKey: text("source_key"),
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
    index("recipes_source_key_idx").on(t.householdId, t.sourceKey),
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
    /**
     * Who filed it. A shared book can hold recipes from several houses, and
     * this is how a guest's contributions are told apart from the owner's —
     * both to credit them and to take them out again if access is withdrawn.
     */
    addedBy: uuid("added_by").references(() => users.id, {
      onDelete: "set null",
    }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.bookId, t.recipeId] }),
    index("book_recipes_recipe_idx").on(t.recipeId),
  ],
);

/**
 * A book handed to one person by name, each with a link of their own, so that
 * "Aunt Carol can no longer see this" is possible without disturbing anybody
 * else. Recipients never need an account: the token in the link is the whole
 * credential, and it only ever buys a read of this one book.
 */
export const bookShares = pinkbox.table(
  "book_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    /** who it went to, in the owner's own words: "Aunt Carol" */
    recipientName: text("recipient_name").notNull(),
    /** the secret in the URL, kept readable so the link can be sent again */
    token: text("token").notNull().unique(),
    /**
     * Bound when the recipient opens the link while signed in. Until then the
     * link is the only way in, which is what lets somebody who will never make
     * an account still be handed a book.
     */
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    /** may they put their own recipes in, as in a shared photo album */
    canAdd: boolean("can_add").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("book_shares_book_idx").on(t.bookId),
    index("book_shares_user_idx").on(t.userId),
  ],
);

/**
 * A recipe marked "cooking this week." One running list per household,
 * cleared by hand when a week is done rather than on a clock, because
 * nobody's kitchen keeps to the calendar. A recipe here does not have to be
 * this household's own — planning what to cook is a personal note on top of
 * any recipe you can see, not a change to the recipe itself.
 */
export const mealPlanItems = pinkbox.table(
  "meal_plan_items",
  {
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.householdId, t.recipeId] }),
    index("meal_plan_items_recipe_idx").on(t.recipeId),
  ],
);

/** Something to buy that nobody wrote a recipe for: paper towels, more coffee. */
export const groceryExtras = pinkbox.table(
  "grocery_extras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    checked: boolean("checked").notNull().default(false),
    addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("grocery_extras_household_idx").on(t.householdId, t.createdAt)],
);

/**
 * Which combined grocery lines have been crossed off while shopping. Keyed by
 * the same key the list is built with rather than a row id of its own,
 * because the list is recomputed fresh from whatever is planned this week —
 * there is nothing else for a checkmark to attach to.
 */
export const groceryChecked = pinkbox.table(
  "grocery_checked",
  {
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    checkedAt: timestamp("checked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.householdId, t.key] })],
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
