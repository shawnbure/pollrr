CREATE TABLE `methodology_versions` (
  `id` text PRIMARY KEY NOT NULL,
  `version` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `sampling_method` text NOT NULL,
  `integrity_method` text NOT NULL,
  `explanation_method` text NOT NULL,
  `model_policy` text NOT NULL,
  `published_at` integer NOT NULL
);

CREATE TABLE `question_reasons` (
  `id` text PRIMARY KEY NOT NULL,
  `question_id` text NOT NULL REFERENCES `questions`(`id`),
  `label` text NOT NULL,
  `sort_order` integer NOT NULL
);
CREATE INDEX `question_reasons_question_idx` ON `question_reasons` (`question_id`);

CREATE TABLE `vote_events` (
  `id` text PRIMARY KEY NOT NULL,
  `vote_id` text NOT NULL UNIQUE REFERENCES `votes`(`id`),
  `question_id` text NOT NULL REFERENCES `questions`(`id`),
  `payload_hash` text NOT NULL UNIQUE,
  `integrity_status` text NOT NULL,
  `integrity_reason` text NOT NULL,
  `response_ms` integer,
  `source_class` text NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `vote_events_question_idx` ON `vote_events` (`question_id`, `created_at`);

CREATE TABLE `explanations` (
  `id` text PRIMARY KEY NOT NULL,
  `vote_id` text NOT NULL UNIQUE REFERENCES `votes`(`id`),
  `question_id` text NOT NULL REFERENCES `questions`(`id`),
  `choice` text NOT NULL,
  `reason_id` text REFERENCES `question_reasons`(`id`),
  `explanation` text,
  `quote_consent` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `explanations_question_idx` ON `explanations` (`question_id`, `choice`);

CREATE TABLE `aggregate_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `question_id` text NOT NULL REFERENCES `questions`(`id`),
  `methodology_version` text NOT NULL,
  `human_total` integer NOT NULL,
  `human_a` integer NOT NULL,
  `human_b` integer NOT NULL,
  `trusted_total` integer NOT NULL,
  `flagged_total` integer NOT NULL,
  `merkle_root` text NOT NULL,
  `previous_snapshot_hash` text,
  `snapshot_hash` text NOT NULL UNIQUE,
  `signature` text NOT NULL,
  `public_key` text NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `aggregate_snapshots_question_idx` ON `aggregate_snapshots` (`question_id`, `created_at`);

INSERT INTO `methodology_versions`
  (`id`, `version`, `title`, `sampling_method`, `integrity_method`, `explanation_method`, `model_policy`, `published_at`)
VALUES
  ('method-v1', '1.0.0', 'Pollrr Human Signal v1',
   'Open, voluntary convenience sample recruited through shared links. Results describe participating respondents and are not population estimates.',
   'One vote per anonymous device key per question; network attempt limits; response-time and coordination signals flag but never erase human votes.',
   'Optional respondent-selected reasons and consented text. Reason percentages use explanation respondents as the denominator, never all voters.',
   'Raw human votes are reported separately. No synthetic respondent or AI-generated vote is included. Modeled estimates, when present, must be labeled and stored separately.',
   1785283200000);

INSERT INTO `question_reasons` (`id`, `question_id`, `label`, `sort_order`) VALUES
  ('housing-cost', 'pollrr-launch-housing-az', 'Housing affordability', 1),
  ('housing-growth', 'pollrr-launch-housing-az', 'Economic growth', 2),
  ('housing-character', 'pollrr-launch-housing-az', 'Neighborhood character', 3),
  ('housing-infrastructure', 'pollrr-launch-housing-az', 'Traffic and infrastructure', 4),
  ('housing-environment', 'pollrr-launch-housing-az', 'Environmental impact', 5);
