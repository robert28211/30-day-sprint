var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.js
var DS = {
  graphite: "#1d1d1f",
  deepGray: "#333333",
  midGray: "#707070",
  border: "#d6d6d6",
  bgLight: "#e2e2e5",
  canvas: "#f5f5f7",
  white: "#ffffff",
  blue: "#0071e3",
  blueLink: "#0066cc",
  blueHover: "#2997ff",
  font: `'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  fontDisplay: `'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
};
var PROFILES = [
  { min: 86, max: 100, name: "DEFENDED", label: "Full AI Visibility", color: "#1a7340" },
  { min: 71, max: 85, name: "VISIBLE", label: "Strong AI Presence", color: "#2e6b3e" },
  { min: 51, max: 70, name: "EMERGING", label: "Building Presence", color: "#b45309" },
  { min: 31, max: 50, name: "EXPOSED", label: "Structural Vulnerabilities", color: "#c2410c" },
  { min: 0, max: 30, name: "DARK", label: "Invisible to AI Systems", color: "#991b1b" }
];
function getProfile(score) {
  return PROFILES.find((p) => score >= p.min && score <= p.max) || PROFILES[PROFILES.length - 1];
}
__name(getProfile, "getProfile");
function barColor(pct) {
  if (pct >= 72) return "#0071e3";
  if (pct >= 48) return "#b45309";
  return "#c2410c";
}
__name(barColor, "barColor");
var COMBINED_DVS_PROMPT = /* @__PURE__ */ __name((content, url, businessName, niche, location) => ({
  system: `You are the DVS\u2122 scoring engine. Score a local service business across 4 dimensions using only the page content provided. Be realistic and differentiating \u2014 most local businesses score 8\u201314 per dimension, not 20+. Return valid JSON only, no prose.`,
  user: `Score this business across 4 dimensions (0\u201325 each). Each has 5 criteria worth 0\u20135.

Business: ${businessName}
Category: ${niche || "Local service"}
Location: ${location || ""}
URL: ${url}

Page content:
${content}

---
CITATION READINESS \u2014 Can AI systems quote or cite this content?
- local_specificity (0-5): Specific neighborhoods, local conditions, regional details mentioned
- named_experience (0-5): Quantified claims ("400+ homes", "since 1983", "12 years")
- outcome_language (0-5): Problem\u2192solution\u2192outcome stories (not just feature lists)
- original_claims (0-5): Insights AI can't get from any other local competitor's site
- citable_structure (0-5): FAQ sections, specific Q&A, structured headers AI can parse

CONVERSION ARCHITECTURE \u2014 Does this site turn visitors into calls?
- above_fold_clarity (0-5): Service + location + next action visible without scrolling
- trust_accelerators (0-5): Real photos, named team, licenses, guarantees visible
- cta_architecture (0-5): Phone in header, clear CTAs throughout, zero friction
- social_proof (0-5): Reviews/ratings with specifics \u2014 count, platform, sample quotes
- mobile_signals (0-5): Click-to-call button, brief forms, mobile-aware layout

BRAND AUTHORITY \u2014 Is this business distinct and memorable?
- proprietary_language (0-5): Named processes, branded guarantees, ownable terms
- recognizable_positioning (0-5): Clear "why choose us" that competitors can't copy
- named_identity (0-5): Owner/team name + photo + expertise prominently featured
- differentiation (0-5): Stated specific difference from generic competitors
- community_presence (0-5): Local sponsorships, events, partnerships mentioned

PRESENCE SIGNALS \u2014 Digital credibility visible on the page
- nap_clarity (0-5): Full Name/Address/Phone clearly displayed
- review_signals (0-5): Review count, rating, platform source mentioned on site
- authority_signals (0-5): Awards, certifications, associations, media mentions
- service_coverage (0-5): Specific service area and service list clearly defined
- third_party_signals (0-5): BBB, trade associations, licensing bodies, partner badges

Return this JSON exactly \u2014 integer scores, one-sentence strings for top_gap and key_finding, no other text:
{
  "citation_readiness":      { "local_specificity": 0, "named_experience": 0, "outcome_language": 0, "original_claims": 0, "citable_structure": 0, "top_gap": "biggest missing element", "key_finding": "strongest thing this business does in this dimension" },
  "conversion_architecture": { "above_fold_clarity": 0, "trust_accelerators": 0, "cta_architecture": 0, "social_proof": 0, "mobile_signals": 0, "top_gap": "biggest missing element", "key_finding": "strongest thing this business does in this dimension" },
  "brand_authority":         { "proprietary_language": 0, "recognizable_positioning": 0, "named_identity": 0, "differentiation": 0, "community_presence": 0, "top_gap": "biggest missing element", "key_finding": "strongest thing this business does in this dimension" },
  "presence_architecture":   { "nap_clarity": 0, "review_signals": 0, "authority_signals": 0, "service_coverage": 0, "third_party_signals": 0, "top_gap": "biggest missing element", "key_finding": "strongest thing this business does in this dimension" }
}`
}), "COMBINED_DVS_PROMPT");
function scoreBlock(block) {
  return Object.entries(block || {}).filter(([, v]) => typeof v === "number").reduce((sum, [, v]) => sum + v, 0);
}
__name(scoreBlock, "scoreBlock");
function cleanUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "fbclid",
      "gclid",
      "msclkid",
      "gad_source",
      "_gl"
    ].forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return rawUrl;
  }
}
__name(cleanUrl, "cleanUrl");
function rootUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return rawUrl;
  }
}
__name(rootUrl, "rootUrl");
async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12e3);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache"
      },
      signal: controller.signal,
      redirect: "follow"
    });
    clearTimeout(timeout);
    return response;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
__name(fetchPage, "fetchPage");
function htmlToText(html2) {
  return html2.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
__name(htmlToText, "htmlToText");
var SECONDARY_PATTERNS = [
  /\/faq/i,
  /\/faqs/i,
  /\/frequently-asked/i,
  /\/about/i,
  /\/why-us/i,
  /\/why-choose/i,
  /\/guarantee/i,
  /\/warranty/i,
  /\/services/i,
  /\/our-process/i,
  /\/how-we-work/i,
  /\/team/i,
  /\/our-team/i,
  /\/resources/i
];
function extractInternalLinks(html2, baseUrl) {
  const base = new URL(baseUrl);
  const seen = /* @__PURE__ */ new Set();
  const links = [];
  const re = /href=["']([^"'#?][^"']*?)["']/gi;
  let m;
  while ((m = re.exec(html2)) !== null) {
    try {
      const resolved = new URL(m[1], baseUrl);
      const key = resolved.hostname + resolved.pathname;
      if (resolved.hostname === base.hostname && resolved.pathname !== "/" && resolved.pathname !== base.pathname && !seen.has(key) && !resolved.pathname.match(/\.(jpg|jpeg|png|gif|pdf|css|js|xml|ico|svg|woff)$/i)) {
        seen.add(key);
        links.push(resolved.href);
      }
    } catch {
    }
  }
  return links;
}
__name(extractInternalLinks, "extractInternalLinks");
function scoreSecondaryLinks(links, baseUrl) {
  const scored = [];
  for (const link of links) {
    try {
      const path = new URL(link).pathname.toLowerCase();
      const idx = SECONDARY_PATTERNS.findIndex((p) => p.test(path));
      if (idx !== -1) scored.push({ url: link, priority: idx });
    } catch {
    }
  }
  return scored.sort((a, b) => a.priority - b.priority).slice(0, 3).map((s) => s.url);
}
__name(scoreSecondaryLinks, "scoreSecondaryLinks");
async function fetchSecondaryPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8e3);
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Cache-Control": "no-cache"
      },
      signal: controller.signal,
      redirect: "follow"
    });
    clearTimeout(timeout);
    if (!r.ok || !(r.headers.get("content-type") || "").includes("html")) return "";
    return htmlToText(await r.text()).slice(0, 3500);
  } catch {
    clearTimeout(timeout);
    return "";
  }
}
__name(fetchSecondaryPage, "fetchSecondaryPage");
async function renderWithBrowser(url, env) {
  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45e3);
    try {
      const r = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/content`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url,
            // domcontentloaded + small paint wait works for WordPress/JS-heavy
            // sites. networkidle0 hits "execution context destroyed" on sites
            // that do background redirects (analytics, popup scripts).
            gotoOptions: { waitUntil: "domcontentloaded", timeout: 25e3 },
            waitForTimeout: 2500
          }),
          signal: controller.signal
        }
      );
      clearTimeout(timeout);
      const data = await r.json().catch(() => null);
      const rateLimited = r.status === 429 || (data?.errors || []).some((e) => e.code === 2001);
      if (rateLimited && attempt === 0) {
        await new Promise((res) => setTimeout(res, 35e3));
        continue;
      }
      if (!r.ok) return null;
      return data?.success && data?.result ? data.result : null;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }
  return null;
}
__name(renderWithBrowser, "renderWithBrowser");
async function extractPageContent(url, env) {
  const clean = cleanUrl(url);
  let rawHtml = null;
  try {
    let response = await fetchPage(clean);
    if (!response.ok && [403, 429, 503].includes(response.status)) {
      const root = rootUrl(url);
      if (root !== clean) response = await fetchPage(root);
    }
    if (response.ok && (response.headers.get("content-type") || "").includes("html")) {
      rawHtml = await response.text();
    }
  } catch {
  }
  let homeText = rawHtml ? htmlToText(rawHtml) : "";
  if (homeText.length < 150) {
    const rendered = await renderWithBrowser(clean, env);
    if (rendered) {
      rawHtml = rendered;
      homeText = htmlToText(rendered);
    }
  }
  if (homeText.length < 150) return null;
  const secondaryUrls = rawHtml ? scoreSecondaryLinks(extractInternalLinks(rawHtml, clean), clean) : [];
  const secondaryTexts = secondaryUrls.length > 0 ? await Promise.all(secondaryUrls.map((u) => fetchSecondaryPage(u))) : [];
  const extra = secondaryTexts.filter((t) => t.length > 50).join("\n\n---\n\n");
  const combined = extra ? homeText.slice(0, 1e4) + "\n\n=== ADDITIONAL PAGES ===\n\n" + extra : homeText;
  return combined.slice(0, 2e4);
}
__name(extractPageContent, "extractPageContent");
var AI_RETRIEVAL_BOTS = [
  "gptbot",
  "oai-searchbot",
  "chatgpt-user",
  "google-extended",
  "claudebot",
  "claude-web",
  "anthropic-ai",
  "perplexitybot",
  "ccbot",
  "bytespider",
  "amazonbot"
];
function parseRobots(txt) {
  const lines = txt.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim()).filter(Boolean);
  const groups = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^(user-agent|disallow|allow)\s*:\s*(.*)$/i);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const val = m[2].trim();
    if (field === "user-agent") {
      if (cur && cur.hasRules) {
        groups.push(cur);
        cur = null;
      }
      if (!cur) cur = { agents: [], disallows: [], hasRules: false };
      cur.agents.push(val.toLowerCase());
    } else if (cur) {
      cur.hasRules = true;
      if (field === "disallow") cur.disallows.push(val);
    }
  }
  if (cur) groups.push(cur);
  return groups;
}
__name(parseRobots, "parseRobots");
async function runTechnicalChecks(url, env) {
  const clean = cleanUrl(url);
  const root = rootUrl(url);
  const robotsUrl = (() => {
    try {
      const u = new URL(root);
      return `${u.protocol}//${u.host}/robots.txt`;
    } catch {
      return null;
    }
  })();
  let homeResp = null, homeHtml = "", robotsTxt = "";
  const [homeSettled, robotsSettled] = await Promise.allSettled([
    fetchPage(clean),
    robotsUrl ? fetch(robotsUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; EngageEngine-DVS/1.0)" } }) : Promise.resolve(null)
  ]);
  if (homeSettled.status === "fulfilled" && homeSettled.value) {
    homeResp = homeSettled.value;
    if ((homeResp.headers.get("content-type") || "").includes("html")) {
      homeHtml = await homeResp.text().catch(() => "");
    }
  }
  if (robotsSettled.status === "fulfilled" && robotsSettled.value && robotsSettled.value.ok) {
    robotsTxt = (await robotsSettled.value.text().catch(() => "")).slice(0, 2e4);
  }
  const groups = parseRobots(robotsTxt);
  const agentBlocksRoot = /* @__PURE__ */ __name((name) => groups.some((g) => g.agents.includes(name) && g.disallows.some((d) => d === "/")), "agentBlocksRoot");
  const starBlocked = agentBlocksRoot("*");
  const blockedAi = AI_RETRIEVAL_BOTS.filter(agentBlocksRoot);
  const reachable = homeResp && homeResp.status >= 200 && homeResp.status < 400;
  let botScore, botStatus, botEv;
  if (!reachable) {
    botScore = 0;
    botStatus = "fail";
    botEv = homeResp ? `Homepage returned HTTP ${homeResp.status} to a standard crawler \u2014 content may be unreachable to AI retrieval bots.` : `Homepage could not be retrieved by a standard crawler \u2014 it may be blocking non-browser requests.`;
  } else if (starBlocked) {
    botScore = 1;
    botStatus = "fail";
    botEv = "robots.txt blocks all crawlers from the entire site (Disallow: /). AI systems are told not to read any page.";
  } else if (blockedAi.length) {
    botScore = 2;
    botStatus = "warn";
    botEv = `Site is reachable, but robots.txt explicitly blocks AI retrieval bots: ${blockedAi.join(", ")}. These engines will skip the site.`;
  } else {
    botScore = 3;
    botStatus = "pass";
    botEv = "Site is reachable and open to both search and AI retrieval crawlers.";
  }
  const metaRobots = (homeHtml.match(/<meta[^>]+name=["']robots["'][^>]*>/i)?.[0] || "").toLowerCase();
  const xRobots = (homeResp?.headers.get("x-robots-tag") || "").toLowerCase();
  const directives = `${metaRobots} ${xRobots}`;
  let idxScore, idxStatus, idxEv;
  if (!homeHtml) {
    idxScore = 2;
    idxStatus = "warn";
    idxEv = "Indexability could not be verified \u2014 the homepage HTML was not directly retrievable.";
  } else if (/noindex/.test(directives)) {
    idxScore = 0;
    idxStatus = "fail";
    idxEv = "Homepage carries a noindex directive \u2014 it is excluded from search and AI indexes entirely.";
  } else if (/nosnippet|max-snippet\s*:\s*0/.test(directives)) {
    idxScore = 1;
    idxStatus = "fail";
    idxEv = "A nosnippet / max-snippet:0 directive is present \u2014 content is indexed but cannot be quoted into an AI answer.";
  } else {
    idxScore = 3;
    idxStatus = "pass";
    idxEv = "Pages are indexable and eligible to appear as snippets and citations.";
  }
  const text = homeHtml ? htmlToText(homeHtml) : "";
  const len = text.length;
  let txScore;
  if (len >= 2e3) txScore = 3;
  else if (len >= 800) txScore = 2;
  else if (len >= 300) txScore = 1;
  else txScore = 0;
  const txStatus = txScore >= 3 ? "pass" : txScore >= 1 ? "warn" : "fail";
  const txEv = homeHtml ? `Homepage exposes ~${len.toLocaleString("en-US")} characters of crawlable text${len < 800 ? " \u2014 much of the content may be locked in images, video, or JavaScript that AI crawlers do not execute." : "."}` : "No crawlable text was retrieved on a standard fetch \u2014 content likely renders only via JavaScript, which most AI crawlers do not run.";
  const links = homeHtml ? extractInternalLinks(homeHtml, clean) : [];
  const linkScore = links.length >= 6 ? 1 : 0;
  const linkStatus = linkScore ? "pass" : "warn";
  const linkEv = homeHtml ? `${links.length} internal link${links.length === 1 ? "" : "s"} found on the homepage${links.length < 6 ? " \u2014 answer assets (guides, FAQs, service pages) may be hard for crawlers to discover." : ", exposing deeper answer assets to crawlers."}` : "Internal link structure could not be evaluated.";
  const checks = [
    { key: "bot_access", label: "Crawler Access", max: 3, score: botScore, status: botStatus, evidence: botEv },
    { key: "indexable", label: "Indexable & Snippet-Eligible", max: 3, score: idxScore, status: idxStatus, evidence: idxEv },
    { key: "textual_content", label: "Content in Crawlable Text", max: 3, score: txScore, status: txStatus, evidence: txEv },
    { key: "internal_links", label: "Answer Assets Discoverable", max: 1, score: linkScore, status: linkStatus, evidence: linkEv }
  ];
  const score = checks.reduce((a, c) => a + c.score, 0);
  const passing = checks.filter((c) => c.status === "pass").sort((a, b) => b.score - a.score);
  const ranked = checks.slice().sort((a, b) => a.score / a.max - b.score / b.max);
  const worst = ranked[0];
  return {
    score,
    max: 10,
    checks,
    key_finding: passing.length ? passing[0].evidence : "A basic technical foundation is in place.",
    top_gap: worst && worst.score / worst.max < 1 ? worst.evidence : "No major technical retrieval blockers detected."
  };
}
__name(runTechnicalChecks, "runTechnicalChecks");
async function scoreWithClaude(prompt, env) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3e4);
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1100,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${err.slice(0, 200)}`);
    }
    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    try {
      return JSON.parse(clean);
    } catch {
      throw new Error(`Claude returned non-JSON: ${clean.slice(0, 300)}`);
    }
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
__name(scoreWithClaude, "scoreWithClaude");
function generateId() {
  return "dvs_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}
__name(generateId, "generateId");
async function runDVS(url, businessName, niche, location, env) {
  const [rawContent, technical] = await Promise.all([
    extractPageContent(url, env).catch(() => null),
    runTechnicalChecks(url, env).catch(() => null)
  ]);
  const siteBlocked = !rawContent;
  const content = rawContent || `[Website content unavailable for ${url}. Score on available signals only.]`;
  const r = await scoreWithClaude(
    COMBINED_DVS_PROMPT(content, url, businessName, niche, location),
    env
  );
  const citation = scoreBlock(r.citation_readiness);
  const conversion = scoreBlock(r.conversion_architecture);
  const brand = scoreBlock(r.brand_authority);
  const presence = scoreBlock(r.presence_architecture);
  const contentTotal = citation + conversion + brand + presence;
  let total = contentTotal;
  let cap = null;
  if (technical) {
    let ceiling = null;
    if (technical.score <= 2) ceiling = 30;
    else if (technical.score <= 4) ceiling = 50;
    if (ceiling !== null) {
      const applied = contentTotal > ceiling;
      cap = {
        ceiling,
        applied,
        technical_score: technical.score,
        reason: `AI systems can't reliably retrieve or read this site (Technical Foundation ${technical.score}/10). Visibility is capped until retrieval is fixed \u2014 content quality cannot lift a site AI engines never see.`
      };
      if (applied) total = ceiling;
    }
  }
  const profile = getProfile(total);
  function subScores(block) {
    return Object.fromEntries(
      Object.entries(block || {}).filter(([, v]) => typeof v === "number")
    );
  }
  __name(subScores, "subScores");
  const dimensions = {
    citation_readiness: { score: citation, max: 25, top_gap: r.citation_readiness?.top_gap || "", key_finding: r.citation_readiness?.key_finding || "", raw: subScores(r.citation_readiness) },
    presence_architecture: { score: presence, max: 25, top_gap: r.presence_architecture?.top_gap || "", key_finding: r.presence_architecture?.key_finding || "", raw: subScores(r.presence_architecture) },
    conversion_architecture: { score: conversion, max: 25, top_gap: r.conversion_architecture?.top_gap || "", key_finding: r.conversion_architecture?.key_finding || "", raw: subScores(r.conversion_architecture) },
    brand_authority: { score: brand, max: 25, top_gap: r.brand_authority?.top_gap || "", key_finding: r.brand_authority?.key_finding || "", raw: subScores(r.brand_authority) }
  };
  if (technical) {
    dimensions.technical_foundation = {
      score: technical.score,
      max: 10,
      top_gap: technical.top_gap || "",
      key_finding: technical.key_finding || "",
      raw: { checks: technical.checks, content_total: contentTotal, cap }
    };
  }
  return {
    total,
    content_total: contentTotal,
    profile: profile.name,
    profile_label: profile.label,
    site_blocked: siteBlocked,
    technical_score: technical ? technical.score : null,
    cap,
    dimensions
  };
}
__name(runDVS, "runDVS");
var CSS = `
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
summary::before{content:'\u25B8 ';font-size:11px}
details[open] summary::before{content:'\u25BE '}
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

/* Sub-criteria mini bars */
.sub-bar-cell{width:120px;padding-top:13px!important}
.sub-bar-track{height:4px;background:${DS.bgLight};border-radius:999px;overflow:hidden}
.sub-bar-fill{height:100%;border-radius:999px}

/* Print / PDF */
@media print {
  .nav,.no-print{display:none!important}
  body{background:#fff;font-size:13px}
  .page-body{padding:24px 0}
  .container{max-width:100%;padding:0 16px}
  .score-hero,.dim-card,.comp-section{border-radius:0;box-shadow:none;border:1px solid #ddd;margin-bottom:16px;break-inside:avoid}
  .dim-card{page-break-inside:avoid}
  details{display:block}
  details summary{display:none}
  .bar-track,.sub-bar-track{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .bar-fill,.sub-bar-fill,.mini-bar-fill,.profile-pill,.callout{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  a{color:inherit;text-decoration:none}
  .score-num-wrap .num{font-size:52px}
  .dim-mini-grid{break-inside:avoid}
}

@media(max-width:600px){.form-grid{grid-template-columns:1fr}.score-row{flex-direction:column;gap:16px}.score-num-wrap .num{font-size:56px}.dim-mini-grid{grid-template-columns:1fr}}
`;
function renderDashboard(reports) {
  const rows = reports.map((r) => {
    const p = getProfile(r.total_score || 0);
    return `<tr>
      <td><a href="/reports/${r.id}" style="color:${DS.graphite};font-weight:600">${r.business_name}</a><div style="font-size:12px;color:${DS.midGray};margin-top:2px">${(r.url || "").replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}</div></td>
      <td style="color:${DS.midGray};font-size:13px">${r.category || "\u2014"}</td>
      <td style="color:${DS.midGray};font-size:13px">${r.service_area || "\u2014"}</td>
      <td><span class="score-big">${r.total_score ?? "\u2014"}</span><span style="font-size:13px;color:${DS.midGray}">/100</span></td>
      <td><span class="profile-tag" style="background:${p.color}22;color:${p.color}">${p.name}</span></td>
      <td style="font-size:12px;color:${DS.midGray}">${r.status === "running" ? "\u23F3 Running\u2026" : new Date(r.created_at).toLocaleDateString()}</td>
    </tr>`;
  }).join("");
  return `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DVS\u2122 \u2014 EngageEngine</title>
<style>${CSS}</style></head>
<body>
<nav class="nav">
  <div class="nav-brand">Engage<span>Engine</span> DVS\u2122</div>
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
        <div class="form-row">
          <label>Client <span style="font-weight:400;color:${DS.midGray}">(optional — pick to autofill, or type below)</span></label>
          <select id="ee-client-picker" style="width:100%;padding:10px;border:1px solid #e2ded5;border-radius:8px;font-size:14px"><option value="">— Select a client —</option></select>
        </div>
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
        <div class="form-row">
          <label>Tested in AI <span style="font-weight:400;color:${DS.midGray}">(optional \u2014 what happened when you asked ChatGPT / Gemini / Perplexity for the best provider in this market?)</span></label>
          <input type="text" name="aiPresence" placeholder="e.g. Not mentioned in ChatGPT or Perplexity for &quot;best gutter company Columbia SC&quot; \u2014 3 competitors named">
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="isProspect" name="isProspect">
          <label for="isProspect">This is a prospect (not a current client)</label>
        </div>
        <div style="display:flex;align-items:center;gap:0">
          <button type="submit" class="btn btn-primary">Run DVS Audit</button>
          <span class="spinner" id="spinner">Scoring\u2026 30\u201360 seconds</span>
        </div>
      </form>
      <div id="result-box"></div>
    </div>
  </div>

  <!-- Reports table -->
  <div class="card">
    <div class="card-body">
      <h2 style="font-family:${DS.fontDisplay};font-size:21px;font-weight:600;letter-spacing:-0.28px;margin-bottom:20px">All Reports <span style="font-size:15px;font-weight:400;color:${DS.midGray}">(${reports.length})</span></h2>
      ${reports.length === 0 ? `<div class="empty-state">No reports yet. Run your first audit above.</div>` : `<table class="reports-table">
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
(function(){
  var sel = document.getElementById('ee-client-picker');
  if (!sel) return;
  fetch('/api/ee-roster').then(function(r){return r.json();}).then(function(d){
    (d.clients||[]).filter(function(c){return c.domain;}).sort(function(a,b){return a.name.localeCompare(b.name);}).forEach(function(c){
      var o=document.createElement('option'); o.value=c.domain; o.textContent=c.name; o.dataset.name=c.name; sel.appendChild(o);
    });
  }).catch(function(){});
  sel.addEventListener('change', function(){
    var o=sel.selectedOptions[0]; if(!o||!o.value) return;
    var f=document.getElementById('auditForm');
    var nameI=f.querySelector('[name=businessName]'); if(nameI) nameI.value=o.dataset.name;
    var urlI=f.querySelector('[name=url]'); if(urlI) urlI.value='https://'+o.value;
  });
})();
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
        aiPresence: form.aiPresence.value||undefined,
        isProspect: form.isProspect.checked
      })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error||'Unknown error');
    box.className = 'ok'; box.style.display = 'block';
    box.innerHTML = '\u2713 Complete \u2014 <a href="/reports/'+d.id+'"><strong>View Report</strong></a> &nbsp;\xB7&nbsp; Score: <strong>'+d.total_score+'/100</strong> &nbsp;\xB7&nbsp; <strong>'+d.profile+'</strong>';
    setTimeout(() => location.reload(), 1500);
  } catch(err) {
    box.className = 'err'; box.style.display = 'block'; box.textContent = '\u2715 '+err.message;
  } finally { btn.disabled = false; spinner.style.display = 'none'; }
});
<\/script>
</body></html>`;
}
__name(renderDashboard, "renderDashboard");
function renderReport(report, scores, competitors) {
  const scoreMap = {};
  scores.forEach((s) => {
    scoreMap[s.dimension] = s;
  });
  const profile = getProfile(report.total_score || 0);
  const dims = [
    { key: "citation_readiness", label: "Citation Readiness", tagline: "Can AI cite your content?" },
    { key: "presence_architecture", label: "Presence Architecture", tagline: "What do AI agents find when they research you?" },
    { key: "conversion_architecture", label: "Conversion Architecture", tagline: "Does your site convert intent into contact?" },
    { key: "brand_authority", label: "Brand Authority", tagline: "Do people search for you by name?" }
  ];
  const CRITERIA_LABELS = {
    // Citation Readiness
    local_specificity: "Local Specificity",
    named_experience: "Named Experience",
    outcome_language: "Outcome Language",
    original_claims: "Original Claims",
    citable_structure: "Citable Structure",
    // Conversion Architecture
    above_fold_clarity: "Above-Fold Clarity",
    trust_accelerators: "Trust Accelerators",
    cta_architecture: "CTA Architecture",
    social_proof: "Social Proof",
    mobile_signals: "Mobile Signals",
    // Brand Authority
    proprietary_language: "Proprietary Language",
    recognizable_positioning: "Recognizable Positioning",
    named_identity: "Named Identity",
    differentiation: "Differentiation",
    community_presence: "Community Presence",
    // Presence Architecture
    nap_clarity: "NAP Clarity",
    review_signals: "Review Signals",
    authority_signals: "Authority Signals",
    service_coverage: "Service Coverage",
    third_party_signals: "Third-Party Signals"
  };
  const dimCards = dims.map((d) => {
    const s = scoreMap[d.key];
    if (!s) return "";
    const pct = Math.round(s.score / s.max_score * 100);
    const bc = barColor(pct);
    let subRows = "";
    try {
      const j = JSON.parse(s.raw_json || "{}");
      subRows = Object.entries(j).filter(([, v]) => typeof v === "number").map(([k, v]) => {
        const label = CRITERIA_LABELS[k] || k.replace(/_/g, " ");
        const dotColor = v >= 4 ? "#2e6b3e" : v >= 3 ? "#b45309" : "#c2410c";
        return `<tr>
            <td class="sub-name">${label}</td>
            <td class="sub-score" style="color:${dotColor}">${v}/5</td>
            <td class="sub-bar-cell"><div class="sub-bar-track"><div class="sub-bar-fill" style="width:${v / 5 * 100}%;background:${dotColor}"></div></div></td>
          </tr>`;
      }).join("");
    } catch {
    }
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
      ${s.key_finding ? `<div class="callout callout-green"><strong>What's working:</strong> ${s.key_finding}</div>` : ""}
      ${s.top_gap ? `<div class="callout callout-amber"><strong>Biggest gap:</strong> ${s.top_gap}</div>` : ""}
      ${subRows ? `<details>
        <summary>Sub-criteria breakdown</summary>
        <table class="sub-table"><tbody>${subRows}</tbody></table>
      </details>` : ""}
    </div>`;
  }).join("");
  let compSection = "";
  if (competitors && competitors.length > 0) {
    const clientCitPct = Math.round((scoreMap["citation_readiness"]?.score || 0) / 25 * 100);
    const clientPresPct = Math.round((scoreMap["presence_architecture"]?.score || 0) / 25 * 100);
    const clientPartial = (scoreMap["citation_readiness"]?.score || 0) + (scoreMap["presence_architecture"]?.score || 0);
    const allRows = [
      // Client row first
      {
        name: report.business_name,
        citPct: clientCitPct,
        presPct: clientPresPct,
        total: clientPartial,
        isClient: true,
        url: report.url
      },
      ...competitors.map((c) => ({
        name: c.business_name,
        citPct: Math.round((c.citation_score || 0) / 25 * 100),
        presPct: Math.round((c.presence_score || 0) / 25 * 100),
        total: (c.citation_score || 0) + (c.presence_score || 0),
        isClient: false,
        url: c.url
      }))
    ].sort((a, b) => b.total - a.total);
    const compRows = allRows.map((row) => `
      <div class="comp-row">
        <div class="comp-header">
          <div class="comp-name ${row.isClient ? "is-client" : ""}">${row.name}${row.isClient ? " (you)" : ""}</div>
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
      </div>`).join("");
    compSection = `<div class="comp-section">
      <div class="comp-title">How You Compare</div>
      <div class="comp-subtitle">Citation Readiness + Presence Architecture vs. local competitors in this category and market. These are the two dimensions AI systems rely on most when deciding who to recommend.</div>
      ${compRows}
    </div>`;
  }
  const tech = scoreMap["technical_foundation"];
  let techRaw = null;
  try {
    techRaw = tech ? JSON.parse(tech.raw_json || "{}") : null;
  } catch {
  }
  const cap = techRaw?.cap || null;
  const STATUS_COLOR = { pass: "#2e6b3e", warn: "#b45309", fail: "#c2410c" };
  const STATUS_DOT = { pass: "\u2713", warn: "!", fail: "\u2715" };
  let gateBanner = "";
  if (tech) {
    if (cap && cap.applied) {
      gateBanner = `<div class="callout callout-amber" style="border-left-color:#c2410c;background:#fff3f0;margin-bottom:24px;padding:18px 22px">
        <strong style="color:#c2410c">\u26A0 Score capped at ${cap.ceiling} by the Retrievability Gate.</strong>
        Content scored <strong>${techRaw.content_total}/100</strong>, but ${cap.reason}</div>`;
    } else {
      gateBanner = `<div class="callout callout-green" style="margin-bottom:24px;padding:18px 22px">
        <strong>\u2713 Retrievable.</strong> AI crawlers can reach, read, and index this site (Technical Foundation ${tech.score}/10), so the content score stands on its own.</div>`;
    }
  }
  let techCard = "";
  if (tech) {
    const pct = Math.round(tech.score / (tech.max_score || 10) * 100);
    const bc = barColor(pct);
    const rows = (techRaw?.checks || []).map((c) => {
      const col = STATUS_COLOR[c.status] || DS.midGray;
      return `<tr>
        <td class="sub-name" style="width:230px">${STATUS_DOT[c.status] || ""} ${c.label}</td>
        <td class="sub-score" style="color:${col}">${c.score}/${c.max}</td>
        <td class="sub-ev" style="color:${DS.midGray};font-size:13px;line-height:1.5">${c.evidence}</td>
      </tr>`;
    }).join("");
    techCard = `<div class="dim-card" style="border:1px solid ${cap && cap.applied ? "#c2410c" : DS.border}">
      <div class="dim-header">
        <div>
          <div class="dim-title">Technical Foundation</div>
          <div class="dim-tagline">Can AI crawlers reach, read, and index the site at all?</div>
        </div>
        <div class="dim-score-wrap">
          <span class="dim-score-num">${tech.score}</span>
          <span class="dim-score-denom">/${tech.max_score || 10}</span>
        </div>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${bc}"></div></div>
      ${tech.key_finding ? `<div class="callout callout-green"><strong>What's working:</strong> ${tech.key_finding}</div>` : ""}
      ${tech.top_gap ? `<div class="callout callout-amber"><strong>Biggest gap:</strong> ${tech.top_gap}</div>` : ""}
      <table class="sub-table"><tbody>${rows}</tbody></table>
      <div style="font-size:12px;color:${DS.midGray};margin-top:14px;line-height:1.5">This is Layer 1 of AI visibility: a retrieval bot's plain, non-JavaScript view of the site. A failing foundation caps the overall score \u2014 content can't be cited if AI engines can't retrieve it.</div>
    </div>`;
  }
  const miniDims = dims.map((d) => {
    const s = scoreMap[d.key];
    if (!s) return "";
    return `<div class="dim-mini">
      <div class="dim-mini-label">${d.label}</div>
      <div><span class="dim-mini-score">${s.score}</span><span class="dim-mini-max">/${s.max_score}</span></div>
    </div>`;
  }).join("") + (tech ? `<div class="dim-mini" style="background:${cap && cap.applied ? "#fff3f0" : DS.canvas}">
      <div class="dim-mini-label">Technical Foundation</div>
      <div><span class="dim-mini-score">${tech.score}</span><span class="dim-mini-max">/${tech.max_score || 10} \xB7 gate</span></div>
    </div>` : "");
  const aiNote = report.ai_presence_note ? `<div class="callout" style="background:#f0f6ff;border-left:3px solid ${DS.blue};margin-bottom:24px;padding:14px 18px"><strong style="color:${DS.blue}">Tested in AI:</strong> ${report.ai_presence_note}</div>` : "";
  return `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${report.business_name} \u2014 DVS\u2122 Report</title>
<style>${CSS}</style></head>
<body>
<nav class="nav">
  <div class="nav-brand">Engage<span>Engine</span> DVS\u2122</div>
  <div class="nav-actions">
    <a href="/" class="btn btn-outline btn-sm no-print">\u2190 All Reports</a>
    <a href="/reports/${report.id}/client" class="btn btn-outline btn-sm no-print" target="_blank">Client Report</a>
    <a href="/reports/${report.id}/workorder" class="btn btn-outline btn-sm no-print">Generate Work Order</a>
    <button onclick="publishToPortal('${report.id}','${report.business_name}')" class="btn btn-outline btn-sm no-print" id="publish-btn">Publish to Portal</button>
    <button onclick="window.print()" class="btn btn-primary btn-sm no-print">Save as PDF</button>
  </div>
</nav>

<div class="page-body">
<div class="container">

  <!-- Score hero -->
  <div class="score-hero" style="margin-bottom:24px">
    <div class="biz-name">${report.business_name}</div>
    <div class="biz-url"><a href="${report.url}" target="_blank">${report.url}</a></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;margin-bottom:28px;font-size:13px;color:${DS.midGray}">
      ${report.category ? `<span>${report.category}</span>` : ""}
      ${report.service_area ? `<span>\xB7</span><span>${report.service_area}</span>` : ""}
      <span>\xB7</span><span>${new Date(report.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
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

  <!-- Retrievability gate banner + AI-presence note -->
  ${gateBanner}
  ${aiNote}

  <!-- Competitor comparison -->
  ${compSection}

  <!-- Technical Foundation (Layer 1 \u2014 the gate) -->
  ${techCard}

  <!-- Dimension cards -->
  ${dimCards}

</div>
</div>

<script>
async function publishToPortal(reportId, businessName) {
  // Derive a default client slug from the business name
  const defaultSlug = businessName
    .toLowerCase()
    .replace(/[''']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const slug = prompt('Enter the portal client slug:', defaultSlug);
  if (!slug) return;

  const btn = document.getElementById('publish-btn');
  btn.textContent = 'Publishing\u2026';
  btn.disabled = true;

  try {
    const resp = await fetch('/api/reports/' + reportId + '/publish-to-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-portal-token': '3e9d34a4797a31326649540d282215ea84143082fd3166b221539f417b89e5f8' },
      body: JSON.stringify({ client_slug: slug }),
    });
    const data = await resp.json();
    if (resp.ok && data.ok) {
      btn.textContent = '\u2713 Published';
      btn.style.color = 'green';
    } else {
      btn.textContent = 'Failed \u2014 check console';
      btn.disabled = false;
      console.error('Portal publish error:', data);
    }
  } catch (e) {
    btn.textContent = 'Error';
    btn.disabled = false;
    console.error(e);
  }
}
<\/script>
</body></html>`;
}
__name(renderReport, "renderReport");
function buildWorkOrderPrompt(report, scores) {
  const scoreMap = {};
  scores.forEach((s) => {
    scoreMap[s.dimension] = s;
  });
  const dims = [
    { key: "citation_readiness", label: "Citation Readiness" },
    { key: "conversion_architecture", label: "Conversion Architecture" },
    { key: "brand_authority", label: "Brand Authority" },
    { key: "presence_architecture", label: "Presence Architecture" }
  ];
  const dimSummary = dims.map((d) => {
    const s = scoreMap[d.key];
    if (!s) return "";
    let subDetail = "";
    try {
      const j = JSON.parse(s.raw_json || "{}");
      subDetail = Object.entries(j).filter(([, v]) => typeof v === "number").map(([k, v]) => `  \u2022 ${k.replace(/_/g, " ")}: ${v}/5`).join("\n");
    } catch {
    }
    return `${d.label}: ${s.score}/${s.max_score}
  What's working: ${s.key_finding || "n/a"}
  Biggest gap: ${s.top_gap || "n/a"}
${subDetail}`;
  }).join("\n\n");
  return {
    system: `You are an AI visibility strategist writing a specific, actionable work order for a local service business website. Write for a skilled intern or a capable AI coding assistant. Tasks must be concrete enough to execute without guessing. Return valid JSON only.`,
    user: `Generate a prioritized work order for this business based on their DVS\u2122 AI Visibility Score.

Business: ${report.business_name}
Website: ${report.url}
Category: ${report.category || "Local service"}
Market: ${report.service_area || ""}
DVS Score: ${report.total_score}/100 \u2014 ${report.profile}

DIMENSION ANALYSIS:
${dimSummary}

Write exactly 3 tasks per dimension. Sort dimensions lowest score first (highest priority first).

Each task must include:
- task: verb-first, specific action (not vague advice) \u2014 max 12 words
- where: exact page or section (e.g. "Homepage hero", "About page") \u2014 max 8 words
- why: one sentence on AI visibility impact, max 25 words
- how: exactly 3 numbered steps, max 15 words each
- effort: "Low" (< 1 hour) | "Medium" (1\u20133 hours) | "High" (3+ hours or requires client input)

Be concise. Every field must stay within these limits.

Return this JSON exactly:
{
  "client": "${report.business_name}",
  "url": "${report.url}",
  "score": ${report.total_score},
  "profile": "${report.profile}",
  "dimensions": [
    {
      "name": "Brand Authority",
      "score": 14,
      "max": 25,
      "priority": 1,
      "tasks": [
        {
          "task": "Add owner name and photo above the fold on the homepage",
          "where": "Homepage \u2014 hero section or first content block",
          "why": "Named identity is a primary AI citation signal \u2014 AI systems trust and recommend businesses with a named, visible human owner over anonymous companies.",
          "how": ["Step 1", "Step 2", "Step 3"],
          "effort": "Medium"
        }
      ]
    }
  ]
}`
  };
}
__name(buildWorkOrderPrompt, "buildWorkOrderPrompt");
async function generateWorkOrder(report, scores, env) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45e3);
  try {
    const prompt = buildWorkOrderPrompt(report, scores);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 6e3,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Anthropic error ${response.status}`);
    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
__name(generateWorkOrder, "generateWorkOrder");
function renderWorkOrder(wo) {
  const profile = getProfile(wo.score);
  const effortColor = { Low: "#2e6b3e", Medium: "#b45309", High: "#c2410c" };
  const priorityLabel = ["", "Priority 1 \u2014 Highest Impact", "Priority 2", "Priority 3", "Priority 4"];
  const dimSections = (wo.dimensions || []).map((d, i) => {
    const pct = Math.round(d.score / d.max * 100);
    const bc = barColor(pct);
    const tasks = (d.tasks || []).map((t, ti) => {
      const ec = effortColor[t.effort] || DS.midGray;
      const steps = (t.how || []).map((s, si) => `<li>${s}</li>`).join("");
      return `<div class="wo-task">
        <div class="wo-task-header">
          <label class="wo-checkbox-label">
            <input type="checkbox" class="wo-check">
            <span class="wo-task-title">${t.task}</span>
          </label>
          <span class="wo-effort" style="color:${ec}">${t.effort}</span>
        </div>
        <div class="wo-task-meta">
          <span class="wo-where">\u{1F4CD} ${t.where}</span>
        </div>
        <div class="wo-why">${t.why}</div>
        <details class="wo-how">
          <summary>How to do it</summary>
          <ol class="wo-steps">${steps}</ol>
        </details>
      </div>`;
    }).join("");
    return `<section class="wo-dim">
      <div class="wo-dim-header">
        <div class="wo-dim-left">
          <div class="wo-priority-label">${priorityLabel[i + 1] || `Priority ${i + 1}`}</div>
          <div class="wo-dim-name">${d.name}</div>
        </div>
        <div class="wo-dim-score-wrap">
          <span class="wo-dim-score">${d.score}</span>
          <span class="wo-dim-max">/${d.max}</span>
        </div>
      </div>
      <div class="bar-track" style="margin-bottom:20px"><div class="bar-fill" style="width:${pct}%;background:${bc}"></div></div>
      ${tasks}
    </section>`;
  }).join("");
  const WO_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased}
body{font-family:${DS.font};background:${DS.canvas};color:${DS.graphite};font-size:15px;line-height:1.5;letter-spacing:-0.15px}
.nav{background:rgba(255,255,255,0.9);backdrop-filter:blur(20px);border-bottom:1px solid ${DS.border};padding:0 40px;height:52px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.nav-brand{font-family:${DS.fontDisplay};font-size:18px;font-weight:600;color:${DS.graphite};letter-spacing:-0.22px}
.nav-brand span{color:${DS.blue}}
.nav-actions{display:flex;gap:10px}
.btn{display:inline-flex;align-items:center;padding:8px 18px;border-radius:980px;border:none;cursor:pointer;font-family:${DS.font};font-size:13px;font-weight:600;text-decoration:none;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn-primary{background:${DS.blue};color:#fff}
.btn-outline{background:transparent;color:${DS.blueLink};border:1.5px solid ${DS.blueLink}}
.wrap{max-width:800px;margin:0 auto;padding:48px 24px 80px}

/* Header card */
.wo-header{background:${DS.white};border-radius:18px;padding:32px 36px;margin-bottom:32px}
.wo-client{font-family:${DS.fontDisplay};font-size:30px;font-weight:700;letter-spacing:-0.5px;margin-bottom:4px}
.wo-url{font-size:13px;color:${DS.midGray};margin-bottom:20px}
.wo-meta{display:flex;gap:24px;flex-wrap:wrap;align-items:center}
.wo-score-big{font-family:${DS.fontDisplay};font-size:52px;font-weight:700;letter-spacing:-2px;color:${DS.graphite};line-height:1}
.wo-score-denom{font-size:18px;color:${DS.midGray};font-weight:400}
.wo-profile-pill{display:inline-block;padding:5px 16px;border-radius:980px;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase}
.wo-intro{font-size:14px;color:${DS.midGray};margin-top:16px;line-height:1.6}

/* Dimension sections */
.wo-dim{background:${DS.white};border-radius:18px;padding:28px 32px;margin-bottom:20px}
.wo-dim-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
.wo-dim-left{}
.wo-priority-label{font-size:11px;font-weight:700;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px}
.wo-dim-name{font-family:${DS.fontDisplay};font-size:22px;font-weight:600;letter-spacing:-0.28px}
.wo-dim-score{font-family:${DS.fontDisplay};font-size:36px;font-weight:700;letter-spacing:-1px}
.wo-dim-max{font-size:16px;color:${DS.midGray}}
.bar-track{height:6px;background:${DS.bgLight};border-radius:999px;overflow:hidden}
.bar-fill{height:100%;border-radius:999px}

/* Tasks */
.wo-task{border-top:1px solid ${DS.border};padding:18px 0}
.wo-task:first-of-type{border-top:none;padding-top:0}
.wo-task-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px}
.wo-checkbox-label{display:flex;align-items:flex-start;gap:10px;cursor:pointer;flex:1}
.wo-check{width:17px;height:17px;accent-color:${DS.blue};margin-top:2px;flex-shrink:0}
.wo-task-title{font-size:15px;font-weight:600;color:${DS.graphite};line-height:1.4}
.wo-effort{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;margin-top:3px}
.wo-task-meta{margin-bottom:8px}
.wo-where{font-size:13px;color:${DS.midGray}}
.wo-why{font-size:14px;color:${DS.deepGray};background:${DS.canvas};border-radius:8px;padding:10px 14px;margin-bottom:10px;line-height:1.55}
.wo-how{margin-top:4px}
.wo-how summary{cursor:pointer;font-size:13px;color:${DS.blueLink};user-select:none;list-style:none}
.wo-how summary::-webkit-details-marker{display:none}
.wo-how summary::before{content:'\u25B8 ';font-size:11px}
.wo-how[open] summary::before{content:'\u25BE '}
.wo-steps{margin:12px 0 4px 18px;display:flex;flex-direction:column;gap:8px}
.wo-steps li{font-size:14px;color:${DS.deepGray};line-height:1.5}

/* Print */
@media print {
  .nav,.no-print{display:none!important}
  body{background:#fff;font-size:13px}
  .wrap{padding:16px 0}
  .wo-header,.wo-dim{border-radius:0;border:1px solid #ddd;margin-bottom:14px;break-inside:avoid}
  .wo-dim{page-break-inside:avoid}
  details{display:block}
  details summary{display:none}
  .wo-steps{display:flex;flex-direction:column;gap:6px}
  .bar-fill{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .wo-profile-pill{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  a{color:inherit;text-decoration:none}
}
`;
  const dateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${wo.client} \u2014 DVS\u2122 Work Order</title>
<style>${WO_CSS}</style></head>
<body>
<nav class="nav">
  <div class="nav-brand">Engage<span>Engine</span> DVS\u2122</div>
  <div class="nav-actions no-print">
    <a href="javascript:history.back()" class="btn btn-outline">\u2190 Report</a>
    <button onclick="window.print()" class="btn btn-primary">Save as PDF</button>
  </div>
</nav>

<div class="wrap">
  <div class="wo-header">
    <div class="wo-client">${wo.client}</div>
    <div class="wo-url"><a href="${wo.url}" target="_blank">${wo.url}</a></div>
    <div class="wo-meta">
      <div>
        <span class="wo-score-big">${wo.score}</span>
        <span class="wo-score-denom"> / 100</span>
      </div>
      <span class="wo-profile-pill" style="background:${profile.color}22;color:${profile.color}">${wo.profile}</span>
    </div>
    <div class="wo-intro">
      This work order was generated from the DVS\u2122 AI Visibility Score on ${dateStr}.
      Tasks are ordered by impact \u2014 Priority 1 dimensions have the lowest scores and the most room to move the needle.
      Complete tasks in order. Check off each item as it's done.
    </div>
  </div>

  ${dimSections}
</div>
</body></html>`;
}
__name(renderWorkOrder, "renderWorkOrder");
function buildClientReportPrompt(report, scores, competitors) {
  const scoreMap = {};
  scores.forEach((s) => {
    scoreMap[s.dimension] = s;
  });
  const dimOrder = ["citation_readiness", "presence_architecture", "conversion_architecture", "brand_authority"];
  const dimLabels = { citation_readiness: "Citation Readiness", presence_architecture: "Presence Architecture", conversion_architecture: "Conversion Architecture", brand_authority: "Brand Authority" };
  const dimDetail = dimOrder.map((key) => {
    const s = scoreMap[key];
    if (!s) return "";
    let sub = "";
    try {
      const j = JSON.parse(s.raw_json || "{}");
      sub = Object.entries(j).filter(([, v]) => typeof v === "number").map(([k, v]) => `  \u2022 ${k.replace(/_/g, " ")}: ${v}/5`).join("\n");
    } catch {
    }
    return `${dimLabels[key]}: ${s.score}/25
${sub}
  Key finding: ${s.key_finding || "n/a"}
  Top gap: ${s.top_gap || "n/a"}`;
  }).join("\n\n");
  const compDetail = competitors && competitors.length > 0 ? "\nCOMPETITOR BENCHMARKS (Citation + Presence only):\n" + competitors.map((c) => `  ${c.business_name}: ${(c.citation_score || 0) + (c.presence_score || 0)}/50`).join("\n") : "";
  const techRow = scoreMap["technical_foundation"];
  let techDetail = "";
  let capLine = "";
  if (techRow) {
    let tr = {};
    try {
      tr = JSON.parse(techRow.raw_json || "{}");
    } catch {
    }
    const checkLines = (tr.checks || []).map((c) => `  \u2022 ${c.label}: ${c.score}/${c.max} \u2014 ${c.evidence}`).join("\n");
    techDetail = `
TECHNICAL FOUNDATION (Layer 1 \u2014 can AI crawlers reach/read/index the site): ${techRow.score}/10
${checkLines}`;
    if (tr.cap && tr.cap.applied) {
      capLine = `
IMPORTANT: The score is CAPPED at ${tr.cap.ceiling}. ${tr.cap.reason} Lead the report with this \u2014 fixing retrieval is the prerequisite to everything else.`;
    }
  }
  return {
    system: `You are an EngageEngine DVS\u2122 analyst writing a client-facing AI visibility report for a local service business. Write specific, business-relevant narratives \u2014 not generic advice. Every claim must trace directly to the actual scores. Use the business name, category, and market throughout. Return valid JSON only \u2014 no prose or markdown outside the JSON.

FRAME THE REPORT AROUND HOW AI SEARCH ACTUALLY WORKS (2026):
- Buyers increasingly ask AI engines (Google AI Mode/Overviews, ChatGPT, Gemini, Perplexity) a long, specific question instead of scanning ten blue links. The engine retrieves sources, synthesizes an answer, and recommends a provider \u2014 often before any click.
- AI visibility is a ladder: a page must be (1) CRAWLABLE \u2014 bots can reach and read it, (2) UNDERSTANDABLE \u2014 entities and answers are clear, (3) TRUSTWORTHY \u2014 corroborated by reviews and third parties, (4) CITATION-WORTHY \u2014 packaged so the answer quotes it. Each rung depends on the one below it.
- A business's own website is only ~5\u201310% of what AI engines pull from; the rest is reviews, directories, and third-party mentions. That is why Presence and Citation Readiness matter as much as the site itself.
Speak in these terms naturally \u2014 do not lecture or cite statistics at the client. Translate the scores into what it means for whether AI recommends THEM when a nearby buyer asks.`,
    user: `Generate a full client Signal Report for this business.

Business: ${report.business_name}
Website: ${report.url}
Category: ${report.category || "Local service"}
Market: ${report.service_area || "Local market"}
DVS Score: ${report.total_score}/100 \u2014 ${report.profile}
${techDetail}${capLine}
${report.ai_presence_note ? `
LIVE AI TEST (what actually happened when an AI engine was asked for the best provider in this market): ${report.ai_presence_note}
Reference this concretely in profile_explanation or retrievability_summary \u2014 it is real, observed evidence and is highly persuasive.` : ""}
DIMENSION DATA:
${dimDetail}
${compDetail}

Return this JSON exactly:
{
  "profile_explanation": "2-3 sentences. Lead with what this business has built and what's working \u2014 reference their actual high scores. Then frame the remaining opportunity positively: what becomes possible when the gaps are closed. Client-facing, encouraging, forward-looking. Not alarming.",
  "retrievability_summary": "2-3 sentences on the Technical Foundation: in plain language, can AI crawlers actually reach, read, and index this site? If the score is capped, explain that this is the prerequisite to everything else and what specifically is blocking retrieval. If the foundation is solid, say so in one line and move on. No jargon \u2014 say 'AI search engines' not 'bots', avoid 'crawlability'.",
  "dimensions": [
    {
      "key": "citation_readiness",
      "what_this_means": "3-4 sentences specific to this business. What do these sub-scores mean for how AI systems treat them? What real buyer or AI recommendation behavior is affected? Reference their actual category and market.",
      "the_fix": "2-3 sentences. Specific prescription \u2014 not 'add content' but WHAT to write about WHAT topics specific to their category and market, that closes the gap identified in top_gap."
    },
    { "key": "presence_architecture", "what_this_means": "...", "the_fix": "..." },
    { "key": "conversion_architecture", "what_this_means": "...", "the_fix": "..." },
    { "key": "brand_authority", "what_this_means": "...", "the_fix": "..." }
  ],
  "priority_roadmap": [
    { "when": "Week 1", "action": "specific action", "dimension": "Dimension Name" }
  ],
  "retainer_table": [
    { "service": "service name", "gap_addressed": "which dimension and sub-item", "price": "price estimate" }
  ],
  "target_score": 0,
  "talking_points": {
    "opening_hook": "2-3 sentences Robbie says to open the conversation. Reference the score, their biggest strength, and the core tension.",
    "pivot": "2-3 sentences transitioning from strength to the most critical gap. Should feel like insight, not pitch.",
    "proof_point": "2-3 sentences pointing to a specific underutilized asset on their site that proves the gap is fixable. Name it specifically."
  }
}`
  };
}
__name(buildClientReportPrompt, "buildClientReportPrompt");
async function generateClientReport(report, scores, competitors, env) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5e4);
  try {
    const prompt = buildClientReportPrompt(report, scores, competitors);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4e3, system: prompt.system, messages: [{ role: "user", content: prompt.user }] }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Anthropic error ${response.status}`);
    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
__name(generateClientReport, "generateClientReport");
function renderGeneratedClientReport(data, report, scores, competitors) {
  const scoreMap = {};
  scores.forEach((s) => {
    scoreMap[s.dimension] = s;
  });
  const profile = getProfile(report.total_score || 0);
  const techRow = scoreMap["technical_foundation"];
  let techCap = null;
  if (techRow) {
    try {
      techCap = JSON.parse(techRow.raw_json || "{}").cap || null;
    } catch {
    }
  }
  const capped = techCap && techCap.applied;
  const retrievabilityBlock = data.retrievability_summary || capped ? `
    <div style="background:${capped ? "#fff3f0" : "#f0f6ff"};border-left:3px solid ${capped ? "#c2410c" : DS.blue};border-radius:8px;padding:16px 20px;margin-bottom:28px;max-width:640px">
      <div style="font-size:12px;font-weight:600;color:${capped ? "#c2410c" : DS.blue};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Can AI Read Your Site?${techRow ? ` &nbsp;\xB7&nbsp; ${techRow.score}/10` : ""}</div>
      <p style="font-size:15px;color:${DS.deepGray};line-height:1.6">${data.retrievability_summary || techCap.reason}</p>
    </div>` : "";
  const dims = [
    { key: "citation_readiness", label: "Citation Readiness", tagline: "Can AI cite your expertise?" },
    { key: "presence_architecture", label: "Presence Architecture", tagline: "What do AI agents find when they research you?" },
    { key: "conversion_architecture", label: "Conversion Architecture", tagline: "Does your site convert AI-referred visitors?" },
    { key: "brand_authority", label: "Brand Authority", tagline: "Do people search for you by name?" }
  ];
  const miniDims = dims.map((d) => {
    const s = scoreMap[d.key];
    if (!s) return "";
    return `<div style="background:${DS.canvas};border-radius:12px;padding:14px 16px">
      <div style="font-size:11px;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${d.label}</div>
      <div><span style="font-size:22px;font-weight:700;font-family:${DS.fontDisplay}">${s.score}</span><span style="font-size:13px;color:${DS.midGray}">/${s.max_score}</span></div>
    </div>`;
  }).join("");
  let compSection = "";
  if (competitors && competitors.length > 0) {
    const cit = scoreMap["citation_readiness"]?.score || 0;
    const pre = scoreMap["presence_architecture"]?.score || 0;
    const allRows = [
      { name: report.business_name, citPct: Math.round(cit / 25 * 100), presPct: Math.round(pre / 25 * 100), total: cit + pre, isClient: true },
      ...competitors.map((c) => ({ name: c.business_name, citPct: Math.round((c.citation_score || 0) / 25 * 100), presPct: Math.round((c.presence_score || 0) / 25 * 100), total: (c.citation_score || 0) + (c.presence_score || 0), isClient: false }))
    ].sort((a, b) => b.total - a.total);
    const compRows = allRows.map((row) => `
      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <div style="font-size:15px;font-weight:600;color:${row.isClient ? DS.blue : DS.graphite}">${row.name}${row.isClient ? " \u2014 you" : ""}</div>
          <div style="font-size:15px;font-weight:700">${row.total}/50</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div><div style="font-size:11px;color:${DS.midGray};margin-bottom:3px">Citation Readiness</div><div style="height:4px;background:${DS.bgLight};border-radius:999px;overflow:hidden"><div style="height:100%;width:${row.citPct}%;background:${row.isClient ? DS.blue : DS.midGray};border-radius:999px"></div></div></div>
          <div><div style="font-size:11px;color:${DS.midGray};margin-bottom:3px">Presence Architecture</div><div style="height:4px;background:${DS.bgLight};border-radius:999px;overflow:hidden"><div style="height:100%;width:${row.presPct}%;background:${row.isClient ? DS.blue : DS.midGray};border-radius:999px"></div></div></div>
        </div>
      </div>`).join("");
    compSection = `<div style="background:${DS.white};border-radius:18px;padding:28px 32px;margin-bottom:16px">
      <div style="font-family:${DS.fontDisplay};font-size:21px;font-weight:600;letter-spacing:-0.28px;margin-bottom:6px">How You Compare</div>
      <div style="font-size:14px;color:${DS.midGray};margin-bottom:24px">Citation + Presence vs. local competitors \u2014 the two dimensions AI systems weight most when recommending providers.</div>
      ${compRows}</div>`;
  }
  const dimSections = dims.map((d) => {
    const s = scoreMap[d.key];
    if (!s) return "";
    const genDim = (data.dimensions || []).find((x) => x.key === d.key) || {};
    const pct = Math.round(s.score / s.max_score * 100);
    const bc = barColor(pct);
    return `<div style="background:${DS.white};border-radius:18px;padding:32px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <div>
          <div style="font-family:${DS.fontDisplay};font-size:21px;font-weight:600;letter-spacing:-0.28px">${d.label}</div>
          <div style="font-size:13px;color:${DS.midGray};margin-top:3px">${d.tagline}</div>
        </div>
        <div style="text-align:right;white-space:nowrap">
          <span style="font-family:${DS.fontDisplay};font-size:36px;font-weight:700;letter-spacing:-1px">${s.score}</span>
          <span style="font-size:16px;color:${DS.midGray};font-weight:400">/${s.max_score}</span>
        </div>
      </div>
      <div style="height:6px;background:${DS.bgLight};border-radius:999px;overflow:hidden;margin-bottom:20px"><div style="height:100%;width:${pct}%;background:${bc};border-radius:999px"></div></div>
      ${genDim.what_this_means ? `<div style="margin-bottom:16px"><div style="font-size:12px;font-weight:600;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">What This Means</div><p style="font-size:15px;color:${DS.deepGray};line-height:1.6">${genDim.what_this_means}</p></div>` : ""}
      ${genDim.the_fix ? `<div style="background:#f0faf4;border-left:3px solid #2e6b3e;border-radius:8px;padding:14px 18px"><div style="font-size:12px;font-weight:600;color:#2e6b3e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">The Fix</div><p style="font-size:14px;color:${DS.deepGray};line-height:1.55">${genDim.the_fix}</p></div>` : ""}
    </div>`;
  }).join("");
  const roadmapRows = (data.priority_roadmap || []).map((a) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${DS.border};font-size:13px;color:${DS.midGray};white-space:nowrap;vertical-align:top">${a.when}</td>
      <td style="padding:12px 16px;border-bottom:1px solid ${DS.border};font-size:14px;color:${DS.deepGray};vertical-align:top">${a.action}</td>
      <td style="padding:12px 16px;border-bottom:1px solid ${DS.border};font-size:13px;color:${DS.midGray};white-space:nowrap;vertical-align:top">${a.dimension}</td>
    </tr>`).join("");
  const retainerRows = (data.retainer_table || []).map((r) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${DS.border};font-size:14px;font-weight:600;color:${DS.graphite};vertical-align:top">${r.service}</td>
      <td style="padding:12px 16px;border-bottom:1px solid ${DS.border};font-size:13px;color:${DS.midGray};vertical-align:top">${r.gap_addressed}</td>
      <td style="padding:12px 16px;border-bottom:1px solid ${DS.border};font-size:14px;font-weight:600;color:${DS.blue};white-space:nowrap;vertical-align:top">${r.price}</td>
    </tr>`).join("");
  const dateStr = new Date(report.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${report.business_name} \u2014 AI Visibility Signal Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{font-family:${DS.font};background:${DS.canvas};color:${DS.graphite};font-size:17px;line-height:1.47;letter-spacing:-0.18px}
@media print{body{background:#fff} .no-print{display:none!important}}
@media(max-width:600px){.sr-row{flex-direction:column!important;gap:16px!important} .sr-num{font-size:64px!important} .sr-mini{grid-template-columns:1fr 1fr!important}}
</style>
</head>
<body>
<div style="background:${DS.white};border-bottom:1px solid ${DS.border};padding:0 40px;height:52px;display:flex;align-items:center;justify-content:space-between" class="no-print">
  <div style="font-family:${DS.fontDisplay};font-size:18px;font-weight:600;letter-spacing:-0.22px">Engage<span style="color:${DS.blue}">Engine</span>\u2122</div>
  <button onclick="window.print()" style="padding:7px 16px;border-radius:980px;border:1.5px solid ${DS.blueLink};background:transparent;color:${DS.blueLink};font-size:13px;font-weight:600;cursor:pointer;font-family:${DS.font}">Save as PDF</button>
</div>
<div style="max-width:960px;margin:0 auto;padding:48px 24px 80px">

  <div style="background:${DS.white};border-radius:18px;padding:40px;margin-bottom:24px">
    <div style="font-size:12px;font-weight:600;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px">AI Visibility Signal Report</div>
    <div style="font-family:${DS.fontDisplay};font-size:34px;font-weight:700;letter-spacing:-0.5px;margin-bottom:4px">${report.business_name}</div>
    <div style="font-size:13px;color:${DS.midGray};margin-bottom:28px">${report.url}${report.service_area ? " &nbsp;\xB7&nbsp; " + report.service_area : ""} &nbsp;\xB7&nbsp; ${dateStr}</div>
    <div class="sr-row" style="display:flex;align-items:flex-end;gap:32px;flex-wrap:wrap;margin-bottom:24px">
      <div><span class="sr-num" style="font-family:${DS.fontDisplay};font-size:80px;font-weight:700;line-height:1;letter-spacing:-2px">${report.total_score}</span><span style="font-size:24px;color:${DS.midGray};font-weight:400"> / 100</span></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <span style="display:inline-block;padding:5px 16px;border-radius:980px;font-size:13px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;background:${profile.color}22;color:${profile.color}">${profile.name}</span>
        <span style="font-size:15px;color:${DS.midGray}">${profile.label}</span>
      </div>
    </div>
    ${data.profile_explanation ? `<p style="font-size:16px;color:${DS.deepGray};line-height:1.6;max-width:640px;margin-bottom:${retrievabilityBlock ? "20px" : "28px"}">${data.profile_explanation}</p>` : ""}
    ${retrievabilityBlock}
    <div class="sr-mini" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px">${miniDims}</div>
  </div>

  ${compSection}

  <div style="font-family:${DS.fontDisplay};font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-bottom:20px">Your Scores</div>
  ${dimSections}

  <div style="font-family:${DS.fontDisplay};font-size:28px;font-weight:700;letter-spacing:-0.5px;margin:32px 0 16px">90-Day Roadmap</div>
  <div style="background:${DS.white};border-radius:18px;overflow:hidden;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="border-bottom:1px solid ${DS.border}">
        <th style="padding:12px 16px;font-size:12px;font-weight:600;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;text-align:left">When</th>
        <th style="padding:12px 16px;font-size:12px;font-weight:600;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;text-align:left">Action</th>
        <th style="padding:12px 16px;font-size:12px;font-weight:600;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;text-align:left">Dimension</th>
      </tr></thead>
      <tbody>${roadmapRows}</tbody>
    </table>
  </div>

  ${retainerRows ? `
  <div style="font-family:${DS.fontDisplay};font-size:28px;font-weight:700;letter-spacing:-0.5px;margin:32px 0 16px">Recommended Next Steps</div>
  <div style="background:${DS.white};border-radius:18px;overflow:hidden;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="border-bottom:1px solid ${DS.border}">
        <th style="padding:12px 16px;font-size:12px;font-weight:600;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;text-align:left">Service</th>
        <th style="padding:12px 16px;font-size:12px;font-weight:600;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;text-align:left">Gap Addressed</th>
        <th style="padding:12px 16px;font-size:12px;font-weight:600;color:${DS.midGray};text-transform:uppercase;letter-spacing:0.5px;text-align:left">Investment</th>
      </tr></thead>
      <tbody>${retainerRows}</tbody>
    </table>
  </div>` : ""}

  <div style="text-align:center;padding:32px 0;border-top:1px solid ${DS.border};margin-top:40px">
    <div style="font-family:${DS.fontDisplay};font-size:15px;font-weight:600;margin-bottom:4px">EngageEngine\u2122</div>
    <div style="font-size:13px;color:${DS.midGray}">marketingperformance.net &nbsp;\xB7&nbsp; Demand Visibility Diagnostic</div>
  </div>
</div>
</body></html>`;
}
__name(renderGeneratedClientReport, "renderGeneratedClientReport");
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
// ===== EngageEngine shared password-session gate (canonical) =====
// Paste these helpers into the worker, then at the TOP of the fetch handler add:
//   const eeBlocked = await eeGate(request, env, [/* public path regexes */]);
//   if (eeBlocked) return eeBlocked;
// Requires secrets: APP_PASSWORD, SESSION_SIGNING_KEY (same values across all workers).
async function eeSign(env, msg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SESSION_SIGNING_KEY || ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function eeIssue(env) { const exp = Date.now() + 30 * 864e5; return exp + "." + await eeSign(env, "ee:" + exp); }
async function eeValid(env, tok) {
  if (!tok) return false;
  const i = tok.lastIndexOf(".");
  if (i < 1) return false;
  const exp = tok.slice(0, i), sig = tok.slice(i + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return sig === await eeSign(env, "ee:" + exp);
}
function eeCookie(req, name) {
  const h = req.headers.get("Cookie") || "";
  const m = h.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + "="));
  return m ? m.slice(name.length + 1) : null;
}
function eeLoginPage(ret, err) {
  const body = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><title>EngageEngine — Sign In</title><style>body{font-family:'DM Sans',system-ui,sans-serif;background:#F5F3EE;color:#1C1917;display:grid;place-items:center;min-height:100vh;margin:0}form{background:#fff;border:1px solid #E2DED5;border-radius:12px;padding:32px;width:320px;box-shadow:0 2px 12px rgba(0,0,0,.05)}h1{font-size:16px;margin:0 0 4px;letter-spacing:.04em}p{color:#78716C;font-size:13px;margin:0 0 20px}input{width:100%;padding:10px;border:1px solid #E2DED5;border-radius:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box}button{width:100%;padding:10px;background:#CF6344;color:#fff;border:0;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer}.err{color:#DC2626;font-size:12px;margin-bottom:10px}</style><form method=POST action="/ee-login?return=${encodeURIComponent(ret)}"><h1>ENGAGE|ENGINE</h1><p>Enter the team password to continue.</p>${err ? '<div class=err>' + err + '</div>' : ''}<input type=password name=password autofocus placeholder="Password"><button>Sign in</button></form>`;
  return new Response(body, { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
async function eeGate(request, env, publicRes) {
  const url = new URL(request.url);
  if (url.pathname === "/ee-login" && request.method === "POST") {
    const form = await request.formData();
    const ret = url.searchParams.get("return") || "/";
    if ((form.get("password") || "") === env.APP_PASSWORD) {
      const tok = await eeIssue(env);
      return new Response(null, { status: 302, headers: { "Location": ret, "Set-Cookie": `ee_session=${tok}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` } });
    }
    return eeLoginPage(ret, "Incorrect password");
  }
  if ((publicRes || []).some((re) => re.test(url.pathname))) return null;
  if (await eeValid(env, eeCookie(request, "ee_session"))) return null;
  const accept = request.headers.get("Accept") || "";
  if (accept.includes("text/html")) return eeLoginPage(url.pathname + url.search, "");
  return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { "Content-Type": "application/json" } });
}

// Server-side roster proxy — keeps ROSTER_READ_SECRET off the client. Behind the auth gate.
async function eeRosterProxy(env) {
  const empty = new Response('{"clients":[]}', { headers: { "Content-Type": "application/json" } });
  try {
    const r = await fetch("https://sprint.engageengine.cc/api/internal/roster", { headers: { "X-Internal-Secret": env.ROSTER_READ_SECRET || "" } });
    if (!r.ok) return empty;
    const d = await r.json();
    const clients = (d.clients || []).map((c) => ({ name: c.name, domain: c.domain, gads: c.google_ads_customer_id }));
    return new Response(JSON.stringify({ clients }), { headers: { "Content-Type": "application/json" } });
  } catch (e) { return empty; }
}

var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    const eeBlocked = await eeGate(request, env, [/^\/reports\/[a-z0-9_]+\/client$/, /^\/api\/reports\/[a-z0-9_]+\/publish-to-portal$/, /^\/api\/lookup$/]);
    if (eeBlocked) return eeBlocked;
    if (method === "GET" && path === "/") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM dvs_reports ORDER BY created_at DESC LIMIT 100"
      ).all();
      return html(renderDashboard(results || []));
    }
    if (method === "POST" && path === "/api/audit") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400, CORS);
      }
      if (!body.url || !body.businessName) return json({ error: "url and businessName required" }, 400, CORS);
      const reportId = generateId();
      await env.DB.prepare(`
        INSERT INTO dvs_reports (id, business_name, url, category, service_area, created_at, status, is_prospect, ai_presence_note)
        VALUES (?, ?, ?, ?, ?, ?, 'running', ?, ?)
      `).bind(reportId, body.businessName, body.url, body.niche || null, body.location || null, Date.now(), body.isProspect ? 1 : 0, body.aiPresence || null).run();
      try {
        const result = await runDVS(body.url, body.businessName, body.niche || "", body.location || "", env);
        for (const [dim, data] of Object.entries(result.dimensions)) {
          await env.DB.prepare(
            "INSERT INTO dvs_scores (id, report_id, dimension, score, max_score, top_gap, key_finding, raw_json, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(generateId(), reportId, dim, data.score, data.max, data.top_gap || null, data.key_finding || null, data.raw ? JSON.stringify(data.raw) : null, "high").run();
        }
        await env.DB.prepare(
          "UPDATE dvs_reports SET status='complete', total_score=?, profile=? WHERE id=?"
        ).bind(result.total, result.profile, reportId).run();
        try {
          const normalizedSite = String(body.url || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
          const clientRow = await env.DB.prepare(
            "SELECT id, name FROM sprint_clients WHERE domain = ?1 OR name = ?1 LIMIT 1"
          ).bind(normalizedSite).first();
          const clientId = clientRow ? clientRow.id : null;
          const clientName = clientRow ? clientRow.name : normalizedSite;
          await env.DB.prepare(
            "INSERT INTO client_activity (client_id, client_name, tool, kind, score, summary, artifact_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
          ).bind(clientId, clientName, "dvs", "report", result.total, `DVS report — score ${result.total}`, `/reports/${reportId}`).run();
        } catch (activityErr) {
          console.error("client_activity insert failed:", activityErr);
        }
        return json({
          id: reportId,
          total_score: result.total,
          profile: result.profile,
          profile_label: result.profile_label,
          site_blocked: result.site_blocked || false,
          dimensions: Object.fromEntries(
            Object.entries(result.dimensions).map(([k, v]) => [k, { score: v.score, max: v.max }])
          ),
          competitors: [],
          report_url: `/reports/${reportId}`
        }, 200, CORS);
      } catch (err) {
        const msg = (err instanceof Error ? err.message : String(err)).slice(0, 500);
        await env.DB.prepare("UPDATE dvs_reports SET status='error', error_message=? WHERE id=?").bind(msg, reportId).run().catch(() => null);
        return json({ error: msg }, 500, CORS);
      }
    }
    if (method === "GET" && path === "/api/reports") {
      const { results } = await env.DB.prepare("SELECT * FROM dvs_reports ORDER BY created_at DESC LIMIT 50").all();
      return json(results || []);
    }
    if (method === "GET" && path === "/api/ee-roster") {
      return eeRosterProxy(env);
    }
    const publishMatch = path.match(/^\/api\/reports\/([a-z0-9_]+)\/publish-to-portal$/);
    if (method === "POST" && publishMatch) {
      const id = publishMatch[1];
      const token = request.headers.get("x-portal-token");
      if (!env.PORTAL_WEBHOOK_TOKEN || !token || token !== env.PORTAL_WEBHOOK_TOKEN) {
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
      const body = await request.json().catch(() => ({}));
      const clientSlug = body.client_slug;
      if (!clientSlug) return new Response(JSON.stringify({ error: "client_slug required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      const report = await env.DB.prepare("SELECT * FROM dvs_reports WHERE id=?").bind(id).first();
      if (!report || report.status !== "complete") {
        return new Response(JSON.stringify({ error: "report not ready" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      const { results: scores } = await env.DB.prepare("SELECT * FROM dvs_scores WHERE report_id=?").bind(id).all();
      const { results: competitors } = await env.DB.prepare("SELECT * FROM dvs_competitors WHERE report_id=?").bind(id).all();
      const data = await generateClientReport(report, scores || [], competitors || [], env);
      const profile = getProfile(report.total_score || 0);
      const now = /* @__PURE__ */ new Date();
      const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const techRow = (scores || []).find((s) => s.dimension === "technical_foundation");
      const retrievabilitySection = data.retrievability_summary || techRow ? {
        id: "dvs_retrievability",
        headline: `Can AI Read Your Site?${techRow ? ` (${techRow.score}/10)` : ""}`,
        body: data.retrievability_summary || techRow.key_finding || ""
      } : null;
      const portalSections = [
        {
          id: "where_you_are",
          headline: `Your AI Visibility Score: ${report.total_score}/100 \u2014 ${profile.name}`,
          body: (data.profile_explanation || data.opening_paragraph || "") + `

This report covers your visibility across the dimensions AI search engines use to evaluate and recommend local service providers: whether AI can technically read your site, then Citation Readiness, Presence Architecture, Conversion Architecture, and Brand Authority.`
        },
        retrievabilitySection,
        ...(data.dimensions || []).map((d) => ({
          id: `dvs_${d.key || d.dimension}`,
          headline: d.headline || d.label || d.key,
          body: [d.what_this_means, d.the_fix ? `**The Fix:** ${d.the_fix}` : null].filter(Boolean).join("\n\n")
        })),
        data.roadmap ? {
          id: "dvs_roadmap",
          headline: "90-Day AI Visibility Roadmap",
          body: (data.roadmap || []).map((t, i) => `**${i + 1}. ${t.task || t.title}**
${t.rationale || t.description || ""}`).join("\n\n")
        } : null
      ].filter(Boolean);
      const portalResp = await fetch(
        `https://portal.marketingperformance.net/api/publish/monthly-report/${clientSlug}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-portal-token": env.PORTAL_WEBHOOK_TOKEN },
          body: JSON.stringify({
            sections: portalSections,
            type: "dvs",
            period_label: `${monthLabel} \u2014 AI Visibility Signal Report`
          })
        }
      );
      const result = await portalResp.json().catch(() => ({}));
      return new Response(JSON.stringify({ ok: portalResp.ok, portal: result }), {
        status: portalResp.ok ? 200 : 502,
        headers: { "Content-Type": "application/json" }
      });
    }
    const clientMatch = path.match(/^\/reports\/([a-z0-9_]+)\/client$/);
    if (method === "GET" && clientMatch) {
      const id = clientMatch[1];
      const report = await env.DB.prepare("SELECT * FROM dvs_reports WHERE id=?").bind(id).first();
      if (!report) return new Response("Not found", { status: 404 });
      if (report.status !== "complete") return html('<p style="font-family:system-ui;padding:40px">Report is still running \u2014 try again in a moment.</p>');
      const { results: scores } = await env.DB.prepare("SELECT * FROM dvs_scores WHERE report_id=?").bind(id).all();
      const { results: competitors } = await env.DB.prepare("SELECT * FROM dvs_competitors WHERE report_id=?").bind(id).all();
      try {
        const data = await generateClientReport(report, scores || [], competitors || [], env);
        return html(renderGeneratedClientReport(data, report, scores || [], competitors || []));
      } catch (err) {
        return html(`<p style="font-family:system-ui;padding:40px;color:#c00">Client report generation failed: ${err.message}</p>`);
      }
    }
    const reportMatch = path.match(/^\/reports\/([a-z0-9_]+)$/);
    if (method === "GET" && reportMatch) {
      const id = reportMatch[1];
      const report = await env.DB.prepare("SELECT * FROM dvs_reports WHERE id=?").bind(id).first();
      if (!report) return new Response("Not found", { status: 404 });
      const { results: scores } = await env.DB.prepare("SELECT * FROM dvs_scores WHERE report_id=?").bind(id).all();
      const { results: competitors } = await env.DB.prepare("SELECT * FROM dvs_competitors WHERE report_id=?").bind(id).all();
      return html(renderReport(report, scores || [], competitors || []));
    }
    const workorderMatch = path.match(/^\/reports\/([a-z0-9_]+)\/workorder$/);
    if (method === "GET" && workorderMatch) {
      const id = workorderMatch[1];
      const report = await env.DB.prepare("SELECT * FROM dvs_reports WHERE id=?").bind(id).first();
      if (!report) return new Response("Not found", { status: 404 });
      if (report.status !== "complete") return html('<p style="font-family:system-ui;padding:40px">Report is still running \u2014 try again in a moment.</p>');
      const { results: scores } = await env.DB.prepare("SELECT * FROM dvs_scores WHERE report_id=?").bind(id).all();
      try {
        const wo = await generateWorkOrder(report, scores || [], env);
        return html(renderWorkOrder(wo));
      } catch (err) {
        return html(`<p style="font-family:system-ui;padding:40px;color:#c00">Work order generation failed: ${err.message}</p>`);
      }
    }
    const jsonMatch = path.match(/^\/api\/reports\/([a-z0-9_]+)\/json$/);
    if (method === "GET" && jsonMatch) {
      const id = jsonMatch[1];
      const report = await env.DB.prepare("SELECT * FROM dvs_reports WHERE id=?").bind(id).first();
      if (!report) return json({ error: "Not found" }, 404);
      const { results: scores } = await env.DB.prepare("SELECT * FROM dvs_scores WHERE report_id=?").bind(id).all();
      const { results: competitors } = await env.DB.prepare("SELECT * FROM dvs_competitors WHERE report_id=?").bind(id).all();
      return json({ report, scores: scores || [], competitors: competitors || [] }, 200, CORS);
    }
    if (method === "GET" && path === "/api/lookup") {
      const name = url.searchParams.get("business_name");
      if (!name) return json({ error: "business_name query param required" }, 400, CORS);
      const report = await env.DB.prepare(
        "SELECT * FROM dvs_reports WHERE LOWER(business_name) = LOWER(?) AND status = 'complete' ORDER BY created_at DESC LIMIT 1"
      ).bind(name.trim()).first();
      if (!report) return json({ error: "no_report_found", business_name: name }, 404, CORS);
      const { results: scores } = await env.DB.prepare("SELECT * FROM dvs_scores WHERE report_id=?").bind(report.id).all();
      const { results: competitors } = await env.DB.prepare("SELECT * FROM dvs_competitors WHERE report_id=?").bind(report.id).all();
      const lookupScores = (scores || []).filter((s) => s.dimension !== "technical_foundation");
      return json({ report, scores: lookupScores, competitors: competitors || [] }, 200, CORS);
    }
    return new Response("Not found", { status: 404 });
  }
};
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...extra } });
}
__name(json, "json");
function html(content) {
  return new Response(content, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
__name(html, "html");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
