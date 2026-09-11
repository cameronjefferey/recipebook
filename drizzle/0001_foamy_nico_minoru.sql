CREATE TABLE "pinkbox"."book_recipes" (
	"book_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_recipes_book_id_recipe_id_pk" PRIMARY KEY("book_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pinkbox"."book_recipes" ADD CONSTRAINT "book_recipes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "pinkbox"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."book_recipes" ADD CONSTRAINT "book_recipes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "pinkbox"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."books" ADD CONSTRAINT "books_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "pinkbox"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_recipes_recipe_idx" ON "pinkbox"."book_recipes" USING btree ("recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "books_household_name_idx" ON "pinkbox"."books" USING btree ("household_id","name");--> statement-breakpoint
-- Categories were the only grouping recipes had. Turn each distinct one into a
-- real book and file its recipes, so the shelf is populated on first sight
-- rather than asking for the whole collection to be sorted by hand.
INSERT INTO "pinkbox"."books" ("household_id", "name")
SELECT DISTINCT r."household_id", btrim(r."category")
FROM "pinkbox"."recipes" r
WHERE r."category" IS NOT NULL AND btrim(r."category") <> ''
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "pinkbox"."book_recipes" ("book_id", "recipe_id")
SELECT b."id", r."id"
FROM "pinkbox"."recipes" r
JOIN "pinkbox"."books" b
  ON b."household_id" = r."household_id"
 AND b."name" = btrim(r."category")
WHERE r."category" IS NOT NULL AND btrim(r."category") <> ''
ON CONFLICT DO NOTHING;