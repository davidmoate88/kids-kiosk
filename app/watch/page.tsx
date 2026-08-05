import WatchClient from "@/components/WatchClient";
import { getWatchFolders } from "@/lib/watch-folders";

// getWatchFolders() now reads Postgres directly (no fetch() calls for Next
// to attach cache/revalidate semantics to), so without this the page would
// default to a build-time static snapshot — new approvals from /parents
// wouldn't appear without a full rebuild. Traffic here is a handful of
// family devices, so per-request rendering costs nothing meaningful.
export const dynamic = "force-dynamic";

export default async function WatchPage() {
  const folders = await getWatchFolders();
  // v1.1: /watch now shares the same PlayerHandle engine abstraction
  // TvPlayer.tsx uses, so Stremio content plays here too — no more
  // filterYouTubeOnly (see WatchClient.tsx for the engine wiring).
  return <WatchClient folders={folders} />;
}
