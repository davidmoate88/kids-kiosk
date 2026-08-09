"use server";

import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  episodes,
  stremioEpisodes,
  stremioTitles,
  titles,
  watchHistory,
} from "@/db/schema";

export type HistoryItem = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  source: "youtube" | "stremio";
  /** The stable videoId used for /watch deep-links (external yt id,
   *  imdbId for a movie, or "imdbId:season:episode" for an episode). */
  videoId: string;
  mediaType?: "movie" | "series";
  watchedAt: Date;
};

// One shared, household-wide history — see db/schema.ts's watchHistory
// comment for why this isn't split per kid profile.
export async function getWatchHistory(limit = 30): Promise<HistoryItem[]> {
  const db = getDb();

  const [youtubeRows, stremioMovieRows, stremioEpisodeRows] =
    await Promise.all([
      // YouTube — inner join through episodes → titles
      db
        .select({
          id: watchHistory.id,
          title: titles.name,
          thumbnailUrl: episodes.thumbnailUrl,
          videoId: episodes.externalId,
          watchedAt: watchHistory.watchedAt,
        })
        .from(watchHistory)
        .innerJoin(episodes, eq(watchHistory.episodeId, episodes.id))
        .innerJoin(titles, eq(episodes.titleId, titles.id))
        .orderBy(desc(watchHistory.watchedAt))
        .limit(limit),

      // Stremio movies — inner join through stremioTitles
      db
        .select({
          id: watchHistory.id,
          title: stremioTitles.name,
          thumbnailUrl: stremioTitles.posterUrl,
          videoId: stremioTitles.imdbId,
          watchedAt: watchHistory.watchedAt,
        })
        .from(watchHistory)
        .innerJoin(stremioTitles, eq(watchHistory.stremioTitleId, stremioTitles.id))
        .orderBy(desc(watchHistory.watchedAt))
        .limit(limit),

      // Stremio episodes — inner join through stremioEpisodes → stremioTitles
      db
        .select({
          id: watchHistory.id,
          title: stremioEpisodes.name,
          thumbnailUrl: stremioEpisodes.thumbnailUrl,
          imdbId: stremioTitles.imdbId,
          season: stremioEpisodes.season,
          episode: stremioEpisodes.episode,
          watchedAt: watchHistory.watchedAt,
        })
        .from(watchHistory)
        .innerJoin(
          stremioEpisodes,
          eq(watchHistory.stremioEpisodeId, stremioEpisodes.id),
        )
        .innerJoin(
          stremioTitles,
          eq(stremioEpisodes.stremioTitleId, stremioTitles.id),
        )
        .orderBy(desc(watchHistory.watchedAt))
        .limit(limit),
    ]);

  const items: HistoryItem[] = [
    ...youtubeRows.map((r) => ({
      id: r.id,
      title: r.title,
      thumbnailUrl: r.thumbnailUrl,
      source: "youtube" as const,
      videoId: r.videoId,
      watchedAt: r.watchedAt,
    })),
    ...stremioMovieRows.map((r) => ({
      id: r.id,
      title: r.title,
      thumbnailUrl: r.thumbnailUrl,
      source: "stremio" as const,
      videoId: r.videoId,
      mediaType: "movie" as const,
      watchedAt: r.watchedAt,
    })),
    ...stremioEpisodeRows.map((r) => ({
      id: r.id,
      title: r.title,
      thumbnailUrl: r.thumbnailUrl,
      source: "stremio" as const,
      videoId: `${r.imdbId}:${r.season}:${r.episode}`,
      mediaType: "series" as const,
      watchedAt: r.watchedAt,
    })),
  ];

  items.sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime());
  return items.slice(0, limit);
}
