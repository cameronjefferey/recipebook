CREATE TABLE "pinkbox"."book_favorites" (
	"household_id" uuid NOT NULL,
	"book_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_favorites_household_id_book_id_pk" PRIMARY KEY("household_id","book_id")
);
--> statement-breakpoint
ALTER TABLE "pinkbox"."book_favorites" ADD CONSTRAINT "book_favorites_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "pinkbox"."households"("id") ON DELETE cascade ON UPDATE no action;