import "server-only";

// In-memory only, deliberately not persisted to the database — this just
// needs to survive across requests within the running server process, not
// across a restart (a deploy already restarts the process, which is a
// bigger freshness event than this flag tracks anyway). Lets TvApp.tsx
// notice a parent's "Refresh TV" click via a lightweight poll (see
// app/api/tv/refresh-signal/route.ts) without needing any push
// infrastructure (WebSocket/SSE) for what's normally a single kiosk device.
//
// Stored on globalThis rather than a plain module-scope variable: a Server
// Action and a Route Handler aren't guaranteed to share one evaluation of
// this module (confirmed in dev — Next.js can compile them into separate
// bundles that each re-run this file's top-level code, so a plain `let`
// silently gives each its own copy and writes from one never appear in the
// other). globalThis is the one object that's genuinely shared regardless —
// same rationale as the standard Prisma-client-singleton pattern in Next.js.
const store = globalThis as unknown as { __kkTvRefreshRequestedAt?: number | null };

export function markTvRefreshRequested() {
  store.__kkTvRefreshRequestedAt = Date.now();
}

export function getTvRefreshRequestedAt(): number | null {
  return store.__kkTvRefreshRequestedAt ?? null;
}
