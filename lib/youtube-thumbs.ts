import type { VideoCategory } from "@/components/WatchClient";
import type { ApprovedVideo } from "@/lib/approved-videos";

/** Cover art for a category (a "show" tile on the TV home screen) — the
 * first video's thumbnail unless a specific frame is overridden. */
export function categoryThumbnail(category: VideoCategory, override?: string): string {
  const videoId = override ?? category.videos[0]?.videoId;
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
}

export function videoThumbnail(video: ApprovedVideo): string {
  return `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
}
