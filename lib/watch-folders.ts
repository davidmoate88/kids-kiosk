import { eq } from "drizzle-orm";
import type { VideoCategory, VideoFolder } from "@/components/WatchClient";
import { getDb } from "@/db";
import { approvedContent, catalogues, episodes, titles } from "@/db/schema";

export type ApprovedVideo = {
  id: string;
  videoId: string;
  title: string;
};

const FOLDER_EMOJI: Record<string, string> = {
  "Songs & Learning": "🎵",
  Shows: "📺",
  Vehicles: "🚜",
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

export async function getWatchFolders(): Promise<VideoFolder[]> {
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

  const categories: (VideoCategory & { folder: string })[] = [];
  const standaloneVideos: ApprovedVideo[] = [];

  for (const t of approved) {
    const titleEpisodes = episodesByTitle.get(t.titleId) ?? [];

    if (titleEpisodes.length === 0 && !t.catalogueId) {
      // Standalone hand-approved video (no catalogue, no episodes rows) —
      // the title itself IS the video.
      standaloneVideos.push({ id: t.titleExternalId, videoId: t.titleExternalId, title: t.titleName });
      continue;
    }

    const visibleEpisodes =
      t.scope === "all" ? titleEpisodes : titleEpisodes.filter((e) => t.approvedEpisodeIds.includes(e.id));
    if (visibleEpisodes.length === 0) continue;

    categories.push({
      id: t.catalogueId ?? t.titleId,
      label: t.catalogueName ?? t.titleName,
      emoji: t.catalogueKind === "playlist" ? "📋" : "📺",
      videos: visibleEpisodes.map((e) => ({ id: e.externalId, videoId: e.externalId, title: e.name })),
      folder: t.folder ?? STANDALONE_FOLDER,
    });
  }

  if (standaloneVideos.length > 0) {
    categories.unshift({
      id: "videos",
      label: "My Videos",
      emoji: "⭐",
      videos: standaloneVideos,
      folder: STANDALONE_FOLDER,
    });
  }

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

  return folders;
}
