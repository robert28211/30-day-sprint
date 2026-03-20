# Spec 06: Weekly Scheduler

## JTBD

**When** Saturday morning arrives,
**He needs** all active client GBPs scanned automatically
**So that** weekly reports are ready without any manual effort.

## Cron Trigger

```
Schedule: 0 10 * * 6   (Saturday 10:00 AM UTC = 6:00 AM ET)
```

Configured in `wrangler.toml`:
```toml
[[triggers.crons]]
crons = ["0 10 * * 6"]
```

## Weekly Scan Logic

Handler: `src/cron/weeklyScan.js`

```
1. Fetch all clients WHERE active = 1 AND place_id IS NOT NULL
2. For each client (sequential, 500ms delay between calls to respect API quotas):
   a. Run audit via auditEngine.runAudit(place_id)
   b. Store AuditResult in D1 `audits` table
   c. Compare with previous audit (if exists) — compute score delta
   d. If competitor_place_ids exist, run competitor scan
   e. Store competitor snapshots in D1 `competitor_snapshots`
   f. Detect competitor changes (see spec 04)
   g. Send alerts if change thresholds exceeded
3. After all clients: send weekly summary email to robertlbutt@gmail.com
4. Log completion: total scanned, errors, alerts sent
```

## Weekly Summary Email

Sent to: `robertlbutt@gmail.com`
Subject: `EngageEngine Weekly GBP Report — [date]`

Contents:
- Total clients scanned / errors
- Top 3 clients by score improvement (delta from last week)
- Top 3 clients with biggest score decline (needs attention)
- Competitor alerts fired this week
- Any clients with `place_id = NULL` (unresolved, needs manual fix)

Plain text email via fetch to a transactional email service (Resend or Mailgun).
Email API key stored as Worker secret: `EMAIL_API_KEY`.
Sender: `reports@engageengine.com` (or configured via `EMAIL_FROM` env var).

## Error Handling

- Per-client failures are caught and logged — one client failure does not abort the scan
- Failed clients added to summary email with error message
- If Places API quota exhausted mid-scan: stop, log remaining clients, alert Robbie
- Max runtime: 15 minutes (CF Worker subrequest limit awareness — use chunked processing if >30 clients)

## Manual Trigger Endpoint

```
POST /admin/scan/run
Headers: X-Admin-Key: {ADMIN_KEY}
Body: { "client_ids": [1, 2, 3] }  // optional — omit to scan all active
```

Runs the same scan logic on demand. Useful for testing or catching up after downtime.

Response:
```json
{
  "triggered": true,
  "client_count": 36,
  "estimated_duration_seconds": 90
}
```

Note: CF Workers have a 30-second wall clock limit for HTTP requests. For large scans, the endpoint should return immediately and the actual work happens via a Durable Object or Queue. Phase 1: accept the limit, scan up to ~20 clients per invocation; Phase 2: add CF Queues for full batch processing.

## Audit Storage

Each audit run saved to D1:
```sql
INSERT INTO audits (client_id, place_id, score, score_label, gaps_json, fields_json, audit_date)
VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
```

Previous audits retained (no deletion) — enables trend charting in future phases.

## D1 Table: `scan_runs`

```sql
CREATE TABLE scan_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  trigger TEXT,              -- 'cron' or 'manual'
  clients_scanned INTEGER,
  clients_errored INTEGER,
  alerts_sent INTEGER,
  summary_json TEXT          -- full run summary for debugging
);
```
