"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { approvalQueue, approvedContent } from "@/db/schema";

export async function approveQueueEntry(queueId: string) {
  const db = getDb();
  const [entry] = await db.select().from(approvalQueue).where(eq(approvalQueue.id, queueId)).limit(1);
  if (!entry || entry.state !== "pending") return;

  await db.transaction(async (tx) => {
    const [approval] = await tx
      .select()
      .from(approvedContent)
      .where(eq(approvedContent.titleId, entry.titleId))
      .limit(1);
    if (approval) {
      await tx
        .update(approvedContent)
        .set({ approvedEpisodeIds: [...approval.approvedEpisodeIds, entry.episodeId] })
        .where(eq(approvedContent.id, approval.id));
    }
    await tx.update(approvalQueue).set({ state: "approved" }).where(eq(approvalQueue.id, queueId));
  });

  revalidatePath("/parents/waiting");
}

export async function skipQueueEntry(queueId: string) {
  const db = getDb();
  await db.update(approvalQueue).set({ state: "skipped" }).where(eq(approvalQueue.id, queueId));
  revalidatePath("/parents/waiting");
}
