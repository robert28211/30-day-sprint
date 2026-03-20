/**
 * Admin HTML templates — server-rendered, vanilla HTML/CSS.
 * All templates return complete HTML strings.
 */

// ---------------------------------------------------------------------------
// Shared Layout
// ---------------------------------------------------------------------------

function layout(title, body, activeNav = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | EngageEngine Admin</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --brand: #1a3a5c; --accent: #e8521a; --green: #16a34a;
      --yellow: #ca8a04; --red: #dc2626; --text: #1e293b;
      --muted: #64748b; --border: #e2e8f0; --bg: #f1f5f9;
    }
    body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
    nav { background:var(--brand); color:white; padding:0 1.5rem; display:flex; align-items:center; gap:2rem; height:52px; }
    nav .logo { font-weight:800; font-size:1.1rem; letter-spacing:-0.5px; }
    nav a { color:rgba(255,255,255,0.75); text-decoration:none; font-size:0.875rem; padding:0.25rem 0; border-bottom:2px solid transparent; }
    nav a.active, nav a:hover { color:white; border-bottom-color:var(--accent); }
    main { max-width:1200px; margin:0 auto; padding:1.5rem; }
    h1 { font-size:1.4rem; font-weight:800; color:var(--brand); margin-bottom:1rem; }
    h2 { font-size:1rem; font-weight:700; color:var(--brand); margin:1.25rem 0 0.75rem; }
    .card { background:white; border-radius:10px; box-shadow:0 1px 8px rgba(0,0,0,0.06); padding:1.25rem; margin-bottom:1rem; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--muted); padding:0.5rem; border-bottom:1px solid var(--border); }
    td { padding:0.6rem 0.5rem; border-bottom:1px solid var(--border); font-size:0.875rem; vertical-align:middle; }
    tr:last-child td { border-bottom:none; }
    tr:hover td { background:#f8fafc; }
    .badge { display:inline-block; padding:0.15rem 0.5rem; border-radius:999px; font-size:0.7rem; font-weight:700; }
    .badge-green { background:#dcfce7; color:var(--green); }
    .badge-yellow { background:#fef9c3; color:var(--yellow); }
    .badge-orange { background:#ffedd5; color:#ea580c; }
    .badge-red { background:#fee2e2; color:var(--red); }
    .badge-gray { background:#f1f5f9; color:var(--muted); }
    .btn { display:inline-block; padding:0.4rem 0.9rem; border-radius:6px; font-size:0.8rem; font-weight:600; text-decoration:none; cursor:pointer; border:none; }
    .btn-primary { background:var(--accent); color:white; }
    .btn-secondary { background:var(--brand); color:white; }
    .btn-ghost { background:var(--bg); color:var(--text); border:1px solid var(--border); }
    .alert-bar { background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:0.75rem 1rem; margin-bottom:1rem; font-size:0.875rem; }
    .alert-bar.red { background:#fee2e2; border-color:#fca5a5; }
    .stats-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:0.75rem; margin-bottom:1.25rem; }
    .stat { background:white; border-radius:8px; padding:0.875rem 1rem; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
    .stat-num { font-size:1.75rem; font-weight:900; color:var(--brand); line-height:1; }
    .stat-label { font-size:0.75rem; color:var(--muted); margin-top:0.25rem; }
    a { color:var(--brand); }
    .up { color:var(--green); font-weight:600; }
    .down { color:var(--red); font-weight:600; }
    .neutral { color:var(--muted); }
  </style>
</head>
<body>
<nav>
  <span class="logo">EngageEngine</span>
  <a href="/admin/dashboard?key=ADMIN_KEY_PLACEHOLDER" class="${activeNav === 'dashboard' ? 'active' : ''}">Dashboard</a>
  <a href="/admin/leads?format=html&key=ADMIN_KEY_PLACEHOLDER" class="${activeNav === 'leads' ? 'active' : ''}">Leads</a>
  <a href="/admin/scan-runs?format=html&key=ADMIN_KEY_PLACEHOLDER" class="${activeNav === 'scans' ? 'active' : ''}">Scan History</a>
</nav>
<main>
${body}
</main>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Score Badge
// ---------------------------------------------------------------------------

function scoreBadge(score, label) {
  if (!score && score !== 0) return '<span class="badge badge-gray">—</span>';
  const cls = label === 'Excellent' ? 'green' : label === 'Good' ? 'green' : label === 'Needs Work' ? 'yellow' : 'red';
  return `<span class="badge badge-${cls}">${score} ${label}</span>`;
}

function deltaHtml(delta) {
  if (delta == null) return '<span class="neutral">—</span>';
  if (delta > 0) return `<span class="up">▲ +${delta}</span>`;
  if (delta < 0) return `<span class="down">▼ ${delta}</span>`;
  return `<span class="neutral">─ 0</span>`;
}

function relativeDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function renderDashboard({ clients, lastScan, alerts, unresolvedCount, newLeadsCount }) {
  const activeClients = clients.filter(c => c.active);
  const avgScore = activeClients.filter(c => c.last_score).length
    ? Math.round(activeClients.filter(c => c.last_score).reduce((s, c) => s + c.last_score, 0) / activeClients.filter(c => c.last_score).length)
    : null;

  const alertsHtml = alerts.length ? alerts.slice(0, 3).map(a => `
    <div class="alert-bar red">
      🔴 <strong>${a.client_name}</strong>: Competitor ${a.event_type.replace('_', ' ')} — ${a.old_value} → ${a.new_value}
      <span style="color:var(--muted);font-size:0.8rem;margin-left:0.5rem">${relativeDate(a.detected_at)}</span>
    </div>
  `).join('') : '';

  const unresHtml = unresolvedCount > 0 ? `
    <div class="alert-bar">
      ⚠️ ${unresolvedCount} active client${unresolvedCount !== 1 ? 's' : ''} have no Place ID — GBP data unavailable.
      Click each client below to resolve their Place ID.
    </div>
  ` : '';

  const lastScanHtml = lastScan
    ? `Last scan: ${relativeDate(lastScan.started_at)} — ${lastScan.clients_scanned} scanned, ${lastScan.clients_errored} errors`
    : 'No scans yet';

  const clientRows = clients.map(c => `
    <tr>
      <td><a href="/admin/clients/${c.id}?key=ADMIN_KEY_PLACEHOLDER">${c.name}</a>${!c.active ? ' <span class="badge badge-gray">inactive</span>' : ''}</td>
      <td>${scoreBadge(c.last_score, c.last_score_label)}</td>
      <td>${deltaHtml(c.last_delta)}</td>
      <td style="color:var(--muted);font-size:0.8rem">${relativeDate(c.last_audit_date)}</td>
      <td>
        ${c.place_id ? `<a href="/report/client/${c.id}?key=REPORT_SECRET" class="btn btn-ghost" style="font-size:0.75rem">Report</a>` : '<span style="color:var(--red);font-size:0.75rem">No Place ID</span>'}
      </td>
    </tr>
  `).join('');

  const body = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <h1>GBP Intelligence Dashboard</h1>
      <div style="display:flex;gap:0.5rem">
        <button class="btn btn-secondary" onclick="runScan()">Run Scan Now</button>
      </div>
    </div>

    <div style="color:var(--muted);font-size:0.8rem;margin-bottom:1rem">${lastScanHtml}</div>

    <div class="stats-row">
      <div class="stat"><div class="stat-num">${activeClients.length}</div><div class="stat-label">Active Clients</div></div>
      <div class="stat"><div class="stat-num">${avgScore ?? '—'}</div><div class="stat-label">Avg Score</div></div>
      <div class="stat"><div class="stat-num">${alerts.length}</div><div class="stat-label">Alerts (7d)</div></div>
      <div class="stat"><div class="stat-num">${newLeadsCount}</div><div class="stat-label">New Leads (7d)</div></div>
    </div>

    ${alertsHtml}
    ${unresHtml}

    <!-- Add Client -->
    <div class="card">
      <h2 style="margin-top:0">Add New Client</h2>
      <form onsubmit="addClient(event)" style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:1;min-width:160px">
          <label style="font-size:0.75rem;font-weight:700;color:var(--muted);display:block;margin-bottom:0.25rem">Client Name *</label>
          <input id="newClientName" type="text" placeholder="e.g. Mike's Plumbing" required
            style="width:100%;border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;font-size:0.875rem">
        </div>
        <div style="flex:2;min-width:200px">
          <label style="font-size:0.75rem;font-weight:700;color:var(--muted);display:block;margin-bottom:0.25rem">Business Address <span style="font-weight:400">(helps match GBP)</span></label>
          <input id="newClientAddress" type="text" placeholder="123 Main St, City, State"
            style="width:100%;border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;font-size:0.875rem">
        </div>
        <button type="submit" class="btn btn-primary">Add Client</button>
      </form>
      <div id="addClientStatus" style="margin-top:0.5rem;font-size:0.8rem"></div>
    </div>

    <!-- Prospect Audit -->
    <div class="card">
      <h2 style="margin-top:0">Run Prospect Audit</h2>
      <p style="font-size:0.8rem;color:var(--muted);margin-bottom:0.75rem">Generate a prospect report for any Google Business Profile by name or Place ID.</p>
      <form onsubmit="runProspectAudit(event)" style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:2;min-width:240px">
          <label style="font-size:0.75rem;font-weight:700;color:var(--muted);display:block;margin-bottom:0.25rem">Business Name or Place ID</label>
          <input id="prospectInput" type="text" placeholder="e.g. Mario's Pizza, Chicago IL"
            style="width:100%;border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;font-size:0.875rem" required>
        </div>
        <button type="submit" class="btn btn-secondary">Generate Report</button>
      </form>
      <div id="prospectStatus" style="margin-top:0.5rem;font-size:0.8rem"></div>
    </div>

    <!-- Client List -->
    <h2>Clients</h2>
    <div class="card" style="padding:0">
      <table>
        <thead><tr>
          <th>Client</th><th>Score</th><th>Change</th><th>Last Scan</th><th>Links</th>
        </tr></thead>
        <tbody>${clientRows}</tbody>
      </table>
    </div>

    <script>
    const _adminKey = new URLSearchParams(location.search).get('key') || '';

    async function runScan() {
      if (!confirm('Start a scan of all active clients now?')) return;
      const res = await fetch('/admin/scan/run', {
        method: 'POST',
        headers: { 'X-Admin-Key': _adminKey }
      });
      const data = await res.json();
      alert(data.note || 'Scan triggered! Refresh in a few minutes.');
    }

    async function addClient(e) {
      e.preventDefault();
      const name = document.getElementById('newClientName').value.trim();
      const address = document.getElementById('newClientAddress').value.trim();
      const status = document.getElementById('addClientStatus');
      status.textContent = 'Adding…';
      status.style.color = 'var(--muted)';
      try {
        const res = await fetch('/admin/clients', {
          method: 'POST',
          headers: { 'X-Admin-Key': _adminKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, address })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          status.style.color = 'var(--green)';
          status.textContent = data.resolved
            ? '✓ Client added and GBP matched. Refreshing…'
            : '✓ Client added (no GBP match — resolve Place ID from client page). Refreshing…';
          setTimeout(() => location.reload(), 1500);
        } else {
          status.style.color = 'var(--red)';
          status.textContent = '✗ ' + (data.error || 'Unknown error');
        }
      } catch (err) {
        status.style.color = 'var(--red)';
        status.textContent = '✗ Network error: ' + err.message;
      }
    }

    async function runProspectAudit(e) {
      e.preventDefault();
      const input = document.getElementById('prospectInput').value.trim();
      const status = document.getElementById('prospectStatus');

      // If it looks like a place_id (starts with ChIJ or similar), use it directly.
      // Otherwise open a search via GBP Score page.
      const looksLikePlaceId = /^Ch[A-Za-z0-9_-]{20,}$/.test(input);
      if (looksLikePlaceId) {
        const url = '/report/prospect/' + encodeURIComponent(input) + '?key=REPORT_SECRET';
        status.innerHTML = '→ <a href="' + url + '" target="_blank">Open Prospect Report</a>';
        window.open(url, '_blank');
      } else {
        // Use the public GBP Score page to find the business and generate a report
        const url = '/gbp-score?q=' + encodeURIComponent(input);
        status.innerHTML = '→ Opening GBP Score lookup — find the business and click "Full Report"';
        window.open(url, '_blank');
      }
    }
    </script>
  `;

  return layout('Dashboard', body, 'dashboard');
}

// ---------------------------------------------------------------------------
// Client Detail
// ---------------------------------------------------------------------------

export function renderClientDetail({ client, audits, events }) {
  const latestAudit = audits[0];
  const gaps = latestAudit ? JSON.parse(latestAudit.gaps_json || '[]') : [];

  const gapRows = gaps.map((g, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${g.label}</td>
      <td style="color:#e8521a;font-weight:700">${g.revenue_impact?.display || '—'}</td>
      <td class="${g.severity === 'high' ? 'down' : 'neutral'}">${g.severity}</td>
    </tr>
  `).join('');

  const historyRows = audits.map(a => `
    <tr>
      <td style="color:var(--muted);font-size:0.8rem">${relativeDate(a.audit_date)}</td>
      <td>${scoreBadge(a.score, a.score_label)}</td>
      <td>${deltaHtml(a.score_delta)}</td>
      <td style="color:var(--muted);font-size:0.75rem">${a.triggered_by}</td>
    </tr>
  `).join('');

  const body = `
    <a href="/admin/dashboard?key=ADMIN_KEY_PLACEHOLDER" style="color:var(--muted);font-size:0.875rem">← Back to Dashboard</a>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin:1rem 0">
      <div>
        <h1>${client.name}</h1>
        <div style="color:var(--muted);font-size:0.85rem">${client.address || 'Address not set'}</div>
        ${client.place_id
          ? `<div style="color:var(--muted);font-size:0.75rem;margin-top:0.25rem">place_id: <code>${client.place_id}</code></div>`
          : `<div style="color:var(--red);font-size:0.8rem;font-weight:600;margin-top:0.25rem">⚠️ No Place ID — <a href="#" onclick="resolveId(${client.id})">Resolve</a></div>`}
      </div>
      ${latestAudit ? `<div style="text-align:right">${scoreBadge(latestAudit.score, latestAudit.score_label)}<div style="color:var(--muted);font-size:0.75rem;margin-top:0.25rem">${deltaHtml(latestAudit.score_delta)} this week</div></div>` : ''}
    </div>

    ${gaps.length ? `
    <h2>Current Gaps</h2>
    <div class="card" style="padding:0">
      <table>
        <thead><tr><th>#</th><th>Gap</th><th>Monthly Impact</th><th>Priority</th></tr></thead>
        <tbody>${gapRows}</tbody>
      </table>
    </div>` : '<p style="color:var(--green);font-weight:600">✓ No major gaps on latest audit</p>'}

    <h2>Audit History</h2>
    <div class="card" style="padding:0">
      <table>
        <thead><tr><th>Date</th><th>Score</th><th>Delta</th><th>Triggered By</th></tr></thead>
        <tbody>${historyRows || '<tr><td colspan="4" style="color:var(--muted);text-align:center">No audits yet</td></tr>'}</tbody>
      </table>
    </div>

    <h2>Actions</h2>
    <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
      ${client.place_id ? `
        <a href="/report/prospect/${client.place_id}?key=REPORT_SECRET" class="btn btn-primary" target="_blank">Prospect Report</a>
        <button class="btn btn-secondary" onclick="runClientScan(${client.id})">Run Audit Now</button>
      ` : ''}
      <a href="/admin/dashboard?key=ADMIN_KEY_PLACEHOLDER" class="btn btn-ghost">← Dashboard</a>
    </div>

    <script>
    const _adminKey = new URLSearchParams(location.search).get('key') || '';

    async function resolveId(id) {
      const res = await fetch('/admin/clients/' + id + '/resolve-place-id', {
        method: 'POST', headers: { 'X-Admin-Key': _adminKey }
      });
      const data = await res.json();
      alert(data.resolved ? 'Resolved: ' + data.place_id : data.message || 'Not found');
      if (data.resolved) location.reload();
    }
    async function runClientScan(id) {
      const res = await fetch('/admin/scan/run', {
        method: 'POST',
        headers: { 'X-Admin-Key': _adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_ids: [id] })
      });
      const data = await res.json();
      alert(data.summary ? 'Scan complete. Refreshing...' : (data.note || 'Done. Refreshing...'));
      location.reload();
    }
    </script>
  `;

  return layout(client.name, body);
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export function renderLeads({ leads, reportSecret }) {
  const rows = leads.map(l => `
    <tr>
      <td><strong>${l.business_name || '—'}</strong></td>
      <td>${scoreBadge(l.score, l.score_label)}</td>
      <td>${l.contact_name || '—'}</td>
      <td><a href="mailto:${l.email}">${l.email}</a></td>
      <td>${l.phone || '—'}</td>
      <td style="color:var(--muted);font-size:0.8rem">${relativeDate(l.created_at)}</td>
      <td>${l.place_id ? `<a href="/report/prospect/${l.place_id}?key=${reportSecret}" target="_blank" class="btn btn-ghost" style="font-size:0.75rem">Report</a>` : '—'}</td>
    </tr>
  `).join('');

  const body = `
    <h1>Leads</h1>
    <div class="card" style="padding:0">
      <table>
        <thead><tr>
          <th>Business</th><th>Score</th><th>Name</th><th>Email</th><th>Phone</th><th>Date</th><th>Report</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem">No leads yet</td></tr>'}</tbody>
      </table>
    </div>
  `;

  return layout('Leads', body, 'leads');
}

// ---------------------------------------------------------------------------
// Scan Runs
// ---------------------------------------------------------------------------

export function renderScanRuns({ runs }) {
  const rows = runs.map(r => {
    const duration = r.completed_at
      ? Math.round((new Date(r.completed_at) - new Date(r.started_at)) / 1000) + 's'
      : 'running…';
    return `
      <tr>
        <td style="color:var(--muted);font-size:0.8rem">${relativeDate(r.started_at)}</td>
        <td><span class="badge ${r.trigger === 'cron' ? 'badge-green' : 'badge-gray'}">${r.trigger}</span></td>
        <td>${r.clients_scanned}</td>
        <td>${r.clients_errored > 0 ? `<span class="down">${r.clients_errored}</span>` : '0'}</td>
        <td>${r.alerts_sent}</td>
        <td style="color:var(--muted);font-size:0.8rem">${duration}</td>
      </tr>
    `;
  }).join('');

  const body = `
    <h1>Scan History</h1>
    <div class="card" style="padding:0">
      <table>
        <thead><tr>
          <th>Date</th><th>Trigger</th><th>Scanned</th><th>Errors</th><th>Alerts</th><th>Duration</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem">No scans yet</td></tr>'}</tbody>
      </table>
    </div>
  `;

  return layout('Scan History', body, 'scans');
}
