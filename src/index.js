/**
 * EngageEngine GBP Intelligence — Cloudflare Worker entry point.
 *
 * Routes:
 *   Public:  GET /gbp-score, GET /api/gbp-score, POST /api/leads
 *   Reports: GET /report/client/:id, /report/prospect/:id, /report/compare/:ids
 *   Admin:   GET/POST /admin/*, GET /api/health, GET /api/nearby-competitors
 *   Cron:    scheduled() — Saturday 10am UTC
 */

import {
  handleGbpScorePage,
  handleGbpScoreApi,
  handleLeadCapture,
} from './routes/public.js';

import {
  handleClientReport,
  handleClientChecklist,
  handleProspectReport,
  handleComparisonReport,
} from './routes/reports.js';

import {
  handleDashboard,
  handleListClients,
  handleClientDetail,
  handleCreateClient,
  handleResolvePlaceId,
  handleSaveCompetitors,
  handleClientAudit,
  handleManualScan,
  handleAuditHistory,
  handleLeadsList,
  handleNearbyCompetitors,
  handleCompetitorScan,
  handleScanRuns,
  handleHealth,
} from './routes/admin.js';

import { runWeeklyScan } from './cron/weeklyScan.js';

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default {
  /**
   * HTTP fetch handler.
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Inject REPORT_SECRET placeholder into admin HTML report links
    // (done at response level to avoid hardcoding in templates)

    try {
      // ── Public routes ─────────────────────────────────────────────────
      if (method === 'GET' && path === '/') {
        return Response.redirect(url.origin + '/gbp-score', 302);
      }
      if (method === 'GET' && path === '/gbp-score') {
        return handleGbpScorePage(request, env);
      }
      if (method === 'GET' && path === '/api/gbp-score') {
        return handleGbpScoreApi(request, env);
      }
      if (method === 'POST' && path === '/api/leads') {
        return handleLeadCapture(request, env);
      }

      // ── Report routes ─────────────────────────────────────────────────
      const clientChecklistMatch = path.match(/^\/report\/client\/(\d+)\/checklist$/);
      if (method === 'GET' && clientChecklistMatch) {
        return handleClientChecklist(request, env, parseInt(clientChecklistMatch[1]));
      }

      const clientReportMatch = path.match(/^\/report\/client\/(\d+)$/);
      if (method === 'GET' && clientReportMatch) {
        return handleClientReport(request, env, parseInt(clientReportMatch[1]));
      }

      const prospectReportMatch = path.match(/^\/report\/prospect\/([^/]+)$/);
      if (method === 'GET' && prospectReportMatch) {
        return handleProspectReport(request, env, prospectReportMatch[1]);
      }

      const compareMatch = path.match(/^\/report\/compare\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/);
      if (method === 'GET' && compareMatch) {
        return handleComparisonReport(request, env, compareMatch[1], compareMatch[2], compareMatch[3]);
      }

      // ── Admin routes ───────────────────────────────────────────────────
      if (method === 'GET' && path === '/admin/dashboard') {
        const resp = await handleDashboard(request, env);
        return injectSecrets(resp, env.REPORT_SECRET, env.ADMIN_KEY);
      }

      if (method === 'GET' && (path === '/admin/clients' || path === '/admin/clients/')) {
        return handleListClients(request, env);
      }

      if (method === 'POST' && path === '/admin/clients') {
        return handleCreateClient(request, env);
      }

      const clientDetailMatch = path.match(/^\/admin\/clients\/(\d+)$/);
      if (method === 'GET' && clientDetailMatch) {
        const resp = await handleClientDetail(request, env, parseInt(clientDetailMatch[1]));
        return injectSecrets(resp, env.REPORT_SECRET, env.ADMIN_KEY);
      }

      const resolveMatch = path.match(/^\/admin\/clients\/(\d+)\/resolve-place-id$/);
      if (method === 'POST' && resolveMatch) {
        return handleResolvePlaceId(request, env, parseInt(resolveMatch[1]));
      }

      const competitorsMatch = path.match(/^\/admin\/clients\/(\d+)\/competitors$/);
      if (method === 'POST' && competitorsMatch) {
        return handleSaveCompetitors(request, env, parseInt(competitorsMatch[1]));
      }

      const auditMatch = path.match(/^\/admin\/clients\/(\d+)\/audit$/);
      if (method === 'GET' && auditMatch) {
        return handleClientAudit(request, env, parseInt(auditMatch[1]));
      }

      if (method === 'POST' && path === '/admin/scan/run') {
        return handleManualScan(request, env);
      }

      if (method === 'GET' && path === '/admin/audits') {
        return handleAuditHistory(request, env);
      }

      if (method === 'GET' && path === '/admin/leads') {
        const resp = await handleLeadsList(request, env);
        return injectSecrets(resp, env.REPORT_SECRET, env.ADMIN_KEY);
      }

      if (method === 'GET' && path === '/admin/competitors') {
        return handleCompetitorScan(request, env);
      }

      if (method === 'GET' && path === '/admin/scan-runs') {
        const resp = await handleScanRuns(request, env);
        return injectSecrets(resp, env.REPORT_SECRET, env.ADMIN_KEY);
      }

      if (method === 'GET' && path === '/api/health') {
        return handleHealth(request, env);
      }

      if (method === 'GET' && path === '/api/nearby-competitors') {
        return handleNearbyCompetitors(request, env);
      }

      // ── 404 ───────────────────────────────────────────────────────────
      return new Response(JSON.stringify({ error: 'Not found', path }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (err) {
      console.error(`[fetch] Unhandled error on ${method} ${path}:`, err.message, err.stack);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  /**
   * Cron trigger handler — Saturday 10:00 AM UTC.
   */
  async scheduled(event, env, ctx) {
    console.log('[cron] Weekly scan triggered:', event.cron);
    ctx.waitUntil(
      runWeeklyScan(null, 'cron', env).catch(err =>
        console.error('[cron] Weekly scan failed:', err.message)
      )
    );
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replace secret placeholders in admin HTML.
 * REPORT_SECRET → env.REPORT_SECRET (for report links)
 * ADMIN_KEY_PLACEHOLDER → env.ADMIN_KEY (for nav links + fetch calls)
 */
async function injectSecrets(response, reportSecret, adminKey) {
  if (!response.headers.get('Content-Type')?.includes('text/html')) {
    return response;
  }
  const text = await response.text();
  let out = text;
  if (reportSecret) out = out.replaceAll('REPORT_SECRET', reportSecret);
  if (adminKey) out = out.replaceAll('ADMIN_KEY_PLACEHOLDER', adminKey);
  return new Response(out, {
    status: response.status,
    headers: response.headers,
  });
}

// Backwards-compat alias (used in the fetch handler below)
function injectReportSecret(response, secret) {
  return injectSecrets(response, secret, null);
}
