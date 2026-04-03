CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  verification_token TEXT NOT NULL,
  verified_at TEXT,
  stripe_account_id TEXT,
  default_price INTEGER NOT NULL,
  origin_method TEXT NOT NULL,
  origin_url TEXT,
  origin_secret TEXT,
  origin_secret_prev TEXT,
  origin_secret_prev_expires_at TEXT,
  network TEXT NOT NULL DEFAULT 'base',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bot_allowlist (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_agent_pattern TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS path_exclusions (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id),
  payment_id TEXT NOT NULL UNIQUE,
  tx_hash TEXT UNIQUE,
  payer_address TEXT,
  amount INTEGER NOT NULL,
  path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  user_agent TEXT,
  created_at TEXT NOT NULL,
  verified_at TEXT
);

CREATE TABLE IF NOT EXISTS balances (
  site_id TEXT PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id),
  amount INTEGER NOT NULL,
  stripe_payout_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sites_account_id ON sites(account_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);
CREATE INDEX IF NOT EXISTS idx_payments_site_id ON payments(site_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON payments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_balances_amount ON balances(amount);
CREATE INDEX IF NOT EXISTS idx_bot_allowlist_site_id ON bot_allowlist(site_id);
CREATE INDEX IF NOT EXISTS idx_path_exclusions_site_id ON path_exclusions(site_id);
CREATE INDEX IF NOT EXISTS idx_payouts_site_id ON payouts(site_id);
