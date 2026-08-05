"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VideoFolder, VideoCategory } from "@/components/WatchClient";
import { categoryThumbnail } from "@/lib/youtube-thumbs";
import { focusNearest, rememberFocus, recallFocus } from "@/lib/tv-focus";
import { MicIcon, KeyboardIcon, BackspaceIcon, BinocularsIcon, CheckIcon } from "./icons";

const SUGGESTIONS = ["Dinos", "Songs", "Diggers", "Space", "Bugs"];
const KEYBOARD_ROWS = ["ABCDEF", "GHIJKL", "MNOPQR", "STUVWX", "YZ0123", "456789"];

export default function TvSearch({
  folders,
  onOpenDetail,
  onGoToRail,
}: {
  folders: VideoFolder[];
  onOpenDetail: (category: VideoCategory) => void;
  onGoToRail: () => void;
}) {
  const [mode, setMode] = useState<"say" | "spell">("spell");
  const [query, setQuery] = useState("");
  const [focusedResult, setFocusedResult] = useState<VideoCategory | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // §2.3 says initial focus is the mic, but Phase 1 defaults to "Spell it"
    // (see the redesign plan's voice-search deviation) so the mic isn't
    // even mounted by default — the adapted equivalent is the toggle that
    // reveals it.
    leftColRef.current?.querySelector<HTMLElement>('[data-tv-zone="toggle"]')?.focus();
  }, []);

  // window.AndroidVoiceSearch only exists inside kids-kiosk-tv's WebView
  // (see MainActivity's addJavascriptInterface) — checked in an effect, not
  // inline in render, so server-rendered/first-paint markup (no window)
  // matches what hydration produces instead of mismatching against it.
  useEffect(() => {
    // Reading an external system's state (does this WebView expose the
    // bridge?), not deriving from props/state — the legitimate case the
    // lint rule's own guidance carves out.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoiceSupported(!!(window as unknown as { AndroidVoiceSearch?: unknown }).AndroidVoiceSearch);
  }, []);

  // Native → JS half of the bridge: VoiceSearchBridge calls these by name
  // via evaluateJavascript once recognition finishes, the same convention
  // MainActivity's own __tvRemotePlayPause already uses in the other
  // direction. Registered/torn down with this screen's lifetime so a result
  // that arrives after the user has already navigated away is a no-op.
  useEffect(() => {
    const win = window as unknown as {
      __tvVoiceSearchResult?: (text: string) => void;
      __tvVoiceSearchError?: (reason: string) => void;
    };
    win.__tvVoiceSearchResult = (text: string) => {
      setListening(false);
      setVoiceError(null);
      setQuery(text);
    };
    win.__tvVoiceSearchError = (reason: string) => {
      setListening(false);
      setVoiceError(reason);
    };
    return () => {
      delete win.__tvVoiceSearchResult;
      delete win.__tvVoiceSearchError;
    };
  }, []);

  function startVoiceSearch() {
    const bridge = (window as unknown as { AndroidVoiceSearch?: { startListening: () => void } }).AndroidVoiceSearch;
    if (!bridge) return;
    setVoiceError(null);
    setListening(true);
    bridge.startListening();
  }

  const allCategories = useMemo(() => folders.flatMap((f) => f.categories), [folders]);

  const results = useMemo(() => {
    if (!query.trim()) return allCategories;
    const q = query.trim().toLowerCase();
    return allCategories.filter(
      (c) => c.label.toLowerCase().includes(q) || c.videos.some((v) => v.title.toLowerCase().includes(q))
    );
  }, [allCategories, query]);

  function typeChar(ch: string) {
    setQuery((q) => q + ch);
  }
  function backspace() {
    setQuery((q) => q.slice(0, -1));
  }

  function leftColItems(): HTMLElement[] {
    return leftColRef.current
      ? Array.from(leftColRef.current.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]'))
      : [];
  }
  function gridItems(): HTMLElement[] {
    return gridRef.current
      ? Array.from(gridRef.current.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]'))
      : [];
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const direction =
      e.key === "ArrowUp" ? "up" : e.key === "ArrowDown" ? "down" : e.key === "ArrowLeft" ? "left" : e.key === "ArrowRight" ? "right" : null;
    if (!direction) return;

    const active = document.activeElement as HTMLElement | null;
    if (!active || !rootRef.current?.contains(active)) return;
    const zone = active.dataset.tvZone;

    e.preventDefault();

    // Try moving within the current zone first — this covers toggle<->toggle,
    // inside the keyboard grid (so a 6-column row doesn't jump away on the
    // very first right-press), inside the chips row, and inside the results
    // grid, all via plain nearest-neighbor geometry.
    const scopeRoot = zone === "grid" ? gridRef.current : leftColRef.current;
    if (focusNearest(direction, { root: scopeRoot ?? document })) return;

    // No candidate in that direction within the zone: a real boundary —
    // apply the explicit cross-zone/global rules from §2.3.
    if (direction === "right" && zone !== "grid") {
      rememberFocus("search:left", active);
      const remembered = recallFocus("search:grid");
      if (remembered && document.contains(remembered)) {
        remembered.focus();
        return;
      }
      gridItems()[0]?.focus();
      return;
    }
    if (direction === "left") {
      if (zone === "grid") {
        rememberFocus("search:grid", active);
        const remembered = recallFocus("search:left");
        if (remembered && document.contains(remembered)) {
          remembered.focus();
          return;
        }
        leftColItems()[0]?.focus();
        return;
      }
      onGoToRail();
      return;
    }
    if (direction === "up" && zone === "keyboard") {
      leftColRef.current?.querySelector<HTMLElement>('[data-tv-zone="toggle"]')?.focus();
      return;
    }
    if (direction === "down" && (zone === "toggle" || zone === "mic")) {
      const chip = leftColRef.current?.querySelector<HTMLElement>('[data-tv-zone="chips"]');
      (chip ?? leftColRef.current?.querySelector<HTMLElement>('[data-tv-zone="keyboard"]'))?.focus();
    }
  }

  const showNoResults = query.trim().length > 0 && results.length === 0;

  useEffect(() => {
    // §2.3: "No results → focus lands on the first suggestion chip." Also
    // matters mechanically, not just per spec: the results grid unmounts
    // entirely in this state, so if it had focus, focus would otherwise
    // fall back to document.body and stop reaching handleKeyDown at all.
    if (showNoResults) {
      leftColRef.current?.querySelector<HTMLElement>('[data-tv-zone="chips"]')?.focus();
    }
  }, [showNoResults]);

  return (
    <div
      ref={rootRef}
      onKeyDown={handleKeyDown}
      className="tv-screen-root flex h-full w-full gap-16 overflow-hidden pr-16 pt-16"
      style={{ background: "var(--tv-bg)", color: "var(--tv-text)", fontFamily: "var(--font-tv)" }}
    >
      <div ref={leftColRef} className="flex w-[600px] shrink-0 flex-col">
        <div className="mb-8 inline-flex w-fit overflow-hidden rounded-full" style={{ border: "1px solid var(--tv-divider)" }}>
          <button
            data-tv-focusable="true"
            data-tv-zone="toggle"
            onFocus={(e) => rememberFocus("screen:search", e.currentTarget)}
            onClick={() => setMode("say")}
            className="tv-focusable px-6 py-3 text-lg font-medium"
            style={{
              background: mode === "say" ? "var(--tv-accent-300)" : "transparent",
              color: mode === "say" ? "var(--tv-bg)" : "var(--tv-text)",
            }}
          >
            <span className="inline-flex items-center gap-2">
              <MicIcon className="h-5 w-5" /> Say it
            </span>
          </button>
          <button
            data-tv-focusable="true"
            data-tv-zone="toggle"
            onClick={() => setMode("spell")}
            className="tv-focusable px-6 py-3 text-lg font-medium"
            style={{
              background: mode === "spell" ? "var(--tv-accent-300)" : "transparent",
              color: mode === "spell" ? "var(--tv-bg)" : "var(--tv-text)",
            }}
          >
            <span className="inline-flex items-center gap-2">
              <KeyboardIcon className="h-5 w-5" /> Spell it
            </span>
          </button>
        </div>

        {mode === "say" ? (
          <div className="flex flex-col items-center pt-6 text-center">
            <button
              data-tv-focusable="true"
              data-tv-zone="mic"
              onFocus={(e) => rememberFocus("screen:search", e.currentTarget)}
              onClick={voiceSupported ? startVoiceSearch : undefined}
              className="tv-focusable flex items-center justify-center rounded-full"
              style={{
                width: 180,
                height: 180,
                background: listening ? "var(--tv-accent-300)" : "var(--tv-accent-800)",
              }}
            >
              <MicIcon className="h-16 w-16" style={{ color: listening ? "var(--tv-bg)" : "var(--tv-accent-300)" }} />
            </button>
            {voiceSupported ? (
              <p className="mt-8 text-2xl font-medium">
                {listening
                  ? "Listening…"
                  : voiceError
                    ? "Didn't catch that"
                    : query
                      ? `“${query}”`
                      : "Tap the mic and say a show name"}
              </p>
            ) : (
              <>
                <p className="mt-8 text-2xl font-medium">Voice search is coming soon</p>
                <p className="mt-2 text-lg" style={{ color: "var(--tv-text-muted)" }}>
                  Try &ldquo;Spell it&rdquo; for now
                </p>
              </>
            )}
            {voiceSupported && voiceError && (
              <p className="mt-2 text-lg" style={{ color: "var(--tv-text-muted)" }}>
                {voiceError === "permission-denied" ? "Ask a grown-up to allow the microphone." : "Try again, or use “Spell it”."}
              </p>
            )}
          </div>
        ) : (
          <>
            <div
              className="mb-4 rounded-xl px-4 py-3 text-2xl"
              style={{ background: "var(--tv-surface)", minHeight: 56 }}
            >
              {query || <span style={{ color: "var(--tv-text-muted-3)" }}>Type a show name…</span>}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {KEYBOARD_ROWS.map((rowChars, rowIdx) =>
                rowChars.split("").map((ch) => (
                  <button
                    key={ch}
                    data-tv-focusable="true"
                    data-tv-zone="keyboard"
                    data-tv-key-row={rowIdx}
                    onFocus={(e) => rememberFocus("screen:search", e.currentTarget)}
                    onClick={() => typeChar(ch)}
                    className="tv-focusable flex items-center justify-center rounded-lg text-xl font-medium"
                    style={{ width: 70, height: 70, background: "var(--tv-surface)" }}
                  >
                    {ch}
                  </button>
                ))
              )}
              <button
                data-tv-focusable="true"
                data-tv-zone="keyboard"
                data-tv-key-row={6}
                onClick={backspace}
                className="tv-focusable col-span-2 flex items-center justify-center gap-2 rounded-lg text-lg font-medium"
                style={{ height: 70, background: "var(--tv-surface)" }}
              >
                <BackspaceIcon className="h-5 w-5" /> Delete
              </button>
              <button
                data-tv-focusable="true"
                data-tv-zone="keyboard"
                data-tv-key-row={6}
                onClick={() => typeChar(" ")}
                className="tv-focusable col-span-2 flex items-center justify-center rounded-lg text-lg font-medium"
                style={{ height: 70, background: "var(--tv-surface)" }}
              >
                Space
              </button>
              <button
                data-tv-focusable="true"
                data-tv-zone="keyboard"
                data-tv-key-row={6}
                onClick={() => setQuery("")}
                className="tv-focusable col-span-2 flex items-center justify-center rounded-lg text-lg font-medium"
                style={{ height: 70, background: "var(--tv-surface)" }}
              >
                Clear
              </button>
            </div>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              data-tv-focusable="true"
              data-tv-zone="chips"
              onFocus={(e) => rememberFocus("screen:search", e.currentTarget)}
              onClick={() => {
                setMode("spell");
                setQuery(s);
              }}
              className="tv-focusable rounded-full px-5 py-2 text-lg font-medium"
              style={{ background: "var(--tv-surface)" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {focusedResult && (
          <div className="mb-6 flex gap-4">
            <div className="h-[140px] w-[250px] overflow-hidden rounded-xl" style={{ background: "var(--tv-surface)" }}>
              {categoryThumbnail(focusedResult) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={categoryThumbnail(focusedResult)} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-2xl font-medium">{focusedResult.label}</p>
              <p className="mt-1 flex items-center gap-2 text-lg" style={{ color: "var(--tv-accent-2-300)" }}>
                <span>
                  {focusedResult.videos.length} episode{focusedResult.videos.length === 1 ? "" : "s"}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-sm"
                  style={{ background: "var(--tv-accent-800)", color: "var(--tv-accent-100)" }}
                >
                  {focusedResult.videos[0]?.source === "stremio" ? "Stremio" : "YouTube"}
                </span>
              </p>
              <p className="mt-2 max-w-[500px] text-base" style={{ color: "var(--tv-text-muted)" }}>
                {focusedResult.videos[0]?.title}
              </p>
            </div>
          </div>
        )}

        {showNoResults ? (
          <div
            className="mt-4 flex max-w-[600px] flex-col items-center gap-3 rounded-2xl p-10 text-center"
            style={{ border: "2px dashed var(--tv-divider)" }}
          >
            <BinocularsIcon className="h-12 w-12" style={{ color: "var(--tv-text-muted-2)" }} />
            <p className="text-2xl font-medium">Nothing by that name yet</p>
            <p style={{ color: "var(--tv-text-muted)" }}>Try one of these instead:</p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-3 gap-4">
            {results.map((c) => (
              <button
                key={c.id}
                data-tv-focusable="true"
                data-tv-zone="grid"
                onFocus={(e) => {
                  setFocusedResult(c);
                  rememberFocus("screen:search", e.currentTarget);
                }}
                onClick={() => onOpenDetail(c)}
                className="tv-focusable relative aspect-video overflow-hidden rounded-xl"
                style={{ width: 168, background: "var(--tv-surface)" }}
              >
                {categoryThumbnail(c) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={categoryThumbnail(c)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {c.videos[0]?.source === "stremio" && (
                  // Same disambiguation as Home rows — a search is exactly where a
                  // YouTube-clips result and a Stremio-series result for the same
                  // name are most likely to land side by side.
                  <span
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: "var(--tv-accent-800)", color: "var(--tv-accent-100)" }}
                  >
                    {c.videos.length > 1 ? "Series" : "Movie"}
                  </span>
                )}
                {c.videos.length > 0 && c.videos.every((v) => v.watched) && (
                  <span
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "var(--tv-accent-300)" }}
                    aria-label="Watched"
                  >
                    <CheckIcon className="h-3.5 w-3.5" style={{ color: "var(--tv-bg)" }} />
                  </span>
                )}
                <span className="absolute bottom-2 left-2 right-2 truncate text-sm font-medium" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
