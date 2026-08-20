"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoFolder, VideoCategory } from "@/components/WatchClient";
import { categoryMatchesFavourite, toggleFavouriteId } from "@/lib/category-merge-id";
import type { ApprovedVideo } from "@/lib/watch-folders";
import NavRail, { type TvScreen } from "@/components/tv/NavRail";
import TvHome from "@/components/tv/TvHome";
import TvDetail from "@/components/tv/TvDetail";
import TvPlayer from "@/components/tv/TvPlayer";
import TvSearch from "@/components/tv/TvSearch";
import TvParentControls from "@/components/tv/TvParentControls";
import TvFavourites from "@/components/tv/TvFavourites";
import TvNothingYet from "@/components/tv/TvNothingYet";
import { useTvScale } from "@/lib/use-tv-scale";

type Screen = TvScreen | "detail" | "player";

const FAVOURITES_STORAGE_KEY = "kk_tv_favourites";

// A kiosk WebView loads once and can sit open for days without ever
// navigating again — force-dynamic pages only pick up new code or newly
// approved content on an actual fresh request, so without this, a deploy or
// an approval can go invisible on-screen indefinitely. AUTO_REFRESH bounds
// that staleness on a timer; the poll interval is short so a parent's
// "Refresh TV" click (app/parents/(protected)/actions.ts, via
// lib/refresh-signal.ts) lands in seconds instead of waiting the full
// interval. Both only ever reload while off the player screen — see
// reloadIfSafe below.
const AUTO_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const FORCE_REFRESH_POLL_INTERVAL_MS = 15 * 1000;

// A touchscreen tablet has no equivalent to "the remote hasn't moved in a
// while" — a kid can be mid-tap or mid-scroll on Home/Search at the exact
// moment a reload fires, which reads as the app randomly glitching. Holding
// off until interaction has been quiet for a beat avoids catching someone
// mid-gesture; on the TV (mostly sitting on the player screen, which is
// already excluded below) this rarely changes anything.
const INTERACTION_QUIET_MS = 2 * 1000;

function focusRail() {
  // Next.js's streaming SSR can leave a hidden (display:none) duplicate of
  // the tree in the DOM — offsetParent is null for anything inside it, so
  // filtering on that avoids grabbing the invisible copy and silently
  // failing to focus (a display:none element can never receive focus).
  const candidates = document.querySelectorAll<HTMLElement>(
    '[data-tv-rail="true"] [data-tv-focusable="true"]'
  );
  const first = Array.from(candidates).find((el) => el.offsetParent !== null);
  first?.focus();
}

/**
 * Orchestrates the redesigned /tv experience: one client component tree
 * with internal screen state (not real Next.js routes — a TV app needs
 * continuous focus-manager state and zero route-transition flicker) and
 * the same history-marker/popstate back-button pattern WatchClient already
 * established, extended to this screen's stack: player -> detail -> home,
 * and search/favourites/parent -> home. Home itself lets the WebView's own
 * back handling exit the app, same as before.
 */
export default function TvApp({ folders }: { folders: VideoFolder[] }) {
  const scale = useTvScale();
  const [screen, setScreen] = useState<Screen>("home");
  const [activeCategory, setActiveCategory] = useState<VideoCategory | null>(null);
  const [activeVideo, setActiveVideo] = useState<ApprovedVideo | null>(null);
  const [nextCardOpen, setNextCardOpen] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  const markerArmedRef = useRef(false);
  const screenRef = useRef(screen);
  const nextCardOpenRef = useRef(nextCardOpen);
  const lastInteractionRef = useRef(0);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    nextCardOpenRef.current = nextCardOpen;
  }, [nextCardOpen]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVOURITES_STORAGE_KEY);
      // Reading localStorage is only possible client-side, so favourites
      // are hydrated once after mount rather than during render — same
      // pattern as ProfileContext's profile hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setFavourites(new Set(JSON.parse(raw)));
    } catch {
      // corrupt/absent storage — start with no favourites
    }
  }, []);

  useEffect(() => {
    function markInteraction() {
      lastInteractionRef.current = Date.now();
    }
    window.addEventListener("pointerdown", markInteraction);
    window.addEventListener("keydown", markInteraction);

    function reloadIfSafe() {
      // Never reload out from under an actually-playing video — only the
      // browse screens (Home/Search/Detail/...) are safe to interrupt. Also
      // hold off mid-gesture on a touch device (see INTERACTION_QUIET_MS) —
      // the force-refresh poll below retries every tick until this passes,
      // same as it already does for the player-screen check.
      if (screenRef.current !== "player" && Date.now() - lastInteractionRef.current > INTERACTION_QUIET_MS) {
        window.location.reload();
      }
    }

    const autoTimer = setInterval(reloadIfSafe, AUTO_REFRESH_INTERVAL_MS);

    // undefined = not yet baselined; null is a legitimate signal value
    // (nobody has clicked "Refresh TV" since the last server restart), so
    // it can't double as the sentinel.
    let baseline: number | null | undefined;
    let cancelled = false;

    async function checkForceRefresh() {
      try {
        const res = await fetch("/api/tv/refresh-signal", { cache: "no-store" });
        const data: { requestedAt: number | null } = await res.json();
        if (cancelled) return;
        if (baseline === undefined) {
          baseline = data.requestedAt;
          return;
        }
        // Deliberately don't advance `baseline` here: if a request lands
        // while a video is mid-play, reloadIfSafe no-ops, and the next poll
        // (up to FORCE_REFRESH_POLL_INTERVAL_MS later) sees the same
        // still-unhandled change and tries again, until it's actually safe.
        if (data.requestedAt !== baseline) {
          reloadIfSafe();
        }
      } catch {
        // offline or server mid-restart — next tick tries again
      }
    }
    checkForceRefresh();
    const pollTimer = setInterval(checkForceRefresh, FORCE_REFRESH_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(autoTimer);
      clearInterval(pollTimer);
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("keydown", markInteraction);
    };
  }, []);

  function toggleFavourite(categoryId: string) {
    setFavourites((prev) => {
      const next = toggleFavouriteId(categoryId, prev);
      try {
        localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // best-effort only — favourites are a local-only convenience in Phase 1
      }
      return next;
    });
  }

  function ensureMarker() {
    if (markerArmedRef.current) return;
    history.pushState({ marker: true }, "");
    markerArmedRef.current = true;
  }

  useEffect(() => {
    function onPopState() {
      markerArmedRef.current = false;

      if (nextCardOpenRef.current) {
        setNextCardOpen(false);
        ensureMarker();
        return;
      }

      const current = screenRef.current;
      if (current === "player") {
        setScreen("detail");
        ensureMarker();
        return;
      }
      if (current !== "home") {
        setActiveCategory(null);
        setScreen("home");
        ensureMarker();
        return;
      }
      // already home — let the WebView's own back handling exit the app
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function openDetail(category: VideoCategory) {
    setActiveCategory(category);
    setScreen("detail");
    ensureMarker();
  }

  function playVideo(video: ApprovedVideo) {
    setActiveVideo(video);
    setNextCardOpen(false);
    setScreen("player");
    ensureMarker();
  }

  function navigate(target: TvScreen) {
    if (target === "home") {
      setScreen("home");
      setActiveCategory(null);
      return;
    }
    setScreen(target);
    ensureMarker();
  }

  const railActive: TvScreen =
    screen === "detail" || screen === "player" ? "home" : (screen as TvScreen);

  const hasContent = folders.some((f) => f.categories.length > 0);
  if (!hasContent) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center overflow-auto"
        // "safe center" (inline, overriding the Tailwind items-/justify-center
        // classes): plain `center` alignment on a flex item bigger than its
        // container pushes half the overflow into space most browsers won't
        // let you scroll into — content stays centered when it fits (the
        // common case) but falls back to start-aligned, fully reachable via
        // scroll, once the scale floor (lib/use-tv-scale.ts) makes it not fit.
        style={{ background: "var(--tv-bg)", alignItems: "safe center", justifyContent: "safe center" }}
      >
        {/* shrink-0: without it, this is a flex item with no flex-shrink
            override, so the flex algorithm compresses its *width* (not
            height — items-center doesn't stretch the cross axis) to fit
            the viewport, on top of — not instead of — the scale transform
            below. That compounds into a squashed, non-uniform result. */}
        <div className="shrink-0" style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "center center" }}>
          <TvNothingYet />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: "var(--tv-bg)" }}>
      {/* shrink-0: see the comment on the equivalent !hasContent branch above.
          Each screen's root uses peer-focus-within: (not group-focus-within:)
          to shift its content only while the rail is actually expanded — see
          NavRail's own doc comment for why it has to be peer, not group. */}
      <div
        className="relative shrink-0"
        style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "center center" }}
      >
        {screen !== "player" && <NavRail active={railActive} onNavigate={navigate} />}

        {screen === "home" && (
          <TvHome folders={folders} onOpenDetail={openDetail} onGoToRail={focusRail} />
        )}

        {screen === "detail" && activeCategory && (
          <TvDetail
            category={activeCategory}
            folders={folders}
            isFavourite={categoryMatchesFavourite(activeCategory.id, favourites)}
            onToggleFavourite={() => toggleFavourite(activeCategory.id)}
            onPlay={playVideo}
            onBack={() => history.back()}
            onOpenDetail={openDetail}
            onGoToRail={focusRail}
          />
        )}

        {screen === "player" && activeVideo && activeCategory && (
          <TvPlayer
            video={activeVideo}
            category={activeCategory}
            nextCardOpen={nextCardOpen}
            onNextCardOpenChange={setNextCardOpen}
            onBack={() => history.back()}
            onHome={() => {
              setScreen("home");
              setActiveCategory(null);
              setActiveVideo(null);
            }}
            onAdvance={playVideo}
          />
        )}

        {screen === "search" && (
          <TvSearch folders={folders} onOpenDetail={openDetail} onGoToRail={focusRail} />
        )}

        {screen === "parent" && <TvParentControls onGoToRail={focusRail} />}

        {screen === "favourites" && (
          <TvFavourites
            folders={folders}
            favouriteIds={favourites}
            onOpenDetail={openDetail}
            onGoToRail={focusRail}
          />
        )}
      </div>
    </div>
  );
}
