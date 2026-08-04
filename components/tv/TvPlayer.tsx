"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoCategory } from "@/components/WatchClient";
import type { ApprovedVideo } from "@/lib/watch-folders";
import type { PlaybackSource, PlayerHandle } from "@/lib/player-engine";
import { youtubePlayerEngine } from "@/lib/youtube-player-engine";
import { html5PlayerEngine } from "@/lib/html5-player-engine";
import { focusInRow } from "@/lib/tv-focus";
import { ChevronLeftIcon, PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, CloudSlashIcon, PopcornIcon } from "./icons";

const SEEK_STEP_SECONDS = 20;
const CONTROLS_HIDE_MS = 4000;
const NEXT_EPISODE_COUNTDOWN_S = 8;

/**
 * `nextCardOpen`/`onNextCardOpenChange` are lifted to TvApp rather than kept
 * local, because dismissing the next-episode card has to go through the
 * same history-marker Back handling every other screen transition uses
 * (the TV remote's Back key only ever reaches this page as a `popstate`
 * event — see WatchClient's ensureMarker for why — so TvApp's popstate
 * handler needs to know this card is up in order to cancel it there instead
 * of navigating away).
 */
export default function TvPlayer({
  video,
  category,
  nextCardOpen,
  onNextCardOpenChange,
  onBack,
  onHome,
  onAdvance,
}: {
  video: ApprovedVideo;
  category: VideoCategory;
  nextCardOpen: boolean;
  onNextCardOpenChange: (open: boolean) => void;
  onBack: () => void;
  onHome: () => void;
  onAdvance: (next: ApprovedVideo) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [streamError, setStreamError] = useState(false);
  const [resolving, setResolving] = useState(video.source === "stremio");
  const playerRef = useRef<PlayerHandle | null>(null);
  const playPauseRef = useRef<HTMLButtonElement>(null);

  const [controlsVisible, setControlsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(NEXT_EPISODE_COUNTDOWN_S);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextVideo = (() => {
    const idx = category.videos.findIndex((v) => v.videoId === video.videoId);
    if (idx === -1) return null;
    return category.videos[idx + 1] ?? null;
  })();

  function togglePlayPause() {
    const player = playerRef.current;
    if (!player) return;
    const state = player.getPlayerState();
    if (state === "playing" || state === "buffering") player.pauseVideo();
    else player.playVideo();
  }

  function seek(deltaSeconds: number) {
    const player = playerRef.current;
    if (!player) return;
    const target = Math.max(0, player.getCurrentTime() + deltaSeconds);
    player.seekTo(target);
  }

  function showControls() {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
  }

  // Mount the player — the engine (YouTube IFrame vs HTML5+hls.js) is picked
  // by video.source; both share the same PlayerHandle shape so none of the
  // chrome below needs to know which one is actually driving playback. The
  // __tvRemotePlayPause bridge contract further down is exactly what
  // kids-kiosk-tv's MainActivity already calls — must not change shape.
  useEffect(() => {
    if (!containerRef.current) return;
    setStreamError(false);
    setResolving(video.source === "stremio");

    const engine = video.source === "youtube" ? youtubePlayerEngine : html5PlayerEngine;
    const source: PlaybackSource =
      video.source === "youtube"
        ? { source: "youtube", videoId: video.videoId }
        : {
            source: "stremio",
            imdbId: video.imdbId!,
            mediaType: video.mediaType!,
            season: video.season,
            episode: video.episode,
          };

    playerRef.current = engine.mount(containerRef.current, source, {
      onStateChange: (state) => {
        setResolving(state === "resolving");
        setIsPlaying(state === "playing" || state === "buffering");
      },
      onEnded: () => {
        if (nextVideo) onNextCardOpenChange(true);
        else onBack();
      },
      // A child must never hit a dead end: a removed/private/region-blocked
      // YouTube video, or a Stremio title AIOStreams couldn't resolve to
      // anything browser-playable, both show "having a nap" instead of a
      // blank/broken player. Real dead-stream *detection* ahead of time
      // needs stream_health (Phase 2+); this only catches it at play time.
      onError: () => setStreamError(true),
    });

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.videoId]);

  useEffect(() => {
    const win = window as unknown as { __tvRemotePlayPause?: () => void };
    win.__tvRemotePlayPause = () => {
      togglePlayPause();
      showControls();
    };
    return () => {
      delete win.__tvRemotePlayPause;
    };
  });

  useEffect(() => {
    const poll = setInterval(() => {
      const player = playerRef.current;
      // Both engines' PlayerHandle methods are always real functions and
      // return safe defaults (0) before they're actually ready to report —
      // no readiness guard needed here, unlike a raw YT.Player reference.
      if (!player) return;
      const dur = player.getDuration();
      const cur = player.getCurrentTime();
      if (dur > 0) {
        setDuration(dur);
        setElapsed(cur);
        setProgress(cur / dur);
      }
    }, 500);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    // Kicks off the initial 4s auto-hide countdown on mount — an external
    // timer being started, not state derived from props/state, so this is
    // the legitimate "synchronize with an external system" effect case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    showControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    // No button is focused by default (§2.5: "OK toggles play/pause when no
    // control is focused" implies that's a normal state, not an edge case)
    // — but *something* within this subtree still needs DOM focus on
    // mount, or a keydown event has nothing to bubble up from and never
    // reaches handleKeyDown at all (a keydown targeting document.body,
    // which is what activeElement falls back to, can't bubble down into a
    // descendant).
    rootRef.current?.focus();
  }, []);

  useEffect(() => {
    // The control buttons unmount entirely when hidden (not just CSS-
    // hidden), which drops focus back to body the same way — re-focus the
    // root whenever that happens so keydown keeps reaching the handler.
    if (!controlsVisible) rootRef.current?.focus();
  }, [controlsVisible]);

  useEffect(() => {
    if (!nextCardOpen) {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      return;
    }
    // Resets the countdown display when the next-episode card opens, then
    // starts the interval that ticks it down — external timer setup, same
    // reasoning as the auto-hide effect above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountdown(NEXT_EPISODE_COUNTDOWN_S);
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownTimer.current) clearInterval(countdownTimer.current);
          if (nextVideo) onAdvance(nextVideo);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCardOpen]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (nextCardOpen || streamError || resolving) return; // both are just normal buttons; Back is popstate, not a keydown

    const wasHidden = !controlsVisible;

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (wasHidden) {
        seek(e.key === "ArrowRight" ? SEEK_STEP_SECONDS : -SEEK_STEP_SECONDS);
        showControls();
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      const isControlFocused = !!active?.closest('[data-tv-player-controls="true"]');
      showControls();
      if (isControlFocused) {
        const items = controlsRef.current
          ? Array.from(controlsRef.current.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]'))
          : [];
        focusInRow(items, e.key === "ArrowRight" ? "right" : "left");
      } else {
        playPauseRef.current?.focus();
      }
      return;
    }

    if (wasHidden) {
      e.preventDefault();
      showControls();
      return;
    }

    showControls();

    if (e.key === "Enter" || e.key === " ") {
      const active = document.activeElement as HTMLElement | null;
      const isControlFocused = !!active?.closest('[data-tv-player-controls="true"]');
      if (!isControlFocused) {
        e.preventDefault();
        togglePlayPause();
      }
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="relative h-full w-full overflow-hidden bg-black outline-none"
      style={{ fontFamily: "var(--font-tv)" }}
    >
      <div ref={containerRef} className="absolute inset-0" />

      {resolving && !streamError && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center text-white"
          style={{ background: "var(--tv-bg)" }}
        >
          <PopcornIcon className="h-16 w-16 animate-pulse" style={{ color: "var(--tv-text-muted-2)" }} />
          <h1 className="font-medium" style={{ fontSize: 40 }}>
            Finding your show…
          </h1>
        </div>
      )}

      {streamError && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center text-white"
          style={{ background: "var(--tv-bg)" }}
        >
          <CloudSlashIcon className="h-20 w-20" style={{ color: "var(--tv-text-muted-2)" }} />
          <h1 className="font-medium" style={{ fontSize: 52 }}>
            This one&apos;s having a nap
          </h1>
          <p className="text-lg" style={{ color: "var(--tv-text-muted)" }}>
            A grown-up has been told.
          </p>
          <div className="mt-4 flex gap-4">
            <button
              data-tv-focusable="true"
              autoFocus
              onClick={onBack}
              className="tv-focusable rounded-xl px-6 py-3 text-xl font-medium"
              style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
            >
              Pick another
            </button>
            <button
              data-tv-focusable="true"
              onClick={onHome}
              className="tv-focusable rounded-xl border px-6 py-3 text-xl font-medium"
              style={{ borderColor: "var(--tv-divider)" }}
            >
              Home
            </button>
          </div>
        </div>
      )}

      {!streamError && !resolving && controlsVisible && !nextCardOpen && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/85 to-transparent" />

          <button
            data-tv-focusable="true"
            data-tv-player-controls="true"
            onClick={onBack}
            className="tv-focusable absolute left-8 top-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-lg font-medium text-white"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <ChevronLeftIcon className="h-5 w-5" /> Back
          </button>

          <div className="absolute inset-x-8 bottom-8 text-white">
            <h1 style={{ fontSize: 52 }} className="font-medium">
              {category.label}
            </h1>

            <div className="relative mt-4 h-[12px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${progress * 100}%`, background: "var(--tv-accent-300)" }}
              />
              <div
                className="absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
                style={{
                  left: `calc(${progress * 100}% - 14px)`,
                  background: "var(--tv-accent-300)",
                  boxShadow: "0 0 0 6px color-mix(in srgb, var(--tv-accent-300) 30%, transparent)",
                }}
              />
            </div>

            <div ref={controlsRef} className="mt-4 flex items-center gap-6">
              <button
                data-tv-focusable="true"
                data-tv-player-controls="true"
                onClick={() => seek(-SEEK_STEP_SECONDS)}
                className="tv-focusable flex h-11 w-11 items-center justify-center rounded-full"
              >
                <SkipBackIcon className="h-6 w-6" />
              </button>
              <button
                ref={playPauseRef}
                data-tv-focusable="true"
                data-tv-player-controls="true"
                onClick={togglePlayPause}
                className="tv-focusable flex items-center justify-center rounded-full"
                style={{ width: 60, height: 60, background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
              >
                {isPlaying ? <PauseIcon className="h-7 w-7" /> : <PlayIcon className="h-7 w-7" />}
              </button>
              <button
                data-tv-focusable="true"
                data-tv-player-controls="true"
                onClick={() => seek(SEEK_STEP_SECONDS)}
                className="tv-focusable flex h-11 w-11 items-center justify-center rounded-full"
              >
                <SkipForwardIcon className="h-6 w-6" />
              </button>
              <span className="text-xl" style={{ color: "var(--tv-text-muted)" }}>
                {formatTime(elapsed)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </>
      )}

      {nextCardOpen && nextVideo && (
        <div className="absolute bottom-10 right-10 w-[420px] rounded-2xl p-5 text-white" style={{ background: "var(--tv-surface)", boxShadow: "var(--tv-shadow-lg)" }}>
          <p className="text-sm" style={{ color: "var(--tv-text-muted-2)" }}>
            Up next in {countdown}s
          </p>
          <p className="mt-1 text-2xl font-medium">{nextVideo.title}</p>
          <div className="mt-4 flex gap-3">
            <button
              data-tv-focusable="true"
              autoFocus
              onClick={() => onAdvance(nextVideo)}
              className="tv-focusable rounded-xl px-5 py-3 text-lg font-medium"
              style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
            >
              Play now
            </button>
            <button
              data-tv-focusable="true"
              onClick={() => onNextCardOpenChange(false)}
              className="tv-focusable rounded-xl border px-5 py-3 text-lg font-medium"
              style={{ borderColor: "var(--tv-divider)" }}
            >
              Stay here
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
