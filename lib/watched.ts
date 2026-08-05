"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { episodes, watchedContent } from "@/db/schema";

// Called from TvPlayer.tsx's onEnded and WatchClient.tsx's YouTube "ended"
// handler, whenever a video plays to completion. Global/device-wide, not
// per-profile — see db/schema.ts's comment on watchedContent for why.
//
// `videoId` is whatever ApprovedVideo.id already is for that source (see
// lib/watch-folders.ts): for YouTube that's the external YouTube video id
// (episodes.externalId), not the internal episodes.id the FK needs, so it's
// resolved here rather than requiring the client to know the UUID. For
// Stremio, ApprovedVideo.id already *is* the real UUID — stremioTitles.id
// for a movie, stremioEpisodes.id for a series episode — so mediaType picks
// which FK column it belongs in, no resolution needed.
export async function markWatched(
  source: "youtube" | "stremio",
  videoId: string,
  mediaType?: "movie" | "series"
): Promise<void> {
  const db = getDb();

  if (source === "youtube") {
    const [episode] = await db
      .select({ id: episodes.id })
      .from(episodes)
      .where(eq(episodes.externalId, videoId))
      .limit(1);
    // Shouldn't happen for a video that was playable at all (it came from
    // an already-approved episode), but silently no-op rather than crash
    // the player over a "mark as watched" side effect.
    if (!episode) return;
    await db
      .insert(watchedContent)
      .values({ source: "youtube", episodeId: episode.id })
      .onConflictDoNothing({ target: watchedContent.episodeId });
  } else if (mediaType === "movie") {
    await db
      .insert(watchedContent)
      .values({ source: "stremio", stremioTitleId: videoId })
      .onConflictDoNothing({ target: watchedContent.stremioTitleId });
  } else {
    await db
      .insert(watchedContent)
      .values({ source: "stremio", stremioEpisodeId: videoId })
      .onConflictDoNothing({ target: watchedContent.stremioEpisodeId });
  }

  revalidatePath("/tv");
  revalidatePath("/watch");
}
