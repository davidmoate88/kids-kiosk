import WatchClient from "@/components/WatchClient";
import { getWatchFolders } from "@/lib/watch-folders";

/**
 * Locked-down entry point for a TV kiosk browser — only the approved
 * videos/channels are reachable, with no navigation to any other part
 * of the app (see KioskShell's isTv bypass) and no profile selection
 * needed, since Watch doesn't track per-profile state.
 */
export default async function TvPage() {
  const folders = await getWatchFolders();
  return <WatchClient folders={folders} />;
}
