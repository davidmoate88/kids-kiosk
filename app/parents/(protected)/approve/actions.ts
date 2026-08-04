"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { approvedContent, catalogues, episodes, titles } from "@/db/schema";

// Deriving scope from the catalogue's auto-approve toggle at the moment of
// approval (rather than always using 'all') is what gives the Waiting queue
// a real job: a title approved while its catalogue has auto-approve off
// gets scope 'episodes', grandfathering in everything synced so far — only
// genuinely new episodes from then on need a trip through Waiting.
export async function approveTitle(titleId: string) {
  const db = getDb();
  const [title] = await db.select().from(titles).where(eq(titles.id, titleId)).limit(1);
  if (!title) return;

  let scope: "all" | "episodes" = "all";
  let approvedEpisodeIds: string[] = [];

  if (title.catalogueId) {
    const [catalogue] = await db.select().from(catalogues).where(eq(catalogues.id, title.catalogueId)).limit(1);
    if (catalogue && !catalogue.autoApproveNewEpisodes) {
      scope = "episodes";
      const currentEpisodes = await db
        .select({ id: episodes.id })
        .from(episodes)
        .where(eq(episodes.titleId, titleId));
      approvedEpisodeIds = currentEpisodes.map((e) => e.id);
    }
  }

  await db
    .insert(approvedContent)
    .values({ titleId, scope, approvedEpisodeIds })
    .onConflictDoNothing({ target: approvedContent.titleId });

  revalidatePath("/parents/approve");
  revalidatePath("/parents/waiting");
}
