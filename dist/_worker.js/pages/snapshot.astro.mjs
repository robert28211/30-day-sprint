globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, n as defineScriptVars, h as addAttribute, m as maybeRenderHead } from '../chunks/astro/server_rcS3mgi-.mjs';
import { $ as $$Base } from '../chunks/Base_3mlfhRBP.mjs';
import { $ as $$Footer } from '../chunks/Footer_Dh8ykHt2.mjs';
import { $ as $$ProofCards } from '../chunks/ProofCards_DzMRHvky.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://marketingperformance.net");
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const snapshotCards = [
    { trade: "Pools", loc: "Columbia", num: "+26%", unit: "more installs", market: "while pools fell 50%", down: true },
    { trade: "Docks & decks", loc: "Santee Cooper", num: "+23%", unit: "more builds", market: "while the market shrank", down: true },
    { trade: "Masonry", loc: "Columbia", num: "+18%", unit: "more jobs", market: "in a flat market", down: false },
    { trade: "Landscape design", loc: "Columbia", num: "+21%", unit: "more jobs", market: "in a flat market", down: false },
    { trade: "Water-well", loc: "Columbia", num: "+14%", unit: "more jobs", market: "in a flat market", down: false },
    { trade: "Handyman", loc: "Columbia", num: "+23%", unit: "more jobs", market: "in a flat market", down: false },
    { trade: "Plumbing", loc: "Columbia", num: "+27%", unit: "more jobs", market: "in a slow market", down: false },
    { trade: "Glass", loc: "Columbia", num: "+16%", unit: "more jobs", market: "in a slow market", down: false },
    { trade: "Dumpster rental", loc: "Columbia & Augusta", num: "+23%", unit: "more hauls", market: "in a flat market", down: false }
  ];
  const cf = Astro2.locals.runtime?.cf;
  const detectedCity = cf?.city || "";
  const detectedRegion = cf?.region || cf?.regionCode || "";
  const detectedLocation = detectedCity ? detectedRegion ? `${detectedCity}, ${detectedRegion}` : detectedCity : "";
  const displayMarket = detectedLocation || "your market";
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "See If Your Trade Is Still Open \u2014 Marketing Performance Group", "description": "One company per trade, per market. Type your trade and your city to see the work moving in your market and whether your seat is still open. 41 years in the industry, 31 running Marketing Performance.", "data-astro-cid-bphc7w6l": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template(["  ", '<nav class="mp-nav" data-astro-cid-bphc7w6l> <div class="mp-nav-inner" data-astro-cid-bphc7w6l> <a href="/" class="mp-logo" data-astro-cid-bphc7w6l> <img src="/mp-logo-v3.png" alt="Marketing Performance \u2014 Powered by EngageEngine\u2122" width="217" height="44" data-astro-cid-bphc7w6l> </a> </div> </nav> <main class="mp" data-astro-cid-bphc7w6l> <!-- \u2550\u2550\u2550 1. HERO \u2014 copy left, LIVE FORM right \u2550\u2550\u2550 --> <section class="mp-hero" data-astro-cid-bphc7w6l> <div class="mp-hero-grid" data-astro-cid-bphc7w6l> <div class="mp-hero-copy" data-astro-cid-bphc7w6l> <h1 class="mp-h1" data-astro-cid-bphc7w6l>\nOne company per trade in ', `.<br data-astro-cid-bphc7w6l>See if yours is still open.
</h1> <p class="mp-hero-punch" data-astro-cid-bphc7w6l>
Type your trade. We'll show you the work moving in your market, and whether the seat is still yours to take.
</p> </div> <!-- SEAT-CHECK TOOL \u2014 market size + seat status, computed live --> <div class="snap-card" id="snap-form-card" data-astro-cid-bphc7w6l> <div class="snap-card-head" data-astro-cid-bphc7w6l> <span class="snap-card-eye" data-astro-cid-bphc7w6l>Free Market Check</span> <span class="snap-card-loc" data-astro-cid-bphc7w6l>`, '</span> </div> <form id="snapshot-form" class="snap-form" novalidate data-astro-cid-bphc7w6l> <label class="snap-field-label" for="service-input" data-astro-cid-bphc7w6l>Your trade</label> <input type="text" name="trade" id="service-input" placeholder="Roofing, plumbing, landscaping\u2026" required class="snap-input" autocomplete="off" inputmode="text" data-astro-cid-bphc7w6l> <label class="snap-field-label" for="city-input" data-astro-cid-bphc7w6l>Your market</label> <input type="text" name="city" id="city-input" placeholder="City, state" required class="snap-input" autocomplete="off"', ` data-astro-cid-bphc7w6l> <button type="submit" class="snap-btn" id="snap-submit" data-astro-cid-bphc7w6l> <span data-astro-cid-bphc7w6l>Check my market</span> <span class="snap-btn-arrow" data-astro-cid-bphc7w6l>\u2192</span> </button> <div class="snap-scarcity" data-astro-cid-bphc7w6l> <span class="snap-scarcity-dot" data-astro-cid-bphc7w6l></span> <span data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>One company per trade, per market.</strong> Once your competitor locks it, you can't.</span> </div> </form> <!-- Result, filled by JS after Check my market --> <div class="snap-result" id="snap-result" hidden data-astro-cid-bphc7w6l></div> </div> </div> </section> <!-- \u2550\u2550\u2550 1.5 PROOF \u2014 Share-Line wall (the other 9 trades, not the home page's) \u2550\u2550\u2550 --> <section class="mp-proof" data-astro-cid-bphc7w6l> <header class="mp-proof-head" data-animate data-astro-cid-bphc7w6l> <h2 class="mp-proof-h" data-astro-cid-bphc7w6l>The market didn't grow. Our clients did.</h2> </header> </section> `, ` <!-- Sections 2-9 removed 2026-07-17: this is a lean landing page supporting the home page, not a second site. Proof/founder/engine/results/guarantee/pricing all live on / now. --> <!-- \u2550\u2550\u2550 10. CLOSE \u2014 CTA scrolls to top form \u2550\u2550\u2550 --> <section class="mp-close" data-astro-cid-bphc7w6l> <h2 class="mp-close-h1" data-animate data-astro-cid-bphc7w6l>One company per trade. Per market.</h2> <p class="mp-close-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>The only question is whether yours is still open.</p> <p class="mp-close-body" data-animate data-delay="0.1" data-astro-cid-bphc7w6l>Every month this runs without you, the contractor across town is booking the jobs the market isn't creating. The day he locks your trade, we start sending him the work. Check your market now.</p> <div class="mp-close-cta" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <a href="#snap-form-card" class="mp-btn-primary" id="close-cta" data-astro-cid-bphc7w6l>See If My Trade Is Still Open</a> <p class="mp-micro" data-astro-cid-bphc7w6l>30 seconds. No email.</p> </div> </section> </main> `, " <script>(function(){", `
    // \u2500\u2500 Market model (Census households x per-trade rate x avg job value) \u2500\u2500
    const TRADES = {
      'metal roof': { rate: 0.04, job: 12000, label: 'metal roofing' },
      roofing:      { rate: 0.04,  job: 10000, label: 'roofing' },
      roof:         { rate: 0.04,  job: 10000, label: 'roofing' },
      gutter:       { rate: 0.035, job: 1850,  label: 'gutter' },
      plumb:        { rate: 0.18,  job: 425,   label: 'plumbing' },
      hvac:         { rate: 0.10,  job: 900,   label: 'HVAC' },
      'landscape design': { rate: 0.035, job: 7000, label: 'landscape design' },
      landscap:     { rate: 0.25,  job: 1400,  label: 'landscaping' },
      lawn:         { rate: 0.25,  job: 1400,  label: 'lawn care' },
      irrigation:   { rate: 0.10,  job: 1600,  label: 'irrigation' },
      window:       { rate: 0.05,  job: 6500,  label: 'window & door' },
      door:         { rate: 0.05,  job: 6500,  label: 'window & door' },
      fenc:         { rate: 0.03,  job: 4200,  label: 'fencing' },
      well:         { rate: 0.015, job: 7500,  label: 'water-well drilling' },
      drill:        { rate: 0.015, job: 7500,  label: 'water-well drilling' },
      paint:        { rate: 0.08,  job: 2600,  label: 'painting' },
      mason:        { rate: 0.04,  job: 6500,  label: 'masonry' },
      stone:        { rate: 0.04,  job: 6500,  label: 'stone & masonry' },
      pool:         { rate: 0.008, job: 55000, label: 'pool' },
      glass:        { rate: 0.07,  job: 425,   label: 'glass' },
      dumpster:     { rate: 0.02,  job: 475,   label: 'dumpster rental' },
      handyman:     { rate: 0.40,  job: 650,   label: 'handyman' },
      deck:         { rate: 0.03,  job: 8000,  label: 'deck & dock' },
      dock:         { rate: 0.03,  job: 8000,  label: 'deck & dock' },
    };
    const DEFAULT_TRADE = { rate: 0.06, job: 3000, label: '' };

    // Owner-occupied single-family households by metro (Census-derived).
    const METROS = {
      'columbia':     { hh: 195000,  label: 'Columbia' },
      'charleston':   { hh: 219000,  label: 'Charleston' },
      'greenville':   { hh: 247000,  label: 'Greenville' },
      'myrtle':       { hh: 166000,  label: 'Myrtle Beach' },
      'florence':     { hh: 120000,  label: 'Florence' },
      'augusta':      { hh: 143000,  label: 'Augusta' },
      'atlanta':      { hh: 1361000, label: 'Atlanta' },
      'charlotte':    { hh: 620000,  label: 'Charlotte' },
      'raleigh':      { hh: 520000,  label: 'Raleigh' },
      'savannah':     { hh: 130000,  label: 'Savannah' },
    };
    const DEFAULT_METRO_HH = 180000;

    // Seats already held (trade label | metro key) \u2014 the real book.
    const TAKEN = {
      'roofing|columbia':1,'gutter|columbia':1,'plumbing|columbia':1,'landscaping|columbia':1,
      'lawn care|columbia':1,'landscape design|columbia':1,'fencing|columbia':1,
      'water-well drilling|columbia':1,'masonry|columbia':1,'stone & masonry|columbia':1,
      'pool|columbia':1,'glass|columbia':1,'painting|columbia':1,'window & door|columbia':1,
      'dumpster rental|columbia':1,'handyman|columbia':1,'deck & dock|columbia':1,
      'fencing|charleston':1,'masonry|charleston':1,'stone & masonry|charleston':1,
      'water-well drilling|greenville':1,'pool|myrtle':1,'pool|florence':1,
      'dumpster rental|augusta':1,'metal roofing|atlanta':1,
    };

    const form    = document.getElementById('snapshot-form');
    const tInput  = document.getElementById('service-input');
    const cInput  = document.getElementById('city-input');
    const result  = document.getElementById('snap-result');
    const closeCta = document.getElementById('close-cta');

    const params = new URLSearchParams(window.location.search);
    const pTrade = params.get('trade') || params.get('service') || '';
    if (pTrade && tInput) tInput.value = pTrade;
    const pCity = params.get('city_state') || params.get('city') || '';
    if (pCity && cInput && !cInput.value) cInput.value = pCity;

    closeCta?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('snap-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => tInput?.focus(), 500);
    });

    function matchTrade(s) {
      s = s.toLowerCase();
      for (const k in TRADES) { if (s.includes(k)) return TRADES[k]; }
      return { ...DEFAULT_TRADE, label: s.trim() };
    }
    function matchMetro(s) {
      const low = s.toLowerCase();
      for (const k in METROS) { if (low.includes(k)) return { ...METROS[k], key: k }; }
      const label = (s.split(',')[0] || 'your market').trim().replace(/\\b\\w/g, c => c.toUpperCase());
      return { hh: DEFAULT_METRO_HH, label, key: label.toLowerCase(), est: true };
    }
    function fmtMoney(n) {
      if (n >= 1e6) return '$' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
      return '$' + Math.round(n / 1000) + 'K';
    }
    const esc = (v) => (v || '').replace(/[<>"]/g, '');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const tv = (tInput.value || '').trim();
      const cv = (cInput.value || '').trim();
      if (!tv) { tInput.focus(); return; }
      if (!cv) { cInput.focus(); return; }

      const trade = matchTrade(tv);
      const metro = matchMetro(cv);
      const tl = trade.label || tv.toLowerCase();
      const jobs = Math.round((metro.hh * trade.rate) / 100) * 100;
      const value = jobs * trade.job;
      const taken = !!TAKEN[tl + '|' + metro.key];

      if (typeof gtag !== 'undefined') gtag('event', 'market_check', { market: cv, trade: tv });
      if (typeof fbq !== 'undefined') fbq('track', 'Lead', { content_name: 'Market Check', content_category: tv });

      const status = taken
        ? '<div class="snap-r-status snap-r-taken"><strong>This seat is taken.</strong> A ' + tl + ' company already holds ' + metro.label + '. That is the whole point. When the other guy calls, we tell him it is gone.</div>'
        : '<div class="snap-r-status snap-r-open"><strong>Your trade is still open in ' + metro.label + '.</strong> Lock it, and the guy across town can\\'t.</div>';

      const btnLabel = taken ? 'Get on the list for ' + metro.label : 'Lock ' + metro.label;

      result.innerHTML =
        '<p class="snap-r-eye">' + metro.label + (metro.est ? ' (est.)' : '') + ' &middot; ' + tl + '</p>' +
        '<p class="snap-r-num">~' + jobs.toLocaleString() + '</p>' +
        '<p class="snap-r-unit">' + tl + ' jobs a year in this market</p>' +
        '<p class="snap-r-val">About ' + fmtMoney(value) + ' in ' + tl + ' work a year. The market isn\\'t making more of it. It is getting split.</p>' +
        status +
        '<form id="lock-form" class="snap-lock">' +
          '<input type="hidden" name="trade" value="' + esc(tv) + '" />' +
          '<input type="hidden" name="market" value="' + esc(cv) + '" />' +
          '<input type="hidden" name="request_type" value="lock_market" />' +
          '<input type="text" name="name" placeholder="Your name" required class="snap-input" autocomplete="name" />' +
          '<input type="email" name="email" placeholder="Email" required class="snap-input" autocomplete="email" />' +
          '<input type="tel" name="phone" placeholder="Phone" required class="snap-input" autocomplete="tel" />' +
          '<button type="submit" class="snap-btn"><span>' + btnLabel + '</span><span class="snap-btn-arrow">&rarr;</span></button>' +
          '<p class="snap-micro">We confirm availability and call you. No obligation.</p>' +
        '</form>';
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      const lockForm = document.getElementById('lock-form');
      lockForm?.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const btn = lockForm.querySelector('button');
        const span = btn.querySelector('span');
        btn.disabled = true; span.textContent = 'Sending\u2026';
        try {
          await fetch('https://formspree.io/f/mgodnjje', {
            method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(lockForm),
          });
          if (typeof gtag !== 'undefined') gtag('event', 'lock_market_submit', { market: cv, trade: tv });
          if (typeof fbq !== 'undefined') fbq('track', 'Lead', { content_name: 'Lock Market', content_category: tv });
          result.innerHTML = '<p class="snap-r-eye">' + metro.label + ' &middot; ' + tl + '</p><p class="snap-r-num">&check;</p><p class="snap-r-unit">You are in. We confirm ' + metro.label + ' is open and call you.</p>';
        } catch (err) {
          btn.disabled = false; span.textContent = 'Try again';
        }
      });
    });
  })();<\/script> `], ["  ", '<nav class="mp-nav" data-astro-cid-bphc7w6l> <div class="mp-nav-inner" data-astro-cid-bphc7w6l> <a href="/" class="mp-logo" data-astro-cid-bphc7w6l> <img src="/mp-logo-v3.png" alt="Marketing Performance \u2014 Powered by EngageEngine\u2122" width="217" height="44" data-astro-cid-bphc7w6l> </a> </div> </nav> <main class="mp" data-astro-cid-bphc7w6l> <!-- \u2550\u2550\u2550 1. HERO \u2014 copy left, LIVE FORM right \u2550\u2550\u2550 --> <section class="mp-hero" data-astro-cid-bphc7w6l> <div class="mp-hero-grid" data-astro-cid-bphc7w6l> <div class="mp-hero-copy" data-astro-cid-bphc7w6l> <h1 class="mp-h1" data-astro-cid-bphc7w6l>\nOne company per trade in ', `.<br data-astro-cid-bphc7w6l>See if yours is still open.
</h1> <p class="mp-hero-punch" data-astro-cid-bphc7w6l>
Type your trade. We'll show you the work moving in your market, and whether the seat is still yours to take.
</p> </div> <!-- SEAT-CHECK TOOL \u2014 market size + seat status, computed live --> <div class="snap-card" id="snap-form-card" data-astro-cid-bphc7w6l> <div class="snap-card-head" data-astro-cid-bphc7w6l> <span class="snap-card-eye" data-astro-cid-bphc7w6l>Free Market Check</span> <span class="snap-card-loc" data-astro-cid-bphc7w6l>`, '</span> </div> <form id="snapshot-form" class="snap-form" novalidate data-astro-cid-bphc7w6l> <label class="snap-field-label" for="service-input" data-astro-cid-bphc7w6l>Your trade</label> <input type="text" name="trade" id="service-input" placeholder="Roofing, plumbing, landscaping\u2026" required class="snap-input" autocomplete="off" inputmode="text" data-astro-cid-bphc7w6l> <label class="snap-field-label" for="city-input" data-astro-cid-bphc7w6l>Your market</label> <input type="text" name="city" id="city-input" placeholder="City, state" required class="snap-input" autocomplete="off"', ` data-astro-cid-bphc7w6l> <button type="submit" class="snap-btn" id="snap-submit" data-astro-cid-bphc7w6l> <span data-astro-cid-bphc7w6l>Check my market</span> <span class="snap-btn-arrow" data-astro-cid-bphc7w6l>\u2192</span> </button> <div class="snap-scarcity" data-astro-cid-bphc7w6l> <span class="snap-scarcity-dot" data-astro-cid-bphc7w6l></span> <span data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>One company per trade, per market.</strong> Once your competitor locks it, you can't.</span> </div> </form> <!-- Result, filled by JS after Check my market --> <div class="snap-result" id="snap-result" hidden data-astro-cid-bphc7w6l></div> </div> </div> </section> <!-- \u2550\u2550\u2550 1.5 PROOF \u2014 Share-Line wall (the other 9 trades, not the home page's) \u2550\u2550\u2550 --> <section class="mp-proof" data-astro-cid-bphc7w6l> <header class="mp-proof-head" data-animate data-astro-cid-bphc7w6l> <h2 class="mp-proof-h" data-astro-cid-bphc7w6l>The market didn't grow. Our clients did.</h2> </header> </section> `, ` <!-- Sections 2-9 removed 2026-07-17: this is a lean landing page supporting the home page, not a second site. Proof/founder/engine/results/guarantee/pricing all live on / now. --> <!-- \u2550\u2550\u2550 10. CLOSE \u2014 CTA scrolls to top form \u2550\u2550\u2550 --> <section class="mp-close" data-astro-cid-bphc7w6l> <h2 class="mp-close-h1" data-animate data-astro-cid-bphc7w6l>One company per trade. Per market.</h2> <p class="mp-close-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>The only question is whether yours is still open.</p> <p class="mp-close-body" data-animate data-delay="0.1" data-astro-cid-bphc7w6l>Every month this runs without you, the contractor across town is booking the jobs the market isn't creating. The day he locks your trade, we start sending him the work. Check your market now.</p> <div class="mp-close-cta" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <a href="#snap-form-card" class="mp-btn-primary" id="close-cta" data-astro-cid-bphc7w6l>See If My Trade Is Still Open</a> <p class="mp-micro" data-astro-cid-bphc7w6l>30 seconds. No email.</p> </div> </section> </main> `, " <script>(function(){", `
    // \u2500\u2500 Market model (Census households x per-trade rate x avg job value) \u2500\u2500
    const TRADES = {
      'metal roof': { rate: 0.04, job: 12000, label: 'metal roofing' },
      roofing:      { rate: 0.04,  job: 10000, label: 'roofing' },
      roof:         { rate: 0.04,  job: 10000, label: 'roofing' },
      gutter:       { rate: 0.035, job: 1850,  label: 'gutter' },
      plumb:        { rate: 0.18,  job: 425,   label: 'plumbing' },
      hvac:         { rate: 0.10,  job: 900,   label: 'HVAC' },
      'landscape design': { rate: 0.035, job: 7000, label: 'landscape design' },
      landscap:     { rate: 0.25,  job: 1400,  label: 'landscaping' },
      lawn:         { rate: 0.25,  job: 1400,  label: 'lawn care' },
      irrigation:   { rate: 0.10,  job: 1600,  label: 'irrigation' },
      window:       { rate: 0.05,  job: 6500,  label: 'window & door' },
      door:         { rate: 0.05,  job: 6500,  label: 'window & door' },
      fenc:         { rate: 0.03,  job: 4200,  label: 'fencing' },
      well:         { rate: 0.015, job: 7500,  label: 'water-well drilling' },
      drill:        { rate: 0.015, job: 7500,  label: 'water-well drilling' },
      paint:        { rate: 0.08,  job: 2600,  label: 'painting' },
      mason:        { rate: 0.04,  job: 6500,  label: 'masonry' },
      stone:        { rate: 0.04,  job: 6500,  label: 'stone & masonry' },
      pool:         { rate: 0.008, job: 55000, label: 'pool' },
      glass:        { rate: 0.07,  job: 425,   label: 'glass' },
      dumpster:     { rate: 0.02,  job: 475,   label: 'dumpster rental' },
      handyman:     { rate: 0.40,  job: 650,   label: 'handyman' },
      deck:         { rate: 0.03,  job: 8000,  label: 'deck & dock' },
      dock:         { rate: 0.03,  job: 8000,  label: 'deck & dock' },
    };
    const DEFAULT_TRADE = { rate: 0.06, job: 3000, label: '' };

    // Owner-occupied single-family households by metro (Census-derived).
    const METROS = {
      'columbia':     { hh: 195000,  label: 'Columbia' },
      'charleston':   { hh: 219000,  label: 'Charleston' },
      'greenville':   { hh: 247000,  label: 'Greenville' },
      'myrtle':       { hh: 166000,  label: 'Myrtle Beach' },
      'florence':     { hh: 120000,  label: 'Florence' },
      'augusta':      { hh: 143000,  label: 'Augusta' },
      'atlanta':      { hh: 1361000, label: 'Atlanta' },
      'charlotte':    { hh: 620000,  label: 'Charlotte' },
      'raleigh':      { hh: 520000,  label: 'Raleigh' },
      'savannah':     { hh: 130000,  label: 'Savannah' },
    };
    const DEFAULT_METRO_HH = 180000;

    // Seats already held (trade label | metro key) \u2014 the real book.
    const TAKEN = {
      'roofing|columbia':1,'gutter|columbia':1,'plumbing|columbia':1,'landscaping|columbia':1,
      'lawn care|columbia':1,'landscape design|columbia':1,'fencing|columbia':1,
      'water-well drilling|columbia':1,'masonry|columbia':1,'stone & masonry|columbia':1,
      'pool|columbia':1,'glass|columbia':1,'painting|columbia':1,'window & door|columbia':1,
      'dumpster rental|columbia':1,'handyman|columbia':1,'deck & dock|columbia':1,
      'fencing|charleston':1,'masonry|charleston':1,'stone & masonry|charleston':1,
      'water-well drilling|greenville':1,'pool|myrtle':1,'pool|florence':1,
      'dumpster rental|augusta':1,'metal roofing|atlanta':1,
    };

    const form    = document.getElementById('snapshot-form');
    const tInput  = document.getElementById('service-input');
    const cInput  = document.getElementById('city-input');
    const result  = document.getElementById('snap-result');
    const closeCta = document.getElementById('close-cta');

    const params = new URLSearchParams(window.location.search);
    const pTrade = params.get('trade') || params.get('service') || '';
    if (pTrade && tInput) tInput.value = pTrade;
    const pCity = params.get('city_state') || params.get('city') || '';
    if (pCity && cInput && !cInput.value) cInput.value = pCity;

    closeCta?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('snap-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => tInput?.focus(), 500);
    });

    function matchTrade(s) {
      s = s.toLowerCase();
      for (const k in TRADES) { if (s.includes(k)) return TRADES[k]; }
      return { ...DEFAULT_TRADE, label: s.trim() };
    }
    function matchMetro(s) {
      const low = s.toLowerCase();
      for (const k in METROS) { if (low.includes(k)) return { ...METROS[k], key: k }; }
      const label = (s.split(',')[0] || 'your market').trim().replace(/\\\\b\\\\w/g, c => c.toUpperCase());
      return { hh: DEFAULT_METRO_HH, label, key: label.toLowerCase(), est: true };
    }
    function fmtMoney(n) {
      if (n >= 1e6) return '$' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
      return '$' + Math.round(n / 1000) + 'K';
    }
    const esc = (v) => (v || '').replace(/[<>"]/g, '');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const tv = (tInput.value || '').trim();
      const cv = (cInput.value || '').trim();
      if (!tv) { tInput.focus(); return; }
      if (!cv) { cInput.focus(); return; }

      const trade = matchTrade(tv);
      const metro = matchMetro(cv);
      const tl = trade.label || tv.toLowerCase();
      const jobs = Math.round((metro.hh * trade.rate) / 100) * 100;
      const value = jobs * trade.job;
      const taken = !!TAKEN[tl + '|' + metro.key];

      if (typeof gtag !== 'undefined') gtag('event', 'market_check', { market: cv, trade: tv });
      if (typeof fbq !== 'undefined') fbq('track', 'Lead', { content_name: 'Market Check', content_category: tv });

      const status = taken
        ? '<div class="snap-r-status snap-r-taken"><strong>This seat is taken.</strong> A ' + tl + ' company already holds ' + metro.label + '. That is the whole point. When the other guy calls, we tell him it is gone.</div>'
        : '<div class="snap-r-status snap-r-open"><strong>Your trade is still open in ' + metro.label + '.</strong> Lock it, and the guy across town can\\\\'t.</div>';

      const btnLabel = taken ? 'Get on the list for ' + metro.label : 'Lock ' + metro.label;

      result.innerHTML =
        '<p class="snap-r-eye">' + metro.label + (metro.est ? ' (est.)' : '') + ' &middot; ' + tl + '</p>' +
        '<p class="snap-r-num">~' + jobs.toLocaleString() + '</p>' +
        '<p class="snap-r-unit">' + tl + ' jobs a year in this market</p>' +
        '<p class="snap-r-val">About ' + fmtMoney(value) + ' in ' + tl + ' work a year. The market isn\\\\'t making more of it. It is getting split.</p>' +
        status +
        '<form id="lock-form" class="snap-lock">' +
          '<input type="hidden" name="trade" value="' + esc(tv) + '" />' +
          '<input type="hidden" name="market" value="' + esc(cv) + '" />' +
          '<input type="hidden" name="request_type" value="lock_market" />' +
          '<input type="text" name="name" placeholder="Your name" required class="snap-input" autocomplete="name" />' +
          '<input type="email" name="email" placeholder="Email" required class="snap-input" autocomplete="email" />' +
          '<input type="tel" name="phone" placeholder="Phone" required class="snap-input" autocomplete="tel" />' +
          '<button type="submit" class="snap-btn"><span>' + btnLabel + '</span><span class="snap-btn-arrow">&rarr;</span></button>' +
          '<p class="snap-micro">We confirm availability and call you. No obligation.</p>' +
        '</form>';
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      const lockForm = document.getElementById('lock-form');
      lockForm?.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const btn = lockForm.querySelector('button');
        const span = btn.querySelector('span');
        btn.disabled = true; span.textContent = 'Sending\u2026';
        try {
          await fetch('https://formspree.io/f/mgodnjje', {
            method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(lockForm),
          });
          if (typeof gtag !== 'undefined') gtag('event', 'lock_market_submit', { market: cv, trade: tv });
          if (typeof fbq !== 'undefined') fbq('track', 'Lead', { content_name: 'Lock Market', content_category: tv });
          result.innerHTML = '<p class="snap-r-eye">' + metro.label + ' &middot; ' + tl + '</p><p class="snap-r-num">&check;</p><p class="snap-r-unit">You are in. We confirm ' + metro.label + ' is open and call you.</p>';
        } catch (err) {
          btn.disabled = false; span.textContent = 'Try again';
        }
      });
    });
  })();<\/script> `])), maybeRenderHead(), displayMarket, detectedLocation ? `Detected: ${detectedLocation}` : "Enter your market", addAttribute(detectedLocation, "value"), renderComponent($$result2, "ProofCards", $$ProofCards, { "cards": snapshotCards, "foot": "Nine different trades. Same story: the market isn't making new jobs, so every extra one came off a competitor's schedule.", "data-astro-cid-bphc7w6l": true }), renderComponent($$result2, "Footer", $$Footer, { "data-astro-cid-bphc7w6l": true }), defineScriptVars({ detectedLocation })) })}  <!-- Global styles for the JS-injected seat-check result (Astro scopes normal <style>, so innerHTML content needs is:global) --> `;
}, "/Users/robbiebutt/.claude/worktrees/video-hub/src/pages/snapshot/index.astro", void 0);

const $$file = "/Users/robbiebutt/.claude/worktrees/video-hub/src/pages/snapshot/index.astro";
const $$url = "/snapshot";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
