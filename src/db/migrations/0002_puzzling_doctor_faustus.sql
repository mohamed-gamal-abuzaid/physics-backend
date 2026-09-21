CREATE TYPE "public"."campaign_status" AS ENUM('DRAFT', 'SENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."homework_status" AS ENUM('PENDING', 'SUBMITTED', 'GRADED', 'LATE');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_proof_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."session_format" AS ENUM('PRIVATE', 'GROUP');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"curricula_options" jsonb,
	"exam_session_options" jsonb,
	"intro_video_url" text,
	"session_pricing" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"course" text,
	"module" text,
	"description" text,
	"due_date" timestamp,
	"total_points" integer DEFAULT 100,
	"student_id" integer,
	"assigned_student_ids" jsonb,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer NOT NULL,
	"actor_role" varchar(50),
	"action" text NOT NULL,
	"details" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"assigned_homework_id" integer,
	"course_name" text,
	"topic" text,
	"session_format" "session_format" DEFAULT 'PRIVATE',
	"date" timestamp NOT NULL,
	"time" text,
	"duration_minutes" integer DEFAULT 60,
	"location" text,
	"status" "session_status" DEFAULT 'SCHEDULED' NOT NULL,
	"is_archived" boolean DEFAULT false,
	"credit_deducted" boolean DEFAULT false,
	"credit_type_deducted" text,
	"meeting_link" text,
	"notes" text,
	"session_notes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"target_audience" text,
	"sent_at" timestamp,
	"recipient_count" integer DEFAULT 0,
	"open_rate" numeric(5, 2) DEFAULT '0.00',
	"click_rate" numeric(5, 2) DEFAULT '0.00',
	"status" "campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"preview_snippet" text
);
--> statement-breakpoint
CREATE TABLE "hall_of_fame" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_name" text NOT NULL,
	"avatar" text,
	"cohort" text,
	"superlative_badge" text,
	"quote" text,
	"admitted_university" text,
	"grade_or_score" text,
	"curriculum" text,
	"major_field" text,
	"mentor_letter" text,
	"mentor_name" text,
	"graduation_date" timestamp,
	"honors" text,
	"certificate_id" text
);
--> statement-breakpoint
CREATE TABLE "homework_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"file_name" text,
	"file_size" text,
	"file_url" text,
	"status" "homework_status" DEFAULT 'SUBMITTED' NOT NULL,
	"score" numeric(5, 2),
	"letter_grade" varchar(5),
	"feedback_notes" text,
	"graded_by" integer,
	"graded_at" timestamp,
	"rubric_scores" jsonb
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"type" varchar(50),
	"link_tab" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer,
	"recipient_email" varchar(255) NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"sent_at" timestamp,
	"status" varchar(50) DEFAULT 'PENDING',
	"provider" varchar(50),
	"error" text
);
--> statement-breakpoint
CREATE TABLE "payment_proofs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"package_name" text,
	"sessions_count" integer,
	"credit_type" text,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text,
	"sender_account_or_phone" text,
	"transaction_ref" text,
	"screenshot_url" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"status" "payment_proof_status" DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text,
	"course" text,
	"topic" text,
	"file_format" varchar(20),
	"file_size" text,
	"download_count" integer DEFAULT 0,
	"author" text,
	"upload_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"preview_url" text,
	"file_url" text,
	"badge" text
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer,
	"name" text NOT NULL,
	"cohort" text,
	"content" text NOT NULL,
	"rating" integer DEFAULT 5,
	"status" "review_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"parent_name" text,
	"parent_email" varchar(255),
	"parent_phone" varchar(20),
	"grade_level" text,
	"cohort" text,
	"total_credits" integer DEFAULT 0,
	"remaining_credits" integer DEFAULT 0,
	"remaining_private_credits" integer DEFAULT 0,
	"remaining_group_credits" integer DEFAULT 0,
	"attendance_rate" numeric(5, 2) DEFAULT '0.00',
	"average_score" numeric(5, 2) DEFAULT '0.00',
	"enrolled_course" text,
	"school_name" text,
	"academic_year" text,
	"exam_board" text,
	"exam_session" text,
	"hardest_topic" text,
	"notes" text,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::text;--> statement-breakpoint
UPDATE "users" SET "role" = 'STUDENT' WHERE "role" = 'USER';--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'STUDENT');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "specialty" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" varchar(50) DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_assigned_homework_id_assignments_id_fk" FOREIGN KEY ("assigned_homework_id") REFERENCES "public"."assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_emails" ADD CONSTRAINT "outbox_emails_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;