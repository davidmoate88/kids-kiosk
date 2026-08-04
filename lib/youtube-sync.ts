import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { approvalQueue, approvedContent, catalogues, episodes, titles } from "@/db/schema";
import { getChannelUploads, getPlaylistVideos } from "@/lib/youtube";

/**
 * Upserts one catalogue's title + episodes from YouTube. New episodes are
 * routed to `approved_content` (only if the title is already approved and
 * the catalogue auto-approves) or `approval_queue` for a parent to review.
 * A title that isn't approved yet just gets its episodes cached quietly —
 * nothing needs to land in the queue until "Approve titles" is actioned.
 */
export async function syncCatalogue(catalogueId: string) {
  const db = getDb();
  const [catalogue] = await db.select().from(catalogues).where(eq(catalogues.id, catalogueId)).limit(1);
  if (!catalogue) throw new Error(`Catalogue ${catalogueId} not found`);

  const videos =
    catalogue.kind === "channel"
      ? await getChannelUploads(catalogue.externalId, 50)
      : await getPlaylistVideos(catalogue.externalId, 50);

  let [title] = await db.select().from(titles).where(eq(titles.catalogueId, catalogue.id)).limit(1);
  if (!title) {
    [title] = await db
      .insert(titles)
      .values({ catalogueId: catalogue.id, externalId: catalogue.externalId, name: catalogue.name })
      .returning();
  }

  const existingEpisodes = await db.select().from(episodes).where(eq(episodes.titleId, title.id));
  const existingExternalIds = new Set(existingEpisodes.map((e) => e.externalId));

  const newEpisodeIds: string[] = [];
  for (const video of videos) {
    if (existingExternalIds.has(video.videoId)) continue;
    const [inserted] = await db
      .insert(episodes)
      .values({ titleId: title.id, externalId: video.videoId, name: video.title })
      .onConflictDoNothing({ target: [episodes.titleId, episodes.externalId] })
      .returning();
    if (inserted) newEpisodeIds.push(inserted.id);
  }

  if (newEpisodeIds.length > 0) {
    const [approval] = await db
      .select()
      .from(approvedContent)
      .where(eq(approvedContent.titleId, title.id))
      .limit(1);

    // scope 'all' already shows every episode automatically — nothing to
    // do. An unapproved title's episodes just wait for "Approve titles".
    // Only a scope 'episodes' title (i.e. one approved with auto-approve
    // off) routes its new episodes through the review queue.
    if (approval && approval.scope === "episodes") {
      if (catalogue.autoApproveNewEpisodes) {
        await db
          .update(approvedContent)
          .set({ approvedEpisodeIds: [...approval.approvedEpisodeIds, ...newEpisodeIds] })
          .where(eq(approvedContent.id, approval.id));
      } else {
        await db.insert(approvalQueue).values(
          newEpisodeIds.map((episodeId) => ({ titleId: title.id, episodeId }))
        );
      }
    }
  }

  await db.update(catalogues).set({ lastSyncAt: new Date(), status: "ok" }).where(eq(catalogues.id, catalogue.id));

  return { titleId: title.id, newEpisodeCount: newEpisodeIds.length };
}

export async function syncAllCatalogues() {
  const db = getDb();
  const all = await db.select().from(catalogues).where(eq(catalogues.syncEnabled, true));

  const results: { catalogueId: string; newEpisodeCount?: number; error?: string }[] = [];
  for (const catalogue of all) {
    try {
      const { newEpisodeCount } = await syncCatalogue(catalogue.id);
      results.push({ catalogueId: catalogue.id, newEpisodeCount });
    } catch (err) {
      await db.update(catalogues).set({ status: "error" }).where(eq(catalogues.id, catalogue.id));
      results.push({ catalogueId: catalogue.id, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}
