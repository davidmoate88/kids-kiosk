CREATE TABLE "watch_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" text,
	"source" "watch_source" NOT NULL,
	"episode_id" uuid,
	"stremio_episode_id" uuid,
	"stremio_title_id" uuid,
	"watched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_stremio_episode_id_stremio_episodes_id_fk" FOREIGN KEY ("stremio_episode_id") REFERENCES "public"."stremio_episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_stremio_title_id_stremio_titles_id_fk" FOREIGN KEY ("stremio_title_id") REFERENCES "public"."stremio_titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "watch_history_profile_time_idx" ON "watch_history" USING btree ("profile_id","watched_at");