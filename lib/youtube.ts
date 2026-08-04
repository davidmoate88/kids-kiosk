import type { ApprovedVideo } from "./watch-folders";

type PlaylistItem = {
  snippet?: {
    title?: string;
    resourceId?: { videoId?: string };
  };
};

async function fetchPlaylistVideos(playlistId: string, max: number): Promise<ApprovedVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${max}&key=${apiKey}`;
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

/**
 * Fetches a channel's full uploads history via its "uploads" playlist —
 * every YouTube channel's uploads playlist ID is its channel ID with the
 * "UC" prefix swapped for "UU", so this needs no extra lookup call.
 * Returns [] whenever no API key is configured, so pages degrade
 * gracefully to just the individually-approved videos.
 */
export async function getChannelUploads(channelId: string, max = 12): Promise<ApprovedVideo[]> {
  if (!channelId.startsWith("UC")) return [];
  return fetchPlaylistVideos("UU" + channelId.slice(2), max);
}

/**
 * Fetches the videos in a public or unlisted YouTube playlist — the
 * lightweight alternative to approving a whole channel: David adds
 * videos to the playlist from the YouTube app and they show up here
 * without any code changes or redeploy. Private playlists aren't
 * readable this way (that needs OAuth), so the playlist must be set to
 * Public or Unlisted.
 */
export async function getPlaylistVideos(playlistId: string, max = 25): Promise<ApprovedVideo[]> {
  return fetchPlaylistVideos(playlistId, max);
}
