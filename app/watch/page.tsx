import WatchClient from "@/components/WatchClient";
import { filterYouTubeOnly, getWatchFolders } from "@/lib/watch-folders";

// getWatchFolders() now reads Postgres directly (no fetch() calls for Next
// to attach cache/revalidate semantics to), so without this the page would
// default to a build-time static snapshot — new approvals from /parents
// wouldn't appear without a full rebuild. Traffic here is a handful of
// family devices, so per-request rendering costs nothing meaningful.
export const dynamic = "force-dynamic";

export default async function WatchPage() {
  const folders = await getWatchFolders();
  // /watch has no Stremio playback engine yet (v1 scope is /tv-only).
  return <WatchClient folders={filterYouTubeOnly(folders)} />;
}
