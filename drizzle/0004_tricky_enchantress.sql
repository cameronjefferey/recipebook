ALTER TABLE "pinkbox"."recipes" ADD COLUMN "source_key" text;--> statement-breakpoint
CREATE INDEX "recipes_source_key_idx" ON "pinkbox"."recipes" USING btree ("household_id","source_key");--> statement-breakpoint
-- Recipes already imported get a key too, so a newly imported recipe that
-- leans on one of them finds it instead of fetching a second copy. Mirrors
-- sourceKeyOf: no protocol, no "www.", no query, no trailing slash.
UPDATE "pinkbox"."recipes"
SET "source_key" = regexp_replace(
  regexp_replace(
    regexp_replace(lower("source_url"), '^https?://(www\.)?', ''),
    '[?#].*$', ''
  ),
  '/+$', ''
)
WHERE "source_url" IS NOT NULL;