/**
 * Admin routes — auth via X-Admin-Key header.
 * All return JSON except dashboard pages which return HTML.
 */

import { findPlaceByText, findNearbyCompetitors } from '../modules/places.js';
import { runAudit } from '../modules/audit.js';
import { runWeeklyScan } from '../cron/weeklyScan.js';
import { scanCompetitors } from '../modules/competitors.js';
import { renderDashboard, renderClientDetail, renderLeads, renderScanRuns } from '../templates/admin/templates.js';

function authCheck(req, env) {
  const url = new URL(req.url);
  return req.headers.get('X-Admin-Key') === env.ADMIN_KEY
    || url.searchParams.get('key') === env.ADMIN_KEY;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(msg, status = 400) {
  return json({ error: msg }, status);
}

function html(body) {
  return new Response(body, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

function requireAuth(req, env) {
  if (!authCheck(req, env)) {
    return json({ error: 'Unauthorized' }, 403);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function handleDashboard(req, env) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  // Load all clients with latest audit score
  const clients = await env.DB.prepare(`
    SELECT c.*,
      a.score as last_score, a.score_label as last_score_label,
      a.score_delta as last_delta, a.audit_date as last_audit_date
    FROM clients c
    LEFT JOIN audits a ON a.id = (
      SELECT id FROM audits WHERE client_id = c.id ORDER BY audit_date DESC LIMIT 1
    )
    ORDER BY c.active DESC, c.name ASC
  `).all();

  // Latest scan run
  const lastScan = await env.DB.prepare(`SELECT * FROM scan_runs ORDER BY started_at DESC LIMIT 1`).first();

  // Recent alerts
  const alerts = await env.DB.prepare(`
    SELECT ce.*, c.name as client_name
    FROM competitor_events ce
    JOIN clients c ON c.id = ce.client_id
    WHERE ce.detected_at > datetime('now', '-7 days')
    ORDER BY ce.detected_at DESC LIMIT 10
  `).all();

  // Unresolved clients
  const unresolved = await env.DB.prepare(`
    SELECT count(*) as count FROM clients WHERE active = 1 AND place_id IS NULL
  `).first();

  // New leads (last 7 days)
  const newLeads = await env.DB.prepare(`
    SELECT count(*) as count FROM leads WHERE created_at > datetime('now', '-7 days')
  `).first();

  return html(renderDashboard({
    clients: clients.results,
    lastScan,
    alerts: alerts.results,
    unresolvedCount: unresolved?.count || 0,
    newLeadsCount: newLeads?.count || 0,
  }));
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function handleListClients(req, env) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  const clients = await env.DB.prepare(`
    SELECT c.*,
      a.score as last_score, a.score_label as last_score_label, a.audit_date as last_audit_date
    FROM clients c
    LEFT JOIN audits a ON a.id = (SELECT id FROM audits WHERE client_id = c.id ORDER BY audit_date DESC LIMIT 1)
    ORDER BY c.name ASC
  `).all();

  const unresolvedCount = (clients.results || []).filter(c => c.active && !c.place_id).length;

  return json({
    clients: clients.results,
    total: clients.results?.length || 0,
    active: (clients.results || []).filter(c => c.active).length,
    unresolved_place_ids: unresolvedCount,
  });
}

export async function handleClientDetail(req, env, clientId) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  const client = await env.DB.prepare(`SELECT * FROM clients WHERE id = ?`).bind(clientId).first();
  if (!client) return jsonError('Client not found.', 404);

  const audits = await env.DB.prepare(`
    SELECT * FROM audits WHERE client_id = ? ORDER BY audit_date DESC LIMIT 10
  `).bind(clientId).all();

  const events = await env.DB.prepare(`
    SELECT * FROM competitor_events WHERE client_id = ? ORDER BY detected_at DESC LIMIT 20
  `).bind(clientId).all();

  return html(renderClientDetail({ client, audits: audits.results, events: events.results }));
}

export async function handleCreateClient(req, env) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  let body;
  try { body = await req.json(); } catch { return jsonError('Invalid JSON.'); }

  const { name, address, search_query } = body;
  if (!name?.trim()) return jsonError('name is required.');

  // Auto-resolve place_id using name + optional address or explicit search_query
  let placeId = null;
  const query = search_query || [name.trim(), address?.trim()].filter(Boolean).join(', ');
  try {
    const found = await findPlaceByText(query, env);
    if (found) placeId = found.place_id;
  } catch (err) {
    console.error('[admin/create-client] place lookup failed:', err.message);
    // Non-fatal — client is created without place_id; can be resolved later
  }

  const result = await env.DB.prepare(`
    INSERT INTO clients (name, address, place_id, active, created_at, updated_at)
    VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
  `).bind(name.trim(), address?.trim() || null, placeId).run();

  return json({
    success: true,
    client_id: result.meta?.last_row_id,
    place_id: placeId,
    resolved: !!placeId,
  }, 201);
}

export async function handleResolvePlaceId(req, env, clientId) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  const client = await env.DB.prepare(`SELECT * FROM clients WHERE id = ?`).bind(clientId).first();
  if (!client) return jsonError('Client not found.', 404);

  const query = [client.name, client.address].filter(Boolean).join(' ');

  let found;
  try {
    found = await findPlaceByText(query, env);
  } catch (err) {
    return jsonError(`Places API error: ${err.message}`, 503);
  }

  if (!found) {
    return json({ resolved: false, message: 'No match found. Try a more specific name or address.' });
  }

  await env.DB.prepare(`
    UPDATE clients SET place_id = ?, category = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(found.place_id, null, clientId).run();

  return json({ resolved: true, place_id: found.place_id, name: found.name, address: found.address });
}

export async function handleSaveCompetitors(req, env, clientId) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  let body;
  try { body = await req.json(); } catch { return jsonError('Invalid JSON.'); }

  const { competitor_place_ids } = body;
  if (!Array.isArray(competitor_place_ids)) return jsonError('competitor_place_ids must be an array.');

  await env.DB.prepare(`
    UPDATE clients SET competitors_json = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(JSON.stringify(competitor_place_ids), clientId).run();

  return json({ success: true, competitor_count: competitor_place_ids.length });
}

export async function handleClientAudit(req, env, clientId) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  const client = await env.DB.prepare(`SELECT * FROM clients WHERE id = ?`).bind(clientId).first();
  if (!client) return jsonError('Client not found.', 404);
  if (!client.place_id) return jsonError('Client has no resolved place_id.', 400);

  let audit;
  try {
    audit = await runAudit(client.place_id, env);
  } catch (err) {
    return jsonError(`Audit failed: ${err.message}`, 503);
  }

  return json(audit);
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

export async function handleManualScan(req, env) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  let body = {};
  try { body = await req.json(); } catch { /* no body = scan all */ }

  const clientIds = body.client_ids || null;

  // Fire and forget for large scans — return immediately
  const activeCount = clientIds?.length || (
    await env.DB.prepare(`SELECT count(*) as c FROM clients WHERE active = 1 AND place_id IS NOT NULL`).first()
  )?.c || 0;

  // Run synchronously for small scans (≤5 clients); async for large
  if (!clientIds || clientIds.length <= 5) {
    const summary = await runWeeklyScan(clientIds, 'manual', env);
    return json({ triggered: true, summary });
  }

  // Large scan: start and return immediately
  runWeeklyScan(clientIds, 'manual', env).catch(err =>
    console.error('[admin/scan] large scan failed:', err.message)
  );

  return json({
    triggered: true,
    client_count: activeCount,
    note: 'Large scan running in background. Check /admin/scan-runs for results.',
  });
}

// ---------------------------------------------------------------------------
// Audit History
// ---------------------------------------------------------------------------

export async function handleAuditHistory(req, env) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  const url = new URL(req.url);
  const clientId = url.searchParams.get('client_id');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  let audits;
  if (clientId) {
    audits = await env.DB.prepare(`
      SELECT * FROM audits WHERE client_id = ? ORDER BY audit_date DESC LIMIT ?
    `).bind(clientId, limit).all();
  } else {
    audits = await env.DB.prepare(`
      SELECT a.*, c.name as client_name FROM audits a
      LEFT JOIN clients c ON c.id = a.client_id
      ORDER BY a.audit_date DESC LIMIT ?
    `).bind(limit).all();
  }

  return json({ audits: audits.results });
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function handleLeadsList(req, env) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  const leads = await env.DB.prepare(`
    SELECT * FROM leads ORDER BY created_at DESC LIMIT 100
  `).all();

  const url = new URL(req.url);
  if (url.searchParams.get('format') === 'html') {
    return html(renderLeads({ leads: leads.results, reportSecret: env.REPORT_SECRET }));
  }

  return json({ leads: leads.results });
}

// ---------------------------------------------------------------------------
// Competitors
// ---------------------------------------------------------------------------

export async function handleNearbyCompetitors(req, env) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  const url = new URL(req.url);
  const placeId = url.searchParams.get('place_id');
  const limit = parseInt(url.searchParams.get('limit') || '3');

  if (!placeId) return jsonError('place_id is required.');

  let audit;
  try {
    audit = await runAudit(placeId, env);
  } catch (err) {
    return jsonError(`Could not load profile: ${err.message}`, 503);
  }

  const primaryType = audit.raw_types?.[0];
  if (!primaryType || !audit.lat || !audit.lng) {
    return jsonError('Could not determine location or category for this profile.');
  }

  const nearby = await findNearbyCompetitors(primaryType, audit.lat, audit.lng, placeId, limit, env);
  return json({ place_id: placeId, business_name: audit.business_name, nearby_competitors: nearby });
}

export async function handleCompetitorScan(req, env) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  const url = new URL(req.url);
  const clientId = url.searchParams.get('client_id');
  if (!clientId) return jsonError('client_id is required.');

  const client = await env.DB.prepare(`SELECT * FROM clients WHERE id = ?`).bind(clientId).first();
  if (!client) return jsonError('Client not found.', 404);
  if (!client.place_id) return jsonError('Client has no place_id.', 400);

  const competitorIds = JSON.parse(client.competitors_json || '[]');

  let result;
  try {
    result = await scanCompetitors(client.place_id, competitorIds, env);
  } catch (err) {
    return jsonError(`Competitor scan failed: ${err.message}`, 503);
  }

  return json(result);
}

// ---------------------------------------------------------------------------
// Scan Runs
// ---------------------------------------------------------------------------

export async function handleScanRuns(req, env) {
  const unauth = requireAuth(req, env);
  if (unauth) return unauth;

  const runs = await env.DB.prepare(`SELECT * FROM scan_runs ORDER BY started_at DESC LIMIT 20`).all();

  const url = new URL(req.url);
  if (url.searchParams.get('format') === 'html') {
    return html(renderScanRuns({ runs: runs.results }));
  }

  return json({ runs: runs.results });
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function handleHealth(_req, _env) {
  return json({ status: 'ok', timestamp: new Date().toISOString() });
}
