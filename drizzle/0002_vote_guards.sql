CREATE TABLE `vote_guards` (
  `guard_key` text PRIMARY KEY NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `expires_at` integer NOT NULL
);
CREATE INDEX `vote_guards_expiry_idx` ON `vote_guards` (`expires_at`);
