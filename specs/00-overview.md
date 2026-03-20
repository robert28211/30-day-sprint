# EngageEngine Demand Intelligence Platform — Overview

## What This Is

A Cloudflare Worker platform that turns Google Business Profile data into revenue intelligence
for local service businesses. Built for Robbie Butt / EngageEngine to:

1. **Monitor 46 client GBPs** automatically every Saturday
2. **Audit any prospect's profile** in 30 seconds as a sales weapon
3. **Track competitors** and alert when opportunity windows open
4. **Generate warm leads** via a public "Get Your Free GBP Score" page

## The Core Insight

GBP is the #1 local demand capture point. Every incomplete field, unanswered review, and
missing photo is a **demand leak**. This platform makes those leaks visible in dollar terms —
which is exactly what EngageEngine sells against (Demand Control).

## Three Faces

```
INTERNAL TOOL (Robbie)        SALES TOOL (prospect calls)     LEAD MAGNET (public)
─────────────────────         ──────────────────────────       ────────────────────
Run audit on any business  →  Printed prospect report     →   marketingperformance.net/gbp-score
Weekly auto-scan of 46        before walking into a            "Get your free GBP score"
client GBPs                   sales call                       Email capture → CRM
Competitor change alerts
```

## API Strategy

**Phase 1 (NOW — no approval needed):**
- Google Places API — public GBP data: rating, reviews, hours, photos, categories, website, phone
- Revenue estimates use LocaliQ/WordStream industry benchmarks
- Covers all 3 use cases with public data

**Phase 2 (when GBP API approved at 300 QPM):**
- GBP Private API — insights, post history, Q&A, response rates, attribute completeness
- Revenue estimates become actual-data-driven
- Google Cloud project: `gbp-analyzer-488210` (robertlbutt@gmail.com)
- Access request submitted, pending review (currently 0 QPM)

## Known Flags in Client List

The following 46 GBPs were extracted from business.google.com on 2026-03-20. Flags noted:

- **Furniture on Sunset** — Marked as closed from Google (confirm with client)
- **Genesis Pro Painters** — Suspended (needs reinstatement before auditing)
- **CENTA Medical Group** (9 Medical Park Dr #510, Columbia) — Duplicate
- **Midland's Construction** — Verification required
- **Pucci Commercial Properties** — Verification required
- **Smith-Built Metals** (Dawson GA) — Duplicate of Smith-Built Metal Building & Supplies
- **Sub Station II** — Permanently closed (exclude from active monitoring)
- **Sandra E. Hennies, M.Ed., LMFT** — Duplicate
- **Signature Catering** (991 1st St S) — Duplicate
- **Rytech Restoration of the Midlands** — Duplicate

The platform should skip Suspended, Permanently Closed, and Duplicate profiles in weekly scans
but still store them in the DB for reference.
