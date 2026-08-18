"use client";

import { useEffect, useMemo, useRef } from "react";
import type { VideoFolder, VideoCategory } from "@/components/WatchClient";
import { categoryMatchesFavourite } from "@/lib/category-merge-id";
import { categoryThumbnail } from "@/lib/youtube-thumbs";
import { focusNearest, rememberFocus } from "@/lib/tv-focus";
import { HeartIcon, CheckIcon } from "./icons";

export default function TvFavourites({
  folders,
  favouriteIds,
  onOpenDetail,
  onGoToRail,
}: {
  folders: VideoFolder[];
  favouriteIds: Set<string>;
  onOpenDetail: (category: VideoCategory) => void;
  onGoToRail: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const favourites = useMemo(
    () => folders.flatMap((f) => f.categories).filter((c) => categoryMatchesFavourite(c.id, favouriteIds)),
    [folders, favouriteIds]
  );

  useEffect(() => {
    rootRef.current?.querySelector<HTMLElement>('[data-tv-focusable="true"]')?.focus();
  }, [favourites.length]);

  function handleKeyDown(e: React.KeyboardEvent) {
    const direction =
      e.key === "ArrowUp" ? "up" : e.key === "ArrowDown" ? "down" : e.key === "ArrowLeft" ? "left" : e.key === "ArrowRight" ? "right" : null;
    if (!direction) return;
    const active = document.activeElement as HTMLElement | null;
    if (!active || !rootRef.current?.contains(active)) return;
    e.preventDefault();
    if (focusNearest(direction, { root: rootRef.current })) return;
    if (direction === "left") onGoToRail();
  }

  return (
    <div
      ref={rootRef}
      onKeyDown={handleKeyDown}
      className="tv-screen-root h-full w-full overflow-y-auto pr-16 pt-16"
      style={{ background: "var(--tv-bg)", color: "var(--tv-text)", fontFamily: "var(--font-tv)" }}
    >
      <h1 className="font-medium" style={{ fontSize: 52 }}>
        Favourites
      </h1>

      {favourites.length === 0 ? (
        <p className="mt-6 max-w-[600px] text-xl" style={{ color: "var(--tv-text-muted)" }}>
          Nothing here yet — press the heart on a show&apos;s page to add it.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-4 gap-5">
          {favourites.map((c) => (
            <button
              key={c.id}
              data-tv-focusable="true"
              onFocus={(e) => rememberFocus("screen:favourites", e.currentTarget)}
              onClick={() => onOpenDetail(c)}
              className="tv-focusable relative aspect-video overflow-hidden rounded-2xl text-left"
              style={{ background: "var(--tv-surface)" }}
            >
              {categoryThumbnail(c) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={categoryThumbnail(c)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {(() => {
                const stremioVideo = c.videos.find((v) => v.source === "stremio");
                return stremioVideo ? (
                  <span
                    className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-sm font-medium"
                    style={{ background: "var(--tv-accent-800)", color: "var(--tv-accent-100)" }}
                  >
                    {stremioVideo.mediaType === "movie" ? "Movie" : "Series"}
                  </span>
                ) : null;
              })()}
              {c.videos.length > 0 && c.videos.every((v) => v.watched) && (
                // Left of the heart icon, not near the bottom title — same
                // reasoning as Home's tiles (titles here can wrap to 2
                // lines and reach close to the tile's full width).
                <span
                  className="absolute right-11 top-3 flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: "var(--tv-accent-300)" }}
                  aria-label="Watched"
                >
                  <CheckIcon className="h-3.5 w-3.5" style={{ color: "var(--tv-bg)" }} />
                </span>
              )}
              <HeartIcon filled className="absolute right-3 top-3 h-6 w-6" style={{ color: "var(--tv-accent-300)" }} />
              <span className="absolute bottom-3 left-3 right-3 text-lg font-medium" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
