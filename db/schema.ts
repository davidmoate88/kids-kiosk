import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const catalogueKindEnum = pgEnum("catalogue_kind", ["channel", "playlist"]);

export const approvedScopeEnum = pgEnum("approved_scope", ["all", "episodes"]);

export const queueStateEnum = pgEnum("queue_state", ["pending", "approved", "skipped"]);

export const stremioMediaTypeEnum = pgEnum("stremio_media_type", ["movie", "series"]);

// --- Tables ---

// Parent login. Gates /parents from the kids (and anyone else on the home
// network) rather than from the internet — the app is LAN-only already, so
// a single shared PIN is the right amount of friction, not a per-parent
// account. Always exactly one row, created by scripts/seed.ts.
export const parentPin = pgTable("parent_pin", {
  id: uuid("id").primaryKey().defaultRandom(),
  pinHash: text("pin_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A YouTube channel or playlist a parent has added via the dashboard.
// `folder` is free text (not an enum) — it's a parent-chosen category
// label for how the show groups on /watch and /tv (today's "Songs &
// Learning" / "Shows" / "Vehicles"), not a fixed system value; the
// dashboard suggests existing folders but doesn't restrict to them.
export const catalogues = pgTable("catalogues", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: catalogueKindEnum("kind").notNull(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  folder: text("folder").notNull(),
  autoApproveNewEpisodes: boolean("auto_approve_new_episodes").notNull().default(false),
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  status: text("status").notNull().default("ok"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// One "show" per catalogue (catalogueId unique — a catalogue always wraps
// exactly one title), or a standalone hand-approved video with no
// catalogue at all (catalogueId null — replaces today's individually
// curated APPROVED_VIDEOS/"My Videos" bucket).
export const titles = pgTable("titles", {
  id: uuid("id").primaryKey().defaultRandom(),
  catalogueId: uuid("catalogue_id").references(() => catalogues.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  cachedAt: timestamp("cached_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("titles_catalogue_id_idx").on(table.catalogueId),
]);

// Individual videos within a title.
export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleId: uuid("title_id").notNull().references(() => titles.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("episodes_title_external_idx").on(table.titleId, table.externalId),
]);

// The only table /watch and /tv read — see the Phase 2 plan's "core rule".
// `approvedEpisodeIds` is only meaningful when scope = 'episodes'; when
// scope = 'all', every episode of the title is shown (including ones
// added by a later sync) without needing this array touched again.
export const approvedContent = pgTable("approved_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleId: uuid("title_id").notNull().references(() => titles.id, { onDelete: "cascade" }).unique(),
  scope: approvedScopeEnum("scope").notNull().default("all"),
  approvedEpisodeIds: uuid("approved_episode_ids").array().notNull().default([]),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
});

// New episodes waiting on a parent, for catalogues where
// autoApproveNewEpisodes is off.
export const approvalQueue = pgTable("approval_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleId: uuid("title_id").notNull().references(() => titles.id, { onDelete: "cascade" }),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  state: queueStateEnum("state").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("approval_queue_episode_idx").on(table.episodeId),
]);

// A parent has marked a whole Stremio catalog row (from stremio-platform-catalogs,
// e.g. "Disney+ Series") fully trusted — current and future titles in it are
// auto-approved with no per-title review. Presence in this table *is* the trust;
// removing a row stops future discovery but deliberately does not retroactively
// un-approve titles already pulled in (see stremioTitles.trustedRowId's onDelete).
export const stremioTrustedRows = pgTable("stremio_trusted_rows", {
  id: uuid("id").primaryKey().defaultRandom(),
  catalogId: text("catalog_id").notNull().unique(),
  label: text("label").notNull(),
  folder: text("folder").notNull(),
  mediaType: stremioMediaTypeEnum("media_type").notNull(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  status: text("status").notNull().default("ok"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// One row per approved Stremio title (movie or series), from any of the three
// curation modes (search, browse, or a trusted row's auto-discovery). Unlike
// YouTube's titles/approvedContent split, there's no synced-but-unapproved
// intermediate state here: for search/browse the approve action *is* the
// creation, and a trusted row's new titles are approved by definition of being
// trusted — so scope/approvedEpisodeIds exist only for schema parity with
// approvedContent and are inert in v1 (every approval path resolves to 'all';
// there's no per-catalogue auto-approve toggle to derive 'episodes' from the way
// YouTube's approveTitle does).
export const stremioTitles = pgTable("stremio_titles", {
  id: uuid("id").primaryKey().defaultRandom(),
  imdbId: text("imdb_id").notNull(),
  mediaType: stremioMediaTypeEnum("media_type").notNull(),
  name: text("name").notNull(),
  posterUrl: text("poster_url"),
  // Null when individually approved via search or browse; set when pulled in by
  // a trusted row's auto-discovery. "set null" (not cascade) on purpose —
  // untrusting a row should stop *new* titles, not retroactively yank away shows
  // the kids already watch.
  trustedRowId: uuid("trusted_row_id").references(() => stremioTrustedRows.id, { onDelete: "set null" }),
  // Only meaningful when trustedRowId is null — a trusted-row title inherits its
  // row's folder at read time instead.
  folder: text("folder"),
  scope: approvedScopeEnum("scope").notNull().default("all"),
  approvedEpisodeIds: uuid("approved_episode_ids").array().notNull().default([]),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
  cachedAt: timestamp("cached_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("stremio_titles_imdb_media_type_idx").on(table.imdbId, table.mediaType),
]);

// Individual episodes of an approved series, populated from Cinemeta. Movies
// have no rows here — a movie's single stream is resolved directly from its
// stremioTitles.imdbId.
export const stremioEpisodes = pgTable("stremio_episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  stremioTitleId: uuid("stremio_title_id").notNull().references(() => stremioTitles.id, { onDelete: "cascade" }),
  season: integer("season").notNull(),
  episode: integer("episode").notNull(),
  name: text("name").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("stremio_episodes_title_season_episode_idx").on(table.stremioTitleId, table.season, table.episode),
]);

// --- Relations ---

export const cataloguesRelations = relations(catalogues, ({ one }) => ({
  title: one(titles, {
    fields: [catalogues.id],
    references: [titles.catalogueId],
  }),
}));

export const titlesRelations = relations(titles, ({ one, many }) => ({
  catalogue: one(catalogues, {
    fields: [titles.catalogueId],
    references: [catalogues.id],
  }),
  episodes: many(episodes),
  approvedContent: one(approvedContent, {
    fields: [titles.id],
    references: [approvedContent.titleId],
  }),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  title: one(titles, {
    fields: [episodes.titleId],
    references: [titles.id],
  }),
  queueEntries: many(approvalQueue),
}));

export const approvedContentRelations = relations(approvedContent, ({ one }) => ({
  title: one(titles, {
    fields: [approvedContent.titleId],
    references: [titles.id],
  }),
}));

export const approvalQueueRelations = relations(approvalQueue, ({ one }) => ({
  title: one(titles, {
    fields: [approvalQueue.titleId],
    references: [titles.id],
  }),
  episode: one(episodes, {
    fields: [approvalQueue.episodeId],
    references: [episodes.id],
  }),
}));

export const stremioTrustedRowsRelations = relations(stremioTrustedRows, ({ many }) => ({
  titles: many(stremioTitles),
}));

export const stremioTitlesRelations = relations(stremioTitles, ({ one, many }) => ({
  trustedRow: one(stremioTrustedRows, {
    fields: [stremioTitles.trustedRowId],
    references: [stremioTrustedRows.id],
  }),
  episodes: many(stremioEpisodes),
}));

export const stremioEpisodesRelations = relations(stremioEpisodes, ({ one }) => ({
  title: one(stremioTitles, {
    fields: [stremioEpisodes.stremioTitleId],
    references: [stremioTitles.id],
  }),
}));
