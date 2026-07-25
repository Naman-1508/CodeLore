CREATE TABLE "ai_narration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"narration_text" text NOT NULL,
	"fallback_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "architecture_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"commit_hash" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"module_map_json" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_flow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"trace_id" text NOT NULL,
	"flow_data_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guided_tour_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"code_story_id" uuid NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guided_tour" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "architecture_snapshot" ADD CONSTRAINT "architecture_snapshot_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_flow" ADD CONSTRAINT "execution_flow_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guided_tour_step" ADD CONSTRAINT "guided_tour_step_tour_id_guided_tour_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."guided_tour"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guided_tour_step" ADD CONSTRAINT "guided_tour_step_code_story_id_code_story_id_fk" FOREIGN KEY ("code_story_id") REFERENCES "public"."code_story"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guided_tour" ADD CONSTRAINT "guided_tour_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE no action ON UPDATE no action;