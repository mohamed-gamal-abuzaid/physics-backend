CREATE TYPE "public"."discount_scope" AS ENUM('ALL', 'LEVEL', 'STUDENT');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('PERCENTAGE', 'FIXED');--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scope" "discount_scope" DEFAULT 'ALL' NOT NULL,
	"target_level" text,
	"target_student_id" integer,
	"discount_type" "discount_type" DEFAULT 'PERCENTAGE' NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"min_sessions_count" integer DEFAULT 1,
	"max_usage_count" integer,
	"current_usage_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "level_session_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"level_name" text NOT NULL,
	"stage_code" text,
	"session_format" "session_format" DEFAULT 'PRIVATE' NOT NULL,
	"sessions_count" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD COLUMN "pricing_id" integer;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD COLUMN "original_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD COLUMN "discount_code" text;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD COLUMN "discount_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_target_student_id_users_id_fk" FOREIGN KEY ("target_student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;