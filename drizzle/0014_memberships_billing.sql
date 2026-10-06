CREATE TABLE IF NOT EXISTS creator_memberships (
  email TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  billing_provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  requested_plan_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS creator_ai_daily_usage (
  email TEXT NOT NULL,
  day TEXT NOT NULL,
  actions INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (email, day)
);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  email TEXT,
  plan_id TEXT,
  payload_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO creator_memberships
  (email, plan_id, status, created_at, updated_at)
SELECT email, CASE WHEN ai_plan='pro' THEN 'pro' ELSE 'free' END, 'active', created_at, updated_at
FROM creator_preferences;
