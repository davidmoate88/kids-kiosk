// Shared YouTube IFrame API loader. Extracted so every player on the site
// (the /watch and /tv players, plus the TV home screen's dwell preview)
// shares one script tag and one onYouTubeIframeAPIReady callback chain —
// two independent loaders would race to overwrite that global.
"use client";

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type YTPlayer = {
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

export const YT_STATE_ENDED = 0;
export const YT_STATE_PLAYING = 1;
export const YT_STATE_PAUSED = 2;
export const YT_STATE_BUFFERING = 3;
export const YT_STATE_CUED = 5;

let ytApiPromise: Promise<void> | null = null;

export function loadYouTubeApi(): Promise<void> {
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
