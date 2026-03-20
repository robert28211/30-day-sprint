/**
 * Email sender via Resend API (resend.com).
 * Falls back gracefully — email failures never break the main flow.
 *
 * Required secrets: EMAIL_API_KEY, EMAIL_FROM, ROBBIE_EMAIL
 */

const RESEND_API = 'https://api.resend.com/emails';

/**
 * Core send function.
 *
 * @param {{ to, subject, html, text? }} msg
 * @param {object} env
 */
async function send(msg, env) {
  if (!env.EMAIL_API_KEY) {
    console.warn('[email] EMAIL_API_KEY not set — skipping email send');
    return;
  }

  const from = env.EMAIL_FROM || 'reports@engageengine.com';

  const body = {
    from,
    to: [msg.to],
    subject: msg.subject,
    html: msg.html,
    ...(msg.text ? { text: msg.text } : {}),
  };

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend API error ${response.status}: ${err}`);
  }

  console.log(`[email] sent to ${msg.to}: "${msg.subject}"`);
}

/**
 * Send the full prospect report link to a new lead.
 *
 * @param {{ audit, name, email, reportUrl }} opts
 * @param {object} env
 */
export async function sendLeadReport({ audit, name, email, reportUrl }, env) {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const topGaps = audit.gaps.slice(0, 3);

  const leakTotal = topGaps.reduce((s, g) => ({
    low: s.low + (g.revenue_impact?.low || 0),
    high: s.high + (g.revenue_impact?.high || 0),
  }), { low: 0, high: 0 });

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1e293b">
      <div style="background:#1a3a5c;color:white;padding:1.5rem;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:1.1rem">EngageEngine — Your GBP Score Report</h2>
      </div>
      <div style="padding:1.5rem;background:white;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
        <p>${greeting}</p>
        <p style="margin-top:0.75rem">Your Google Business Profile for <strong>${audit.business_name}</strong> scored <strong>${audit.score}/100</strong> — ${audit.score_label}.</p>

        <div style="background:#fff3ee;border:2px solid #e8521a;border-radius:6px;padding:1rem;margin:1rem 0">
          <div style="font-size:1.5rem;font-weight:900;color:#e8521a">$${leakTotal.low.toLocaleString()}–$${leakTotal.high.toLocaleString()}/mo</div>
          <div style="font-size:0.8rem;color:#64748b;margin-top:0.2rem">estimated monthly revenue from your top ${topGaps.length} profile gaps</div>
        </div>

        <h3 style="margin:1rem 0 0.5rem;font-size:0.9rem;text-transform:uppercase;color:#64748b;letter-spacing:0.05em">Top Gaps Found</h3>
        ${topGaps.map((g, i) => `
          <div style="padding:0.5rem 0;border-bottom:1px solid #e2e8f0">
            <strong>${i + 1}. ${g.label}</strong><br>
            <span style="color:#e8521a;font-weight:700">${g.revenue_impact?.display || ''}</span>
            <span style="color:#64748b;font-size:0.8rem"> estimated monthly impact</span>
          </div>
        `).join('')}

        <div style="margin:1.5rem 0;text-align:center">
          <a href="${reportUrl}" style="display:inline-block;background:#e8521a;color:white;text-decoration:none;padding:0.875rem 2rem;border-radius:6px;font-weight:700;font-size:1rem">
            View Your Full Report →
          </a>
        </div>

        <p style="color:#64748b;font-size:0.875rem">Want to walk through this together? <a href="${env.CALENDAR_URL || 'https://calendly.com/engageengine'}" style="color:#1a3a5c;font-weight:600">Book a free 15-minute call</a> and we'll show you exactly how to fix each gap.</p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0">
        <p style="color:#94a3b8;font-size:0.75rem">Robbie Butt · EngageEngine · <a href="https://marketingperformance.net" style="color:#94a3b8">marketingperformance.net</a></p>
      </div>
    </div>
  `;

  await send({
    to: email,
    subject: `Your Google Profile Score: ${audit.score}/100 — Here's What's Costing You`,
    html,
  }, env);
}

/**
 * Notify Robbie of a new inbound lead.
 *
 * @param {{ audit, name, email, phone, reportUrl }} opts
 * @param {object} env
 */
export async function sendRobbieAlert({ audit, name, email, phone, reportUrl }, env) {
  const to = env.ROBBIE_EMAIL || 'robertlbutt@gmail.com';

  const text = `
New GBP Lead: ${audit.business_name}
Score: ${audit.score}/100 (${audit.score_label})

Contact:
  Name:  ${name || '(not provided)'}
  Email: ${email}
  Phone: ${phone || '(not provided)'}

Report: ${reportUrl}

Top gaps:
${audit.gaps.slice(0, 3).map((g, i) => `  ${i + 1}. ${g.label} — ${g.revenue_impact?.display || ''}`).join('\n')}
`.trim();

  await send({
    to,
    subject: `New GBP Lead: ${audit.business_name} — Score ${audit.score}`,
    html: `<pre style="font-family:monospace;font-size:14px;line-height:1.6">${text}</pre>`,
    text,
  }, env);
}

/**
 * Send the weekly summary digest to Robbie.
 *
 * @param {{ scanned, errored, alerts, improvements, declines, unresolved }} summary
 * @param {object} env
 */
export async function sendWeeklySummary(summary, env) {
  const to = env.ROBBIE_EMAIL || 'robertlbutt@gmail.com';
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const text = `
EngageEngine Weekly GBP Report — ${date}

Scan Results:
  Clients scanned: ${summary.scanned}
  Errors: ${summary.errored}
  Competitor alerts: ${summary.alerts}

${summary.improvements?.length ? `Top Movers (Score Up):
${summary.improvements.map(c => `  ▲ ${c.name}: ${c.delta > 0 ? '+' : ''}${c.delta} pts (now ${c.score})`).join('\n')}` : ''}

${summary.declines?.length ? `Needs Attention (Score Down):
${summary.declines.map(c => `  ▼ ${c.name}: ${c.delta} pts (now ${c.score})`).join('\n')}` : ''}

${summary.unresolved?.length ? `Unresolved Place IDs (no data):
${summary.unresolved.map(c => `  - ${c.name}`).join('\n')}` : ''}
`.trim();

  await send({
    to,
    subject: `EngageEngine Weekly GBP Report — ${date}`,
    html: `<pre style="font-family:monospace;font-size:14px;line-height:1.6">${text}</pre>`,
    text,
  }, env);
}

/**
 * Send a competitor alert to Robbie.
 *
 * @param {{ clientName, competitorName, eventType, oldValue, newValue, action }} opts
 * @param {object} env
 */
export async function sendCompetitorAlert({ clientName, competitorName, eventType, oldValue, newValue, action }, env) {
  const to = env.ROBBIE_EMAIL || 'robertlbutt@gmail.com';

  const eventLabels = {
    rating_drop: 'Rating Drop — Opportunity',
    rating_rise: 'Rating Improvement',
    review_surge: 'Review Surge — Momentum Shift',
    listing_closed: 'Listing Closed — Capture Their Demand',
    photo_surge: 'Photo Surge',
  };

  const label = eventLabels[eventType] || eventType;

  const text = `
Competitor Alert: ${label}

Client affected: ${clientName}
Competitor: ${competitorName}
Change: ${oldValue} → ${newValue}

Recommended action: ${action}
`.trim();

  await send({
    to,
    subject: `Competitor Alert [${clientName}]: ${competitorName} — ${label}`,
    html: `<pre style="font-family:monospace;font-size:14px;line-height:1.6">${text}</pre>`,
    text,
  }, env);
}
