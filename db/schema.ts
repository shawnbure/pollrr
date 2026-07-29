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
  organizationId: text("organization_id"),
  campaignId: text("campaign_id"),
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

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

export const organizationMembers = sqliteTable("organization_members", {
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  email: text("email").notNull(),
  role: text("role").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("organization_members_pk").on(table.organizationId, table.email)]);

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  objective: text("objective"),
  status: text("status").notNull(),
  startsAt: integer("starts_at"),
  endsAt: integer("ends_at"),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("campaigns_org_idx").on(table.organizationId, table.createdAt)]);

export const audiences = sqliteTable("audiences", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  geography: text("geography"),
  createdAt: integer("created_at").notNull(),
});

export const distributionLinks = sqliteTable("distribution_links", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  campaignId: text("campaign_id").notNull().references(() => campaigns.id),
  questionId: text("question_id").notNull().references(() => questions.id),
  audienceId: text("audience_id").references(() => audiences.id),
  channel: text("channel").notNull(),
  label: text("label").notNull(),
  token: text("token").notNull().unique(),
  clicks: integer("clicks").notNull().default(0),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("distribution_campaign_idx").on(table.campaignId, table.createdAt)]);

export const platformAdmins = sqliteTable("platform_admins", {
  email: text("email").primaryKey(),
  role: text("role").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const audienceImports = sqliteTable("audience_imports", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  audienceId: text("audience_id").notNull().references(() => audiences.id),
  filename: text("filename").notNull(),
  rowCount: integer("row_count").notNull(),
  acceptedCount: integer("accepted_count").notNull(),
  duplicateCount: integer("duplicate_count").notNull(),
  status: text("status").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const audienceContacts = sqliteTable("audience_contacts", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  audienceId: text("audience_id").notNull().references(() => audiences.id),
  channel: text("channel").notNull(),
  contactCiphertext: text("contact_ciphertext").notNull(),
  contactHash: text("contact_hash").notNull(),
  maskedContact: text("masked_contact").notNull(),
  firstNameCiphertext: text("first_name_ciphertext"),
  consentStatus: text("consent_status").notNull(),
  consentSource: text("consent_source").notNull(),
  consentText: text("consent_text").notNull(),
  consentedAt: integer("consented_at"),
  revokedAt: integer("revoked_at"),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  uniqueIndex("audience_contacts_dedupe_idx").on(table.organizationId, table.contactHash),
  index("audience_contacts_audience_idx").on(table.audienceId, table.consentStatus),
]);

export const contactOptIns = sqliteTable("contact_opt_ins", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  channel: text("channel").notNull(),
  contactCiphertext: text("contact_ciphertext").notNull(),
  contactHash: text("contact_hash").notNull(),
  maskedContact: text("masked_contact").notNull(),
  interests: text("interests"),
  consentVersion: text("consent_version").notNull(),
  consentText: text("consent_text").notNull(),
  status: text("status").notNull(),
  createdAt: integer("created_at").notNull(),
  revokedAt: integer("revoked_at"),
}, (table) => [uniqueIndex("contact_opt_ins_dedupe_idx").on(table.organizationId, table.contactHash)]);

export const integrations = sqliteTable("integrations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  provider: text("provider").notNull(),
  accountLabel: text("account_label"),
  status: text("status").notNull(),
  capabilities: text("capabilities").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [uniqueIndex("integrations_org_provider_idx").on(table.organizationId, table.provider)]);

export const distributionEvents = sqliteTable("distribution_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  distributionLinkId: text("distribution_link_id").notNull().references(() => distributionLinks.id),
  eventType: text("event_type").notNull(),
  rippleId: text("ripple_id"),
  parentRippleId: text("parent_ripple_id"),
  referrerClass: text("referrer_class"),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("distribution_events_link_idx").on(table.distributionLinkId, table.createdAt)]);

export const savedReports = sqliteTable("saved_reports", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  campaignId: text("campaign_id").references(() => campaigns.id),
  name: text("name").notNull(),
  description: text("description"),
  filtersJson: text("filters_json").notNull(),
  visibility: text("visibility").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id"),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  detailsJson: text("details_json").notNull(),
  createdAt: integer("created_at").notNull(),
});
