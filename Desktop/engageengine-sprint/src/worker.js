// EngageEngine Sprint Tracker — Upgraded Worker
// Features: Auth, Client CRUD, Task edit/delete/undo, Health scoring,
//           Templates, Client notes, Dynamic team, Morning briefing, 30-Day Sprint

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function makeToken(secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('ee-sprint-session'));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function isValidToken(secret, token) {
  try {
    const expected = await makeToken(secret);
    return token === expected;
  } catch { return false; }
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return match ? match.slice(name.length + 1) : null;
}

async function authMiddleware(request, env) {
  const token = getCookie(request, 'session');
  if (!token) return false;
  try { return await isValidToken(env.APP_PASSWORD, token); }
  catch { return false; }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra }
  });
}

function redirect(location) {
  return new Response(null, { status: 302, headers: { Location: location } });
}

// ── Route table ───────────────────────────────────────────────────────────────

const ROUTES = [
  { method: 'POST', re: /^\/api\/auth\/login$/, handler: handleLogin, public: true },
  { method: 'GET',  re: /^\/api\/dashboard$/,  handler: handleDashboard },
  { method: 'GET',  re: /^\/api\/clients$/,    handler: handleClientsList },
  { method: 'POST', re: /^\/api\/clients$/,    handler: handleClientCreate },
  { method: 'GET',  re: /^\/api\/clients\/([^/]+)$/, handler: (r, e, m) => handleClientGet(r, e, m[1]) },
  { method: 'PUT',  re: /^\/api\/clients\/([^/]+)$/, handler: (r, e, m) => handleClientUpdate(r, e, m[1]) },
  { method: 'POST', re: /^\/api\/clients\/([^/]+)\/archive$/, handler: (r, e, m) => handleClientArchive(r, e, m[1]) },
  { method: 'PUT',  re: /^\/api\/clients\/([^/]+)\/notes$/, handler: (r, e, m) => handleClientNotes(r, e, m[1]) },
  { method: 'GET',  re: /^\/api\/team$/, handler: handleTeamList },
  { method: 'POST', re: /^\/api\/team$/, handler: handleTeamCreate },
  { method: 'DELETE', re: /^\/api\/team\/([^/]+)$/, handler: (r, e, m) => handleTeamDelete(r, e, m[1]) },
  { method: 'GET',  re: /^\/api\/team\/([^/]+)$/, handler: (r, e, m) => handleTeamMember(r, e, m[1]) },
  { method: 'GET',  re: /^\/api\/templates$/, handler: handleTemplatesList },
  { method: 'POST', re: /^\/api\/jobs$/, handler: handleJobCreate },
  { method: 'POST', re: /^\/api\/jobs\/([^/]+)\/complete$/, handler: (r, e, m) => handleJobStatus(r, e, m[1], 'Complete') },
  { method: 'POST', re: /^\/api\/jobs\/([^/]+)\/reopen$/,   handler: (r, e, m) => handleJobStatus(r, e, m[1], 'Active') },
  { method: 'POST', re: /^\/api\/tasks$/, handler: handleTaskCreate },
  { method: 'PUT',  re: /^\/api\/tasks\/([^/]+)$/, handler: (r, e, m) => handleTaskUpdate(r, e, m[1]) },
  { method: 'DELETE', re: /^\/api\/tasks\/([^/]+)$/, handler: (r, e, m) => handleTaskDelete(r, e, m[1]) },
  { method: 'POST', re: /^\/api\/tasks\/([^/]+)\/complete$/, handler: (r, e, m) => handleTaskStatus(r, e, m[1], 'Complete') },
  { method: 'POST', re: /^\/api\/tasks\/([^/]+)\/reopen$/,   handler: (r, e, m) => handleTaskStatus(r, e, m[1], 'Not Started') },
  { method: 'GET',  re: /^\/api\/sprint\/([^/]+)$/, handler: (r, e, m) => handleSprintGet(r, e, m[1]) },
  { method: 'POST', re: /^\/api\/sprint\/toggle$/, handler: handleSprintToggle },
  { method: 'POST', re: /^\/api\/sprint\/activate$/, handler: handleSprintActivate },
  // Gmail OAuth
  { method: 'GET',  re: /^\/api\/gmail\/auth$/, handler: handleGmailAuth },
  { method: 'GET',  re: /^\/api\/gmail\/callback$/, handler: handleGmailCallback, public: true },
  { method: 'GET',  re: /^\/api\/gmail\/status$/, handler: handleGmailStatus },
  // AI Intake
  { method: 'GET',  re: /^\/api\/intake$/, handler: handleIntakeList },
  { method: 'POST', re: /^\/api\/intake\/upload$/, handler: handleIntakeUpload },
  { method: 'POST', re: /^\/api\/intake\/chat$/, handler: handleIntakeChat },
  { method: 'POST', re: /^\/api\/intake\/([^/]+)\/confirm$/, handler: (r, e, m) => handleIntakeConfirm(r, e, m[1]) },
  { method: 'POST', re: /^\/api\/intake\/([^/]+)\/dismiss$/, handler: (r, e, m) => handleIntakeDismiss(r, e, m[1]) },
];

// ── API handlers ──────────────────────────────────────────────────────────────

async function handleLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  if (!env.APP_PASSWORD || body.password !== env.APP_PASSWORD) {
    return json({ error: 'Incorrect password' }, 401);
  }
  const token = await makeToken(env.APP_PASSWORD);
  const cookie = `session=${token}; HttpOnly; SameSite=Strict; Max-Age=604800; Path=/`;
  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
}

async function handleDashboard(request, env) {
  const clients = await env.DB.prepare(`
    SELECT c.id, c.name, c.status, c.has_sprint, c.archived,
      COUNT(DISTINCT j.id) as active_jobs,
      COUNT(DISTINCT CASE WHEN t.status = 'Not Started' THEN t.id END) as open_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'Complete' THEN t.id END) as done_tasks,
      COUNT(DISTINCT CASE WHEN t.status='Not Started' AND t.due_date < date('now') THEN t.id END) as overdue_tasks,
      COUNT(DISTINCT CASE WHEN t.status='Not Started' AND t.due_date BETWEEN date('now') AND date('now','+3 days') THEN t.id END) as soon_tasks
    FROM sprint_clients c
    LEFT JOIN sprint_jobs j ON j.client_id = c.id AND j.status = 'Active'
    LEFT JOIN sprint_tasks t ON t.client_id = c.id
    WHERE c.archived = 0
    GROUP BY c.id
    ORDER BY active_jobs DESC, c.name
  `).all();
  const stats = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM sprint_clients WHERE status='Active' AND archived=0) as active_clients,
      (SELECT COUNT(*) FROM sprint_jobs WHERE status='Active') as active_jobs,
      (SELECT COUNT(*) FROM sprint_tasks WHERE status='Not Started') as open_tasks,
      (SELECT COUNT(*) FROM sprint_tasks WHERE status='Complete') as done_tasks
  `).first();
  const team = await env.DB.prepare(`
    SELECT tm.id, tm.name, tm.role,
      COUNT(DISTINCT t.id) as assigned_tasks
    FROM sprint_team tm
    LEFT JOIN sprint_tasks t ON LOWER(t.assigned_to) = LOWER(tm.name) AND t.status = 'Not Started'
    GROUP BY tm.id
    ORDER BY tm.name
  `).all();
  // Morning briefing counts
  const briefing = await env.DB.prepare(`
    SELECT
      COUNT(DISTINCT CASE WHEN t.status='Not Started' AND t.due_date < date('now') THEN t.id END) as overdue,
      COUNT(DISTINCT CASE WHEN t.status='Not Started' AND t.due_date = date('now') THEN t.id END) as due_today
    FROM sprint_tasks t
    JOIN sprint_clients c ON c.id = t.client_id WHERE c.archived = 0
  `).first();
  let intake_pending = 0;
  try {
    const ip = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM sprint_intake WHERE status='pending'`
    ).first();
    intake_pending = ip?.cnt || 0;
  } catch { /* table not yet migrated */ }
  return json({ clients: clients.results, stats, team: team.results, briefing, intake_pending });
}

async function handleClientsList(request, env) {
  const clients = await env.DB.prepare(
    `SELECT * FROM sprint_clients WHERE archived=0 ORDER BY name`
  ).all();
  return json(clients.results);
}

async function handleClientGet(request, env, clientId) {
  const client = await env.DB.prepare('SELECT * FROM sprint_clients WHERE id=?').bind(clientId).first();
  if (!client) return json({ error: 'Not found' }, 404);
  const jobs = await env.DB.prepare(`
    SELECT j.*,
      COUNT(DISTINCT CASE WHEN t.status='Not Started' THEN t.id END) as open_tasks,
      COUNT(DISTINCT CASE WHEN t.status='Complete' THEN t.id END) as done_tasks,
      COUNT(DISTINCT t.id) as total_tasks
    FROM sprint_jobs j
    LEFT JOIN sprint_tasks t ON t.job_id = j.id
    WHERE j.client_id=?
    GROUP BY j.id
    ORDER BY CASE j.status WHEN 'Active' THEN 0 ELSE 1 END, j.name
  `).bind(clientId).all();
  const tasks = await env.DB.prepare(`
    SELECT t.*, j.name as job_name
    FROM sprint_tasks t
    LEFT JOIN sprint_jobs j ON j.id = t.job_id
    WHERE t.client_id=?
    ORDER BY CASE t.status WHEN 'Not Started' THEN 0 WHEN 'In Progress' THEN 1 ELSE 2 END, t.due_date
  `).bind(clientId).all();
  return json({ client, jobs: jobs.results, tasks: tasks.results });
}

async function handleClientCreate(request, env) {
  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  if (!name) return json({ error: 'Name required' }, 400);
  const exists = await env.DB.prepare(
    `SELECT 1 FROM sprint_clients WHERE name=? AND archived=0`
  ).bind(name).first();
  if (exists) return json({ error: 'Name already exists' }, 409);
  const id = genId('client');
  await env.DB.prepare(
    `INSERT INTO sprint_clients (id, name, status, has_sprint, archived, notes, created_at, updated_at)
     VALUES (?, ?, 'Active', 0, 0, '', date('now'), date('now'))`
  ).bind(id, name).run();
  return json({ success: true, id });
}

async function handleClientUpdate(request, env, clientId) {
  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  if (!name) return json({ error: 'Name required' }, 400);
  const exists = await env.DB.prepare(
    `SELECT 1 FROM sprint_clients WHERE name=? AND archived=0 AND id!=?`
  ).bind(name, clientId).first();
  if (exists) return json({ error: 'Name already exists' }, 409);
  await env.DB.prepare(
    `UPDATE sprint_clients SET name=?, updated_at=date('now') WHERE id=?`
  ).bind(name, clientId).run();
  return json({ success: true });
}

async function handleClientArchive(request, env, clientId) {
  await env.DB.prepare(
    `UPDATE sprint_clients SET archived=1, updated_at=date('now') WHERE id=?`
  ).bind(clientId).run();
  return json({ success: true });
}

async function handleClientNotes(request, env, clientId) {
  const body = await request.json().catch(() => ({}));
  const notes = body.notes || '';
  await env.DB.prepare(
    `UPDATE sprint_clients SET notes=?, updated_at=date('now') WHERE id=?`
  ).bind(notes, clientId).run();
  return json({ success: true });
}

async function handleTeamList(request, env) {
  const team = await env.DB.prepare(`SELECT * FROM sprint_team ORDER BY name`).all();
  return json(team.results);
}

async function handleTeamCreate(request, env) {
  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  if (!name) return json({ error: 'Name required' }, 400);
  const exists = await env.DB.prepare(`SELECT 1 FROM sprint_team WHERE name=?`).bind(name).first();
  if (exists) return json({ error: 'Name already exists' }, 409);
  const id = genId('tm');
  await env.DB.prepare(
    `INSERT INTO sprint_team (id, name, role, created_at) VALUES (?, ?, ?, date('now'))`
  ).bind(id, name, body.role || '').run();
  return json({ success: true, id });
}

async function handleTeamDelete(request, env, id) {
  await env.DB.batch([
    env.DB.prepare(`UPDATE sprint_tasks SET assigned_to=NULL WHERE assigned_to=(SELECT name FROM sprint_team WHERE id=?)`).bind(id),
    env.DB.prepare(`DELETE FROM sprint_team WHERE id=?`).bind(id)
  ]);
  return json({ success: true });
}

async function handleTeamMember(request, env, encodedName) {
  const name = decodeURIComponent(encodedName);
  const tasks = await env.DB.prepare(`
    SELECT t.*, c.name as client_name, j.name as job_name
    FROM sprint_tasks t
    LEFT JOIN sprint_clients c ON c.id = t.client_id
    LEFT JOIN sprint_jobs j ON j.id = t.job_id
    WHERE LOWER(t.assigned_to) = LOWER(?) AND t.status = 'Not Started'
    ORDER BY t.due_date, c.name
  `).bind(name).all();
  return json({ name, tasks: tasks.results });
}

async function handleTemplatesList(request, env) {
  const templates = await env.DB.prepare(`SELECT * FROM sprint_templates ORDER BY sort_order, name`).all();
  const taskRows = await env.DB.prepare(`SELECT * FROM sprint_template_tasks ORDER BY sort_order`).all();
  const byTemplate = {};
  for (const t of taskRows.results) {
    if (!byTemplate[t.template_id]) byTemplate[t.template_id] = [];
    byTemplate[t.template_id].push(t);
  }
  return json(templates.results.map(t => ({ ...t, tasks: byTemplate[t.id] || [] })));
}

async function handleJobCreate(request, env) {
  const body = await request.json().catch(() => ({}));
  const jobId = genId('job');
  const stmts = [
    env.DB.prepare(`INSERT INTO sprint_jobs (id, client_id, name, status, created_at, updated_at) VALUES (?, ?, ?, 'Active', date('now'), date('now'))`)
      .bind(jobId, body.client_id, body.name)
  ];
  if (body.template_id) {
    const tmpl = await env.DB.prepare(`SELECT * FROM sprint_templates WHERE id=?`).bind(body.template_id).first();
    if (tmpl) {
      const tasks = await env.DB.prepare(`SELECT * FROM sprint_template_tasks WHERE template_id=? ORDER BY sort_order`).bind(body.template_id).all();
      for (const t of tasks.results) {
        const taskId = genId('task');
        stmts.push(
          env.DB.prepare(`INSERT INTO sprint_tasks (id, job_id, client_id, task_id, notes, status, assigned_to, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'Not Started', ?, '', date('now'), date('now'))`)
            .bind(taskId, jobId, body.client_id, `tmpl-${t.id}`, t.notes, t.assigned_to_role || '')
        );
      }
    }
  }
  await env.DB.batch(stmts);
  return json({ success: true, id: jobId });
}

async function handleJobStatus(request, env, jobId, status) {
  await env.DB.prepare(`UPDATE sprint_jobs SET status=?, updated_at=date('now') WHERE id=?`).bind(status, jobId).run();
  return json({ success: true });
}

async function handleTaskCreate(request, env) {
  const body = await request.json().catch(() => ({}));
  const id = genId('task');
  const taskId = `manual-${body.job_id}-${Date.now()}`;
  await env.DB.prepare(
    `INSERT INTO sprint_tasks (id, job_id, client_id, task_id, notes, status, assigned_to, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'Not Started', ?, ?, date('now'), date('now'))`
  ).bind(id, body.job_id, body.client_id, taskId, body.notes, body.assigned_to || '', body.due_date || '').run();
  return json({ success: true, id });
}

async function handleTaskUpdate(request, env, taskId) {
  const body = await request.json().catch(() => ({}));
  await env.DB.prepare(
    `UPDATE sprint_tasks SET notes=?, assigned_to=?, due_date=?, updated_at=date('now') WHERE id=?`
  ).bind(body.notes || '', body.assigned_to || '', body.due_date || '', taskId).run();
  return json({ success: true });
}

async function handleTaskDelete(request, env, taskId) {
  await env.DB.prepare(`DELETE FROM sprint_tasks WHERE id=?`).bind(taskId).run();
  return json({ success: true });
}

async function handleTaskStatus(request, env, taskId, status) {
  const now = new Date().toISOString().split('T')[0];
  if (status === 'Complete') {
    await env.DB.prepare(
      `UPDATE sprint_tasks SET status='Complete', completed_date=?, updated_at=date('now') WHERE id=?`
    ).bind(now, taskId).run();
  } else {
    await env.DB.prepare(
      `UPDATE sprint_tasks SET status='Not Started', completed_date=NULL, updated_at=date('now') WHERE id=?`
    ).bind(taskId).run();
  }
  return json({ success: true });
}

async function handleSprintGet(request, env, clientId) {
  const items = await env.DB.prepare(
    `SELECT * FROM sprint_checklist WHERE client_id=?`
  ).bind(clientId).all();
  return json({ items: items.results });
}

async function handleSprintToggle(request, env) {
  const body = await request.json().catch(() => ({}));
  const { client_id, task_id, completed_by } = body;
  const existing = await env.DB.prepare(
    `SELECT * FROM sprint_checklist WHERE client_id=? AND task_id=?`
  ).bind(client_id, task_id).first();
  const now = new Date().toISOString().split('T')[0];
  if (existing) {
    const newVal = existing.completed ? 0 : 1;
    await env.DB.prepare(
      `UPDATE sprint_checklist SET completed=?, completed_by=?, completed_date=? WHERE client_id=? AND task_id=?`
    ).bind(newVal, newVal ? (completed_by || '') : '', newVal ? now : '', client_id, task_id).run();
  } else {
    const id = genId('sc');
    await env.DB.prepare(
      `INSERT INTO sprint_checklist (id, client_id, task_id, completed, completed_by, completed_date) VALUES (?, ?, ?, 1, ?, ?)`
    ).bind(id, client_id, task_id, completed_by || '', now).run();
  }
  return json({ success: true });
}

async function handleSprintActivate(request, env) {
  const body = await request.json().catch(() => ({}));
  const { client_id, start_date } = body;
  // Duplicate enrollment check
  const exists = await env.DB.prepare(
    `SELECT 1 FROM sprint_clients WHERE id=? AND has_sprint=1`
  ).bind(client_id).first();
  if (exists) return json({ error: 'Already enrolled' }, 409);
  await env.DB.prepare(
    `UPDATE sprint_clients SET has_sprint=1, start_date=?, updated_at=date('now') WHERE id=?`
  ).bind(start_date || new Date().toISOString().split('T')[0], client_id).run();
  return json({ success: true });
}

// ── AI intake helpers ──────────────────────────────────────────────────────────

async function callClaude(env, messages, model = 'claude-sonnet-4-6') {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: 2048, messages }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

function validateExtraction(parsed) {
  if (!parsed || !Array.isArray(parsed.jobs)) return false;
  return parsed.jobs.every(j => typeof j.name === 'string' && Array.isArray(j.tasks));
}

function matchClient(extractedName, clients) {
  const normalize = s => s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(llc|inc|co|corp|ltd|group|solutions|services)\b/g, '')
    .trim();
  const t = normalize(extractedName || '');
  if (!t) return null;
  return clients.find(c => {
    const cn = normalize(c.name);
    return cn.includes(t) || t.includes(cn);
  }) || null;
}

// ── Gmail OAuth helpers ────────────────────────────────────────────────────────

async function getValidGmailToken(env) {
  const row = await env.DB.prepare(
    'SELECT * FROM sprint_gmail_tokens WHERE id=?'
  ).bind('main').first();
  if (!row) return null;
  const expiry = new Date(row.token_expiry);
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (expiry <= fiveMinFromNow) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: row.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString();
    await env.DB.prepare(
      'UPDATE sprint_gmail_tokens SET access_token=?, token_expiry=? WHERE id=?'
    ).bind(data.access_token, newExpiry, 'main').run();
    return data.access_token;
  }
  return row.access_token;
}

async function handleGmailAuth(request, env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_REDIRECT_URI) {
    return json({ error: 'GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI not configured' }, 500);
  }
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    access_type: 'offline',
    prompt: 'consent',
  });
  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

async function handleGmailCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error || !code) return redirect('/?gmail_error=access_denied');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) return redirect('/?gmail_error=token_exchange_failed');
  const data = await res.json();
  const expiry = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await env.DB.prepare(`
    INSERT INTO sprint_gmail_tokens (id, access_token, refresh_token, token_expiry, last_checked)
    VALUES ('main', ?, ?, ?, NULL)
    ON CONFLICT(id) DO UPDATE SET
      access_token=excluded.access_token,
      refresh_token=excluded.refresh_token,
      token_expiry=excluded.token_expiry
  `).bind(data.access_token, data.refresh_token, expiry).run();
  return redirect('/?gmail_connected=1');
}

async function handleGmailStatus(request, env) {
  try {
    const row = await env.DB.prepare(
      'SELECT last_checked, cron_last_run, cron_last_error FROM sprint_gmail_tokens WHERE id=?'
    ).bind('main').first();
    return json({
      connected: !!row,
      last_checked: row?.last_checked || null,
      cron_last_run: row?.cron_last_run || null,
      cron_last_error: row?.cron_last_error || null,
    });
  } catch {
    return json({ connected: false, last_checked: null, cron_last_run: null, cron_last_error: null });
  }
}

// ── Gmail cron poll ────────────────────────────────────────────────────────────

const GMAIL_BATCH_LIMIT = 20;

async function runGmailPoll(env) {
  const token = await getValidGmailToken(env);
  if (!token) return { processed: 0, error: 'Gmail not connected or token refresh failed' };

  const row = await env.DB.prepare(
    'SELECT last_checked FROM sprint_gmail_tokens WHERE id=?'
  ).bind('main').first();
  const since = row?.last_checked;

  let q = 'is:unread in:inbox';
  if (since) q += ` after:${Math.floor(new Date(since).getTime() / 1000)}`;

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${GMAIL_BATCH_LIMIT}&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) return { processed: 0, error: `Gmail list error: ${listRes.status}` };

  const listData = await listRes.json();
  const messages = listData.messages || [];

  const clientsRes = await env.DB.prepare(
    'SELECT id, name FROM sprint_clients WHERE archived=0'
  ).all();
  const clients = clientsRes.results;

  let processed = 0;
  for (const msg of messages) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!msgRes.ok) continue;
    const msgData = await msgRes.json();

    const headers = msgData.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
    const fromHeader = headers.find(h => h.name === 'From')?.value || '';

    let body = '';
    const extractBody = (part) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        try {
          body += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch { /* invalid base64 */ }
      }
      if (part.parts) part.parts.forEach(extractBody);
    };
    extractBody(msgData.payload || {});
    if (!body.trim()) continue;

    const rawText = `Subject: ${subject}\nFrom: ${fromHeader}\n\n${body.slice(0, 3000)}`;

    // Step 1: classify — cheap haiku call
    let isWorkRequest = false;
    try {
      const classText = await callClaude(env, [{
        role: 'user',
        content: `Is this email a client work request, project inquiry, or action item that needs project tracking? Reply with only "yes" or "no".\n\n${rawText}`,
      }], 'claude-haiku-4-5-20251001');
      isWorkRequest = classText.trim().toLowerCase().startsWith('yes');
    } catch { continue; }

    if (!isWorkRequest) continue;

    // Step 2: extract structure
    let extracted = null;
    try {
      const extractText = await callClaude(env, [{
        role: 'user',
        content: `Extract the client work request from this email. Return ONLY valid JSON: {"client_name": "string", "jobs": [{"name": "string", "tasks": [{"name": "string"}]}]}. If you cannot extract structured data, return {"client_name": "", "jobs": []}.\n\n${rawText}`,
      }], 'claude-sonnet-4-6');
      const jsonMatch = extractText.match(/\{[\s\S]*\}/);
      if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
    } catch { extracted = null; }

    if (!extracted || !validateExtraction(extracted)) {
      extracted = { client_name: '', jobs: [] };
    }

    const matched = matchClient(extracted.client_name || '', clients);
    const id = genId('intake');
    await env.DB.prepare(`
      INSERT INTO sprint_intake (id, source, subject, raw_text, extracted_json, suggested_client_id, suggested_client_name, status)
      VALUES (?, 'email', ?, ?, ?, ?, ?, 'pending')
    `).bind(
      id, subject, rawText,
      JSON.stringify(extracted),
      matched?.id || null,
      extracted.client_name || fromHeader
    ).run();
    processed++;
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    'UPDATE sprint_gmail_tokens SET last_checked=?, cron_last_run=?, cron_last_error=NULL WHERE id=?'
  ).bind(now, now, 'main').run();

  return { processed };
}

// ── Intake API handlers ────────────────────────────────────────────────────────

async function handleIntakeList(request, env) {
  try {
    const items = await env.DB.prepare(
      `SELECT * FROM sprint_intake WHERE status='pending' ORDER BY created_at DESC`
    ).all();
    return json(items.results);
  } catch {
    return json([]);
  }
}

async function handleIntakeUpload(request, env) {
  let fileBytes, filename, mimeType;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return json({ error: 'No file provided' }, 400);
    filename = file.name || 'document';
    mimeType = file.type || 'application/octet-stream';
    fileBytes = await file.arrayBuffer();
  } catch {
    return json({ error: 'Invalid file upload' }, 400);
  }
  if (fileBytes.byteLength > 10 * 1024 * 1024) {
    return json({ error: 'File too large (max 10MB)' }, 413);
  }

  let extractText;
  const isPdf = mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(fileBytes)));
    try {
      extractText = await callClaude(env, [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
          { type: 'text', text: 'Extract all jobs, phases, milestones, and tasks from this proposal or document. Return ONLY valid JSON: {"client_name": "string", "jobs": [{"name": "string", "tasks": [{"name": "string", "notes": "string"}]}]}. Be thorough — capture every deliverable, phase, and task mentioned.' },
        ],
      }], 'claude-sonnet-4-6');
    } catch (err) {
      return json({ error: `Extraction failed: ${err.message}` }, 500);
    }
  } else {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(fileBytes).slice(0, 10000);
    try {
      extractText = await callClaude(env, [{
        role: 'user',
        content: `Extract all jobs, phases, milestones, and tasks from this proposal or document. Return ONLY valid JSON: {"client_name": "string", "jobs": [{"name": "string", "tasks": [{"name": "string", "notes": "string"}]}]}.\n\n${rawText}`,
      }], 'claude-sonnet-4-6');
    } catch (err) {
      return json({ error: `Extraction failed: ${err.message}` }, 500);
    }
  }

  let extracted = null;
  try {
    const jsonMatch = extractText.match(/\{[\s\S]*\}/);
    if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
  } catch { extracted = null; }

  if (!extracted || !validateExtraction(extracted)) {
    extracted = { client_name: '', jobs: [] };
  }

  const clientsRes = await env.DB.prepare(
    'SELECT id, name FROM sprint_clients WHERE archived=0'
  ).all();
  const matched = matchClient(extracted.client_name || '', clientsRes.results);

  const id = genId('intake');
  const rawTextForDb = isPdf
    ? `[PDF: ${filename}]`
    : new TextDecoder('utf-8', { fatal: false }).decode(fileBytes).slice(0, 5000);

  await env.DB.prepare(`
    INSERT INTO sprint_intake (id, source, subject, raw_text, extracted_json, suggested_client_id, suggested_client_name, status)
    VALUES (?, 'proposal', ?, ?, ?, ?, ?, 'pending')
  `).bind(
    id, filename, rawTextForDb,
    JSON.stringify(extracted),
    matched?.id || null,
    extracted.client_name || filename
  ).run();

  const openingMsg = `I've analyzed **${filename}** and extracted the following structure:\n\n${
    (extracted.jobs || []).map(j =>
      `**${j.name}**\n${(j.tasks || []).map(t => `  - ${t.name}`).join('\n')}`
    ).join('\n\n') || '_(No structured content found — try uploading a cleaner version)_'
  }\n\nYou can ask me to add, remove, rename, or split any jobs or tasks. When you're happy with the structure, click **Add to Client**.`;

  const chatId = genId('chat');
  await env.DB.prepare(
    'INSERT INTO sprint_intake_chat (id, intake_id, role, content) VALUES (?, ?, ?, ?)'
  ).bind(chatId, id, 'assistant', openingMsg).run();

  return json({ intake_id: id, extracted, suggested_client: matched, opening_message: openingMsg });
}

async function handleIntakeChat(request, env) {
  const body = await request.json().catch(() => ({}));
  const { intake_id, message } = body;
  if (!intake_id || !message) return json({ error: 'intake_id and message required' }, 400);

  const intake = await env.DB.prepare(
    'SELECT * FROM sprint_intake WHERE id=?'
  ).bind(intake_id).first();
  if (!intake) return json({ error: 'Intake item not found' }, 404);

  // Load last 10 turns (20 messages), oldest-first
  const historyRes = await env.DB.prepare(
    'SELECT role, content FROM sprint_intake_chat WHERE intake_id=? ORDER BY created_at DESC LIMIT 20'
  ).bind(intake_id).all();
  const history = historyRes.results.reverse();

  // Save user message
  await env.DB.prepare(
    'INSERT INTO sprint_intake_chat (id, intake_id, role, content) VALUES (?, ?, ?, ?)'
  ).bind(genId('chat'), intake_id, 'user', message).run();

  const systemContext = `You are helping refine a project structure extracted from a proposal. Current extraction:\n${intake.extracted_json}\n\nWhen you modify the structure, include the full updated JSON in a markdown code block:\n\`\`\`json\n{"client_name": "...", "jobs": [...]}\n\`\`\`\n\nBe concise and helpful.`;

  const messages = [
    { role: 'user', content: systemContext },
    { role: 'assistant', content: 'Understood. I\'ll help refine the extraction.' },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  let reply;
  try {
    reply = await callClaude(env, messages, 'claude-sonnet-4-6');
  } catch (err) {
    return json({ error: `Claude error: ${err.message}` }, 500);
  }

  await env.DB.prepare(
    'INSERT INTO sprint_intake_chat (id, intake_id, role, content) VALUES (?, ?, ?, ?)'
  ).bind(genId('chat'), intake_id, 'assistant', reply).run();

  // Extract updated JSON if Claude included one
  let updatedExtracted = null;
  const jsonBlock = reply.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock[1]);
      if (validateExtraction(parsed)) {
        updatedExtracted = parsed;
        await env.DB.prepare(
          'UPDATE sprint_intake SET extracted_json=? WHERE id=?'
        ).bind(JSON.stringify(parsed), intake_id).run();
      }
    } catch { /* ignore */ }
  }

  return json({ reply, updated_extraction: updatedExtracted });
}

async function handleIntakeConfirm(request, env, intakeId) {
  const body = await request.json().catch(() => ({}));
  const { client_id, create_client_name } = body;

  const intake = await env.DB.prepare(
    'SELECT * FROM sprint_intake WHERE id=?'
  ).bind(intakeId).first();
  if (!intake) return json({ error: 'Not found' }, 404);

  let targetClientId = client_id;
  if (!targetClientId && create_client_name) {
    const cname = create_client_name.trim();
    const exists = await env.DB.prepare(
      'SELECT id FROM sprint_clients WHERE name=? AND archived=0'
    ).bind(cname).first();
    if (exists) {
      targetClientId = exists.id;
    } else {
      targetClientId = genId('client');
      await env.DB.prepare(
        `INSERT INTO sprint_clients (id, name, status, archived) VALUES (?, ?, 'Active', 0)`
      ).bind(targetClientId, cname).run();
    }
  }
  if (!targetClientId) return json({ error: 'client_id or create_client_name required' }, 400);

  let extracted;
  try { extracted = JSON.parse(intake.extracted_json); } catch { extracted = { jobs: [] }; }
  if (!validateExtraction(extracted)) return json({ error: 'Invalid extraction — refine before confirming' }, 400);

  const ops = [];
  for (const job of extracted.jobs) {
    const jobId = genId('job');
    ops.push(env.DB.prepare(
      `INSERT INTO sprint_jobs (id, client_id, name, status) VALUES (?, ?, ?, 'Active')`
    ).bind(jobId, targetClientId, job.name));
    for (const task of (job.tasks || [])) {
      ops.push(env.DB.prepare(
        `INSERT INTO sprint_tasks (id, job_id, client_id, notes, status) VALUES (?, ?, ?, ?, 'Not Started')`
      ).bind(genId('task'), jobId, targetClientId, task.name || task.notes || ''));
    }
  }
  ops.push(env.DB.prepare(
    `UPDATE sprint_intake SET status='confirmed' WHERE id=?`
  ).bind(intakeId));

  await env.DB.batch(ops);
  return json({ success: true, client_id: targetClientId, jobs_created: extracted.jobs.length });
}

async function handleIntakeDismiss(request, env, intakeId) {
  await env.DB.prepare(
    `UPDATE sprint_intake SET status='dismissed' WHERE id=?`
  ).bind(intakeId).run();
  return json({ success: true });
}

// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const result = await runGmailPoll(env);
        if (result.error) {
          await env.DB.prepare(
            'UPDATE sprint_gmail_tokens SET cron_last_error=? WHERE id=?'
          ).bind(result.error, 'main').run().catch(() => {});
        }
      } catch (err) {
        await env.DB.prepare(
          'UPDATE sprint_gmail_tokens SET cron_last_error=? WHERE id=?'
        ).bind(err.message, 'main').run().catch(() => {});
      }
    })());
  },

  async fetch(request, env) {
    if (!env.APP_PASSWORD) {
      return new Response('APP_PASSWORD not configured. Run: wrangler secret put APP_PASSWORD', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    try {
      if (path.startsWith('/api/')) {
        // Find matching route
        for (const route of ROUTES) {
          if (route.method !== request.method) continue;
          const m = path.match(route.re);
          if (!m) continue;
          // Auth check
          if (!route.public) {
            const authed = await authMiddleware(request, env);
            if (!authed) return json({ error: 'Unauthorized' }, 401);
          }
          return await route.handler(request, env, m);
        }
        return json({ error: 'Not found' }, 404);
      }

      // Serve HTML — auth check: redirect to login if not authed
      const authed = await authMiddleware(request, env);
      return new Response(getHTML(authed), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// ── HTML ──────────────────────────────────────────────────────────────────────

function getHTML(authed) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EngageEngine Sprint Tracker</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0a0f;--surface:#12121a;--surface2:#1a1a26;--border:#2a2a3a;--text:#e8e8f0;--text-dim:#8888a0;--accent:#4f8cff;--accent-glow:rgba(79,140,255,0.15);--green:#34d399;--green-bg:rgba(52,211,153,0.1);--amber:#fbbf24;--amber-bg:rgba(251,191,36,0.1);--red:#f87171;--red-bg:rgba(248,113,113,0.1);--snackbar-bg:#1e1e2e}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"DM Sans",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased}
/* ── Login ── */
.login-bg{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)}
.login-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:40px 36px;width:360px;max-width:90vw}
.login-card h1{font-size:22px;font-weight:700;margin-bottom:6px}.login-card h1 span{color:var(--accent)}
.login-card .sub{font-size:13px;color:var(--text-dim);margin-bottom:28px}
.login-field{margin-bottom:16px}
.login-field label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px}
.login-field input{width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:8px;font-family:"DM Sans",sans-serif;font-size:14px;outline:none}
.login-field input:focus{border-color:var(--accent)}
.login-btn{width:100%;background:var(--accent);color:#fff;border:none;padding:11px;border-radius:8px;font-family:"DM Sans",sans-serif;font-weight:700;font-size:14px;cursor:pointer;margin-top:4px}
.login-btn:hover{opacity:0.9}
.login-error{color:var(--red);font-size:13px;margin-top:10px;min-height:18px}
/* ── App layout ── */
.header{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--bg);z-index:100}
.header-left{display:flex;align-items:center;gap:16px}
.header h1{font-size:17px;font-weight:700;letter-spacing:-0.5px}.header h1 span{color:var(--accent)}
.mode-tabs{display:flex;gap:4px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:3px}
.mode-tab{padding:5px 14px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:none;color:var(--text-dim);transition:all 0.15s}
.mode-tab.active{background:var(--accent);color:#fff}
.header-right{display:flex;align-items:center;gap:16px}
.header-stats{display:flex;gap:16px;font-size:13px;color:var(--text-dim);font-family:"JetBrains Mono",monospace}
.header-stats .sv{color:var(--text);font-weight:500}
.nav-back{display:none;align-items:center;gap:8px;color:var(--accent);cursor:pointer;font-size:13px;font-weight:500;padding:6px 0}
.nav-back:hover{text-decoration:underline}
.container{max-width:1200px;margin:0 auto;padding:24px}
/* ── Briefing banner ── */
.briefing-banner{border-left:3px solid var(--amber);background:var(--amber-bg);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;font-size:14px}
.briefing-clear{border-left:3px solid var(--green);background:var(--green-bg);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;font-size:14px;color:var(--green)}
.briefing-dismiss{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:18px;line-height:1;padding:0 4px}
.briefing-dismiss:hover{color:var(--text)}
/* ── Stats ── */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px 18px}
.stat-card .label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px}
.stat-card .value{font-size:28px;font-weight:700;font-family:"JetBrains Mono",monospace}
.stat-card .value.green{color:var(--green)}.stat-card .value.amber{color:var(--amber)}.stat-card .value.accent{color:var(--accent)}
.section-title{font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:12px;padding-left:2px}
/* ── Team ── */
.team-section-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.team-section-header .section-title{margin-bottom:0}
.gear-btn{background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:16px;padding:2px 6px;border-radius:4px;transition:all 0.15s}
.gear-btn:hover{color:var(--accent);background:var(--accent-glow)}
.team-row{display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.team-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 20px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:12px}
.team-card:hover{border-color:var(--accent);background:var(--accent-glow)}
.team-avatar{width:36px;height:36px;border-radius:50%;background:var(--accent-glow);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:var(--accent)}
.team-name{font-weight:600;font-size:14px}.team-tasks{font-size:12px;color:var(--text-dim);font-family:"JetBrains Mono",monospace}
.gear-panel{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px;display:none}
.gear-panel.show{display:block}
.gear-panel-title{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:12px}
.gear-member-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)}
.gear-member-row:last-child{border-bottom:none}
.gear-member-name{font-size:14px;font-weight:500}
.remove-btn{background:none;border:1px solid var(--border);color:var(--text-dim);padding:3px 10px;border-radius:4px;cursor:pointer;font-size:12px;transition:all 0.15s}
.remove-btn:hover{border-color:var(--red);color:var(--red)}
.gear-add-form{display:flex;gap:8px;margin-top:12px}
.gear-add-form input{flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:6px;font-family:"DM Sans",sans-serif;font-size:13px;outline:none}
.gear-add-form input:focus{border-color:var(--accent)}
.gear-add-form button{background:var(--accent);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;font-family:"DM Sans",sans-serif}
/* ── Client grid ── */
.clients-section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.add-client-btn{background:none;border:1px solid var(--border);color:var(--text-dim);padding:5px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-family:"DM Sans",sans-serif;transition:all 0.15s}
.add-client-btn:hover{border-color:var(--accent);color:var(--accent)}
.add-client-form{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:16px;display:none}
.add-client-form.show{display:flex;gap:8px;align-items:center}
.add-client-form input{flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:6px;font-family:"DM Sans",sans-serif;font-size:14px;outline:none}
.add-client-form input:focus{border-color:var(--accent)}
.add-client-form button{background:var(--accent);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;font-family:"DM Sans",sans-serif}
.add-client-form .cancel-btn{background:none;border:1px solid var(--border);color:var(--text-dim)}
.add-client-error{color:var(--red);font-size:12px;margin-top:6px}
.client-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:10px;margin-bottom:32px}
.client-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px 18px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:space-between}
.client-card:hover{border-color:var(--accent);background:var(--accent-glow)}
.client-card.health-red{border-left:3px solid var(--red)}
.client-card.health-amber{border-left:3px solid var(--amber)}
.client-card.health-green{border-left:3px solid var(--green)}
.client-name{font-weight:600;font-size:15px}
.client-meta{display:flex;gap:14px;font-size:12px;font-family:"JetBrains Mono",monospace;color:var(--text-dim)}
.client-meta .jobs{color:var(--accent)}.client-meta .open{color:var(--amber)}.client-meta .done{color:var(--green)}
/* ── Client detail ── */
.detail-header{margin-bottom:20px;display:flex;align-items:flex-start;justify-content:space-between}
.detail-header h2{font-size:22px;font-weight:700;margin-bottom:4px}
.detail-header .sub{color:var(--text-dim);font-size:14px}
.detail-header-actions{display:flex;gap:8px;align-items:center;flex-shrink:0;margin-left:16px}
.edit-btn,.archive-btn{background:none;border:1px solid var(--border);color:var(--text-dim);padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:"DM Sans",sans-serif;transition:all 0.15s}
.edit-btn:hover{border-color:var(--accent);color:var(--accent)}
.archive-btn:hover{border-color:var(--red);color:var(--red)}
/* ── Client notes ── */
.client-notes-wrap{margin-bottom:20px}
.client-notes{min-height:40px;padding:10px 14px;border-radius:8px;font-family:"DM Sans",sans-serif;font-size:14px;color:var(--text-dim);line-height:1.6;outline:none;border:1px solid transparent;transition:all 0.2s;cursor:text;white-space:pre-wrap}
.client-notes:hover{border-color:var(--border)}
.client-notes:focus{border-color:var(--accent);color:var(--text);background:var(--surface2)}
.notes-saved{font-size:11px;color:var(--green);margin-top:4px;opacity:0;transition:opacity 0.3s}
.notes-saved.show{opacity:1}
.notes-error{font-size:11px;color:var(--red);margin-top:4px;opacity:0;transition:opacity 0.3s}
.notes-error.show{opacity:1}
/* ── Jobs ── */
.job-section{margin-bottom:24px}
.job-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:8px 8px 0 0}
.job-header.collapsed{border-radius:8px}
.job-title{font-weight:600;font-size:14px;cursor:pointer;flex:1}
.job-badge{font-size:11px;padding:2px 8px;border-radius:4px;font-family:"JetBrains Mono",monospace}
.job-badge.active{background:var(--green-bg);color:var(--green)}.job-badge.complete{background:var(--surface2);color:var(--text-dim)}
.job-actions{display:flex;gap:6px;align-items:center;margin-left:8px}
.job-complete-btn{font-size:11px;padding:3px 10px;border-radius:4px;border:1px solid var(--border);background:none;color:var(--text-dim);cursor:pointer;font-family:"JetBrains Mono",monospace;transition:all 0.15s}
.job-complete-btn:hover{border-color:var(--green);color:var(--green);background:var(--green-bg)}
.job-complete-btn.reopen:hover{border-color:var(--amber);color:var(--amber);background:var(--amber-bg)}
/* ── Tasks ── */
.task-list{border:1px solid var(--border);border-top:none;border-radius:0 0 8px 8px;overflow:hidden}
.task-item{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);font-size:14px;transition:background 0.1s;position:relative}
.task-item:last-child{border-bottom:none}.task-item:hover{background:var(--surface2)}
.task-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--border);cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;role:checkbox;tabindex:0}
.task-check:hover{border-color:var(--green);background:var(--green-bg)}
.task-check.done{border-color:var(--green);background:var(--green)}
.task-check.done::after{content:"✓";color:var(--bg);font-size:11px;font-weight:700}
.task-notes{flex:1;cursor:pointer}.task-notes.completed{text-decoration:line-through;color:var(--text-dim)}
.task-assignee{font-size:11px;padding:2px 8px;background:var(--surface2);border-radius:4px;color:var(--text-dim);font-family:"JetBrains Mono",monospace}
.task-due{font-size:11px;font-family:"JetBrains Mono",monospace;color:var(--text-dim)}
.task-due.overdue{color:var(--red)}.task-due.soon{color:var(--amber)}
.task-edit-btn{opacity:0;background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:14px;padding:2px 6px;transition:all 0.15s;flex-shrink:0}
.task-item:hover .task-edit-btn{opacity:1}
.task-edit-btn:hover{color:var(--accent)}
.task-delete-btn{opacity:0;background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:14px;padding:2px 6px;transition:all 0.15s;flex-shrink:0}
.task-item:hover .task-delete-btn{opacity:1}
.task-delete-btn:hover{color:var(--red)}
/* ── Task edit row ── */
.task-edit-row{display:flex;flex-wrap:wrap;gap:8px;padding:10px 16px;background:var(--surface2);border-bottom:1px solid var(--border);align-items:center}
.task-edit-row input,.task-edit-row select{background:var(--surface);border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:6px;font-family:"DM Sans",sans-serif;font-size:13px;outline:none}
.task-edit-row input:focus,.task-edit-row select:focus{border-color:var(--accent)}
.task-edit-notes{flex:1;min-width:180px}
.task-edit-row .save-btn{background:var(--accent);color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:"DM Sans",sans-serif;font-weight:600;font-size:13px}
.task-edit-row .cancel-edit-btn{background:none;border:1px solid var(--border);color:var(--text-dim);padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px}
/* ── Add forms ── */
.add-btn{background:none;border:1px dashed var(--border);color:var(--text-dim);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-family:"DM Sans",sans-serif;transition:all 0.15s;margin-top:8px}
.add-btn:hover{border-color:var(--accent);color:var(--accent)}
.inline-form{display:none;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap}
.inline-form.show{display:flex}
.inline-form input,.inline-form select{background:var(--surface);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:6px;font-family:"DM Sans",sans-serif;font-size:13px;outline:none}
.inline-form input:focus,.inline-form select:focus{border-color:var(--accent)}
.inline-form input{flex:1}
.inline-form button{background:var(--accent);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-family:"DM Sans",sans-serif;font-weight:600;font-size:13px}
/* ── Template pills ── */
.template-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.template-pill{background:none;border:1px solid var(--border);color:var(--text-dim);padding:4px 12px;border-radius:20px;cursor:pointer;font-size:12px;font-family:"DM Sans",sans-serif;transition:all 0.15s}
.template-pill:hover,.template-pill.selected{border-color:var(--accent);color:var(--accent);background:var(--accent-glow)}
.template-hint{font-size:12px;color:var(--text-dim);margin-bottom:6px}
/* ── Snackbar ── */
.snackbar{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--snackbar-bg);border:1px solid var(--border);border-radius:10px;padding:12px 20px;display:flex;align-items:center;gap:14px;z-index:200;font-size:14px;opacity:0;transition:opacity 0.25s;pointer-events:none;width:280px}
.snackbar.show{opacity:1;pointer-events:auto}
.snackbar-undo{background:none;border:none;color:var(--accent);cursor:pointer;font-size:13px;font-weight:600;padding:0;flex-shrink:0}
/* ── Sprint ── */
.sprint-client-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;align-items:center}
.sprint-client-btn{background:var(--surface);border:1px solid var(--border);color:var(--text-dim);padding:6px 16px;border-radius:20px;cursor:pointer;font-size:13px;font-family:"DM Sans",sans-serif;transition:all 0.15s}
.sprint-client-btn:hover{border-color:var(--accent);color:var(--accent)}
.sprint-client-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
.sprint-activate-btn{background:none;border:1px dashed var(--border);color:var(--text-dim);padding:6px 14px;border-radius:20px;cursor:pointer;font-size:12px;font-family:"DM Sans",sans-serif;transition:all 0.15s}
.sprint-activate-btn:hover{border-color:var(--accent);color:var(--accent)}
.sprint-progress-wrap{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin-bottom:20px}
.sprint-progress-header{display:flex;align-items:baseline;gap:12px;margin-bottom:10px}
.sprint-progress-header .pct{font-size:32px;font-weight:700;font-family:"JetBrains Mono",monospace;color:var(--accent)}
.sprint-progress-header .counts{font-size:13px;color:var(--text-dim)}
.sprint-progress-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.sprint-progress-fill{height:100%;background:var(--accent);border-radius:3px;transition:width 0.4s ease}
.phase-nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.phase-btn{background:var(--surface);border:1px solid var(--border);color:var(--text-dim);padding:10px 16px;border-radius:10px;cursor:pointer;font-family:"DM Sans",sans-serif;text-align:left;transition:all 0.15s;min-width:130px}
.phase-btn:hover{border-color:var(--accent)}
.phase-btn.active{border-color:var(--accent);background:var(--accent-glow)}
.phase-name{display:block;font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px}
.phase-sub{display:block;font-size:11px;color:var(--text-dim);margin-bottom:4px}
.phase-pct{display:block;font-size:11px;font-family:"JetBrains Mono",monospace;color:var(--accent)}
.sprint-section{margin-bottom:16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden}
.sprint-section-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;cursor:pointer;font-weight:600;font-size:14px;user-select:none}
.sprint-section-header:hover{background:var(--surface2)}
.sprint-section-count{font-size:12px;font-family:"JetBrains Mono",monospace;color:var(--text-dim)}
.sprint-section-count .done-count{color:var(--green);font-weight:600}
.sprint-section-items{border-top:1px solid var(--border)}
.checklist-item{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.1s}
.checklist-item:last-child{border-bottom:none}.checklist-item:hover{background:var(--surface2)}
.checklist-circle{width:18px;height:18px;border-radius:50%;border:2px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
.checklist-circle.done{border-color:var(--green);background:var(--green)}
.checklist-circle.done::after{content:"✓";color:var(--bg);font-size:10px;font-weight:700}
.checklist-label{flex:1;font-size:14px}.checklist-label.done{text-decoration:line-through;color:var(--text-dim)}
.checklist-badge{font-size:10px;padding:1px 6px;border-radius:3px}
.checklist-badge.critical{background:var(--red-bg);color:var(--red)}
.checklist-by{font-size:11px;color:var(--text-dim);font-family:"JetBrains Mono",monospace}
/* ── Sprint Activate Modal ── */
.activate-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:300;display:flex;align-items:center;justify-content:center}
.activate-modal{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px 32px;width:340px;max-width:90vw}
.activate-modal h3{font-size:18px;font-weight:700;margin-bottom:20px}
.activate-modal label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px;margin-top:14px}
.activate-modal select,.activate-modal input{width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:9px 12px;border-radius:7px;font-family:"DM Sans",sans-serif;font-size:14px;outline:none}
.activate-modal select:focus,.activate-modal input:focus{border-color:var(--accent)}
.activate-modal-actions{display:flex;gap:10px;margin-top:24px}
.activate-modal-actions .cancel-btn{flex:1;background:none;border:1px solid var(--border);color:var(--text-dim);padding:9px;border-radius:7px;cursor:pointer;font-family:"DM Sans",sans-serif}
.activate-modal-actions .confirm-btn{flex:1;background:var(--accent);color:#fff;border:none;padding:9px;border-radius:7px;cursor:pointer;font-family:"DM Sans",sans-serif;font-weight:600}
/* ── Loading / misc ── */
.loading{text-align:center;padding:60px;color:var(--text-dim);font-size:14px}
.hidden{display:none!important}
@media(max-width:768px){
  .stats-row{grid-template-columns:repeat(2,1fr)}
  .client-grid{grid-template-columns:1fr}
  .header-stats{display:none}
  .container{padding:16px}
  .team-row{flex-direction:column}
  .phase-nav{flex-direction:column}
  .snackbar{width:90vw}
  .task-edit-row{flex-direction:column}
  .task-edit-notes{width:100%}
}
/* ── Intake section ── */
.intake-section{margin-bottom:28px}
.intake-section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.intake-badge{background:var(--amber-bg);color:var(--amber);font-size:11px;padding:2px 8px;border-radius:10px;font-family:"JetBrains Mono",monospace;margin-left:8px;font-weight:700}
.intake-list{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
.intake-item{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;transition:border-color 0.15s}
.intake-item:hover{border-color:var(--accent)}
.intake-item-icon{font-size:18px;flex-shrink:0;width:28px;text-align:center}
.intake-item-body{flex:1;min-width:0}
.intake-item-subject{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.intake-item-meta{font-size:12px;color:var(--text-dim);margin-top:2px;display:flex;gap:12px;font-family:"JetBrains Mono",monospace}
.intake-item-client{color:var(--accent)}
.intake-item-actions{display:flex;gap:6px;flex-shrink:0}
.intake-confirm-btn{background:var(--green-bg);color:var(--green);border:1px solid var(--green);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-family:"DM Sans",sans-serif;font-weight:600;transition:all 0.15s}
.intake-confirm-btn:hover{background:var(--green);color:var(--bg)}
.intake-review-btn{background:var(--accent-glow);color:var(--accent);border:1px solid var(--accent);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-family:"DM Sans",sans-serif;font-weight:600;transition:all 0.15s}
.intake-review-btn:hover{background:var(--accent);color:#fff}
.intake-dismiss-btn{background:none;border:1px solid var(--border);color:var(--text-dim);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-family:"DM Sans",sans-serif;transition:all 0.15s}
.intake-dismiss-btn:hover{border-color:var(--red);color:var(--red)}
.intake-upload-row{display:flex;align-items:center;gap:10px;margin-top:6px}
.intake-upload-btn{background:none;border:1px dashed var(--border);color:var(--text-dim);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-family:"DM Sans",sans-serif;transition:all 0.15s}
.intake-upload-btn:hover{border-color:var(--accent);color:var(--accent)}
/* ── Intake confirm modal ── */
.intake-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:200;display:flex;align-items:center;justify-content:center}
.intake-modal{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:26px 28px;width:460px;max-width:92vw}
.intake-modal h3{font-size:17px;font-weight:700;margin-bottom:6px}
.intake-modal .sub{font-size:13px;color:var(--text-dim);margin-bottom:16px}
.intake-job-preview{background:var(--surface2);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:13px;max-height:150px;overflow-y:auto;line-height:1.5}
.intake-job-preview .ijob{font-weight:600;color:var(--accent);margin-top:6px}
.intake-job-preview .ijob:first-child{margin-top:0}
.intake-job-preview .itask{padding-left:14px;color:var(--text-dim)}
.intake-modal select,.intake-modal input{width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:9px 12px;border-radius:8px;font-family:"DM Sans",sans-serif;font-size:13px;outline:none;margin-bottom:8px}
.intake-modal select:focus,.intake-modal input:focus{border-color:var(--accent)}
.intake-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
.intake-modal-actions button{padding:8px 18px;border-radius:8px;cursor:pointer;font-family:"DM Sans",sans-serif;font-weight:600;font-size:13px}
.intake-modal-actions .confirm-btn{background:var(--accent);color:#fff;border:none}
.intake-modal-actions .confirm-btn:hover{opacity:0.9}
.intake-modal-actions .cancel-btn{background:none;border:1px solid var(--border);color:var(--text-dim)}
/* ── Gmail settings ── */
.gmail-settings{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-top:8px}
.gmail-settings-title{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:10px}
.gmail-status-row{display:flex;align-items:center;gap:10px}
.gmail-dot{width:8px;height:8px;border-radius:50%;background:var(--red);flex-shrink:0;transition:background 0.2s}
.gmail-dot.connected{background:var(--green)}
.gmail-status-text{font-size:13px;flex:1}
.gmail-connect-btn{background:none;border:1px solid var(--accent);color:var(--accent);padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:"DM Sans",sans-serif;transition:all 0.15s;flex-shrink:0}
.gmail-connect-btn:hover{background:var(--accent);color:#fff}
.gmail-last-checked{font-size:11px;color:var(--text-dim);font-family:"JetBrains Mono",monospace;margin-top:6px}
.gmail-error-msg{font-size:11px;color:var(--red);margin-top:4px}
/* ── Intake proposal split-panel page ── */
.intake-split{display:grid;grid-template-columns:1fr 360px;height:calc(100vh - 90px);overflow:hidden;margin:-24px;border-top:1px solid var(--border)}
.intake-preview-panel{padding:24px;overflow-y:auto;border-right:1px solid var(--border)}
.intake-preview-panel h2{font-size:18px;font-weight:700;margin-bottom:4px}
.intake-preview-panel .intake-file-meta{font-size:13px;color:var(--text-dim);margin-bottom:20px}
.intake-client-row{display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
.intake-client-row select,.intake-client-row input{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:7px 10px;border-radius:6px;font-family:"DM Sans",sans-serif;font-size:13px;outline:none;flex:1;min-width:120px}
.intake-client-row select:focus,.intake-client-row input:focus{border-color:var(--accent)}
.add-to-client-btn{background:var(--green);color:var(--bg);border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-family:"DM Sans",sans-serif;font-weight:700;font-size:13px;white-space:nowrap;transition:opacity 0.15s}
.add-to-client-btn:hover{opacity:0.85}
.intake-jobs-list{display:flex;flex-direction:column;gap:10px}
.intake-job-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 14px}
.intake-job-card .ijob-name{font-weight:600;font-size:14px;color:var(--accent);margin-bottom:6px}
.intake-job-card .itask-sm{font-size:13px;color:var(--text-dim);padding:3px 0;border-bottom:1px solid var(--border);line-height:1.4}
.intake-job-card .itask-sm:last-child{border-bottom:none}
.intake-chat-panel{display:flex;flex-direction:column;background:var(--surface2)}
.intake-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
.chat-msg{max-width:88%;padding:9px 13px;border-radius:10px;font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
.chat-msg.user{align-self:flex-end;background:var(--accent);color:#fff;border-radius:10px 10px 2px 10px}
.chat-msg.assistant{align-self:flex-start;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:10px 10px 10px 2px}
.intake-chat-form{padding:12px 14px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end}
.intake-chat-form textarea{flex:1;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:"DM Sans",sans-serif;font-size:13px;outline:none;resize:none;min-height:38px;max-height:100px;line-height:1.4}
.intake-chat-form textarea:focus{border-color:var(--accent)}
.intake-chat-send{background:var(--accent);color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:16px;font-weight:700;transition:opacity 0.15s;flex-shrink:0}
.intake-chat-send:hover{opacity:0.85}
.intake-chat-send:disabled{opacity:0.4;cursor:default}
.intake-empty{color:var(--text-dim);font-size:13px;padding:8px 0}
@media(max-width:768px){
  .intake-split{grid-template-columns:1fr;height:auto;margin:-16px}
  .intake-preview-panel{border-right:none;border-bottom:1px solid var(--border)}
  .intake-chat-panel{height:50vh}
  .intake-item-actions{flex-direction:column}
}
</style>
</head>
<body>

<!-- ── Login screen (shown when not authed) ── -->
<div id="loginScreen" class="${authed ? 'hidden' : ''}">
<div class="login-bg">
<div class="login-card">
  <h1>Engage<span>Engine</span> Sprint</h1>
  <div class="sub">Agency ops command center</div>
  <div class="login-field">
    <label for="pwInput">Password</label>
    <input type="password" id="pwInput" autocomplete="current-password" placeholder="Enter password..." onkeydown="if(event.key==='Enter')doLogin()">
  </div>
  <button class="login-btn" onclick="doLogin()">Enter &rarr;</button>
  <div class="login-error" id="loginError"></div>
</div>
</div>
</div>

<!-- ── App (shown when authed) ── -->
<div id="appShell" class="${authed ? '' : 'hidden'}">

<div class="header">
  <div class="header-left">
    <div class="nav-back" id="navBack" data-action="nav-back">&#8592; Back</div>
    <h1>Engage<span>Engine</span> Sprint</h1>
    <div class="mode-tabs">
      <button class="mode-tab active" id="modeJobBtn" data-action="mode-jobs">Jobs</button>
      <button class="mode-tab" id="modeSprintBtn" data-action="mode-sprint">30-Day Sprint</button>
    </div>
  </div>
  <div class="header-right">
    <div class="header-stats" id="headerStats"></div>
  </div>
</div>

<div class="container">

<!-- Jobs mode -->
<div id="jobsMode">
  <div id="briefingBanner"></div>
  <div id="dashboard">
    <div class="stats-row" id="statsRow"></div>
    <div id="intakeSection" class="intake-section hidden"></div>
    <div class="team-section-header">
      <div class="section-title" style="margin-bottom:0">Team</div>
      <button class="gear-btn" id="gearBtn" onclick="toggleGearPanel()" title="Manage team">&#9881;</button>
    </div>
    <div class="team-row" id="teamRow"></div>
    <div class="gear-panel" id="gearPanel">
      <div class="gear-panel-title">Manage Team</div>
      <div id="gearMemberList"></div>
      <div class="gear-add-form">
        <input type="text" id="newMemberName" placeholder="Member name..." onkeydown="if(event.key==='Enter')addTeamMember()">
        <button onclick="addTeamMember()">Add</button>
      </div>
    </div>
    <div class="clients-section-header">
      <div class="section-title" style="margin-bottom:0">Clients</div>
      <button class="add-client-btn" onclick="toggleAddClientForm()">+ Add Client</button>
    </div>
    <div class="add-client-form" id="addClientForm">
      <input type="text" id="newClientName" placeholder="Client name..." onkeydown="if(event.key==='Enter')addClient()">
      <button onclick="addClient()">Add</button>
      <button class="cancel-btn" onclick="toggleAddClientForm()">Cancel</button>
    </div>
    <div class="add-client-error hidden" id="addClientError"></div>
    <div class="client-grid" id="clientGrid"></div>
  </div>
  <div id="detail" class="hidden"></div>
  <div id="teamDetail" class="hidden"></div>
  <div id="intakeDetail" class="hidden"></div>
</div>

<!-- Sprint mode -->
<div id="sprintMode" class="hidden">
  <div class="sprint-client-bar" id="sprintClientBar"></div>
  <div id="sprintContent"><div class="loading">Select a client to view their sprint checklist.</div></div>
</div>

</div><!-- /container -->
</div><!-- /appShell -->

<!-- Hidden file input for proposal upload -->
<input type="file" id="proposalFileInput" accept=".pdf,.txt,.doc,.docx" style="display:none" onchange="handleProposalFile(this.files[0])">

<!-- Snackbar -->
<div class="snackbar" id="snackbar" role="status" aria-live="polite">
  <span id="snackbarMsg">Task deleted</span>
  <button class="snackbar-undo" onclick="undoDelete()">Undo</button>
</div>

<script>
var API = '';
var dashboardData = null;
var currentClientId = null;
var currentTeamName = null;
var currentMode = 'jobs';
var teamMembers = [];

// Snackbar / optimistic delete state
var deleteTimer = null;
var deletePendingId = null;
var deletePendingEl = null;
var deletePendingJobId = null;

// Sprint state
var sprintClientId = null;
var sprintItems = {};
var sprintPhase = 'preSprint';

// Intake state
var currentIntakeId = null;
var intakeConfirmData = null;

// ── Utilities ──────────────────────────────────────────────────────────────

function esc(s){if(!s)return'';return String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;')}
function formatDate(d){if(!d)return'';var p=d.split('-');return p[1]+'/'+p[2]}
function daysDiff(a,b){return Math.ceil((new Date(b)-new Date(a))/86400000)}

// ── Login ──────────────────────────────────────────────────────────────────

async function doLogin() {
  var pw = document.getElementById('pwInput').value;
  var err = document.getElementById('loginError');
  err.textContent = '';
  var res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pw })
  });
  if (res.ok) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    loadDashboard();
  } else {
    err.textContent = 'Incorrect password';
  }
}

// ── Event delegation ───────────────────────────────────────────────────────

document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-action]');
  if (!el) return;
  var act = el.getAttribute('data-action');
  var id = el.getAttribute('data-id') || '';
  var val = el.getAttribute('data-val') || '';
  if (act === 'mode-jobs') { switchMode('jobs'); }
  else if (act === 'mode-sprint') { switchMode('sprint'); }
  else if (act === 'nav-back') { showDashboard(); }
  else if (act === 'load-client') { loadClient(id); }
  else if (act === 'load-team') { loadTeam(val); }
  else if (act === 'toggle-tasks') { el.classList.toggle('collapsed'); var tl = el.nextElementSibling; if (tl) tl.classList.toggle('hidden'); }
  else if (act === 'task-toggle') { toggleTask(id, val === '1', currentClientId, currentTeamName); }
  else if (act === 'task-edit') { openTaskEdit(id); }
  else if (act === 'task-save') { saveTaskEdit(id, val); }
  else if (act === 'task-cancel-edit') { cancelTaskEdit(id); }
  else if (act === 'task-delete') { deleteTask(id, val); }
  else if (act === 'job-complete') { completeJob(id, currentClientId); }
  else if (act === 'job-reopen') { reopenJob(id, currentClientId); }
  else if (act === 'toggle-add-job') { toggleAddJob(id); }
  else if (act === 'create-job') { createJob(id); }
  else if (act === 'toggle-add-task') { toggleAddTask(id); }
  else if (act === 'create-task') { createTask(id, val); }
  else if (act === 'client-rename') { renameClient(id); }
  else if (act === 'client-archive') { archiveClient(id, val); }
  else if (act === 'team-remove') { removeTeamMember(id); }
  else if (act === 'sprint-select-client') { loadSprintClient(id); }
  else if (act === 'sprint-phase') { sprintPhase = id; renderSprintChecklist(); }
  else if (act === 'sprint-toggle-item') { toggleSprintItem(id); }
  else if (act === 'sprint-toggle-section') { var items = el.parentElement.querySelector('.sprint-section-items'); if (items) items.classList.toggle('hidden'); }
  else if (act === 'sprint-activate') { showActivateModal(); }
  else if (act === 'sprint-activate-confirm') { activateSprintClient(); }
  else if (act === 'sprint-activate-cancel') { closeActivateModal(); }
  else if (act === 'dismiss-briefing') { document.getElementById('briefingBanner').innerHTML = ''; }
  else if (act === 'select-template') { selectTemplate(id, val, el.getAttribute('data-name') || '', parseInt(el.getAttribute('data-count') || '0')); }
  else if (act === 'intake-confirm') { showIntakeConfirmModal(id); }
  else if (act === 'intake-dismiss') { dismissIntakeItem(id); }
  else if (act === 'intake-review') { loadIntakeDetail(id); }
  else if (act === 'intake-modal-cancel') { closeIntakeModal(); }
  else if (act === 'intake-modal-confirm') { confirmIntakeFromModal(); }
  else if (act === 'gmail-connect') { window.location.href = '/api/gmail/auth'; }
  else if (act === 'intake-chat-send') { sendIntakeChat(); }
  else if (act === 'intake-add-to-client') { confirmIntakeProposal(id); }
  else if (act === 'upload-proposal') { document.getElementById('proposalFileInput').click(); }
});

// ── Mode switching ─────────────────────────────────────────────────────────

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('modeJobBtn').classList.toggle('active', mode === 'jobs');
  document.getElementById('modeSprintBtn').classList.toggle('active', mode === 'sprint');
  document.getElementById('jobsMode').classList.toggle('hidden', mode !== 'jobs');
  document.getElementById('sprintMode').classList.toggle('hidden', mode !== 'sprint');
  document.getElementById('navBack').style.display = 'none';
  if (mode === 'jobs') {
    document.getElementById('headerStats').style.display = '';
    if (dashboardData) renderDashboard(); else loadDashboard();
  } else {
    document.getElementById('headerStats').style.display = 'none';
    renderSprintClientBar();
  }
}

// ── Dashboard ──────────────────────────────────────────────────────────────

async function loadDashboard() {
  document.getElementById('clientGrid').innerHTML = '<div class="loading">Loading...</div>';
  var res = await fetch(API + '/api/dashboard');
  if (res.status === 401) { showLoginScreen(); return; }
  dashboardData = await res.json();
  // Load team members for dropdowns
  var tr = await fetch(API + '/api/team');
  if (tr.ok) teamMembers = await tr.json();
  renderDashboard();
  loadIntakeSection();
  // Handle Gmail OAuth return params
  var searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('gmail_connected')) {
    history.replaceState(null, '', '/');
    setTimeout(loadIntakeSection, 500);
  } else if (searchParams.get('gmail_error')) {
    history.replaceState(null, '', '/');
    alert('Gmail connection failed: ' + searchParams.get('gmail_error'));
  }
}

function renderDashboard() {
  var d = dashboardData;
  var clients = d.clients, stats = d.stats, team = d.team, briefing = d.briefing;
  // Briefing banner
  var bb = document.getElementById('briefingBanner');
  if (briefing && (briefing.overdue > 0 || briefing.due_today > 0)) {
    var parts = [];
    if (briefing.overdue > 0) parts.push('<strong>' + briefing.overdue + ' overdue</strong>');
    if (briefing.due_today > 0) parts.push('<strong>' + briefing.due_today + ' due today</strong>');
    bb.innerHTML = '<div class="briefing-banner"><span>&#9888; ' + parts.join(', ') + ' — check client cards below</span><button class="briefing-dismiss" data-action="dismiss-briefing" title="Dismiss">&times;</button></div>';
  } else if (briefing) {
    bb.innerHTML = '<div class="briefing-clear"><span>&#10003; All clear — no overdue or due-today tasks</span><button class="briefing-dismiss" data-action="dismiss-briefing" title="Dismiss">&times;</button></div>';
  }
  // Header stats
  document.getElementById('headerStats').innerHTML = '<div><span class="sv">' + stats.active_clients + '</span> clients</div><div><span class="sv">' + stats.active_jobs + '</span> jobs</div><div><span class="sv">' + stats.open_tasks + '</span> open</div>';
  // Stats row
  document.getElementById('statsRow').innerHTML =
    statCard('Active Clients', stats.active_clients, 'accent') +
    statCard('Active Jobs', stats.active_jobs, '') +
    statCard('Open Tasks', stats.open_tasks, 'amber') +
    statCard('Completed', stats.done_tasks, 'green');
  // Team row
  var teamHtml = '';
  for (var i = 0; i < team.length; i++) {
    var t = team[i];
    teamHtml += '<div class="team-card" data-action="load-team" data-val="' + encodeURIComponent(t.name) + '"><div class="team-avatar">' + t.name.charAt(0).toUpperCase() + '</div><div><div class="team-name">' + esc(t.name) + '</div><div class="team-tasks">' + t.assigned_tasks + ' tasks</div></div></div>';
  }
  document.getElementById('teamRow').innerHTML = teamHtml;
  // Gear panel member list
  var gml = document.getElementById('gearMemberList');
  if (gml) {
    var gmHtml = '';
    for (var i = 0; i < teamMembers.length; i++) {
      var m = teamMembers[i];
      gmHtml += '<div class="gear-member-row"><span class="gear-member-name">' + esc(m.name) + '</span><button class="remove-btn" data-action="team-remove" data-id="' + m.id + '">Remove</button></div>';
    }
    if (!teamMembers.length) gmHtml = '<div style="font-size:13px;color:var(--text-dim);padding:8px 0">No team members yet — add one below</div>';
    gml.innerHTML = gmHtml;
  }
  // Client grid with health scoring
  var active = clients.filter(function(c) { return c.active_jobs > 0 || c.open_tasks > 0 });
  var inactive = clients.filter(function(c) { return c.active_jobs === 0 && c.open_tasks === 0 });
  var grid = '';
  for (var i = 0; i < active.length; i++) grid += clientCard(active[i]);
  if (inactive.length) grid += '<div class="section-title" style="grid-column:1/-1;margin-top:16px">No Active Work</div>';
  for (var i = 0; i < inactive.length; i++) grid += clientCard(inactive[i]);
  document.getElementById('clientGrid').innerHTML = grid;
  // Show dashboard, hide detail
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('detail').classList.add('hidden');
  document.getElementById('teamDetail').classList.add('hidden');
  document.getElementById('navBack').style.display = 'none';
  currentClientId = null;
  currentTeamName = null;
}

function statCard(label, value, color) {
  return '<div class="stat-card"><div class="label">' + label + '</div><div class="value ' + color + '">' + value + '</div></div>';
}

function clientCard(c) {
  var health = '';
  if (c.overdue_tasks > 0) health = ' health-red';
  else if (c.soon_tasks > 0) health = ' health-amber';
  else if (c.active_jobs > 0) health = ' health-green';
  return '<div class="client-card' + health + '" data-action="load-client" data-id="' + c.id + '"><div class="client-name">' + esc(c.name) + '</div><div class="client-meta"><span class="jobs">' + c.active_jobs + ' jobs</span><span class="open">' + c.open_tasks + ' open</span><span class="done">' + c.done_tasks + ' done</span></div></div>';
}

// ── Client detail ──────────────────────────────────────────────────────────

async function loadClient(id) {
  currentClientId = id;
  currentTeamName = null;
  document.getElementById('detail').innerHTML = '<div class="loading">Loading...</div>';
  document.getElementById('detail').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('navBack').style.display = 'flex';
  var res = await fetch(API + '/api/clients/' + id);
  if (res.status === 401) { showLoginScreen(); return; }
  var data = await res.json();
  renderClientDetail(data);
}

function renderClientDetail(data) {
  var client = data.client, jobs = data.jobs, tasks = data.tasks;
  var today = new Date().toISOString().split('T')[0];
  var openCount = tasks.filter(function(t) { return t.status !== 'Complete' }).length;
  var html = '<div class="detail-header">';
  html += '<div><h2 id="clientNameDisplay">' + esc(client.name) + '</h2><div class="sub">' + jobs.length + ' jobs &middot; ' + openCount + ' open tasks</div></div>';
  html += '<div class="detail-header-actions">';
  html += '<button class="edit-btn" data-action="client-rename" data-id="' + client.id + '">&#9998; Rename</button>';
  html += '<button class="archive-btn" data-action="client-archive" data-id="' + client.id + '" data-val="' + client.active_jobs + '">Archive</button>';
  html += '</div></div>';
  // Client notes
  html += '<div class="client-notes-wrap">';
  html += '<div class="client-notes" id="clientNotes" contenteditable="true" aria-label="Client notes" data-client-id="' + client.id + '" data-placeholder="Add client context...">' + esc(client.notes || '') + '</div>';
  html += '<div class="notes-saved" id="notesSaved">Saved</div>';
  html += '<div class="notes-error" id="notesError">Save failed</div>';
  html += '</div>';
  // Active jobs
  var activeJobs = jobs.filter(function(j) { return j.status === 'Active'; });
  var completeJobs = jobs.filter(function(j) { return j.status === 'Complete'; });
  for (var i = 0; i < activeJobs.length; i++) {
    html += renderJobSection(activeJobs[i], tasks.filter(function(t) { return t.job_id === activeJobs[i].id; }), client.id, today, false);
  }
  // Add job with template pills
  html += renderAddJobForm(client.id);
  if (completeJobs.length) {
    html += '<div class="section-title" style="margin-top:24px">Completed Jobs</div>';
    for (var i = 0; i < completeJobs.length; i++) {
      html += renderJobSection(completeJobs[i], tasks.filter(function(t) { return t.job_id === completeJobs[i].id; }), client.id, today, true);
    }
  }
  document.getElementById('detail').innerHTML = html;
  // Wire up notes save on blur
  var notesEl = document.getElementById('clientNotes');
  if (notesEl) {
    // Show placeholder behavior
    if (!notesEl.textContent.trim()) notesEl.style.color = 'var(--text-dim)';
    notesEl.addEventListener('focus', function() { this.style.color = ''; });
    notesEl.addEventListener('blur', function() {
      saveClientNotes(client.id, this.textContent);
      if (!this.textContent.trim()) this.style.color = 'var(--text-dim)';
    });
    notesEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.blur(); }
    });
  }
  // Load templates for add job form
  loadTemplatesForForm(client.id);
}

function renderJobSection(job, tasks, clientId, today, collapsed) {
  var isActive = job.status === 'Active';
  var btnHtml = isActive
    ? '<button class="job-complete-btn" data-action="job-complete" data-id="' + job.id + '">Complete</button>'
    : '<button class="job-complete-btn reopen" data-action="job-reopen" data-id="' + job.id + '">Reopen</button>';
  var html = '<div class="job-section"><div class="job-header' + (collapsed ? ' collapsed' : '') + '">';
  html += '<div class="job-title" data-action="toggle-tasks">' + esc(job.name) + ' <span style="color:var(--text-dim);font-weight:400;font-size:12px">' + job.open_tasks + '/' + job.total_tasks + '</span></div>';
  html += '<div class="job-actions">' + btnHtml + '<span class="job-badge ' + (isActive ? 'active' : 'complete') + '">' + job.status + '</span></div>';
  html += '</div>';
  html += '<div class="task-list' + (collapsed ? ' hidden' : '') + '">';
  for (var i = 0; i < tasks.length; i++) {
    html += renderTaskItem(tasks[i], today);
  }
  html += '<div class="task-item" style="padding:6px 16px"><button class="add-btn" style="margin:0;padding:4px 12px;font-size:12px" data-action="toggle-add-task" data-id="' + job.id + '">+ task</button></div>';
  html += '<div id="addTaskForm-' + job.id + '" class="inline-form" style="padding:8px 16px">';
  html += '<input type="text" id="newTaskNotes-' + job.id + '" placeholder="Task description...">';
  html += '<select id="newTaskAssign-' + job.id + '"><option value="">Assign</option>' + teamOptions() + '</select>';
  html += '<input type="date" id="newTaskDue-' + job.id + '" style="width:140px">';
  html += '<button data-action="create-task" data-id="' + job.id + '" data-val="' + clientId + '">Add</button></div>';
  html += '</div></div>';
  return html;
}

function renderTaskItem(t, today) {
  var isDone = t.status === 'Complete';
  var dueClass = '';
  if (!isDone && t.due_date) { dueClass = t.due_date < today ? 'overdue' : (daysDiff(today, t.due_date) <= 3 ? 'soon' : ''); }
  var html = '<div class="task-item" id="task-row-' + t.id + '">';
  html += '<div class="task-check' + (isDone ? ' done' : '') + '" role="checkbox" aria-checked="' + (isDone ? 'true' : 'false') + '" tabindex="0" data-action="task-toggle" data-id="' + t.id + '" data-val="' + (isDone ? '0' : '1') + '"></div>';
  html += '<div class="task-notes' + (isDone ? ' completed' : '') + '">' + esc(t.notes || 'Untitled task') + '</div>';
  if (t.assigned_to) html += '<span class="task-assignee">' + esc(t.assigned_to) + '</span>';
  if (t.due_date) html += '<span class="task-due ' + dueClass + '">' + formatDate(t.due_date) + '</span>';
  if (!isDone) {
    html += '<button class="task-edit-btn" data-action="task-edit" data-id="' + t.id + '" title="Edit">&#9998;</button>';
    html += '<button class="task-delete-btn" data-action="task-delete" data-id="' + t.id + '" data-val="' + (t.job_id || '') + '" title="Delete">&times;</button>';
  }
  html += '</div>';
  return html;
}

function renderAddJobForm(clientId) {
  var html = '<button class="add-btn" data-action="toggle-add-job" data-id="' + clientId + '">+ Add Job</button>';
  html += '<div id="addJobForm-' + clientId + '" class="inline-form" style="flex-direction:column;align-items:stretch">';
  html += '<div id="templatePills-' + clientId + '" class="template-pills" style="display:none"></div>';
  html += '<div id="templateHint-' + clientId + '" class="template-hint" style="display:none"></div>';
  html += '<div style="display:flex;gap:8px;align-items:center">';
  html += '<input type="text" id="newJobName-' + clientId + '" placeholder="Job name..." style="flex:1">';
  html += '<input type="hidden" id="newJobTemplate-' + clientId + '" value="">';
  html += '<button data-action="create-job" data-id="' + clientId + '">Add</button></div>';
  html += '</div>';
  return html;
}

var _templates = [];

async function loadTemplatesForForm(clientId) {
  if (!_templates.length) {
    var res = await fetch(API + '/api/templates');
    if (res.ok) _templates = await res.json();
  }
  if (!_templates.length) return;
  var pillsEl = document.getElementById('templatePills-' + clientId);
  if (!pillsEl) return;
  var html = '';
  for (var i = 0; i < _templates.length; i++) {
    var t = _templates[i];
    html += '<button class="template-pill" data-action="select-template" data-id="' + clientId + '" data-val="' + t.id + '" data-name="' + esc(t.name) + '" data-count="' + t.tasks.length + '">' + esc(t.name) + '</button>';
  }
  pillsEl.innerHTML = html;
  pillsEl.style.display = 'flex';
}

function selectTemplate(clientId, templateId, templateName, taskCount) {
  document.getElementById('newJobTemplate-' + clientId).value = templateId;
  document.getElementById('newJobName-' + clientId).value = templateName;
  // Update pill selection
  var pills = document.querySelectorAll('#templatePills-' + clientId + ' .template-pill');
  for (var i = 0; i < pills.length; i++) {
    pills[i].classList.toggle('selected', pills[i].getAttribute('data-template-id') === templateId);
  }
  var hint = document.getElementById('templateHint-' + clientId);
  if (hint) { hint.textContent = taskCount + ' tasks will be added'; hint.style.display = 'block'; }
}

async function saveClientNotes(clientId, text) {
  var saved = document.getElementById('notesSaved');
  var errEl = document.getElementById('notesError');
  try {
    var res = await fetch(API + '/api/clients/' + clientId + '/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: text })
    });
    if (res.ok) {
      if (saved) { saved.classList.add('show'); setTimeout(function() { saved.classList.remove('show'); }, 2000); }
    } else { throw new Error('save failed'); }
  } catch (e) {
    if (errEl) { errEl.classList.add('show'); setTimeout(function() { errEl.classList.remove('show'); }, 3000); }
  }
}

// ── Task inline edit ───────────────────────────────────────────────────────

function openTaskEdit(taskId) {
  var row = document.getElementById('task-row-' + taskId);
  if (!row) return;
  // Extract current values from DOM
  var notesEl = row.querySelector('.task-notes');
  var assignEl = row.querySelector('.task-assignee');
  var dueEl = row.querySelector('.task-due');
  var currentNotes = notesEl ? notesEl.textContent : '';
  var currentAssign = assignEl ? assignEl.textContent : '';
  var currentDue = '';
  if (dueEl) {
    // Reconstruct YYYY-MM-DD from MM/DD display
    var parts = dueEl.textContent.split('/');
    if (parts.length === 2) {
      var today = new Date();
      currentDue = today.getFullYear() + '-' + parts[0].padStart(2,'0') + '-' + parts[1].padStart(2,'0');
    }
  }
  var editHtml = '<div class="task-edit-row" id="task-edit-' + taskId + '">';
  editHtml += '<input class="task-edit-notes" type="text" id="editNotes-' + taskId + '" value="' + esc(currentNotes) + '" placeholder="Task description...">';
  editHtml += '<select id="editAssign-' + taskId + '"><option value="">Unassigned</option>' + teamOptionsSelected(currentAssign) + '</select>';
  editHtml += '<input type="date" id="editDue-' + taskId + '" value="' + currentDue + '">';
  editHtml += '<button class="save-btn" data-action="task-save" data-id="' + taskId + '">Save</button>';
  editHtml += '<button class="cancel-edit-btn" data-action="task-cancel-edit" data-id="' + taskId + '">Cancel</button>';
  editHtml += '</div>';
  row.insertAdjacentHTML('afterend', editHtml);
  row.classList.add('hidden');
  var inp = document.getElementById('editNotes-' + taskId);
  if (inp) { inp.focus(); inp.select(); }
  // Enter to save
  if (inp) inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveTaskEdit(taskId); }
    if (e.key === 'Escape') { cancelTaskEdit(taskId); }
  });
}

async function saveTaskEdit(taskId) {
  var notes = document.getElementById('editNotes-' + taskId);
  var assign = document.getElementById('editAssign-' + taskId);
  var due = document.getElementById('editDue-' + taskId);
  if (!notes || !notes.value.trim()) return;
  await fetch(API + '/api/tasks/' + taskId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notes.value.trim(), assigned_to: assign ? assign.value : '', due_date: due ? due.value : '' })
  });
  if (currentClientId) loadClient(currentClientId);
}

function cancelTaskEdit(taskId) {
  var editRow = document.getElementById('task-edit-' + taskId);
  var taskRow = document.getElementById('task-row-' + taskId);
  if (editRow) editRow.remove();
  if (taskRow) taskRow.classList.remove('hidden');
}

// ── Task delete + undo ────────────────────────────────────────────────────

function deleteTask(taskId, jobId) {
  // Clear any previous pending delete
  if (deleteTimer) { clearTimeout(deleteTimer); executeDelete(); }
  deletePendingId = taskId;
  deletePendingJobId = jobId;
  // Remove from DOM immediately (optimistic)
  var row = document.getElementById('task-row-' + taskId);
  if (row) { deletePendingEl = row.outerHTML; row.remove(); }
  // Cancel edit row if open
  var editRow = document.getElementById('task-edit-' + taskId);
  if (editRow) editRow.remove();
  // Show snackbar
  showSnackbar('Task deleted');
  deleteTimer = setTimeout(function() { executeDelete(); }, 4000);
}

function executeDelete() {
  if (!deletePendingId) return;
  fetch(API + '/api/tasks/' + deletePendingId, { method: 'DELETE' });
  deletePendingId = null;
  deletePendingEl = null;
  deletePendingJobId = null;
  deleteTimer = null;
  hideSnackbar();
  // Refresh dashboard counts silently
  fetch(API + '/api/dashboard').then(function(r) { return r.json(); }).then(function(d) { dashboardData = d; });
}

function undoDelete() {
  if (!deletePendingId) return;
  clearTimeout(deleteTimer);
  deleteTimer = null;
  // Re-insert task row
  if (deletePendingEl) {
    var taskList = document.querySelector('.task-list');
    // Find the add-task row in the correct job and insert before it
    var jobId = deletePendingJobId;
    var addRow = document.querySelector('#addTaskForm-' + jobId);
    if (addRow && addRow.previousElementSibling) {
      addRow.previousElementSibling.insertAdjacentHTML('afterend', deletePendingEl);
    } else if (taskList) {
      taskList.insertAdjacentHTML('afterbegin', deletePendingEl);
    }
  }
  deletePendingId = null;
  deletePendingEl = null;
  deletePendingJobId = null;
  hideSnackbar();
}

function showSnackbar(msg) {
  document.getElementById('snackbarMsg').textContent = msg;
  document.getElementById('snackbar').classList.add('show');
}

function hideSnackbar() {
  document.getElementById('snackbar').classList.remove('show');
}

// ── Team ──────────────────────────────────────────────────────────────────

function toggleGearPanel() {
  document.getElementById('gearPanel').classList.toggle('show');
}

async function addTeamMember() {
  var inp = document.getElementById('newMemberName');
  var name = inp.value.trim();
  if (!name) return;
  var res = await fetch(API + '/api/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name })
  });
  if (res.ok) {
    inp.value = '';
    var tr2 = await fetch(API + '/api/team');
    if (tr2.ok) teamMembers = await tr2.json();
    // Refresh dashboard to update gear panel
    var dr = await fetch(API + '/api/dashboard');
    dashboardData = await dr.json();
    renderDashboard();
  } else {
    var err = await res.json();
    alert(err.error || 'Error adding member');
  }
}

async function removeTeamMember(id) {
  if (!confirm('Remove this team member? Their tasks will be unassigned.')) return;
  await fetch(API + '/api/team/' + id, { method: 'DELETE' });
  var tr2 = await fetch(API + '/api/team');
  if (tr2.ok) teamMembers = await tr2.json();
  var dr = await fetch(API + '/api/dashboard');
  dashboardData = await dr.json();
  renderDashboard();
}

function teamOptions() {
  var html = '';
  for (var i = 0; i < teamMembers.length; i++) {
    html += '<option>' + esc(teamMembers[i].name) + '</option>';
  }
  return html;
}

function teamOptionsSelected(selected) {
  var html = '';
  for (var i = 0; i < teamMembers.length; i++) {
    var sel = teamMembers[i].name === selected ? ' selected' : '';
    html += '<option' + sel + '>' + esc(teamMembers[i].name) + '</option>';
  }
  return html;
}

// ── Client management ──────────────────────────────────────────────────────

function toggleAddClientForm() {
  var f = document.getElementById('addClientForm');
  f.classList.toggle('show');
  if (f.classList.contains('show')) document.getElementById('newClientName').focus();
  document.getElementById('addClientError').classList.add('hidden');
}

async function addClient() {
  var name = document.getElementById('newClientName').value.trim();
  var errEl = document.getElementById('addClientError');
  if (!name) return;
  var res = await fetch(API + '/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name })
  });
  if (res.ok) {
    document.getElementById('newClientName').value = '';
    toggleAddClientForm();
    var dr = await fetch(API + '/api/dashboard');
    dashboardData = await dr.json();
    renderDashboard();
  } else {
    var err = await res.json();
    errEl.textContent = err.error || 'Error';
    errEl.classList.remove('hidden');
  }
}

async function renameClient(clientId) {
  var current = document.getElementById('clientNameDisplay');
  var newName = prompt('Rename client:', current ? current.textContent : '');
  if (!newName || !newName.trim()) return;
  var res = await fetch(API + '/api/clients/' + clientId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName.trim() })
  });
  if (res.ok) {
    if (current) current.textContent = newName.trim();
    // Update dashboard data
    var dr = await fetch(API + '/api/dashboard');
    dashboardData = await dr.json();
  } else {
    var err = await res.json();
    alert(err.error || 'Rename failed');
  }
}

async function archiveClient(clientId, activeJobs) {
  if (parseInt(activeJobs) > 0) {
    if (!confirm('This client has ' + activeJobs + ' active job(s). Archive anyway?')) return;
  } else {
    if (!confirm('Archive this client? They will be removed from the dashboard.')) return;
  }
  await fetch(API + '/api/clients/' + clientId + '/archive', { method: 'POST' });
  var dr = await fetch(API + '/api/dashboard');
  dashboardData = await dr.json();
  showDashboard();
}

// ── Team detail ────────────────────────────────────────────────────────────

async function loadTeam(encodedName) {
  var name = decodeURIComponent(encodedName);
  currentTeamName = name;
  currentClientId = null;
  document.getElementById('teamDetail').innerHTML = '<div class="loading">Loading...</div>';
  document.getElementById('teamDetail').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('navBack').style.display = 'flex';
  var res = await fetch(API + '/api/team/' + encodedName);
  if (res.status === 401) { showLoginScreen(); return; }
  var data = await res.json();
  renderTeamDetail(data);
}

function renderTeamDetail(data) {
  var today = new Date().toISOString().split('T')[0];
  var html = '<div class="detail-header"><div><h2>' + esc(data.name) + '</h2><div class="sub">' + data.tasks.length + ' assigned tasks</div></div></div>';
  var byClient = {};
  for (var i = 0; i < data.tasks.length; i++) {
    var t = data.tasks[i];
    if (!byClient[t.client_name]) byClient[t.client_name] = [];
    byClient[t.client_name].push(t);
  }
  var keys = Object.keys(byClient).sort();
  for (var k = 0; k < keys.length; k++) {
    var cn = keys[k];
    html += '<div class="section-title" style="margin-top:16px">' + esc(cn) + '</div>';
    html += '<div class="task-list" style="border:1px solid var(--border);border-radius:8px;margin-bottom:12px">';
    for (var i = 0; i < byClient[cn].length; i++) {
      var t = byClient[cn][i];
      var dueClass = t.due_date ? (t.due_date < today ? 'overdue' : (daysDiff(today, t.due_date) <= 3 ? 'soon' : '')) : '';
      html += '<div class="task-item" id="task-row-' + t.id + '"><div class="task-check" role="checkbox" aria-checked="false" tabindex="0" data-action="task-toggle" data-id="' + t.id + '" data-val="1"></div>';
      html += '<div class="task-notes">' + esc(t.notes || 'Untitled') + '</div>';
      html += '<span class="task-assignee">' + esc(t.job_name || '') + '</span>';
      if (t.due_date) html += '<span class="task-due ' + dueClass + '">' + formatDate(t.due_date) + '</span>';
      html += '</div>';
    }
    html += '</div>';
  }
  document.getElementById('teamDetail').innerHTML = html;
}

// ── Task toggle ────────────────────────────────────────────────────────────

async function toggleTask(taskId, complete, clientId, teamName) {
  var ep = complete ? '/api/tasks/' + taskId + '/complete' : '/api/tasks/' + taskId + '/reopen';
  await fetch(API + ep, { method: 'POST' });
  // Fix BUG-001: refresh team view when toggling from team detail
  if (teamName) {
    loadTeam(encodeURIComponent(teamName));
  } else if (clientId) {
    loadClient(clientId);
  }
  fetch(API + '/api/dashboard').then(function(r) { return r.json(); }).then(function(d) { dashboardData = d; });
}

// ── Job CRUD ───────────────────────────────────────────────────────────────

async function completeJob(jobId, clientId) {
  await fetch(API + '/api/jobs/' + jobId + '/complete', { method: 'POST' });
  if (clientId) loadClient(clientId);
  fetch(API + '/api/dashboard').then(function(r) { return r.json(); }).then(function(d) { dashboardData = d; });
}

async function reopenJob(jobId, clientId) {
  await fetch(API + '/api/jobs/' + jobId + '/reopen', { method: 'POST' });
  if (clientId) loadClient(clientId);
  fetch(API + '/api/dashboard').then(function(r) { return r.json(); }).then(function(d) { dashboardData = d; });
}

function toggleAddJob(clientId) {
  var f = document.getElementById('addJobForm-' + clientId);
  f.classList.toggle('show');
  if (f.classList.contains('show')) {
    var inp = document.getElementById('newJobName-' + clientId);
    if (inp) inp.focus();
  }
}

async function createJob(clientId) {
  var inp = document.getElementById('newJobName-' + clientId);
  var tmpl = document.getElementById('newJobTemplate-' + clientId);
  if (!inp || !inp.value.trim()) return;
  var body = { client_id: clientId, name: inp.value.trim() };
  if (tmpl && tmpl.value) body.template_id = tmpl.value;
  await fetch(API + '/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  loadClient(clientId);
}

function toggleAddTask(jobId) {
  var f = document.getElementById('addTaskForm-' + jobId);
  f.classList.toggle('show');
  var inp = document.getElementById('newTaskNotes-' + jobId);
  if (inp) inp.focus();
}

async function createTask(jobId, clientId) {
  var notes = document.getElementById('newTaskNotes-' + jobId);
  var assign = document.getElementById('newTaskAssign-' + jobId);
  var due = document.getElementById('newTaskDue-' + jobId);
  if (!notes || !notes.value.trim()) return;
  await fetch(API + '/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, client_id: clientId, notes: notes.value.trim(), assigned_to: assign ? assign.value : '', due_date: due ? due.value : '' })
  });
  loadClient(clientId);
}

// ── Dashboard navigation ──────────────────────────────────────────────────

function showDashboard() {
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('detail').classList.add('hidden');
  document.getElementById('teamDetail').classList.add('hidden');
  document.getElementById('intakeDetail').classList.add('hidden');
  document.getElementById('navBack').style.display = 'none';
  currentClientId = null;
  currentTeamName = null;
  currentIntakeId = null;
  if (dashboardData) renderDashboard(); else loadDashboard();
}

function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('appShell').classList.add('hidden');
}

// ── Intake ─────────────────────────────────────────────────────────────────

async function loadIntakeSection() {
  var sec = document.getElementById('intakeSection');
  if (!sec) return;

  // Always render the section shell
  var gmailHtml = '<div class="gmail-settings" id="gmailSettingsBox">' +
    '<div class="gmail-settings-title">Gmail Integration</div>' +
    '<div class="gmail-status-row">' +
    '<div class="gmail-dot" id="gmailDot"></div>' +
    '<div class="gmail-status-text" id="gmailStatusText">Checking...</div>' +
    '<button class="gmail-connect-btn" data-action="gmail-connect" id="gmailConnectBtn">Connect</button>' +
    '</div>' +
    '<div class="gmail-last-checked" id="gmailLastChecked"></div>' +
    '<div class="gmail-error-msg" id="gmailErrorMsg"></div>' +
    '</div>';

  sec.innerHTML = '<div class="intake-section-header">' +
    '<div class="section-title" style="margin-bottom:0">Intake <span class="intake-badge" id="intakeBadge">0</span></div>' +
    '<div class="intake-upload-row">' +
    '<button class="intake-upload-btn" data-action="upload-proposal">&#128196; Upload Proposal</button>' +
    '</div>' +
    '</div>' +
    '<div class="intake-list" id="intakeList"></div>' +
    gmailHtml;

  sec.classList.remove('hidden');

  // Load intake items
  var res = await fetch(API + '/api/intake');
  if (!res.ok) return;
  var items = await res.json();

  document.getElementById('intakeBadge').textContent = items.length;

  var listEl = document.getElementById('intakeList');
  if (items.length === 0) {
    listEl.innerHTML = '<div class="intake-empty">No pending intake items.</div>';
  } else {
    listEl.innerHTML = items.map(function(item) {
      var icon = item.source === 'email' ? '✉️' : '📄';
      var extracted = {};
      try { extracted = JSON.parse(item.extracted_json || '{}'); } catch {}
      var clientLabel = item.suggested_client_name ? item.suggested_client_name : 'Unknown client';
      var jobCount = (extracted.jobs || []).length;
      var actionsHtml = item.source === 'proposal'
        ? '<button class="intake-review-btn" data-action="intake-review" data-id="' + item.id + '">Review &amp; Refine</button>'
        : '<button class="intake-confirm-btn" data-action="intake-confirm" data-id="' + item.id + '">&#10003; Add</button>';
      return '<div class="intake-item" id="intake-' + item.id + '">' +
        '<div class="intake-item-icon">' + icon + '</div>' +
        '<div class="intake-item-body">' +
        '<div class="intake-item-subject">' + esc(item.subject || 'Untitled') + '</div>' +
        '<div class="intake-item-meta">' +
        '<span class="intake-item-client">' + esc(clientLabel) + '</span>' +
        (jobCount ? '<span>' + jobCount + ' job' + (jobCount !== 1 ? 's' : '') + '</span>' : '') +
        '</div>' +
        '</div>' +
        '<div class="intake-item-actions">' +
        actionsHtml +
        '<button class="intake-dismiss-btn" data-action="intake-dismiss" data-id="' + item.id + '">&#10005;</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  // Load Gmail status
  var gres = await fetch(API + '/api/gmail/status');
  if (gres.ok) {
    var gdata = await gres.json();
    var dot = document.getElementById('gmailDot');
    var statusText = document.getElementById('gmailStatusText');
    var connectBtn = document.getElementById('gmailConnectBtn');
    var lastChecked = document.getElementById('gmailLastChecked');
    var errorMsg = document.getElementById('gmailErrorMsg');
    if (gdata.connected) {
      dot.classList.add('connected');
      statusText.textContent = 'Gmail connected';
      connectBtn.textContent = 'Reconnect';
      if (gdata.last_checked) {
        lastChecked.textContent = 'Last checked: ' + new Date(gdata.last_checked).toLocaleString();
      }
      if (gdata.cron_last_error) {
        errorMsg.textContent = 'Last error: ' + gdata.cron_last_error;
      }
    } else {
      statusText.textContent = "Gmail not connected \u2014 emails won\u2019t be captured";
    }
  }
}

function showIntakeConfirmModal(intakeId) {
  var itemEl = document.getElementById('intake-' + intakeId);
  if (!itemEl) return;

  var items = [];
  try {
    var cached = intakeConfirmData;
    if (!cached || cached.id !== intakeId) {
      // Will need to re-fetch, but we have the DOM data — build from dashboardData context
    }
  } catch {}

  // Fetch fresh data for the modal
  fetch(API + '/api/intake').then(function(r) { return r.json(); }).then(function(allItems) {
    var item = allItems.find(function(i) { return i.id === intakeId; });
    if (!item) return;
    var extracted = {};
    try { extracted = JSON.parse(item.extracted_json || '{}'); } catch {}

    var jobsHtml = (extracted.jobs || []).map(function(j) {
      return '<div class="ijob">' + esc(j.name) + '</div>' +
        (j.tasks || []).map(function(t) { return '<div class="itask">&#8226; ' + esc(t.name || t.notes || '') + '</div>'; }).join('');
    }).join('');

    // Build client select options
    var clientOpts = '<option value="">— Create new client —</option>';
    if (dashboardData && dashboardData.clients) {
      clientOpts = (dashboardData.clients || []).map(function(c) {
        var sel = (c.id === item.suggested_client_id) ? ' selected' : '';
        return '<option value="' + c.id + '"' + sel + '>' + esc(c.name) + '</option>';
      }).join('');
      clientOpts = '<option value="">— Create new client —</option>' + clientOpts;
    }

    var html = '<div class="intake-modal-overlay" id="intakeModalOverlay">' +
      '<div class="intake-modal">' +
      '<h3>Add to tracker</h3>' +
      '<div class="sub">' + esc(item.subject || 'Untitled') + '</div>' +
      '<div class="intake-job-preview">' + (jobsHtml || '<div class="intake-empty">No structured jobs extracted.</div>') + '</div>' +
      '<select id="intakeClientSelect" onchange="toggleNewClientInput()">' + clientOpts + '</select>' +
      '<input type="text" id="intakeNewClientName" placeholder="New client name..." style="display:none">' +
      '<div class="intake-modal-actions">' +
      '<button class="cancel-btn" data-action="intake-modal-cancel">Cancel</button>' +
      '<button class="confirm-btn" data-action="intake-modal-confirm" id="intakeModalConfirmBtn" data-id="' + intakeId + '">Add to Tracker</button>' +
      '</div>' +
      '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);
    // Show new client input if "create new" is selected
    toggleNewClientInput();
  });
}

function toggleNewClientInput() {
  var sel = document.getElementById('intakeClientSelect');
  var inp = document.getElementById('intakeNewClientName');
  if (!sel || !inp) return;
  inp.style.display = sel.value === '' ? '' : 'none';
}

function closeIntakeModal() {
  var overlay = document.getElementById('intakeModalOverlay');
  if (overlay) overlay.remove();
}

async function confirmIntakeFromModal() {
  var btn = document.getElementById('intakeModalConfirmBtn');
  if (!btn) return;
  var intakeId = btn.getAttribute('data-id');
  var sel = document.getElementById('intakeClientSelect');
  var newName = document.getElementById('intakeNewClientName');

  var body = {};
  if (sel && sel.value) {
    body.client_id = sel.value;
  } else if (newName && newName.value.trim()) {
    body.create_client_name = newName.value.trim();
  } else {
    alert('Please select a client or enter a new client name.');
    return;
  }

  btn.textContent = 'Adding...';
  btn.disabled = true;
  var res = await fetch(API + '/api/intake/' + intakeId + '/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  closeIntakeModal();
  if (res.ok) {
    var data = await res.json();
    loadDashboard();
    // Navigate to client
    if (data.client_id) setTimeout(function() { loadClient(data.client_id); }, 400);
  } else {
    var err = await res.json().catch(function() { return {}; });
    alert(err.error || 'Failed to add to tracker');
    loadIntakeSection();
  }
}

async function dismissIntakeItem(intakeId) {
  var itemEl = document.getElementById('intake-' + intakeId);
  if (itemEl) itemEl.style.opacity = '0.4';
  await fetch(API + '/api/intake/' + intakeId + '/dismiss', { method: 'POST' });
  loadIntakeSection();
}

async function loadIntakeDetail(intakeId) {
  currentIntakeId = intakeId;

  // Show intakeDetail, hide others
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('detail').classList.add('hidden');
  document.getElementById('teamDetail').classList.add('hidden');
  document.getElementById('intakeDetail').classList.remove('hidden');
  document.getElementById('navBack').style.display = 'flex';

  var detailEl = document.getElementById('intakeDetail');
  detailEl.innerHTML = '<div style="padding:24px;color:var(--text-dim)">Loading...</div>';

  // Fetch intake item + chat history
  var items = await fetch(API + '/api/intake').then(function(r) { return r.json(); });
  var item = items.find(function(i) { return i.id === intakeId; });
  if (!item) { detailEl.innerHTML = '<div style="padding:24px">Item not found.</div>'; return; }

  var extracted = {};
  try { extracted = JSON.parse(item.extracted_json || '{}'); } catch {}

  // Build client select
  var clientOpts = '<option value="">+ Create new client</option>';
  if (dashboardData && dashboardData.clients) {
    clientOpts += dashboardData.clients.map(function(c) {
      return '<option value="' + c.id + '"' + (c.id === item.suggested_client_id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('');
  }

  var jobsHtml = (extracted.jobs || []).map(function(j) {
    return '<div class="intake-job-card">' +
      '<div class="ijob-name">' + esc(j.name) + '</div>' +
      (j.tasks || []).map(function(t) {
        return '<div class="itask-sm">' + esc(t.name || t.notes || '') + '</div>';
      }).join('') +
      '</div>';
  }).join('') || '<div class="intake-empty">No jobs extracted yet. Ask Claude to extract structure.</div>';

  detailEl.innerHTML = '<div class="intake-split">' +
    '<div class="intake-preview-panel">' +
    '<h2>' + esc(item.subject || 'Proposal') + '</h2>' +
    '<div class="intake-file-meta">📄 ' + esc(item.subject || '') + ' &middot; ' + (item.suggested_client_name ? esc(item.suggested_client_name) : 'No client matched') + '</div>' +
    '<div class="intake-client-row">' +
    '<select id="intakeDetailClientSelect" onchange="toggleDetailNewClient()">' + clientOpts + '</select>' +
    '<input type="text" id="intakeDetailNewClient" placeholder="New client name..." style="display:none">' +
    '<button class="add-to-client-btn" data-action="intake-add-to-client" data-id="' + intakeId + '">Add to Client</button>' +
    '</div>' +
    '<div class="intake-jobs-list" id="intakeJobsList">' + jobsHtml + '</div>' +
    '</div>' +
    '<div class="intake-chat-panel">' +
    '<div class="intake-chat-messages" id="intakeChatMessages"></div>' +
    '<div class="intake-chat-form">' +
    '<textarea id="intakeChatInput" placeholder="Ask Claude to refine the job list..." rows="1" onkeydown="if(event.keyCode===13&&!event.shiftKey){event.preventDefault();sendIntakeChat();}"></textarea>' +
    '<button class="intake-chat-send" id="intakeChatSendBtn" data-action="intake-chat-send">&#8679;</button>' +
    '</div>' +
    '</div>' +
    '</div>';

  // Add opening assistant message (from upload or load from DB)
  var chatEl = document.getElementById('intakeChatMessages');
  var openMsg = 'What would you like to change about this job structure? You can ask me to split, rename, add, or remove any jobs or tasks.';
  chatEl.innerHTML = '<div class="chat-msg assistant">' + esc(openMsg) + '</div>';

  // Handle new client input toggle
  toggleDetailNewClient();
}

function toggleDetailNewClient() {
  var sel = document.getElementById('intakeDetailClientSelect');
  var inp = document.getElementById('intakeDetailNewClient');
  if (!sel || !inp) return;
  inp.style.display = sel.value === '' ? '' : 'none';
}

async function sendIntakeChat() {
  if (!currentIntakeId) return;
  var input = document.getElementById('intakeChatInput');
  var sendBtn = document.getElementById('intakeChatSendBtn');
  var chatEl = document.getElementById('intakeChatMessages');
  var message = input ? input.value.trim() : '';
  if (!message) return;

  // Show user message
  chatEl.insertAdjacentHTML('beforeend', '<div class="chat-msg user">' + esc(message) + '</div>');
  input.value = '';
  sendBtn.disabled = true;
  chatEl.insertAdjacentHTML('beforeend', '<div class="chat-msg assistant" id="intakeChatThinking">Thinking...</div>');
  chatEl.scrollTop = chatEl.scrollHeight;

  var res = await fetch(API + '/api/intake/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intake_id: currentIntakeId, message: message })
  });
  sendBtn.disabled = false;

  var thinking = document.getElementById('intakeChatThinking');
  if (thinking) thinking.removeAttribute('id');

  if (!res.ok) {
    if (thinking) thinking.textContent = 'Error — please try again.';
    return;
  }

  var data = await res.json();
  // Replace "Thinking..." with actual reply
  if (thinking) thinking.textContent = data.reply || '';
  chatEl.scrollTop = chatEl.scrollHeight;

  // If extraction was updated, refresh the job list panel
  if (data.updated_extraction) {
    var jobs = data.updated_extraction.jobs || [];
    var jobsHtml = jobs.map(function(j) {
      return '<div class="intake-job-card">' +
        '<div class="ijob-name">' + esc(j.name) + '</div>' +
        (j.tasks || []).map(function(t) {
          return '<div class="itask-sm">' + esc(t.name || t.notes || '') + '</div>';
        }).join('') +
        '</div>';
    }).join('') || '<div class="intake-empty">No jobs yet.</div>';
    var jobsList = document.getElementById('intakeJobsList');
    if (jobsList) jobsList.innerHTML = jobsHtml;
  }
}

async function confirmIntakeProposal(intakeId) {
  var sel = document.getElementById('intakeDetailClientSelect');
  var newClientInput = document.getElementById('intakeDetailNewClient');
  var body = {};
  if (sel && sel.value) {
    body.client_id = sel.value;
  } else if (newClientInput && newClientInput.value.trim()) {
    body.create_client_name = newClientInput.value.trim();
  } else {
    alert('Please select a client or enter a new client name.');
    return;
  }

  var btn = document.querySelector('[data-action="intake-add-to-client"]');
  if (btn) { btn.textContent = 'Adding...'; btn.disabled = true; }

  var res = await fetch(API + '/api/intake/' + intakeId + '/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    var data = await res.json();
    currentIntakeId = null;
    document.getElementById('intakeDetail').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('navBack').style.display = 'none';
    loadDashboard();
    if (data.client_id) setTimeout(function() { loadClient(data.client_id); }, 400);
  } else {
    var err = await res.json().catch(function() { return {}; });
    alert(err.error || 'Failed to add to tracker');
    if (btn) { btn.textContent = 'Add to Client'; btn.disabled = false; }
  }
}

async function handleProposalFile(file) {
  if (!file) return;
  var formData = new FormData();
  formData.append('file', file);

  // Show loading in intake section
  var uploadBtn = document.querySelector('.intake-upload-btn');
  if (uploadBtn) { uploadBtn.textContent = 'Uploading...'; uploadBtn.disabled = true; }

  var res = await fetch(API + '/api/intake/upload', { method: 'POST', body: formData });

  if (uploadBtn) { uploadBtn.textContent = '📄 Upload Proposal'; uploadBtn.disabled = false; }
  // Reset file input so the same file can be re-uploaded
  document.getElementById('proposalFileInput').value = '';

  if (!res.ok) {
    var err = await res.json().catch(function() { return {}; });
    alert(err.error || 'Upload failed');
    return;
  }
  var data = await res.json();
  if (data.intake_id) {
    loadIntakeSection();
    // Auto-open the split panel for the proposal
    setTimeout(function() { loadIntakeDetail(data.intake_id); }, 300);
  }
}

// ══════════════════════════════════════════════
// ── SPRINT TEMPLATE DATA ──
// ══════════════════════════════════════════════

var SPRINT_PHASES = [
  { id: 'preSprint', name: 'Pre-Sprint', subtitle: 'Foundation Setup', sections: ['preSprint_access','preSprint_vendasta','preSprint_oviond','preSprint_assets'] },
  { id: 'week1', name: 'Week 1', subtitle: 'Technical Foundation', sections: ['week1_technical','week1_speed','week1_listings','week1_diagnosis'] },
  { id: 'week2', name: 'Week 2', subtitle: 'Messaging & Positioning', sections: ['week2_headlines','week2_offer','week2_landing'] },
  { id: 'week3', name: 'Week 3', subtitle: 'Social Proof & Trust', sections: ['week3_reviews','week3_proof','week3_guarantee'] },
  { id: 'week4', name: 'Week 4', subtitle: 'Conversion & Launch', sections: ['week4_cta','week4_retargeting','week4_launch','week4_handoff'] }
];

var SPRINT_SECTIONS = {
  preSprint_access: { title: 'Access & Credentials', items: [
    { id: 'gbp', label: 'Google Business Profile (Owner access)', critical: true },
    { id: 'ga4', label: 'Google Analytics 4 (Admin access)', critical: true },
    { id: 'gads', label: 'Google Ads (Admin access, if existing)', critical: false },
    { id: 'meta', label: 'Meta Business Manager (Admin access)', critical: false },
    { id: 'website', label: 'Website backend access', critical: true },
    { id: 'domain', label: 'Domain registrar access', critical: false },
    { id: 'crm', label: 'CRM access (if applicable)', critical: false },
    { id: 'hosting', label: 'Hosting panel access', critical: false }
  ]},
  preSprint_vendasta: { title: 'Vendasta Setup', items: [
    { id: 'vendasta-account', label: 'Create client account in Vendasta', critical: true },
    { id: 'vendasta-listings', label: 'Activate Business Listings (Listings Sync Pro)', critical: true },
    { id: 'vendasta-reputation', label: 'Activate Reputation Management', critical: false },
    { id: 'vendasta-seo', label: 'Activate Local SEO (if applicable)', critical: false },
    { id: 'vendasta-social', label: 'Activate Social Marketing dashboard', critical: false },
    { id: 'vendasta-chatbot', label: 'Activate Chatbot', critical: false },
    { id: 'vendasta-notifications', label: 'Configure email notifications', critical: false },
    { id: 'vendasta-invite', label: 'Send client portal invitation', critical: false }
  ]},
  preSprint_oviond: { title: 'Oviond Reporting', items: [
    { id: 'oviond-workspace', label: 'Create new client workspace', critical: true },
    { id: 'oviond-ga4', label: 'Connect Google Analytics 4', critical: false },
    { id: 'oviond-gsc', label: 'Connect Google Search Console', critical: false },
    { id: 'oviond-gads', label: 'Connect Google Ads (if applicable)', critical: false },
    { id: 'oviond-meta', label: 'Connect Meta Ads (if applicable)', critical: false },
    { id: 'oviond-gbp', label: 'Connect Google Business Profile', critical: false },
    { id: 'oviond-widgets', label: 'Configure dashboard widgets', critical: false },
    { id: 'oviond-reports', label: 'Set up automated weekly reports', critical: false }
  ]},
  preSprint_assets: { title: 'Asset Collection', items: [
    { id: 'logo', label: 'Logo files (vector preferred)', critical: false },
    { id: 'colors', label: 'Brand colors (hex codes)', critical: false },
    { id: 'fonts', label: 'Brand fonts (if specified)', critical: false },
    { id: 'photos', label: 'Current photography library', critical: false },
    { id: 'testimonials', label: 'Existing testimonials and reviews', critical: false },
    { id: 'service-area', label: 'Service area documentation', critical: false },
    { id: 'pricing', label: 'Current pricing structure', critical: false }
  ]},
  week1_technical: { title: 'Technical Audit', items: [
    { id: 'speed-test', label: 'Run PageSpeed Insights audit', critical: true },
    { id: 'mobile-test', label: 'Mobile responsiveness check', critical: false },
    { id: 'ssl-check', label: 'SSL certificate verification', critical: false },
    { id: 'indexing', label: 'Google Search Console indexing status', critical: false },
    { id: 'broken-links', label: 'Broken link scan', critical: false },
    { id: 'schema', label: 'Schema markup review', critical: false }
  ]},
  week1_speed: { title: 'Speed Optimization', items: [
    { id: 'image-opt', label: 'Image compression and optimization', critical: false },
    { id: 'caching', label: 'Browser caching implementation', critical: false },
    { id: 'minify', label: 'CSS/JS minification', critical: false },
    { id: 'cdn', label: 'CDN setup (if applicable)', critical: false }
  ]},
  week1_listings: { title: 'Listings Audit', items: [
    { id: 'nap-audit', label: 'NAP consistency audit', critical: true },
    { id: 'gbp-optimize', label: 'Google Business Profile optimization', critical: false },
    { id: 'categories', label: 'Category selection review', critical: false },
    { id: 'photos-gbp', label: 'GBP photo upload', critical: false },
    { id: 'services-gbp', label: 'Services/Products setup in GBP', critical: false }
  ]},
  week1_diagnosis: { title: 'Initial Diagnosis', items: [
    { id: 'competitor-review', label: 'Top 3 competitor analysis', critical: false },
    { id: 'keyword-baseline', label: 'Current keyword rankings baseline', critical: false },
    { id: 'traffic-baseline', label: 'Traffic baseline documentation', critical: false },
    { id: 'conversion-baseline', label: 'Conversion baseline setup', critical: false }
  ]},
  week2_headlines: { title: 'Messaging Overhaul', items: [
    { id: 'headline-audit', label: 'Current headline effectiveness audit', critical: false },
    { id: 'value-prop', label: 'Value proposition refinement', critical: true },
    { id: 'headline-variants', label: 'Create 5+ headline variants', critical: false },
    { id: 'subheadline', label: 'Supporting subheadline copy', critical: false }
  ]},
  week2_offer: { title: 'Offer Development', items: [
    { id: 'offer-audit', label: 'Current offer analysis', critical: false },
    { id: 'offer-create', label: 'Develop irresistible offer', critical: true },
    { id: 'urgency', label: 'Add urgency/scarcity elements', critical: false },
    { id: 'guarantee', label: 'Guarantee formulation', critical: false }
  ]},
  week2_landing: { title: 'Landing Page Optimization', items: [
    { id: 'hero-section', label: 'Hero section redesign', critical: false },
    { id: 'benefit-blocks', label: 'Benefit blocks creation', critical: false },
    { id: 'social-proof-section', label: 'Social proof section', critical: false },
    { id: 'cta-placement', label: 'CTA button optimization', critical: false }
  ]},
  week3_reviews: { title: 'Review Generation', items: [
    { id: 'review-audit', label: 'Current review audit', critical: true },
    { id: 'review-response', label: 'Respond to existing reviews', critical: false },
    { id: 'review-system', label: 'Implement review request system', critical: false },
    { id: 'review-training', label: 'Train client on review requests', critical: false }
  ]},
  week3_proof: { title: 'Social Proof Assets', items: [
    { id: 'testimonial-collect', label: 'Collect written testimonials', critical: false },
    { id: 'case-study', label: 'Create 1 case study', critical: false },
    { id: 'before-after', label: 'Before/after examples', critical: false },
    { id: 'credentials', label: 'Credentials/certifications display', critical: false }
  ]},
  week3_guarantee: { title: 'Trust Elements', items: [
    { id: 'guarantee-badge', label: 'Guarantee badge creation', critical: false },
    { id: 'trust-badges', label: 'Trust badges implementation', critical: false },
    { id: 'about-page', label: 'About page humanization', critical: false },
    { id: 'team-photos', label: 'Team photos (if applicable)', critical: false }
  ]},
  week4_cta: { title: 'Conversion Optimization', items: [
    { id: 'cta-audit', label: 'CTA audit and optimization', critical: true },
    { id: 'form-optimization', label: 'Form field optimization', critical: false },
    { id: 'click-to-call', label: 'Click-to-call implementation', critical: false },
    { id: 'chat-widget', label: 'Chat widget setup (if applicable)', critical: false }
  ]},
  week4_retargeting: { title: 'Retargeting Setup', items: [
    { id: 'pixel-install', label: 'Facebook pixel installation', critical: false },
    { id: 'google-remarketing', label: 'Google remarketing tag', critical: false },
    { id: 'audience-creation', label: 'Custom audience creation', critical: false },
    { id: 'retargeting-ads', label: 'Retargeting ad creation', critical: false }
  ]},
  week4_launch: { title: 'Campaign Launch', items: [
    { id: 'campaign-structure', label: 'Campaign structure finalization', critical: false },
    { id: 'ad-copy-final', label: 'Final ad copy approval', critical: false },
    { id: 'budget-confirm', label: 'Budget confirmation', critical: false },
    { id: 'launch', label: 'Campaign launch', critical: true }
  ]},
  week4_handoff: { title: 'Client Handoff', items: [
    { id: 'dashboard-walkthrough', label: 'Reporting dashboard walkthrough', critical: false },
    { id: 'expectations', label: 'Set ongoing expectations', critical: false },
    { id: 'communication', label: 'Establish communication cadence', critical: false },
    { id: 'documentation', label: 'Handoff documentation complete', critical: false }
  ]}
};

// ── Sprint functions ───────────────────────────────────────────────────────

function renderSprintClientBar() {
  if (!dashboardData) {
    fetch(API + '/api/dashboard').then(function(r) { return r.json(); }).then(function(d) {
      dashboardData = d; renderSprintClientBar();
    });
    return;
  }
  var clients = dashboardData.clients;
  var sprintClients = clients.filter(function(c) { return c.has_sprint === 1; });
  var html = '';
  for (var i = 0; i < sprintClients.length; i++) {
    var c = sprintClients[i];
    html += '<button class="sprint-client-btn' + (sprintClientId === c.id ? ' active' : '') + '" data-action="sprint-select-client" data-id="' + c.id + '">' + esc(c.name) + '</button>';
  }
  html += '<button class="sprint-activate-btn" data-action="sprint-activate">+ Activate Sprint</button>';
  document.getElementById('sprintClientBar').innerHTML = html;
}

async function loadSprintClient(clientId) {
  sprintClientId = clientId;
  sprintPhase = 'preSprint';
  document.getElementById('sprintContent').innerHTML = '<div class="loading">Loading checklist...</div>';
  renderSprintClientBar();
  var res = await fetch(API + '/api/sprint/' + clientId);
  var data = await res.json();
  sprintItems = {};
  for (var i = 0; i < data.items.length; i++) {
    var item = data.items[i];
    sprintItems[item.task_id] = { completed: item.completed, completed_by: item.completed_by, completed_date: item.completed_date };
  }
  renderSprintChecklist();
}

function getSprintStats() {
  var total = 0, done = 0;
  var phaseStats = {};
  for (var p = 0; p < SPRINT_PHASES.length; p++) {
    var phase = SPRINT_PHASES[p];
    phaseStats[phase.id] = { total: 0, done: 0 };
    for (var s = 0; s < phase.sections.length; s++) {
      var sec = SPRINT_SECTIONS[phase.sections[s]];
      for (var i = 0; i < sec.items.length; i++) {
        total++; phaseStats[phase.id].total++;
        var item = sprintItems[sec.items[i].id];
        if (item && item.completed) { done++; phaseStats[phase.id].done++; }
      }
    }
  }
  return { total: total, done: done, phaseStats: phaseStats };
}

function renderSprintChecklist() {
  var stats = getSprintStats();
  var pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  var html = '';
  html += '<div class="sprint-progress-wrap">';
  html += '<div class="sprint-progress-header"><span class="pct">' + pct + '%</span><span class="counts">' + stats.done + ' / ' + stats.total + ' tasks complete</span></div>';
  html += '<div class="sprint-progress-bar"><div class="sprint-progress-fill" style="width:' + pct + '%"></div></div>';
  html += '</div>';
  html += '<div class="phase-nav">';
  for (var p = 0; p < SPRINT_PHASES.length; p++) {
    var phase = SPRINT_PHASES[p];
    var ps = stats.phaseStats[phase.id];
    var ppct = ps.total > 0 ? Math.round((ps.done / ps.total) * 100) : 0;
    html += '<button class="phase-btn' + (sprintPhase === phase.id ? ' active' : '') + '" data-action="sprint-phase" data-id="' + phase.id + '">';
    html += '<span class="phase-name">' + phase.name + '</span>';
    html += '<span class="phase-sub">' + phase.subtitle + '</span>';
    html += '<span class="phase-pct">' + ppct + '% &middot; ' + ps.done + '/' + ps.total + '</span>';
    html += '</button>';
  }
  html += '</div>';
  var activePhase = SPRINT_PHASES.filter(function(p) { return p.id === sprintPhase; })[0];
  if (activePhase) {
    for (var s = 0; s < activePhase.sections.length; s++) {
      var secKey = activePhase.sections[s];
      var sec = SPRINT_SECTIONS[secKey];
      var secDone = 0;
      for (var i = 0; i < sec.items.length; i++) {
        var it = sprintItems[sec.items[i].id];
        if (it && it.completed) secDone++;
      }
      html += '<div class="sprint-section">';
      html += '<div class="sprint-section-header" data-action="sprint-toggle-section">';
      html += '<span class="sprint-section-title">' + esc(sec.title) + '</span>';
      html += '<span class="sprint-section-count"><span class="done-count">' + secDone + '</span> / ' + sec.items.length + '</span>';
      html += '</div>';
      html += '<div class="sprint-section-items">';
      for (var i = 0; i < sec.items.length; i++) {
        var task = sec.items[i];
        var state = sprintItems[task.id];
        var isDone = state && state.completed;
        html += '<div class="checklist-item" data-action="sprint-toggle-item" data-id="' + task.id + '">';
        html += '<div class="checklist-circle' + (isDone ? ' done' : '') + '"></div>';
        html += '<span class="checklist-label' + (isDone ? ' done' : '') + '">' + esc(task.label) + '</span>';
        if (task.critical) html += '<span class="checklist-badge critical">Critical</span>';
        if (isDone && state.completed_by) html += '<span class="checklist-by">' + esc(state.completed_by) + '</span>';
        html += '</div>';
      }
      html += '</div></div>';
    }
  }
  document.getElementById('sprintContent').innerHTML = html;
}

async function toggleSprintItem(taskId) {
  if (!sprintClientId) return;
  var state = sprintItems[taskId];
  if (state && state.completed) {
    state.completed = 0; state.completed_by = ''; state.completed_date = '';
  } else {
    sprintItems[taskId] = { completed: 1, completed_by: '', completed_date: new Date().toISOString().split('T')[0] };
  }
  renderSprintChecklist();
  await fetch(API + '/api/sprint/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: sprintClientId, task_id: taskId, completed_by: '' })
  });
}

function showActivateModal() {
  if (!dashboardData) return;
  var clients = dashboardData.clients.filter(function(c) { return !c.has_sprint; });
  var html = '<div class="activate-modal-overlay" id="activateOverlay">';
  html += '<div class="activate-modal">';
  html += '<h3>Activate 30-Day Sprint</h3>';
  html += '<label>Client</label>';
  html += '<select id="activateClientSelect">';
  for (var i = 0; i < clients.length; i++) {
    html += '<option value="' + clients[i].id + '">' + esc(clients[i].name) + '</option>';
  }
  html += '</select>';
  html += '<label>Start Date</label>';
  html += '<input type="date" id="activateDate" value="' + new Date().toISOString().split('T')[0] + '">';
  html += '<div class="activate-modal-actions">';
  html += '<button class="cancel-btn" data-action="sprint-activate-cancel">Cancel</button>';
  html += '<button class="confirm-btn" data-action="sprint-activate-confirm">Activate</button>';
  html += '</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

function closeActivateModal() {
  var overlay = document.getElementById('activateOverlay');
  if (overlay) overlay.remove();
}

async function activateSprintClient() {
  var sel = document.getElementById('activateClientSelect');
  var date = document.getElementById('activateDate');
  if (!sel || !sel.value) return;
  var res = await fetch(API + '/api/sprint/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: sel.value, start_date: date ? date.value : '' })
  });
  if (!res.ok) {
    var err = await res.json();
    alert(err.error || 'Activation failed');
    return;
  }
  closeActivateModal();
  var dr = await fetch(API + '/api/dashboard');
  dashboardData = await dr.json();
  renderSprintClientBar();
  loadSprintClient(sel.value);
}

// ── Init ──────────────────────────────────────────────────────────────────

${authed ? 'loadDashboard();' : '// Not authed — wait for login'}
</script>
</body>
</html>`;
}
