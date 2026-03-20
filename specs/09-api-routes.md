# Spec 09: API Routes

## Router

Cloudflare Worker uses a lightweight manual router (no framework dependency).
Pattern: match `request.method` + `url.pathname` in `src/index.js`.

```
src/index.js
  └─ router(request, env, ctx)
       ├─ Public routes (no auth)
       ├─ Report routes (REPORT_SECRET auth)
       └─ Admin routes (ADMIN_KEY auth)
```

## Authentication

**Admin routes**: Header `X-Admin-Key: {ADMIN_KEY}`
**Report routes**: Query param `?key={REPORT_SECRET}`
**Public routes**: No auth

Auth middleware returns `403 Forbidden` JSON on failure.

---

## Public Routes

### `GET /`
Landing page redirect → `/gbp-score`

### `GET /gbp-score`
Returns: `src/templates/gbp-score-landing.html` (static HTML)
Content-Type: `text/html`

### `GET /api/gbp-score?q={search+string}`
1. Places text search → resolve `place_id`
2. KV cache check → Places details
3. Run audit
4. Return partial result (score + top 3 gaps, no revenue $)

Response:
```json
{
  "place_id": "ChIJ...",
  "business_name": "Stormy Plumbing",
  "address": "1308 Boiling Springs Rd, Lexington, SC 29073",
  "score": 72,
  "score_label": "Good",
  "top_gaps": [
    { "id": "no_description", "label": "Missing business description", "severity": "medium" },
    { "id": "few_photos", "label": "Only 12 photos", "severity": "medium" }
  ]
}
```

Error (not found): `{ "error": "No business found for that search." }`
Rate limit: `{ "error": "Too many requests. Try again later." }`

### `POST /api/leads`
Body: `{ place_id, name, email, phone? }`

1. Validate: email required, valid format
2. Check rate limit (KV: 3 leads per email per 30d)
3. Run full audit for `place_id` (with revenue estimates)
4. Insert into `leads` table
5. Send report email to lead (async)
6. Notify Robbie (async)

Response: `{ "success": true }`

---

## Report Routes

All require `?key={REPORT_SECRET}`.

### `GET /report/client/{audit_id}`
Returns client-flavored HTML report.
- Loads audit from D1 by `audit_id`
- Loads client info from `clients` table
- Renders `src/templates/client-report.html` with data

### `GET /report/prospect/{place_id}`
Returns prospect-flavored HTML report.
- Runs live audit via Places API (or KV cache)
- Renders `src/templates/prospect-report.html`
- No DB write — pure read/render

### `GET /report/compare/{place_id}/{place_id2}/{place_id3?}`
Comparison report: subject vs 2–3 competitors.
- Runs audit for each place_id (parallel KV/API calls)
- Computes gap matrix
- Renders `src/templates/comparison-report.html`

### `GET /report/client/{audit_id}?format=pdf`
Phase 2: same as above but returns PDF via htmlcsstoimage.com API.
Content-Type: `application/pdf`
Content-Disposition: `attachment; filename="gbp-report-{client_name}-{date}.pdf"`

---

## Admin Routes

All require `X-Admin-Key` header.

### `GET /admin/clients`
Lists all clients with status, place_id, last audit score.

Response:
```json
{
  "clients": [
    {
      "id": 1,
      "name": "Stormy Plumbing",
      "active": true,
      "place_id": "ChIJ...",
      "last_score": 72,
      "last_audit_date": "2026-03-15T10:00:00Z"
    },
    ...
  ],
  "total": 46,
  "active": 36,
  "unresolved_place_ids": 4
}
```

### `POST /admin/clients/:id/resolve-place-id`
Triggers Places API text search for client by `name + address`.
Updates `place_id` in D1 if found.

Response: `{ "place_id": "ChIJ...", "resolved": true }`

### `GET /admin/clients/:id/audit`
Returns latest audit for a specific client.

### `POST /admin/scan/run`
Triggers manual scan (see spec 06).
Body: `{ "client_ids": [1, 2, 3] }` (optional)

### `GET /admin/audits?client_id={id}&limit=10`
Returns audit history for a client. Default: last 10.

### `GET /admin/leads`
Lists all leads, newest first.

Response: paginated lead list with report URLs.

### `GET /admin/competitors?client_id={id}`
Returns latest competitor snapshot + events for a client.

### `GET /admin/scan-runs?limit=10`
Returns history of weekly scans.

### `GET /api/nearby-competitors?place_id={id}&limit=3`
Auto-discover competitors (see spec 04).
Returns top 3 nearby businesses of same category.

---

## Error Response Format

All errors return JSON:
```json
{
  "error": "Human-readable message",
  "code": "PLACES_API_ERROR"   // optional machine code
}
```

HTTP status codes:
- `400` — bad input
- `403` — auth failure
- `404` — not found
- `429` — rate limited
- `500` — internal error (Places API down, D1 error, etc.)

---

## CORS

Public routes allow: `Access-Control-Allow-Origin: *`
Admin routes: no CORS headers (server-to-server only)

## Request Logging

Every request logged via `console.log` (appears in `wrangler tail`):
```
[GET /api/gbp-score] q="Stormy Plumbing Lexington SC" → 200 (142ms)
[POST /api/leads] email="john@example.com" → 200
[GET /admin/clients] → 200 (clients=46)
```
