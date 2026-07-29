INSERT OR IGNORE INTO `organizations`
(`id`,`name`,`slug`,`status`,`plan`,`contact_email`,`created_at`)
VALUES
('pollrr-creator-test-org','Creator Test Account','creator-test','active','free','smb+creator@workrr.ai',1785374400000);

INSERT OR IGNORE INTO `organization_members`
(`organization_id`,`email`,`role`,`status`,`title`,`created_at`)
VALUES
('pollrr-creator-test-org','smb+creator@workrr.ai','owner','active','Creator test user',1785374400000);

INSERT OR IGNORE INTO `campaigns`
(`id`,`organization_id`,`name`,`objective`,`status`,`created_at`)
VALUES
('pollrr-creator-test-library','pollrr-creator-test-org','My polls','Creator poll library','active',1785374400000);

INSERT OR IGNORE INTO `questions`
(`id`,`prompt`,`option_a`,`option_b`,`topic`,`region`,`status`,`scheduled_at`,`created_at`,`organization_id`,`campaign_id`,`created_by`,`theme`,`is_public`)
VALUES
('creator-test-weekend','Should every company try a four-day workweek?','Yes, try it','No, keep five days','Work','Everywhere','live',NULL,1785374400001,'pollrr-creator-test-org','pollrr-creator-test-library','smb+creator@workrr.ai','paper',1),
('creator-test-ai','Would you let AI make a major financial decision for you?','Yes, with oversight','No, never','Technology','Everywhere','live',NULL,1785374400002,'pollrr-creator-test-org','pollrr-creator-test-library','smb+creator@workrr.ai','ocean',1),
('creator-test-city','Should downtown streets prioritize pedestrians over parking?','Prioritize people','Prioritize parking','Cities','Everywhere','paused',NULL,1785374400003,'pollrr-creator-test-org','pollrr-creator-test-library','smb+creator@workrr.ai','sunset',1);
