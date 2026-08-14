ALTER TABLE `questions` ADD COLUMN `public_token` text;
--> statement-breakpoint
UPDATE `questions` SET `public_token` = lower(hex(randomblob(6))) WHERE `public_token` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `questions_public_token_idx` ON `questions` (`public_token`);
--> statement-breakpoint
PRAGMA optimize;

