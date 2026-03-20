/**
 * Revenue estimator: translates GBP gaps into monthly lost revenue ranges.
 * Uses LocaliQ/WordStream benchmark data from src/data/benchmarks.js
 */

import { CATEGORIES, TYPE_TO_CATEGORY, GAP_IMPACT } from '../data/benchmarks.js';

/**
 * Detect benchmark category from Places API types array.
 *
 * @param {string[]} types - e.g. ["plumber", "home_goods_store", "point_of_interest"]
 * @returns {string} benchmark category key
 */
export function detectCategory(types = []) {
  for (const type of types) {
    const mapped = TYPE_TO_CATEGORY[type];
    if (mapped) return mapped;
  }
  return 'default';
}

/**
 * Estimate monthly lost revenue for a single gap.
 *
 * Formula:
 *   monthly_lost = searches × CTR_impact × conversion_rate × avg_job_value × scaleFactor
 *   where conversion_rate = 0.05 (5% baseline for local service leads)
 *
 * @param {string} gapId - gap ID from GAP_IMPACT (e.g. "few_photos")
 * @param {string} category - benchmark category from detectCategory()
 * @param {number} [scaleFactor=1.0] - for gradient gaps, fraction of max impact to apply.
 *   Caller computes: 1 - (currentValue / threshold). E.g. 10 photos / threshold 20 = 0.5.
 *   Binary gaps (no_hours, no_website…) always pass 1.0.
 * @returns {{ low: number, high: number, basis: string, confidence: string }}
 */
export function estimateRevenue(gapId, category, scaleFactor = 1.0) {
  const impact = GAP_IMPACT[gapId];
  if (!impact) {
    return { low: Math.round(50 * scaleFactor), high: Math.round(200 * scaleFactor), basis: 'Estimated based on local service industry averages', confidence: 'estimated' };
  }

  const cat = CATEGORIES[category] || CATEGORIES['default'];
  // Full search-to-job chain: search → local pack CTR (~15%) → profile action (~25%)
  // → lead (~20%) → booked job (~30%) ≈ 0.3% of search impressions become revenue.
  // Using 0.003 keeps estimates conservative and credible for a business owner.
  const conversionRate = 0.003;

  const searchesLow = cat.monthlySearches[0];
  const searchesHigh = cat.monthlySearches[1];

  const revLow = Math.round(searchesLow * impact.ctrImpact[0] * conversionRate * cat.avgJobValue * scaleFactor);
  const revHigh = Math.round(searchesHigh * impact.ctrImpact[1] * conversionRate * cat.avgJobValue * scaleFactor);

  // Scale the floor proportionally so it never artificially inflates low-severity gaps
  const finalLow = Math.max(revLow, Math.round(impact.floor[0] * scaleFactor));
  const finalHigh = Math.max(revHigh, Math.round(impact.floor[1] * scaleFactor));

  return {
    low: finalLow,
    high: finalHigh,
    basis: impact.basis,
    confidence: 'estimated',
  };
}

/**
 * Format a revenue range as a display string.
 * e.g. { low: 480, high: 1440 } → "$480–$1,440/mo"
 */
export function formatRevenue(low, high) {
  const fmt = n => '$' + n.toLocaleString('en-US');
  return `${fmt(low)}–${fmt(high)}/mo`;
}
