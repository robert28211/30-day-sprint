-- EngageEngine GBP Intelligence — D1 Schema
-- Run: wrangler d1 execute gbp-intelligence-db --file=migrations/001-init.sql

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'active',
  place_id TEXT,
  category TEXT,
  lat REAL,
  lng REAL,
  competitors_json TEXT DEFAULT '[]',
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_place_id ON clients(place_id);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);

CREATE TABLE IF NOT EXISTS audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id),
  place_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  score_label TEXT NOT NULL,
  score_delta INTEGER,
  gaps_json TEXT NOT NULL,
  fields_json TEXT NOT NULL,
  audit_date TEXT DEFAULT (datetime('now')),
  triggered_by TEXT DEFAULT 'cron'
);

CREATE INDEX IF NOT EXISTS idx_audits_client_id ON audits(client_id);
CREATE INDEX IF NOT EXISTS idx_audits_place_id ON audits(place_id);
CREATE INDEX IF NOT EXISTS idx_audits_date ON audits(audit_date);

CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id),
  competitor_place_id TEXT NOT NULL,
  competitor_name TEXT,
  snapshot_json TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_client ON competitor_snapshots(client_id);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_date ON competitor_snapshots(snapshot_date);

CREATE TABLE IF NOT EXISTS competitor_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id),
  competitor_place_id TEXT NOT NULL,
  competitor_name TEXT,
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  alert_sent INTEGER DEFAULT 0,
  detected_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_competitor_events_client ON competitor_events(client_id);
CREATE INDEX IF NOT EXISTS idx_competitor_events_alert ON competitor_events(alert_sent);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id TEXT,
  business_name TEXT,
  contact_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  score INTEGER,
  score_label TEXT,
  gaps_json TEXT,
  report_sent INTEGER DEFAULT 0,
  notified_robbie INTEGER DEFAULT 0,
  source TEXT DEFAULT 'gbp-score',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);

CREATE TABLE IF NOT EXISTS scan_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  trigger TEXT NOT NULL,
  clients_scanned INTEGER DEFAULT 0,
  clients_errored INTEGER DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,
  summary_json TEXT
);
