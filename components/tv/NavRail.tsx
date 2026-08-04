"use client";

import { useRef } from "react";
import { HomeIcon, SearchIcon, HeartIcon, GearIcon } from "./icons";
import { focusNearest, focusPreservingIndex, recallFocus, rememberFocus } from "@/lib/tv-focus";

export type TvScreen = "home" | "search" | "favourites" | "parent";

const ITEMS: { id: TvScreen; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "search", label: "Search", Icon: SearchIcon },
  { id: "favourites", label: "Favourites", Icon: HeartIcon },
  { id: "parent", label: "Grown-ups", Icon: GearIcon },
];

/**
 * Left nav rail — 96px collapsed, expands to 320px with labels on focus.
 * §2.1: Left from the leftmost element on any screen moves focus here;
 * Right returns focus to wherever it was on that screen (tracked via
 * lib/tv-focus's rememberFocus/recallFocus, keyed by the current screen id
 * so each screen gets its own "last focused" memory).
 */
export default function NavRail({
  active,
  onNavigate,
}: {
  active: TvScreen;
  onNavigate: (screen: TvScreen) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  function handleRailKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      // Movement between the rail's own buttons — easy to overlook since
      // the rail only ever gets exercised via Left/Right from the content
      // side; it needs its own up/down nav like everything else does.
      e.preventDefault();
      focusNearest(e.key === "ArrowUp" ? "up" : "down", { root: railRef.current ?? document });
      return;
    }
    if (e.key !== "ArrowRight") return;
    e.preventDefault();
    const remembered = recallFocus(`screen:${active}`);
    if (remembered && document.contains(remembered)) {
      remembered.focus();
      return;
    }
    const items = railRef.current
      ? Array.from(railRef.current.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]'))
      : [];
    focusPreservingIndex(items, 0);
  }

  return (
    <div
      ref={railRef}
      data-tv-rail="true"
      onKeyDown={handleRailKeyDown}
      className="group absolute inset-y-0 left-0 z-20 flex w-24 flex-col items-start gap-2 overflow-hidden py-8 pl-6 transition-[width] duration-200 focus-within:w-80"
      style={{
        background: "linear-gradient(to right, rgba(10,11,18,0.85), transparent)",
      }}
    >
      <div
        className="mb-8 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
        style={{ background: "var(--tv-accent-800)" }}
        aria-hidden="true"
      >
        🍿
      </div>

      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          data-tv-focusable="true"
          onFocus={(e) => rememberFocus("rail", e.currentTarget)}
          onClick={() => onNavigate(id)}
          className="tv-focusable flex h-11 w-11 shrink-0 items-center justify-center gap-3 rounded-xl group-focus-within:w-full group-focus-within:justify-start group-focus-within:px-3"
          style={{
            color: active === id ? "var(--tv-text)" : "var(--tv-text-muted-3)",
            background: active === id ? "var(--tv-surface)" : "transparent",
          }}
        >
          <Icon className="h-6 w-6 shrink-0" />
          <span className="hidden whitespace-nowrap text-lg font-medium group-focus-within:inline">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
