# Spec 03: Revenue Estimator

## JTBD

**When** gaps are identified in a GBP audit,
**He needs** each gap translated into an estimated monthly revenue impact
**So that** every conversation with a client or prospect is a business case, not a checklist.

## Data Source

Industry benchmarks from LocaliQ/WordStream research (stored in `src/data/benchmarks.js`).
Key figures:
- Adding 10+ photos: +35% CTR in local search
- Completing hours: prevents ~12% of profile abandonment
- Rating lift 3.9→4.1: +18% conversion rate
- Each additional 10 reviews: +3-5% CTR
- Missing website: ~22% of searchers bounce immediately
- Business description: +8% engagement rate

## Revenue Estimate Formula

```
monthly_lost_revenue = avg_monthly_searches × CTR_gap × conversion_rate × avg_job_value
```

Since we don't have actual impression data in Phase 1, we use category-based search volume estimates:

| Category | Avg monthly local searches | Avg job value |
|----------|---------------------------|---------------|
| Plumbing | 400–800 | $350 |
| Roofing | 200–500 | $8,000 |
| HVAC | 300–600 | $500 |
| Landscaping | 500–1,200 | $250 |
| Cleaning | 300–700 | $200 |
| Dental | 150–400 | $800 |
| Pet services | 200–500 | $150 |
| General contractor | 100–300 | $5,000 |
| Default (unknown) | 200–500 | $400 |

## Output: RevenueEstimate per Gap

```json
{
  "gap_id": "few_photos",
  "monthly_low": 480,
  "monthly_high": 1440,
  "confidence": "estimated",
  "basis": "Adding 10+ photos increases profile CTR by ~35% in service categories (LocaliQ 2024)"
}
```

## Requirements

1. `estimateRevenue(gap, category)` function in `src/modules/revenue.js`
2. Category detection from Places API `types` array — map to benchmark category
3. Returns `{ low, high, basis }` — always show a range, never a single number
4. `confidence: "estimated"` in Phase 1 (benchmark-based), `"actual"` in Phase 2 (real impressions)
5. When category unknown, use default estimates with note: "Based on local service industry averages"
6. Minimum floor: never show $0 for a gap — every gap has at least $50–$200/mo floor

## Category Mapping

Places API types → benchmark category:
- `plumber` → plumbing
- `roofing_contractor` → roofing
- `hvac_contractor` → hvac
- `lawn_care_service`, `landscaper` → landscaping
- `house_cleaning_service`, `janitorial_service` → cleaning
- `dentist`, `dental_clinic` → dental
- `veterinary_care`, `pet_store` → pet services
- `general_contractor` → general contractor
- everything else → default
