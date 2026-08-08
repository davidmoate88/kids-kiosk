import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stremioTitles } from "@/db/schema";

// The only place AIOStreams' real URL is ever used — server-side, never sent
// to the browser. Only ever called with an imdbId a parent has already
// explicitly approved (see lib/stremio-catalog-client.ts's comment): this
// route must never be reachable from anything resembling AIOStreams
// catalog/search/discovery, since this specific instance has content
// categories (confirmed directly: "Hentai" is one of its declared types)
// that have no business anywhere near a kids' app.
//
// Since the app is now publicly reachable via Cloudflare Tunnel (and this
// route is excluded from the proxy.ts matcher, like every /api route), the
// approval check below is what keeps a random LAN/Internet caller from
// using this as an open stream-resolver for any title — rows are only ever
// created by a parent approving content (see parentStremio actions),
// so requiring the imdbId to exist in stremioTitles is a genuine gate, not
// a formality.
const COMPAT_BAD_MARKERS = ["hevc", "x265", "truehd", "atmos", "dovi", "dv.", "hdr", "10bit", "10-bit"];

interface AioStream {
  url?: string;
  infoHash?: string;
  behaviorHints?: { filename?: string };
}

/**
 * AIOStreams ranks results by quality, not browser compatibility — very
 * different objectives. Confirmed directly against a real title (Toy Story):
 * of 24 ranked results, all but one were MKV containers with HEVC/TrueHD/
 * Atmos/Dolby Vision, none of which a plain HTML5 <video> plays reliably.
 * This filter looks for a plausible plain H.264/AAC MP4 release instead of
 * trusting AIOStreams' own #1 pick.
 */
function isLikelyBrowserCompatible(filename: string): boolean {
  const lower = filename.toLowerCase();
  if (!lower.endsWith(".mp4")) return false;
  return !COMPAT_BAD_MARKERS.some((marker) => lower.includes(marker));
}

export async function GET(request: NextRequest) {
  const imdbId = request.nextUrl.searchParams.get("imdbId");
  const mediaType = request.nextUrl.searchParams.get("mediaType");
  const season = request.nextUrl.searchParams.get("season");
  const episode = request.nextUrl.searchParams.get("episode");

  if (!imdbId || (mediaType !== "movie" && mediaType !== "series")) {
    return NextResponse.json({ error: "imdbId and a valid mediaType are required" }, { status: 400 });
  }

const aioStreamsUrl = process.env.AIOSTREAMS_URL;
  if (!aioStreamsUrl) {
    return NextResponse.json({ url: null });
  }

  // Approval gate before touching AIOStreams (see the comment at the top of
  // this file for why this matters now the route is publicly reachable).
  // A movie is a stremioTitles row with mediaType 'movie'; a series episode
  // resolves off the same row + season/episode params.
  try {
    const [approved] = await getDb()
      .select({ id: stremioTitles.id })
      .from(stremioTitles)
      .where(
        and(
          eq(stremioTitles.imdbId, imdbId),
          eq(stremioTitles.mediaType, mediaType as "movie" | "series")
        )
      )
      .limit(1);
    if (!approved) {
      return NextResponse.json({ url: null });
    }
  } catch {
    // DB unavailable — err on the side of refusing to resolve rather than
    // silently opening the resolver.
    return NextResponse.json({ url: null });
  }

  // The standard Stremio stream-resource protocol: a series episode's id is
  // "tt...:season:episode"; a movie is just its bare imdb id. Confirmed
  // directly against AIOStreams' manifest — this isn't AIOStreams-specific.
  const streamId = mediaType === "series" && season && episode ? `${imdbId}:${season}:${episode}` : imdbId;

  try {
    const res = await fetch(`${aioStreamsUrl}/stream/${mediaType}/${streamId}.json`);
    if (!res.ok) return NextResponse.json({ url: null });

    const data = (await res.json()) as { streams?: AioStream[] };
    const streams = data.streams ?? [];

    const compatible = streams.find(
      (s) => s.url && s.behaviorHints?.filename && isLikelyBrowserCompatible(s.behaviorHints.filename)
    );
    const chosen = compatible ?? streams.find((s) => s.url);

    return NextResponse.json({ url: chosen?.url ?? null });
  } catch {
    return NextResponse.json({ url: null });
  }
}
