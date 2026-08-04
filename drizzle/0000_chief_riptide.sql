CREATE TYPE "public"."approved_scope" AS ENUM('all', 'episodes');--> statement-breakpoint
CREATE TYPE "public"."catalogue_kind" AS ENUM('channel', 'playlist');--> statement-breakpoint
CREATE TYPE "public"."queue_state" AS ENUM('pending', 'approved', 'skipped');--> statement-breakpoint
CREATE TABLE "approval_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_id" uuid NOT NULL,
	"episode_id" uuid NOT NULL,
	"state" "queue_state" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approved_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_id" uuid NOT NULL,
	"scope" "approved_scope" DEFAULT 'all' NOT NULL,
	"approved_episode_ids" uuid[] DEFAULT '{}' NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approved_content_title_id_unique" UNIQUE("title_id")
);
--> statement-breakpoint
CREATE TABLE "catalogues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "catalogue_kind" NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"folder" text NOT NULL,
	"auto_approve_new_episodes" boolean DEFAULT false NOT NULL,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp with time zone,
	"status" text DEFAULT 'ok' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalogues_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"thumbnail_url" text,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalogue_id" uuid,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"thumbnail_url" text,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "approval_queue" ADD CONSTRAINT "approval_queue_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_queue" ADD CONSTRAINT "approval_queue_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_content" ADD CONSTRAINT "approved_content_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "titles" ADD CONSTRAINT "titles_catalogue_id_catalogues_id_fk" FOREIGN KEY ("catalogue_id") REFERENCES "public"."catalogues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "approval_queue_episode_idx" ON "approval_queue" USING btree ("episode_id");--> statement-breakpoint
CREATE UNIQUE INDEX "episodes_title_external_idx" ON "episodes" USING btree ("title_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "titles_catalogue_id_idx" ON "titles" USING btree ("catalogue_id");