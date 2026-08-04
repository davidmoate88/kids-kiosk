import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stremioEpisodes, stremioTitles, stremioTrustedRows } from "@/db/schema";
import { browseCatalogRow, type StremioMediaType } from "@/lib/stremio-catalog-client";
import { getSeriesMeta, mapWithConcurrencyLimit } from "@/lib/cinemeta";

const DISCOVERY_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // weekly — see the Phase 3 plan's accepted v1 trade-off
const MAX_DISCOVERY_PAGES = 15; // ~300 titles per row per sync
const PAGE_SIZE = 20; // matches stremio-platform-catalogs' own fixed page size

/**
 * Upserts a series' episode list from Cinemeta. Shared by the initial
 * approve action (search/browse a series → approve → populate its episodes
 * immediately) and the nightly refresh pass below — both need exactly this,
 * just triggered differently.
 */
export async function syncSeriesEpisodes(stremioTitleId: string, imdbId: string): Promise<{ newEpisodeCount: number }> {
  const meta = await getSeriesMeta(imdbId);
  if (!meta) return { newEpisodeCount: 0 };

  const db = getDb();
  let newEpisodeCount = 0;
  for (const video of meta.videos) {
    const [inserted] = await db
      .insert(stremioEpisodes)
      .values({
        stremioTitleId,
        season: video.season,
        episode: video.episode,
        name: video.name,
        thumbnailUrl: video.thumbnail,
        publishedAt: video.released ? new Date(video.released) : null,
      })
      .onConflictDoNothing({ target: [stremioEpisodes.stremioTitleId, stremioEpisodes.season, stremioEpisodes.episode] })
      .returning();
    if (inserted) newEpisodeCount++;
  }
  return { newEpisodeCount };
}

/**
 * New-title discovery for one trusted row: walks its catalog pages and
 * auto-approves anything not already known (trusting a row means new titles
 * need no per-title review). Weekly-gated, not nightly — TMDB discover has
 * no "date added to this platform" signal, so catching a newly-licensed
 * (not just newly-released) title means re-walking a row's full pagination,
 * which is expensive to do nightly at scale. Returns null if the row
 * doesn't exist, or a count (0 if it wasn't due yet). `force` bypasses the
 * weekly gate — used by the dashboard's explicit "Sync now", where a parent's
 * direct intent should override the automatic throttle; the nightly cron
 * always calls this without force, respecting it.
 */
export async function syncTrustedRowDiscovery(
  rowId: string,
  force = false
): Promise<{ newTitleCount: number } | null> {
  const db = getDb();
  const [row] = await db.select().from(stremioTrustedRows).where(eq(stremioTrustedRows.id, rowId)).limit(1);
  if (!row) return null;

  const dueForSync = force || !row.lastSyncAt || Date.now() - row.lastSyncAt.getTime() >= DISCOVERY_INTERVAL_MS;
  if (!dueForSync) return { newTitleCount: 0 };

  let newTitleCount = 0;
  try {
    for (let page = 0; page < MAX_DISCOVERY_PAGES; page++) {
      const items = await browseCatalogRow(row.catalogId, row.mediaType, { skip: page * PAGE_SIZE });
      if (items.length === 0) break;

      for (const item of items) {
        const [existing] = await db
          .select({ id: stremioTitles.id })
          .from(stremioTitles)
          .where(and(eq(stremioTitles.imdbId, item.imdbId), eq(stremioTitles.mediaType, item.mediaType)))
          .limit(1);
        if (existing) continue;

        const [created] = await db
          .insert(stremioTitles)
          .values({
            imdbId: item.imdbId,
            mediaType: item.mediaType,
            name: item.name,
            posterUrl: item.posterUrl,
            trustedRowId: row.id,
            folder: null, // inherits the trusted row's folder at read time
          })
          .onConflictDoNothing({ target: [stremioTitles.imdbId, stremioTitles.mediaType] })
          .returning();

        if (created) {
          newTitleCount++;
          if (item.mediaType === "series") {
            await syncSeriesEpisodes(created.id, created.imdbId);
          }
        }
      }

      if (items.length < PAGE_SIZE) break; // last page
    }

    await db
      .update(stremioTrustedRows)
      .set({ lastSyncAt: new Date(), status: "ok" })
      .where(eq(stremioTrustedRows.id, row.id));
  } catch (err) {
    await db.update(stremioTrustedRows).set({ status: "error" }).where(eq(stremioTrustedRows.id, row.id));
    throw err;
  }

  return { newTitleCount };
}

export async function syncAllTrustedRowsDiscovery(): Promise<void> {
  const db = getDb();
  const rows = await db.select().from(stremioTrustedRows);
  for (const row of rows) {
    await syncTrustedRowDiscovery(row.id);
  }
}

/**
 * Refreshes episode lists for EVERY approved series, regardless of
 * trustedRowId — "new episodes just appear automatically" has to hold for
 * individually-approved series (search/browse) too, not only trusted-row
 * ones; only *new-title discovery* is gated by trust. Nightly.
 */
export async function refreshApprovedSeriesEpisodes(): Promise<void> {
  const db = getDb();
  const series = await db.select().from(stremioTitles).where(eq(stremioTitles.mediaType, "series"));
  await mapWithConcurrencyLimit(series, 4, (title) => syncSeriesEpisodes(title.id, title.imdbId));
}

export type { StremioMediaType };
