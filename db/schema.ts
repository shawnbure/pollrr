import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("votes_question_idx").on(table.questionId),
  index("votes_ripple_idx").on(table.rippleId),
]);
