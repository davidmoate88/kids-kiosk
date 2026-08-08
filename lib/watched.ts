"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { episodes, watchedContent, watchHistory } from "@/db/schema";

// Called from TvPlayer.tsx's onEnded and WatchClient.tsx's YouTube "ended"
// handler, whenever a video plays to completion. Always updates
// watchedContent (the global "watched to completion" checkmark). When a
// profileId is provided (from ProfileContext on the phone/tablet — TV
// kiosk has no profile), also appends a row to watchHistory to power the
// per-kid /history page.
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
  mediaType?: "movie" | "series",
  profileId?: string | null,
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

    const values = { source: "youtube" as const, episodeId: episode.id };
    await db.insert(watchedContent).values(values).onConflictDoNothing({ target: watchedContent.episodeId });
    if (profileId) {
      await db.insert(watchHistory).values({ ...values, profileId });
    }
  } else if (mediaType === "movie") {
    const values = { source: "stremio" as const, stremioTitleId: videoId };
    await db.insert(watchedContent).values(values).onConflictDoNothing({ target: watchedContent.stremioTitleId });
    if (profileId) {
      await db.insert(watchHistory).values({ ...values, profileId });
    }
  } else {
    const values = { source: "stremio" as const, stremioEpisodeId: videoId };
    await db.insert(watchedContent).values(values).onConflictDoNothing({ target: watchedContent.stremioEpisodeId });
    if (profileId) {
      await db.insert(watchHistory).values({ ...values, profileId });
    }
  }

  revalidatePath("/tv");
  revalidatePath("/watch");
  if (profileId) revalidatePath("/history");
}
