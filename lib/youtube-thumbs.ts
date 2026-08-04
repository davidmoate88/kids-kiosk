import type { VideoCategory } from "@/components/WatchClient";
import type { ApprovedVideo } from "@/lib/watch-folders";

type YouTubeThumbSize = "mqdefault" | "hqdefault";

/** Cover art for a category (a "show" tile on the TV home screen) — the
 * first video's thumbnail unless a specific frame is overridden. */
export function categoryThumbnail(category: VideoCategory, override?: string): string {
  const video = category.videos[0];
  if (override) return `https://i.ytimg.com/vi/${override}/hqdefault.jpg`;
  return video ? videoThumbnail(video) : "";
}

export function videoThumbnail(video: ApprovedVideo, size: YouTubeThumbSize = "hqdefault"): string {
  if (video.source === "stremio") return video.posterUrl ?? "";
  return `https://i.ytimg.com/vi/${video.videoId}/${size}.jpg`;
}
