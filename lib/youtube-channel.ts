import type { ApprovedVideo } from "./approved-videos";

type PlaylistItem = {
  snippet?: {
    title?: string;
    resourceId?: { videoId?: string };
  };
};

/**
 * Fetches a channel's full uploads history via its "uploads" playlist —
 * every YouTube channel's uploads playlist ID is its channel ID with the
 * "UC" prefix swapped for "UU", so this needs no extra lookup call.
 * Returns [] whenever no API key is configured, so pages degrade
 * gracefully to just the individually-approved videos.
 */
export async function getChannelUploads(channelId: string, max = 12): Promise<ApprovedVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !channelId.startsWith("UC")) return [];

  const uploadsPlaylistId = "UU" + channelId.slice(2);

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${max}&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const json = await res.json();
    const items = (json.items ?? []) as PlaylistItem[];

    return items
      .filter((item) => item.snippet?.resourceId?.videoId && item.snippet.title)
      .map((item) => ({
        id: item.snippet!.resourceId!.videoId!,
        videoId: item.snippet!.resourceId!.videoId!,
        title: item.snippet!.title!,
      }));
  } catch {
    return [];
  }
}
