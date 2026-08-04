import { eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { approvedContent, catalogues, episodes, titles } from "@/db/schema";
import ApproveClient from "./ApproveClient";

export default async function ApprovePage() {
  const db = getDb();

  const pending = await db
    .select({
      id: titles.id,
      name: titles.name,
      folder: catalogues.folder,
      kind: catalogues.kind,
      catalogueName: catalogues.name,
    })
    .from(titles)
    .leftJoin(catalogues, eq(titles.catalogueId, catalogues.id))
    .leftJoin(approvedContent, eq(approvedContent.titleId, titles.id))
    .where(isNull(approvedContent.id));

  const episodeCounts = await db
    .select({ titleId: episodes.titleId, count: sql<number>`count(*)::int` })
    .from(episodes)
    .groupBy(episodes.titleId);
  const countByTitle = new Map(episodeCounts.map((e) => [e.titleId, e.count]));

  const items = pending.map((title) => ({ ...title, episodeCount: countByTitle.get(title.id) ?? 0 }));

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Approve titles</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--tv-text-muted)" }}>
          Newly synced shows wait here until you approve them — nothing shows up on the kids&apos;
          screens before that.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--tv-text-muted)" }}>
          Nothing waiting. New sources appear here after their first sync.
        </p>
      ) : (
        <ApproveClient items={items} />
      )}
    </div>
  );
}
