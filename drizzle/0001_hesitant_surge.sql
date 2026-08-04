CREATE TYPE "public"."stremio_media_type" AS ENUM('movie', 'series');--> statement-breakpoint
CREATE TABLE "stremio_episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stremio_title_id" uuid NOT NULL,
	"season" integer NOT NULL,
	"episode" integer NOT NULL,
	"name" text NOT NULL,
	"thumbnail_url" text,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stremio_titles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"imdb_id" text NOT NULL,
	"media_type" "stremio_media_type" NOT NULL,
	"name" text NOT NULL,
	"poster_url" text,
	"trusted_row_id" uuid,
	"folder" text,
	"scope" "approved_scope" DEFAULT 'all' NOT NULL,
	"approved_episode_ids" uuid[] DEFAULT '{}' NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stremio_trusted_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_id" text NOT NULL,
	"label" text NOT NULL,
	"folder" text NOT NULL,
	"media_type" "stremio_media_type" NOT NULL,
	"last_sync_at" timestamp with time zone,
	"status" text DEFAULT 'ok' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stremio_trusted_rows_catalog_id_unique" UNIQUE("catalog_id")
);
--> statement-breakpoint
ALTER TABLE "stremio_episodes" ADD CONSTRAINT "stremio_episodes_stremio_title_id_stremio_titles_id_fk" FOREIGN KEY ("stremio_title_id") REFERENCES "public"."stremio_titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stremio_titles" ADD CONSTRAINT "stremio_titles_trusted_row_id_stremio_trusted_rows_id_fk" FOREIGN KEY ("trusted_row_id") REFERENCES "public"."stremio_trusted_rows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stremio_episodes_title_season_episode_idx" ON "stremio_episodes" USING btree ("stremio_title_id","season","episode");--> statement-breakpoint
CREATE UNIQUE INDEX "stremio_titles_imdb_media_type_idx" ON "stremio_titles" USING btree ("imdb_id","media_type");