"use client";

import { useState, useTransition } from "react";
import type { stremioTrustedRows } from "@/db/schema";
import type {
  CatalogItem,
  CatalogRow,
  FilterOptions,
  SearchResultItem,
  StremioAgeRating,
  StremioMediaType,
} from "@/lib/stremio-catalog-client";
import {
  approveStremioTitle,
  browseStremioRow,
  searchStremio,
  syncTrustedRowNow,
  trustCatalogRow,
  untrustCatalogRow,
} from "./actions";

type TrustedRow = typeof stremioTrustedRows.$inferSelect;
type ResultItem = { imdbId: string; mediaType: StremioMediaType; name: string; posterUrl?: string };

const FOLDER_SUGGESTIONS = ["Songs & Learning", "Shows", "Vehicles"];
const fieldStyle = { background: "var(--tv-bg)", border: "1px solid var(--tv-divider)" } as const;

function resultKey(item: ResultItem) {
  return `${item.imdbId}:${item.mediaType}`;
}

function ResultCard({ item, approved, onApprove }: { item: ResultItem; approved: boolean; onApprove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "var(--tv-surface)" }}>
      {item.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- same pattern as WatchClient.tsx's other thumbnails
        <img src={item.posterUrl} alt="" className="h-16 w-11 shrink-0 rounded object-cover" />
      ) : (
        <div className="h-16 w-11 shrink-0 rounded" style={{ background: "var(--tv-divider)" }} />
      )}
      <div className="min-w-0 flex-1 text-sm">
        <div className="truncate font-medium">{item.name}</div>
        <div className="text-xs capitalize" style={{ color: "var(--tv-text-muted)" }}>
          {item.mediaType}
        </div>
      </div>
      <button
        type="button"
        disabled={approved}
        onClick={onApprove}
        className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
        style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
      >
        {approved ? "Approved" : "Approve"}
      </button>
    </div>
  );
}

// Shared by the search and browse forms — genres are type-specific (the
// caller passes the options for whichever type is currently selected), age
// ratings are the fixed U/PG/12/15/18 scale regardless of type. "Any rating"
// means no filter; the addon excludes titles with no GB rating on file only
// when a specific rating is actually selected.
function FilterSelects({
  options,
  genre,
  onGenreChange,
  maxRating,
  onMaxRatingChange,
}: {
  options: FilterOptions;
  genre: string;
  onGenreChange: (v: string) => void;
  maxRating: string;
  onMaxRatingChange: (v: string) => void;
}) {
  return (
    <>
      <select
        value={genre}
        onChange={(e) => onGenreChange(e.target.value)}
        className="rounded-lg px-3 py-2 text-sm"
        style={fieldStyle}
      >
        <option value="">Any genre</option>
        {options.genres.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <select
        value={maxRating}
        onChange={(e) => onMaxRatingChange(e.target.value)}
        className="rounded-lg px-3 py-2 text-sm"
        style={fieldStyle}
      >
        <option value="">Any rating</option>
        {options.ageRatings.map((r) => (
          <option key={r} value={r}>
            Up to {r}
          </option>
        ))}
      </select>
    </>
  );
}

export default function StremioClient({
  catalogRows,
  trustedRows,
  filterOptionsByType,
}: {
  catalogRows: CatalogRow[];
  trustedRows: TrustedRow[];
  filterOptionsByType: Record<StremioMediaType, FilterOptions>;
}) {
  const [, startTransition] = useTransition();
  const [folder, setFolder] = useState("Shows");
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  function approve(item: ResultItem) {
    setApprovedIds((prev) => new Set(prev).add(resultKey(item)));
    startTransition(() => {
      approveStremioTitle({ ...item, folder });
    });
  }

  // --- Search ---
  const [searchType, setSearchType] = useState<StremioMediaType>("movie");
  const [query, setQuery] = useState("");
  const [searchGenre, setSearchGenre] = useState("");
  const [searchMaxRating, setSearchMaxRating] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);

  function changeSearchType(type: StremioMediaType) {
    setSearchType(type);
    setSearchGenre(""); // genre lists differ by type — a stale selection could silently match nothing
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      setSearchResults(
        await searchStremio(searchType, query, {
          genre: searchGenre || undefined,
          maxRating: (searchMaxRating || undefined) as StremioAgeRating | undefined,
        })
      );
    } finally {
      setSearching(false);
    }
  }

  // --- Browse ---
  const [browseRowId, setBrowseRowId] = useState(catalogRows[0]?.id ?? "");
  const [browseGenre, setBrowseGenre] = useState("");
  const [browseMaxRating, setBrowseMaxRating] = useState("");
  const [browseResults, setBrowseResults] = useState<CatalogItem[]>([]);
  const [browseSkip, setBrowseSkip] = useState(0);
  const [browsing, setBrowsing] = useState(false);

  async function runBrowse(rowId: string, skip: number) {
    const row = catalogRows.find((r) => r.id === rowId);
    if (!row) return;
    setBrowsing(true);
    try {
      setBrowseResults(
        await browseStremioRow(rowId, row.type, skip, {
          genre: browseGenre || undefined,
          maxRating: (browseMaxRating || undefined) as StremioAgeRating | undefined,
        })
      );
      setBrowseSkip(skip);
      setBrowseRowId(rowId);
    } finally {
      setBrowsing(false);
    }
  }

  // --- Trust whole rows ---
  const trustedByCatalogId = new Map(trustedRows.map((r) => [r.catalogId, r]));

  function toggleTrust(row: CatalogRow, trusted: TrustedRow | undefined) {
    startTransition(() => {
      if (trusted) untrustCatalogRow(trusted.id);
      else trustCatalogRow({ catalogId: row.id, mediaType: row.type, label: row.name, folder });
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center gap-3 rounded-lg p-4" style={{ background: "var(--tv-surface)" }}>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium">Folder for new approvals</span>
          <input
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            list="stremio-folder-suggestions"
            className="w-44 rounded-lg px-3 py-2 text-sm"
            style={fieldStyle}
          />
          <datalist id="stremio-folder-suggestions">
            {FOLDER_SUGGESTIONS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </label>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Search &amp; approve</h2>
        <form onSubmit={runSearch} className="flex flex-wrap gap-3">
          <select
            value={searchType}
            onChange={(e) => changeSearchType(e.target.value as StremioMediaType)}
            className="rounded-lg px-3 py-2 text-sm"
            style={fieldStyle}
          >
            <option value="movie">Movie</option>
            <option value="series">Series</option>
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a title…"
            className="min-w-56 flex-1 rounded-lg px-3 py-2 text-sm"
            style={fieldStyle}
          />
          <FilterSelects
            options={filterOptionsByType[searchType]}
            genre={searchGenre}
            onGenreChange={setSearchGenre}
            maxRating={searchMaxRating}
            onMaxRatingChange={setSearchMaxRating}
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {searchResults.map((item) => (
              <ResultCard
                key={resultKey(item)}
                item={item}
                approved={approvedIds.has(resultKey(item))}
                onApprove={() => approve(item)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Browse a row</h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={browseRowId}
            onChange={(e) => {
              const nextType = catalogRows.find((r) => r.id === e.target.value)?.type;
              const prevType = catalogRows.find((r) => r.id === browseRowId)?.type;
              if (nextType !== prevType) setBrowseGenre("");
              runBrowse(e.target.value, 0);
            }}
            className="min-w-56 rounded-lg px-3 py-2 text-sm"
            style={fieldStyle}
          >
            {catalogRows.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name} ({row.type})
              </option>
            ))}
          </select>
          <FilterSelects
            options={filterOptionsByType[catalogRows.find((r) => r.id === browseRowId)?.type ?? "movie"]}
            genre={browseGenre}
            onGenreChange={setBrowseGenre}
            maxRating={browseMaxRating}
            onMaxRatingChange={setBrowseMaxRating}
          />
          <button
            type="button"
            disabled={!browseRowId || browsing}
            onClick={() => runBrowse(browseRowId, 0)}
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
          >
            {browsing ? "Loading…" : "Browse"}
          </button>
        </div>
        {browseResults.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {browseResults.map((item) => (
                <ResultCard
                  key={resultKey(item)}
                  item={item}
                  approved={approvedIds.has(resultKey(item))}
                  onApprove={() => approve(item)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={browseSkip === 0 || browsing}
                onClick={() => runBrowse(browseRowId, Math.max(0, browseSkip - 20))}
                className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
                style={{ border: "1px solid var(--tv-divider)" }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={browsing}
                onClick={() => runBrowse(browseRowId, browseSkip + 20)}
                className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
                style={{ border: "1px solid var(--tv-divider)" }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Trust whole rows</h2>
        <p className="text-xs" style={{ color: "var(--tv-text-muted)" }}>
          Trusting a row auto-approves everything in it, current and future — no
          per-title review. New titles show up after the nightly sync or &quot;Sync
          now&quot;, not immediately (a big row can be hundreds of titles).
        </p>
        <div className="flex flex-col gap-2">
          {catalogRows.map((row) => {
            const trusted = trustedByCatalogId.get(row.id);
            return (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-lg p-3"
                style={{ background: "var(--tv-surface)" }}
              >
                <div className="min-w-40 flex-1 text-sm">
                  <div className="font-medium">
                    {row.name} <span style={{ color: "var(--tv-text-muted)" }}>({row.type})</span>
                  </div>
                  {trusted && (
                    <div className="text-xs" style={{ color: "var(--tv-text-muted)" }}>
                      {trusted.status === "error"
                        ? "last sync failed"
                        : trusted.lastSyncAt
                          ? `synced ${new Date(trusted.lastSyncAt).toLocaleDateString("en-GB")}`
                          : "not synced yet"}
                    </div>
                  )}
                </div>
                {trusted && (
                  <button
                    type="button"
                    onClick={() => startTransition(() => syncTrustedRowNow(trusted.id))}
                    className="rounded-lg px-3 py-1.5 text-sm"
                    style={{ border: "1px solid var(--tv-divider)" }}
                  >
                    Sync now
                  </button>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(trusted)}
                    onChange={() => toggleTrust(row, trusted)}
                  />
                  Trusted
                </label>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
