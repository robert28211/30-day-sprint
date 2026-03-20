/**
 * Core GBP Audit Engine.
 * Fetches Place Details, scores across 10 dimensions, identifies gaps,
 * and attaches revenue estimates to each gap.
 */

import { getPlaceDetails } from './places.js';
import { estimateRevenue, detectCategory, formatRevenue } from './revenue.js';

// ---------------------------------------------------------------------------
// Scoring Model (100 points total)
// ---------------------------------------------------------------------------

// Exported for use in score projection (computeProjectedScore in reportRenderer.js)
export function scoreRating(rating) {
  if (rating == null) return 0;
  if (rating >= 4.0) return 15;
  if (rating >= 3.5) return 8;
  return 0;
}

export function scoreReviews(count) {
  if (count == null) return 0;
  if (count >= 50) return 15;
  if (count >= 25) return 10;
  if (count >= 10) return 5;
  return 0;
}

export function scorePhotos(count) {
  if (count == null || count === 0) return 0;
  if (count >= 20) return 15;
  if (count >= 10) return 10;
  if (count >= 3) return 5;
  return 0;
}

function scoreLabel(score) {
  if (score >= 95) return 'Excellent';   // near-perfect profile, minimal gaps
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Needs Work';
  return 'Critical';
}

// ---------------------------------------------------------------------------
// Gap Definitions
// ---------------------------------------------------------------------------

const GAP_DEFS = [
  { id: 'low_rating',   check: f => f.rating != null && f.rating < 4.0,  label: 'Rating below 4.0 stars',           severity: 'high',   fix: 'Actively request reviews from satisfied customers to raise your rating above 4.0.' },
  { id: 'few_reviews',  check: f => f.review_count < 25,                  scaleAt: f => 1 - (f.review_count / 50),  label: 'Fewer than 25 reviews',            severity: 'high',   fix: 'Send a review request to recent customers via text or email. Target: 50+ reviews.' },
  { id: 'no_photos',    check: f => f.photo_count < 3,                    label: 'No photos on profile',             severity: 'high',   fix: 'Add at least 10 photos: exterior, interior, work samples, and team.' },
  { id: 'few_photos',   check: f => f.photo_count >= 3 && f.photo_count < 20, scaleAt: f => 1 - (f.photo_count / 20), label: `Only ${'{photo_count}'} photos`, severity: 'medium', fix: 'Add photos until you reach 20+. Include before/after work shots and team photos.' },
  { id: 'no_hours',     check: f => !f.has_hours,                         label: 'Business hours not set',           severity: 'high',   fix: 'Add your hours in Google Business Profile. Include holiday hours.' },
  { id: 'no_website',   check: f => !f.has_website,                       label: 'No website linked',                severity: 'high',   fix: 'Add your website URL to your Google Business Profile.' },
  { id: 'no_phone',     check: f => !f.has_phone,                         label: 'No phone number listed',           severity: 'high',   fix: 'Add a local phone number. Customers are 7x more likely to call than fill out a form.' },
  { id: 'no_description', check: f => !f.has_description,                 label: 'Missing business description',     severity: 'medium', fix: 'Write a 150–300 word description covering your services, service area, and what makes you different.' },
  { id: 'no_category',  check: f => !f.primary_category_set,              label: 'Primary category not set',         severity: 'medium', fix: 'Set your primary business category in Google Business Profile settings.' },
  { id: 'closed_listing', check: f => !f.is_open,                        label: 'Listing marked as closed',         severity: 'high',   fix: 'Reopen your listing in Google Business Profile or contact Google support.' },
];

// ---------------------------------------------------------------------------
// Main Audit Function
// ---------------------------------------------------------------------------

/**
 * Run a complete GBP audit for a place_id.
 *
 * @param {string} placeId
 * @param {object} env - Worker env (CACHE, GOOGLE_PLACES_API_KEY)
 * @returns {Promise<AuditResult>}
 */
export async function runAudit(placeId, env) {
  const place = await getPlaceDetails(placeId, env);
  const types = place.types || [];
  const category = detectCategory(types);

  // Extract structured fields
  const fields = extractFields(place);

  // Compute score
  let score = 0;
  score += scoreRating(fields.rating);
  score += scoreReviews(fields.review_count);
  score += scorePhotos(fields.photo_count);
  score += fields.has_hours ? 10 : 0;
  score += fields.has_website ? 10 : 0;
  score += fields.has_phone ? 10 : 0;
  score += fields.has_description ? 10 : 0;
  score += fields.primary_category_set ? 10 : 0;
  score += fields.is_open ? 5 : 0;
  // Review response: 5 pts — Phase 2 (needs GBP private API)

  const label = scoreLabel(score);

  // Identify gaps
  const gaps = GAP_DEFS
    .filter(def => def.check(fields))
    .map(def => {
      // Scale revenue by how far below the threshold (gradient gaps only)
      // e.g. 10 photos vs threshold of 20 → scaleFactor 0.5 → 50% of full impact
      const scaleFactor = def.scaleAt ? Math.max(0.05, def.scaleAt(fields)) : 1.0;
      const revenue = estimateRevenue(def.id, category, scaleFactor);
      // Resolve dynamic label tokens
      const resolvedLabel = def.label
        .replace('{photo_count}', fields.photo_count)
        .replace('{review_count}', fields.review_count);
      return {
        id: def.id,
        label: resolvedLabel,
        severity: def.severity,
        revenue_impact: {
          low: revenue.low,
          high: revenue.high,
          monthly: true,
          display: formatRevenue(revenue.low, revenue.high),
          basis: revenue.basis,
          confidence: revenue.confidence,
        },
        fix: def.fix,
      };
    })
    // Sort by severity: high first, then by revenue impact descending
    .sort((a, b) => {
      const sev = { high: 0, medium: 1, low: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return b.revenue_impact.high - a.revenue_impact.high;
    });

  return {
    place_id: placeId,
    business_name: place.name,
    address: place.formatted_address || place.vicinity,
    category: types[0] || 'unknown',
    category_benchmark: category,
    score,
    score_label: label,
    audit_date: new Date().toISOString(),
    fields,
    gaps,
    raw_types: types,
    lat: place.geometry?.location?.lat,
    lng: place.geometry?.location?.lng,
  };
}

// ---------------------------------------------------------------------------
// Field Extraction
// ---------------------------------------------------------------------------

function extractFields(place) {
  const photoCount = place.photos?.length ?? 0;
  const reviewCount = place.user_ratings_total ?? 0;
  const hasHours = !!(place.opening_hours?.periods?.length);
  const hasDescription = !!(
    place.editorial_summary?.overview ||
    (place.name && place.name.length > 20)  // heuristic fallback
  );
  const primaryCategorySet = !!(place.types?.length);
  const isOpen = place.business_status !== 'CLOSED_PERMANENTLY' &&
                 place.business_status !== 'CLOSED_TEMPORARILY';

  return {
    rating: place.rating ?? null,
    review_count: reviewCount,
    has_website: !!place.website,
    has_phone: !!place.formatted_phone_number,
    has_hours: hasHours,
    hours_complete: hasHours,
    photo_count: photoCount,
    primary_category_set: primaryCategorySet,
    has_description: hasDescription,
    is_open: isOpen,
    business_status: place.business_status || 'OPERATIONAL',
    price_level: place.price_level ?? null,
    website: place.website || null,
    phone: place.formatted_phone_number || null,
    recent_reviews: (place.reviews || []).slice(0, 5).map(r => ({
      rating: r.rating,
      text: r.text?.slice(0, 200),
      author: r.author_name,
      time: r.relative_time_description,
    })),
  };
}
