"use server";

import { auth } from "@/auth";
import { markTvRefreshRequested } from "@/lib/refresh-signal";

export type RefreshTvState = { success?: boolean } | undefined;

// Lets a parent push a refresh to the TV kiosk immediately after approving
// something, instead of waiting on TvApp's own ~30-minute freshness timer
// (see components/TvApp.tsx). Same session check every other action in this
// dashboard does, even though the button itself only ever renders inside
// the already-auth-gated /parents layout.
export async function requestTvRefresh(): Promise<RefreshTvState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }
  markTvRefreshRequested();
  return { success: true };
}
