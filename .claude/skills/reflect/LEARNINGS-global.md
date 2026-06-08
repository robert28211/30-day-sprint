# Global Learnings
<!-- Maintained by /reflect. Newest at top. Each line: - [TIER] (YYYY-MM-DD) statement -->

- [HIGH] (2026-06-08) Operations Hub persona is Gojo (madhvantyagi/SOUL.md/souls/gojo). Jarvis replaced. Future persona changes require updating 4 places in worker.js: SYSTEM_PROMPT personality block, synthesisPrompt tone section, brief API system message string, and UI greeting strings — then wrangler deploy.
- [HIGH] (2026-06-08) Operations Hub D1 `daily_briefs` table columns are `narrative_text`, `action_items_json`, `generated_at`, `status` — NOT `narrative` or `action_items`. Wrong column names return 400 SQLITE_ERROR.
- [HIGH] (2026-06-08) Operations Hub morning brief generation fails with "Too many subrequests by single Worker invocation" — all D1 brief rows contain only the error string, no real content. This is an unresolved bug that must be fixed before the brief is useful.
- [MED] (2026-06-08) `/api/generate-brief` requires session cookie auth (checkAuth), not the sync token. Cannot trigger via curl. Must use the browser (logged-in session) or call `regenerateBrief()` via browser JS on the authenticated tab.
- [MED] (2026-06-08) When polling for Operations Hub brief readiness, use browser-side JS (`fetch('/api/daily-brief')` from the authenticated tab) — the endpoint is behind auth and curl returns empty/wrong data.
