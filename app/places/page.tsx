"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PageHeading } from "@/components/Tile";
import { PLACES, type Place } from "@/lib/places";
import { fetchWikipediaSummary, fetchYoutubeVideoId, shortenExtract } from "@/lib/wikipedia";
import { useProfile } from "@/components/ProfileContext";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

const PlacesMap = dynamic(() => import("@/components/PlacesMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-[2rem] bg-white/60 flex items-center justify-center text-foreground/40 font-bold">
      Loading map…
    </div>
  ),
});

type DetailState = {
  place: Place;
  loading: boolean;
  photo: string | null;
  extract: string | null;
  videoId: string | null;
};

export default function PlacesPage() {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);
  const [detail, setDetail] = useState<DetailState | null>(null);

  async function openPlace(place: Place) {
    setDetail({ place, loading: true, photo: null, extract: null, videoId: null });
    award("world-explorer");

    const [summary, videoId] = await Promise.all([
      fetchWikipediaSummary(place.name, place.lat, place.lon),
      fetchYoutubeVideoId(place.name),
    ]);

    setDetail({
      place,
      loading: false,
      photo: summary?.photo ?? null,
      extract: summary?.extract ? shortenExtract(summary.extract) : null,
      videoId,
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 gap-4 max-w-2xl mx-auto">
      <StickerToast sticker={justEarned} />
      <PageHeading emoji="🗺️" title="Places We've Been" subtitle="Tap a pin to see where!" />

      <div className="relative isolate w-full max-w-lg" style={{ height: "58vh" }}>
        <PlacesMap places={PLACES} onSelect={openPlace} />
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="relative w-full max-w-md max-h-[80vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl p-6 flex flex-col gap-3">
            <button
              onClick={() => setDetail(null)}
              className="tap-pop absolute top-4 right-4 w-10 h-10 rounded-full bg-black/5 text-xl flex items-center justify-center"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-2xl font-extrabold pr-10">{detail.place.name}</h2>
            {detail.place.date && (
              <p className="text-sm font-bold text-foreground/50">{detail.place.date}</p>
            )}

            {detail.loading ? (
              <p className="text-foreground/50 font-bold py-6 text-center">Looking things up…</p>
            ) : (
              <>
                {detail.photo && (
                  // eslint-disable-next-line @next/next/no-img-element -- Wikipedia thumbnail domains are arbitrary/unpredictable, unsuited to next/image's remotePatterns allowlist
                  <img
                    src={detail.photo}
                    alt={detail.place.name}
                    className="w-full rounded-2xl object-cover max-h-56"
                  />
                )}
                {detail.extract && <p className="text-foreground/80">{detail.extract}</p>}
                {detail.videoId && (
                  <>
                    <p className="text-xs font-extrabold text-foreground/40 uppercase tracking-wide">
                      Watch
                    </p>
                    <iframe
                      className="w-full aspect-video rounded-2xl"
                      src={`https://www.youtube-nocookie.com/embed/${detail.videoId}`}
                      allow="encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </>
                )}
                {!detail.photo && !detail.extract && !detail.videoId && (
                  <p className="text-foreground/50 text-center py-4">
                    Nothing to show for this place yet!
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
