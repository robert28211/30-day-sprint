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
  if (rating >= 4.3) return 15;
  if (rating >= 4.0) return 11;
  if (rating >= 3.5) return 6;
  return 0;
}

export function scoreReviews(count) {
  // Benchmarks: top-3 local pack averages 200+ reviews (Localo, 2M profiles).
  // 47% of consumers won't use a business with < 20 reviews (BrightLocal 2026).
  if (count == null) return 0;
  if (count >= 100) return 15;
  if (count >= 50)  return 11;
  if (count >= 20)  return 7;
  if (count >= 5)   return 3;
  return 0;
}

export function scorePhotos(count) {
  // Top-3 local pack averages 250+ photos (Localo). Median listing has 11 photos.
  // 100+ photos correlates with 520% more calls vs median (BrightLocal).
  if (count == null || count === 0) return 0;
  if (count >= 50)  return 15;
  if (count >= 20)  return 10;
  if (count >= 5)   return 5;
  return 0;
}

function scoreLabel(score) {
  if (score >= 90) return 'Excellent';   // near-perfect: complete profile + strong review base
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Critical';
}

// ---------------------------------------------------------------------------
// Gap Definitions
// ---------------------------------------------------------------------------

// Competitive thresholds backed by research:
//   Top-3 local pack: 200+ reviews, 250+ photos (Localo, 2M profiles)
//   47% of consumers won't trust a business with < 20 reviews (BrightLocal)
//   4.3+ is the Spiegel/Northwestern conversion sweet-spot (4.0–4.7)
const GAP_DEFS = [
  { id: 'low_rating',     check: f => f.rating != null && f.rating < 4.0,
                          label: 'Rating below 4.0 stars',        severity: 'high',
                          fix: 'Actively request reviews from satisfied customers. Each 0.1-star improvement drives ~25% more conversions (Uberall). Target: 4.3+.' },
  { id: 'few_reviews',    check: f => f.review_count < 50,
                          scaleAt: f => 1 - (f.review_count / 100),
                          label: 'Fewer than 50 reviews',          severity: 'high',
                          fix: 'Text or email every customer a review request within 24 hours of job completion. Target 100+ reviews — top-3 local pack businesses average 200+.' },
  { id: 'no_photos',      check: f => f.photo_count < 3,
                          label: 'No photos on profile',           severity: 'high',
                          fix: 'Add at least 20 photos immediately: exterior, interior, completed work, equipment, and team. Google says photos drive 42% more direction requests.' },
  { id: 'few_photos',     check: f => f.photo_count >= 3 && f.photo_count < 30,
                          scaleAt: f => 1 - (f.photo_count / 30),
                          label: 'Only {photo_count} photos',      severity: 'medium',
                          fix: 'Build to 30+ photos: before/after work shots, team, vehicles, finished projects. Top-3 local businesses average 250+ images. Each batch of 10 new photos moves the needle.' },
  { id: 'no_hours',       check: f => !f.has_hours,
                          label: 'Business hours not set',         severity: 'high',
                          fix: 'Add hours in Google Business Profile — including holiday hours. Missing hours removes you from all "Open Now" searches.' },
  { id: 'no_website',     check: f => !f.has_website,
                          label: 'No website linked',              severity: 'high',
                          fix: 'Add your website URL. Website clicks are 48% of all GBP interactions — the #1 consumer action from a Google listing (Birdeye 2025).' },
  { id: 'no_phone',       check: f => !f.has_phone,
                          label: 'No phone number listed',         severity: 'high',
                          fix: 'Add a local phone number. Mobile searchers expect immediate click-to-call — this is your highest-intent conversion path.' },
  { id: 'no_description', check: f => !f.has_description,
                          label: 'Missing business description',   severity: 'medium',
                          fix: 'Write a 150–300 word description covering your services, service area, years in business, and what makes you different from competitors.' },
  { id: 'no_category',    check: f => !f.primary_category_set,
                          label: 'Primary category not set',       severity: 'medium',
                          fix: 'Set your primary business category in Google Business Profile settings. This is the #1 relevance signal Google uses to surface your listing.' },
  { id: 'closed_listing', check: f => !f.is_open,
                          label: 'Listing marked as closed',       severity: 'high',
                          fix: 'Reopen your listing in Google Business Profile or contact Google support to dispute an incorrect closure.' },
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
// Competitive Adjustment
// ---------------------------------------------------------------------------

/**
 * Compute how a business's score should be adjusted based on competitive standing.
 *
 * Called by the report renderer when competitor data is available.
 * The stored `score` field always reflects profile completeness (for historical trending).
 * The competitive score is computed fresh at render time and shown in the report.
 *
 * Penalty logic (max total: -25 pts):
 *   Reviews: ranked last (of 3+) → -12; ranked behind leader (2+) → -7 to -4
 *   Rating:  leader is ≥0.5★ ahead → -8; ≥0.2★ ahead → -4
 *   Photos:  fewer than 50% of leader count → -5; fewer than 25% → -8
 *
 * @param {number} baseScore - the stored profile completeness score
 * @param {object} competitorScan - result of scanCompetitors()
 * @returns {{ adjustment: number, adjustedScore: number, competitive_gaps: Array }}
 */
export function computeCompetitiveAdjustment(baseScore, competitorScan) {
  if (!competitorScan?.matrix || !competitorScan.competitors?.length) {
    return { adjustment: 0, adjustedScore: baseScore, competitive_gaps: [] };
  }

  const { matrix, competitors } = competitorScan;
  const total = competitors.length + 1;  // subject + competitors
  let adjustment = 0;
  const competitive_gaps = [];

  // ── Review count ────────────────────────────────────────────────────────
  const reviewRank = matrix.review_count?.subject_rank ?? 1;
  const subjectReviews = matrix.review_count?.subject ?? 0;
  const bestReviews = Math.max(...(matrix.review_count?.competitors ?? [0]));

  if (total >= 2 && reviewRank > 1 && bestReviews > 0) {
    const ratio = subjectReviews / bestReviews;
    if (ratio < 0.25)      adjustment -= 12;
    else if (ratio < 0.50) adjustment -= 8;
    else if (ratio < 0.75) adjustment -= 4;

    competitive_gaps.push({
      id: 'comp_reviews',
      label: `Reviews: ranked #${reviewRank} of ${total} — ${subjectReviews} vs leader's ${bestReviews}`,
      severity: (ratio < 0.50 || reviewRank === total) ? 'high' : 'medium',
      fix: `You need ${bestReviews - subjectReviews} more reviews to match the local leader. Text every new customer a review request within 24 hours of service completion. Top-3 market positions require 200+ reviews.`,
      revenue_impact: null,
      competitive: true,
    });
  }

  // ── Rating ──────────────────────────────────────────────────────────────
  const ratingRank = matrix.rating?.subject_rank ?? 1;
  const subjectRating = matrix.rating?.subject ?? 0;
  const bestRating = Math.max(...(matrix.rating?.competitors ?? [0]));
  const ratingDiff = bestRating - subjectRating;

  if (total >= 2 && ratingDiff > 0.05) {
    if (ratingDiff >= 0.5)      adjustment -= 8;
    else if (ratingDiff >= 0.2) adjustment -= 4;
    else                        adjustment -= 2;

    competitive_gaps.push({
      id: 'comp_rating',
      label: `Rating: ${subjectRating}★ vs competitor's ${bestRating}★ (ranked #${ratingRank} of ${total})`,
      severity: ratingDiff >= 0.5 ? 'high' : 'medium',
      fix: `Each 0.1-star improvement drives ~25% more conversions (Uberall). Your target is ${Math.min(5.0, +(subjectRating + ratingDiff + 0.1).toFixed(1))}★+. Respond to every negative review and actively solicit 5-star reviews from happy customers.`,
      revenue_impact: null,
      competitive: true,
    });
  }

  // ── Photo count ─────────────────────────────────────────────────────────
  const photoRank = matrix.photo_count?.subject_rank ?? 1;
  const subjectPhotos = matrix.photo_count?.subject ?? 0;
  const bestPhotos = Math.max(...(matrix.photo_count?.competitors ?? [0]));

  if (total >= 2 && photoRank > 1 && bestPhotos > 0) {
    const ratio = subjectPhotos / bestPhotos;
    if (ratio < 0.25)      adjustment -= 8;
    else if (ratio < 0.50) adjustment -= 5;
    else if (ratio < 0.75) adjustment -= 2;

    if (ratio < 0.75) {
      competitive_gaps.push({
        id: 'comp_photos',
        label: `Photos: ${subjectPhotos} vs competitor's ${bestPhotos} (ranked #${photoRank} of ${total})`,
        severity: ratio < 0.50 ? 'high' : 'medium',
        fix: `Add ${Math.max(10, bestPhotos - subjectPhotos)} photos to close the gap: before/after work shots, team, vehicles, completed projects. Top-3 local businesses average 250+ images.`,
        revenue_impact: null,
        competitive: true,
      });
    }
  }

  const adjustedScore = Math.max(0, Math.min(100, baseScore + adjustment));
  return { adjustment, adjustedScore, competitive_gaps };
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
