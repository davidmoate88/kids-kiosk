import TvApp from "@/components/TvApp";
import { getWatchFolders } from "@/lib/watch-folders";
import { requireAuth } from "@/lib/require-auth";

// See app/watch/page.tsx — same reasoning: getWatchFolders() reads Postgres
// directly, so this must be forced dynamic or new approvals would be
// frozen out until the next rebuild.
export const dynamic = "force-dynamic";

/**
 * Locked-down entry point for a TV kiosk browser — only the approved
 * videos/channels are reachable, with no navigation to any other part
 * of the app (see KioskShell's isTv bypass) and no profile selection
 * needed, since TvApp doesn't track per-profile state.
 */
export default async function TvPage() {
  await requireAuth();
  const folders = await getWatchFolders();
  return <TvApp folders={folders} />;
}
