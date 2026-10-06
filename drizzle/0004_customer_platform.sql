CREATE TABLE `organizations` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `created_at` integer NOT NULL
);
CREATE TABLE `organization_members` (
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `email` text NOT NULL,
  `role` text NOT NULL,
  `created_at` integer NOT NULL,
  PRIMARY KEY (`organization_id`, `email`)
);
CREATE TABLE `campaigns` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `name` text NOT NULL,
  `objective` text,
  `status` text NOT NULL,
  `starts_at` integer,
  `ends_at` integer,
  `created_at` integer NOT NULL
);
CREATE INDEX `campaigns_org_idx` ON `campaigns` (`organization_id`, `created_at`);
CREATE TABLE `audiences` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `name` text NOT NULL,
  `description` text,
  `geography` text,
  `created_at` integer NOT NULL
);
CREATE TABLE `distribution_links` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL REFERENCES `organizations`(`id`),
  `campaign_id` text NOT NULL REFERENCES `campaigns`(`id`),
  `question_id` text NOT NULL REFERENCES `questions`(`id`),
  `audience_id` text REFERENCES `audiences`(`id`),
  `channel` text NOT NULL,
  `label` text NOT NULL,
  `token` text NOT NULL UNIQUE,
  `clicks` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `distribution_campaign_idx` ON `distribution_links` (`campaign_id`, `created_at`);
ALTER TABLE `questions` ADD `organization_id` text REFERENCES `organizations`(`id`);
ALTER TABLE `questions` ADD `campaign_id` text REFERENCES `campaigns`(`id`);

INSERT INTO `organizations` (`id`,`name`,`slug`,`created_at`) VALUES
  ('org-pollrr','Pollrr Research','pollrr-research',1785283200000);

INSERT INTO `campaigns` (`id`,`organization_id`,`name`,`objective`,`status`,`created_at`) VALUES
  ('campaign-launch','org-pollrr','Arizona Housing Pulse','Understand tradeoffs between housing supply, affordability, and neighborhood change.','active',1785283200000);
INSERT INTO `audiences` (`id`,`organization_id`,`name`,`description`,`geography`,`created_at`) VALUES
  ('audience-arizona','org-pollrr','Arizona residents','Open-link respondents in Arizona.','Arizona',1785283200000),
  ('audience-partners','org-pollrr','Community partners','Respondents recruited through partner organizations.','Arizona',1785283200000);
UPDATE `questions` SET `organization_id`='org-pollrr', `campaign_id`='campaign-launch'
WHERE `organization_id` IS NULL;
