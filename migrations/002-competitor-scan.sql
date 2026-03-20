-- Migration 002: Add competitor_scan column to audits table
-- Stores the JSON result of scanCompetitors() for each audit.
-- Populated by weeklyScan cron and as live fallback in report routes.
-- NULL for audits created before this migration — renderer handles gracefully.

ALTER TABLE audits ADD COLUMN competitor_scan TEXT DEFAULT NULL;

-- Index to support audit history queries in report routes:
-- SELECT score, review_count, audit_date FROM audits WHERE client_id = ? ORDER BY audit_date DESC
CREATE INDEX IF NOT EXISTS idx_audits_client_date ON audits(client_id, audit_date DESC);
