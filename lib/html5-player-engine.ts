"use client";

import type Hls from "hls.js";
import type { PlayerEngine, PlayerHandle } from "@/lib/player-engine";

interface StreamResponse {
  urls?: string[];
}

export const html5PlayerEngine: PlayerEngine = {
  mount(container, source, callbacks, options): PlayerHandle {
    if (source.source !== "stremio") {
      throw new Error("html5PlayerEngine given a non-stremio source");
    }

    let video: HTMLVideoElement | null = null;
    let hls: Hls | null = null;
    let cancelled = false;
    let urls: string[] = [];
    let index = 0;
    // Budget for *automatic* fallback on a hard playback error, separate
    // from manual switchSource() below — this only tries each remaining
    // candidate once before giving up, so a genuinely dead title doesn't
    // spin through the whole list forever. A manual click always advances
    // regardless of this budget: the viewer asking for something different
    // resets it, since the earlier failure (if any) may have been transient.
    let autoAdvancesLeft = 0;

    function ensureVideoElement() {
      if (video) return video;
      const el = document.createElement("video");
      el.autoplay = true;
      el.playsInline = true;
      el.controls = !!options?.nativeControls;
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.objectFit = "contain";
      container.appendChild(el);
      el.addEventListener("playing", () => callbacks.onStateChange("playing"));
      el.addEventListener("waiting", () => callbacks.onStateChange("buffering"));
      el.addEventListener("pause", () => callbacks.onStateChange("paused"));
      el.addEventListener("ended", () => {
        callbacks.onStateChange("ended");
        callbacks.onEnded();
      });
      // A url that passed the compatibility filter can still fail to
      // actually decode — this is the runtime counterpart to that filter.
      el.addEventListener("error", () => handleFatalError());
      video = el;
      return el;
    }

    function handleFatalError() {
      if (cancelled) return;
      if (autoAdvancesLeft > 0 && index + 1 < urls.length) {
        autoAdvancesLeft--;
        playAt(index + 1, video?.currentTime || undefined);
      } else {
        callbacks.onError();
      }
    }

    function playAt(i: number, resumeAt?: number) {
      const url = urls[i];
      if (!url) return;
      index = i;
      hls?.destroy();
      hls = null;

      const el = ensureVideoElement();
      el.removeAttribute("src");
      el.load();
      if (resumeAt) {
        el.addEventListener(
          "loadedmetadata",
          () => {
            el.currentTime = resumeAt;
          },
          { once: true }
        );
      }

      if (url.includes(".m3u8")) {
        import("hls.js").then(({ default: HlsCtor }) => {
          if (cancelled || video !== el || index !== i) return;
          if (HlsCtor.isSupported()) {
            hls = new HlsCtor();
            hls.loadSource(url);
            hls.attachMedia(el);
            hls.on(HlsCtor.Events.ERROR, (_event, data) => {
              if (data.fatal) handleFatalError();
            });
          } else if (el.canPlayType("application/vnd.apple.mpegurl")) {
            el.src = url; // Safari's native HLS support
          } else {
            handleFatalError();
          }
        });
      } else {
        el.src = url;
      }
      el.play().catch(() => {});
    }

    // Distinct from the failure state — AIOStreams/debrid resolution for an
    // uncached torrent can take several seconds to tens of seconds, and a
    // silent black screen for that long looks broken even when it isn't.
    callbacks.onStateChange("resolving");

    const params = new URLSearchParams({ imdbId: source.imdbId, mediaType: source.mediaType });
    if (source.season != null) params.set("season", String(source.season));
    if (source.episode != null) params.set("episode", String(source.episode));

    fetch(`/api/stremio/stream?${params.toString()}`)
      .then((res) => res.json())
      .then((data: StreamResponse) => {
        if (cancelled) return;
        urls = data.urls ?? [];
        if (urls.length === 0) {
          callbacks.onError();
          return;
        }
        autoAdvancesLeft = urls.length - 1;
        playAt(0);
      })
      .catch(() => {
        if (!cancelled) callbacks.onError();
      });

    return {
      playVideo: () => video?.play(),
      pauseVideo: () => video?.pause(),
      seekTo: (seconds) => {
        if (video) video.currentTime = seconds;
      },
      getPlayerState: () => {
        if (!video) return "resolving";
        if (video.ended) return "ended";
        if (video.paused) return "paused";
        return video.readyState < 3 ? "buffering" : "playing";
      },
      getCurrentTime: () => video?.currentTime ?? 0,
      getDuration: () => (video && Number.isFinite(video.duration) ? video.duration : 0),
      getSourceInfo: () => (urls.length > 0 ? { index, count: urls.length } : null),
      switchSource: () => {
        if (urls.length < 2) return;
        autoAdvancesLeft = urls.length - 1; // a fresh manual ask, not counted against the auto-retry budget
        playAt((index + 1) % urls.length, video?.currentTime || undefined);
      },
      destroy: () => {
        cancelled = true;
        hls?.destroy();
        video?.remove();
        video = null;
      },
    };
  },
};
