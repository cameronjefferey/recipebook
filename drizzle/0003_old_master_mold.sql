ALTER TABLE "pinkbox"."book_recipes" ADD COLUMN "added_by" uuid;--> statement-breakpoint
ALTER TABLE "pinkbox"."book_shares" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "pinkbox"."book_shares" ADD COLUMN "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pinkbox"."book_shares" ADD COLUMN "can_add" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pinkbox"."book_recipes" ADD CONSTRAINT "book_recipes_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "pinkbox"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."book_shares" ADD CONSTRAINT "book_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "pinkbox"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_shares_user_idx" ON "pinkbox"."book_shares" USING btree ("user_id");--> statement-breakpoint
-- The household code now answers "may you join THIS box", where before it was
-- only ever a copy of the public sign-up code. Left as it was, anybody allowed
-- to make an account at all could have walked straight into the first one.
UPDATE "pinkbox"."households"
SET "invite_code" = replace(gen_random_uuid()::text, '-', '');--> statement-breakpoint
-- Everything already filed was filed by the household that owns the book.
UPDATE "pinkbox"."book_recipes" br
SET "added_by" = (
  SELECT u."id" FROM "pinkbox"."users" u
  JOIN "pinkbox"."books" b ON b."household_id" = u."household_id"
  WHERE b."id" = br."book_id"
  ORDER BY u."created_at"
  LIMIT 1
)
WHERE br."added_by" IS NULL;
