# Spec 04: Competitor Scanner

## JTBD

**When** Robbie wants to show a client where they stand vs the competition,
**He needs** side-by-side GBP audits of the client and their top competitors
**So that** specific gaps can be framed as "they're beating you because of X" not just "you should fix X."

**When** a competitor's profile changes significantly,
**He needs** an alert
**So that** he can proactively contact the client with intelligence before they ask.

## Input

```json
{
  "subject_place_id": "ChIJ...",     // the client or prospect being analyzed
  "competitor_place_ids": ["ChIJ...", "ChIJ...", "ChIJ..."]  // 2–5 competitors
}
```

Competitor place IDs are stored in `clients.competitors_json` (JSON array).
For prospect audits, competitors are found via nearby search: same category, same city.

## Competitor Auto-Discovery (for prospects)

When no competitor list is provided:
1. Call Places API nearby search: `type={primary_category}`, `location={lat,lng}`, `rankby=prominence`, `radius=10000`
2. Return top 3 results excluding the subject itself
3. Show Robbie the auto-discovered competitors in the audit result — he can approve/override

```
GET /api/nearby-competitors?place_id=ChIJ...&limit=3
```

## Gap Matrix Output

```json
{
  "subject": { ...AuditResult },
  "competitors": [
    { ...AuditResult },
    { ...AuditResult }
  ],
  "matrix": {
    "rating":        { "subject": 4.2, "competitors": [4.8, 4.6], "subject_rank": 3 },
    "review_count":  { "subject": 38,  "competitors": [127, 89],  "subject_rank": 3 },
    "photo_count":   { "subject": 12,  "competitors": [8, 45],    "subject_rank": 2 },
    "has_website":   { "subject": true, "competitors": [true, true] },
    "has_hours":     { "subject": true, "competitors": [true, true] }
  },
  "key_gaps": [
    "Competitor 1 has 3x more reviews — they dominate 'best reviewed' searches",
    "You have fewer photos than 2 of 3 competitors"
  ]
}
```

## Change Detection (Weekly)

Every Saturday, after running all client audits:
1. Compare current snapshot vs previous snapshot in D1 `competitor_snapshots` table
2. Flag changes: rating change ≥ 0.2, review count change ≥ 5, photo count change ≥ 5
3. Notable events: new review cluster (5+ reviews in 7 days), listing closed/reopened

Changes stored in `competitor_events` table:
`(id, client_id, competitor_place_id, event_type, old_value, new_value, detected_at)`

## Alert Rules

Alert Robbie via email when:
- Competitor rating drops below 4.0 (opportunity: they're vulnerable)
- Competitor gets 5+ new reviews in 7 days (good or bad — momentum shift)
- Competitor closes listing (opportunity: capture their demand)
- Competitor significantly outpaces client on photos/reviews (coaching moment)

Alert format: plain text email to robertlbutt@gmail.com with:
- Business affected, what changed, what it means, recommended action

## D1 Tables

```sql
CREATE TABLE competitor_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  competitor_place_id TEXT,
  snapshot_json TEXT,         -- full AuditResult JSON
  snapshot_date TEXT,         -- YYYY-MM-DD
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE competitor_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  competitor_place_id TEXT,
  competitor_name TEXT,
  event_type TEXT,            -- 'rating_drop', 'review_surge', 'listing_closed', etc.
  old_value TEXT,
  new_value TEXT,
  alert_sent INTEGER DEFAULT 0,
  detected_at TEXT DEFAULT (datetime('now'))
);
```
