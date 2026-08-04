"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { catalogues } from "@/db/schema";
import { syncCatalogue } from "@/lib/youtube-sync";

export type AddCatalogueState = { error?: string } | undefined;

export async function addCatalogue(
  _prev: AddCatalogueState,
  formData: FormData
): Promise<AddCatalogueState> {
  const kind = formData.get("kind");
  const externalId = formData.get("externalId");
  const name = formData.get("name");
  const folder = formData.get("folder");
  const autoApproveNewEpisodes = formData.get("autoApproveNewEpisodes") === "on";

  if (kind !== "channel" && kind !== "playlist") return { error: "Pick a source type." };
  if (typeof externalId !== "string" || !externalId.trim()) return { error: "ID is required." };
  if (typeof name !== "string" || !name.trim()) return { error: "Name is required." };
  if (typeof folder !== "string" || !folder.trim()) return { error: "Folder is required." };

  const db = getDb();
  const trimmedId = externalId.trim();
  const [existing] = await db.select().from(catalogues).where(eq(catalogues.externalId, trimmedId)).limit(1);
  if (existing) return { error: `Already added as "${existing.name}".` };

  const [catalogue] = await db
    .insert(catalogues)
    .values({ kind, externalId: trimmedId, name: name.trim(), folder: folder.trim(), autoApproveNewEpisodes })
    .returning();

  try {
    await syncCatalogue(catalogue.id);
  } catch (err) {
    return { error: `Added, but the first sync failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  revalidatePath("/parents/sources");
  revalidatePath("/parents/approve");
}

export async function toggleAutoApprove(catalogueId: string, next: boolean) {
  const db = getDb();
  await db.update(catalogues).set({ autoApproveNewEpisodes: next }).where(eq(catalogues.id, catalogueId));
  revalidatePath("/parents/sources");
}

export async function toggleSyncEnabled(catalogueId: string, next: boolean) {
  const db = getDb();
  await db.update(catalogues).set({ syncEnabled: next }).where(eq(catalogues.id, catalogueId));
  revalidatePath("/parents/sources");
}

export async function updateCatalogueFolder(catalogueId: string, folder: string) {
  const trimmed = folder.trim();
  if (!trimmed) return;
  const db = getDb();
  await db.update(catalogues).set({ folder: trimmed }).where(eq(catalogues.id, catalogueId));
  revalidatePath("/parents/sources");
  revalidatePath("/watch");
  revalidatePath("/tv");
}

export async function syncNow(catalogueId: string) {
  await syncCatalogue(catalogueId);
  revalidatePath("/parents/sources");
  revalidatePath("/parents/approve");
  revalidatePath("/parents/waiting");
}
