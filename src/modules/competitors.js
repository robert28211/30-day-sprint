/**
 * Competitor Scanner.
 * Runs audits on competitor GBPs, computes gap matrix, and detects changes.
 */

import { runAudit } from './audit.js';
import { findNearbyCompetitors } from './places.js';
import { sendCompetitorAlert } from './email.js';

// ---------------------------------------------------------------------------
// Gap Matrix
// ---------------------------------------------------------------------------

/**
 * Run competitor analysis for a client.
 *
 * @param {string} subjectPlaceId
 * @param {string[]} competitorPlaceIds - can be empty (triggers auto-discovery)
 * @param {object} env
 * @param {object|null} [precomputedSubject] - optional pre-computed subject audit
 *   (pass when the caller already ran runAudit on the subject to avoid a double fetch)
 * @returns {Promise<CompetitorScanResult>}
 */
export async function scanCompetitors(subjectPlaceId, competitorPlaceIds = [], env, precomputedSubject = null) {
  // Use pre-computed subject audit if provided; otherwise fetch fresh
  const subject = precomputedSubject ?? await runAudit(subjectPlaceId, env);

  // Auto-discover if no competitors provided
  if (!competitorPlaceIds.length) {
    const primaryType = subject.raw_types?.[0];
    if (primaryType && subject.lat && subject.lng) {
      const nearby = await findNearbyCompetitors(primaryType, subject.lat, subject.lng, subjectPlaceId, 3, env);
      competitorPlaceIds = nearby.map(n => n.place_id);
    }
  }

  // Run competitor audits in parallel
  const competitorAudits = await Promise.allSettled(
    competitorPlaceIds.map(id => runAudit(id, env))
  );

  const competitors = competitorAudits
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  // Build gap matrix
  const matrix = buildMatrix(subject, competitors);
  const keyGaps = identifyKeyGaps(subject, competitors, matrix);

  return {
    subject,
    competitors,
    matrix,
    key_gaps: keyGaps,
    auto_discovered: competitorPlaceIds.length > 0,
  };
}

export function buildMatrix(subject, competitors) {
  const metrics = ['rating', 'review_count', 'photo_count', 'has_website', 'has_hours'];

  const matrix = {};
  for (const metric of metrics) {
    const subjectVal = subject.fields[metric] ?? 0;
    const competitorVals = competitors.map(c => c.fields[metric] ?? 0);
    const allVals = [subjectVal, ...competitorVals].filter(v => typeof v === 'number');
    const subjectRank = allVals.length > 1
      ? [...allVals].sort((a, b) => b - a).indexOf(subjectVal) + 1
      : 1;

    matrix[metric] = {
      subject: subjectVal,
      competitors: competitorVals,
      subject_rank: subjectRank,
      total: allVals.length,
    };
  }
  return matrix;
}

export function identifyKeyGaps(subject, competitors, matrix) {
  const gaps = [];

  if (matrix.review_count?.subject_rank > 1) {
    const best = Math.max(...(matrix.review_count.competitors || [0]));
    if (best > 0) {
      const ratio = (best / (matrix.review_count.subject || 1)).toFixed(1);
      gaps.push(`Top competitor has ${ratio}x more reviews — they dominate "best reviewed" searches`);
    }
  }

  if (matrix.photo_count?.subject_rank > 1) {
    const beaten = competitors.filter(c => c.fields.photo_count > subject.fields.photo_count).length;
    if (beaten > 0) gaps.push(`You have fewer photos than ${beaten} of ${competitors.length} competitors`);
  }

  if (matrix.rating?.subject_rank > 1) {
    const best = Math.max(...(matrix.rating.competitors || [0]));
    if (best > subject.fields.rating) {
      gaps.push(`Top competitor has a higher rating (${best} vs ${subject.fields.rating}) — customers trust them more`);
    }
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Change Detection (weekly cron)
// ---------------------------------------------------------------------------

const CHANGE_THRESHOLDS = {
  rating: 0.2,
  review_count: 5,
  photo_count: 5,
};

/**
 * Compare latest competitor snapshot vs previous.
 * Detect significant changes and queue alerts.
 *
 * @param {number} clientId
 * @param {string} competitorPlaceId
 * @param {object} currentAudit - latest AuditResult
 * @param {object} env
 */
export async function detectCompetitorChanges(clientId, competitorPlaceId, currentAudit, env) {
  const today = new Date().toISOString().slice(0, 10);

  // Find previous snapshot (most recent before today)
  const previous = await env.DB.prepare(`
    SELECT snapshot_json FROM competitor_snapshots
    WHERE client_id = ? AND competitor_place_id = ? AND snapshot_date < ?
    ORDER BY snapshot_date DESC LIMIT 1
  `).bind(clientId, competitorPlaceId, today).first();

  if (!previous) {
    // First snapshot — store and skip comparison
    await storeSnapshot(clientId, competitorPlaceId, currentAudit, today, env);
    return [];
  }

  const prev = JSON.parse(previous.snapshot_json);
  const events = [];

  // Check each threshold
  for (const [metric, threshold] of Object.entries(CHANGE_THRESHOLDS)) {
    const oldVal = prev.fields?.[metric] ?? 0;
    const newVal = currentAudit.fields?.[metric] ?? 0;
    const delta = Math.abs(newVal - oldVal);

    if (delta >= threshold) {
      let eventType;
      if (metric === 'rating') {
        eventType = newVal < oldVal ? 'rating_drop' : 'rating_rise';
      } else if (metric === 'review_count') {
        eventType = 'review_surge';
      } else if (metric === 'photo_count') {
        eventType = 'photo_surge';
      }

      events.push({ metric, eventType, oldVal, newVal, delta });

      await env.DB.prepare(`
        INSERT INTO competitor_events (client_id, competitor_place_id, competitor_name, event_type, old_value, new_value)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(clientId, competitorPlaceId, currentAudit.business_name, eventType, String(oldVal), String(newVal)).run();
    }
  }

  // Detect listing closed
  if (!currentAudit.fields.is_open && (prev.fields?.is_open ?? true)) {
    events.push({ eventType: 'listing_closed', oldVal: 'open', newVal: 'closed' });
    await env.DB.prepare(`
      INSERT INTO competitor_events (client_id, competitor_place_id, competitor_name, event_type, old_value, new_value)
      VALUES (?, ?, ?, 'listing_closed', 'open', 'closed')
    `).bind(clientId, competitorPlaceId, currentAudit.business_name).run();
  }

  // Update snapshot
  await storeSnapshot(clientId, competitorPlaceId, currentAudit, today, env);

  return events;
}

async function storeSnapshot(clientId, competitorPlaceId, audit, date, env) {
  await env.DB.prepare(`
    INSERT INTO competitor_snapshots (client_id, competitor_place_id, competitor_name, snapshot_json, snapshot_date)
    VALUES (?, ?, ?, ?, ?)
  `).bind(clientId, competitorPlaceId, audit.business_name, JSON.stringify(audit), date).run();
}

// ---------------------------------------------------------------------------
// Alert Dispatch
// ---------------------------------------------------------------------------

const ALERT_ACTIONS = {
  rating_drop: 'Their rating is falling — contact the client to position EngageEngine as the new leader in this market.',
  rating_rise: 'Competitor is improving. Review their profile and counter with a review push for your client.',
  review_surge: 'They\'re getting momentum. Activate a review campaign for your client this week.',
  listing_closed: 'Competitor gone — capture their demand. Run a review push and GBP update for your client now.',
  photo_surge: 'Competitor just beefed up their visual presence. Schedule a photo update for your client.',
};

export async function dispatchCompetitorAlerts(clientName, events, env) {
  let alertsSent = 0;

  for (const event of events) {
    const action = ALERT_ACTIONS[event.eventType] || 'Review the change and advise your client.';
    try {
      await sendCompetitorAlert({
        clientName,
        competitorName: event.competitorName || 'Unknown competitor',
        eventType: event.eventType,
        oldValue: String(event.oldVal),
        newValue: String(event.newVal),
        action,
      }, env);
      alertsSent++;
    } catch (err) {
      console.error('[competitors] alert send failed:', err.message);
    }
  }

  return alertsSent;
}
