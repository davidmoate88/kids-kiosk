import { NextResponse } from "next/server";
import { getTvRefreshRequestedAt } from "@/lib/refresh-signal";

// Polled by TvApp.tsx. No dynamic request API (headers/cookies/params) is
// read here, so without force-dynamic this GET could get statically
// optimized/cached by Next and always return the same frozen value — see
// app/tv/page.tsx's own force-dynamic comment for the same underlying
// gotcha. No auth check: same LAN-only trust boundary as /tv itself, and a
// bare timestamp reveals nothing sensitive.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ requestedAt: getTvRefreshRequestedAt() });
}
