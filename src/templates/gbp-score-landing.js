/**
 * Public lead magnet landing page.
 * Returned as a JS template function so it can be imported by the Worker.
 * No external dependencies — vanilla HTML/CSS only.
 */

export function gbpScoreLandingHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Google Profile Score | EngageEngine</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --brand: #1a3a5c;
      --accent: #e8521a;
      --accent-light: #fff3ee;
      --green: #16a34a;
      --yellow: #ca8a04;
      --red: #dc2626;
      --text: #1e293b;
      --muted: #64748b;
      --border: #e2e8f0;
      --bg: #f8fafc;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }

    header {
      background: var(--brand);
      color: white;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    header .logo { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.5px; }
    header .tagline { font-size: 0.8rem; opacity: 0.7; margin-top: 1px; }

    .hero {
      text-align: center;
      padding: 3rem 1.5rem 2rem;
      max-width: 640px;
      margin: 0 auto;
    }
    .hero h1 {
      font-size: clamp(1.5rem, 4vw, 2.25rem);
      font-weight: 800;
      color: var(--brand);
      line-height: 1.2;
      margin-bottom: 0.75rem;
    }
    .hero h1 em { color: var(--accent); font-style: normal; }
    .hero p { color: var(--muted); font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; }

    .trust-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--accent-light);
      color: var(--accent);
      border-radius: 999px;
      padding: 0.3rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .search-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 2rem;
      max-width: 480px;
      margin: 0 auto 2rem;
    }
    .search-card label { display: block; font-weight: 600; font-size: 0.875rem; margin-bottom: 0.4rem; color: var(--brand); }
    .search-card input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      margin-bottom: 1rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-card input:focus { border-color: var(--accent); }
    .btn-primary {
      width: 100%;
      padding: 0.875rem;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: #c94415; }
    .btn-primary:disabled { background: var(--muted); cursor: not-allowed; }

    /* Results section (hidden until score fetched) */
    #results { display: none; max-width: 480px; margin: 0 auto; }

    .score-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 1.5rem;
      margin-bottom: 1rem;
      text-align: center;
    }
    .score-biz { font-size: 1rem; font-weight: 600; color: var(--muted); margin-bottom: 0.25rem; }
    .score-num { font-size: 4rem; font-weight: 900; line-height: 1; }
    .score-num.excellent { color: var(--green); }
    .score-num.good { color: #0891b2; }
    .score-num.needs-work { color: var(--yellow); }
    .score-num.critical { color: var(--red); }
    .score-label-text { font-size: 0.9rem; font-weight: 600; margin-top: 0.25rem; color: var(--muted); }
    .score-bar-track { background: var(--border); border-radius: 999px; height: 10px; margin: 1rem 0 0.25rem; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 999px; transition: width 0.8s ease; }

    .leaks-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .leaks-card h3 { font-size: 0.85rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    .gap-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
    .gap-item:last-child { border-bottom: none; }
    .gap-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; white-space: nowrap; }
    .gap-badge.high { background: #fee2e2; color: var(--red); }
    .gap-badge.medium { background: #fef3c7; color: var(--yellow); }
    .gap-label { font-size: 0.9rem; flex: 1; }
    .gap-money { font-size: 0.8rem; color: var(--muted); font-style: italic; }

    .urgency { color: var(--accent); font-weight: 600; text-align: center; margin-bottom: 1rem; font-size: 0.9rem; }

    .capture-card {
      background: var(--brand);
      color: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .capture-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; }
    .capture-card p { font-size: 0.875rem; opacity: 0.8; margin-bottom: 1rem; }
    .capture-card input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      margin-bottom: 0.75rem;
      outline: none;
    }
    .btn-capture {
      width: 100%;
      padding: 0.875rem;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-capture:disabled { opacity: 0.6; cursor: not-allowed; }

    #success-msg { display: none; text-align: center; padding: 1.5rem; background: white; border-radius: 12px; margin-bottom: 2rem; }
    #success-msg h3 { color: var(--green); font-size: 1.1rem; margin-bottom: 0.5rem; }
    #success-msg p { color: var(--muted); font-size: 0.9rem; }

    #error-msg { color: var(--red); text-align: center; font-size: 0.875rem; margin-top: -0.5rem; margin-bottom: 0.75rem; display: none; }

    footer { text-align: center; padding: 2rem 1rem; color: var(--muted); font-size: 0.8rem; }
    footer a { color: var(--brand); text-decoration: none; }
  </style>
</head>
<body>

<header>
  <div>
    <div class="logo">EngageEngine</div>
    <div class="tagline">Demand Control for Local Business</div>
  </div>
</header>

<main>
  <div class="hero">
    <div class="trust-badge">✓ Trusted by 40+ local businesses in South Carolina</div>
    <h1>Is Your Google Profile <em>Losing You Customers?</em></h1>
    <p>Get your free GBP Score in 10 seconds. No signup required. See exactly where your profile is costing you business.</p>
  </div>

  <div class="search-card">
    <label for="biz-query">Business Name + City</label>
    <input type="text" id="biz-query" placeholder="e.g. Stormy Plumbing Lexington SC" autocomplete="off">
    <div id="error-msg"></div>
    <button class="btn-primary" id="score-btn" onclick="fetchScore()">Score My Profile →</button>
  </div>

  <div id="results">
    <div class="score-card">
      <div class="score-biz" id="biz-name"></div>
      <div class="score-num" id="score-num"></div>
      <div class="score-label-text" id="score-label"></div>
      <div class="score-bar-track">
        <div class="score-bar-fill" id="score-bar"></div>
      </div>
      <div style="font-size:0.75rem;color:var(--muted);text-align:right">out of 100</div>
    </div>

    <div class="leaks-card">
      <h3>Top Profile Gaps Found</h3>
      <div id="gaps-list"></div>
    </div>

    <div class="urgency">⚠️ Every day without fixing this is revenue left on the table.</div>

    <div class="capture-card" id="capture-card">
      <h3>Get Your Full Revenue Impact Report</h3>
      <p>We'll email you the complete analysis including exact dollar estimates for each gap — free.</p>
      <input type="text" id="contact-name" placeholder="Your name">
      <input type="email" id="contact-email" placeholder="Your email address">
      <input type="tel" id="contact-phone" placeholder="Phone (optional)">
      <button class="btn-capture" id="capture-btn" onclick="submitLead()">Send My Free Report →</button>
    </div>

    <div id="success-msg">
      <h3>✓ Your Report Is On Its Way!</h3>
      <p>Check your inbox within 5 minutes for the full revenue impact analysis.<br>
         Want to talk through it? <a href="https://calendly.com/engageengine">Book a free 15-min call →</a></p>
    </div>
  </div>
</main>

<footer>
  <p>&copy; 2026 EngageEngine · <a href="https://marketingperformance.net">marketingperformance.net</a></p>
</footer>

<script>
  let currentPlaceId = null;

  async function fetchScore() {
    const q = document.getElementById('biz-query').value.trim();
    const errEl = document.getElementById('error-msg');
    const btn = document.getElementById('score-btn');

    errEl.style.display = 'none';
    if (!q) { showError('Enter a business name and city.'); return; }

    btn.disabled = true;
    btn.textContent = 'Searching…';

    try {
      const res = await fetch('/api/gbp-score?q=' + encodeURIComponent(q));
      const data = await res.json();

      if (!res.ok) { showError(data.error || 'Something went wrong. Try again.'); return; }

      currentPlaceId = data.place_id;
      renderScore(data);
    } catch (e) {
      showError('Network error. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Score My Profile →';
    }
  }

  function renderScore(data) {
    document.getElementById('biz-name').textContent = data.business_name;

    const scoreEl = document.getElementById('score-num');
    scoreEl.textContent = data.score;
    const cls = data.score_label.toLowerCase().replace(' ', '-');
    scoreEl.className = 'score-num ' + cls;

    document.getElementById('score-label').textContent = data.score_label;

    const barColors = { excellent: '#16a34a', good: '#0891b2', 'needs-work': '#ca8a04', critical: '#dc2626' };
    const bar = document.getElementById('score-bar');
    bar.style.width = data.score + '%';
    bar.style.background = barColors[cls] || '#94a3b8';

    const gapsList = document.getElementById('gaps-list');
    gapsList.innerHTML = data.top_gaps.map(g => \`
      <div class="gap-item">
        <span class="gap-badge \${g.severity}">\${g.severity.toUpperCase()}</span>
        <span class="gap-label">\${g.label}</span>
        <span class="gap-money">$ hidden</span>
      </div>
    \`).join('');

    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function submitLead() {
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const btn = document.getElementById('capture-btn');

    if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return; }
    if (!currentPlaceId) { alert('Please search for a business first.'); return; }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: currentPlaceId, name, email, phone }),
      });
      const data = await res.json();

      if (res.ok) {
        document.getElementById('capture-card').style.display = 'none';
        document.getElementById('success-msg').style.display = 'block';
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Send My Free Report →';
      }
    } catch {
      alert('Network error. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Send My Free Report →';
    }
  }

  function showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.style.display = 'block';
  }

  // Allow Enter key to trigger search
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('biz-query').addEventListener('keydown', e => {
      if (e.key === 'Enter') fetchScore();
    });
  });
</script>

</body>
</html>`;
}
