"use client";

import { useState } from "react";
import { PageHeading, BigButton } from "@/components/Tile";
import type { ApprovedVideo } from "@/lib/approved-videos";

export type VideoCategory = {
  id: string;
  label: string;
  emoji: string;
  videos: ApprovedVideo[];
};

export default function WatchClient({ categories }: { categories: VideoCategory[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [selected, setSelected] = useState<ApprovedVideo | null>(null);

  const category = categories.find((c) => c.id === categoryId);

  if (categories.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4 text-center">
        <PageHeading emoji="📺" title="Watch" />
        <p className="text-foreground/50 text-lg">No videos yet!</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 max-w-3xl mx-auto">
        <p className="text-2xl font-extrabold text-center">{selected.title}</p>
        <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-xl bg-black">
          <iframe
            key={selected.videoId}
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=1&playsinline=1&loop=1&playlist=${selected.videoId}`}
            title={selected.title}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {/*
            YouTube's embed always overlays two clickable links that open
            youtube.com — the video/channel title strip at the top, and the
            "Watch on YouTube" badge (and logo watermark once playing) in
            the bottom-right. These invisible shields sit above the iframe
            and swallow taps in just those two spots so nothing on this
            screen can navigate the kids away from the app; the rest of
            the video (including the play button and controls) stays usable.
          */}
          <div className="absolute top-0 inset-x-0 h-[18%]" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-[45%] h-[18%]" aria-hidden="true" />
        </div>
        <BigButton onClick={() => setSelected(null)} color="var(--watch)" colorDark="var(--watch-dark)">
          Back to Videos
        </BigButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 max-w-4xl mx-auto">
      <PageHeading emoji="📺" title="Watch" subtitle="Tap a video to play it!" />

      {categories.length > 1 && (
        <div className="flex gap-3 flex-wrap justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`tap-pop px-5 py-3 rounded-2xl font-bold shadow flex items-center gap-2 ${
                cat.id === categoryId ? "text-white" : "bg-white text-foreground/70"
              }`}
              style={cat.id === categoryId ? { background: "var(--watch)" } : undefined}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full pb-10">
        {category?.videos.map((video) => (
          <button
            key={video.id}
            onClick={() => setSelected(video)}
            className="tap-pop flex flex-col items-center gap-2 rounded-3xl p-3 shadow-lg bg-white"
          >
            <span className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/10">
              <img
                src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl drop-shadow">▶️</span>
            </span>
            <span className="text-sm font-bold text-center leading-tight">{video.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
