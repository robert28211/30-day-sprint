# Spec 05: Report Generator

## JTBD

**When** an audit is complete,
**He needs** a polished, branded report
**So that** it can be sent to a client or printed before a sales call — not just read on screen.

## Two Report Flavors

### Client Report
- Tone: professional, coaching, action-oriented
- Sections: Score overview, What's working, Gaps ranked by revenue impact, Action checklist, Competitor comparison
- Branding: EngageEngine logo + client name header
- Delivery: linked from weekly email, or shared URL

### Prospect Report
- Tone: urgent, sales-framing ("you're losing X/mo to competitors")
- Sections: Demand Score, Top 3 revenue leaks, Competitor gap table, "What EngageEngine would do" CTA
- Branding: EngageEngine only (no client branding)
- Delivery: printed PDF before sales call, or emailed as follow-up

## Phase 1: Print-Ready HTML

Reports returned as HTML with print CSS. Browser → Print → PDF is the delivery mechanism.

URL pattern:
```
GET /report/client/{audit_id}          → client-flavored HTML
GET /report/prospect/{place_id}        → prospect-flavored HTML (live, no DB lookup)
GET /report/compare/{place_id}/{place_id2}/{place_id3}  → comparison report
```

Reports are auth-protected by a shared secret in the URL:
`GET /report/client/{audit_id}?key={REPORT_SECRET}`

## Phase 2: PDF API

When `?format=pdf` param is added, use an HTML→PDF service (htmlcsstoimage.com or similar).
Return `Content-Type: application/pdf` with `Content-Disposition: attachment`.

## HTML Template Requirements

### Client Report Template (`src/templates/client-report.html`)
```
┌─────────────────────────────────────────────────┐
│  [EngageEngine Logo]        [Client Name]       │
│                                                  │
│  GBP Health Report — [Date]                     │
│  ─────────────────────────────────────────────  │
│                                                  │
│  DEMAND SCORE: 67/100  [Needs Work]             │
│  ████████████░░░░░░░░  (progress bar)           │
│                                                  │
│  WHAT'S WORKING                                  │
│  ✓ Rating 4.2 — above local average            │
│  ✓ Website linked                               │
│                                                  │
│  TOP REVENUE LEAKS          EST. MONTHLY IMPACT │
│  1. Only 12 photos          $480–$1,440/mo      │
│  2. No business description $800–$2,400/mo      │
│  3. Only 38 reviews         $600–$1,800/mo      │
│                                                  │
│  VS. YOUR TOP COMPETITORS                        │
│  [Competitor table — rating, reviews, photos]   │
│                                                  │
│  ACTION CHECKLIST                               │
│  □ Add 8 more photos (target: 20+)              │
│  □ Write business description (150–300 words)   │
│  □ Request 12 more reviews (target: 50+)        │
└─────────────────────────────────────────────────┘
```

### Prospect Report Template (`src/templates/prospect-report.html`)
```
┌─────────────────────────────────────────────────┐
│  [EngageEngine Logo]                            │
│                                                  │
│  DEMAND GAP ANALYSIS                            │
│  [Business Name] — Prepared [Date]              │
│  ─────────────────────────────────────────────  │
│                                                  │
│  DEMAND SCORE: 67/100                           │
│  You're capturing an estimated 67% of the       │
│  demand available to your business.             │
│                                                  │
│  ESTIMATED MONTHLY REVENUE LEAKING              │
│  ┌──────────────────────────────────────┐      │
│  │  $1,880 – $5,640 / month            │      │
│  │  based on your top 3 profile gaps   │      │
│  └──────────────────────────────────────┘      │
│                                                  │
│  TOP 3 DEMAND LEAKS                             │
│  1. [Gap + $ impact + 1-line fix]               │
│  2. [Gap + $ impact + 1-line fix]               │
│  3. [Gap + $ impact + 1-line fix]               │
│                                                  │
│  YOUR COMPETITORS ARE BEATING YOU HERE          │
│  [Compact comparison table]                     │
│                                                  │
│  WHAT ENGAGEENGINE WOULD DO IN 30 DAYS          │
│  [3-bullet action plan]                         │
│                                                  │
│  [CTA: Schedule a call / engageengine.com]      │
└─────────────────────────────────────────────────┘
```

## Styling Requirements

- Clean, professional — not AI-generated looking
- EngageEngine brand colors: use existing marketingperformance.net palette
- Print CSS: `@media print { ... }` — remove nav, set page breaks before each section
- Mobile-responsive (some clients will view on phone)
- Revenue impact numbers in bold/highlighted — this is the money shot
- Score displayed as large number + progress bar + label
