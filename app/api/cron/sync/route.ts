import { NextRequest, NextResponse } from "next/server";
import { syncAllCatalogues } from "@/lib/youtube-sync";
import { refreshApprovedSeriesEpisodes, syncAllTrustedRowsDiscovery } from "@/lib/stremio-sync";

// Hit nightly by a cron job on whatever's actually running the app (a Linux
// crontab/systemd timer for the self-hosted deploy) — this route itself is
// deployment-agnostic, it just needs *something* external to call it on a
// schedule. Guarded by a shared secret since cron endpoints are public URLs
// with no real caller identity to check.
//
// syncAllTrustedRowsDiscovery is called every run but internally no-ops for
// any row synced within the last week (see lib/stremio-sync.ts) — new-title
// discovery is weekly, episode-list refresh for already-approved series is
// nightly, same as YouTube's sync.
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [youtubeResults] = await Promise.all([
    syncAllCatalogues(),
    syncAllTrustedRowsDiscovery(),
    refreshApprovedSeriesEpisodes(),
  ]);
  return NextResponse.json({ results: youtubeResults });
}
