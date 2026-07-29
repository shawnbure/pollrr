import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  topic: text("topic").notNull(),
  region: text("region").notNull(),
  status: text("status", { enum: ["draft", "scheduled", "live", "paused", "closed"] }).notNull(),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const votes = sqliteTable("votes", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => questions.id),
  choice: text("choice", { enum: ["a", "b"] }).notNull(),
  rippleId: text("ripple_id").notNull(),
  parentRippleId: text("parent_ripple_id"),
  regionCode: text("region_code"),
  consentVersion: text("consent_version").notNull(),
  voterKey: text("voter_key"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("votes_question_idx").on(table.questionId),
  index("votes_ripple_idx").on(table.rippleId),
  uniqueIndex("votes_voter_idx").on(table.questionId, table.voterKey),
]);

export const voteGuards = sqliteTable("vote_guards", {
  guardKey: text("guard_key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [
  index("vote_guards_expiry_idx").on(table.expiresAt),
]);

export const methodologyVersions = sqliteTable("methodology_versions", {
  id: text("id").primaryKey(),
  version: text("version").notNull().unique(),
  title: text("title").notNull(),
  samplingMethod: text("sampling_method").notNull(),
  integrityMethod: text("integrity_method").notNull(),
  explanationMethod: text("explanation_method").notNull(),
  modelPolicy: text("model_policy").notNull(),
  publishedAt: integer("published_at").notNull(),
});

export const questionReasons = sqliteTable("question_reasons", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => questions.id),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [index("question_reasons_question_idx").on(table.questionId)]);

export const voteEvents = sqliteTable("vote_events", {
  id: text("id").primaryKey(),
  voteId: text("vote_id").notNull().unique().references(() => votes.id),
  questionId: text("question_id").notNull().references(() => questions.id),
  payloadHash: text("payload_hash").notNull().unique(),
  integrityStatus: text("integrity_status").notNull(),
  integrityReason: text("integrity_reason").notNull(),
  responseMs: integer("response_ms"),
  sourceClass: text("source_class").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("vote_events_question_idx").on(table.questionId, table.createdAt)]);

export const explanations = sqliteTable("explanations", {
  id: text("id").primaryKey(),
  voteId: text("vote_id").notNull().unique().references(() => votes.id),
  questionId: text("question_id").notNull().references(() => questions.id),
  choice: text("choice").notNull(),
  reasonId: text("reason_id").references(() => questionReasons.id),
  explanation: text("explanation"),
  quoteConsent: integer("quote_consent").notNull().default(0),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("explanations_question_idx").on(table.questionId, table.choice)]);

export const aggregateSnapshots = sqliteTable("aggregate_snapshots", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => questions.id),
  methodologyVersion: text("methodology_version").notNull(),
  humanTotal: integer("human_total").notNull(),
  humanA: integer("human_a").notNull(),
  humanB: integer("human_b").notNull(),
  trustedTotal: integer("trusted_total").notNull(),
  flaggedTotal: integer("flagged_total").notNull(),
  merkleRoot: text("merkle_root").notNull(),
  previousSnapshotHash: text("previous_snapshot_hash"),
  snapshotHash: text("snapshot_hash").notNull().unique(),
  signature: text("signature").notNull(),
  publicKey: text("public_key").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("aggregate_snapshots_question_idx").on(table.questionId, table.createdAt)]);
