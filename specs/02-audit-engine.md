# Spec 02: Core Audit Engine

## JTBD

**When** Robbie enters any business name or a client is scanned automatically,
**He needs** a structured audit of that business's Google Business Profile
**So that** he can see exactly what gaps exist and how they rank by impact.

## Input

One of:
- `place_id` (preferred — direct lookup)
- `business_name` + `city` (text search → resolves to place_id first)

## Output: AuditResult Object

```json
{
  "place_id": "ChIJ...",
  "business_name": "The Guttermen",
  "address": "3631 Delree St, West Columbia, SC 29170",
  "category": "Gutter Cleaning Service",
  "score": 67,
  "score_label": "Needs Work",
  "audit_date": "2026-03-20T10:00:00Z",
  "fields": {
    "rating": 4.2,
    "review_count": 38,
    "has_website": true,
    "has_phone": true,
    "has_hours": true,
    "hours_complete": true,
    "photo_count": 12,
    "primary_category_set": true,
    "business_description_present": false,
    "is_open": true,
    "price_level": null,
    "recent_reviews_5": [...]
  },
  "gaps": [
    {
      "id": "no_description",
      "label": "Missing business description",
      "severity": "high",
      "revenue_impact": { "low": 800, "high": 2400, "monthly": true },
      "fix": "Add a 150–300 word description covering your services, service area, and what makes you different."
    },
    ...
  ]
}
```

## Scoring Model (100 points total)

| Dimension | Points | How scored |
|-----------|--------|------------|
| Rating ≥ 4.0 | 15 | 15 if ≥4.0, 8 if 3.5–3.9, 0 if <3.5 |
| Review count | 15 | 15 if ≥50, 10 if 25–49, 5 if 10–24, 0 if <10 |
| Photos | 15 | 15 if ≥20, 10 if 10–19, 5 if 3–9, 0 if <3 |
| Hours complete | 10 | 10 if set, 0 if missing |
| Website linked | 10 | 10 if present |
| Phone listed | 10 | 10 if present |
| Business description | 10 | 10 if present (Places API: editorial_summary or name length heuristic) |
| Primary category set | 10 | 10 if present |
| Open/active status | 5 | 5 if not closed/suspended |
| Recent review response | 5 | 5 if last 5 reviews have ≥1 owner response (Phase 2 data) |

**Score labels:**
- 85–100: Excellent
- 70–84: Good
- 50–69: Needs Work
- 0–49: Critical

## Gap Definitions

Each gap has: `id`, `label`, `severity` (high/medium/low), `revenue_impact`, `fix` text.

| Gap ID | Trigger | Severity |
|--------|---------|----------|
| `low_rating` | rating < 4.0 | high |
| `few_reviews` | review_count < 25 | high |
| `no_photos` | photo_count < 3 | high |
| `few_photos` | photo_count 3–9 | medium |
| `no_hours` | hours missing | high |
| `no_website` | website missing | high |
| `no_phone` | phone missing | high |
| `no_description` | description missing | medium |
| `no_category` | primary category missing | medium |
| `closed_listing` | open = false | high |
| `no_review_responses` | Phase 2 only | medium |
| `low_post_frequency` | Phase 2 only | medium |
| `incomplete_qa` | Phase 2 only | low |

## Places API Fields Required

```
name,rating,user_ratings_total,opening_hours,formatted_phone_number,
website,photos,types,editorial_summary,business_status,price_level,
reviews
```

Endpoint: `https://maps.googleapis.com/maps/api/place/details/json`

## Caching

- Cache full Places API response in KV: key = `place:{place_id}`, TTL = 86400s (24h)
- Never call Places API if fresh cache entry exists
- Cache misses log a warning (for cost tracking)
