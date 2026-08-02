import WatchClient, { type VideoCategory } from "@/components/WatchClient";
import { APPROVED_VIDEOS, APPROVED_CHANNELS, APPROVED_PLAYLISTS } from "@/lib/approved-videos";
import { getChannelUploads, getPlaylistVideos } from "@/lib/youtube";

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

  const categories: VideoCategory[] = [
    { id: "videos", label: "My Videos", emoji: "⭐", videos: APPROVED_VIDEOS },
    ...playlistResults.map(({ playlist, videos }) => ({
      id: playlist.id,
      label: playlist.name,
      emoji: "📋",
      videos,
    })),
    ...channelResults.map(({ channel, videos }) => ({
      id: channel.id,
      label: channel.name,
      emoji: "📺",
      videos,
    })),
  ].filter((cat) => cat.videos.length > 0);

  return <WatchClient categories={categories} />;
}
