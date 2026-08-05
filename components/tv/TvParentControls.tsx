"use client";

import { useEffect, useRef } from "react";
import { focusNearest, rememberFocus } from "@/lib/tv-focus";
import { GearIcon, SearchIcon, HeartIcon, HomeIcon } from "./icons";

const CARDS = [
  { Icon: SearchIcon, title: "Sources", body: "Connect Stremio and YouTube channels to pull shows from." },
  { Icon: HeartIcon, title: "Approve titles", body: "Pick exactly what shows up here for the kids." },
  { Icon: HomeIcon, title: "Waiting", body: "Review new episodes and uploads before they're allowed." },
  { Icon: GearIcon, title: "Rules", body: "Automations for what gets approved without asking." },
];

/**
 * Read-only on-TV mirror of the (not-yet-built) parent dashboard — exists
 * to tell a parent where to go, not to let them configure anything with a
 * remote. See the Phase-1 plan: this deliberately isn't a real gate.
 */
export default function TvParentControls({ onGoToRail }: { onGoToRail: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.querySelector<HTMLElement>('[data-tv-focusable="true"]')?.focus();
  }, []);

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
        Grown-ups
      </h1>
      <p className="mt-2 max-w-[700px] text-xl" style={{ color: "var(--tv-text-muted)" }}>
        These are managed from the parent dashboard, not from here.
      </p>

      <div className="mt-8 grid grid-cols-4 gap-5">
        {CARDS.map(({ Icon, title, body }) => (
          <div
            key={title}
            data-tv-focusable="true"
            tabIndex={0}
            onFocus={(e) => rememberFocus("screen:parent", e.currentTarget)}
            className="tv-focusable flex flex-col gap-3 rounded-2xl p-5"
            style={{ background: "var(--tv-surface)" }}
          >
            <div className="flex items-center justify-between">
              <Icon className="h-7 w-7" style={{ color: "var(--tv-accent-300)" }} />
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
                style={{ background: "var(--tv-accent-800)", color: "var(--tv-accent-100)" }}
              >
                Coming soon
              </span>
            </div>
            <p className="text-xl font-medium">{title}</p>
            <p className="text-base" style={{ color: "var(--tv-text-muted-2)" }}>
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
