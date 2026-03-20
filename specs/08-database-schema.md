# Spec 08: Database Schema (D1)

## Overview

All persistent data lives in Cloudflare D1 (SQLite). One database: `gbp-intelligence`.

D1 binding in Worker: `DB`

## Full Schema

```sql
-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'active',         -- 'active', 'suspended', 'closed', 'duplicate', 'unverified'
  place_id TEXT,                        -- NULL until resolved via Places API
  category TEXT,                        -- resolved from Places API types
  lat REAL,
  lng REAL,
  competitors_json TEXT DEFAULT '[]',   -- JSON array of competitor place_ids
  notes TEXT,                           -- internal notes (e.g. "confirm with client")
  active INTEGER NOT NULL DEFAULT 1,    -- 1 = monitored, 0 = excluded from weekly scan
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_place_id ON clients(place_id);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);

-- ============================================================
-- AUDITS
-- ============================================================
CREATE TABLE IF NOT EXISTS audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id),
  place_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  score_label TEXT NOT NULL,            -- 'Excellent', 'Good', 'Needs Work', 'Critical'
  score_delta INTEGER,                  -- vs previous audit (NULL if first)
  gaps_json TEXT NOT NULL,              -- JSON array of Gap objects
  fields_json TEXT NOT NULL,            -- JSON of raw AuditResult.fields
  audit_date TEXT DEFAULT (datetime('now')),
  triggered_by TEXT DEFAULT 'cron'      -- 'cron', 'manual', 'api'
);

CREATE INDEX IF NOT EXISTS idx_audits_client_id ON audits(client_id);
CREATE INDEX IF NOT EXISTS idx_audits_place_id ON audits(place_id);
CREATE INDEX IF NOT EXISTS idx_audits_date ON audits(audit_date);

-- ============================================================
-- COMPETITOR SNAPSHOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id),
  competitor_place_id TEXT NOT NULL,
  competitor_name TEXT,
  snapshot_json TEXT NOT NULL,          -- full AuditResult JSON
  snapshot_date TEXT NOT NULL,          -- YYYY-MM-DD
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_client ON competitor_snapshots(client_id);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_date ON competitor_snapshots(snapshot_date);

-- ============================================================
-- COMPETITOR EVENTS (change detection alerts)
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id),
  competitor_place_id TEXT NOT NULL,
  competitor_name TEXT,
  event_type TEXT NOT NULL,             -- 'rating_drop', 'rating_rise', 'review_surge', 'listing_closed', 'photo_surge'
  old_value TEXT,
  new_value TEXT,
  alert_sent INTEGER DEFAULT 0,
  detected_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_competitor_events_client ON competitor_events(client_id);
CREATE INDEX IF NOT EXISTS idx_competitor_events_alert ON competitor_events(alert_sent);

-- ============================================================
-- LEADS (public lead magnet captures)
-- ============================================================
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

-- ============================================================
-- SCAN RUNS (weekly cron audit history)
-- ============================================================
CREATE TABLE IF NOT EXISTS scan_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  trigger TEXT NOT NULL,                -- 'cron' or 'manual'
  clients_scanned INTEGER DEFAULT 0,
  clients_errored INTEGER DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,
  summary_json TEXT                     -- full run summary for debugging
);
```

## KV Cache Schema

KV binding: `CACHE`

| Key pattern | Value | TTL |
|-------------|-------|-----|
| `place:{place_id}` | Full Places API JSON response | 86400s (24h) |
| `ratelimit:score:{ip}` | Request count (integer as string) | 3600s (1h) |
| `ratelimit:lead:{email}` | Lead count (integer as string) | 2592000s (30d) |

## Environment Variables / Secrets

| Name | Type | Purpose |
|------|------|---------|
| `GOOGLE_PLACES_API_KEY` | Secret | Places API calls |
| `REPORT_SECRET` | Secret | Auth token for report URLs |
| `ADMIN_KEY` | Secret | Admin endpoint auth header |
| `EMAIL_API_KEY` | Secret | Resend/Mailgun transactional email |
| `EMAIL_FROM` | Var | Sender address (e.g. reports@engageengine.com) |
| `ROBBIE_EMAIL` | Var | robertlbutt@gmail.com |
| `CALENDAR_URL` | Var | Robbie's booking link for lead emails |

## Migration Strategy

Migrations applied via `wrangler d1 execute gbp-intelligence --file=migrations/001-init.sql`

All migrations in `migrations/` directory, numbered sequentially.
No ORM — raw SQL via `env.DB.prepare()` and `env.DB.batch()`.

## Seed Script

`scripts/seed.js` — inserts all 46 clients from spec 01 into the `clients` table.

Run: `wrangler d1 execute gbp-intelligence --file=scripts/seed.sql`

The seed SQL file is auto-generated from the spec 01 JSON by a one-time script.
