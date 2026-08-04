import { PopcornIcon } from "./icons";

/**
 * Shown when there's no approved content at all. The design calls for the
 * parent dashboard's URL in a chip here — omitted for Phase 1 since that
 * dashboard doesn't exist yet (see the redesign plan); showing a URL that
 * doesn't resolve would be worse than not showing one.
 */
export default function TvNothingYet() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 text-center"
      style={{ background: "var(--tv-bg)", color: "var(--tv-text)", fontFamily: "var(--font-tv)" }}
    >
      <PopcornIcon className="h-20 w-20" style={{ color: "var(--tv-text-muted-2)" }} />
      <h1 className="font-medium" style={{ fontSize: 76 }}>
        Nothing to watch yet
      </h1>
      <p className="text-2xl" style={{ color: "var(--tv-text-muted)" }}>
        Ask a grown-up to add something!
      </p>
    </div>
  );
}
