# TODOS — GBP Intelligence Platform

## P2 — Next Sprint (after competitor benchmarking ships)

### Admin UI: Pin Competitors per Client
**What:** Add a "Pin Competitors" section to the client detail page in the admin dashboard. Show the current competitor_scan results (auto-discovered competitor names + place IDs), let Robbie replace any incorrect one with a specific place ID.

**Why:** Competitor auto-discovery (Places API nearby search by category) will sometimes pick the wrong business. Without a UI to correct it, the only path is a raw API call. With 33+ clients each having 3 competitors, some will be wrong — and wrong competitor data makes the entire competitive section misleading.

**Pros:**
- Makes competitor data quality maintainable as client count grows
- Builds on `handleSaveCompetitors()` which already exists in admin.js

**Cons:**
- Small admin UI surface to maintain

**Context:** `handleSaveCompetitors()` in `src/routes/admin.js` already accepts a POST with `competitors_json`. The client detail page (`renderClientDetail` in `src/templates/admin/templates.js`) just needs a form section that shows the current competitor names (from competitor_scan JSON) with editable place ID fields. After submission, the next weekly scan will use the pinned IDs instead of auto-discovering.

**Effort:** S (1 hr CC — human team: ~4 hrs)
**Priority:** P2
**Depends on:** Competitor benchmarking in reports must ship first so you can see what's being auto-discovered.

---

### Weekly Intelligence Digest Email
**What:** After each Saturday cron scan, auto-send each client a concise digest email: score delta vs. last week, competitor movements (who gained reviews/photos), and the #1 recommended action ranked by revenue impact.

**Why:** Without this, the platform is pull — clients have to remember to check. With it, it becomes push — you're top of mind every Monday morning and the platform justifies its retainer fee through consistent, visible value delivery.

**Pros:**
- Turns a report tool into a persistent client relationship
- Near-zero marginal cost once built (Resend integration already exists)
- Justifies premium pricing — clients see value every week without logging in

**Cons:**
- Requires `email` column on `clients` table (1 migration)
- Needs client opt-in logic (don't spam clients who haven't been onboarded)
- Needs digest template (competitor delta format)

**Context:** The email module (`src/modules/email.js`) and weekly cron (`src/cron/weeklyScan.js`) already exist. After competitor benchmarking is live, the weekly scan already has all the data needed — it just doesn't send it anywhere. This is primarily a template + opt-in layer on top of existing infrastructure.

**Effort:** M (2 hrs CC — human team: 1.5 days)
**Priority:** P2
**Depends on:** Competitor benchmarking in reports (Proposal 1) must be live and validated first. Collect feedback from 2-3 clients on the report format before automating delivery.

**Where to start:**
1. `migrations/003-client-email.sql` — add `email TEXT` and `digest_opt_in BOOLEAN DEFAULT 0` to `clients`
2. `src/cron/weeklyScan.js` — add digest send loop after scan completes
3. `src/modules/email.js` — add `sendWeeklyDigest(client, audit, prevAudit, competitorScan)` function
4. Design digest email template (plain text preferred — higher deliverability than HTML)
