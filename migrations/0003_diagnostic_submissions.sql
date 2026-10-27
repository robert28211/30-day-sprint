-- 2026-10-27: diagnostic completions + plan applications (replaces Formspree mnjlkyjo).
-- The /api/diagnostic route also creates this table on first use.
CREATE TABLE IF NOT EXISTS diagnostic_submissions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  primary_fm TEXT,
  secondary_fm TEXT,
  name TEXT,
  email TEXT,
  company TEXT,
  payload TEXT NOT NULL,
  user_agent TEXT,
  emailed INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
