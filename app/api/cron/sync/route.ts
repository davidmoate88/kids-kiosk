import { NextRequest, NextResponse } from "next/server";
import { syncAllCatalogues } from "@/lib/youtube-sync";

// Hit nightly by a cron job on whatever's actually running the app (a Linux
// crontab/systemd timer for the self-hosted deploy) — this route itself is
// deployment-agnostic, it just needs *something* external to call it on a
// schedule. Guarded by a shared secret since cron endpoints are public URLs
// with no real caller identity to check.
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await syncAllCatalogues();
  return NextResponse.json({ results });
}
