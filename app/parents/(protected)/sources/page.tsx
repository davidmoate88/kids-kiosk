import { getDb } from "@/db";
import { catalogues } from "@/db/schema";
import { addCatalogue } from "./actions";
import SourcesClient from "./SourcesClient";

export default async function SourcesPage() {
  const db = getDb();
  const allCatalogues = await db.select().from(catalogues).orderBy(catalogues.folder, catalogues.name);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">Sources</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--tv-text-muted)" }}>
          YouTube channels and playlists. Adding one doesn&apos;t make it visible to the kids yet —
          approve it on the{" "}
          <a className="underline" href="/parents/approve">
            Approve titles
          </a>{" "}
          tab first.
        </p>
      </div>
      <SourcesClient catalogues={allCatalogues} addCatalogueAction={addCatalogue} />
    </div>
  );
}
