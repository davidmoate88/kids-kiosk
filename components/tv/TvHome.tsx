"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoFolder, VideoCategory } from "@/components/WatchClient";
import { categoryThumbnail } from "@/lib/youtube-thumbs";
import { averageColor } from "@/lib/dominant-color";
import { loadYouTubeApi, type YTPlayer } from "@/lib/youtube-iframe-api";
import { createYouTubeMountPoint, forceIframeFillContainer } from "@/lib/player-engine";
import {
  focusInRow,
  focusNearest,
  focusPreservingIndex,
  rememberFocus,
  recallFocus,
  scrollRowToTile,
} from "@/lib/tv-focus";
import { PlayIcon, CheckIcon } from "./icons";

const FALLBACK_WASH = "rgb(66, 58, 106)"; // --tv-accent-800

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TvHome({
  folders,
  onOpenDetail,
  onGoToRail,
}: {
  folders: VideoFolder[];
  onOpenDetail: (category: VideoCategory) => void;
  onGoToRail: () => void;
}) {
  const [state] = useState(() => {
    const r = folders
      .map((f) => ({
        id: f.id,
        title: f.label,
        tiles: shuffle([...f.categories]),
      }))
      .filter((row) => row.tiles.length > 0);
    const all = r.flatMap((row) => row.tiles);
    const pick = all.length > 0 ? all[Math.floor(Math.random() * all.length)] : null;
    return { rows: r, randomTile: pick };
  });
  const rows = state.rows;
  const [heroCategory, setHeroCategory] = useState<VideoCategory | null>(state.randomTile);
  const [previewing, setPreviewing] = useState<VideoCategory | null>(null);
  // Two-layer crossfade rather than transitioning backgroundColor directly:
  // each layer gets blur-[160px] applied to itself individually (baked in at
  // paint time, since its color never changes after mount), so the 700ms
  // fade is a pure compositor opacity blend of two already-blurred textures
  // — not a re-run of the blur filter every frame. Confirmed on-device via
  // dumpsys gfxinfo that animating backgroundColor on a single blurred
  // element (the original approach) forces exactly the same per-frame
  // re-rasterization cost as the blur+scale bug this replaced (89% janky
  // frames from a single isolated color transition).
  const washIdRef = useRef(1);
  const [washLayers, setWashLayers] = useState<{ id: number; color: string }[]>([
    { id: 0, color: FALLBACK_WASH },
  ]);

  const heroTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroButtonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    // §2.2: initial focus is the first tile of the first row, not the hero
    // buttons — a child pressing OK immediately should get a show. The hero
    // buttons come first in DOM order, so this has to target row 0 col 0
    // specifically rather than just "the first focusable element".
    const first = rootRef.current?.querySelector<HTMLElement>(
      '[data-tv-row="0"][data-tv-col="0"]'
    );
    first?.focus();
  }, []);

  useEffect(
    () => () => {
      if (heroTimer.current) clearTimeout(heroTimer.current);
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!heroCategory) return;
    let cancelled = false;
    averageColor(categoryThumbnail(heroCategory), FALLBACK_WASH).then((color) => {
      if (cancelled) return;
      const id = washIdRef.current++;
      // Keep only the incoming layer plus whichever one was already on top —
      // the new one fades in over the old one, which just sits underneath.
      setWashLayers((prev) => [...prev.slice(-1), { id, color }]);
    });
    return () => {
      cancelled = true;
    };
  }, [heroCategory]);

  function cancelDwell() {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    setPreviewing(null);
  }

  function handleTileFocus(category: VideoCategory, rowId: string, tileEl: HTMLElement) {
    const track = trackRefs.current.get(rowId);
    if (track) scrollRowToTile(track, tileEl);
    rememberFocus("screen:home", tileEl);
    rememberFocus(`row:${rowId}`, tileEl);

    if (heroTimer.current) clearTimeout(heroTimer.current);
    heroTimer.current = setTimeout(() => setHeroCategory(category), 250);

    cancelDwell();
    dwellTimer.current = setTimeout(() => setPreviewing(category), 900);
  }

  function rowTiles(rowIndex: number): HTMLElement[] {
    const track = trackRefs.current.get(rows[rowIndex]?.id);
    return track ? Array.from(track.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]')) : [];
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    cancelDwell(); // preview is cancelled by any key

    const active = document.activeElement as HTMLElement | null;
    if (!active || !rootRef.current?.contains(active)) return;
    const rowAttr = active.dataset.tvRow;
    const col = active.dataset.tvCol ? Number(active.dataset.tvCol) : 0;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (rowAttr === "hero") {
        focusNearest("right", { root: rootRef.current ?? document, selector: '[data-tv-row="hero"]' });
        return;
      }
      if (rowAttr !== undefined) focusInRow(rowTiles(Number(rowAttr)), "right");
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (rowAttr === "hero") {
        // Try moving to the other hero button first; only reach the rail
        // once there's nothing further left (i.e. already on "Let's go!").
        if (!focusNearest("left", { root: rootRef.current ?? document, selector: '[data-tv-row="hero"]' })) {
          onGoToRail();
        }
        return;
      }
      if (rowAttr !== undefined) {
        const items = rowTiles(Number(rowAttr));
        if (items.indexOf(active) === 0) {
          rememberFocus("screen:home", active);
          onGoToRail();
        } else {
          focusInRow(items, "left");
        }
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowAttr === "hero") return;
      if (rowAttr === "0") {
        heroButtonRef.current?.focus();
      } else if (rowAttr !== undefined) {
        focusPreservingIndex(rowTiles(Number(rowAttr) - 1), col);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowAttr === "hero") {
        const remembered = recallFocus("row:" + rows[0]?.id);
        if (remembered && document.contains(remembered)) remembered.focus();
        else focusPreservingIndex(rowTiles(0), 0);
      } else if (rowAttr !== undefined) {
        const next = rowTiles(Number(rowAttr) + 1);
        if (next.length) focusPreservingIndex(next, col);
      }
    }
  }

  if (!heroCategory) {
    return null; // handled by the "nothing to watch yet" edge state upstream
  }

  return (
    <div
      ref={rootRef}
      onKeyDown={handleKeyDown}
      // tv-home-root (globals.css) sets --tv-content-offset here, not on the
      // hero/rows divs directly: peer-focus-within only matches *direct*
      // siblings of the rail — this root div is that direct sibling,
      // hero/rows are nested inside it, so they read the value via
      // inheritance instead.
      className="tv-home-root relative h-full w-full overflow-hidden"
      style={{ background: "var(--tv-bg)", color: "var(--tv-text)", fontFamily: "var(--font-tv)" }}
    >
      {/* Background: a soft blurred wash colored from the focused show's art,
          plus a faint dot texture. No continuous animation here on purpose —
          confirmed on-device that animating a large blur() (even
          translate-only, even with will-change) is a severe, continuous jank
          source on this WebView (74-88% janky frames from this element
          alone). Each color change is rendered as its own fully-static,
          independently-blurred layer that only fades in via opacity — blur
          is computed once per layer at paint time, so the crossfade is a
          compositor-only opacity blend, not a per-frame re-rasterization of
          the blur (which is what transitioning backgroundColor on a single
          blurred element still costs, even with the scale animation gone —
          confirmed the same way, via dumpsys gfxinfo). */}
      {washLayers.map((layer, i) => (
        <div
          key={layer.id}
          aria-hidden="true"
          className={
            "absolute -right-40 -top-40 h-[900px] w-[1200px] rounded-full opacity-70 blur-[160px]" +
            (i === washLayers.length - 1 && washLayers.length > 1 ? " animate-tv-wash-in" : "")
          }
          style={{ backgroundColor: layer.color }}
        />
      ))}
      {/* fixed, not absolute: rootRef scrolls vertically (native focus-driven
          scrollIntoView as row focus moves down), and an absolutely
          positioned layer scrolls right along with it — its fixed 1080px
          height would then scroll past the visible area, exposing bare
          background below the fold. A transformed ancestor (TvApp's
          scale(...) wrapper) becomes the containing block for `fixed`
          descendants, so this still locks to the 1920x1080 virtual screen
          rather than the true device viewport, but stays put regardless of
          rootRef's own scroll position. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(rgba(233,233,237,0.5) 1px, transparent 1px)",
          backgroundSize: "5px 5px",
        }}
      />

      {previewing && (
        <HeroDwellPreview
          key={previewing.id}
          videoId={previewing.videos[0]?.videoId}
          source={previewing.videos[0]?.source}
          posterUrl={categoryThumbnail(previewing)}
        />
      )}

      {/* Hero */}
      <div
        className="relative z-10 pl-[var(--tv-content-offset)] pt-24 transition-[padding-left] duration-200"
        style={{ width: 760 }}
      >
        {/* Fixed-height slot regardless of previewing state — this row used
            to only exist in the DOM when previewing was true, so the title
            (and everything below it) shifted up ~56px every time a D-pad
            press cancelled the preview, then back down 900ms later when the
            next dwell kicked in. Reserving the space even when empty keeps
            the title's position stable through that constant toggling. */}
        <div className="mb-4 flex h-10 items-center gap-3">
          {previewing && (
            <>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[19px] font-semibold uppercase"
                style={{
                  letterSpacing: "0.14em",
                  color: "var(--tv-accent-300)",
                  background: "color-mix(in srgb, var(--tv-accent) 18%, transparent)",
                  border: "1px solid var(--tv-accent-500)",
                }}
              >
                Preview playing
              </span>
              <span className="flex h-4 items-end gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-1 animate-tv-eq rounded-full"
                    style={{
                      height: "100%",
                      background: "var(--tv-accent-300)",
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                ))}
              </span>
            </>
          )}
        </div>

        {/* line-clamp on both title and description: the rows section below
            (§ "Rows") sits at a fixed top offset, not measured against the
            hero's actual rendered height — a long category name wrapping to
            3-4 lines at this font size pushed hero content down far enough
            to collide with (render underneath/through) the rows section.
            Capping both keeps hero height bounded and predictable instead of
            fixing the deeper "rows should measure hero height" architecture
            change that'd require. */}
        <h1
          className="font-medium"
          style={{
            fontSize: 72,
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {heroCategory.label}
        </h1>

        <p className="mt-3 text-2xl" style={{ color: "var(--tv-accent-2-300)" }}>
          {heroCategory.videos.length} episode{heroCategory.videos.length === 1 ? "" : "s"}
        </p>

        <p
          className="mt-3 max-w-[620px] text-[28px] leading-[1.4]"
          style={{
            color: "var(--tv-text-muted)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {heroCategory.videos[0]?.title ?? ""}
        </p>

        <div className="mt-6 flex items-center gap-4">
          <button
            ref={heroButtonRef}
            data-tv-focusable="true"
            data-tv-row="hero"
            onFocus={(e) => rememberFocus("screen:home", e.currentTarget)}
            onClick={() => onOpenDetail(heroCategory)}
            className="tv-focusable whitespace-nowrap rounded-xl text-[26px] font-medium"
            style={{
              padding: "18px 34px",
              background: "var(--tv-accent-300)",
              color: "var(--tv-bg)",
            }}
          >
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <PlayIcon className="h-6 w-6" /> Let&apos;s go!
            </span>
          </button>
          <button
            data-tv-focusable="true"
            data-tv-row="hero"
            onClick={() => onOpenDetail(heroCategory)}
            className="tv-focusable whitespace-nowrap rounded-xl border text-[26px] font-medium"
            style={{ padding: "18px 34px", borderColor: "var(--tv-divider)", color: "var(--tv-text)" }}
          >
            All episodes
          </button>
        </div>
      </div>

      {/* Rows */}
      <div
        className="absolute left-[var(--tv-content-offset)] flex flex-col gap-[26px] transition-[left] duration-200"
        style={{ top: 560, right: 0 }}
      >
        {rows.map((row, rowIndex) => (
          <div key={row.id} className="relative">
            <h2 className="mb-2 text-lg font-semibold" style={{ color: "var(--tv-text)" }}>
              {row.title}
            </h2>
            <div className="overflow-hidden">
              <div
                ref={(el) => {
                  if (el) trackRefs.current.set(row.id, el);
                }}
                className="flex gap-[22px] transition-transform duration-200"
                style={{ transitionTimingFunction: "cubic-bezier(.2,.8,.3,1)" }}
              >
                {row.tiles.map((tile, tileIndex) => (
                  <button
                    key={tile.id}
                    data-tv-focusable="true"
                    data-tv-row={rowIndex}
                    data-tv-col={tileIndex}
                    onFocus={(e) => handleTileFocus(tile, row.id, e.currentTarget)}
                    onClick={() => onOpenDetail(tile)}
                    className="tv-focusable relative shrink-0 overflow-hidden rounded-[14px] text-left"
                    style={{
                      width: 300,
                      height: 170,
                      border: "1px solid rgba(233,233,237,0.1)",
                      boxShadow: "var(--tv-shadow-md)",
                      background: "var(--tv-surface)",
                    }}
                  >
                    {categoryThumbnail(tile) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={categoryThumbnail(tile)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {tile.videos[0]?.source === "stremio" && (
                      // Same title can exist as both a YouTube clips channel and a
                      // real Stremio series/movie (e.g. "Bluey") — this is the only
                      // visual differentiator at row-browsing level, since both
                      // would otherwise show the same label. YouTube tiles stay
                      // unbadged (the default/majority case) to avoid cluttering
                      // every row with a label that's only useful when there's an
                      // actual same-name collision to resolve.
                      <span
                        className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-sm font-medium"
                        style={{ background: "var(--tv-accent-800)", color: "var(--tv-accent-100)" }}
                      >
                        {tile.videos.length > 1 ? "Series" : "Movie"}
                      </span>
                    )}
                    <span
                      className="absolute bottom-3 left-3 right-3 font-medium"
                      style={{ fontSize: 27, textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}
                    >
                      {tile.label}
                    </span>
                    {tile.videos.length > 0 && tile.videos.every((v) => v.watched) && (
                      // Whole-category watched, not per-episode — a
                      // multi-episode show only gets this once every episode
                      // has been seen; Detail's own episode list is where
                      // per-episode watched state actually shows. Placed
                      // beside the play button rather than near the bottom
                      // title text, which wraps to 2 lines often enough
                      // that a bottom-corner badge risked overlapping it.
                      <span
                        className="absolute right-[60px] top-3 flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ background: "var(--tv-accent-300)" }}
                        aria-label="Watched"
                      >
                        <CheckIcon className="h-4 w-4" style={{ color: "var(--tv-bg)" }} />
                      </span>
                    )}
                    <span
                      className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full"
                      style={{ background: "rgba(0,0,0,0.55)" }}
                    >
                      <PlayIcon className="h-5 w-5 translate-x-[1px]" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Muted, autoplaying dwell preview of a show's first video, behind the
 * hero text. Reuses the same YouTube IFrame API integration as the main
 * player. Unmounting (parent clears `previewing`) tears the player down —
 * there's no persistent instance to manage here, unlike the main player.
 * Stremio categories get the static poster only, never a live player — no
 * AIOStreams round-trip on every hover (deliberate Phase 3 scope decision,
 * not just an unimplemented feature). */
function HeroDwellPreview({
  videoId,
  source,
  posterUrl,
}: {
  videoId?: string;
  source?: "youtube" | "stremio";
  posterUrl?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const isYouTube = source === "youtube";

  useEffect(() => {
    // Guarded on isYouTube: previously this ran unconditionally and tried to
    // build a YouTube player from a Stremio videoId (a bare imdbId or
    // "imdbId:season:episode" string) — garbage as a YouTube video ID, with
    // no onError handling. Not a graceful no-op, an actual failed load
    // attempted on every single Stremio-category dwell.
    if (!isYouTube || !videoId || !containerRef.current) return;
    let cancelled = false;
    let stopWatchingIframe: (() => void) | null = null;
    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      const mountEl = createYouTubeMountPoint(containerRef.current);
      playerRef.current = new window.YT.Player(mountEl, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
        },
      });
      stopWatchingIframe = forceIframeFillContainer(containerRef.current);
    });
    return () => {
      cancelled = true;
      stopWatchingIframe?.();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, isYouTube]);

  if (!videoId) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 h-[700px] w-[1180px] overflow-hidden"
      style={{
        // Widened from 60% so the fully-opaque region starts further right —
        // hero text's box now extends further right too (cleared for the
        // nav rail's larger expanded width), so it needs more safe overlap
        // room before running into solid, non-faded video.
        maskImage: "linear-gradient(to left, black 74%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to left, black 74%, transparent 100%)",
      }}
    >
      {isYouTube ? (
        <div ref={containerRef} className="h-full w-full scale-125 opacity-80" />
      ) : (
        posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- same pattern as WatchClient.tsx's other thumbnails
          <img src={posterUrl} alt="" className="h-full w-full scale-125 object-cover opacity-80" />
        )
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--tv-bg)] to-transparent" />
    </div>
  );
}
