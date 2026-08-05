"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoFolder, VideoCategory } from "@/components/WatchClient";
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

  function toggleFavourite(categoryId: string) {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
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
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: "var(--tv-bg)" }}>
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
            isFavourite={favourites.has(activeCategory.id)}
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
