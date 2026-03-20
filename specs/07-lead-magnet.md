# Spec 07: Public Lead Magnet

## JTBD

**When** a local business owner Googles "how does my Google profile score",
**He needs** a free instant audit they can self-serve
**So that** EngageEngine captures high-intent leads without cold outreach.

## Public Endpoint

```
GET /gbp-score
```

No auth required. This is a public-facing landing page.

The page lives at a vanity URL: `https://gbp.engageengine.com/gbp-score` (or the Worker URL during development).

## User Flow

```
1. User arrives at /gbp-score
2. Sees: "Get Your Free Google Business Profile Score"
   - Input: Business Name + City (text fields)
   - CTA: "Score My Profile →"

3. User submits → GET /api/gbp-score?q={business+name+city}
   - Places API text search → resolve place_id
   - Run audit (auditEngine.runAudit)
   - Return AuditResult JSON

4. Results page renders:
   - Score: large number + progress bar + label
   - Top 3 revenue leaks (without specific $ amounts — tease only)
   - "Your profile is costing you customers every day."
   - Email capture: "Get the full analysis with revenue impact numbers →"
     Input: Name + Email + Phone (optional)
   - Submit → capture lead, send full prospect report via email

5. After email submit:
   - Show: "Your full report is on its way. Expect it within 5 minutes."
   - Background: generate prospect report HTML, send via email
   - Store lead in D1 `leads` table
```

## API Endpoints

### Score Lookup
```
GET /api/gbp-score?q={search+string}
Response: {
  "place_id": "ChIJ...",
  "business_name": "...",
  "score": 67,
  "score_label": "Needs Work",
  "top_gaps": [
    { "label": "Missing business description", "severity": "medium" },
    { "label": "Only 12 photos", "severity": "medium" },
    { "label": "Only 38 reviews", "severity": "high" }
  ]
  // Revenue amounts NOT included — withheld to drive email capture
}
```

### Lead Capture
```
POST /api/leads
Body: {
  "place_id": "ChIJ...",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "803-555-1234"  // optional
}
Response: { "success": true, "message": "Report on its way!" }
```

Side effects:
1. Insert into D1 `leads` table
2. Generate full prospect report HTML (with revenue numbers)
3. Send email to lead with report link: `/report/prospect/{place_id}?key={REPORT_SECRET}`
4. Notify Robbie: plain-text email with lead details + direct report link

## Lead Email to Prospect

Subject: `Your Google Profile Score: [X]/100 — Here's What's Costing You`

Content:
- Personalized score + label
- Top 3 revenue leaks WITH dollar estimates (the teaser withheld them)
- Full report link: `https://gbp.engageengine.com/report/prospect/{place_id}?key=...`
- CTA: "Schedule 15 minutes to walk through this together → [calendar link]"
- Signed: Robbie Butt, EngageEngine

## Alert to Robbie

Subject: `New GBP Lead: [Business Name] — Score [X]`

Plain text:
```
Business: [name]
Score: [X]/100 ([label])
Contact: [name], [email], [phone]
Report: https://gbp.engageengine.com/report/prospect/{place_id}?key=...
Top gaps: [list]
```

## D1 Table: `leads`

```sql
CREATE TABLE leads (
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
  source TEXT DEFAULT 'gbp-score',  -- 'gbp-score', 'manual', etc.
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Admin: Leads Dashboard

```
GET /admin/leads
```

Table view: Business name | Score | Contact | Email | Phone | Date | Report link

Sortable by date (default), score (ascending — worst profiles are hottest leads).

## Landing Page Requirements (`src/templates/gbp-score-landing.html`)

- Clean, fast-loading (no JS frameworks — vanilla HTML/CSS)
- Mobile-first (most local business owners on phone)
- Hero: "Find Out If Your Google Profile Is Losing You Customers"
- Subhead: "Free instant audit. No signup required. See your score in 10 seconds."
- Trust signals: "Trusted by 40+ local businesses in South Carolina"
- After score shown: urgency framing — "Every day without fixing this is revenue lost."
- Color: EngageEngine brand palette
- No tracking pixels, no cookies banner needed (no PII collected until email capture)

## Rate Limiting

- Max 10 score lookups per IP per hour (KV-based counter)
- Max 3 leads per email address per 30 days
- If rate limit hit: show "You've run several audits. Ready to talk? [Book a call]"
