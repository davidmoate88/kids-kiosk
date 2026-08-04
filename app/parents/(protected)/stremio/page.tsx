import { getDb } from "@/db";
import { stremioTrustedRows } from "@/db/schema";
import { getCatalogRows, getFilterOptions, type FilterOptions } from "@/lib/stremio-catalog-client";
import StremioClient from "./StremioClient";

export default async function StremioPage() {
  const db = getDb();
  const trustedRows = await db.select().from(stremioTrustedRows).orderBy(stremioTrustedRows.label);

  let catalogRows: Awaited<ReturnType<typeof getCatalogRows>> = [];
  // Fetched for both types up front (cheap, 24h-cached in the addon) so
  // switching the type dropdown client-side doesn't need a round-trip.
  let filterOptionsByType: Record<"movie" | "series", FilterOptions> = {
    movie: { genres: [], ageRatings: [] },
    series: { genres: [], ageRatings: [] },
  };
  let catalogError: string | null = null;
  try {
    const [rows, movieFilters, seriesFilters] = await Promise.all([
      getCatalogRows(),
      getFilterOptions("movie"),
      getFilterOptions("series"),
    ]);
    catalogRows = rows;
    filterOptionsByType = { movie: movieFilters, series: seriesFilters };
  } catch (err) {
    catalogError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">Stremio</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--tv-text-muted)" }}>
          Movies and shows from your own Platform Catalogs addon. Search or browse to
          approve individual titles, or trust a whole row to auto-approve everything in
          it, current and future.
        </p>
      </div>
      {catalogError ? (
        <p className="text-sm" style={{ color: "#ff7a7a" }}>
          Couldn&apos;t reach stremio-platform-catalogs ({catalogError}). Check
          STREMIO_CATALOG_URL is set and the addon is running.
        </p>
      ) : (
        <StremioClient catalogRows={catalogRows} trustedRows={trustedRows} filterOptionsByType={filterOptionsByType} />
      )}
    </div>
  );
}
