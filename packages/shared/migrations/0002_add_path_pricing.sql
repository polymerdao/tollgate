CREATE TABLE IF NOT EXISTS path_pricing (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_path_pricing_site_id ON path_pricing(site_id);
