CREATE SCHEMA "pinkbox";
--> statement-breakpoint
CREATE TYPE "pinkbox"."capture_status" AS ENUM('pending', 'transcribing', 'ready', 'failed', 'filed', 'discarded');--> statement-breakpoint
CREATE TYPE "pinkbox"."image_kind" AS ENUM('original', 'photo');--> statement-breakpoint
CREATE TYPE "pinkbox"."recipe_status" AS ENUM('none', 'keeper', 'want_to_try', 'nope');--> statement-breakpoint
CREATE TYPE "pinkbox"."source_kind" AS ENUM('card_photo', 'page_photo', 'web', 'manual');--> statement-breakpoint
CREATE TABLE "pinkbox"."captures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid,
	"mime" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	"width" integer,
	"height" integer,
	"rotation" integer DEFAULT 0 NOT NULL,
	"status" "pinkbox"."capture_status" DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."cook_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" uuid,
	"cooked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "households_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."recipe_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"kind" "pinkbox"."image_kind" DEFAULT 'original' NOT NULL,
	"mime" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	"width" integer,
	"height" integer,
	"rotation" integer DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."recipe_tags" (
	"recipe_id" uuid NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "recipe_tags_recipe_id_tag_pk" PRIMARY KEY("recipe_id","tag")
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"created_by" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"servings" integer,
	"servings_text" text,
	"prep_minutes" integer,
	"cook_minutes" integer,
	"ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"instructions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"status" "pinkbox"."recipe_status" DEFAULT 'none' NOT NULL,
	"source_kind" "pinkbox"."source_kind" DEFAULT 'manual' NOT NULL,
	"source_url" text,
	"source_name" text,
	"needs_review" boolean DEFAULT false NOT NULL,
	"times_cooked" integer DEFAULT 0 NOT NULL,
	"last_cooked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinkbox"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "pinkbox"."captures" ADD CONSTRAINT "captures_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "pinkbox"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."captures" ADD CONSTRAINT "captures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "pinkbox"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."cook_log" ADD CONSTRAINT "cook_log_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "pinkbox"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."cook_log" ADD CONSTRAINT "cook_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "pinkbox"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."recipe_images" ADD CONSTRAINT "recipe_images_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "pinkbox"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."recipe_images" ADD CONSTRAINT "recipe_images_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "pinkbox"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."recipe_tags" ADD CONSTRAINT "recipe_tags_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "pinkbox"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."recipes" ADD CONSTRAINT "recipes_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "pinkbox"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."recipes" ADD CONSTRAINT "recipes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "pinkbox"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "pinkbox"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."users" ADD CONSTRAINT "users_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "pinkbox"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "captures_household_idx" ON "pinkbox"."captures" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "cook_log_recipe_idx" ON "pinkbox"."cook_log" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_images_recipe_idx" ON "pinkbox"."recipe_images" USING btree ("recipe_id","sort");--> statement-breakpoint
CREATE INDEX "recipe_tags_tag_idx" ON "pinkbox"."recipe_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "recipes_household_idx" ON "pinkbox"."recipes" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "recipes_household_created_idx" ON "pinkbox"."recipes" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "pinkbox"."sessions" USING btree ("user_id");