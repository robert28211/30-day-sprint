/**
 * Report renderer: shared HTML generation logic for all report flavors.
 * Templates are inline — no file system reads needed in the Worker.
 */

import { formatRevenue } from './revenue.js';
import { scoreRating, scoreReviews, scorePhotos, computeCompetitiveAdjustment } from './audit.js';

// ============================================================
// Shared CSS
// ============================================================

const GOOGLE_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:ital,wght@0,700;0,900;1,400&display=swap" rel="stylesheet">`;

const SHARED_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --brand: #0D1828;
    --accent: #C9A84C;
    --green: #16a34a;
    --yellow: #ca8a04;
    --red: #dc2626;
    --text: #1e293b;
    --muted: #64748b;
    --border: #e2e8f0;
    --bg: #f8fafc;
    --gold-pale: #fdf8ee;
  }
  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 14px;
    color: var(--text);
    background: white;
    max-width: 860px;
    margin: 0 auto;
    padding: 2rem;
  }
  h1 { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700; color: var(--brand); letter-spacing: -0.3px; }
  h2 { font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 700; color: var(--accent); margin: 1.5rem 0 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; }
  h3 { font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 3px solid var(--brand); }
  .header-logo { font-family: 'DM Sans', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--brand); letter-spacing: -0.5px; }
  .header-logo span { color: var(--accent); }
  .header-tagline { font-size: 0.65rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-top: 0.2rem; }
  .header-meta { text-align: right; color: var(--muted); font-size: 0.8rem; }

  .score-section { display: flex; gap: 1.5rem; align-items: center; margin: 1rem 0 1.5rem; }
  .score-circle { text-align: center; min-width: 100px; }
  .score-big { font-family: 'Playfair Display', serif; font-size: 3.5rem; font-weight: 900; line-height: 1; }
  .score-big.excellent { color: var(--green); }
  .score-big.good { color: #0891b2; }
  .score-big.needs-work { color: var(--yellow); }
  .score-big.critical { color: var(--red); }
  .score-tag { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); }
  .score-bar-wrap { flex: 1; }
  .score-bar-label { font-size: 0.75rem; color: var(--muted); margin-bottom: 0.3rem; }
  .score-bar-track { background: var(--border); border-radius: 0; height: 6px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 0; }

  .working-list { list-style: none; }
  .working-list li { padding: 0.4rem 0; display: flex; gap: 0.5rem; align-items: center; }
  .working-list li::before { content: '✓'; color: var(--green); font-weight: 700; }

  .gaps-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
  .gaps-table th { text-align: left; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); padding: 0.4rem 0.5rem; border-bottom: 2px solid var(--brand); }
  .gaps-table td { padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--border); vertical-align: top; font-size: 0.85rem; }
  .gaps-table tr:last-child td { border-bottom: none; }
  .gap-num { font-weight: 700; color: var(--brand); white-space: nowrap; }
  .rev-impact { font-weight: 700; color: var(--accent); white-space: nowrap; }
  .sev-high { color: var(--red); font-weight: 600; font-size: 0.75rem; }
  .sev-medium { color: var(--yellow); font-weight: 600; font-size: 0.75rem; }

  .competitor-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
  .competitor-table th { background: var(--brand); color: white; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.5rem; text-align: left; }
  .competitor-table td { padding: 0.5rem; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
  .competitor-table tr.subject td { background: #eff6ff; font-weight: 600; }
  .better { color: var(--green); }
  .worse { color: var(--red); }

  .checklist { list-style: none; }
  .checklist li { display: flex; gap: 0.75rem; padding: 0.5rem 0; font-size: 0.875rem; align-items: flex-start; border-bottom: 1px solid var(--border); }
  .checklist li:last-child { border-bottom: none; }
  .checklist li::before { content: '→'; color: var(--accent); font-weight: 700; flex-shrink: 0; }

  .revenue-box { background: var(--gold-pale); border-left: 4px solid var(--accent); padding: 1rem 1.25rem; margin: 1rem 0; }
  .revenue-box .rev-amount { font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 900; color: var(--brand); }
  .revenue-box .rev-label { color: var(--muted); font-size: 0.8rem; margin-top: 0.2rem; }

  .cta-box { background: var(--brand); color: white; padding: 1.5rem; margin-top: 1.5rem; text-align: center; }
  .cta-box h3 { font-family: 'Playfair Display', serif; color: white; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; }
  .cta-box p { font-size: 0.8rem; color: #C5D3E3; margin-bottom: 0.75rem; }
  .cta-box a { color: var(--accent); font-weight: 700; }

  .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.75rem; display: flex; justify-content: space-between; }

  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin: 1rem 0 1.5rem; }
  .stat-card { background: var(--bg); border: 1px solid var(--border); border-top: 3px solid var(--brand); padding: 0.75rem 1rem; text-align: center; }
  .stat-card .stat-val { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: var(--brand); line-height: 1.1; }
  .stat-card .stat-val.good { color: var(--green); }
  .stat-card .stat-val.warn { color: var(--yellow); }
  .stat-card .stat-val.bad { color: var(--red); }
  .stat-card .stat-lbl { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-top: 0.25rem; }
  .stat-card .stat-sub { font-size: 0.7rem; color: var(--muted); margin-top: 0.15rem; }
  .stat-check { font-size: 1.1rem; }

  @media (max-width: 600px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* Score trend sparkline */
  .trend-section { margin: 1rem 0 1.5rem; }
  .trend-delta { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
  .trend-delta.up { color: var(--green); }
  .trend-delta.down { color: var(--red); }
  .trend-delta.flat { color: var(--muted); }
  .sparkline { display: flex; gap: 6px; align-items: flex-end; height: 60px; }
  .spark-bar-wrap { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; }
  .spark-bar { background: var(--brand); border-radius: 0; width: 100%; margin-top: auto; min-height: 4px; }
  .spark-bar.current { background: var(--accent); }
  .spark-label { font-size: 0.6rem; color: var(--muted); margin-top: 4px; white-space: nowrap; }

  /* Review velocity */
  .velocity-row { display: flex; gap: 1rem; align-items: center; margin: 0.5rem 0 1rem; font-size: 0.85rem; }
  .velocity-badge { padding: 0.2rem 0.6rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .velocity-badge.active { background: #dcfce7; color: #15803d; }
  .velocity-badge.stalled { background: #fef9c3; color: #854d0e; }
  .velocity-badge.zero { background: #fee2e2; color: #991b1b; }

  /* Score projection */
  .projection-box { background: var(--bg); border: 1px solid var(--border); border-left: 4px solid var(--brand); padding: 1rem 1.25rem; margin: 1rem 0 1.5rem; display: flex; gap: 2rem; align-items: center; flex-wrap: wrap; }
  .proj-current { text-align: center; }
  .proj-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
  .proj-score { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; color: var(--muted); line-height: 1.1; }
  .proj-arrow { font-size: 1.5rem; color: var(--accent); }
  .proj-target { text-align: center; }
  .proj-target .proj-score { color: var(--brand); }
  .proj-delta { font-size: 0.75rem; font-weight: 700; color: var(--green); margin-top: 0.2rem; }
  .proj-note { font-size: 0.75rem; color: var(--muted); flex: 1; min-width: 200px; }

  /* Competitor position */
  .comp-position { background: var(--gold-pale); border-left: 4px solid var(--accent); padding: 1rem 1.25rem; margin: 1rem 0; }
  .comp-rank { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 900; color: var(--brand); margin-bottom: 0.4rem; }
  .comp-key-gaps { font-size: 0.8rem; color: var(--text); margin-top: 0.5rem; }
  .comp-key-gaps li { padding: 0.2rem 0; }

  /* Revenue calculator */
  .calc-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
  .calc-row:last-child { border-bottom: none; }
  .calc-check { width: 16px; height: 16px; cursor: pointer; }
  .calc-label { flex: 1; font-size: 0.85rem; }
  .calc-amount { font-weight: 700; color: var(--accent); white-space: nowrap; font-size: 0.85rem; }
  .calc-total-box { background: var(--brand); color: white; padding: 0.75rem 1rem; margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
  .calc-total-label { font-size: 0.8rem; }
  .calc-total-amount { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 900; color: var(--accent); }

  /* Priority hero — #1 action this week */
  .priority-hero { background: var(--brand); color: white; padding: 1.25rem 1.5rem; margin: 1rem 0 1.5rem; border-left: 5px solid var(--accent); }
  .priority-hero-tag { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent); margin-bottom: 0.4rem; }
  .priority-hero-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 900; color: white; margin-bottom: 0.25rem; }
  .priority-hero-impact { font-size: 0.8rem; color: #C5D3E3; margin-bottom: 0.5rem; }
  .priority-hero-action { font-size: 0.875rem; color: #e2eaf4; margin-bottom: 0.75rem; line-height: 1.5; }
  .priority-hero-links { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .priority-hero-links a { display: inline-block; padding: 0.45rem 1rem; font-size: 0.8rem; font-weight: 700; text-decoration: none; border-radius: 3px; }
  .priority-hero-links a.primary { background: var(--accent); color: var(--brand); }
  .priority-hero-links a.secondary { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); }

  /* Action links on gap items */
  .gap-action { display: inline-block; margin-top: 0.35rem; font-size: 0.75rem; font-weight: 700; color: var(--brand); text-decoration: none; background: var(--bg); border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 3px; white-space: nowrap; }
  .gap-action:hover { background: var(--brand); color: white; }

  @media print {
    body { padding: 0; max-width: 100%; }
    .no-print { display: none !important; }
    .gaps-table, .competitor-table { page-break-inside: avoid; }
    h2 { page-break-after: avoid; }
    .revenue-box, .cta-box, .projection-box, .priority-hero { page-break-inside: avoid; }
    .gap-action { display: none; }
    @page { margin: 1.5cm; size: A4; }
  }
`;

// Revenue calculator JS — shared between client and prospect reports.
// Reads data-low/data-high from each checkbox row, sums checked rows, updates display.
const REVENUE_CALCULATOR_JS = `
<script>
(function() {
  function updateCalc() {
    var rows = document.querySelectorAll('.calc-row');
    var low = 0, high = 0;
    rows.forEach(function(row) {
      var cb = row.querySelector('.calc-check');
      if (cb && cb.checked) {
        low  += parseInt(cb.dataset.low  || 0, 10);
        high += parseInt(cb.dataset.high || 0, 10);
      }
    });
    var el = document.getElementById('calc-total');
    if (el) {
      if (low === 0 && high === 0) {
        el.textContent = '$0';
      } else if (low === high) {
        el.textContent = '$' + low.toLocaleString() + '/mo';
      } else {
        el.textContent = '$' + low.toLocaleString() + '–$' + high.toLocaleString() + '/mo';
      }
    }
  }
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.calc-check').forEach(function(cb) {
      cb.addEventListener('change', updateCalc);
    });
    updateCalc();
  });
})();
</script>`;

// ============================================================
// Shared Helpers
// ============================================================

function scoreBarColor(label) {
  const map = { 'Excellent': '#16a34a', 'Good': '#0891b2', 'Needs Work': '#ca8a04', 'Critical': '#dc2626' };
  return map[label] || '#94a3b8';
}

function scoreCssClass(label) {
  return label.toLowerCase().replace(' ', '-');
}

export function totalRevenueLeak(gaps) {
  const low = gaps.reduce((s, g) => s + (g.revenue_impact?.low || 0), 0);
  const high = gaps.reduce((s, g) => s + (g.revenue_impact?.high || 0), 0);
  return { low, high };
}

function workingItems(fields) {
  const items = [];
  if (fields.rating >= 4.0) items.push(`Rating ${fields.rating} — above local average`);
  if (fields.has_website) items.push('Website linked');
  if (fields.has_phone) items.push('Phone number listed');
  if (fields.has_hours) items.push('Business hours set');
  if (fields.review_count >= 25) items.push(`${fields.review_count} reviews`);
  if (fields.photo_count >= 20) items.push(`${fields.photo_count} photos`);
  if (fields.has_description) items.push('Business description present');
  return items;
}

function profileStatsHtml(fields) {
  const stars = fields.rating ? '★'.repeat(Math.round(fields.rating)) + '☆'.repeat(5 - Math.round(fields.rating)) : '—';
  const ratingClass = fields.rating >= 4.5 ? 'good' : fields.rating >= 4.0 ? '' : fields.rating ? 'warn' : 'bad';
  const reviewClass = fields.review_count >= 100 ? 'good' : fields.review_count >= 25 ? '' : 'warn';
  const photoClass = fields.photo_count >= 20 ? 'good' : fields.photo_count >= 5 ? '' : 'warn';

  const boolCard = (val, label, trueLabel = 'Yes', falseLabel = 'Missing') => `
    <div class="stat-card">
      <div class="stat-val ${val ? 'good' : 'bad'} stat-check">${val ? '✓' : '✗'}</div>
      <div class="stat-lbl">${label}</div>
      <div class="stat-sub">${val ? trueLabel : falseLabel}</div>
    </div>`;

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val ${ratingClass}">${fields.rating ? fields.rating.toFixed(1) : 'N/A'}</div>
        <div class="stat-lbl">⭐ Rating</div>
        <div class="stat-sub">${stars}</div>
      </div>
      <div class="stat-card">
        <div class="stat-val ${reviewClass}">${fields.review_count ?? 0}</div>
        <div class="stat-lbl">Reviews</div>
        <div class="stat-sub">${fields.review_count >= 100 ? 'Strong volume' : fields.review_count >= 25 ? 'Good start' : 'Needs more'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-val ${photoClass}">${fields.photo_count ?? 0}</div>
        <div class="stat-lbl">Photos</div>
        <div class="stat-sub">${fields.photo_count >= 20 ? 'Well-stocked' : fields.photo_count >= 5 ? 'Moderate' : 'Add more'}</div>
      </div>
      ${boolCard(fields.has_website, 'Website', 'Linked', 'Not linked')}
      ${boolCard(fields.has_phone, 'Phone', 'Listed', 'Missing')}
      ${boolCard(fields.has_hours, 'Hours', 'Set', 'Not set')}
      ${boolCard(fields.has_description, 'Description', 'Present', 'Missing')}
      <div class="stat-card">
        <div class="stat-val ${fields.is_open !== false ? 'good' : 'bad'} stat-check">${fields.is_open !== false ? '✓' : '✗'}</div>
        <div class="stat-lbl">Status</div>
        <div class="stat-sub">${fields.is_open !== false ? 'Verified open' : 'Closed/unclear'}</div>
      </div>
    </div>`;
}

function headerHtml(clientName = null) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
    <div class="header">
      <div>
        <div class="header-logo">Engage<span>Engine</span></div>
        <div class="header-tagline">/ Demand Control for Local Business</div>
      </div>
      <div class="header-meta">
        ${clientName ? `<div style="font-weight:700;color:var(--brand)">${clientName}</div>` : ''}
        <div>GBP Health Report</div>
        <div>${date}</div>
      </div>
    </div>`;
}

/**
 * @param {object} audit
 * @param {{ adjustment: number, adjustedScore: number }|null} competitiveAdj
 */
function scoreHtml(audit, competitiveAdj = null) {
  const displayScore = competitiveAdj ? competitiveAdj.adjustedScore : audit.score;
  const displayLabel = scoreLabelFromScore(displayScore);
  const color = scoreBarColor(displayLabel);
  const cls = scoreCssClass(displayLabel);

  const adjBadge = (competitiveAdj && competitiveAdj.adjustment < 0)
    ? `<div style="font-size:0.7rem;color:var(--muted);margin-top:0.3rem">
         Profile: ${audit.score} &nbsp;|&nbsp; Market: <span style="color:var(--red);font-weight:700">${competitiveAdj.adjustment}</span>
       </div>`
    : '';

  return `
    <div class="score-section">
      <div class="score-circle">
        <div class="score-big ${cls}">${displayScore}</div>
        <div style="font-size:0.7rem;color:var(--muted);margin-top:0.1rem">out of 100</div>
        ${adjBadge}
      </div>
      <div class="score-bar-wrap">
        <div class="score-tag" style="color:${color};margin-bottom:0.4rem">MARKET SCORE: ${displayLabel.toUpperCase()}</div>
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.4rem">
          ${competitiveAdj && competitiveAdj.adjustment < 0
            ? `Profile completeness: ${audit.score}/100 · Competitive position penalty: ${competitiveAdj.adjustment} pts`
            : `Profile completeness score — no competitor data to adjust`}
        </div>
        <div class="score-bar-track">
          <div class="score-bar-fill" style="width:${displayScore}%;background:${color}"></div>
        </div>
      </div>
    </div>`;
}

function scoreLabelFromScore(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Critical';
}

function gapsTableHtml(gaps) {
  if (!gaps.length) return '<p style="color:var(--green);font-weight:600">✓ No major gaps found!</p>';
  return `
    <table class="gaps-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Gap</th>
          <th>Est. Monthly Impact</th>
          <th>Priority</th>
        </tr>
      </thead>
      <tbody>
        ${gaps.map((g, i) => `
          <tr>
            <td class="gap-num">${i + 1}</td>
            <td>${g.label}</td>
            <td class="rev-impact">${g.revenue_impact?.display || '—'}</td>
            <td class="sev-${g.severity}">${g.severity.toUpperCase()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

/**
 * Returns the most actionable URL for a given gap type.
 * Review-related gaps: shareable Google review write link (give to customers).
 * All other gaps: Google Business Profile dashboard.
 * @param {string} gapId
 * @param {string|null} placeId
 */
function gbpActionUrl(gapId, placeId) {
  if ((gapId === 'few_reviews' || gapId === 'low_rating') && placeId) {
    return `https://search.google.com/local/writereview?placeid=${placeId}`;
  }
  return 'https://business.google.com/';
}

function gbpActionLabel(gapId) {
  const labels = {
    few_reviews:    'Get Review Link →',
    low_rating:     'Get Review Link →',
    no_photos:      'Add Photos in GBP →',
    few_photos:     'Add Photos in GBP →',
    no_hours:       'Set Hours in GBP →',
    no_website:     'Add Website in GBP →',
    no_phone:       'Add Phone in GBP →',
    closed_listing: 'Reopen Listing →',
    no_description: 'Add Description →',
    no_category:    'Set Category →',
  };
  return labels[gapId] || 'Open GBP Dashboard →';
}

/**
 * "#1 Priority This Week" hero box — most impactful gap with direct action link.
 * @param {Array} gaps - sorted by severity/revenue, first = highest priority
 * @param {string|null} placeId
 */
function priorityHeroHtml(gaps, placeId) {
  if (!gaps || gaps.length === 0) return '';
  const top = gaps[0];
  if (top.competitive) return ''; // Skip if top gap is competitive (no direct action link)

  const actionUrl = gbpActionUrl(top.id, placeId);
  const actionLabel = gbpActionLabel(top.id);
  const isReviewGap = top.id === 'few_reviews' || top.id === 'low_rating';
  const revText = top.revenue_impact?.display
    ? `Estimated impact: <strong>${top.revenue_impact.display}/mo</strong>`
    : '';

  return `
  <div class="priority-hero no-print">
    <div class="priority-hero-tag">★ Your #1 Priority This Week</div>
    <div class="priority-hero-title">${top.label}</div>
    ${revText ? `<div class="priority-hero-impact">${revText}</div>` : ''}
    <div class="priority-hero-action">${top.fix}</div>
    <div class="priority-hero-links">
      <a href="${actionUrl}" target="_blank" class="primary">${actionLabel}</a>
      ${isReviewGap ? `<a href="https://business.google.com/" target="_blank" class="secondary">Open GBP Dashboard →</a>` : ''}
    </div>
  </div>`;
}

function checklistHtml(gaps, placeId = null) {
  // Show all gaps (profile + competitive), mark competitive ones
  return `<ul class="checklist">
    ${gaps.map(g => {
      const prefix = g.competitive ? '<span style="color:var(--red);font-weight:700;font-size:0.75rem;margin-right:0.3rem">⚔ COMPETITIVE</span> ' : '';
      const badge = g.severity === 'high'
        ? '<span style="background:#fee2e2;color:#991b1b;font-size:0.65rem;font-weight:700;padding:1px 5px;margin-right:0.4rem;text-transform:uppercase">High</span>'
        : '<span style="background:#fef9c3;color:#854d0e;font-size:0.65rem;font-weight:700;padding:1px 5px;margin-right:0.4rem;text-transform:uppercase">Med</span>';
      const actionLink = !g.competitive && placeId
        ? `<br><a href="${gbpActionUrl(g.id, placeId)}" target="_blank" class="gap-action no-print">${gbpActionLabel(g.id)}</a>`
        : '';
      return `<li>${badge}${prefix}${g.fix}${actionLink}</li>`;
    }).join('')}
  </ul>`;
}

// ============================================================
// New Section Helpers (competitive intelligence tier)
// ============================================================

/**
 * Competitor position section — shows rank, key metrics vs. leader.
 * @param {object|null} competitorScan - result of scanCompetitors(), or null
 */
function competitorSectionHtml(competitorScan) {
  if (!competitorScan) {
    return `<p style="color:var(--muted);font-size:0.85rem">Competitor data requires a fixed business location. Contact us to add your location to enable competitive benchmarking.</p>`;
  }

  const { subject, competitors, matrix, key_gaps } = competitorScan;
  if (!competitors || competitors.length === 0) {
    return `<p style="color:var(--muted);font-size:0.85rem">No nearby competitors found in Google Places for this business category.</p>`;
  }

  const reviewRank = matrix?.review_count?.subject_rank ?? '?';
  const total = matrix?.review_count?.total ?? (competitors.length + 1);
  const leaderReviews = Math.max(...(matrix?.review_count?.competitors || [0]));
  const leaderPhotos  = Math.max(...(matrix?.photo_count?.competitors || [0]));
  const leaderRating  = Math.max(...(matrix?.rating?.competitors || [0]));
  const subjectReviews = subject.fields.review_count;
  const subjectPhotos  = subject.fields.photo_count;
  const subjectRating  = subject.fields.rating;

  const rankText = `#${reviewRank} of ${total} in your area`;

  function cmp(subj, lead) {
    if (subj >= lead) return `<span class="better">${subj} ✓</span>`;
    return `<span class="worse">${subj} (leader: ${lead})</span>`;
  }

  return `
  <div class="comp-position">
    <div class="comp-rank">${rankText}</div>
    <div style="font-size:0.8rem;color:var(--muted);margin-bottom:0.5rem">Based on review volume vs. nearby ${subject.category || 'competitors'}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;font-size:0.85rem">
      <div><strong>Reviews:</strong> ${cmp(subjectReviews, leaderReviews)}</div>
      <div><strong>Photos:</strong>  ${cmp(subjectPhotos,  leaderPhotos)}</div>
      <div><strong>Rating:</strong>  ${cmp(subjectRating,  leaderRating)}</div>
    </div>
    ${key_gaps?.length ? `<ul class="comp-key-gaps">${key_gaps.map(g => `<li>⚠ ${g}</li>`).join('')}</ul>` : ''}
  </div>`;
}

/**
 * Score trend sparkline + delta headline.
 * Only renders if auditHistory has >= 2 entries.
 * @param {Array<{score, review_count, audit_date}>} auditHistory - sorted ASC
 */
function scoreTrendHtml(auditHistory) {
  if (!auditHistory || auditHistory.length < 2) return '';

  const maxScore = Math.max(...auditHistory.map(h => h.score), 1);
  const first = auditHistory[0];
  const prev  = auditHistory[auditHistory.length - 2];
  const curr  = auditHistory[auditHistory.length - 1];
  const delta = curr.score - prev.score;
  const totalDelta = curr.score - first.score;

  const deltaClass = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const deltaText  = delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '→ No change';
  const totalText  = totalDelta > 0 ? ` (▲ +${totalDelta} since we started)` : totalDelta < 0 ? ` (▼ ${totalDelta} since we started)` : '';

  const bars = auditHistory.map((h, i) => {
    const pct = Math.round((h.score / maxScore) * 100);
    const isCurrent = i === auditHistory.length - 1;
    const month = new Date(h.audit_date).toLocaleDateString('en-US', { month: 'short' });
    return `<div class="spark-bar-wrap">
      <div class="spark-bar${isCurrent ? ' current' : ''}" style="height:${pct}%"></div>
      <div class="spark-label">${month}</div>
    </div>`;
  }).join('');

  return `
  <div class="trend-section">
    <div class="trend-delta ${deltaClass}">Score: ${curr.score} — ${deltaText} from last scan${totalText}</div>
    <div class="sparkline">${bars}</div>
  </div>`;
}

/**
 * Review velocity metric — derived from audit history.
 * Returns empty string if < 2 audit entries.
 * @param {Array<{score, review_count, audit_date}>} auditHistory - sorted ASC
 */
function reviewVelocityHtml(auditHistory) {
  if (!auditHistory || auditHistory.length < 2) return '';

  const prev = auditHistory[auditHistory.length - 2];
  const curr = auditHistory[auditHistory.length - 1];

  if (prev.review_count == null || curr.review_count == null) return '';

  const reviewDelta = curr.review_count - prev.review_count;
  const daysBetween = Math.max(
    1,
    (new Date(curr.audit_date) - new Date(prev.audit_date)) / (1000 * 60 * 60 * 24)
  );
  const perWeek = (reviewDelta / daysBetween * 7).toFixed(1);

  const badgeClass = reviewDelta > 4 ? 'active' : reviewDelta > 0 ? 'stalled' : 'zero';
  const trend = reviewDelta > 0 ? `+${reviewDelta} in last scan period (+${perWeek}/week)` : reviewDelta === 0 ? 'No new reviews since last scan' : `${reviewDelta} reviews since last scan`;

  return `
  <div class="velocity-row">
    <span class="velocity-badge ${badgeClass}">${badgeClass === 'active' ? 'Growing' : badgeClass === 'stalled' ? 'Slow' : 'Stalled'}</span>
    <span>Review velocity: ${trend}</span>
  </div>`;
}

/**
 * Score projection — shows projected score if top 3 gaps are resolved.
 * Uses exported scoring functions from audit.js for accuracy.
 * Returns empty string if no gaps.
 * @param {object} audit - AuditResult
 * @param {number} [topN=3] - number of gaps to resolve
 */
function scoreProjectionHtml(audit, topN = 3) {
  const { projectedScore, delta, resolvedGaps } = scoreProjectionForTest(audit, topN);
  if (delta <= 0) return ''; // no gaps or already near optimal

  const projLabel = projectedScore >= 85 ? 'Excellent' : projectedScore >= 70 ? 'Good' : 'Needs Work';
  const gapNames = resolvedGaps.map(g => g.label).join(', ');

  return `
  <div class="projection-box">
    <div class="proj-current">
      <div class="proj-label">Current</div>
      <div class="proj-score">${audit.score}</div>
    </div>
    <div class="proj-arrow">→</div>
    <div class="proj-target">
      <div class="proj-label">Fix top ${topN}</div>
      <div class="proj-score">${projectedScore}</div>
      <div class="proj-delta">▲ +${delta} pts · ${projLabel}</div>
    </div>
    <div class="proj-note">
      <strong>Ceiling estimate</strong> — assumes top ${topN} gaps fully closed (independent calculation).<br>
      <span style="font-size:0.7rem">Fix: ${gapNames}</span>
    </div>
  </div>`;
}

/**
 * Testable projection computation — same logic as scoreProjectionHtml but returns
 * a plain object instead of HTML. Used by unit tests and the HTML renderer.
 * @param {object} audit
 * @param {number} [topN=3]
 * @returns {{ projectedScore: number, delta: number, resolvedGaps: Array }}
 */
export function scoreProjectionForTest(audit, topN = 3) {
  const gaps = audit.gaps || [];
  if (gaps.length === 0) return { projectedScore: audit.score, delta: 0, resolvedGaps: [] };

  const projected = { ...audit.fields };
  const resolvedGaps = gaps.slice(0, topN);

  for (const gap of resolvedGaps) {
    switch (gap.id) {
      case 'few_reviews':      projected.review_count = 100;  break;
      case 'low_rating':       projected.rating = 4.3;        break;
      case 'no_photos':        projected.photo_count = 50;    break;
      case 'few_photos':       projected.photo_count = 50;    break;
      case 'no_hours':         projected.has_hours = true;    break;
      case 'no_website':       projected.has_website = true;  break;
      case 'no_phone':         projected.has_phone = true;    break;
      case 'no_description':   projected.has_description = true; break;
      case 'no_category':      projected.primary_category_set = true; break;
      case 'closed_listing':   projected.is_open = true;      break;
    }
  }

  let projectedScore = 0;
  projectedScore += scoreRating(projected.rating);
  projectedScore += scoreReviews(projected.review_count);
  projectedScore += scorePhotos(projected.photo_count);
  projectedScore += projected.has_hours       ? 10 : 0;
  projectedScore += projected.has_website     ? 10 : 0;
  projectedScore += projected.has_phone       ? 10 : 0;
  projectedScore += projected.has_description ? 10 : 0;
  projectedScore += projected.primary_category_set ? 10 : 0;
  projectedScore += projected.is_open         ?  5 : 0;
  projectedScore = Math.min(projectedScore, 100);

  return { projectedScore, delta: projectedScore - audit.score, resolvedGaps };
}

/**
 * Revenue calculator — interactive gap checklist with running total.
 * All gaps pre-checked by default. Requires REVENUE_CALCULATOR_JS injected in <head>.
 * @param {Array} gaps
 * @param {string} calendarUrl
 */
function revenueCalculatorHtml(gaps, calendarUrl) {
  if (!gaps || gaps.length === 0) return '';

  const rows = gaps.map(g => {
    const low  = g.revenue_impact?.low  || 0;
    const high = g.revenue_impact?.high || 0;
    return `<div class="calc-row">
      <input type="checkbox" class="calc-check no-print" checked data-low="${low}" data-high="${high}">
      <div class="calc-label">${g.label}</div>
      <div class="calc-amount">${g.revenue_impact?.display || '—'}</div>
    </div>`;
  }).join('');

  const totalLeak = gaps.reduce((s, g) => s + (g.revenue_impact?.low || 0), 0);
  const totalHigh  = gaps.reduce((s, g) => s + (g.revenue_impact?.high || 0), 0);
  const initDisplay = totalLeak === 0 ? '$0' : `$${totalLeak.toLocaleString()}–$${totalHigh.toLocaleString()}/mo`;

  return `
  <div class="no-print" style="margin-bottom:0.25rem;font-size:0.75rem;color:var(--muted)">Check/uncheck gaps to see your opportunity</div>
  ${rows}
  <div class="calc-total-box">
    <div class="calc-total-label">Selected monthly opportunity</div>
    <div class="calc-total-amount" id="calc-total">${initDisplay}</div>
  </div>
  ${calendarUrl ? `<div style="text-align:center;margin-top:0.75rem"><a href="${calendarUrl}" style="font-weight:700;color:var(--brand)">Book a call to fix these gaps →</a></div>` : ''}`;
}

// ============================================================
// Client Report
// ============================================================

export function renderClientReport({ audit, clientName, competitors, auditHistory }) {
  const working = workingItems(audit.fields);

  // Compute competitive adjustment — merges competitive gaps into the gap list
  const compAdj = computeCompetitiveAdjustment(audit.score, competitors);
  const allGaps = [...audit.gaps, ...compAdj.competitive_gaps];
  const leak = totalRevenueLeak(allGaps);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GBP Health Report — ${audit.business_name}</title>
  ${GOOGLE_FONTS}
  <style>${SHARED_CSS}</style>
  ${REVENUE_CALCULATOR_JS}
</head>
<body>
  ${headerHtml(clientName || audit.business_name)}

  <h1>${audit.business_name}</h1>
  <div style="color:var(--muted);font-size:0.85rem;margin-bottom:0.5rem">${audit.address || ''}</div>

  ${scoreHtml(audit, compAdj.adjustment !== 0 ? compAdj : null)}

  ${scoreTrendHtml(auditHistory)}
  ${reviewVelocityHtml(auditHistory)}

  ${priorityHeroHtml(allGaps, audit.place_id)}

  ${scoreProjectionHtml(audit)}

  <h2>Competitive Position</h2>
  ${competitorSectionHtml(competitors)}

  <h2>Profile Snapshot</h2>
  ${profileStatsHtml(audit.fields)}

  ${working.length ? `
  <h2>What's Working</h2>
  <ul class="working-list">
    ${working.map(w => `<li>${w}</li>`).join('')}
  </ul>` : ''}

  ${allGaps.length ? `
  <h2>Revenue Opportunity Calculator</h2>
  <div style="color:var(--muted);font-size:0.8rem;margin-bottom:0.75rem">
    Estimated combined monthly impact: <strong style="color:var(--accent)">${formatRevenue(leak.low, leak.high)}</strong> — check/uncheck gaps to build your plan.
  </div>
  ${revenueCalculatorHtml(allGaps, null)}` : ''}

  ${allGaps.length ? `
  <h2>Action Plan</h2>
  <div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.5rem">Sorted by priority. Items marked ⚔ are competitive gaps vs. your local market.</div>
  ${checklistHtml(allGaps, audit.place_id)}` : ''}

  <div class="footer">
    <span>Prepared by EngageEngine · engageengine.com</span>
    <span>Confidential — for ${clientName || audit.business_name} only</span>
  </div>
</body>
</html>`;
}

// ============================================================
// Prospect Report (sales-framed)
// ============================================================

export function renderProspectReport({ audit, competitors, calendarUrl = 'https://calendly.com/engageengine' }) {
  const leak = totalRevenueLeak(audit.gaps);
  const top3 = audit.gaps.slice(0, 3);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demand Gap Analysis — ${audit.business_name}</title>
  ${GOOGLE_FONTS}
  <style>${SHARED_CSS}</style>
  ${REVENUE_CALCULATOR_JS}
</head>
<body>
  ${headerHtml(null)}

  <h1>Demand Gap Analysis</h1>
  <div style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem">${audit.business_name} — Prepared ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>

  ${scoreHtml(audit)}

  <div style="color:var(--muted);font-size:0.875rem;margin-top:-0.5rem;margin-bottom:1rem">
    Your profile is capturing an estimated <strong>${audit.score}%</strong> of the demand available to your business.
  </div>

  ${priorityHeroHtml(audit.gaps, audit.place_id)}

  ${scoreProjectionHtml(audit)}

  <h2>Competitive Position</h2>
  ${competitorSectionHtml(competitors)}

  <h2>Profile Snapshot</h2>
  ${profileStatsHtml(audit.fields)}

  <h2>Estimated Monthly Revenue Leaking</h2>
  <div class="revenue-box">
    <div class="rev-amount">${formatRevenue(leak.low, leak.high)}</div>
    <div class="rev-label">based on your top ${top3.length} profile gaps vs. industry benchmarks</div>
  </div>

  <h2>Interactive Revenue Calculator</h2>
  <div style="color:var(--muted);font-size:0.8rem;margin-bottom:0.75rem">Select the gaps you want to close and see your opportunity.</div>
  ${revenueCalculatorHtml(top3, calendarUrl)}

  ${top3.length ? `
  <h2>Your 30-Day Action Plan</h2>
  <ul class="checklist">
    ${top3.map((g, i) => {
      const actionLink = !g.competitive && audit.place_id
        ? ` <a href="${gbpActionUrl(g.id, audit.place_id)}" target="_blank" style="font-size:0.75rem;font-weight:700;color:var(--brand);text-decoration:none;background:var(--bg);border:1px solid var(--border);padding:0.15rem 0.5rem;border-radius:3px;margin-left:0.4rem">${gbpActionLabel(g.id)}</a>`
        : '';
      return `<li><strong>${i + 1}.</strong> ${g.fix}${actionLink}</li>`;
    }).join('')}
  </ul>` : ''}

  <div class="cta-box">
    <h3>Ready to Stop the Leak?</h3>
    <p>EngageEngine manages Google Business Profiles for 40+ local businesses in South Carolina.<br>Most clients see measurable improvement within 30 days.</p>
    <a href="${calendarUrl}">Schedule a Free 15-Minute Strategy Call →</a>
  </div>

  <div class="footer">
    <span>EngageEngine · engageengine.com</span>
    <span>Revenue estimates based on BrightLocal, Womply, Uberall &amp; Google research</span>
  </div>
</body>
</html>`;
}

// ============================================================
// Comparison Report
// ============================================================

export function renderComparisonReport(subject, competitors) {
  const metrics = ['rating', 'review_count', 'photo_count'];
  const metricLabels = { rating: 'Rating', review_count: 'Reviews', photo_count: 'Photos' };

  const allProfiles = [subject, ...competitors];

  function rankClass(val, vals, higher = true) {
    const sorted = [...vals].sort((a, b) => higher ? b - a : a - b);
    const rank = sorted.indexOf(val);
    if (rank === 0) return 'better';
    if (rank === vals.length - 1) return 'worse';
    return '';
  }

  const metricRows = metrics.map(m => {
    const vals = allProfiles.map(p => p.fields[m] ?? 0);
    return `<tr>
      <td><strong>${metricLabels[m]}</strong></td>
      ${allProfiles.map((p, i) => {
        const val = p.fields[m] ?? 0;
        const cls = rankClass(val, vals, m !== 'low_rating');
        const subj = i === 0 ? 'style="background:#eff6ff"' : '';
        return `<td class="${cls}" ${subj}>${val}</td>`;
      }).join('')}
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Competitor Comparison — ${subject.business_name}</title>
  ${GOOGLE_FONTS}
  <style>${SHARED_CSS}</style>
</head>
<body>
  ${headerHtml(null)}

  <h1>Competitor Gap Analysis</h1>
  <div style="color:var(--muted);font-size:0.85rem;margin-bottom:1.5rem">${subject.business_name} vs. top ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''}</div>

  <h2>Head-to-Head Comparison</h2>
  <table class="competitor-table">
    <thead>
      <tr>
        <th>Metric</th>
        <th style="background:#1e4d7a">${subject.business_name} (YOU)</th>
        ${competitors.map(c => `<th>${c.business_name}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${metricRows}
      <tr>
        <td><strong>Demand Score</strong></td>
        ${allProfiles.map((p, i) => {
          const subj = i === 0 ? 'style="background:#eff6ff;font-weight:700"' : '';
          return `<td ${subj}>${p.score} <span style="font-size:0.7rem;color:var(--muted)">(${p.score_label})</span></td>`;
        }).join('')}
      </tr>
    </tbody>
  </table>

  ${subject.gaps.length ? `
  <h2>Your Gaps vs. Competitors</h2>
  ${gapsTableHtml(subject.gaps.slice(0, 5))}` : ''}

  <div class="footer">
    <span>EngageEngine · engageengine.com</span>
    <span>Data via Google Places API · ${new Date().toLocaleDateString()}</span>
  </div>
</body>
</html>`;
}

// ============================================================
// Standalone Checklist Report
// ============================================================

/**
 * Renders a printable, prioritized improvement checklist for a client.
 * Groups gaps: High priority → Medium → Competitive gaps.
 * Each item includes the issue, revenue impact, and specific action.
 *
 * @param {object} audit - AuditResult
 * @param {string} clientName
 * @param {object|null} competitorScan - optional, adds competitive gaps
 */
export function renderChecklist({ audit, clientName, competitorScan = null }) {
  const compAdj = computeCompetitiveAdjustment(audit.score, competitorScan);
  const allGaps = [...audit.gaps, ...compAdj.competitive_gaps];

  const highGaps   = allGaps.filter(g => g.severity === 'high');
  const mediumGaps = allGaps.filter(g => g.severity === 'medium');

  const totalLow  = audit.gaps.reduce((s, g) => s + (g.revenue_impact?.low  || 0), 0);
  const totalHigh = audit.gaps.reduce((s, g) => s + (g.revenue_impact?.high || 0), 0);

  const placeId = audit.place_id || null;

  function item(g, n) {
    const revDisplay = g.revenue_impact?.display
      ? `<span style="font-weight:700;color:var(--accent)">${g.revenue_impact.display}</span>`
      : g.competitive
        ? `<span style="font-size:0.75rem;color:var(--muted)">Competitive gap</span>`
        : '';
    const actionLink = !g.competitive && placeId
      ? `<a href="${gbpActionUrl(g.id, placeId)}" target="_blank" style="display:inline-block;margin-top:0.4rem;font-size:0.75rem;font-weight:700;color:var(--brand);text-decoration:none;background:var(--bg);border:1px solid var(--border);padding:0.2rem 0.6rem;border-radius:3px">${gbpActionLabel(g.id)}</a>`
      : '';
    return `
    <div style="display:flex;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid var(--border);align-items:flex-start;page-break-inside:avoid">
      <div style="min-width:24px;height:24px;border:2px solid var(--brand);border-radius:3px;flex-shrink:0;margin-top:2px"></div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap">
          <div style="font-weight:700;font-size:0.9rem">${n}. ${g.label}</div>
          ${revDisplay}
        </div>
        <div style="font-size:0.82rem;color:var(--text);margin-top:0.3rem;line-height:1.5">${g.fix}</div>
        ${g.revenue_impact?.basis ? `<div style="font-size:0.7rem;color:var(--muted);margin-top:0.2rem;font-style:italic">${g.revenue_impact.basis}</div>` : ''}
        ${actionLink}
      </div>
    </div>`;
  }

  let counter = 1;
  const highItems   = highGaps.map(g   => item(g, counter++)).join('');
  const mediumItems = mediumGaps.map(g => item(g, counter++)).join('');

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GBP Improvement Checklist — ${clientName || audit.business_name}</title>
  ${GOOGLE_FONTS}
  <style>
    ${SHARED_CSS}
    @media print {
      .no-print { display: none !important; }
      body { padding: 1.5cm; }
    }
  </style>
</head>
<body>
  ${headerHtml(clientName || audit.business_name)}

  <h1 style="margin-bottom:0.25rem">${clientName || audit.business_name}</h1>
  <div style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem">${audit.address || ''} · Checklist generated ${date}</div>

  <!-- Score + revenue summary -->
  <div style="display:flex;gap:1rem;margin:1rem 0 1.5rem;flex-wrap:wrap">
    <div class="stat-card" style="flex:1;min-width:120px">
      <div class="stat-val ${audit.score >= 90 ? 'good' : audit.score >= 70 ? '' : audit.score >= 50 ? 'warn' : 'bad'}">${compAdj.adjustment !== 0 ? compAdj.adjustedScore : audit.score}</div>
      <div class="stat-lbl">Market Score</div>
      ${compAdj.adjustment !== 0 ? `<div class="stat-sub">Profile: ${audit.score} · Market adj: ${compAdj.adjustment}</div>` : ''}
    </div>
    <div class="stat-card" style="flex:1;min-width:120px">
      <div class="stat-val warn">${allGaps.length}</div>
      <div class="stat-lbl">Open Items</div>
      <div class="stat-sub">${highGaps.length} high · ${mediumGaps.length} medium</div>
    </div>
    ${totalLow > 0 ? `
    <div class="stat-card" style="flex:1;min-width:160px;border-top-color:var(--accent)">
      <div class="stat-val" style="color:var(--accent);font-size:1.1rem">$${totalLow.toLocaleString()}–$${totalHigh.toLocaleString()}/mo</div>
      <div class="stat-lbl">Monthly Revenue at Risk</div>
      <div class="stat-sub">Estimated from profile gaps</div>
    </div>` : ''}
  </div>

  <div class="no-print" style="margin-bottom:1.5rem">
    <button onclick="window.print()" style="background:var(--brand);color:white;border:none;padding:0.6rem 1.5rem;font-size:0.9rem;font-weight:700;cursor:pointer;letter-spacing:0.05em">🖨 Print / Save as PDF</button>
  </div>

  ${highGaps.length ? `
  <h2 style="color:var(--red)">Priority 1 — Fix These First</h2>
  <div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.75rem">These gaps have the highest revenue and ranking impact. Fix before anything else.</div>
  ${highItems}` : ''}

  ${mediumGaps.length ? `
  <h2 style="margin-top:1.5rem">Priority 2 — Important</h2>
  <div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.75rem">Complete after Priority 1. Each item meaningfully improves your profile completeness and ranking signals.</div>
  ${mediumItems}` : ''}

  ${!allGaps.length ? `<p style="color:var(--green);font-weight:600;font-size:1rem">✓ No open gaps — this profile is in excellent shape.</p>` : ''}

  <div style="margin-top:2rem;padding:1rem;background:var(--bg);border:1px solid var(--border);font-size:0.8rem;color:var(--muted)">
    <strong style="color:var(--text)">About these estimates:</strong> Revenue impact ranges are derived from published GBP research (BrightLocal, Womply, Uberall, Google) and represent estimated monthly revenue at risk from each gap. Actual results vary by market, competition level, and business type. Competitive gaps are calculated relative to nearby businesses in the same category.
  </div>

  <div class="footer">
    <span>Prepared by EngageEngine · engageengine.com</span>
    <span>${date}</span>
  </div>
</body>
</html>`;
}
