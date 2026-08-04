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

// The fixed UK/BBFC scale stremio-platform-catalogs filters against — kept
// here too (not just trusted blindly from the /taste/filters response) so a
// value can be validated before being sent back as a query param.
export const STREMIO_AGE_RATINGS = ["U", "PG", "12", "15", "18"] as const;
export type StremioAgeRating = (typeof STREMIO_AGE_RATINGS)[number];

export type FilterOptions = {
  genres: string[];
  ageRatings: readonly string[];
};

export type SearchOrBrowseFilters = {
  genre?: string;
  /** Only titles at or under this rating; titles with no GB rating on file
   *  are excluded when set (see stremio-platform-catalogs' tmdb.ts). */
  maxRating?: StremioAgeRating;
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
  opts: SearchOrBrowseFilters & { skip?: number } = {}
): Promise<CatalogItem[]> {
  const params = new URLSearchParams();
  if (opts.genre) params.set("genre", opts.genre);
  if (opts.maxRating) params.set("maxRating", opts.maxRating);
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

export async function searchCatalog(
  type: StremioMediaType,
  query: string,
  filters: SearchOrBrowseFilters = {}
): Promise<SearchResultItem[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ type, q: query });
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.maxRating) params.set("maxRating", filters.maxRating);

  const res = await fetch(`${catalogBaseUrl()}/taste/search?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const results = (await res.json()) as SearchResponseItem[];
  return results
    .filter((r): r is SearchResponseItem & { imdbId: string } => Boolean(r.imdbId))
    .map((r) => ({ imdbId: r.imdbId, mediaType: r.type, name: r.title, posterUrl: r.poster, year: r.year }));
}

/** Genre + age-rating options for the search/browse filter dropdowns —
 * genres are type-specific (movie vs series have different TMDB genre
 * lists), age ratings are the fixed scale regardless of type. */
export async function getFilterOptions(type: StremioMediaType): Promise<FilterOptions> {
  const res = await fetch(`${catalogBaseUrl()}/taste/filters?type=${type}`, {
    next: { revalidate: 24 * 60 * 60 },
  });
  if (!res.ok) throw new Error(`Filter options fetch failed: ${res.status}`);
  return (await res.json()) as FilterOptions;
}
