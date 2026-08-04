"use client";

/**
 * Shared D-pad focus primitives for /tv. Arrow keys have no default browser
 * behavior for moving focus between elements (only Tab does that, and
 * nothing sends Tab on a TV remote), so every screen drives focus itself
 * using these — see the design handoff's Handoff Spec §2, which is
 * normative. Each screen still owns its own keydown handler and layout
 * knowledge (e.g. "Up from row 1 goes to the hero button" is Home-specific);
 * this module only provides the reusable geometry/scrolling/memory pieces
 * so that behavior is consistent everywhere it's used.
 */

export type TvDirection = "up" | "down" | "left" | "right";

/**
 * Nearest focusable element in `direction` from whatever's currently
 * focused, scoped to elements matching `selector` inside `root`. Pure
 * geometry (bounding-box centers) — for a single row or a rail↔content
 * jump, prefer focusInRow/focusPreservingIndex instead, since this doesn't
 * know about "don't wrap" or "keep the column index" rules.
 */
export function focusNearest(
  direction: TvDirection,
  options?: { root?: ParentNode; selector?: string }
): boolean {
  const root = options?.root ?? document;
  const selector = options?.selector ?? '[data-tv-focusable="true"]';
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;

  // Next.js's streaming SSR leaves a hidden (`display:none`) duplicate of
  // the tree in the DOM as a normal internal artifact — offsetParent is
  // null for anything inside it, which is also a cheap, reliable way to
  // exclude it (and anything else legitimately hidden) from candidates.
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el !== active && el.offsetParent !== null
  );
  if (candidates.length === 0) return false;

  const a = active.getBoundingClientRect();
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    const dx = r.left + r.width / 2 - ax;
    const dy = r.top + r.height / 2 - ay;

    if (direction === "up" && dy >= -4) continue;
    if (direction === "down" && dy <= 4) continue;
    if (direction === "left" && dx >= -4) continue;
    if (direction === "right" && dx <= 4) continue;

    const primary = direction === "up" || direction === "down" ? Math.abs(dy) : Math.abs(dx);
    const cross = direction === "up" || direction === "down" ? Math.abs(dx) : Math.abs(dy);
    const score = primary + cross * 2;

    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  if (!best) return false;
  best.focus();
  return true;
}

/**
 * Moves focus left/right within a single ordered row of elements. Never
 * wraps — at either end, nudges the current element (120ms bounce) instead
 * and leaves focus where it was. Returns true if focus actually moved.
 */
export function focusInRow(items: HTMLElement[], direction: "left" | "right"): boolean {
  const active = document.activeElement as HTMLElement | null;
  const idx = active ? items.indexOf(active) : -1;
  if (idx === -1) return false;

  const nextIdx = direction === "right" ? idx + 1 : idx - 1;
  if (nextIdx < 0 || nextIdx >= items.length) {
    nudge(items[idx], direction);
    return false;
  }
  items[nextIdx].focus();
  return true;
}

/**
 * Moves focus from one list to another (e.g. row → row, or rail → content),
 * preserving position by index and clamping to the shorter list rather than
 * always landing on the first item — "vertical movement keeps the column
 * index where possible, clamped to the shorter row."
 */
export function focusPreservingIndex(target: HTMLElement[], currentIndex: number): boolean {
  if (target.length === 0) return false;
  const clamped = Math.max(0, Math.min(currentIndex, target.length - 1));
  target[clamped].focus();
  return true;
}

/** Brief (120ms) bounce to signal "can't move further this way" instead of wrapping. */
export function nudge(el: HTMLElement, direction: "left" | "right"): void {
  const cls = direction === "right" ? "tv-nudge-right" : "tv-nudge-left";
  el.classList.remove("tv-nudge-left", "tv-nudge-right");
  void el.offsetWidth; // restart the animation if nudged twice in a row
  el.classList.add(cls);
  window.setTimeout(() => el.classList.remove(cls), 150);
}

/**
 * Scrolls a horizontally-scrolling row so the focused tile sits at a fixed
 * on-screen position (~30% across, roughly "the third slot"), using a CSS
 * transform on `track` — never scrollIntoView, per spec. No-ops (transform
 * clamped to 0 or the max shift) at the row's start/end, which is what
 * makes the "except at row start and end" part of the spec fall out
 * naturally rather than needing special-casing.
 */
export function scrollRowToTile(track: HTMLElement, tile: HTMLElement): void {
  const viewport = track.parentElement;
  if (!viewport) return;

  const viewportWidth = viewport.clientWidth;
  const desiredOnScreenX = viewportWidth * 0.3;
  const naturalX = tile.offsetLeft;
  const trackWidth = track.scrollWidth;

  let shift = naturalX - desiredOnScreenX;
  shift = Math.max(0, shift);
  const maxShift = Math.max(0, trackWidth - viewportWidth);
  shift = Math.min(shift, maxShift);

  track.style.transform = `translateX(-${shift}px)`;
}

/**
 * Per-session "what had focus last" memory, keyed by an arbitrary zone id
 * (e.g. "rail", "row-1"). Module-level singleton rather than React state:
 * there's only ever one /tv app instance alive in a tab, same reasoning as
 * WatchClient's existing ytApiPromise singleton. Used for the rail's
 * round-trip (Left collapses into the rail; Right returns focus to
 * wherever it was) and restoring focus when Back returns to a prior
 * screen/row.
 */
const focusMemory = new Map<string, HTMLElement>();

export function rememberFocus(zone: string, el: HTMLElement | null): void {
  if (el) focusMemory.set(zone, el);
}

export function recallFocus(zone: string): HTMLElement | undefined {
  return focusMemory.get(zone);
}

export function clearFocusMemory(): void {
  focusMemory.clear();
}
