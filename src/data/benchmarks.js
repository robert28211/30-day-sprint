/**
 * GBP Revenue Benchmark Data
 *
 * Sources:
 *   BrightLocal Local Consumer Review Survey 2024/2026 (consumer trust thresholds, n=1,000+)
 *   Womply (n=200k US businesses): review count vs revenue correlation
 *   Uberall Reputation Management Report: 0.1-star increase = 25% conversion lift
 *   Localo (2M GBP profiles study): top-3 local pack benchmarks — 200+ reviews, 250+ photos
 *   Google (official): businesses with photos get 42% more direction requests, 35% more website clicks
 *   BrightLocal (45k businesses): 100+ photos = 520% more calls vs median (11 photos)
 *   Birdeye State of GBP 2025: website clicks = 48% of all GBP interactions
 *   Google (official): complete profiles = 7x more clicks, consumers 70% more likely to visit
 */

export const CATEGORIES = {
  plumbing:             { monthlySearches: [400,  900],  avgJobValue: 380  },
  roofing:              { monthlySearches: [200,  500],  avgJobValue: 9500 },
  hvac:                 { monthlySearches: [300,  650],  avgJobValue: 550  },
  landscaping:          { monthlySearches: [500, 1200],  avgJobValue: 280  },
  cleaning:             { monthlySearches: [300,  700],  avgJobValue: 220  },
  dental:               { monthlySearches: [150,  400],  avgJobValue: 900  },
  'pet services':       { monthlySearches: [200,  500],  avgJobValue: 160  },
  'general contractor': { monthlySearches: [100,  300],  avgJobValue: 6500 },
  electrical:           { monthlySearches: [250,  600],  avgJobValue: 450  },
  'auto repair':        { monthlySearches: [350,  800],  avgJobValue: 320  },
  'real estate':        { monthlySearches: [200,  600],  avgJobValue: 8000 },
  restaurant:           { monthlySearches: [600, 1500],  avgJobValue: 45   },
  default:              { monthlySearches: [200,  500],  avgJobValue: 450  },
};

/**
 * Places API type → benchmark category
 */
export const TYPE_TO_CATEGORY = {
  plumber:                 'plumbing',
  plumbing_contractor:     'plumbing',
  roofing_contractor:      'roofing',
  hvac_contractor:         'hvac',
  lawn_care_service:       'landscaping',
  landscaper:              'landscaping',
  landscape_architect:     'landscaping',
  house_cleaning_service:  'cleaning',
  janitorial_service:      'cleaning',
  cleaning_service:        'cleaning',
  dentist:                 'dental',
  dental_clinic:           'dental',
  veterinary_care:         'pet services',
  pet_store:               'pet services',
  pet_groomer:             'pet services',
  general_contractor:      'general contractor',
  electrician:             'electrical',
  electrical_contractor:   'electrical',
  car_repair:              'auto repair',
  auto_repair:             'auto repair',
  real_estate_agency:      'real estate',
  restaurant:              'restaurant',
  food:                    'restaurant',
};

/**
 * Per-gap revenue impact.
 *
 * ctrImpact: fraction of monthly searches/clicks lost because of this gap.
 *   Formula: monthly_lost = searches × ctrImpact × 0.05 (conversion) × avgJobValue × scaleFactor
 *
 * floor: minimum [low, high] range regardless of category.
 * basis: cite-able source shown on client reports.
 */
export const GAP_IMPACT = {

  // ── High severity ──────────────────────────────────────────────────────────

  low_rating: {
    label: 'Rating below 4.0',
    // Uberall: each +0.1 star = ~25% conversion lift; 3.5→3.7 = 120% growth.
    // BrightLocal 2026: 68% of consumers require 4.0+ (up from 55% in 2025).
    ctrImpact: [0.30, 0.55],
    basis: 'BrightLocal (2026): 68% of consumers require 4.0+ stars before considering a business. Uberall: each 0.1-star increase drives ~25% more conversions. Businesses below 4.0 lose an estimated 30–55% of potential contacts.',
    floor: [300, 900],
  },

  few_reviews: {
    label: 'Fewer than 50 reviews',
    // Womply (n=200k): above-avg review count = 54% more revenue; above median = 82% more.
    // BrightLocal: 47% won't use a business with < 20 reviews.
    // Localo (2M profiles): top-3 local pack businesses average 200+ reviews.
    ctrImpact: [0.15, 0.35],
    basis: 'Womply (n=200k businesses): above-average review count = 54% more revenue; exceeding the median = 82% more revenue. BrightLocal: 47% of consumers won\'t use a business with fewer than 20 reviews. Top-3 local pack averages 200+ reviews (Localo).',
    floor: [200, 650],
  },

  no_photos: {
    label: 'No photos on profile',
    // Google official: photos = 42% more direction requests, 35% more website clicks.
    ctrImpact: [0.35, 0.52],
    basis: 'Google: businesses with photos receive 42% more direction requests and 35% more website clicks vs. profiles with no photos. BrightLocal: 100+ photos correlates with 520% more phone calls vs. median.',
    floor: [250, 750],
  },

  no_hours: {
    label: 'Business hours not set',
    // Removes profile from "Open Now" filter entirely — a major search traffic source.
    // 73% of consumers lose trust when info is missing/incorrect (BrightLocal).
    ctrImpact: [0.12, 0.22],
    basis: 'Missing hours removes the listing from "Open Now" filter searches. BrightLocal: 73% of consumers lose trust in a business with missing or incorrect information.',
    floor: [100, 380],
  },

  no_website: {
    label: 'No website linked',
    // Birdeye State of GBP 2025: website clicks = 48% of ALL GBP interactions —
    // #1 consumer action, ahead of directions (34%) and calls (17%).
    ctrImpact: [0.32, 0.52],
    basis: 'Birdeye (State of GBP 2025): website clicks = 48% of all GBP interactions — the single largest consumer action. Missing a website eliminates nearly half of all potential conversions from your profile.',
    floor: [250, 750],
  },

  no_phone: {
    label: 'No phone number listed',
    // Birdeye: calls = 17% of GBP interactions. High-intent mobile buyers.
    ctrImpact: [0.15, 0.28],
    basis: 'Phone calls represent 17% of all GBP interactions (Birdeye). Mobile searchers are high-intent and expect immediate click-to-call — a missing phone number eliminates your highest-converting channel.',
    floor: [100, 400],
  },

  closed_listing: {
    label: 'Listing marked as closed',
    ctrImpact: [0.80, 1.00],
    basis: 'Permanently or temporarily closed listings are excluded from active local search results and capture near-zero organic traffic.',
    floor: [500, 1500],
  },

  // ── Medium severity ────────────────────────────────────────────────────────

  few_photos: {
    label: 'Fewer than 30 photos',
    // BrightLocal: 100+ photos = 520% more calls, 1,065% more website clicks vs median (11 photos).
    // Localo: top-3 positions average 250+ photos. Even reaching 30 is a competitive advantage.
    ctrImpact: [0.20, 0.42],
    basis: 'BrightLocal (45k businesses): 100+ photos correlates with 520% more phone calls and 1,065% more website clicks vs. median (11 photos). Top-3 local pack positions average 250+ images (Localo, 2M profiles).',
    floor: [100, 420],
  },

  no_description: {
    label: 'Missing business description',
    // Google: complete profiles = 7x more clicks, consumers 70% more likely to visit.
    // Localo: 75% of top-3 businesses have descriptions; only 40% at positions 11–20.
    ctrImpact: [0.06, 0.12],
    basis: 'Google: complete profiles receive 7x more clicks and consumers are 70% more likely to visit. Localo (2M profiles): 75% of top-3 businesses have complete descriptions vs. under 40% at positions 11–20.',
    floor: [60, 230],
  },

  no_category: {
    label: 'Primary category not set',
    ctrImpact: [0.10, 0.22],
    basis: 'Without a primary category a profile is excluded from category-filtered searches and loses the relevance signals Google uses to rank listings in the local pack.',
    floor: [100, 330],
  },
};
