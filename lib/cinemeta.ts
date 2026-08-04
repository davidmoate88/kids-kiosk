import "server-only";

// Stremio's own official, public, no-auth metadata addon — used only for
// series episode lists (season/episode numbers), which neither of David's own
// addons (stremio-platform-catalogs, AIOStreams) expose. No batch endpoint, so
// callers that need many of these should go through mapWithConcurrencyLimit
// below rather than firing everything at once.
const CINEMETA_BASE = "https://v3-cinemeta.strem.io";

interface Entry<T> {
  value: T;
  expires: number;
}

// Tiny in-memory TTL cache — same shape as stremio-platform-catalogs' own
// src/cache.ts. Good enough for this single-instance app.
class TTLCache<T> {
  private store = new Map<string, Entry<T>>();
  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expires) {
      this.store.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  async wrap(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await fn();
    this.set(key, value);
    return value;
  }
}

export type CinemetaVideo = {
  season: number;
  episode: number;
  name: string;
  thumbnail?: string;
  released?: string;
};

export type CinemetaSeriesMeta = {
  imdbId: string;
  name: string;
  poster?: string;
  /** True when Cinemeta reports no upcoming episode — safe to sync less often. */
  ended: boolean;
  videos: CinemetaVideo[];
};

const metaCache = new TTLCache<CinemetaSeriesMeta | null>(6 * 60 * 60 * 1000);

export async function getSeriesMeta(imdbId: string): Promise<CinemetaSeriesMeta | null> {
  return metaCache.wrap(imdbId, async () => {
    const res = await fetch(`${CINEMETA_BASE}/meta/series/${imdbId}.json`);
    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.meta;
    if (!meta) return null;

    const videos: CinemetaVideo[] = (meta.videos ?? [])
      .filter((v: { season?: number; episode?: number }) => v.season != null && v.episode != null && v.season > 0)
      .map((v: { season: number; episode: number; name?: string; title?: string; thumbnail?: string; released?: string }) => ({
        season: v.season,
        episode: v.episode,
        name: v.name || v.title || `Episode ${v.episode}`,
        thumbnail: v.thumbnail,
        released: v.released,
      }));

    return {
      imdbId,
      name: meta.name ?? "Untitled",
      poster: meta.poster,
      ended: meta.status === "Ended" || meta.status === "Canceled",
      videos,
    };
  });
}

/**
 * Runs `fn` over `items` with at most `limit` in flight at once — Cinemeta has
 * no batch endpoint, and refreshing dozens of series' episode lists serially
 * would be slow while firing them all at once would hammer a free public
 * service (and this app's own small container).
 */
export async function mapWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
