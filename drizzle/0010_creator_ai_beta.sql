CREATE TABLE IF NOT EXISTS `creator_ai_usage` (
  `email` text NOT NULL,
  `period` text NOT NULL,
  `actions` integer NOT NULL DEFAULT 0,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`email`, `period`)
);

ALTER TABLE `creator_preferences` ADD `ai_waitlist` integer NOT NULL DEFAULT 0;
