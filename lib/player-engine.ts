"use client";

// Shared shape both playback engines implement, so components/tv/TvPlayer.tsx
// (the chrome: controls, seek bar, next-episode card, D-pad handling) doesn't
// need to know whether it's driving a YouTube embed or an HTML5 <video>.
// Modeled closely on lib/youtube-iframe-api.ts's YTPlayer, which is why a
// YouTube-backed PlayerHandle is close to a pass-through wrapper around it.

export type PlaybackState = "resolving" | "unstarted" | "playing" | "paused" | "buffering" | "ended";

export type PlaybackSource =
  | { source: "youtube"; videoId: string }
  | {
      source: "stremio";
      imdbId: string;
      mediaType: "movie" | "series";
      season?: number;
      episode?: number;
    };

export interface PlayerHandle {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number): void;
  getPlayerState(): PlaybackState;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

export interface MountCallbacks {
  onStateChange: (state: PlaybackState) => void;
  onEnded: () => void;
  // A child must never hit a dead end: covers both "AIOStreams found nothing
  // playable" and "the browser failed to actually decode what it found" —
  // both are equally a dead end from the kid's side, so both funnel through
  // the same "having a nap" state in TvPlayer rather than needing separate UI.
  onError: () => void;
}

export interface PlayerEngine {
  mount(container: HTMLElement, video: PlaybackSource, callbacks: MountCallbacks): PlayerHandle;
}

/**
 * YT.Player's documented behavior is to *replace* the element it's given
 * with the generated `<iframe>` — the original element is removed from the
 * DOM, not made the iframe's parent. Any caller that mounts directly onto a
 * ref it also wants to keep using afterwards (to find the iframe later, via
 * forceIframeFillContainer or otherwise) loses that ref the instant the
 * player is constructed: querying it for a descendant iframe permanently
 * finds nothing, since the iframe is a *sibling* of the (now detached)
 * original node, not a child of it. Give YT.Player a disposable child
 * element to replace instead, so the caller's own container survives and
 * ends up as the iframe's real parent.
 */
export function createYouTubeMountPoint(container: HTMLElement): HTMLElement {
  const mountEl = document.createElement("div");
  container.appendChild(mountEl);
  return mountEl;
}

function applyFillStyle(iframe: HTMLIFrameElement) {
  iframe.style.position = "absolute";
  iframe.style.inset = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.removeAttribute("width");
  iframe.removeAttribute("height");
}

/**
 * YT.Player's own `width`/`height` constructor options ("100%" strings) are
 * unreliable across browser engines — confirmed directly on a real Android
 * WebView: the resulting iframe was measured at a fraction of its container
 * (e.g. 737×437 inside a 1180×700 box), not "100%" of anything recognizable,
 * even though desktop Chrome renders the exact same code correctly.
 *
 * A single fix-on-creation call isn't reliable either: on-device, YT's own
 * player script re-asserts numeric width/height attributes on the iframe
 * *after* creation (its internal resize handling), silently undoing a
 * one-shot style override applied synchronously right after `new
 * YT.Player()` returns. This watches the container for the iframe
 * appearing, and the iframe's own attributes for YouTube re-asserting
 * them, and reapplies the fill style every time — cheap (attribute writes
 * are rare) and immune to ordering relative to YouTube's own script.
 * Returns a cleanup function; call it when the engine is destroyed.
 */
export function forceIframeFillContainer(container: HTMLElement): () => void {
  let iframeObserver: MutationObserver | null = null;

  function watchIframe(iframe: HTMLIFrameElement) {
    applyFillStyle(iframe);
    iframeObserver?.disconnect();
    iframeObserver = new MutationObserver(() => applyFillStyle(iframe));
    iframeObserver.observe(iframe, { attributes: true, attributeFilter: ["width", "height", "style"] });
  }

  const existing = container.querySelector("iframe");
  if (existing) watchIframe(existing);

  const containerObserver = new MutationObserver(() => {
    const iframe = container.querySelector("iframe");
    if (iframe && iframe.style.position !== "absolute") watchIframe(iframe);
  });
  containerObserver.observe(container, { childList: true, subtree: true });

  return () => {
    containerObserver.disconnect();
    iframeObserver?.disconnect();
  };
}
