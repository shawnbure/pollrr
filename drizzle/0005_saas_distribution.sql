ALTER TABLE `organizations` ADD `status` text NOT NULL DEFAULT 'active';
ALTER TABLE `organizations` ADD `plan` text NOT NULL DEFAULT 'pilot';
ALTER TABLE `organizations` ADD `contact_email` text;
ALTER TABLE `organization_members` ADD `status` text NOT NULL DEFAULT 'active';
ALTER TABLE `organization_members` ADD `title` text;
ALTER TABLE `audiences` ADD `type` text NOT NULL DEFAULT 'organic';
ALTER TABLE `audiences` ADD `status` text NOT NULL DEFAULT 'draft';
ALTER TABLE `audiences` ADD `target_size` integer;
ALTER TABLE `audiences` ADD `consent_basis` text;
ALTER TABLE `distribution_links` ADD `responses` integer NOT NULL DEFAULT 0;
ALTER TABLE `distribution_links` ADD `status` text NOT NULL DEFAULT 'active';

CREATE TABLE `platform_admins` (
  `email` text PRIMARY KEY NOT NULL,
  `role` text NOT NULL,
  `created_at` integer NOT NULL
);
CREATE TABLE `audience_imports` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `audience_id` text NOT NULL REFERENCES `audiences`(`id`),
  `filename` text NOT NULL,
  `row_count` integer NOT NULL,
  `accepted_count` integer NOT NULL,
  `duplicate_count` integer NOT NULL,
  `status` text NOT NULL,
  `created_by` text NOT NULL,
  `created_at` integer NOT NULL
);
CREATE TABLE `audience_contacts` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `audience_id` text NOT NULL REFERENCES `audiences`(`id`),
  `channel` text NOT NULL,
  `contact_ciphertext` text NOT NULL,
  `contact_hash` text NOT NULL,
  `masked_contact` text NOT NULL,
  `first_name_ciphertext` text,
  `consent_status` text NOT NULL,
  `consent_source` text NOT NULL,
  `consent_text` text NOT NULL,
  `consented_at` integer,
  `revoked_at` integer,
  `created_at` integer NOT NULL
);
CREATE UNIQUE INDEX `audience_contacts_dedupe_idx` ON `audience_contacts` (`organization_id`,`contact_hash`);
CREATE INDEX `audience_contacts_audience_idx` ON `audience_contacts` (`audience_id`,`consent_status`);
CREATE TABLE `contact_opt_ins` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `channel` text NOT NULL,
  `contact_ciphertext` text NOT NULL,
  `contact_hash` text NOT NULL,
  `masked_contact` text NOT NULL,
  `interests` text,
  `consent_version` text NOT NULL,
  `consent_text` text NOT NULL,
  `status` text NOT NULL,
  `created_at` integer NOT NULL,
  `revoked_at` integer
);
CREATE UNIQUE INDEX `contact_opt_ins_dedupe_idx` ON `contact_opt_ins` (`organization_id`,`contact_hash`);
CREATE TABLE `integrations` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `provider` text NOT NULL,
  `account_label` text,
  `status` text NOT NULL,
  `capabilities` text NOT NULL,
  `created_by` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX `integrations_org_provider_idx` ON `integrations` (`organization_id`,`provider`);
CREATE TABLE `distribution_events` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `distribution_link_id` text NOT NULL REFERENCES `distribution_links`(`id`),
  `event_type` text NOT NULL,
  `ripple_id` text,
  `parent_ripple_id` text,
  `referrer_class` text,
  `created_at` integer NOT NULL
);
CREATE INDEX `distribution_events_link_idx` ON `distribution_events` (`distribution_link_id`,`created_at`);
CREATE TABLE `saved_reports` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `campaign_id` text REFERENCES `campaigns`(`id`),
  `name` text NOT NULL,
  `description` text,
  `filters_json` text NOT NULL,
  `visibility` text NOT NULL,
  `created_by` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
CREATE INDEX `saved_reports_org_idx` ON `saved_reports` (`organization_id`,`updated_at`);
CREATE TABLE `audit_log` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text,
  `actor_email` text NOT NULL,
  `action` text NOT NULL,
  `resource_type` text NOT NULL,
  `resource_id` text,
  `details_json` text NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `audit_log_org_idx` ON `audit_log` (`organization_id`,`created_at`);

