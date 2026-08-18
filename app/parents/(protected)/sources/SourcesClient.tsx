"use client";

import { useActionState, useTransition } from "react";
import type { catalogues } from "@/db/schema";
import {
  addCatalogue,
  type AddCatalogueState,
  syncNow,
  toggleAutoApprove,
  toggleSyncEnabled,
  updateCatalogueFolder,
} from "./actions";

type CatalogueRow = typeof catalogues.$inferSelect;

const DEFAULT_FOLDER_SUGGESTIONS = ["Songs & Learning", "Disney Junior", "Superheroes", "Everyday Adventures", "Vehicles"];

const fieldStyle = { background: "var(--tv-bg)", border: "1px solid var(--tv-divider)" } as const;

// A fixed locale/timeZone (rather than the environment default) keeps this
// identical between server render and browser hydration — otherwise the
// server's locale and the browser's disagree on date format and React
// throws a hydration mismatch.
function formatSyncTime(date: Date) {
  return new Date(date).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function SourcesClient({
  catalogues,
  addCatalogueAction,
}: {
  catalogues: CatalogueRow[];
  addCatalogueAction: typeof addCatalogue;
}) {
  const [state, formAction, pending] = useActionState<AddCatalogueState, FormData>(addCatalogueAction, undefined);
  const [, startTransition] = useTransition();
  const folderSuggestions = [...new Set([...DEFAULT_FOLDER_SUGGESTIONS, ...catalogues.map((c) => c.folder)])];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {catalogues.length === 0 && (
          <p className="text-sm" style={{ color: "var(--tv-text-muted)" }}>
            No sources yet — add one below.
          </p>
        )}
        {catalogues.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-4 rounded-lg p-4"
            style={{ background: "var(--tv-surface)" }}
          >
            <div className="min-w-48 flex-1">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs" style={{ color: "var(--tv-text-muted)" }}>
                {c.kind} ·{" "}
                {c.status === "error"
                  ? "last sync failed"
                  : c.lastSyncAt
                    ? `synced ${formatSyncTime(c.lastSyncAt)}`
                    : "never synced"}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              Folder
              <input
                defaultValue={c.folder}
                list="folder-suggestions"
                className="w-40 rounded-lg px-2 py-1 text-sm"
                style={fieldStyle}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (!next || next === c.folder) return;
                  startTransition(() => {
                    updateCatalogueFolder(c.id, next);
                  });
                }}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={c.autoApproveNewEpisodes}
                onChange={(e) => {
                  const next = e.target.checked;
                  startTransition(() => {
                    toggleAutoApprove(c.id, next);
                  });
                }}
              />
              Auto-approve new episodes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={c.syncEnabled}
                onChange={(e) => {
                  const next = e.target.checked;
                  startTransition(() => {
                    toggleSyncEnabled(c.id, next);
                  });
                }}
              />
              Sync enabled
            </label>
            <button
              type="button"
              onClick={() => startTransition(() => syncNow(c.id))}
              className="rounded-lg px-3 py-1.5 text-sm"
              style={{ border: "1px solid var(--tv-divider)" }}
            >
              Sync now
            </button>
          </div>
        ))}
      </div>

      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-lg p-4"
        style={{ background: "var(--tv-surface)" }}
      >
        <h2 className="text-sm font-semibold">Add a source</h2>
        <div className="flex flex-wrap gap-3">
          <select name="kind" className="rounded-lg px-3 py-2 text-sm" style={fieldStyle}>
            <option value="channel">Channel</option>
            <option value="playlist">Playlist</option>
          </select>
          <input
            name="externalId"
            placeholder="Channel or playlist ID"
            className="min-w-56 flex-1 rounded-lg px-3 py-2 text-sm"
            style={fieldStyle}
          />
          <input
            name="name"
            placeholder="Display name"
            className="min-w-40 flex-1 rounded-lg px-3 py-2 text-sm"
            style={fieldStyle}
          />
          <datalist id="folder-suggestions">
            {folderSuggestions.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <p className="text-xs" style={{ color: "var(--tv-text-muted)" }}>
          Folder is assigned automatically (YouTube sources go to &ldquo;Songs &amp;
          Learning&rdquo;) — rename it from the list above once it&apos;s added.
        </p>
        <p className="text-xs" style={{ color: "var(--tv-text-muted)" }}>
          Channel ID is the &ldquo;UC…&rdquo; string from the channel&apos;s &ldquo;About&rdquo;
          page. Playlist ID is the &ldquo;list=&rdquo; value from the playlist&apos;s URL. The
          playlist must be Public or Unlisted.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="autoApproveNewEpisodes" />
          Auto-approve new episodes (trust everything this source posts, no per-video review)
        </label>
        {state?.error && (
          <p className="text-sm" style={{ color: "#ff7a7a" }}>
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
        >
          {pending ? "Adding…" : "Add source"}
        </button>
      </form>
    </div>
  );
}
