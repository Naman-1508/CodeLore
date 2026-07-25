CREATE TYPE "public"."change_type" AS ENUM('added', 'modified', 'deleted', 'renamed');--> statement-breakpoint
CREATE TYPE "public"."dependency_type" AS ENUM('runtime', 'dev', 'internal');--> statement-breakpoint
CREATE TABLE "commit_file_change" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"git_commit_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"change_type" "change_type" NOT NULL,
	"lines_added" integer DEFAULT 0 NOT NULL,
	"lines_removed" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dependency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"source_module" text NOT NULL,
	"target_module" text NOT NULL,
	"dependency_type" "dependency_type" NOT NULL,
	"is_circular" boolean DEFAULT false NOT NULL,
	"coupling_strength" numeric DEFAULT '0',
	CONSTRAINT "dependency_repository_id_source_module_target_module_unique" UNIQUE("repository_id","source_module","target_module")
);
--> statement-breakpoint
CREATE TABLE "git_commit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"sha" text NOT NULL,
	"author_email" text NOT NULL,
	"author_name" text NOT NULL,
	"committed_at" timestamp with time zone NOT NULL,
	"message" text NOT NULL,
	"additions" integer DEFAULT 0 NOT NULL,
	"deletions" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "git_commit_repository_id_sha_unique" UNIQUE("repository_id","sha")
);
--> statement-breakpoint
ALTER TABLE "commit_file_change" ADD CONSTRAINT "commit_file_change_git_commit_id_git_commit_id_fk" FOREIGN KEY ("git_commit_id") REFERENCES "public"."git_commit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commit_file_change" ADD CONSTRAINT "commit_file_change_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependency" ADD CONSTRAINT "dependency_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "git_commit" ADD CONSTRAINT "git_commit_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE no action ON UPDATE no action;