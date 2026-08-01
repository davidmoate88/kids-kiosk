export type WikiSummary = { extract: string | null; photo: string | null };

/**
 * Best-effort lookup of a short description + photo for a place, straight
 * from Wikipedia's public, key-free, CORS-enabled endpoints. Returns null on
 * any failure (unmatched place name, offline, etc.).
 *
 * Prefers a coordinate-anchored geosearch when lat/lon are given — this
 * avoids landing on the wrong article (or a disambiguation page) for common
 * place names that exist in several countries, e.g. "Scarborough".
 */
export async function fetchWikipediaSummary(
  name: string,
  lat?: number,
  lon?: number
): Promise<WikiSummary | null> {
  try {
    let title: string | undefined;

    if (lat !== undefined && lon !== undefined) {
      const geoUrl = `https://en.wikipedia.org/w/api.php?origin=*&action=query&list=geosearch&gscoord=${lat}%7C${lon}&gsradius=10000&gslimit=1&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      title = geoData?.query?.geosearch?.[0]?.title;
    }

    if (!title) {
      const searchUrl = `https://en.wikipedia.org/w/api.php?origin=*&action=query&list=search&format=json&srlimit=1&srsearch=${encodeURIComponent(name)}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      title = searchData?.query?.search?.[0]?.title;
    }

    if (!title) return null;

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) return null;
    const summary = await summaryRes.json();
    if (summary.type === "disambiguation") return null;
    return {
      extract: summary.extract ?? null,
      photo: summary.thumbnail?.source ?? null,
    };
  } catch {
    return null;
  }
}

/** Looks up a relevant YouTube video via our own server (which holds the API key). */
export async function fetchYoutubeVideoId(name: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(`${name} travel guide`)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.videoId ?? null;
  } catch {
    return null;
  }
}

export function shortenExtract(text: string, maxLength = 220): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}
