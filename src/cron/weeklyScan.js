/**
 * Weekly scan cron handler.
 * Runs every Saturday at 10:00 AM UTC (6:00 AM ET).
 * Scans all active clients, stores audits, detects competitor changes.
 */

import { runAudit } from '../modules/audit.js';
import { scanCompetitors, detectCompetitorChanges, dispatchCompetitorAlerts } from '../modules/competitors.js';
import { sendWeeklySummary } from '../modules/email.js';

const DELAY_BETWEEN_CALLS_MS = 500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main weekly scan entry point — called from the cron trigger.
 * Also called by POST /admin/scan/run.
 *
 * @param {number[]|null} clientIds - if null, scan all active clients
 * @param {string} trigger - 'cron' or 'manual'
 * @param {object} env
 */
export async function runWeeklyScan(clientIds, trigger, env) {
  // Record scan start
  const { meta: startMeta } = await env.DB.prepare(`
    INSERT INTO scan_runs (trigger) VALUES (?) RETURNING id
  `).bind(trigger).run();

  const scanRunId = startMeta?.last_row_id;

  // Fetch clients to scan
  let clients;
  if (clientIds?.length) {
    const placeholders = clientIds.map(() => '?').join(',');
    const result = await env.DB.prepare(`
      SELECT * FROM clients WHERE id IN (${placeholders}) AND place_id IS NOT NULL
    `).bind(...clientIds).all();
    clients = result.results;
  } else {
    const result = await env.DB.prepare(`
      SELECT * FROM clients WHERE active = 1 AND place_id IS NOT NULL
    `).all();
    clients = result.results;
  }

  console.log(`[weeklyScan] Starting scan: ${clients.length} clients, trigger=${trigger}`);

  const summary = {
    scanned: 0,
    errored: 0,
    alerts: 0,
    improvements: [],
    declines: [],
    errors: [],
    unresolved: [],
  };

  // Scan each client sequentially (respect API quotas)
  for (const client of clients) {
    try {
      const audit = await runAudit(client.place_id, env);

      // Find previous audit for delta calculation
      const prevAudit = await env.DB.prepare(`
        SELECT score FROM audits WHERE client_id = ? ORDER BY audit_date DESC LIMIT 1
      `).bind(client.id).first();

      const scoreDelta = prevAudit ? audit.score - prevAudit.score : null;

      // Run competitor scan (uses pre-computed subject audit to avoid re-fetching).
      // scanCompetitors() fetches competitor audits; we reuse those results for
      // both (a) storing the gap matrix in competitor_scan and (b) change detection.
      const competitorIds = JSON.parse(client.competitors_json || '[]');
      let competitorScanJson = null;
      let competitorAudits = [];

      try {
        const scan = await scanCompetitors(client.place_id, competitorIds, env, audit);
        competitorScanJson = JSON.stringify(scan);
        competitorAudits = scan.competitors;
      } catch (err) {
        console.error(`[weeklyScan] competitor scan failed for ${client.name}:`, err.message);
        // Non-fatal: continue storing the subject audit without competitor data
      }

      // Store audit (including competitor_scan if available)
      await env.DB.prepare(`
        INSERT INTO audits (client_id, place_id, score, score_label, score_delta, gaps_json, fields_json, competitor_scan, triggered_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        client.id,
        client.place_id,
        audit.score,
        audit.score_label,
        scoreDelta,
        JSON.stringify(audit.gaps),
        JSON.stringify(audit.fields),
        competitorScanJson,
        trigger,
      ).run();

      // Update client category if not set
      if (!client.category && audit.category) {
        await env.DB.prepare(`UPDATE clients SET category = ?, updated_at = datetime('now') WHERE id = ?`)
          .bind(audit.category, client.id).run();
      }

      summary.scanned++;

      // Track score changes for summary email
      if (scoreDelta !== null) {
        if (scoreDelta >= 3) {
          summary.improvements.push({ name: client.name, score: audit.score, delta: scoreDelta });
        } else if (scoreDelta <= -5) {
          summary.declines.push({ name: client.name, score: audit.score, delta: scoreDelta });
        }
      }

      // Change detection — reuse competitor audits from scanCompetitors() (no re-fetch)
      for (const compAudit of competitorAudits) {
        try {
          const events = await detectCompetitorChanges(client.id, compAudit.place_id, compAudit, env);
          if (events.length) {
            const eventsMapped = events.map(e => ({ ...e, competitorName: compAudit.business_name }));
            const sent = await dispatchCompetitorAlerts(client.name, eventsMapped, env);
            summary.alerts += sent;
          }
          await sleep(DELAY_BETWEEN_CALLS_MS);
        } catch (err) {
          console.error(`[weeklyScan] change detection failed for ${compAudit.place_id}:`, err.message);
        }
      }

      await sleep(DELAY_BETWEEN_CALLS_MS);
    } catch (err) {
      console.error(`[weeklyScan] client ${client.name} (${client.place_id}) failed:`, err.message);
      summary.errored++;
      summary.errors.push({ name: client.name, error: err.message });
    }
  }

  // Find unresolved clients (active but no place_id)
  const unresolvedResult = await env.DB.prepare(`
    SELECT name FROM clients WHERE active = 1 AND place_id IS NULL
  `).all();
  summary.unresolved = unresolvedResult.results || [];

  // Finalize scan run record
  const completedAt = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE scan_runs SET completed_at = ?, clients_scanned = ?, clients_errored = ?, alerts_sent = ?, summary_json = ?
    WHERE id = ?
  `).bind(completedAt, summary.scanned, summary.errored, summary.alerts, JSON.stringify(summary), scanRunId).run();

  console.log(`[weeklyScan] Complete: ${summary.scanned} scanned, ${summary.errored} errors, ${summary.alerts} alerts`);

  // Send weekly summary email (cron only, not manual small scans)
  if (trigger === 'cron') {
    sendWeeklySummary(summary, env).catch(err =>
      console.error('[weeklyScan] summary email failed:', err.message)
    );
  }

  return summary;
}
