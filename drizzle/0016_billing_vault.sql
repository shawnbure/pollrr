CREATE TABLE IF NOT EXISTS billing_credentials (
  mode TEXT PRIMARY KEY CHECK (mode IN ('test','live')),
  api_key_ciphertext TEXT,
  pro_price_ciphertext TEXT,
  studio_price_ciphertext TEXT,
  webhook_secret_ciphertext TEXT,
  updated_by TEXT,
  updated_at INTEGER NOT NULL
);
