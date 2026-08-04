import { relations } from "drizzle-orm";
import {
  boolean,
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

// --- Tables ---

// Parent login. Single-family app — in practice this table only ever has
// one row (created once by scripts/seed.ts) — but a real table, not a
// hardcoded check, is what lets auth.ts's Credentials authorize() match
// asset-doc-register's pattern exactly.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
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
