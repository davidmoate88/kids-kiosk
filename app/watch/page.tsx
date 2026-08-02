import WatchClient, { type VideoCategory, type VideoFolder } from "@/components/WatchClient";
import {
  APPROVED_VIDEOS,
  APPROVED_CHANNELS,
  APPROVED_PLAYLISTS,
  VIDEOS_FOLDER,
  type Folder,
} from "@/lib/approved-videos";
import { getChannelUploads, getPlaylistVideos } from "@/lib/youtube";

const FOLDER_EMOJI: Record<Folder, string> = {
  "Songs & Learning": "🎵",
  Shows: "📺",
};

export default async function WatchPage() {
  const [channelResults, playlistResults] = await Promise.all([
    Promise.all(
      APPROVED_CHANNELS.map(async (channel) => ({
        channel,
        videos: await getChannelUploads(channel.channelId),
      }))
    ),
    Promise.all(
      APPROVED_PLAYLISTS.map(async (playlist) => ({
        playlist,
        videos: await getPlaylistVideos(playlist.playlistId),
      }))
    ),
  ]);

  const categories: (VideoCategory & { folder: Folder })[] = [
    { id: "videos", label: "My Videos", emoji: "⭐", videos: APPROVED_VIDEOS, folder: VIDEOS_FOLDER },
    ...playlistResults.map(({ playlist, videos }) => ({
      id: playlist.id,
      label: playlist.name,
      emoji: "📋",
      videos,
      folder: playlist.folder,
    })),
    ...channelResults.map(({ channel, videos }) => ({
      id: channel.id,
      label: channel.name,
      emoji: "📺",
      videos,
      folder: channel.folder,
    })),
  ].filter((cat) => cat.videos.length > 0);

  const folders: VideoFolder[] = [];
  for (const { folder, ...category } of categories) {
    let bucket = folders.find((f) => f.id === folder);
    if (!bucket) {
      bucket = { id: folder, label: folder, emoji: FOLDER_EMOJI[folder], categories: [] };
      folders.push(bucket);
    }
    bucket.categories.push(category);
  }

  return <WatchClient folders={folders} />;
}
