import WatchClient, { type VideoCategory } from "@/components/WatchClient";
import { APPROVED_VIDEOS, APPROVED_CHANNELS } from "@/lib/approved-videos";
import { getChannelUploads } from "@/lib/youtube-channel";

export default async function WatchPage() {
  const channelResults = await Promise.all(
    APPROVED_CHANNELS.map(async (channel) => ({
      channel,
      videos: await getChannelUploads(channel.channelId),
    }))
  );

  const categories: VideoCategory[] = [
    { id: "videos", label: "My Videos", emoji: "⭐", videos: APPROVED_VIDEOS },
    ...channelResults.map(({ channel, videos }) => ({
      id: channel.id,
      label: channel.name,
      emoji: "📺",
      videos,
    })),
  ].filter((cat) => cat.videos.length > 0);

  return <WatchClient categories={categories} />;
}
