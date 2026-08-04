// One-time bootstrap: creates the parent PIN and migrates today's
// hand-edited lib/approved-videos.ts content into the database as
// pre-approved, so cutting getWatchFolders() over to Postgres doesn't wipe
// out everything that's already trusted. Safe to re-run — existing rows are
// left alone rather than clobbered (see the onConflict handling below).
import { hash } from "bcryptjs";
import { eq, isNull } from "drizzle-orm";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local doesn't exist (e.g. CI with real env vars already set) — fine.
}

import { getDb } from "@/db";
import { approvedContent, catalogues, parentPin, titles } from "@/db/schema";
import {
  APPROVED_CHANNELS,
  APPROVED_PLAYLISTS,
  APPROVED_VIDEOS,
  VIDEOS_FOLDER,
} from "@/lib/approved-videos";
import { syncCatalogue } from "@/lib/youtube-sync";

async function seedPin() {
  const pin = process.env.SEED_PARENT_PIN;
  if (!pin) {
    throw new Error("SEED_PARENT_PIN must be set in .env.local");
  }
  if (!/^\d{4,8}$/.test(pin)) {
    throw new Error("SEED_PARENT_PIN must be 4-8 digits.");
  }

  const db = getDb();
  const [existing] = await db.select().from(parentPin).limit(1);
  if (existing) {
    console.log("Parent PIN already set — leaving it as-is.");
    return;
  }

  const pinHash = await hash(pin, 10);
  await db.insert(parentPin).values({ pinHash });
  console.log("Parent PIN created.");
}

async function seedCatalogue(input: {
  kind: "channel" | "playlist";
  externalId: string;
  name: string;
  folder: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(catalogues)
    .where(eq(catalogues.externalId, input.externalId))
    .limit(1);

  const catalogue =
    existing ??
    (
      await db
        .insert(catalogues)
        .values({
          kind: input.kind,
          externalId: input.externalId,
          name: input.name,
          folder: input.folder,
          autoApproveNewEpisodes: true,
          syncEnabled: true,
        })
        .returning()
    )[0];

  const { titleId, newEpisodeCount } = await syncCatalogue(catalogue.id);

  await db
    .insert(approvedContent)
    .values({ titleId, scope: "all" })
    .onConflictDoNothing({ target: approvedContent.titleId });

  console.log(`  ${input.name}: ${newEpisodeCount} episode(s) synced, title approved (scope: all).`);
}

async function seedStandaloneVideo(video: { videoId: string; title: string }) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(titles)
    .where(eq(titles.externalId, video.videoId))
    .limit(1);

  // Standalone titles have no catalogue, so externalId alone isn't a real
  // unique constraint — narrow to catalogueId IS NULL to avoid colliding
  // with a channel/playlist that happens to reuse the same video ID as its
  // externalId (channels/playlists use their own IDs, not video IDs, so
  // this is precautionary rather than a case that should ever actually fire).
  const standaloneExisting = existing && existing.catalogueId === null ? existing : undefined;

  const title =
    standaloneExisting ??
    (
      await db
        .insert(titles)
        .values({ catalogueId: null, externalId: video.videoId, name: video.title })
        .returning()
    )[0];

  await db
    .insert(approvedContent)
    .values({ titleId: title.id, scope: "all" })
    .onConflictDoNothing({ target: approvedContent.titleId });
}

async function main() {
  await seedPin();

  console.log("Seeding channels...");
  for (const channel of APPROVED_CHANNELS) {
    await seedCatalogue({
      kind: "channel",
      externalId: channel.channelId,
      name: channel.name,
      folder: channel.folder,
    });
  }

  console.log("Seeding playlists...");
  for (const playlist of APPROVED_PLAYLISTS) {
    await seedCatalogue({
      kind: "playlist",
      externalId: playlist.playlistId,
      name: playlist.name,
      folder: playlist.folder,
    });
  }

  console.log(`Seeding ${APPROVED_VIDEOS.length} standalone video(s) into "${VIDEOS_FOLDER}"...`);
  for (const video of APPROVED_VIDEOS) {
    await seedStandaloneVideo(video);
  }

  const db = getDb();
  const standaloneCount = (await db.select().from(titles).where(isNull(titles.catalogueId))).length;
  console.log(`Done. ${standaloneCount} standalone title(s) in the database.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
