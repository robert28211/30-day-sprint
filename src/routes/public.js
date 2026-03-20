/**
 * Public routes — no auth required.
 *
 * GET  /gbp-score             → landing page HTML
 * GET  /api/gbp-score?q=...   → partial audit (no revenue $)
 * POST /api/leads             → lead capture + full report delivery
 */

import { findPlaceByText, getPlaceDetails } from '../modules/places.js';
import { runAudit } from '../modules/audit.js';
import { sendLeadReport, sendRobbieAlert } from '../modules/email.js';
import { gbpScoreLandingHtml } from '../templates/gbp-score-landing.js';

// ---------------------------------------------------------------------------
// Rate Limiting (KV-backed)
// ---------------------------------------------------------------------------

async function checkRateLimit(key, max, ttl, env) {
  const current = await env.CACHE.get(key);
  const count = current ? parseInt(current) : 0;
  if (count >= max) return false;
  await env.CACHE.put(key, String(count + 1), { expirationTtl: ttl });
  return true;
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------

export async function handleGbpScorePage(_req, _env) {
  return new Response(gbpScoreLandingHtml(), {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

export async function handleGbpScoreApi(req, env) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');

  if (!q || q.trim().length < 3) {
    return jsonError('Please enter a business name and city.', 400);
  }

  // Rate limit: 10 lookups/IP/hour
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  const allowed = await checkRateLimit(`ratelimit:score:${ip}`, 10, 3600, env);
  if (!allowed) {
    return jsonError('Too many requests. Try again later — or book a call with Robbie.', 429);
  }

  // Resolve place_id
  let found;
  try {
    found = await findPlaceByText(q, env);
  } catch (err) {
    console.error('[gbp-score] findPlaceByText failed:', err.message);
    return jsonError('Could not reach Google. Please try again in a moment.', 503);
  }

  if (!found) {
    return jsonError('No business found for that search. Try adding the city name.', 404);
  }

  // Run audit
  let audit;
  try {
    audit = await runAudit(found.place_id, env);
  } catch (err) {
    console.error('[gbp-score] runAudit failed:', err.message);
    return jsonError('Could not load this profile. Please try again.', 503);
  }

  // Return partial result — withhold revenue $ to drive email capture
  return json({
    place_id: audit.place_id,
    business_name: audit.business_name,
    address: audit.address,
    score: audit.score,
    score_label: audit.score_label,
    top_gaps: audit.gaps.slice(0, 3).map(g => ({
      id: g.id,
      label: g.label,
      severity: g.severity,
      // Revenue intentionally omitted
    })),
    has_more_gaps: audit.gaps.length > 3,
    total_gap_count: audit.gaps.length,
  });
}

export async function handleLeadCapture(req, env) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body.', 400);
  }

  const { place_id, name, email, phone } = body;

  if (!email || !email.includes('@')) {
    return jsonError('A valid email address is required.', 400);
  }
  if (!place_id) {
    return jsonError('place_id is required.', 400);
  }

  // Rate limit: 3 leads per email per 30 days
  const emailKey = `ratelimit:lead:${email.toLowerCase()}`;
  const allowed = await checkRateLimit(emailKey, 3, 2592000, env);
  if (!allowed) {
    return jsonError('This email has already received a report recently. Check your inbox!', 429);
  }

  // Run full audit (with revenue)
  let audit;
  try {
    audit = await runAudit(place_id, env);
  } catch (err) {
    console.error('[leads] runAudit failed:', err.message);
    return jsonError('Could not load this profile. Please try again.', 503);
  }

  // Insert lead into D1
  const gapsJson = JSON.stringify(audit.gaps);
  await env.DB.prepare(`
    INSERT INTO leads (place_id, business_name, contact_name, email, phone, score, score_label, gaps_json, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'gbp-score')
  `).bind(
    place_id,
    audit.business_name,
    name || null,
    email,
    phone || null,
    audit.score,
    audit.score_label,
    gapsJson,
  ).run();

  // Send emails async (don't block response)
  const reportUrl = `https://${env.WORKER_HOSTNAME || 'gbp.engageengine.com'}/report/prospect/${place_id}?key=${env.REPORT_SECRET}`;

  sendLeadReport({ audit, name, email, reportUrl }, env).catch(err =>
    console.error('[leads] sendLeadReport failed:', err.message)
  );

  sendRobbieAlert({ audit, name, email, phone, reportUrl }, env).catch(err =>
    console.error('[leads] sendRobbieAlert failed:', err.message)
  );

  // Update lead as notified
  env.DB.prepare(`UPDATE leads SET report_sent = 1 WHERE email = ? AND place_id = ? ORDER BY created_at DESC LIMIT 1`)
    .bind(email, place_id).run().catch(() => {});

  return json({ success: true, message: 'Your full report is on its way. Expect it within 5 minutes.' });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function jsonError(message, status) {
  return json({ error: message }, status);
}
