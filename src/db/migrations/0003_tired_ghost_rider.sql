ALTER TYPE "public"."homework_status" ADD VALUE 'RESUBMIT_REQUESTED';--> statement-breakpoint
ALTER TYPE "public"."session_status" ADD VALUE 'PENDING' BEFORE 'COMPLETED';--> statement-breakpoint
ALTER TYPE "public"."session_status" ADD VALUE 'APPROVED' BEFORE 'COMPLETED';--> statement-breakpoint
ALTER TYPE "public"."session_status" ADD VALUE 'NO_SHOW';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'PARENT';--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"student_id" integer NOT NULL,
	"parent_name" text,
	"package_name" text,
	"amount" numeric(10, 2) NOT NULL,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"status" "invoice_status" DEFAULT 'UNPAID' NOT NULL,
	"payment_method" text,
	"paid_at" timestamp,
	"reference_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_number" varchar(50) NOT NULL,
	"student_id" integer NOT NULL,
	"requester_role" varchar(20) DEFAULT 'student' NOT NULL,
	"subject" text NOT NULL,
	"category" text NOT NULL,
	"priority" "ticket_priority" DEFAULT 'MEDIUM' NOT NULL,
	"status" "ticket_status" DEFAULT 'OPEN' NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "meeting_link" text;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "is_account_granted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "generated_password" text;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "password_generated_at" timestamp;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "assigned_teacher_id" integer;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "registered_via" varchar(100);--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "joined_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_assigned_teacher_id_users_id_fk" FOREIGN KEY ("assigned_teacher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;