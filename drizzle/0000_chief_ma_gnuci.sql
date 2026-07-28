CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`option_a` text NOT NULL,
	`option_b` text NOT NULL,
	`topic` text NOT NULL,
	`region` text NOT NULL,
	`status` text NOT NULL,
	`scheduled_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`choice` text NOT NULL,
	`ripple_id` text NOT NULL,
	`parent_ripple_id` text,
	`region_code` text,
	`consent_version` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `votes_question_idx` ON `votes` (`question_id`);--> statement-breakpoint
CREATE INDEX `votes_ripple_idx` ON `votes` (`ripple_id`);