"use client";

import type Hls from "hls.js";
import type { PlayerEngine, PlayerHandle } from "@/lib/player-engine";

interface StreamResponse {
  url?: string;
}

export const html5PlayerEngine: PlayerEngine = {
  mount(container, source, callbacks, options): PlayerHandle {
    if (source.source !== "stremio") {
      throw new Error("html5PlayerEngine given a non-stremio source");
    }

    let video: HTMLVideoElement | null = null;
    let hls: Hls | null = null;
    let cancelled = false;

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
        if (!data.url) {
          callbacks.onError();
          return;
        }

        const el = document.createElement("video");
        el.autoplay = true;
        el.playsInline = true;
        el.controls = !!options?.nativeControls;
        el.style.width = "100%";
        el.style.height = "100%";
        el.style.objectFit = "contain";
        container.appendChild(el);
        video = el;

        el.addEventListener("playing", () => callbacks.onStateChange("playing"));
        el.addEventListener("waiting", () => callbacks.onStateChange("buffering"));
        el.addEventListener("pause", () => callbacks.onStateChange("paused"));
        el.addEventListener("ended", () => {
          callbacks.onStateChange("ended");
          callbacks.onEnded();
        });
        // A url that passed the compatibility filter can still fail to
        // actually decode — this is the runtime counterpart to that filter.
        el.addEventListener("error", () => callbacks.onError());

        const url = data.url;
        if (url.includes(".m3u8")) {
          import("hls.js").then(({ default: HlsCtor }) => {
            if (cancelled || !video) return;
            if (HlsCtor.isSupported()) {
              hls = new HlsCtor();
              hls.loadSource(url);
              hls.attachMedia(video);
              hls.on(HlsCtor.Events.ERROR, (_event, data) => {
                if (data.fatal) callbacks.onError();
              });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
              video.src = url; // Safari's native HLS support
            } else {
              callbacks.onError();
            }
          });
        } else {
          el.src = url;
        }
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
      destroy: () => {
        cancelled = true;
        hls?.destroy();
        video?.remove();
        video = null;
      },
    };
  },
};
