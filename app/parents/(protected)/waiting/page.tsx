import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { approvalQueue, catalogues, episodes, titles } from "@/db/schema";
import WaitingClient from "./WaitingClient";

export default async function WaitingPage() {
  const db = getDb();

  const pending = await db
    .select({
      id: approvalQueue.id,
      createdAt: approvalQueue.createdAt,
      episodeName: episodes.name,
      titleName: titles.name,
      folder: catalogues.folder,
    })
    .from(approvalQueue)
    .innerJoin(episodes, eq(approvalQueue.episodeId, episodes.id))
    .innerJoin(titles, eq(approvalQueue.titleId, titles.id))
    .leftJoin(catalogues, eq(titles.catalogueId, catalogues.id))
    .where(eq(approvalQueue.state, "pending"))
    .orderBy(approvalQueue.createdAt);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Waiting</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--tv-text-muted)" }}>
          New episodes from sources with auto-approve off. Review each one before it shows up.
        </p>
      </div>
      {pending.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--tv-text-muted)" }}>
          Nothing waiting right now.
        </p>
      ) : (
        <WaitingClient items={pending} />
      )}
    </div>
  );
}
