globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, n as defineScriptVars, g as addAttribute, m as maybeRenderHead } from '../chunks/astro/server_CdzYR9DH.mjs';
import { $ as $$Base } from '../chunks/Base_BSRx0yRe.mjs';
import { $ as $$Footer } from '../chunks/Footer_C93osjOD.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const cf = Astro2.locals.runtime?.cf;
  const detectedCity = cf?.city || "";
  const detectedRegion = cf?.region || cf?.regionCode || "";
  const detectedLocation = detectedCity ? detectedRegion ? `${detectedCity}, ${detectedRegion}` : detectedCity : "";
  const displayMarket = detectedLocation || "your market";
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "See If Your Trade Is Still Open \u2014 Marketing Performance Group", "description": "One company per trade, per market. Type your trade and your city to see the work moving in your market and whether your seat is still open. 41 years in the industry, 31 running Marketing Performance.", "data-astro-cid-bphc7w6l": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template(["  ", '<nav class="mp-nav" data-astro-cid-bphc7w6l> <div class="mp-nav-inner" data-astro-cid-bphc7w6l> <a href="/" class="mp-logo" data-astro-cid-bphc7w6l>\nMarketing Performance Group\n<span class="mp-logo-sub" data-astro-cid-bphc7w6l>Powered by EngageEngine\u2122</span> </a> </div> </nav> <main class="mp" data-astro-cid-bphc7w6l> <!-- \u2550\u2550\u2550 1. HERO \u2014 copy left, LIVE FORM right \u2550\u2550\u2550 --> <section class="mp-hero" data-astro-cid-bphc7w6l> <div class="mp-hero-grid" data-astro-cid-bphc7w6l> <div class="mp-hero-copy" data-astro-cid-bphc7w6l> <h1 class="mp-h1" data-astro-cid-bphc7w6l>\nOne company per trade in ', `.<br data-astro-cid-bphc7w6l>See if yours is still open.
</h1> <p class="mp-hero-punch" data-astro-cid-bphc7w6l>
Type your trade. We'll show you the work moving in your market, and whether the seat is still yours to take.
</p> </div> <!-- SEAT-CHECK TOOL \u2014 market size + seat status, computed live --> <div class="snap-card" id="snap-form-card" data-astro-cid-bphc7w6l> <div class="snap-card-head" data-astro-cid-bphc7w6l> <span class="snap-card-eye" data-astro-cid-bphc7w6l>Free Market Check</span> <span class="snap-card-loc" data-astro-cid-bphc7w6l>`, '</span> </div> <form id="snapshot-form" class="snap-form" novalidate data-astro-cid-bphc7w6l> <label class="snap-field-label" for="service-input" data-astro-cid-bphc7w6l>Your trade</label> <input type="text" name="trade" id="service-input" placeholder="Roofing, plumbing, landscaping\u2026" required class="snap-input" autocomplete="off" inputmode="text" data-astro-cid-bphc7w6l> <label class="snap-field-label" for="city-input" data-astro-cid-bphc7w6l>Your market</label> <input type="text" name="city" id="city-input" placeholder="City, state" required class="snap-input" autocomplete="off"', ` data-astro-cid-bphc7w6l> <button type="submit" class="snap-btn" id="snap-submit" data-astro-cid-bphc7w6l> <span data-astro-cid-bphc7w6l>Check my market</span> <span class="snap-btn-arrow" data-astro-cid-bphc7w6l>\u2192</span> </button> <div class="snap-scarcity" data-astro-cid-bphc7w6l> <span class="snap-scarcity-dot" data-astro-cid-bphc7w6l></span> <span data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>One company per trade, per market.</strong> Once your competitor locks it, you can't.</span> </div> </form> <!-- Result, filled by JS after Check my market --> <div class="snap-result" id="snap-result" hidden data-astro-cid-bphc7w6l></div> </div> </div> </section> <!-- \u2550\u2550\u2550 1.5 PROOF \u2014 Share Line, no names \u2550\u2550\u2550 --> <section class="mp-proof" data-astro-cid-bphc7w6l> <header class="mp-proof-head" data-animate data-astro-cid-bphc7w6l> <h2 class="mp-proof-h" data-astro-cid-bphc7w6l>The market didn't grow. Our clients did.</h2> </header> <div class="mp-proof-inner" data-animate data-delay="0.1" data-astro-cid-bphc7w6l> <p class="mp-lede mp-center" data-astro-cid-bphc7w6l>A Columbia landscaper booked 40% more jobs in two years while his market stayed flat. A pool builder grew installs 26% while the pool market lost half its volume. That work came off their competitors' schedules. One company per trade, per market.</p> </div> </section> <!-- \u2550\u2550\u2550 2. HERO-ANCHOR TESTIMONIAL \u2550\u2550\u2550 --> <section class="mp-anchor" data-astro-cid-bphc7w6l> <div class="mp-anchor-inner" data-animate data-astro-cid-bphc7w6l> <div class="mp-anchor-photo" data-astro-cid-bphc7w6l> <img src="/img/rogerson.jpg" alt="McClintock HVAC" width="80" height="80" loading="lazy" decoding="async" data-astro-cid-bphc7w6l> </div> <div class="mp-anchor-body" data-astro-cid-bphc7w6l> <p class="mp-anchor-quote" data-astro-cid-bphc7w6l>"Our cost per click dropped over 70%, clicks and engagement went up on our website, and in 30 days we doubled our booked appointments."</p> <p class="mp-anchor-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>McClintock HVAC</strong> \xB7 Charlotte, NC</p> <div class="mp-anchor-stats" data-astro-cid-bphc7w6l> <span data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>70%</strong> lower cost per click</span> <span class="mp-dot" data-astro-cid-bphc7w6l>\xB7</span> <span data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>2\xD7</strong> booked appointments</span> <span class="mp-dot" data-astro-cid-bphc7w6l>\xB7</span> <span data-astro-cid-bphc7w6l>30 days</span> </div> </div> </div> </section> <!-- \u2550\u2550\u2550 3. FOUNDER \u2550\u2550\u2550 --> <section class="mp-founder" data-astro-cid-bphc7w6l> <div class="mp-founder-inner" data-animate data-astro-cid-bphc7w6l> <img src="/img/robbie-butt.jpg" alt="Robbie Butt, Founder of EngageEngine\u2122" class="mp-founder-photo" loading="lazy" decoding="async" width="280" height="527" data-astro-cid-bphc7w6l> <div class="mp-founder-body" data-astro-cid-bphc7w6l> <p class="mp-founder-eye" data-astro-cid-bphc7w6l>The Founder</p> <h2 class="mp-founder-name" data-astro-cid-bphc7w6l>Robbie Butt</h2> <p class="mp-founder-title" data-astro-cid-bphc7w6l>Founder, EngageEngine\u2122 \xB7 41 years in this industry</p> <p class="mp-founder-quote" data-astro-cid-bphc7w6l>"I personally sign every client. If it doesn't work, I keep working. That's been the deal for 31 years."</p> <p class="mp-founder-cred" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>31 years in business. Zero refunds.</strong> Not because we don't offer them \u2014 because we don't need to.</p> </div> </div> </section> <!-- \u2550\u2550\u2550 4. PRODUCT CLARITY \u2550\u2550\u2550 --> <section class="mp-clarity" data-astro-cid-bphc7w6l> <div class="mp-section-head" data-astro-cid-bphc7w6l> <p class="mp-eye" data-animate data-astro-cid-bphc7w6l>What This Is</p> <h2 class="mp-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>EngageEngine\u2122 is a fully managed service.</h2> <p class="mp-lede" data-animate data-delay="0.1" data-astro-cid-bphc7w6l>Not software. Not a dashboard. Not another platform to learn. We do the work. You tell us your market and your service \u2014 we handle audience building, ad placement, optimization, and reporting.</p> </div> <div class="mp-intel-wrap" data-animate data-delay="0.15" data-astro-cid-bphc7w6l> <img src="/img/intelligence-layer.webp" alt="The Intelligence Layer \u2014 input data, the engine, and the outputs that find buyers before they call" class="mp-intel" loading="lazy" decoding="async" width="1536" height="1024" data-astro-cid-bphc7w6l> </div> <div class="mp-do-grid" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <div class="mp-do-col mp-do-yes" data-astro-cid-bphc7w6l> <p class="mp-do-h" data-astro-cid-bphc7w6l>Here's what you do</p> <ul data-astro-cid-bphc7w6l> <li data-astro-cid-bphc7w6l><span class="mp-do-mark" data-astro-cid-bphc7w6l>\u2713</span> Tell us your service area</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark" data-astro-cid-bphc7w6l>\u2713</span> Tell us what a good job looks like</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark" data-astro-cid-bphc7w6l>\u2713</span> Answer the calls</li> </ul> </div> <div class="mp-do-col mp-do-no" data-astro-cid-bphc7w6l> <p class="mp-do-h" data-astro-cid-bphc7w6l>Here's what you don't</p> <ul data-astro-cid-bphc7w6l> <li data-astro-cid-bphc7w6l><span class="mp-do-mark mp-mark-x" data-astro-cid-bphc7w6l>\u2715</span> Manage campaigns</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark mp-mark-x" data-astro-cid-bphc7w6l>\u2715</span> Build audiences</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark mp-mark-x" data-astro-cid-bphc7w6l>\u2715</span> Touch the platform</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark mp-mark-x" data-astro-cid-bphc7w6l>\u2715</span> Learn another dashboard</li> </ul> </div> </div> <p class="mp-fit-line" data-animate data-delay="0.25" data-astro-cid-bphc7w6l>Built for service businesses doing <strong data-astro-cid-bphc7w6l>$500K\u2013$5M/year in revenue</strong>.</p> </section> <!-- \u2550\u2550\u2550 5. HOW IT WORKS \u2550\u2550\u2550 --> <section class="mp-engine" data-astro-cid-bphc7w6l> <div class="mp-section-head" data-astro-cid-bphc7w6l> <p class="mp-eye" data-animate data-astro-cid-bphc7w6l>Inside The Engine</p> <h2 class="mp-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>Five layers. One engine.</h2> </div> <img src="/ee-explode.webp" alt="EngageEngine \u2014 five-layer system" class="mp-explode" loading="lazy" decoding="async" width="1536" height="1024" data-animate data-delay="0.15" data-astro-cid-bphc7w6l> <div class="mp-modules" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>01</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We find them</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>45,000+ data sources tell us who in your market is searching for your service this week.</div> </div> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>02</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We match them</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>Custom audiences built daily \u2014 matched to your service, your geography, and the kind of job you want.</div> </div> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>03</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We reach them</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>Your ads run on Google, Meta, and programmatic \u2014 in front of the same people, across every channel.</div> </div> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>04</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We learn from them</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>Every closed job feeds back in. The system gets sharper every week about what a real customer looks like.</div> </div> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>05</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We prove it</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>Every lead traced from first signal to closed job. You always see exactly what's working \u2014 and what it cost.</div> </div> </div> <p class="mp-timeline" data-animate data-delay="0.25" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>Most clients are live within 72 hours of the diagnostic.</strong></p> <div class="mp-status" data-animate data-delay="0.3" data-astro-cid-bphc7w6l> <p class="mp-status-cap" data-astro-cid-bphc7w6l>Live system performance \u2014 across all active client accounts</p> <div class="mp-status-rows" data-astro-cid-bphc7w6l> <div class="mp-status-row" data-astro-cid-bphc7w6l><span data-astro-cid-bphc7w6l>System Status</span><span class="mp-status-v" data-astro-cid-bphc7w6l>ACTIVE</span></div> <div class="mp-status-row" data-astro-cid-bphc7w6l><span data-astro-cid-bphc7w6l>Cost Reduction vs. Platform-Native</span><span class="mp-status-v" data-astro-cid-bphc7w6l>67\u201390%</span></div> <div class="mp-status-row" data-astro-cid-bphc7w6l><span data-astro-cid-bphc7w6l>Attribution</span><span class="mp-status-v" data-astro-cid-bphc7w6l>CLOSED LOOP</span></div> <div class="mp-status-row" data-astro-cid-bphc7w6l><span data-astro-cid-bphc7w6l>Audiences</span><span class="mp-status-v" data-astro-cid-bphc7w6l>REFRESHED DAILY</span></div> </div> </div> </section> <!-- \u2550\u2550\u2550 6. MECHANISM TESTIMONIAL \u2014 removed pending replacement \u2550\u2550\u2550 --> <!-- \u2550\u2550\u2550 7. RESULTS \u2550\u2550\u2550 --> <section class="mp-results" data-astro-cid-bphc7w6l> <div class="mp-section-head mp-center" data-astro-cid-bphc7w6l> <p class="mp-eye" data-animate data-astro-cid-bphc7w6l>Results</p> <h2 class="mp-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>Four service businesses. Same system. Different verticals.</h2> <p class="mp-lede" data-animate data-delay="0.1" data-astro-cid-bphc7w6l>These are working businesses you can verify. Ask us for contact info \u2014 they've agreed to talk to qualified prospects.</p> </div> <div class="mp-results-grid" data-astro-cid-bphc7w6l> <article class="mp-result" data-animate data-astro-cid-bphc7w6l> <p class="mp-result-headline" data-astro-cid-bphc7w6l>$440K in sales. One week.</p> <p class="mp-result-quote" data-astro-cid-bphc7w6l>"We diagnosed the problem \u2014 buyers found us but didn't trust what they saw. We tightened the trust signals. A hundred and twenty days later, we did $440,000 in sales in one week. Same traffic. Different result."</p> <p class="mp-result-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>Landscape Charleston</strong> \xB7 Charleston, SC</p> </article> <article class="mp-result" data-animate data-delay="0.1" data-astro-cid-bphc7w6l> <p class="mp-result-headline" data-astro-cid-bphc7w6l>Monthly sales tripled. Ad spend cut 60%.</p> <p class="mp-result-quote" data-astro-cid-bphc7w6l>"We fixed the right problem. Monthly sales tripled. We're spending 60% less than before."</p> <p class="mp-result-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>King's Fencing</strong> \xB7 Nashville, TN</p> </article> <article class="mp-result" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <p class="mp-result-headline" data-astro-cid-bphc7w6l>Phones ring year-round. Zero extra spend.</p> <p class="mp-result-quote" data-astro-cid-bphc7w6l>"The phones ring. The jobs book. We don't have seasonal slowdowns anymore. And we're not spending any more than we were."</p> <p class="mp-result-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>Carolina Stone Craftsman</strong> \xB7 Columbia, SC</p> </article> <article class="mp-result" data-animate data-delay="0.1" data-astro-cid-bphc7w6l> <p class="mp-result-headline" data-astro-cid-bphc7w6l>Close rate jumped. Price resistance disappeared.</p> <p class="mp-result-quote" data-astro-cid-bphc7w6l>"Our close rates jumped. The price conversations got easier. Buyers just stopped pushing back."</p> <p class="mp-result-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>Orange County Garage Doors</strong> \xB7 Tustin, CA</p> </article> </div> </section> <!-- \u2550\u2550\u2550 8. MARKET EXCLUSIVITY \u2550\u2550\u2550 --> <section class="mp-exclusivity" data-astro-cid-bphc7w6l> <div class="mp-exclusivity-inner" data-animate data-astro-cid-bphc7w6l> <p class="mp-excl-eye" data-astro-cid-bphc7w6l>Market Exclusivity</p> <h2 class="mp-excl-h" data-astro-cid-bphc7w6l>One business per service category per market.</h2> <p class="mp-excl-body" data-astro-cid-bphc7w6l>We only take one roofing company in Columbia. One HVAC company. One landscaper. One fencing company. When that slot closes, it closes \u2014 until the current client leaves or the market is reopened.</p> <div class="mp-excl-warn" data-astro-cid-bphc7w6l> <p class="mp-excl-warn-h" data-astro-cid-bphc7w6l>Your competitor may have already pulled this snapshot.</p> <p data-astro-cid-bphc7w6l>If they did, they're already running ads to the buyers who were supposed to call you. The snapshot takes 30 seconds. No email. No call.</p> </div> </div> </section> <!-- \u2550\u2550\u2550 9. GUARANTEE + PRICING \u2550\u2550\u2550 --> <section class="mp-guarantee" data-astro-cid-bphc7w6l> <div class="mp-section-head mp-center" data-astro-cid-bphc7w6l> <p class="mp-eye" data-animate data-astro-cid-bphc7w6l>The Guarantee</p> <h2 class="mp-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>The guarantee nobody else in this industry will make.</h2> </div> <div class="mp-guarantee-card" data-animate data-delay="0.1" data-astro-cid-bphc7w6l> <div class="mp-guarantee-badge" data-astro-cid-bphc7w6l> <span class="mp-badge-check" data-astro-cid-bphc7w6l>\u2713</span> <span data-astro-cid-bphc7w6l>2X Revenue Guarantee</span> </div> <p class="mp-guarantee-lead" data-astro-cid-bphc7w6l>We stay until it works. That's the deal.</p> <p class="mp-guarantee-body" data-astro-cid-bphc7w6l>If EngageEngine\u2122 doesn't deliver at least <strong data-astro-cid-bphc7w6l>2X our fee in closed revenue within 30 days</strong> \u2014 we keep working until it does. Free. No refund and disappear. We stay. We fix. We run it until the number is there.</p> <p class="mp-guarantee-closer" data-astro-cid-bphc7w6l>Because if we can't find the buyers, we don't deserve to get paid.</p> <div class="mp-pricing" data-astro-cid-bphc7w6l> <p class="mp-pricing-eye" data-astro-cid-bphc7w6l>Pricing</p> <p class="mp-pricing-headline" data-astro-cid-bphc7w6l> <span class="mp-pricing-num" data-astro-cid-bphc7w6l>$3,500</span><span class="mp-pricing-per" data-astro-cid-bphc7w6l>/month</span> <span class="mp-pricing-plus" data-astro-cid-bphc7w6l>+ ad spend</span> </p> <p class="mp-pricing-body" data-astro-cid-bphc7w6l>The guarantee is on our fee \u2014 not your ad spend. <strong data-astro-cid-bphc7w6l>$3,500 in \u2192 at least $7,000 in closed revenue within 30 days</strong>, or we keep working until it does. Free.</p> </div> </div> </section> <!-- \u2550\u2550\u2550 10. CLOSE \u2014 CTA scrolls to top form \u2550\u2550\u2550 --> <section class="mp-close" data-astro-cid-bphc7w6l> <h2 class="mp-close-h1" data-animate data-astro-cid-bphc7w6l>One company per trade. Per market.</h2> <p class="mp-close-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>The only question is whether yours is still open.</p> <p class="mp-close-body" data-animate data-delay="0.1" data-astro-cid-bphc7w6l>Every month this runs without you, the contractor across town is booking the jobs the market isn't creating. The day he locks your trade, we start sending him the work. Check your market now.</p> <div class="mp-close-cta" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <a href="#snap-form-card" class="mp-btn-primary" id="close-cta" data-astro-cid-bphc7w6l>See If My Trade Is Still Open</a> <p class="mp-micro" data-astro-cid-bphc7w6l>30 seconds. No email.</p> </div> </section> </main> `, " <script>(function(){", `
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
  })();<\/script> `], ["  ", '<nav class="mp-nav" data-astro-cid-bphc7w6l> <div class="mp-nav-inner" data-astro-cid-bphc7w6l> <a href="/" class="mp-logo" data-astro-cid-bphc7w6l>\nMarketing Performance Group\n<span class="mp-logo-sub" data-astro-cid-bphc7w6l>Powered by EngageEngine\u2122</span> </a> </div> </nav> <main class="mp" data-astro-cid-bphc7w6l> <!-- \u2550\u2550\u2550 1. HERO \u2014 copy left, LIVE FORM right \u2550\u2550\u2550 --> <section class="mp-hero" data-astro-cid-bphc7w6l> <div class="mp-hero-grid" data-astro-cid-bphc7w6l> <div class="mp-hero-copy" data-astro-cid-bphc7w6l> <h1 class="mp-h1" data-astro-cid-bphc7w6l>\nOne company per trade in ', `.<br data-astro-cid-bphc7w6l>See if yours is still open.
</h1> <p class="mp-hero-punch" data-astro-cid-bphc7w6l>
Type your trade. We'll show you the work moving in your market, and whether the seat is still yours to take.
</p> </div> <!-- SEAT-CHECK TOOL \u2014 market size + seat status, computed live --> <div class="snap-card" id="snap-form-card" data-astro-cid-bphc7w6l> <div class="snap-card-head" data-astro-cid-bphc7w6l> <span class="snap-card-eye" data-astro-cid-bphc7w6l>Free Market Check</span> <span class="snap-card-loc" data-astro-cid-bphc7w6l>`, '</span> </div> <form id="snapshot-form" class="snap-form" novalidate data-astro-cid-bphc7w6l> <label class="snap-field-label" for="service-input" data-astro-cid-bphc7w6l>Your trade</label> <input type="text" name="trade" id="service-input" placeholder="Roofing, plumbing, landscaping\u2026" required class="snap-input" autocomplete="off" inputmode="text" data-astro-cid-bphc7w6l> <label class="snap-field-label" for="city-input" data-astro-cid-bphc7w6l>Your market</label> <input type="text" name="city" id="city-input" placeholder="City, state" required class="snap-input" autocomplete="off"', ` data-astro-cid-bphc7w6l> <button type="submit" class="snap-btn" id="snap-submit" data-astro-cid-bphc7w6l> <span data-astro-cid-bphc7w6l>Check my market</span> <span class="snap-btn-arrow" data-astro-cid-bphc7w6l>\u2192</span> </button> <div class="snap-scarcity" data-astro-cid-bphc7w6l> <span class="snap-scarcity-dot" data-astro-cid-bphc7w6l></span> <span data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>One company per trade, per market.</strong> Once your competitor locks it, you can't.</span> </div> </form> <!-- Result, filled by JS after Check my market --> <div class="snap-result" id="snap-result" hidden data-astro-cid-bphc7w6l></div> </div> </div> </section> <!-- \u2550\u2550\u2550 1.5 PROOF \u2014 Share Line, no names \u2550\u2550\u2550 --> <section class="mp-proof" data-astro-cid-bphc7w6l> <header class="mp-proof-head" data-animate data-astro-cid-bphc7w6l> <h2 class="mp-proof-h" data-astro-cid-bphc7w6l>The market didn't grow. Our clients did.</h2> </header> <div class="mp-proof-inner" data-animate data-delay="0.1" data-astro-cid-bphc7w6l> <p class="mp-lede mp-center" data-astro-cid-bphc7w6l>A Columbia landscaper booked 40% more jobs in two years while his market stayed flat. A pool builder grew installs 26% while the pool market lost half its volume. That work came off their competitors' schedules. One company per trade, per market.</p> </div> </section> <!-- \u2550\u2550\u2550 2. HERO-ANCHOR TESTIMONIAL \u2550\u2550\u2550 --> <section class="mp-anchor" data-astro-cid-bphc7w6l> <div class="mp-anchor-inner" data-animate data-astro-cid-bphc7w6l> <div class="mp-anchor-photo" data-astro-cid-bphc7w6l> <img src="/img/rogerson.jpg" alt="McClintock HVAC" width="80" height="80" loading="lazy" decoding="async" data-astro-cid-bphc7w6l> </div> <div class="mp-anchor-body" data-astro-cid-bphc7w6l> <p class="mp-anchor-quote" data-astro-cid-bphc7w6l>"Our cost per click dropped over 70%, clicks and engagement went up on our website, and in 30 days we doubled our booked appointments."</p> <p class="mp-anchor-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>McClintock HVAC</strong> \xB7 Charlotte, NC</p> <div class="mp-anchor-stats" data-astro-cid-bphc7w6l> <span data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>70%</strong> lower cost per click</span> <span class="mp-dot" data-astro-cid-bphc7w6l>\xB7</span> <span data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>2\xD7</strong> booked appointments</span> <span class="mp-dot" data-astro-cid-bphc7w6l>\xB7</span> <span data-astro-cid-bphc7w6l>30 days</span> </div> </div> </div> </section> <!-- \u2550\u2550\u2550 3. FOUNDER \u2550\u2550\u2550 --> <section class="mp-founder" data-astro-cid-bphc7w6l> <div class="mp-founder-inner" data-animate data-astro-cid-bphc7w6l> <img src="/img/robbie-butt.jpg" alt="Robbie Butt, Founder of EngageEngine\u2122" class="mp-founder-photo" loading="lazy" decoding="async" width="280" height="527" data-astro-cid-bphc7w6l> <div class="mp-founder-body" data-astro-cid-bphc7w6l> <p class="mp-founder-eye" data-astro-cid-bphc7w6l>The Founder</p> <h2 class="mp-founder-name" data-astro-cid-bphc7w6l>Robbie Butt</h2> <p class="mp-founder-title" data-astro-cid-bphc7w6l>Founder, EngageEngine\u2122 \xB7 41 years in this industry</p> <p class="mp-founder-quote" data-astro-cid-bphc7w6l>"I personally sign every client. If it doesn't work, I keep working. That's been the deal for 31 years."</p> <p class="mp-founder-cred" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>31 years in business. Zero refunds.</strong> Not because we don't offer them \u2014 because we don't need to.</p> </div> </div> </section> <!-- \u2550\u2550\u2550 4. PRODUCT CLARITY \u2550\u2550\u2550 --> <section class="mp-clarity" data-astro-cid-bphc7w6l> <div class="mp-section-head" data-astro-cid-bphc7w6l> <p class="mp-eye" data-animate data-astro-cid-bphc7w6l>What This Is</p> <h2 class="mp-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>EngageEngine\u2122 is a fully managed service.</h2> <p class="mp-lede" data-animate data-delay="0.1" data-astro-cid-bphc7w6l>Not software. Not a dashboard. Not another platform to learn. We do the work. You tell us your market and your service \u2014 we handle audience building, ad placement, optimization, and reporting.</p> </div> <div class="mp-intel-wrap" data-animate data-delay="0.15" data-astro-cid-bphc7w6l> <img src="/img/intelligence-layer.webp" alt="The Intelligence Layer \u2014 input data, the engine, and the outputs that find buyers before they call" class="mp-intel" loading="lazy" decoding="async" width="1536" height="1024" data-astro-cid-bphc7w6l> </div> <div class="mp-do-grid" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <div class="mp-do-col mp-do-yes" data-astro-cid-bphc7w6l> <p class="mp-do-h" data-astro-cid-bphc7w6l>Here's what you do</p> <ul data-astro-cid-bphc7w6l> <li data-astro-cid-bphc7w6l><span class="mp-do-mark" data-astro-cid-bphc7w6l>\u2713</span> Tell us your service area</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark" data-astro-cid-bphc7w6l>\u2713</span> Tell us what a good job looks like</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark" data-astro-cid-bphc7w6l>\u2713</span> Answer the calls</li> </ul> </div> <div class="mp-do-col mp-do-no" data-astro-cid-bphc7w6l> <p class="mp-do-h" data-astro-cid-bphc7w6l>Here's what you don't</p> <ul data-astro-cid-bphc7w6l> <li data-astro-cid-bphc7w6l><span class="mp-do-mark mp-mark-x" data-astro-cid-bphc7w6l>\u2715</span> Manage campaigns</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark mp-mark-x" data-astro-cid-bphc7w6l>\u2715</span> Build audiences</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark mp-mark-x" data-astro-cid-bphc7w6l>\u2715</span> Touch the platform</li> <li data-astro-cid-bphc7w6l><span class="mp-do-mark mp-mark-x" data-astro-cid-bphc7w6l>\u2715</span> Learn another dashboard</li> </ul> </div> </div> <p class="mp-fit-line" data-animate data-delay="0.25" data-astro-cid-bphc7w6l>Built for service businesses doing <strong data-astro-cid-bphc7w6l>$500K\u2013$5M/year in revenue</strong>.</p> </section> <!-- \u2550\u2550\u2550 5. HOW IT WORKS \u2550\u2550\u2550 --> <section class="mp-engine" data-astro-cid-bphc7w6l> <div class="mp-section-head" data-astro-cid-bphc7w6l> <p class="mp-eye" data-animate data-astro-cid-bphc7w6l>Inside The Engine</p> <h2 class="mp-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>Five layers. One engine.</h2> </div> <img src="/ee-explode.webp" alt="EngageEngine \u2014 five-layer system" class="mp-explode" loading="lazy" decoding="async" width="1536" height="1024" data-animate data-delay="0.15" data-astro-cid-bphc7w6l> <div class="mp-modules" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>01</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We find them</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>45,000+ data sources tell us who in your market is searching for your service this week.</div> </div> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>02</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We match them</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>Custom audiences built daily \u2014 matched to your service, your geography, and the kind of job you want.</div> </div> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>03</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We reach them</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>Your ads run on Google, Meta, and programmatic \u2014 in front of the same people, across every channel.</div> </div> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>04</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We learn from them</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>Every closed job feeds back in. The system gets sharper every week about what a real customer looks like.</div> </div> <div class="mp-mod" data-astro-cid-bphc7w6l> <div class="mp-mod-num" data-astro-cid-bphc7w6l>05</div> <div class="mp-mod-name" data-astro-cid-bphc7w6l>We prove it</div> <div class="mp-mod-desc" data-astro-cid-bphc7w6l>Every lead traced from first signal to closed job. You always see exactly what's working \u2014 and what it cost.</div> </div> </div> <p class="mp-timeline" data-animate data-delay="0.25" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>Most clients are live within 72 hours of the diagnostic.</strong></p> <div class="mp-status" data-animate data-delay="0.3" data-astro-cid-bphc7w6l> <p class="mp-status-cap" data-astro-cid-bphc7w6l>Live system performance \u2014 across all active client accounts</p> <div class="mp-status-rows" data-astro-cid-bphc7w6l> <div class="mp-status-row" data-astro-cid-bphc7w6l><span data-astro-cid-bphc7w6l>System Status</span><span class="mp-status-v" data-astro-cid-bphc7w6l>ACTIVE</span></div> <div class="mp-status-row" data-astro-cid-bphc7w6l><span data-astro-cid-bphc7w6l>Cost Reduction vs. Platform-Native</span><span class="mp-status-v" data-astro-cid-bphc7w6l>67\u201390%</span></div> <div class="mp-status-row" data-astro-cid-bphc7w6l><span data-astro-cid-bphc7w6l>Attribution</span><span class="mp-status-v" data-astro-cid-bphc7w6l>CLOSED LOOP</span></div> <div class="mp-status-row" data-astro-cid-bphc7w6l><span data-astro-cid-bphc7w6l>Audiences</span><span class="mp-status-v" data-astro-cid-bphc7w6l>REFRESHED DAILY</span></div> </div> </div> </section> <!-- \u2550\u2550\u2550 6. MECHANISM TESTIMONIAL \u2014 removed pending replacement \u2550\u2550\u2550 --> <!-- \u2550\u2550\u2550 7. RESULTS \u2550\u2550\u2550 --> <section class="mp-results" data-astro-cid-bphc7w6l> <div class="mp-section-head mp-center" data-astro-cid-bphc7w6l> <p class="mp-eye" data-animate data-astro-cid-bphc7w6l>Results</p> <h2 class="mp-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>Four service businesses. Same system. Different verticals.</h2> <p class="mp-lede" data-animate data-delay="0.1" data-astro-cid-bphc7w6l>These are working businesses you can verify. Ask us for contact info \u2014 they've agreed to talk to qualified prospects.</p> </div> <div class="mp-results-grid" data-astro-cid-bphc7w6l> <article class="mp-result" data-animate data-astro-cid-bphc7w6l> <p class="mp-result-headline" data-astro-cid-bphc7w6l>$440K in sales. One week.</p> <p class="mp-result-quote" data-astro-cid-bphc7w6l>"We diagnosed the problem \u2014 buyers found us but didn't trust what they saw. We tightened the trust signals. A hundred and twenty days later, we did $440,000 in sales in one week. Same traffic. Different result."</p> <p class="mp-result-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>Landscape Charleston</strong> \xB7 Charleston, SC</p> </article> <article class="mp-result" data-animate data-delay="0.1" data-astro-cid-bphc7w6l> <p class="mp-result-headline" data-astro-cid-bphc7w6l>Monthly sales tripled. Ad spend cut 60%.</p> <p class="mp-result-quote" data-astro-cid-bphc7w6l>"We fixed the right problem. Monthly sales tripled. We're spending 60% less than before."</p> <p class="mp-result-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>King's Fencing</strong> \xB7 Nashville, TN</p> </article> <article class="mp-result" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <p class="mp-result-headline" data-astro-cid-bphc7w6l>Phones ring year-round. Zero extra spend.</p> <p class="mp-result-quote" data-astro-cid-bphc7w6l>"The phones ring. The jobs book. We don't have seasonal slowdowns anymore. And we're not spending any more than we were."</p> <p class="mp-result-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>Carolina Stone Craftsman</strong> \xB7 Columbia, SC</p> </article> <article class="mp-result" data-animate data-delay="0.1" data-astro-cid-bphc7w6l> <p class="mp-result-headline" data-astro-cid-bphc7w6l>Close rate jumped. Price resistance disappeared.</p> <p class="mp-result-quote" data-astro-cid-bphc7w6l>"Our close rates jumped. The price conversations got easier. Buyers just stopped pushing back."</p> <p class="mp-result-attr" data-astro-cid-bphc7w6l><strong data-astro-cid-bphc7w6l>Orange County Garage Doors</strong> \xB7 Tustin, CA</p> </article> </div> </section> <!-- \u2550\u2550\u2550 8. MARKET EXCLUSIVITY \u2550\u2550\u2550 --> <section class="mp-exclusivity" data-astro-cid-bphc7w6l> <div class="mp-exclusivity-inner" data-animate data-astro-cid-bphc7w6l> <p class="mp-excl-eye" data-astro-cid-bphc7w6l>Market Exclusivity</p> <h2 class="mp-excl-h" data-astro-cid-bphc7w6l>One business per service category per market.</h2> <p class="mp-excl-body" data-astro-cid-bphc7w6l>We only take one roofing company in Columbia. One HVAC company. One landscaper. One fencing company. When that slot closes, it closes \u2014 until the current client leaves or the market is reopened.</p> <div class="mp-excl-warn" data-astro-cid-bphc7w6l> <p class="mp-excl-warn-h" data-astro-cid-bphc7w6l>Your competitor may have already pulled this snapshot.</p> <p data-astro-cid-bphc7w6l>If they did, they're already running ads to the buyers who were supposed to call you. The snapshot takes 30 seconds. No email. No call.</p> </div> </div> </section> <!-- \u2550\u2550\u2550 9. GUARANTEE + PRICING \u2550\u2550\u2550 --> <section class="mp-guarantee" data-astro-cid-bphc7w6l> <div class="mp-section-head mp-center" data-astro-cid-bphc7w6l> <p class="mp-eye" data-animate data-astro-cid-bphc7w6l>The Guarantee</p> <h2 class="mp-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>The guarantee nobody else in this industry will make.</h2> </div> <div class="mp-guarantee-card" data-animate data-delay="0.1" data-astro-cid-bphc7w6l> <div class="mp-guarantee-badge" data-astro-cid-bphc7w6l> <span class="mp-badge-check" data-astro-cid-bphc7w6l>\u2713</span> <span data-astro-cid-bphc7w6l>2X Revenue Guarantee</span> </div> <p class="mp-guarantee-lead" data-astro-cid-bphc7w6l>We stay until it works. That's the deal.</p> <p class="mp-guarantee-body" data-astro-cid-bphc7w6l>If EngageEngine\u2122 doesn't deliver at least <strong data-astro-cid-bphc7w6l>2X our fee in closed revenue within 30 days</strong> \u2014 we keep working until it does. Free. No refund and disappear. We stay. We fix. We run it until the number is there.</p> <p class="mp-guarantee-closer" data-astro-cid-bphc7w6l>Because if we can't find the buyers, we don't deserve to get paid.</p> <div class="mp-pricing" data-astro-cid-bphc7w6l> <p class="mp-pricing-eye" data-astro-cid-bphc7w6l>Pricing</p> <p class="mp-pricing-headline" data-astro-cid-bphc7w6l> <span class="mp-pricing-num" data-astro-cid-bphc7w6l>$3,500</span><span class="mp-pricing-per" data-astro-cid-bphc7w6l>/month</span> <span class="mp-pricing-plus" data-astro-cid-bphc7w6l>+ ad spend</span> </p> <p class="mp-pricing-body" data-astro-cid-bphc7w6l>The guarantee is on our fee \u2014 not your ad spend. <strong data-astro-cid-bphc7w6l>$3,500 in \u2192 at least $7,000 in closed revenue within 30 days</strong>, or we keep working until it does. Free.</p> </div> </div> </section> <!-- \u2550\u2550\u2550 10. CLOSE \u2014 CTA scrolls to top form \u2550\u2550\u2550 --> <section class="mp-close" data-astro-cid-bphc7w6l> <h2 class="mp-close-h1" data-animate data-astro-cid-bphc7w6l>One company per trade. Per market.</h2> <p class="mp-close-h2" data-animate data-delay="0.05" data-astro-cid-bphc7w6l>The only question is whether yours is still open.</p> <p class="mp-close-body" data-animate data-delay="0.1" data-astro-cid-bphc7w6l>Every month this runs without you, the contractor across town is booking the jobs the market isn't creating. The day he locks your trade, we start sending him the work. Check your market now.</p> <div class="mp-close-cta" data-animate data-delay="0.2" data-astro-cid-bphc7w6l> <a href="#snap-form-card" class="mp-btn-primary" id="close-cta" data-astro-cid-bphc7w6l>See If My Trade Is Still Open</a> <p class="mp-micro" data-astro-cid-bphc7w6l>30 seconds. No email.</p> </div> </section> </main> `, " <script>(function(){", `
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
  })();<\/script> `])), maybeRenderHead(), displayMarket, detectedLocation ? `Detected: ${detectedLocation}` : "Enter your market", addAttribute(detectedLocation, "value"), renderComponent($$result2, "Footer", $$Footer, { "data-astro-cid-bphc7w6l": true }), defineScriptVars({ detectedLocation })) })}  <!-- Global styles for the JS-injected seat-check result (Astro scopes normal <style>, so innerHTML content needs is:global) --> `;
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
