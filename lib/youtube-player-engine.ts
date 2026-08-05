"use client";

import {
  loadYouTubeApi,
  YT_STATE_BUFFERING,
  YT_STATE_CUED,
  YT_STATE_ENDED,
  YT_STATE_PLAYING,
  type YTPlayer,
} from "@/lib/youtube-iframe-api";
import { createYouTubeMountPoint, forceIframeFillContainer, type PlaybackState, type PlayerEngine, type PlayerHandle } from "@/lib/player-engine";

function toPlaybackState(ytState: number): PlaybackState {
  switch (ytState) {
    case YT_STATE_PLAYING:
      return "playing";
    case YT_STATE_BUFFERING:
      return "buffering";
    case YT_STATE_ENDED:
      return "ended";
    case YT_STATE_CUED:
      return "unstarted";
    default:
      return "paused";
  }
}

export const youtubePlayerEngine: PlayerEngine = {
  mount(container, source, callbacks, options): PlayerHandle {
    if (source.source !== "youtube") {
      throw new Error("youtubePlayerEngine given a non-youtube source");
    }

    let player: YTPlayer | null = null;
    let cancelled = false;
    let stopWatchingIframe: (() => void) | null = null;
    let hasUnmuted = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      const mountEl = createYouTubeMountPoint(container);
      player = new window.YT.Player(mountEl, {
        videoId: source.videoId,
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          // Starts muted — real-device testing (Android WebView) showed
          // unmuted autoplay gets silently blocked by the browser's own
          // autoplay-with-sound policy, which makes YouTube fall back to
          // its own "tap to play" embed UI instead of actually playing
          // (small pillarboxed video, title/channel bar, pause icon —
          // easy to mistake for a sizing bug, which is a rabbit hole this
          // comment is here to save the next person from). Unmuting once
          // playback actually starts (below) is allowed because it
          // follows the genuine user gesture that opened this screen.
          mute: 1,
          controls: options?.nativeControls ? 1 : 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3,
          fs: options?.nativeControls ? 1 : 0,
        },
        events: {
          onStateChange: (e: { data: number }) => {
            callbacks.onStateChange(toPlaybackState(e.data));
            if (e.data === YT_STATE_ENDED) callbacks.onEnded();
            if (!hasUnmuted && (e.data === YT_STATE_PLAYING || e.data === YT_STATE_BUFFERING)) {
              hasUnmuted = true;
              player?.unMute();
            }
          },
          // Real dead-stream *detection* ahead of time needs stream_health
          // (Phase 2+); this only catches it at play time.
          onError: () => callbacks.onError(),
        },
      });
      stopWatchingIframe = forceIframeFillContainer(container);
    });

    return {
      playVideo: () => player?.playVideo(),
      pauseVideo: () => player?.pauseVideo(),
      seekTo: (seconds) => player?.seekTo(seconds, true),
      getPlayerState: () =>
        player && typeof player.getPlayerState === "function" ? toPlaybackState(player.getPlayerState()) : "resolving",
      getCurrentTime: () => (player && typeof player.getCurrentTime === "function" ? player.getCurrentTime() : 0),
      getDuration: () => (player && typeof player.getDuration === "function" ? player.getDuration() : 0),
      destroy: () => {
        cancelled = true;
        stopWatchingIframe?.();
        player?.destroy();
        player = null;
      },
    };
  },
};
