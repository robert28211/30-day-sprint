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
 *   monthly_searches_avg = (low + high) / 2
 *   monthly_lost = monthly_searches × CTR_impact × conversion_rate × avg_job_value
 *   where conversion_rate = 0.05 (5% baseline for local service leads)
 *
 * @param {string} gapId - gap ID from GAP_IMPACT (e.g. "few_photos")
 * @param {string} category - benchmark category from detectCategory()
 * @returns {{ low: number, high: number, basis: string, confidence: string }}
 */
export function estimateRevenue(gapId, category) {
  const impact = GAP_IMPACT[gapId];
  if (!impact) {
    return { low: 50, high: 200, basis: 'Estimated based on local service industry averages', confidence: 'estimated' };
  }

  const cat = CATEGORIES[category] || CATEGORIES['default'];
  const conversionRate = 0.05;

  const searchesLow = cat.monthlySearches[0];
  const searchesHigh = cat.monthlySearches[1];

  const revLow = Math.round(searchesLow * impact.ctrImpact[0] * conversionRate * cat.avgJobValue);
  const revHigh = Math.round(searchesHigh * impact.ctrImpact[1] * conversionRate * cat.avgJobValue);

  // Apply floor: never show $0
  const finalLow = Math.max(revLow, impact.floor[0]);
  const finalHigh = Math.max(revHigh, impact.floor[1]);

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
