CREATE TYPE "public"."watch_source" AS ENUM('youtube', 'stremio');--> statement-breakpoint
CREATE TABLE "watched_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "watch_source" NOT NULL,
	"episode_id" uuid,
	"stremio_episode_id" uuid,
	"stremio_title_id" uuid,
	"watched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "watched_content" ADD CONSTRAINT "watched_content_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_content" ADD CONSTRAINT "watched_content_stremio_episode_id_stremio_episodes_id_fk" FOREIGN KEY ("stremio_episode_id") REFERENCES "public"."stremio_episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_content" ADD CONSTRAINT "watched_content_stremio_title_id_stremio_titles_id_fk" FOREIGN KEY ("stremio_title_id") REFERENCES "public"."stremio_titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "watched_content_episode_idx" ON "watched_content" USING btree ("episode_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watched_content_stremio_episode_idx" ON "watched_content" USING btree ("stremio_episode_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watched_content_stremio_title_idx" ON "watched_content" USING btree ("stremio_title_id");