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

export type VideoFolder = {
  id: string;
  label: string;
  emoji: string;
  categories: VideoCategory[];
};

function enterFullscreen() {
  document.documentElement.requestFullscreen?.().catch(() => {
    // fullscreen isn't available/permitted here — playback still works, just windowed
  });
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
}

export default function WatchClient({ folders, tvMode = false }: { folders: VideoFolder[]; tvMode?: boolean }) {
  const [folderId, setFolderId] = useState(folders.length === 1 ? folders[0].id : "");
  const [categoryId, setCategoryId] = useState("");
  const [selected, setSelected] = useState<ApprovedVideo | null>(null);

  const folder = folders.find((f) => f.id === folderId);
  const categories = folder?.categories ?? [];
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];

  if (folders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4 text-center">
        <PageHeading emoji="📺" title="Watch" />
        <p className="text-foreground/50 text-lg">No videos yet!</p>
      </div>
    );
  }

  function pickFolder(id: string) {
    setFolderId(id);
    setCategoryId("");
  }

  function playVideo(video: ApprovedVideo) {
    if (tvMode) enterFullscreen();
    setSelected(video);
  }

  function backToVideos() {
    if (tvMode) exitFullscreen();
    setSelected(null);
  }

  if (selected) {
    const shields = (
      <>
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
      </>
    );

    const iframe = (
      <iframe
        key={selected.videoId}
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=1&playsinline=1&loop=1&playlist=${selected.videoId}`}
        title={selected.title}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );

    if (tvMode) {
      return (
        <div className="fixed inset-0 w-screen h-screen bg-black">
          {iframe}
          {shields}
          <button
            onClick={backToVideos}
            className="tap-pop absolute top-4 right-4 rounded-2xl px-5 py-3 font-bold text-white bg-black/50 backdrop-blur"
          >
            ⬅️ Back
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 max-w-3xl mx-auto">
        <p className="text-2xl font-extrabold text-center">{selected.title}</p>
        <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-xl bg-black">
          {iframe}
          {shields}
        </div>
        <BigButton onClick={backToVideos} color="var(--watch)" colorDark="var(--watch-dark)">
          Back to Videos
        </BigButton>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-10 max-w-4xl mx-auto">
        <PageHeading emoji="📺" title="Watch" subtitle="Pick a folder!" />
        <div className="grid grid-cols-2 gap-8 w-full">
          {folders.map((f) => {
            const coverVideoId = f.categories[0]?.videos[0]?.videoId;
            return (
              <button
                key={f.id}
                onClick={() => pickFolder(f.id)}
                className="tap-pop relative flex items-end justify-center aspect-square rounded-[2.5rem] text-white shadow-lg overflow-hidden"
                style={{ background: "linear-gradient(160deg, var(--watch), var(--watch-dark))" }}
              >
                {coverVideoId && (
                  <img
                    src={`https://i.ytimg.com/vi/${coverVideoId}/hqdefault.jpg`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="relative flex items-center gap-2 px-5 pb-6 text-2xl md:text-3xl font-extrabold text-center leading-tight drop-shadow">
                  <span className="text-3xl md:text-4xl">{f.emoji}</span>
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 max-w-4xl mx-auto">
      <PageHeading emoji={folder.emoji} title={folder.label} subtitle="Tap a video to play it!" />

      <div className="flex gap-3 flex-wrap justify-center">
        {folders.length > 1 && (
          <button
            onClick={() => setFolderId("")}
            className="tap-pop px-5 py-3 rounded-2xl font-bold shadow bg-white text-foreground/70"
          >
            📁 Folders
          </button>
        )}
        {categories.length > 1 &&
          categories.map((cat) => {
            const coverVideoId = cat.videos[0]?.videoId;
            const isActive = cat.id === category?.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`tap-pop pl-2 pr-5 py-2 rounded-full font-bold shadow flex items-center gap-3 ${
                  isActive ? "text-white" : "bg-white text-foreground/70"
                }`}
                style={isActive ? { background: "var(--watch)" } : undefined}
              >
                <span className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-black/10 flex items-center justify-center text-lg">
                  {coverVideoId ? (
                    <img
                      src={`https://i.ytimg.com/vi/${coverVideoId}/mqdefault.jpg`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    cat.emoji
                  )}
                </span>
                {cat.label}
              </button>
            );
          })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full pb-10">
        {category?.videos.map((video) => (
          <button
            key={video.id}
            onClick={() => playVideo(video)}
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
