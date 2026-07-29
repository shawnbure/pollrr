ALTER TABLE `questions` ADD `created_by` text;
ALTER TABLE `questions` ADD `theme` text NOT NULL DEFAULT 'paper';
ALTER TABLE `questions` ADD `is_public` integer NOT NULL DEFAULT 1;

CREATE TABLE `creator_preferences` (
  `email` text PRIMARY KEY NOT NULL,
  `nightly_results` integer NOT NULL DEFAULT 0,
  `ai_plan` text NOT NULL DEFAULT 'free',
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
