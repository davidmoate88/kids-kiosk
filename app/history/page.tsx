import HistoryClient from "@/components/HistoryClient";
import { requireAuth } from "@/lib/require-auth";

// Proxy middleware handles the first auth gate; this is the "belts and
// suspenders" re-check close to the data (same pattern as every other
// page that reads from the database).
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  await requireAuth();
  return <HistoryClient />;
}
