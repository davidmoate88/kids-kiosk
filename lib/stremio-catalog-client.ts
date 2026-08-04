import "server-only";

// Talks only to David's own stremio-platform-catalogs addon (its base URL,
// e.g. http://192.168.1.72:7010) — never AIOStreams, which is stream
// resolution only (see lib/stremio-stream.ts) and has content categories
// (including adult ones) that must never drive discovery/browsing.
function catalogBaseUrl(): string {
  const url = process.env.STREMIO_CATALOG_URL;
  if (!url) {
    throw new Error(
      "STREMIO_CATALOG_URL is not set. Point it at stremio-platform-catalogs' base URL."
    );
  }
  return url;
}

export type StremioMediaType = "movie" | "series";

export type CatalogRow = {
  id: string;
  type: StremioMediaType;
  name: string;
};

export type CatalogItem = {
  imdbId: string;
  mediaType: StremioMediaType;
  name: string;
  posterUrl?: string;
};

export type SearchResultItem = {
  imdbId: string;
  mediaType: StremioMediaType;
  name: string;
  posterUrl?: string;
  year?: string;
};

interface ManifestCatalog {
  id: string;
  type: string;
  name: string;
}

/**
 * The addon's browseable rows, straight from its manifest — fetched live
 * rather than hardcoded so a platform David adds/removes in that project is
 * reflected here automatically. Excludes the "Suggested for you" rows, which
 * are seeded from David's own personal taste list and not a meaningful
 * browse target for the kids dashboard.
 */
export async function getCatalogRows(): Promise<CatalogRow[]> {
  const res = await fetch(`${catalogBaseUrl()}/manifest.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`stremio-platform-catalogs manifest fetch failed: ${res.status}`);
  const manifest = await res.json();
  const catalogs = (manifest.catalogs ?? []) as ManifestCatalog[];
  return catalogs
    .filter((c) => (c.type === "movie" || c.type === "series") && !c.id.includes("-suggested-"))
    .map((c) => ({ id: c.id, type: c.type as StremioMediaType, name: c.name }));
}

export async function browseCatalogRow(
  catalogId: string,
  type: StremioMediaType,
  opts: { genre?: string; skip?: number } = {}
): Promise<CatalogItem[]> {
  const params = new URLSearchParams();
  if (opts.genre) params.set("genre", opts.genre);
  if (opts.skip) params.set("skip", String(opts.skip));
  const qs = params.toString();

  const res = await fetch(
    `${catalogBaseUrl()}/catalog/${type}/${catalogId}.json${qs ? `?${qs}` : ""}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Catalog fetch failed for ${catalogId}: ${res.status}`);
  const data = await res.json();
  const metas = (data.metas ?? []) as { id: string; name: string; poster?: string }[];
  return metas.map((m) => ({ imdbId: m.id, mediaType: type, name: m.name, posterUrl: m.poster }));
}

interface SearchResponseItem {
  imdbId?: string;
  type: StremioMediaType;
  title: string;
  poster?: string;
  year?: string;
}

export async function searchCatalog(type: StremioMediaType, query: string): Promise<SearchResultItem[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${catalogBaseUrl()}/taste/search?type=${type}&q=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const results = (await res.json()) as SearchResponseItem[];
  return results
    .filter((r): r is SearchResponseItem & { imdbId: string } => Boolean(r.imdbId))
    .map((r) => ({ imdbId: r.imdbId, mediaType: r.type, name: r.title, posterUrl: r.poster, year: r.year }));
}
