CREATE TABLE IF NOT EXISTS creator_accounts (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS creator_passkeys (
  credential_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES creator_accounts(id),
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT NOT NULL DEFAULT '[]',
  device_type TEXT NOT NULL,
  backed_up INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS creator_passkeys_account_idx ON creator_passkeys(account_id);

CREATE TABLE IF NOT EXISTS creator_auth_challenges (
  id TEXT PRIMARY KEY,
  challenge TEXT NOT NULL,
  ceremony TEXT NOT NULL,
  account_id TEXT,
  handle TEXT,
  rp_id TEXT NOT NULL,
  origin TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS creator_auth_challenges_expiry_idx ON creator_auth_challenges(expires_at);
