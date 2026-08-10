import { eq } from "drizzle-orm";
import type { VideoCategory, VideoFolder } from "@/components/WatchClient";
import { getDb } from "@/db";
import {
  approvedContent,
  catalogues,
  episodes,
  stremioEpisodes,
  stremioTitles,
  stremioTrustedRows,
  titles,
  watchedContent,
} from "@/db/schema";

export type ApprovedVideo = {
  id: string;
  // Stable unique id used for equality/keys/thumbnail derivation across both
  // sources: the real YouTube video id, or (Stremio) the imdbId for a movie /
  // "imdbId:season:episode" for an episode. Never parsed back apart — the
  // structured fields below (imdbId/season/episode) are what playback
  // actually uses to resolve a stream.
  videoId: string;
  title: string;
  source: "youtube" | "stremio";
  posterUrl?: string;
  imdbId?: string;
  mediaType?: "movie" | "series";
  season?: number;
  episode?: number;
  watched?: boolean;
};

const FOLDER_EMOJI: Record<string, string> = {
  "Songs & Learning": "🎵",
  Shows: "📺",
  Vehicles: "🚜",
  "Disney Junior": "🏰",
  Superheroes: "🦸",
  "Everyday Adventures": "🌟",
};

// Where individually hand-approved standalone videos (no catalogue) land —
// matches the old hardcoded VIDEOS_FOLDER/"My Videos" bucket exactly, since
// titles has no folder column of its own (see the Phase 2 plan).
const STANDALONE_FOLDER = "Songs & Learning";

// Overrides a folder tile's cover still — otherwise it defaults to the
// first video of the first category, which can land on an awkward frame.
const FOLDER_COVER_OVERRIDE: Record<string, string> = {
  Vehicles: "JJKvq-S_0Rg",
};

async function getYouTubeCategories(): Promise<(VideoCategory & { folder: string })[]> {
  const db = getDb();

  const approved = await db
    .select({
      titleId: titles.id,
      titleName: titles.name,
      titleExternalId: titles.externalId,
      catalogueId: catalogues.id,
      catalogueName: catalogues.name,
      catalogueKind: catalogues.kind,
      folder: catalogues.folder,
      scope: approvedContent.scope,
      approvedEpisodeIds: approvedContent.approvedEpisodeIds,
    })
    .from(approvedContent)
    .innerJoin(titles, eq(approvedContent.titleId, titles.id))
    .leftJoin(catalogues, eq(titles.catalogueId, catalogues.id))
    .orderBy(titles.name);

  const allEpisodes = await db.select().from(episodes);
  const episodesByTitle = new Map<string, typeof allEpisodes>();
  for (const ep of allEpisodes) {
    const list = episodesByTitle.get(ep.titleId) ?? [];
    list.push(ep);
    episodesByTitle.set(ep.titleId, list);
  }

  const watchedEpisodeIds = new Set(
    (
      await db
        .select({ episodeId: watchedContent.episodeId })
        .from(watchedContent)
        .where(eq(watchedContent.source, "youtube"))
    ).map((w) => w.episodeId)
  );

  const categories: (VideoCategory & { folder: string })[] = [];

  for (const t of approved) {
    const titleEpisodes = episodesByTitle.get(t.titleId) ?? [];

    // Standalone hand-approved videos (no catalogue, no episode rows) used to
    // land in a synthetic "My Videos" bucket — removed as redundant now that
    // real channels/Stremio content cover the same ground. Still approved in
    // the DB (see /parents/approve), just not surfaced as their own row.
    if (titleEpisodes.length === 0 && !t.catalogueId) continue;

    const visibleEpisodes =
      t.scope === "all" ? titleEpisodes : titleEpisodes.filter((e) => t.approvedEpisodeIds.includes(e.id));
    if (visibleEpisodes.length === 0) continue;

    categories.push({
      id: t.catalogueId ?? t.titleId,
      label: t.catalogueName ?? t.titleName,
      emoji: t.catalogueKind === "playlist" ? "📋" : "📺",
      videos: visibleEpisodes.map((e) => ({
        id: e.externalId,
        videoId: e.externalId,
        title: e.name,
        source: "youtube" as const,
        watched: watchedEpisodeIds.has(e.id),
      })),
      folder: t.folder ?? STANDALONE_FOLDER,
    });
  }

  return categories;
}

async function getStremioCategories(): Promise<(VideoCategory & { folder: string })[]> {
  const db = getDb();

  const rows = await db.select().from(stremioTrustedRows);
  const rowById = new Map(rows.map((r) => [r.id, r]));

  const approvedTitles = await db.select().from(stremioTitles);
  const allEpisodes = await db.select().from(stremioEpisodes);
  const episodesByTitle = new Map<string, typeof allEpisodes>();
  for (const ep of allEpisodes) {
    const list = episodesByTitle.get(ep.stremioTitleId) ?? [];
    list.push(ep);
    episodesByTitle.set(ep.stremioTitleId, list);
  }

  const watchedRows = await db
    .select({ stremioTitleId: watchedContent.stremioTitleId, stremioEpisodeId: watchedContent.stremioEpisodeId })
    .from(watchedContent)
    .where(eq(watchedContent.source, "stremio"));
  const watchedStremioTitleIds = new Set(watchedRows.map((w) => w.stremioTitleId));
  const watchedStremioEpisodeIds = new Set(watchedRows.map((w) => w.stremioEpisodeId));

  const categories: (VideoCategory & { folder: string })[] = [];

  for (const t of approvedTitles) {
    const folder = t.folder ?? (t.trustedRowId ? rowById.get(t.trustedRowId)?.folder : undefined) ?? STANDALONE_FOLDER;

    if (t.mediaType === "movie") {
      categories.push({
        id: t.id,
        label: t.name,
        emoji: "🎬",
        videos: [
          {
            id: t.id,
            videoId: t.imdbId,
            title: t.name,
            source: "stremio",
            posterUrl: t.posterUrl ?? undefined,
            imdbId: t.imdbId,
            mediaType: "movie",
            watched: watchedStremioTitleIds.has(t.id),
          },
        ],
        folder,
      });
      continue;
    }

    const titleEpisodes = (episodesByTitle.get(t.id) ?? [])
      .slice()
      .sort((a, b) => (a.season - b.season) || (a.episode - b.episode));
    if (titleEpisodes.length === 0) continue;

    categories.push({
      id: t.id,
      label: t.name,
      emoji: "📺",
      videos: titleEpisodes.map((e) => ({
        id: e.id,
        videoId: `${t.imdbId}:${e.season}:${e.episode}`,
        title: e.name,
        source: "stremio" as const,
        posterUrl: e.thumbnailUrl ?? t.posterUrl ?? undefined,
        imdbId: t.imdbId,
        mediaType: "series" as const,
        season: e.season,
        episode: e.episode,
        watched: watchedStremioEpisodeIds.has(e.id),
      })),
      folder,
    });
  }

  return categories;
}

function groupIntoFolders(categories: (VideoCategory & { folder: string })[]): VideoFolder[] {
  const folders: VideoFolder[] = [];
  for (const { folder, ...category } of categories) {
    let bucket = folders.find((f) => f.id === folder);
    if (!bucket) {
      bucket = {
        id: folder,
        label: folder,
        emoji: FOLDER_EMOJI[folder] ?? "📺",
        categories: [],
        coverVideoId: FOLDER_COVER_OVERRIDE[folder],
      };
      folders.push(bucket);
    }
    bucket.categories.push(category);
  }

  // Both YouTube and Stremio categories land here in whatever order their
  // own queries happened to return (YouTube: title-name order; Stremio: raw
  // table order) — sorting here, once, gives every reader (/watch's folder
  // picker and category chips, /tv's Search/Detail/Favourites) one
  // consistent, predictable order instead of each guessing independently.
  // TvHome shuffles its own copy for browsing variety, so this doesn't
  // fight that — it just gives the shuffle a deterministic starting point.
  for (const bucket of folders) {
    bucket.categories.sort((a, b) => a.label.localeCompare(b.label));
  }
  folders.sort((a, b) => a.label.localeCompare(b.label));

  return folders;
}

export async function getWatchFolders(): Promise<VideoFolder[]> {
  const [youtubeCategories, stremioCategories] = await Promise.all([
    getYouTubeCategories(),
    getStremioCategories(),
  ]);
  return groupIntoFolders([...youtubeCategories, ...stremioCategories]);
}

// /watch has no Stremio playback engine (v1 scope is /tv-only — see the
// Phase 3 plan), so it renders this instead of the full merged set. Prunes
// any folder that ends up with nothing left rather than showing an empty tile.
export function filterYouTubeOnly(folders: VideoFolder[]): VideoFolder[] {
  return folders
    .map((folder) => ({
      ...folder,
      categories: folder.categories
        .map((category) => ({
          ...category,
          videos: category.videos.filter((v) => v.source === "youtube"),
        }))
        .filter((category) => category.videos.length > 0),
    }))
    .filter((folder) => folder.categories.length > 0);
}
