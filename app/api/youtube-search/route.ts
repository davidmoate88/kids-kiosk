import { NextRequest, NextResponse } from "next/server";

// Proxied server-side so the YouTube API key never reaches the browser —
// the kids' tablet in particular has no business seeing it. Returns
// { videoId: null } whenever no key is configured or nothing is found,
// so the Places page degrades gracefully without it.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ videoId: null });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&safeSearch=strict&q=${encodeURIComponent(q)}&key=${apiKey}`;
    const apiRes = await fetch(url);
    if (!apiRes.ok) return NextResponse.json({ videoId: null });

    const json = await apiRes.json();
    const item = json.items?.[0];
    if (!item) return NextResponse.json({ videoId: null });

    return NextResponse.json({ videoId: item.id.videoId, title: item.snippet.title });
  } catch {
    return NextResponse.json({ videoId: null });
  }
}
