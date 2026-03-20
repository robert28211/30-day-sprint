/**
 * Report routes — auth via ?key={REPORT_SECRET}
 *
 * GET /report/client/:auditId           → client-flavored HTML
 * GET /report/client/:auditId/checklist → printable improvement checklist
 * GET /report/prospect/:placeId         → prospect-flavored HTML (live audit)
 * GET /report/compare/:id1/:id2/:id3?   → side-by-side comparison
 *
 * Client report data flow:
 *
 *   GET /report/client/:auditId
 *       │
 *       ├─► D1: SELECT audit + competitor_scan FROM audits  ← weekly cron populates
 *       │       (if competitor_scan null → call scanCompetitors() live)
 *       │
 *       ├─► D1: SELECT score, review_count, audit_date  ← last 12 audits for trend
 *       │       FROM audits WHERE client_id = ?
 *       │
 *       └─► renderClientReport({ audit, clientName, competitors, auditHistory })
 *
 * Prospect report data flow:
 *
 *   GET /report/prospect/:placeId
 *       │
 *       ├─► KV cache check (key: prospect:{placeId}:report, TTL: 24h)
 *       │
 *       └─► scanCompetitors(placeId) — 4 Places API calls
 *           └─► renderProspectReport({ audit, competitors, calendarUrl })
 *               └─► KV cache store (24h TTL)
 */

import { runAudit } from '../modules/audit.js';
import { scanCompetitors } from '../modules/competitors.js';
import { renderClientReport, renderProspectReport, renderComparisonReport, renderChecklist } from '../modules/reportRenderer.js';

function authCheck(req, env) {
  const url = new URL(req.url);
  return url.searchParams.get('key') === env.REPORT_SECRET;
}

function htmlResponse(html) {
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

function errorHtml(msg, status = 403) {
  return new Response(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem"><h2>${msg}</h2></body></html>`, {
    status,
    headers: { 'Content-Type': 'text/html' },
  });
}

// ---------------------------------------------------------------------------
// Client Report
// ---------------------------------------------------------------------------

export async function handleClientReport(req, env, auditId) {
  if (!authCheck(req, env)) return errorHtml('Access denied. Invalid report key.', 403);

  // Load audit from D1 (including competitor_scan stored by the weekly cron)
  const audit = await env.DB.prepare(`
    SELECT a.*, c.name as client_name, c.id as client_id_col
    FROM audits a
    LEFT JOIN clients c ON c.id = a.client_id
    WHERE a.id = ?
  `).bind(auditId).first();

  if (!audit) return errorHtml('Report not found.', 404);

  const auditResult = {
    place_id: audit.place_id,
    business_name: audit.client_name || audit.place_id,
    score: audit.score,
    score_label: audit.score_label,
    gaps: JSON.parse(audit.gaps_json || '[]'),
    fields: JSON.parse(audit.fields_json || '{}'),
    audit_date: audit.audit_date,
  };

  // Load audit history for score trend sparkline + review velocity (last 12 audits)
  let auditHistory = [];
  if (audit.client_id_col) {
    const historyResult = await env.DB.prepare(`
      SELECT score, json_extract(fields_json, '$.review_count') as review_count, audit_date
      FROM audits
      WHERE client_id = ?
      ORDER BY audit_date ASC
      LIMIT 12
    `).bind(audit.client_id_col).all();
    auditHistory = historyResult.results || [];
  }

  // Load competitor data — use stored scan if available (< 7 days old), else run live
  let competitors = null;
  if (audit.competitor_scan) {
    try {
      competitors = JSON.parse(audit.competitor_scan);
    } catch {
      // Malformed JSON — fall through to live fetch
    }
  }

  if (!competitors && audit.place_id) {
    try {
      competitors = await scanCompetitors(audit.place_id, [], env, auditResult);
    } catch (err) {
      console.error('[report/client] live competitor scan failed:', err.message);
      // competitors remains null — renderer handles gracefully
    }
  }

  const html = renderClientReport({
    audit: auditResult,
    clientName: audit.client_name,
    competitors,
    auditHistory,
  });
  return htmlResponse(html);
}

// ---------------------------------------------------------------------------
// Client Checklist
// ---------------------------------------------------------------------------

export async function handleClientChecklist(req, env, auditId) {
  if (!authCheck(req, env)) return errorHtml('Access denied. Invalid report key.', 403);

  const audit = await env.DB.prepare(`
    SELECT a.*, c.name as client_name
    FROM audits a
    LEFT JOIN clients c ON c.id = a.client_id
    WHERE a.id = ?
  `).bind(auditId).first();

  if (!audit) return errorHtml('Checklist not found.', 404);

  const auditResult = {
    place_id: audit.place_id,
    business_name: audit.client_name || audit.place_id,
    address: audit.address,
    score: audit.score,
    score_label: audit.score_label,
    gaps: JSON.parse(audit.gaps_json || '[]'),
    fields: JSON.parse(audit.fields_json || '{}'),
    audit_date: audit.audit_date,
  };

  // Load competitor data for competitive gap injection
  let competitorScan = null;
  if (audit.competitor_scan) {
    try { competitorScan = JSON.parse(audit.competitor_scan); } catch { /* fall through */ }
  }
  if (!competitorScan && audit.place_id) {
    try {
      competitorScan = await scanCompetitors(audit.place_id, [], env, auditResult);
    } catch (err) {
      console.error('[report/checklist] competitor scan failed:', err.message);
    }
  }

  const html = renderChecklist({
    audit: auditResult,
    clientName: audit.client_name,
    competitorScan,
  });
  return htmlResponse(html);
}

// ---------------------------------------------------------------------------
// Prospect Report
// ---------------------------------------------------------------------------

export async function handleProspectReport(req, env, placeId) {
  if (!authCheck(req, env)) return errorHtml('Access denied. Invalid report key.', 403);

  // Check KV cache first (24h TTL) to avoid hammering the Places API
  const cacheKey = `prospect:${placeId}:report`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) return htmlResponse(cached);

  let audit;
  let competitors = null;

  try {
    // scanCompetitors fetches subject + up to 3 competitors in parallel
    const scan = await scanCompetitors(placeId, [], env);
    audit = scan.subject;
    competitors = scan;
  } catch (err) {
    console.error('[report/prospect] scanCompetitors failed:', err.message);
    // Graceful fallback: subject-only audit (no competitor section in report)
    try {
      audit = await runAudit(placeId, env);
    } catch (auditErr) {
      console.error('[report/prospect] runAudit fallback failed:', auditErr.message);
      return errorHtml('Could not load this profile. The business may not have a Google listing.', 503);
    }
  }

  const calendarUrl = env.CALENDAR_URL || 'https://calendly.com/engageengine';
  const html = renderProspectReport({ audit, competitors, calendarUrl });

  // Cache rendered HTML for 24 hours (prospect reports are one-off; cache prevents repeat hits)
  await env.CACHE.put(cacheKey, html, { expirationTtl: 86400 });

  return htmlResponse(html);
}

// ---------------------------------------------------------------------------
// Comparison Report
// ---------------------------------------------------------------------------

export async function handleComparisonReport(req, env, placeId1, placeId2, placeId3) {
  if (!authCheck(req, env)) return errorHtml('Access denied. Invalid report key.', 403);

  const ids = [placeId1, placeId2, placeId3].filter(Boolean);
  if (ids.length < 2) return errorHtml('At least 2 place IDs required for comparison.', 400);

  let audits;
  try {
    audits = await Promise.all(ids.map(id => runAudit(id, env)));
  } catch (err) {
    console.error('[report/compare] audit failed:', err.message);
    return errorHtml('Could not load one or more profiles. Please check the place IDs.', 503);
  }

  const [subject, ...competitorList] = audits;
  const html = renderComparisonReport(subject, competitorList);
  return htmlResponse(html);
}
