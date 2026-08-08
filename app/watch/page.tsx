import WatchClient from "@/components/WatchClient";
import { getWatchFolders } from "@/lib/watch-folders";
import { requireAuth } from "@/lib/require-auth";

// getWatchFolders() now reads Postgres directly (no fetch() calls for Next
// to attach cache/revalidate semantics to), so without this the page would
// default to a build-time static snapshot — new approvals from /parents
// wouldn't appear without a full rebuild. Traffic here is a handful of
// family devices, so per-request rendering costs nothing meaningful.
export const dynamic = "force-dynamic";

export default async function WatchPage() {
  // This route is now PIN-gated like everything else — see requireAuth().
  await requireAuth();
  const folders = await getWatchFolders();
  return <WatchClient folders={folders} />;
}
