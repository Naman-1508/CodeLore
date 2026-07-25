CREATE TYPE "public"."ai_provider_status" AS ENUM('active', 'quota_exceeded', 'disabled', 'error');--> statement-breakpoint
CREATE TYPE "public"."indexing_status" AS ENUM('pending', 'cloning', 'parsing', 'analyzing', 'ready', 'error');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TABLE "ai_provider_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"encrypted_credentials" text,
	"monthly_token_cap" integer,
	"status" "ai_provider_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_edge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"caller_function_id" uuid NOT NULL,
	"callee_function_id" uuid NOT NULL,
	"call_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_class_id" uuid
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"path" text NOT NULL,
	"language" text NOT NULL,
	"loc" integer DEFAULT 0,
	"complexity_score" numeric DEFAULT '0',
	"test_coverage_pct" numeric,
	"is_test_file" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "file_repository_id_path_unique" UNIQUE("repository_id","path")
);
--> statement-breakpoint
CREATE TABLE "function" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"class_id" uuid,
	"name" text NOT NULL,
	"signature" text NOT NULL,
	"start_line" integer NOT NULL,
	"end_line" integer NOT NULL,
	"complexity_score" numeric DEFAULT '0',
	"is_entry_point" boolean DEFAULT false NOT NULL,
	"docstring" text
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"remote_url" text NOT NULL,
	"default_branch" text,
	"primary_language" text,
	"loc_total" integer DEFAULT 0,
	"indexing_status" "indexing_status" DEFAULT 'pending' NOT NULL,
	"last_indexed_commit_sha" text,
	"last_indexed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repository_workspace_id_remote_url_unique" UNIQUE("workspace_id","remote_url")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"auth_provider" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"ai_layer_enabled" boolean DEFAULT false NOT NULL,
	"ai_provider_config_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_provider_config" ADD CONSTRAINT "ai_provider_config_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_edge" ADD CONSTRAINT "call_edge_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_edge" ADD CONSTRAINT "call_edge_caller_function_id_function_id_fk" FOREIGN KEY ("caller_function_id") REFERENCES "public"."function"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_edge" ADD CONSTRAINT "call_edge_callee_function_id_function_id_fk" FOREIGN KEY ("callee_function_id") REFERENCES "public"."function"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class" ADD CONSTRAINT "class_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class" ADD CONSTRAINT "class_parent_class_id_class_id_fk" FOREIGN KEY ("parent_class_id") REFERENCES "public"."class"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "function" ADD CONSTRAINT "function_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "function" ADD CONSTRAINT "function_class_id_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository" ADD CONSTRAINT "repository_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;