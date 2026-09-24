CREATE TABLE IF NOT EXISTS `creator_ai_poll_drafts` (
  `email` text NOT NULL,
  `period` text NOT NULL,
  `draft_id` text NOT NULL,
  `created_at` integer NOT NULL,
  PRIMARY KEY (`email`, `period`, `draft_id`)
);

CREATE INDEX IF NOT EXISTS `creator_ai_poll_drafts_period_idx`
  ON `creator_ai_poll_drafts` (`period`);
