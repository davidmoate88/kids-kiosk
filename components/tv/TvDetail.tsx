"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoFolder, VideoCategory } from "@/components/WatchClient";
import type { ApprovedVideo } from "@/lib/watch-folders";
import { categoryThumbnail, videoThumbnail } from "@/lib/youtube-thumbs";
import { focusNearest, focusPreservingIndex, rememberFocus, recallFocus } from "@/lib/tv-focus";
import { ChevronLeftIcon, PlayIcon, HeartIcon } from "./icons";

const EPISODES_SHOWN_INITIALLY = 3;

export default function TvDetail({
  category,
  folders,
  isFavourite,
  onToggleFavourite,
  onPlay,
  onBack,
  onOpenDetail,
  onGoToRail,
}: {
  category: VideoCategory;
  folders: VideoFolder[];
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onPlay: (video: ApprovedVideo) => void;
  onBack: () => void;
  onOpenDetail: (category: VideoCategory) => void;
  onGoToRail: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const episodeListRef = useRef<HTMLDivElement>(null);
  const moreListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // §2.4: initial focus is "Play episode 1" — every screen must set its
    // own initial focus explicitly, browser default focus order (nothing
    // focused, falls back to body) isn't good enough for a D-pad app.
    playButtonRef.current?.focus();
  }, []);

  const visibleEpisodes = expanded ? category.videos : category.videos.slice(0, EPISODES_SHOWN_INITIALLY);
  const remaining = category.videos.length - EPISODES_SHOWN_INITIALLY;

  useEffect(() => {
    // The "+N more" row (which had focus to be clickable at all) unmounts
    // the moment it's expanded, replaced by the rest of the episode list —
    // without this, focus would fall back to document.body and stop
    // reaching handleKeyDown. Landing on the first newly-revealed episode
    // is also just the natural continuation of where the user was.
    if (!expanded) return;
    episodeListRef.current
      ?.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]')[EPISODES_SHOWN_INITIALLY]
      ?.focus();
  }, [expanded]);

  const moreLikeThis = folders
    .flatMap((f) => f.categories)
    .filter((c) => c.id !== category.id)
    .slice(0, 6);

  function episodeItems(): HTMLElement[] {
    return episodeListRef.current
      ? Array.from(episodeListRef.current.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]'))
      : [];
  }
  function moreItems(): HTMLElement[] {
    return moreListRef.current
      ? Array.from(moreListRef.current.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]'))
      : [];
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const active = document.activeElement as HTMLElement | null;
    if (!active || !rootRef.current?.contains(active)) return;
    const zone = active.dataset.tvZone;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (zone === "actions") return; // already top
      if (zone === "episodes") {
        const items = episodeItems();
        if (items.indexOf(active) === 0) playButtonRef.current?.focus();
        else focusPreservingIndex(items, items.indexOf(active) - 1);
      }
      if (zone === "more") focusNearest("up", { root: moreListRef.current ?? document });
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (zone === "actions") {
        const items = episodeItems();
        if (items.length) items[0].focus();
        return;
      }
      if (zone === "episodes") {
        const items = episodeItems();
        const idx = items.indexOf(active);
        if (idx < items.length - 1) items[idx + 1].focus();
      }
      if (zone === "more") focusNearest("down", { root: moreListRef.current ?? document });
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (zone === "more") {
        // Try the grid's own left column first — only leave the grid
        // entirely once there's nothing further left within it.
        if (focusNearest("left", { root: moreListRef.current ?? document })) return;
        rememberFocus("detail:more", active);
        const remembered = recallFocus("detail:episodes");
        if (remembered && document.contains(remembered)) remembered.focus();
        else episodeItems()[0]?.focus();
      } else if (zone === "actions") {
        // Try moving to the other action button first ("Add to
        // favourites" -> "Play episode 1"); only reach the rail once
        // there's nothing further left.
        if (!focusNearest("left", { root: rootRef.current ?? document, selector: '[data-tv-zone="actions"]' })) {
          onGoToRail();
        }
      } else if (zone === "episodes") {
        onGoToRail();
      }
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (zone === "actions") {
        focusNearest("right", { root: rootRef.current ?? document, selector: '[data-tv-zone="actions"]' });
      }
      if (zone === "episodes") {
        rememberFocus("detail:episodes", active);
        const remembered = recallFocus("detail:more");
        if (remembered && document.contains(remembered)) remembered.focus();
        else moreItems()[0]?.focus();
      }
      if (zone === "more") focusNearest("right", { root: moreListRef.current ?? document });
    }
  }

  const firstVideo = category.videos[0];

  return (
    <div
      ref={rootRef}
      onKeyDown={handleKeyDown}
      className="relative h-full w-full overflow-y-auto pb-16 pl-[180px] pt-16"
      style={{ background: "var(--tv-bg)", color: "var(--tv-text)", fontFamily: "var(--font-tv)" }}
    >
      <button
        data-tv-focusable="true"
        data-tv-zone="actions"
        onFocus={(e) => rememberFocus("screen:detail", e.currentTarget)}
        onClick={onBack}
        className="tv-focusable mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-lg font-medium"
        style={{ background: "var(--tv-surface)" }}
      >
        <ChevronLeftIcon className="h-5 w-5" /> Back
      </button>

      <h1 className="max-w-[900px] font-medium" style={{ fontSize: 88, lineHeight: 1.02 }}>
        {category.label}
      </h1>

      <p className="mt-3 flex items-center gap-3 text-2xl whitespace-nowrap" style={{ color: "var(--tv-accent-2-300)" }}>
        <span>
          {category.videos.length} episode{category.videos.length === 1 ? "" : "s"}
        </span>
        <span
          className="rounded-full px-3 py-1 text-base"
          style={{ background: "var(--tv-accent-800)", color: "var(--tv-accent-100)" }}
        >
          YouTube
        </span>
      </p>

      {firstVideo && (
        <p className="mt-4 max-w-[700px] text-[28px] leading-[1.4]" style={{ color: "var(--tv-text-muted)" }}>
          {firstVideo.title}
        </p>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          ref={playButtonRef}
          data-tv-focusable="true"
          data-tv-zone="actions"
          onClick={() => firstVideo && onPlay(firstVideo)}
          className="tv-focusable rounded-xl text-[26px] font-medium"
          style={{ padding: "18px 34px", background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
        >
          <span className="inline-flex items-center gap-2">
            <PlayIcon className="h-6 w-6" /> Play episode 1
          </span>
        </button>
        <button
          data-tv-focusable="true"
          data-tv-zone="actions"
          onClick={onToggleFavourite}
          className="tv-focusable rounded-xl border text-[26px] font-medium"
          style={{ padding: "18px 34px", borderColor: "var(--tv-divider)" }}
        >
          <span className="inline-flex items-center gap-2">
            <HeartIcon className="h-6 w-6" filled={isFavourite} />
            {isFavourite ? "In favourites" : "Add to favourites"}
          </span>
        </button>
      </div>

      <div className="mt-10 flex gap-16">
        <div ref={episodeListRef} className="flex w-[600px] flex-col gap-3">
          {visibleEpisodes.map((video, idx) => (
            <button
              key={video.id}
              data-tv-focusable="true"
              data-tv-zone="episodes"
              onFocus={(e) => rememberFocus("screen:detail", e.currentTarget)}
              onClick={() => onPlay(video)}
              className="tv-focusable flex items-center gap-4 rounded-2xl p-2 text-left"
              style={{ background: "var(--tv-surface)" }}
            >
              <span className="relative h-24 w-[172px] shrink-0 overflow-hidden rounded-xl bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={videoThumbnail(video)} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[26px] font-medium">{video.title}</span>
                <span className="text-[21px]" style={{ color: "var(--tv-text-muted-2)" }}>
                  Episode {idx + 1}
                </span>
              </span>
            </button>
          ))}

          {!expanded && remaining > 0 && (
            <button
              data-tv-focusable="true"
              data-tv-zone="episodes"
              onFocus={(e) => rememberFocus("screen:detail", e.currentTarget)}
              onClick={() => setExpanded(true)}
              className="tv-focusable rounded-2xl p-4 text-left text-[22px] font-medium"
              style={{ color: "var(--tv-accent-300)", background: "var(--tv-surface)" }}
            >
              +{remaining} more episodes
            </button>
          )}
        </div>

        {moreLikeThis.length > 0 && (
          <div className="w-[520px]">
            <h2 className="mb-3 text-lg font-semibold">More like this</h2>
            <div ref={moreListRef} className="grid grid-cols-2 gap-4">
              {moreLikeThis.map((c) => (
                <button
                  key={c.id}
                  data-tv-focusable="true"
                  data-tv-zone="more"
                  onFocus={(e) => rememberFocus("screen:detail", e.currentTarget)}
                  onClick={() => onOpenDetail(c)}
                  className="tv-focusable relative aspect-video overflow-hidden rounded-xl"
                  style={{ background: "var(--tv-surface)" }}
                >
                  {categoryThumbnail(c) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={categoryThumbnail(c)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 right-2 text-lg font-medium" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
