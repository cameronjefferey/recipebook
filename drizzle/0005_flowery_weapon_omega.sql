CREATE TABLE "pinkbox"."grocery_checked" (
	"household_id" uuid NOT NULL,
	"key" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grocery_checked_household_id_key_pk" PRIMARY KEY("household_id","key")
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."grocery_extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"text" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"added_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."meal_plan_items" (
	"household_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"added_by" uuid,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_plan_items_household_id_recipe_id_pk" PRIMARY KEY("household_id","recipe_id")
);
--> statement-breakpoint
ALTER TABLE "pinkbox"."grocery_checked" ADD CONSTRAINT "grocery_checked_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "pinkbox"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."grocery_extras" ADD CONSTRAINT "grocery_extras_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "pinkbox"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."grocery_extras" ADD CONSTRAINT "grocery_extras_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "pinkbox"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."meal_plan_items" ADD CONSTRAINT "meal_plan_items_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "pinkbox"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."meal_plan_items" ADD CONSTRAINT "meal_plan_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "pinkbox"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."meal_plan_items" ADD CONSTRAINT "meal_plan_items_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "pinkbox"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grocery_extras_household_idx" ON "pinkbox"."grocery_extras" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "meal_plan_items_recipe_idx" ON "pinkbox"."meal_plan_items" USING btree ("recipe_id");