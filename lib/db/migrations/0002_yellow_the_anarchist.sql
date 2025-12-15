CREATE TABLE "obligation_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"obligation_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"days_before_deadline" integer NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"success" varchar(10) DEFAULT 'true' NOT NULL,
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "obligation_notifications" ADD CONSTRAINT "obligation_notifications_obligation_id_critical_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."critical_obligations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation_notifications" ADD CONSTRAINT "obligation_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;