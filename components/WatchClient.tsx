"use client";

import { useEffect, useRef, useState } from "react";
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
  coverVideoId?: string;
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

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
};

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

export default function WatchClient({ folders, tvMode = false }: { folders: VideoFolder[]; tvMode?: boolean }) {
  const initialFolderId = folders.length === 1 ? folders[0].id : "";
  const [folderId, setFolderId] = useState(initialFolderId);
  const [categoryId, setCategoryId] = useState("");
  const [selected, setSelected] = useState<ApprovedVideo | null>(null);

  const folder = folders.find((f) => f.id === folderId);
  const categories = folder?.categories ?? [];
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const selectedRef = useRef(selected);
  const folderIdRef = useRef(folderId);
  const categoryVideosRef = useRef<ApprovedVideo[]>([]);
  const markerArmedRef = useRef(false);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    folderIdRef.current = folderId;
  }, [folderId]);

  useEffect(() => {
    categoryVideosRef.current = category?.videos ?? [];
  }, [category]);

  // Folder/video selection is otherwise just local state with no browser
  // history at all, so the TV remote's back button (which drives the
  // WebView's canGoBack/goBack, not our own code) has nothing to step
  // through and exits the app immediately. We push a single re-armable
  // "marker" history entry whenever we go below the top level; popstate
  // pops exactly one in-app layer using the CURRENT state (refs, not
  // whatever happens to be stored on the entry — Next.js's own router
  // also touches history, so entry-stored state isn't reliable), then
  // re-arms the marker if another layer remains, and only lets a further
  // back press actually exit once we're back at the top.
  function ensureMarker() {
    if (markerArmedRef.current) return;
    history.pushState({ marker: true }, "");
    markerArmedRef.current = true;
  }

  // The YouTube IFrame API replaces the target div's contents directly
  // (outside React's knowledge), so it must be torn down synchronously
  // before the state change that unmounts that div — otherwise React's
  // own reconciliation tries to remove DOM nodes that no longer match
  // what it expects and throws (NotFoundError: removeChild).
  function teardownPlayer() {
    playerRef.current?.destroy();
    playerRef.current = null;
    if (playerContainerRef.current) playerContainerRef.current.innerHTML = "";
  }

  useEffect(() => {
    function onPopState() {
      markerArmedRef.current = false;
      if (selectedRef.current) {
        if (tvMode) exitFullscreen();
        teardownPlayer();
        setSelected(null);
        if (folders.length > 1) ensureMarker();
        return;
      }
      if (folderIdRef.current && folders.length > 1) {
        setFolderId("");
        setCategoryId("");
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function advanceToNext() {
    const videos = categoryVideosRef.current;
    const current = selectedRef.current;
    if (videos.length === 0 || !current) return;
    const idx = videos.findIndex((v) => v.videoId === current.videoId);
    setSelected(videos[idx === -1 ? 0 : (idx + 1) % videos.length]);
  }

  useEffect(() => {
    if (!selected || !playerContainerRef.current) return;

    if (playerRef.current) {
      playerRef.current.loadVideoById(selected.videoId);
      return;
    }

    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !playerContainerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: selected.videoId,
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 1,
          playsinline: 1,
          autoplay: 1,
        },
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === 0) advanceToNext();
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [selected?.videoId]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  if (folders.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 gap-4 text-center">
        <PageHeading emoji="📺" title="Watch" />
        <p className="text-foreground/50 text-lg">No videos yet!</p>
      </div>
    );
  }

  function pickFolder(id: string) {
    ensureMarker();
    setFolderId(id);
    setCategoryId("");
  }

  function playVideo(video: ApprovedVideo) {
    if (tvMode) enterFullscreen();
    ensureMarker();
    setSelected(video);
  }

  function backToVideos() {
    history.back();
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

    const player = <div ref={playerContainerRef} className="absolute inset-0 w-full h-full" />;

    if (tvMode) {
      return (
        <div className="fixed inset-0 w-screen h-screen bg-black">
          {player}
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
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 gap-6 landscape:gap-3 max-w-3xl landscape:max-w-4xl mx-auto">
        <p className="text-2xl landscape:text-lg font-extrabold text-center">{selected.title}</p>
        <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-xl bg-black">
          {player}
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
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-6 landscape:py-4 gap-10 landscape:gap-4 max-w-4xl landscape:max-w-6xl mx-auto">
        <PageHeading emoji="📺" title="Watch" subtitle="Pick a folder!" />
        <div className="grid grid-cols-2 landscape:grid-cols-3 gap-8 landscape:gap-4 w-full">
          {folders.map((f) => {
            const coverVideoId = f.coverVideoId ?? f.categories[0]?.videos[0]?.videoId;
            return (
              <button
                key={f.id}
                onClick={() => pickFolder(f.id)}
                className="tap-pop relative flex items-end justify-center aspect-square landscape:aspect-video rounded-[2.5rem] text-white shadow-lg overflow-hidden"
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
                <span className="relative flex items-center gap-2 px-5 pb-6 landscape:pb-4 text-2xl md:text-3xl landscape:text-xl font-extrabold text-center leading-tight drop-shadow">
                  <span className="text-3xl md:text-4xl landscape:text-2xl">{f.emoji}</span>
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
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-6 landscape:py-4 gap-6 landscape:gap-3 max-w-4xl landscape:max-w-6xl mx-auto">
      <PageHeading emoji={folder.emoji} title={folder.label} subtitle="Tap a video to play it!" />

      <div className="flex gap-3 flex-wrap justify-center">
        {folders.length > 1 && (
          <button
            onClick={() => history.back()}
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

      <div className="grid grid-cols-2 sm:grid-cols-3 landscape:grid-cols-4 gap-5 landscape:gap-3 w-full pb-10 landscape:pb-4">
        {category?.videos.map((video) => (
          <button
            key={video.id}
            onClick={() => playVideo(video)}
            className="tap-pop flex flex-col items-center gap-2 landscape:gap-1 rounded-3xl p-3 landscape:p-2 shadow-lg bg-white"
          >
            <span className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/10">
              <img
                src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center text-4xl landscape:text-3xl drop-shadow">▶️</span>
            </span>
            <span className="text-sm font-bold text-center leading-tight">{video.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
