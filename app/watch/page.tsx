import WatchClient from "@/components/WatchClient";
import { getWatchFolders, type ApprovedVideo } from "@/lib/watch-folders";
import { requireAuth } from "@/lib/require-auth";

// getWatchFolders() now reads Postgres directly (no fetch() calls for Next
// to attach cache/revalidate semantics to), so without this the page would
// default to a build-time static snapshot — new approvals from /parents
// wouldn't appear without a full rebuild. Traffic here is a handful of
// family devices, so per-request rendering costs nothing meaningful.
export const dynamic = "force-dynamic";

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // This route is now PIN-gated like everything else — see requireAuth().
  await requireAuth();
  const folders = await getWatchFolders();

  const params = await searchParams;
  const targetVideoId = typeof params.v === "string" ? params.v : null;
  const targetSource = typeof params.src === "string" ? params.src : null;

  let initialVideo: ApprovedVideo | null = null;
  if (targetVideoId && targetSource) {
    for (const folder of folders) {
      for (const cat of folder.categories) {
        const match = cat.videos.find(
          (v) => v.videoId === targetVideoId && v.source === targetSource,
        );
        if (match) {
          initialVideo = match;
          break;
        }
      }
      if (initialVideo) break;
    }
  }

  return <WatchClient folders={folders} initialVideo={initialVideo} />;
}
