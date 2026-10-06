CREATE TABLE IF NOT EXISTS billing_runtime_config (
  id INTEGER PRIMARY KEY CHECK (id = 1), mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test','live')),
  updated_by TEXT, updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO billing_runtime_config (id, mode, updated_at) VALUES (1, 'test', unixepoch() * 1000);
ALTER TABLE creator_memberships ADD COLUMN billing_reference TEXT;
UPDATE creator_memberships SET billing_reference = lower(hex(randomblob(16))) WHERE billing_reference IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS creator_memberships_billing_reference ON creator_memberships(billing_reference);
ALTER TABLE billing_events ADD COLUMN mode TEXT NOT NULL DEFAULT 'test';
