ALTER TABLE `votes` ADD `voter_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `votes_voter_idx` ON `votes` (`question_id`,`voter_key`);--> statement-breakpoint
INSERT OR IGNORE INTO `questions`
  (`id`, `prompt`, `option_a`, `option_b`, `topic`, `region`, `status`, `scheduled_at`, `created_at`)
VALUES
  ('pollrr-launch-housing-az',
   'Should Arizona allow more homes if it lowers prices but increases neighborhood density?',
   'Yes, build more',
   'No, preserve neighborhoods',
   'Housing',
   'Arizona',
   'live',
   NULL,
   1785268800000);
