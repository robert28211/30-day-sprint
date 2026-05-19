CREATE TABLE IF NOT EXISTS snapshot_leads (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT NOT NULL,
  city_state TEXT NOT NULL,
  trade TEXT NOT NULL,
  website TEXT DEFAULT '',
  total_buyers INTEGER NOT NULL,
  multi_site INTEGER NOT NULL,
  uncaptured INTEGER NOT NULL,
  competitor_exposed INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snapshot_leads_email ON snapshot_leads(email);
CREATE INDEX IF NOT EXISTS idx_snapshot_leads_created ON snapshot_leads(created_at DESC);
