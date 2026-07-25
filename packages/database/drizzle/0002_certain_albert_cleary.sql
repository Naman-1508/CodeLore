CREATE TABLE "code_story" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"entry_function_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_story_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_story_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"function_id" uuid NOT NULL,
	"narration" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"score" integer NOT NULL,
	"metrics_json" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "code_story" ADD CONSTRAINT "code_story_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_story" ADD CONSTRAINT "code_story_entry_function_id_function_id_fk" FOREIGN KEY ("entry_function_id") REFERENCES "public"."function"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_story_step" ADD CONSTRAINT "code_story_step_code_story_id_code_story_id_fk" FOREIGN KEY ("code_story_id") REFERENCES "public"."code_story"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_story_step" ADD CONSTRAINT "code_story_step_function_id_function_id_fk" FOREIGN KEY ("function_id") REFERENCES "public"."function"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_snapshot" ADD CONSTRAINT "health_snapshot_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE no action ON UPDATE no action;