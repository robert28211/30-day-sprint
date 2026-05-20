// ============================================================
// EngageEngine DVS™ — Demand Visibility Score Engine v2
// Apple design system. Competitor benchmarking layer included.
// Protected by Cloudflare Access (Zero Trust).
// ============================================================

// ── Design tokens (Apple system — matches marketingperformance.net) ──
const DS = {
  graphite:   '#1d1d1f',
  deepGray:   '#333333',
  midGray:    '#707070',
  border:     '#d6d6d6',
  bgLight:    '#e2e2e5',
  canvas:     '#f5f5f7',
  white:      '#ffffff',
  blue:       '#0071e3',
  blueLink:   '#0066cc',
  blueHover:  '#2997ff',
  font:       `'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  fontDisplay:`'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
};

// ── Profile definitions ──────────────────────────────────────
const PROFILES = [
  { min: 86, max: 100, name: 'DEFENDED',  label: 'Full AI Visibility',          color: '#1a7340' },
  { min: 71, max: 85,  name: 'VISIBLE',   label: 'Strong AI Presence',          color: '#2e6b3e' },
  { min: 51, max: 70,  name: 'EMERGING',  label: 'Building Presence',           color: '#b45309' },
  { min: 31, max: 50,  name: 'EXPOSED',   label: 'Structural Vulnerabilities',  color: '#c2410c' },
  { min: 0,  max: 30,  name: 'DARK',      label: 'Invisible to AI Systems',     color: '#991b1b' },
];

function getProfile(score) {
  return PROFILES.find(p => score >= p.min && score <= p.max) || PROFILES[PROFILES.length - 1];
}

// ── Bar color by percentage ──────────────────────────────────
function barColor(pct) {
  if (pct >= 72) return '#0071e3';
  if (pct >= 48) return '#b45309';
  return '#c2410c';
}

// ── Structured JSON rubric prompts ───────────────────────────

const CITATION_READINESS_PROMPT = (content, url) => ({
  system: `You are the EngageEngine DVS™ scoring engine. Score ONLY the five Citation Readiness sub-items below. Output valid JSON only — no prose, no explanation, no markdown.

Citation Readiness measures whether AI systems can quote or cite this business's content when answering buyer questions. Generic content cannot be cited. Specific, original, structured content can.

local_specificity (0-5):
- 5: Multiple specific neighborhood names, local geographic conditions, seasonal patterns, regional building details
- 4: Several specific local references (city + neighborhood or local condition)
- 3: General city or region with some local color but no neighborhood or condition detail
- 2: City name present but purely as service area claim, no local knowledge
- 1: Vague geographic claim only
- 0: No geographic specificity

named_experience (0-5):
- 5: Specific quantified claims with location context ("400+ Lexington County homes", "serving West Columbia since 1983")
- 4: Quantified claims without location specificity ("over 1,000 homes served")
- 3: Named years in business or approximate volume without specifics
- 2: Vague experience claim ("years of experience", "thousands of customers")
- 1: General "experienced" or "professional" claim only
- 0: No experience claims

outcome_language (0-5):
- 5: Problem-solution-outcome narratives with specific mechanisms
- 4: Specific results mentioned but missing one element
- 3: Some outcome language present but generic
- 2: Mostly benefit claims without mechanism
- 1: Pure feature claims, no outcomes
- 0: No results or outcome language

original_claims (0-5):
- 5: Observations or data AI cannot synthesize from general web (proprietary processes, unique market observations)
- 4: Some unique claims but most content is common industry knowledge
- 3: Mix of original and generic — a few differentiating claims buried in commodity content
- 2: Mostly generic industry information with branding overlaid
- 1: Pure commodity content that could describe any competitor
- 0: Generic template content, no original perspective

citable_structure (0-5):
- 5: FAQ schema markup present + structured Q&A sections + service-specific pages with clear headers
- 4: FAQ section present and well-structured (no confirmed schema)
- 3: Some structured content (service pages with headers) but no FAQ or Q&A
- 2: Basic service list structure only
- 1: Pure prose, minimal headers — very hard for AI to parse
- 0: No discernible structure`,

  user: `Score this local service business for Citation Readiness.
URL: ${url}

Page content:
${content}

Output this JSON structure exactly — no other text:
{
  "local_specificity": {"score": 0, "evidence": "exact quote or 'not found'", "confidence": "high|medium|low"},
  "named_experience": {"score": 0, "evidence": "...", "confidence": "..."},
  "outcome_language": {"score": 0, "evidence": "...", "confidence": "..."},
  "original_claims": {"score": 0, "evidence": "...", "confidence": "..."},
  "citable_structure": {"score": 0, "evidence": "...", "confidence": "..."},
  "key_finding": "One specific sentence describing the biggest citation gap or strength",
  "top_gap": "One specific sentence describing the single highest-leverage improvement"
}`
});

const PRESENCE_ARCHITECTURE_PROMPT = (content, url, gbpData) => ({
  system: `You are the EngageEngine DVS™ scoring engine. Score ONLY the five Presence Architecture sub-items below. Output valid JSON only — no prose, no explanation, no markdown.

Presence Architecture measures QUALITY and CONSISTENCY of digital presence — NOT volume. A business with 5 specific reviews outscores one with 200 generic reviews.

review_content_quality (0-6, max 6):
- 6: Reviews consistently describe specific problems, named technicians, specific outcomes — AI learns expertise from them
- 5: Most reviews contain specific service detail
- 4: Mix of specific and generic
- 3: Primarily generic ("great service", "highly recommend")
- 2: Almost entirely generic — AI learns nothing
- 1: Reviews present but thin or low count
- 0: No reviews found

nap_consistency (0-5):
- 5: Business name, address, phone identical across all verified sources
- 4: Mostly consistent — minor formatting differences only
- 3: Some inconsistency — abbreviations or slight name variations
- 2: Noticeable inconsistency — different phone numbers or address formats
- 1: Significant inconsistency
- 0: Cannot verify or major contradictions

gbp_completeness (0-5):
- 5: All services listed, recent job-specific photos, Q&As answered, posts within 30 days, hours verified
- 4: Services listed, photos present, most fields complete
- 3: Basic GBP — services and hours but limited photos, no posts
- 2: Minimal GBP — claimed but sparse
- 1: GBP exists but nearly empty
- 0: No GBP found or unclaimed

third_party_authority (0-5):
- 5: Business mentioned in local news, industry associations, or authoritative non-directory sources
- 4: Active on high-authority platform (Angi, BBB significant activity) plus editorial mention
- 3: Listed on authoritative platforms (BBB, Angi) but no editorial mentions
- 2: Standard directory presence (Yelp, Yellow Pages) — commodity citations
- 1: Only website and GBP — no third-party presence
- 0: No third-party presence found

review_velocity (0-4, max 4):
- 4: Consistent stream — multiple reviews per month over past 6+ months
- 3: Regular but not consistent — monthly but irregular
- 2: Reviews present but velocity declining — large batch then silence
- 1: Very slow — fewer than 1/month average
- 0: No recent reviews (last 3+ months with nothing)`,

  user: `Score this local service business for Presence Architecture.
URL: ${url}

Website content:
${content}

${gbpData ? `GBP / external presence data:\n${gbpData}` : 'Note: GBP data not available — score based on website content and visible signals only.'}

Output this JSON structure exactly — no other text:
{
  "review_content_quality": {"score": 0, "evidence": "...", "confidence": "high|medium|low"},
  "nap_consistency": {"score": 0, "evidence": "...", "confidence": "..."},
  "gbp_completeness": {"score": 0, "evidence": "...", "confidence": "..."},
  "third_party_authority": {"score": 0, "evidence": "...", "confidence": "..."},
  "review_velocity": {"score": 0, "evidence": "...", "confidence": "..."},
  "key_finding": "One specific sentence describing the biggest presence gap or strength",
  "top_gap": "One specific sentence describing the single highest-leverage improvement"
}`
});

const CONVERSION_ARCHITECTURE_PROMPT = (content, url) => ({
  system: `You are the EngageEngine DVS™ scoring engine. Score ONLY the five Conversion Architecture sub-items. Output valid JSON only.

Conversion Architecture measures whether this website converts intent into contact. A homeowner clicking through from an AI recommendation is 70% decided — poor conversion loses them anyway.

above_fold_clarity (0-5):
- 5: Within 3 seconds — service, geography, and next action all visible without scrolling
- 4: Service and geography clear, action present but requires slight scan
- 3: Service clear but geography or action ambiguous
- 2: Some information present but visitor must work to understand offer
- 1: Confusing or generic above-fold
- 0: No discernible value proposition

trust_accelerators (0-5):
- 5: Licensing, insurance, proximity signals, live reviews, photos of actual work — all visible without scrolling
- 4: Most trust signals present
- 3: Some trust signals (license, years) but missing specific proof
- 2: Generic claims only ("licensed and insured" without details)
- 1: No trust signals beyond generic claims
- 0: Nothing to make a stranger feel safe booking

cta_architecture (0-5):
- 5: Phone number in header (click-to-call mobile), clear booking CTA above fold, secondary CTAs throughout — zero friction
- 4: Phone visible, clear CTA present — may require slight scroll mobile
- 3: Contact path present but not prominent
- 2: Options exist but friction-heavy (long forms, no phone visible)
- 1: Only contact form — no visible phone
- 0: No clear contact path

mobile_conversion (0-5):
- 5: Click-to-call button, fast loading, clean mobile-first layout
- 4: Mobile-appropriate content and CTAs
- 3: Mixed mobile signals
- 2: Desktop-first design evident
- 1: Poor mobile signals
- 0: Mobile experience appears broken

trust_at_decision (0-5):
- 5: At conversion point: guarantee language, response time commitment, recent testimonials, named outcome
- 4: Most final trust signals present
- 3: Some closing trust but generic
- 2: Conversion area transactional only — no supporting trust
- 1: Conversion path stripped of context
- 0: No conversion infrastructure`,

  user: `Score for Conversion Architecture.
URL: ${url}

Page content:
${content}

Output this JSON exactly:
{
  "above_fold_clarity": {"score": 0, "evidence": "...", "confidence": "high|medium|low"},
  "trust_accelerators": {"score": 0, "evidence": "...", "confidence": "..."},
  "cta_architecture": {"score": 0, "evidence": "...", "confidence": "..."},
  "mobile_conversion": {"score": 0, "evidence": "...", "confidence": "..."},
  "trust_at_decision": {"score": 0, "evidence": "...", "confidence": "..."},
  "key_finding": "One specific sentence describing the biggest conversion gap or strength",
  "top_gap": "One specific sentence describing the single highest-leverage improvement"
}`
});

const BRAND_AUTHORITY_PROMPT = (content, url) => ({
  system: `You are the EngageEngine DVS™ scoring engine. Score ONLY the five Brand Authority sub-items. Output valid JSON only.

Brand Authority measures whether this business has built an identity strong enough that customers seek it out directly — independent of AI or algorithm decisions.

Note: recognizable_positioning is weighted higher (max 8) because differentiation is the hardest to build and most valuable.

proprietary_language (0-5):
- 5: Named proprietary processes, methodologies, or guarantees creating recall
- 4: Some proprietary naming — at least one named process or guarantee
- 3: Semi-proprietary language — distinctive phrasing but not fully ownable
- 2: Generic guarantee language any competitor could claim
- 1: No distinctive language — purely descriptive
- 0: No proprietary language

recognizable_positioning (0-8, max 8 — most important item):
- 8: Clear "only they do X" — genuinely differentiated, verifiable, something a customer would repeat
- 7: Very strong positioning — near-unique claim with specific evidence
- 6: Strong differentiator — may be slightly vague or shared with few competitors
- 5: Decent positioning attempt — claim present but not fully substantiated
- 4: Some differentiation but could apply to many competitors
- 3: Generic category leadership ("best gutters in Columbia")
- 2: No real positioning — service list and generic quality claims
- 1: Actively positions as commodity
- 0: No positioning

named_identity (0-5):
- 5: Named founder/owner/technician with photo, bio, associated specific expertise prominently featured
- 4: Named person with photo — may lack detailed bio
- 3: Name mentioned but minimal — no photo or expertise context
- 2: Generic "our team" — no individual names
- 1: No named individuals — faceless business
- 0: No human identity signals

owner_searchability (0-4, max 4):
- 4: Owner name appears multiple times, associated with expertise claims, bio present
- 3: Owner name present and associated with brand in more than one context
- 2: Owner name mentioned once but not associated with expertise
- 1: Owner name not present but distinct named brand identity
- 0: No searchable human identity

community_presence (0-3, max 3):
- 3: Clear local community involvement — sponsorships, local events, partnerships mentioned
- 2: Some community signals — one or two local tie-ins
- 1: No community signals but strong local brand identity
- 0: No community signals`,

  user: `Score for Brand Authority.
URL: ${url}

Page content:
${content}

Output this JSON exactly:
{
  "proprietary_language": {"score": 0, "evidence": "...", "confidence": "high|medium|low"},
  "recognizable_positioning": {"score": 0, "evidence": "...", "confidence": "..."},
  "named_identity": {"score": 0, "evidence": "...", "confidence": "..."},
  "owner_searchability": {"score": 0, "evidence": "...", "confidence": "..."},
  "community_presence": {"score": 0, "evidence": "...", "confidence": "..."},
  "key_finding": "One specific sentence describing the biggest brand authority gap or strength",
  "top_gap": "One specific sentence describing the single highest-leverage improvement"
}`
});

// ── Page fetch utilities ─────────────────────────────────────

function cleanUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term',
     'fbclid','gclid','msclkid','gad_source','_gl'].forEach(k => u.searchParams.delete(k));
    return u.toString();
  } catch { return rawUrl; }
}

function rootUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return `${u.protocol}//${u.host}/`;
  } catch { return rawUrl; }
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return response;
  } catch (e) { clearTimeout(timeout); throw e; }
}

function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

async function extractPageContent(url) {
  const clean = cleanUrl(url);
  let response = await fetchPage(clean);
  if (!response.ok && [403, 429, 503].includes(response.status)) {
    const root = rootUrl(url);
    if (root !== clean) response = await fetchPage(root);
  }
  if (!response.ok) throw new Error(`Page returned HTTP ${response.status}.`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('html')) throw new Error('URL does not appear to be a webpage.');
  const html = await response.text();
  const text = htmlToText(html);
  if (text.length < 150) throw new Error('Page has too little readable text.');
  return text.slice(0, 14000);
}

// ── GBP / DataForSEO ────────────────────────────────────────

async function fetchGBPData(businessName, location, env) {
  if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) return null;
  try {
    const auth = btoa(`${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`);
    const keyword = `${businessName} ${location}`;

    const [infoResp, reviewsResp] = await Promise.all([
      fetch('https://api.dataforseo.com/v3/business_data/google/my_business_info/live', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ keyword, location_name: 'United States', language_name: 'English' }])
      }),
      fetch('https://api.dataforseo.com/v3/business_data/google/reviews/live', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ keyword, location_name: 'United States', language_name: 'English', depth: 10, sort_by: 'newest' }])
      }).catch(() => null)
    ]);

    if (!infoResp.ok) return null;
    const infoData = await infoResp.json();
    const item = infoData?.tasks?.[0]?.result?.[0]?.items?.[0];
    if (!item) return null;

    let reviewsSample = [];
    if (reviewsResp?.ok) {
      const reviewData = await reviewsResp.json();
      const rawReviews = reviewData?.tasks?.[0]?.result?.[0]?.items || [];
      reviewsSample = rawReviews.slice(0, 8)
        .map(r => ({ rating: r.rating?.value, text: (r.review_text || '').slice(0, 250), date: r.timestamp }))
        .filter(r => r.text);
    }

    return JSON.stringify({
      name: item.title,
      rating: item.rating?.value,
      review_count: item.rating?.votes_count,
      rating_distribution: item.rating_distribution,
      address: item.address,
      phone: item.phone,
      category: item.category,
      work_time: item.work_time?.work_hours?.timetable,
      is_claimed: item.is_claimed,
      questions_and_answers_count: item.questions_and_answers_count,
      place_topics: item.place_topics,
      reviews_sample: reviewsSample,
    });
  } catch { return null; }
}

// ── Claude scoring ───────────────────────────────────────────

async function scoreWithClaude(prompt, env) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(clean); }
  catch { throw new Error(`Claude returned non-JSON: ${clean.slice(0, 300)}`); }
}

// ── Score aggregators ────────────────────────────────────────

function citationScore(j) {
  return (j.local_specificity?.score || 0) + (j.named_experience?.score || 0) +
         (j.outcome_language?.score || 0) + (j.original_claims?.score || 0) + (j.citable_structure?.score || 0);
}
function presenceScore(j) {
  return (j.review_content_quality?.score || 0) + (j.nap_consistency?.score || 0) +
         (j.gbp_completeness?.score || 0) + (j.third_party_authority?.score || 0) + (j.review_velocity?.score || 0);
}
function conversionScore(j) {
  return (j.above_fold_clarity?.score || 0) + (j.trust_accelerators?.score || 0) +
         (j.cta_architecture?.score || 0) + (j.mobile_conversion?.score || 0) + (j.trust_at_decision?.score || 0);
}
function brandScore(j) {
  return (j.proprietary_language?.score || 0) + (j.recognizable_positioning?.score || 0) +
         (j.named_identity?.score || 0) + (j.owner_searchability?.score || 0) + (j.community_presence?.score || 0);
}
function aggregateConfidence(j) {
  const levels = Object.values(j).filter(v => v?.confidence).map(v => v.confidence);
  if (!levels.length) return 'medium';
  const c = { high: 0, medium: 0, low: 0 };
  levels.forEach(l => { if (c[l] !== undefined) c[l]++; });
  if (c.low > 1) return 'low';
  if (c.high >= Math.ceil(levels.length / 2)) return 'high';
  return 'medium';
}

// ── Competitor discovery + scoring ───────────────────────────

async function findCompetitors(niche, location, clientUrl, env) {
  if (!env.PLACES_API_KEY) return [];
  try {
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.websiteUri,places.rating,places.userRatingCount,places.formattedAddress',
      },
      body: JSON.stringify({ textQuery: `${niche} ${location}` }),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const clientDomain = (() => { try { return new URL(clientUrl).hostname.replace('www.', ''); } catch { return ''; } })();

    return (data.places || [])
      .filter(p => {
        if (!p.websiteUri) return false;
        const dom = p.websiteUri.replace('https://','').replace('http://','').replace('www.','').split('/')[0];
        return dom !== clientDomain && (p.userRatingCount || 0) >= 10;
      })
      .slice(0, 3)
      .map(p => ({
        name: p.displayName?.text || 'Unknown',
        url: p.websiteUri,
        rating: p.rating,
        review_count: p.userRatingCount,
        address: p.formattedAddress,
        place_id: p.id,
      }));
  } catch { return []; }
}

async function scoreCompetitor(competitor, env) {
  try {
    const content = await extractPageContent(competitor.url);
    const [citJson, presJson] = await Promise.all([
      scoreWithClaude(CITATION_READINESS_PROMPT(content, competitor.url), env),
      scoreWithClaude(PRESENCE_ARCHITECTURE_PROMPT(content, competitor.url, null), env),
    ]);
    const citation = citationScore(citJson);
    const presence = presenceScore(presJson);
    const total = citation + presence;
    return { ...competitor, citation_score: citation, presence_score: presence, dvs_partial: total };
  } catch {
    return { ...competitor, citation_score: null, presence_score: null, dvs_partial: null };
  }
}

// ── Full DVS pipeline ────────────────────────────────────────

async function runDVS(url, businessName, location, niche, env) {
  const content = await extractPageContent(url);
  const gbpData = await fetchGBPData(businessName, location, env).catch(() => null);

  const [citationJson, presenceJson, conversionJson, brandJson] = await Promise.all([
    scoreWithClaude(CITATION_READINESS_PROMPT(content, url), env),
    scoreWithClaude(PRESENCE_ARCHITECTURE_PROMPT(content, url, gbpData), env),
    scoreWithClaude(CONVERSION_ARCHITECTURE_PROMPT(content, url), env),
    scoreWithClaude(BRAND_AUTHORITY_PROMPT(content, url), env),
  ]);

  const citation   = citationScore(citationJson);
  const presence   = presenceScore(presenceJson);
  const conversion = conversionScore(conversionJson);
  const brand      = brandScore(brandJson);
  const total      = citation + presence + conversion + brand;
  const profile    = getProfile(total);

  return {
    total, profile: profile.name, profile_label: profile.label, profile_color: profile.color,
    dimensions: {
      citation_readiness:       { score: citation,    max: 25, json: citationJson,    confidence: aggregateConfidence(citationJson) },
      presence_architecture:    { score: presence,    max: 25, json: presenceJson,    confidence: aggregateConfidence(presenceJson) },
      conversion_architecture:  { score: conversion,  max: 25, json: conversionJson,  confidence: aggregateConfidence(conversionJson) },
      brand_authority:          { score: brand,       max: 25, json: brandJson,       confidence: aggregateConfidence(brandJson) },
    },
    gbp_available: !!gbpData,
  };
}

// ── Storage ──────────────────────────────────────────────────

function generateId() {
  return 'dvs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

async function storeReport(db, reportId, result) {
  const dims = result.dimensions;
  for (const [dimension, data] of Object.entries(dims)) {
    await db.prepare(`
      INSERT INTO dvs_scores (id, report_id, dimension, score, max_score, raw_json, key_finding, top_gap, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(generateId(), reportId, dimension, data.score, data.max,
            JSON.stringify(data.json), data.json.key_finding || null, data.json.top_gap || null, data.confidence).run();
  }
}

async function storeCompetitors(db, reportId, competitors) {
  for (const c of competitors) {
    if (c.citation_score === null) continue;
    await db.prepare(`
      INSERT INTO dvs_competitors (id, report_id, business_name, url, place_id, dvs_total, citation_score, presence_score, profile, scored_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(generateId(), reportId, c.name, c.url, c.place_id || null,
            c.dvs_partial, c.citation_score, c.presence_score,
            getProfile(c.dvs_partial * 2).name, Date.now()).run();
  }
}

// ── Sub-item max scores ──────────────────────────────────────
function getMaxForSubitem(key) {
  return { review_content_quality: 6, review_velocity: 4, recognizable_positioning: 8, owner_searchability: 4, community_presence: 3 }[key] || 5;
}

// ── HTML — Shared styles ─────────────────────────────────────

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{font-family:${DS.font};background:${DS.canvas};color:${DS.graphite};font-size:17px;line-height:1.47;letter-spacing:-0.18px}
a{color:${DS.blueLink};text-decoration:none}
a:hover{text-decoration:underline}

/* Nav */
.nav{background:rgba(255,255,255,0.85);backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);border-bottom:1px solid ${DS.border};padding:0 40px;height:52px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.nav-brand{font-family:${DS.fontDisplay};font-size:18px;font-weight:600;color:${DS.graphite};letter-spacing:-0.22px}
.nav-brand span{color:${DS.blue}}
.nav-actions{display:flex;gap:12px;align-items:center}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;padding:11px 21px;border-radius:980px;border:none;cursor:pointer;font-family:${DS.font};font-size:14px;font-weight:600;letter-spacing:-0.18px;text-decoration:none;transition:opacity .15s}
.btn:hover{text-decoration:none;opacity:.85}
.btn-primary{background:${DS.blue};color:#fff}
.btn-outline{background:transparent;color:${DS.blueLink};border:1.5px solid ${DS.blueLink}}
.btn-sm{padding:7px 16px;font-size:13px}

/* Layout */
.container{max-width:960px;margin:0 auto;padding:0 24px}
.page-body{padding:56px 0 80px}

/* Cards */
.card{background:${DS.white};border-radius:18px;overflow:hidden}
.card-body{padding:28px 32px}

/* Form */
label{display:block;font-size:13px;font-weight:600;color:${DS.midGray};letter-spacing:-0.15px;margin-bottom:6px}
input[type=text],input[type=url]{width:100%;padding:10px 14px;border:1px solid ${DS.border};border-radius:0;font-family:${DS.font};font-size:15px;color:${DS.graphite};background:${DS.white};outline:none;transition:border-color .15s;letter-spacing:-0.18px}
input[type=text]:focus,input[type=url]:focus{border-color:${DS.blue}}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.form-row{margin-bottom:16px}
.checkbox-row{display:flex;align-items:center;gap:10px;margin:16px 0}
.checkbox-row input{width:auto;accent-color:${DS.blue}}
.checkbox-row label{margin:0;font-size:14px;color:${DS.deepGray};font-weight:400}

/* Score hero */
.score-hero{padding:48px 40px;background:${DS.white};border-radius:18px;margin-bottom:24px}
.score-row{display:flex;align-items:flex-end;gap:32px;flex-wrap:wrap}
.score-num-wrap .num{font-family:${DS.fontDisplay};font-size:80px;font-weight:700;line-height:1;color:${DS.graphite};letter-spacing:-2px}
.score-num-wrap .denom{font-size:24px;color:${DS.midGray};font-weight:400;letter-spacing:-0.24px}
.score-meta{display:flex;flex-direction:column;gap:10px}
.profile-pill{display:inline-block;padding:5px 16px;border-radius:980px;font-size:13px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase}
.score-label{font-size:15px;color:${DS.midGray};letter-spacing:-0.18px}
.biz-name{font-family:${DS.fontDisplay};font-size:28px;font-weight:600;color:${DS.graphite};letter-spacing:-0.24px;line-height:1.14;margin-bottom:4px}
.biz-url{font-size:13px;color:${DS.midGray}}

/* Dimension cards */
.dim-card{background:${DS.white};border-radius:18px;padding:28px 32px;margin-bottom:16px}
.dim-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.dim-title{font-family:${DS.fontDisplay};font-size:21px;font-weight:600;letter-spacing:-0.28px;color:${DS.graphite}}
.dim-tagline{font-size:14px;color:${DS.midGray};margin-top:3px;letter-spacing:-0.18px}
.dim-score-wrap{text-align:right;white-space:nowrap}
.dim-score-num{font-family:${DS.fontDisplay};font-size:36px;font-weight:700;letter-spacing:-1px;color:${DS.graphite}}
.dim-score-denom{font-size:16px;color:${DS.midGray};font-weight:400}

/* Progress bar */
.bar-track{height:6px;background:${DS.bgLight};border-radius:999px;overflow:hidden;margin-bottom:20px}
.bar-fill{height:100%;border-radius:999px;transition:width .4s ease}

/* Callout blocks */
.callout{border-radius:12px;padding:14px 18px;font-size:14px;letter-spacing:-0.18px;line-height:1.5;margin-bottom:10px}
.callout-green{background:#f0faf4;border-left:3px solid #2e6b3e;color:${DS.deepGray}}
.callout-amber{background:#fffbeb;border-left:3px solid #b45309;color:${DS.deepGray}}
.callout strong{color:${DS.graphite}}

/* Sub-scores accordion */
details{margin-top:12px}
summary{cursor:pointer;font-size:13px;color:${DS.blueLink};user-select:none;list-style:none}
summary::-webkit-details-marker{display:none}
summary::before{content:'▸ ';font-size:11px}
details[open] summary::before{content:'▾ '}
.sub-table{margin-top:14px;width:100%;border-collapse:collapse}
.sub-table td{padding:9px 12px;font-size:13px;border-bottom:1px solid ${DS.border};letter-spacing:-0.15px;vertical-align:top}
.sub-table tr:last-child td{border-bottom:none}
.sub-table .sub-name{font-weight:600;color:${DS.graphite};width:160px;white-space:nowrap;text-transform:capitalize}
.sub-table .sub-score{color:${DS.blue};font-weight:700;width:56px;text-align:center}
.sub-table .sub-conf{width:64px;text-align:center}
.sub-table .sub-ev{color:${DS.midGray};font-style:italic}
.conf-high{color:#2e6b3e;font-weight:600;font-size:11px}
.conf-med{color:#b45309;font-weight:600;font-size:11px}
.conf-low{color:#c2410c;font-weight:600;font-size:11px}

/* Competitor section */
.comp-section{background:${DS.white};border-radius:18px;padding:28px 32px;margin-bottom:16px}
.comp-title{font-family:${DS.fontDisplay};font-size:21px;font-weight:600;letter-spacing:-0.28px;margin-bottom:6px}
.comp-subtitle{font-size:14px;color:${DS.midGray};margin-bottom:24px;letter-spacing:-0.18px}
.comp-row{margin-bottom:20px}
.comp-row:last-child{margin-bottom:0}
.comp-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
.comp-name{font-size:15px;font-weight:600;color:${DS.graphite}}
.comp-name.is-client{color:${DS.blue}}
.comp-sub-score{font-size:13px;color:${DS.midGray}}
.comp-score-tag{font-size:15px;font-weight:700;color:${DS.graphite}}
.comp-bars{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.mini-bar-label{font-size:11px;color:${DS.midGray};margin-bottom:3px;letter-spacing:-0.12px}
.mini-bar-track{height:4px;background:${DS.bgLight};border-radius:999px;overflow:hidden}
.mini-bar-fill{height:100%;border-radius:999px}

/* Reports table */
.reports-table{width:100%;border-collapse:collapse}
.reports-table th{text-align:left;padding:10px 16px;font-size:12px;font-weight:600;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid ${DS.border}}
.reports-table td{padding:14px 16px;border-bottom:1px solid ${DS.border};font-size:14px;vertical-align:middle}
.reports-table tr:last-child td{border-bottom:none}
.reports-table tr:hover td{background:${DS.canvas}}
.profile-tag{display:inline-block;padding:3px 10px;border-radius:980px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase}
.score-big{font-family:${DS.fontDisplay};font-size:22px;font-weight:700;color:${DS.graphite}}
.dim-mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:20px}
.dim-mini{background:${DS.canvas};border-radius:12px;padding:14px 16px}
.dim-mini-label{font-size:11px;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
.dim-mini-score{font-size:22px;font-weight:700;font-family:${DS.fontDisplay};color:${DS.graphite}}
.dim-mini-max{font-size:13px;color:${DS.midGray}}
.empty-state{text-align:center;padding:60px 24px;color:${DS.midGray};font-size:15px}
#result-box{margin-top:16px;padding:14px 18px;border-radius:12px;display:none;font-size:14px}
#result-box.ok{background:#f0faf4;color:#1a5c2e}
#result-box.err{background:#fff3f0;color:#9b2c2c}
.spinner{display:none;color:${DS.midGray};font-size:14px;margin-left:12px}
@media(max-width:600px){.form-grid{grid-template-columns:1fr}.score-row{flex-direction:column;gap:16px}.score-num-wrap .num{font-size:56px}.dim-mini-grid{grid-template-columns:1fr}}
`;

// ── HTML — Dashboard ─────────────────────────────────────────

function renderDashboard(reports) {
  const rows = reports.map(r => {
    const p = getProfile(r.total_score || 0);
    return `<tr>
      <td><a href="/reports/${r.id}" style="color:${DS.graphite};font-weight:600">${r.business_name}</a><div style="font-size:12px;color:${DS.midGray};margin-top:2px">${(r.url||'').replace(/^https?:\/\/(www\.)?/,'').slice(0,40)}</div></td>
      <td style="color:${DS.midGray};font-size:13px">${r.category||'—'}</td>
      <td style="color:${DS.midGray};font-size:13px">${r.service_area||'—'}</td>
      <td><span class="score-big">${r.total_score??'—'}</span><span style="font-size:13px;color:${DS.midGray}">/100</span></td>
      <td><span class="profile-tag" style="background:${p.color}22;color:${p.color}">${p.name}</span></td>
      <td style="font-size:12px;color:${DS.midGray}">${r.status === 'running' ? '⏳ Running…' : new Date(r.created_at).toLocaleDateString()}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DVS™ — EngageEngine</title>
<style>${CSS}</style></head>
<body>
<nav class="nav">
  <div class="nav-brand">Engage<span>Engine</span> DVS™</div>
  <div class="nav-actions">
    <a href="/api/reports" class="btn btn-outline btn-sm">API</a>
  </div>
</nav>

<div class="page-body">
<div class="container">

  <div style="margin-bottom:40px">
    <h1 style="font-family:${DS.fontDisplay};font-size:34px;font-weight:700;letter-spacing:-0.1px;margin-bottom:8px">Demand Visibility Score</h1>
    <p style="color:${DS.midGray};font-size:17px">AI visibility diagnostic for local service businesses.</p>
  </div>

  <!-- Audit form -->
  <div class="card" style="margin-bottom:32px">
    <div class="card-body">
      <h2 style="font-family:${DS.fontDisplay};font-size:21px;font-weight:600;letter-spacing:-0.28px;margin-bottom:20px">Run New Audit</h2>
      <form id="auditForm">
        <div class="form-grid">
          <div class="form-row">
            <label>Business Name</label>
            <input type="text" name="businessName" placeholder="The Guttermen" required>
          </div>
          <div class="form-row">
            <label>Website URL</label>
            <input type="url" name="url" placeholder="https://theguttermen.com" required>
          </div>
          <div class="form-row">
            <label>Service Category</label>
            <input type="text" name="niche" placeholder="Gutters & Gutter Guards">
          </div>
          <div class="form-row">
            <label>Service Area</label>
            <input type="text" name="location" placeholder="Columbia, SC">
          </div>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="isProspect" name="isProspect">
          <label for="isProspect">This is a prospect (not a current client)</label>
        </div>
        <div style="display:flex;align-items:center;gap:0">
          <button type="submit" class="btn btn-primary">Run DVS Audit</button>
          <span class="spinner" id="spinner">Scoring… 30–60 seconds</span>
        </div>
      </form>
      <div id="result-box"></div>
    </div>
  </div>

  <!-- Reports table -->
  <div class="card">
    <div class="card-body">
      <h2 style="font-family:${DS.fontDisplay};font-size:21px;font-weight:600;letter-spacing:-0.28px;margin-bottom:20px">All Reports <span style="font-size:15px;font-weight:400;color:${DS.midGray}">(${reports.length})</span></h2>
      ${reports.length === 0
        ? `<div class="empty-state">No reports yet. Run your first audit above.</div>`
        : `<table class="reports-table">
            <thead><tr>
              <th>Business</th><th>Category</th><th>Market</th><th>Score</th><th>Profile</th><th>Date</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>`}
    </div>
  </div>

</div>
</div>

<script>
document.getElementById('auditForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type=submit]');
  const spinner = document.getElementById('spinner');
  const box = document.getElementById('result-box');
  btn.disabled = true; spinner.style.display = 'inline'; box.style.display = 'none';
  try {
    const r = await fetch('/api/audit', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        businessName: form.businessName.value, url: form.url.value,
        niche: form.niche.value||undefined, location: form.location.value||undefined,
        isProspect: form.isProspect.checked
      })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error||'Unknown error');
    box.className = 'ok'; box.style.display = 'block';
    box.innerHTML = '✓ Complete — <a href="/reports/'+d.id+'"><strong>View Report</strong></a> &nbsp;·&nbsp; Score: <strong>'+d.total_score+'/100</strong> &nbsp;·&nbsp; <strong>'+d.profile+'</strong>';
    setTimeout(() => location.reload(), 1500);
  } catch(err) {
    box.className = 'err'; box.style.display = 'block'; box.textContent = '✕ '+err.message;
  } finally { btn.disabled = false; spinner.style.display = 'none'; }
});
</script>
</body></html>`;
}

// ── HTML — Report ────────────────────────────────────────────

function renderReport(report, scores, competitors) {
  const scoreMap = {};
  scores.forEach(s => { scoreMap[s.dimension] = s; });
  const profile = getProfile(report.total_score || 0);

  const dims = [
    { key: 'citation_readiness',      label: 'Citation Readiness',      tagline: 'Can AI cite your content?' },
    { key: 'presence_architecture',   label: 'Presence Architecture',   tagline: 'What do AI agents find when they research you?' },
    { key: 'conversion_architecture', label: 'Conversion Architecture', tagline: 'Does your site convert intent into contact?' },
    { key: 'brand_authority',         label: 'Brand Authority',         tagline: 'Do people search for you by name?' },
  ];

  // ── Dimension cards
  const dimCards = dims.map(d => {
    const s = scoreMap[d.key];
    if (!s) return '';
    const pct = Math.round((s.score / s.max_score) * 100);
    const bc = barColor(pct);
    let subRows = '';
    try {
      const j = JSON.parse(s.raw_json || '{}');
      subRows = Object.entries(j)
        .filter(([, v]) => v && typeof v === 'object' && typeof v.score === 'number')
        .map(([k, v]) => {
          const conf = v.confidence || 'medium';
          const confClass = conf === 'high' ? 'conf-high' : conf === 'low' ? 'conf-low' : 'conf-med';
          return `<tr>
            <td class="sub-name">${k.replace(/_/g,' ')}</td>
            <td class="sub-score">${v.score}/${getMaxForSubitem(k)}</td>
            <td class="sub-conf"><span class="${confClass}">${conf.toUpperCase()}</span></td>
            <td class="sub-ev">"${(v.evidence||'').slice(0,110)}"</td>
          </tr>`;
        }).join('');
    } catch {}

    return `<div class="dim-card">
      <div class="dim-header">
        <div>
          <div class="dim-title">${d.label}</div>
          <div class="dim-tagline">${d.tagline}</div>
        </div>
        <div class="dim-score-wrap">
          <span class="dim-score-num">${s.score}</span>
          <span class="dim-score-denom">/${s.max_score}</span>
        </div>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${bc}"></div></div>
      ${s.key_finding ? `<div class="callout callout-green"><strong>Key finding:</strong> ${s.key_finding}</div>` : ''}
      ${s.top_gap ? `<div class="callout callout-amber"><strong>Top gap:</strong> ${s.top_gap}</div>` : ''}
      <details>
        <summary>Sub-scores</summary>
        <table class="sub-table"><tbody>${subRows}</tbody></table>
      </details>
    </div>`;
  }).join('');

  // ── Competitor section
  let compSection = '';
  if (competitors && competitors.length > 0) {
    const clientCitPct = Math.round(((scoreMap['citation_readiness']?.score || 0) / 25) * 100);
    const clientPresPct = Math.round(((scoreMap['presence_architecture']?.score || 0) / 25) * 100);
    const clientPartial = (scoreMap['citation_readiness']?.score || 0) + (scoreMap['presence_architecture']?.score || 0);

    const allRows = [
      // Client row first
      {
        name: report.business_name,
        citPct: clientCitPct,
        presPct: clientPresPct,
        total: clientPartial,
        isClient: true,
        url: report.url,
      },
      ...competitors.map(c => ({
        name: c.business_name,
        citPct: Math.round(((c.citation_score || 0) / 25) * 100),
        presPct: Math.round(((c.presence_score || 0) / 25) * 100),
        total: (c.citation_score || 0) + (c.presence_score || 0),
        isClient: false,
        url: c.url,
      }))
    ].sort((a, b) => b.total - a.total);

    const compRows = allRows.map(row => `
      <div class="comp-row">
        <div class="comp-header">
          <div class="comp-name ${row.isClient ? 'is-client' : ''}">${row.name}${row.isClient ? ' (you)' : ''}</div>
          <div class="comp-score-tag">${row.total}/50</div>
        </div>
        <div class="comp-bars">
          <div>
            <div class="mini-bar-label">Citation Readiness</div>
            <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${row.citPct}%;background:${row.isClient ? DS.blue : DS.midGray}"></div></div>
          </div>
          <div>
            <div class="mini-bar-label">Presence Architecture</div>
            <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${row.presPct}%;background:${row.isClient ? DS.blue : DS.midGray}"></div></div>
          </div>
        </div>
      </div>`).join('');

    compSection = `<div class="comp-section">
      <div class="comp-title">How You Compare</div>
      <div class="comp-subtitle">Citation Readiness + Presence Architecture vs. local competitors in this category and market. These are the two dimensions AI systems rely on most when deciding who to recommend.</div>
      ${compRows}
    </div>`;
  }

  // ── Score hero mini-grid
  const miniDims = dims.map(d => {
    const s = scoreMap[d.key];
    if (!s) return '';
    return `<div class="dim-mini">
      <div class="dim-mini-label">${d.label}</div>
      <div><span class="dim-mini-score">${s.score}</span><span class="dim-mini-max">/${s.max_score}</span></div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${report.business_name} — DVS™ Report</title>
<style>${CSS}</style></head>
<body>
<nav class="nav">
  <div class="nav-brand">Engage<span>Engine</span> DVS™</div>
  <div class="nav-actions">
    <a href="/" class="btn btn-outline btn-sm">← All Reports</a>
    <a href="/api/reports/${report.id}/json" class="btn btn-outline btn-sm" target="_blank">Export JSON</a>
  </div>
</nav>

<div class="page-body">
<div class="container">

  <!-- Score hero -->
  <div class="score-hero" style="margin-bottom:24px">
    <div class="biz-name">${report.business_name}</div>
    <div class="biz-url"><a href="${report.url}" target="_blank">${report.url}</a></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;margin-bottom:28px;font-size:13px;color:${DS.midGray}">
      ${report.category ? `<span>${report.category}</span>` : ''}
      ${report.service_area ? `<span>·</span><span>${report.service_area}</span>` : ''}
      <span>·</span><span>${new Date(report.created_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</span>
    </div>
    <div class="score-row">
      <div class="score-num-wrap">
        <span class="num">${report.total_score}</span>
        <span class="denom"> / 100</span>
      </div>
      <div class="score-meta">
        <span class="profile-pill" style="background:${profile.color}22;color:${profile.color}">${profile.name}</span>
        <span class="score-label">${profile.label}</span>
      </div>
    </div>
    <div class="dim-mini-grid" style="margin-top:28px">${miniDims}</div>
  </div>

  <!-- Competitor comparison -->
  ${compSection}

  <!-- Dimension cards -->
  ${dimCards}

</div>
</div>
</body></html>`;
}

// ── Router ───────────────────────────────────────────────────

// ── CORS — allow marketingperformance.net and local dev ─────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // GET / — Dashboard
    if (method === 'GET' && path === '/') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM dvs_reports ORDER BY created_at DESC LIMIT 100'
      ).all();
      return html(renderDashboard(results || []));
    }

    // POST /api/audit — Run full DVS
    if (method === 'POST' && path === '/api/audit') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
      if (!body.url || !body.businessName) return json({ error: 'url and businessName are required' }, 400);

      const reportId = generateId();
      await env.DB.prepare(`
        INSERT INTO dvs_reports (id, business_name, url, category, service_area, created_at, status, is_prospect)
        VALUES (?, ?, ?, ?, ?, ?, 'running', ?)
      `).bind(reportId, body.businessName, body.url, body.niche||null, body.location||null, Date.now(), body.isProspect?1:0).run();

      try {
        // Run main DVS + competitor discovery in parallel
        const [result, competitors_raw] = await Promise.all([
          runDVS(body.url, body.businessName, body.location||'', body.niche||'', env),
          (body.niche && body.location)
            ? findCompetitors(body.niche, body.location, body.url, env)
            : Promise.resolve([]),
        ]);

        // Score competitors (Citation + Presence only) — parallel
        const competitors = await Promise.all(competitors_raw.map(c => scoreCompetitor(c, env)));

        await storeReport(env.DB, reportId, result);
        await storeCompetitors(env.DB, reportId, competitors);

        await env.DB.prepare(
          'UPDATE dvs_reports SET status=\'complete\', total_score=?, profile=? WHERE id=?'
        ).bind(result.total, result.profile, reportId).run();

        return json({
          id: reportId, total_score: result.total, profile: result.profile, profile_label: result.profile_label,
          dimensions: Object.fromEntries(Object.entries(result.dimensions).map(([k,v]) => [k, { score: v.score, max: v.max, confidence: v.confidence }])),
          competitors: competitors.map(c => ({ name: c.name, citation_score: c.citation_score, presence_score: c.presence_score })),
          report_url: `/reports/${reportId}`,
        }, 200, CORS);
      } catch (err) {
        await env.DB.prepare('UPDATE dvs_reports SET status=\'error\', error_message=? WHERE id=?')
          .bind(err.message.slice(0,500), reportId).run();
        return json({ error: err.message, id: reportId }, 500);
      }
    }

    // GET /api/reports — List JSON
    if (method === 'GET' && path === '/api/reports') {
      const { results } = await env.DB.prepare('SELECT * FROM dvs_reports ORDER BY created_at DESC LIMIT 50').all();
      return json(results || []);
    }

    // GET /reports/:id — HTML report
    const reportMatch = path.match(/^\/reports\/([a-z0-9_]+)$/);
    if (method === 'GET' && reportMatch) {
      const id = reportMatch[1];
      const report = await env.DB.prepare('SELECT * FROM dvs_reports WHERE id=?').bind(id).first();
      if (!report) return new Response('Not found', { status: 404 });
      const { results: scores } = await env.DB.prepare('SELECT * FROM dvs_scores WHERE report_id=?').bind(id).all();
      const { results: competitors } = await env.DB.prepare('SELECT * FROM dvs_competitors WHERE report_id=?').bind(id).all();
      return html(renderReport(report, scores||[], competitors||[]));
    }

    // GET /api/reports/:id/json — Full JSON export
    const jsonMatch = path.match(/^\/api\/reports\/([a-z0-9_]+)\/json$/);
    if (method === 'GET' && jsonMatch) {
      const id = jsonMatch[1];
      const report = await env.DB.prepare('SELECT * FROM dvs_reports WHERE id=?').bind(id).first();
      if (!report) return json({ error: 'Not found' }, 404);
      const { results: scores } = await env.DB.prepare('SELECT * FROM dvs_scores WHERE report_id=?').bind(id).all();
      const { results: competitors } = await env.DB.prepare('SELECT * FROM dvs_competitors WHERE report_id=?').bind(id).all();
      return json({ report, scores: scores||[], competitors: competitors||[] }, 200, CORS);
    }

    return new Response('Not found', { status: 404 });
  }
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...extra } });
}
function html(content) {
  return new Response(content, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
