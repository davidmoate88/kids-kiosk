"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { stremioTitles, stremioTrustedRows } from "@/db/schema";
import {
  browseCatalogRow,
  searchCatalog,
  type CatalogItem,
  type SearchResultItem,
  type StremioMediaType,
} from "@/lib/stremio-catalog-client";
import { syncSeriesEpisodes, syncTrustedRowDiscovery } from "@/lib/stremio-sync";

// Thin pass-throughs so the client component (which can't call server-only
// code directly) can search/browse — kept here rather than a GET API route
// since they're simple, single-purpose reads with no caching/URL semantics
// worth a dedicated endpoint for.
export async function searchStremio(type: StremioMediaType, query: string): Promise<SearchResultItem[]> {
  return searchCatalog(type, query);
}

export async function browseStremioRow(
  catalogId: string,
  type: StremioMediaType,
  skip: number
): Promise<CatalogItem[]> {
  return browseCatalogRow(catalogId, type, { skip });
}

// Approves a single title found via search or browse (curation modes a/b) —
// creates the stremioTitles row directly, no pending/approval-queue state
// (see db/schema.ts's comment on why). For a series, populates its episode
// list from Cinemeta immediately so it's playable right away.
export async function approveStremioTitle(input: {
  imdbId: string;
  mediaType: StremioMediaType;
  name: string;
  posterUrl?: string;
  folder: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select({ id: stremioTitles.id })
    .from(stremioTitles)
    .where(and(eq(stremioTitles.imdbId, input.imdbId), eq(stremioTitles.mediaType, input.mediaType)))
    .limit(1);
  if (existing) return;

  const [created] = await db
    .insert(stremioTitles)
    .values({
      imdbId: input.imdbId,
      mediaType: input.mediaType,
      name: input.name,
      posterUrl: input.posterUrl,
      folder: input.folder,
    })
    .onConflictDoNothing({ target: [stremioTitles.imdbId, stremioTitles.mediaType] })
    .returning();

  if (created && created.mediaType === "series") {
    await syncSeriesEpisodes(created.id, created.imdbId);
  }

  revalidatePath("/parents/stremio");
}

// Trusting a row just records the trust and returns — actual discovery runs
// via the nightly cron or an explicit "Sync now" below, never inline. A big
// platform row can be hundreds of titles; walking its full pagination (plus
// a Cinemeta call per series found) synchronously inside this request would
// blow past any reasonable timeout.
export async function trustCatalogRow(input: {
  catalogId: string;
  mediaType: StremioMediaType;
  label: string;
  folder: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select({ id: stremioTrustedRows.id })
    .from(stremioTrustedRows)
    .where(eq(stremioTrustedRows.catalogId, input.catalogId))
    .limit(1);
  if (existing) return;

  await db.insert(stremioTrustedRows).values({
    catalogId: input.catalogId,
    label: input.label,
    folder: input.folder,
    mediaType: input.mediaType,
  });
  revalidatePath("/parents/stremio");
}

// Deliberately just deletes the row — stremioTitles.trustedRowId's
// onDelete: "set null" means already-approved titles from it stay approved;
// only future discovery stops.
export async function untrustCatalogRow(rowId: string) {
  const db = getDb();
  await db.delete(stremioTrustedRows).where(eq(stremioTrustedRows.id, rowId));
  revalidatePath("/parents/stremio");
}

export async function syncTrustedRowNow(rowId: string) {
  await syncTrustedRowDiscovery(rowId, true);
  revalidatePath("/parents/stremio");
}
