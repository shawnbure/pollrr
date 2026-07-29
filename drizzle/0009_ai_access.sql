INSERT INTO `creator_preferences` (`email`,`nightly_results`,`ai_plan`,`created_at`,`updated_at`)
VALUES
('smb@workrr.ai',0,'pro',1785378000000,1785378000000),
('smb+creator@workrr.ai',0,'pro',1785378000000,1785378000000)
ON CONFLICT(`email`) DO UPDATE SET `ai_plan`='pro',`updated_at`=excluded.`updated_at`;
