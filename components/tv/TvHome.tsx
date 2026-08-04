"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VideoFolder, VideoCategory } from "@/components/WatchClient";
import { categoryThumbnail } from "@/lib/youtube-thumbs";
import { averageColor } from "@/lib/dominant-color";
import { loadYouTubeApi, type YTPlayer } from "@/lib/youtube-iframe-api";
import {
  focusInRow,
  focusNearest,
  focusPreservingIndex,
  rememberFocus,
  recallFocus,
  scrollRowToTile,
} from "@/lib/tv-focus";
import { PlayIcon } from "./icons";

type Row = { id: string; title: string; tiles: VideoCategory[] };

const FALLBACK_WASH = "rgb(66, 58, 106)"; // --tv-accent-800

export default function TvHome({
  folders,
  onOpenDetail,
  onGoToRail,
}: {
  folders: VideoFolder[];
  onOpenDetail: (category: VideoCategory) => void;
  onGoToRail: () => void;
}) {
  const rows: Row[] = useMemo(
    () => folders.map((f) => ({ id: f.id, title: f.label, tiles: f.categories })).filter((r) => r.tiles.length > 0),
    [folders]
  );

  const firstTile = rows[0]?.tiles[0] ?? null;
  const [heroCategory, setHeroCategory] = useState<VideoCategory | null>(firstTile);
  const [previewing, setPreviewing] = useState<VideoCategory | null>(null);
  const [wash, setWash] = useState(FALLBACK_WASH);

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
      if (!cancelled) setWash(color);
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
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--tv-bg)", color: "var(--tv-text)", fontFamily: "var(--font-tv)" }}
    >
      {/* Background: a soft blurred wash colored from the focused show's art,
          plus a faint dot texture. Solid-color transitions animate natively
          in CSS, which sidesteps needing to interpolate a whole gradient. */}
      <div
        aria-hidden="true"
        className="absolute -right-40 -top-40 h-[900px] w-[1200px] rounded-full opacity-70 blur-[160px] transition-colors duration-700 ease-out animate-tv-drift"
        style={{ backgroundColor: wash }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(rgba(233,233,237,0.5) 1px, transparent 1px)",
          backgroundSize: "5px 5px",
        }}
      />

      {previewing && (
        <HeroDwellPreview key={previewing.id} videoId={previewing.videos[0]?.videoId} />
      )}

      {/* Hero */}
      <div className="relative z-10 pl-[180px] pt-24" style={{ width: 760 }}>
        {previewing && (
          <div className="mb-4 flex items-center gap-3">
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
          </div>
        )}

        <h1
          className="font-medium"
          style={{ fontSize: 96, lineHeight: 0.98, letterSpacing: "-0.03em" }}
        >
          {heroCategory.label}
        </h1>

        <p className="mt-3 text-2xl" style={{ color: "var(--tv-accent-2-300)" }}>
          {heroCategory.videos.length} episode{heroCategory.videos.length === 1 ? "" : "s"}
        </p>

        <p
          className="mt-3 max-w-[620px] text-[28px] leading-[1.4]"
          style={{ color: "var(--tv-text-muted)" }}
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
            className="tv-focusable rounded-xl text-[26px] font-medium"
            style={{
              padding: "18px 34px",
              background: "var(--tv-accent-300)",
              color: "var(--tv-bg)",
            }}
          >
            <span className="inline-flex items-center gap-2">
              <PlayIcon className="h-6 w-6" /> Let&apos;s go!
            </span>
          </button>
          <button
            data-tv-focusable="true"
            data-tv-row="hero"
            onClick={() => onOpenDetail(heroCategory)}
            className="tv-focusable rounded-xl border text-[26px] font-medium"
            style={{ padding: "18px 34px", borderColor: "var(--tv-divider)", color: "var(--tv-text)" }}
          >
            All episodes
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="absolute left-[120px] flex flex-col gap-[26px]" style={{ top: 560, right: 0 }}>
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
                    <span
                      className="absolute bottom-3 left-3 right-3 font-medium"
                      style={{ fontSize: 27, textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}
                    >
                      {tile.label}
                    </span>
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
 * there's no persistent instance to manage here, unlike the main player. */
function HeroDwellPreview({ videoId }: { videoId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
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
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  if (!videoId) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 h-[700px] w-[1180px] overflow-hidden"
      style={{
        maskImage: "linear-gradient(to left, black 60%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to left, black 60%, transparent 100%)",
      }}
    >
      <div ref={containerRef} className="h-full w-full scale-125 opacity-80" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--tv-bg)] to-transparent" />
    </div>
  );
}
