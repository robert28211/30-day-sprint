# Spec 10: Dashboard UI (Admin)

## JTBD

**When** Robbie opens the dashboard before a client call,
**He needs** a quick view of all client scores, recent changes, and outstanding issues
**So that** he walks into every conversation with fresh intelligence.

## Access

URL: `/admin/dashboard`
Auth: URL param `?key={ADMIN_KEY}` (same pattern as report auth, or HTTP Basic)
No login UI — just a secret URL Robbie bookmarks.

## Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  EngageEngine  GBP Intelligence Dashboard                    │
│  Last scan: Saturday Mar 15, 2026 — 36/36 clients scanned   │
│  [Run Scan Now]                         [View Leads (3 new)] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ALERTS  ─────────────────────────────────────────────────  │
│  🔴 Competitor alert: [Biz] overtook Stormy Plumbing (reviews)│
│  🟡 Score drop: The Fritz Pet Resort −8 pts this week       │
│                                                              │
│  CLIENTS  ──────────────────────────────────────────────── │
│  Filter: [All ▼] [Active ▼] [Sort: Score ▼]               │
│                                                              │
│  NAME                    SCORE   CHANGE   LAST SCAN   LINKS │
│  ─────────────────────────────────────────────────────────  │
│  Stormy Plumbing         87      ▲ +3     Mar 15      [R][A]│
│  The Guttermen           67      ─  0     Mar 15      [R][A]│
│  Soda City Dentistry     54      ▼ −5     Mar 15      [R][A]│
│  ...                                                        │
│  ─────────────────────────────────────────────────────────  │
│  UNRESOLVED (no place_id): 4 clients — [Resolve All]       │
│                                                              │
│  LEADS  ───────────────────────────────────────────────── │
│  NAME            EMAIL              SCORE   DATE    LINKS   │
│  John Smith      john@ex.com        44      Mar 18  [R]     │
│  ...                                                        │
└──────────────────────────────────────────────────────────────┘
```

## Client Table

Columns:
- **Name**: client business name (linked to `/admin/clients/:id`)
- **Score**: current score + color-coded badge (green ≥85, yellow 70–84, orange 50–69, red <50)
- **Change**: delta vs last week (▲/▼/─ with number)
- **Last Scan**: relative date ("3 days ago")
- **Links**: `[R]` = report, `[A]` = audit detail

Row click → expands inline to show top 3 gaps + quick actions.

## Alert Banner

Shown at top when:
- Any competitor event detected since last visit
- Any client score dropped ≥ 10 points
- Any client with `place_id = NULL` and `active = 1`
- New leads not yet reviewed

## Client Detail Page

`GET /admin/clients/:id`

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                        │
│  Stormy Plumbing  [Score: 87 — Good ▲ +3]                  │
│  1308 Boiling Springs Rd, Lexington, SC 29073               │
│  place_id: ChIJ...   [Resolve →]   [View on Maps →]        │
├──────────────────────────────────────────────────────────────┤
│  CURRENT GAPS                                               │
│  • Missing business description  [medium]  $800–$2,400/mo  │
│  • Only 12 photos                [medium]  $480–$1,440/mo  │
│                                                             │
│  AUDIT HISTORY (last 6 weeks)                               │
│  [sparkline chart showing score over time]                  │
│  Week 1: 84 | Week 2: 84 | Week 3: 85 | Week 4: 87         │
│                                                             │
│  COMPETITORS                                                │
│  Add competitor place_ids: [input]  [Save]                  │
│  Current: [CompetitorA] [CompetitorB]                       │
│                                                             │
│  ACTIONS                                                    │
│  [Generate Client Report]  [Generate Prospect Report]       │
│  [Run Audit Now]           [View Comparison Report]         │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack for UI

- Vanilla HTML/CSS — no framework (keeps Worker bundle tiny)
- Minimal JS for:
  - Inline row expansion (toggle class)
  - Sort/filter client table (client-side, data pre-loaded)
  - "Run Scan Now" button → POST to `/admin/scan/run`
- CSS: system font stack, EngageEngine colors
- Sparkline: pure CSS bar chart or tiny inline SVG (no Chart.js)
- Mobile-responsive (Robbie may check on phone before a call)

## Pages

| Path | Description |
|------|-------------|
| `/admin/dashboard` | Main overview |
| `/admin/clients/:id` | Client detail + history |
| `/admin/leads` | Lead list |
| `/admin/scan-runs` | Cron run history |
| `/admin/competitors?client_id=:id` | Competitor snapshots + events |

## Leads Detail

Each lead row shows:
- Business name + score (color-coded — low score = hot lead)
- Contact info
- Date captured
- `[View Report]` link → opens prospect report
- Mark as contacted (toggle stored in KV, not D1 — ephemeral state)

## Implementation Notes

- All admin pages server-rendered by the Worker — HTML returned directly
- No client-side routing — traditional multi-page
- Templates in `src/templates/admin/` directory
- Shared header/nav injected via template function
- Data fetched from D1 directly in the route handler before rendering
