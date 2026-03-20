/**
 * Revenue benchmark data sourced from LocaliQ/WordStream 2024 research.
 * Maps business categories to avg monthly local searches and avg job values.
 * Maps gap IDs to CTR/conversion impact percentages.
 */

export const CATEGORIES = {
  plumbing:           { monthlySearches: [400, 800],   avgJobValue: 350 },
  roofing:            { monthlySearches: [200, 500],   avgJobValue: 8000 },
  hvac:               { monthlySearches: [300, 600],   avgJobValue: 500 },
  landscaping:        { monthlySearches: [500, 1200],  avgJobValue: 250 },
  cleaning:           { monthlySearches: [300, 700],   avgJobValue: 200 },
  dental:             { monthlySearches: [150, 400],   avgJobValue: 800 },
  'pet services':     { monthlySearches: [200, 500],   avgJobValue: 150 },
  'general contractor': { monthlySearches: [100, 300], avgJobValue: 5000 },
  default:            { monthlySearches: [200, 500],   avgJobValue: 400 },
};

/**
 * Places API type → benchmark category
 */
export const TYPE_TO_CATEGORY = {
  plumber: 'plumbing',
  plumbing_contractor: 'plumbing',
  roofing_contractor: 'roofing',
  hvac_contractor: 'hvac',
  lawn_care_service: 'landscaping',
  landscaper: 'landscaping',
  landscape_architect: 'landscaping',
  house_cleaning_service: 'cleaning',
  janitorial_service: 'cleaning',
  cleaning_service: 'cleaning',
  dentist: 'dental',
  dental_clinic: 'dental',
  veterinary_care: 'pet services',
  pet_store: 'pet services',
  pet_groomer: 'pet services',
  general_contractor: 'general contractor',
};

/**
 * Per-gap impact: fraction of local searches affected.
 * Formula: monthly_lost = searches[avg] × CTR_gap_rate × conversion_rate × job_value
 *
 * Conversion rate baseline: 0.05 (5% of profile visitors convert to leads)
 * CTR gap = how much profile CTR drops due to this gap
 */
export const GAP_IMPACT = {
  // High severity gaps
  low_rating: {
    label: 'Rating below 4.0',
    ctrImpact: [0.25, 0.45],     // 25–45% CTR reduction vs 4.0+ profiles
    basis: 'Profiles below 4.0 stars lose 25–45% of clicks to higher-rated competitors (BrightLocal 2024)',
    floor: [200, 600],
  },
  few_reviews: {
    label: 'Fewer than 25 reviews',
    ctrImpact: [0.10, 0.20],
    basis: 'Each additional 10 reviews adds 3–5% CTR; fewer than 25 reviews significantly underperforms',
    floor: [150, 400],
  },
  no_photos: {
    label: 'No photos (fewer than 3)',
    ctrImpact: [0.30, 0.50],
    basis: 'Profiles with no photos get 50%+ fewer direction requests and calls (Google data)',
    floor: [200, 600],
  },
  no_hours: {
    label: 'Missing business hours',
    ctrImpact: [0.10, 0.15],
    basis: 'Incomplete hours causes ~12% of profile visitors to abandon immediately (LocaliQ)',
    floor: [100, 300],
  },
  no_website: {
    label: 'No website linked',
    ctrImpact: [0.18, 0.25],
    basis: 'Missing website: ~22% of searchers bounce immediately without contacting (BrightLocal)',
    floor: [150, 450],
  },
  no_phone: {
    label: 'No phone number listed',
    ctrImpact: [0.15, 0.25],
    basis: 'Missing phone removes the highest-intent conversion path for mobile searchers',
    floor: [100, 300],
  },
  closed_listing: {
    label: 'Listing marked as closed',
    ctrImpact: [0.80, 1.00],
    basis: 'Permanently closed listings capture near-zero search traffic',
    floor: [500, 1500],
  },

  // Medium severity gaps
  few_photos: {
    label: 'Fewer than 20 photos',
    ctrImpact: [0.20, 0.35],
    basis: 'Adding 10+ photos increases profile CTR by ~35% in service categories (LocaliQ 2024)',
    floor: [100, 300],
  },
  no_description: {
    label: 'Missing business description',
    ctrImpact: [0.06, 0.12],
    basis: 'Business descriptions increase engagement rate by ~8% (Google My Business data)',
    floor: [80, 240],
  },
  no_category: {
    label: 'Missing primary category',
    ctrImpact: [0.10, 0.20],
    basis: 'Without a primary category, the profile is excluded from category-filtered searches',
    floor: [100, 300],
  },
};
