CREATE TABLE "pinkbox"."book_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"recipient_name" text NOT NULL,
	"token" text NOT NULL,
	"created_by" uuid,
	"last_viewed_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_shares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "pinkbox"."book_shares" ADD CONSTRAINT "book_shares_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "pinkbox"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinkbox"."book_shares" ADD CONSTRAINT "book_shares_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "pinkbox"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_shares_book_idx" ON "pinkbox"."book_shares" USING btree ("book_id");