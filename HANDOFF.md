# HANDOFF — marketingperformance.net/snapshot Ad Campaign (Meta + GA4)

**Created:** 2026-06-14
**Purpose of this workspace:** Manage the **Meta (Facebook) ad campaign** and **GA4 analytics** for the `marketingperformance.net/snapshot` lead-gen funnel. This is the operations cockpit — *not* general MPG website work.

> Read this top to bottom before touching anything. The deploy path and account IDs below are verified correct as of 2026-06-14. A prior session wasted ~20 tool calls deploying to the wrong Cloudflare target — don't repeat that. The correct path is in §4.

---

## 1. The funnel (what we're running)

```
Meta ad (Traffic objective)
   → marketingperformance.net/snapshot   [GATE PAGE — type your service]
   → /snapshot/preview?city_state=X&trade=Y   [PREVIEW — sample of buyer data]
   → free-sample request (Formspree mgodnjje) → manual fulfillment within 24h by Robbie
```

**The core problem we are solving:** traffic lands on `/snapshot` and leaves without converting. Over the prior period, hundreds of sessions produced ~0 gate submissions and ~0 preview visits. Copy was rewritten 2026-06-14 (see §5) and deployed live, but **the fix is newer than the data below** — judge it on data from 2026-06-15 onward.

---

## 2. Account IDs (verified)

| System | ID |
|---|---|
| Meta ad account | `act_548797500901490` |
| GA4 property | `391932478` |
| Meta Pixel | firing on marketingperformance.net (installed) |
| Formspree (sample requests) | form id `mgodnjje` |
| Google Ads (if needed) | always pass `manager_id: "7536541386"` |

UTM scheme on snapshot ads: `utm_source=facebook&utm_medium=paid_social&utm_campaign=mpg_v5_snapshot&utm_content={slug}`

---

## 3. Current Meta campaign state (as of 2026-06-14)

**ONLY ONE campaign is active for this funnel:**

| Campaign | ID | Status | Notes |
|---|---|---|---|
| **MPG Snapshot Launch v5** | `120248353762910414` | **ACTIVE** | The live snapshot campaign. Objective: Traffic. |
| └ MPG v5 ad set | `120248353765350414` | active | Daily budget **$50/day** (reduced from higher to pull back during zero-conversion period) |

**Everything else is PAUSED and should stay paused** unless deliberately revived:
- `120248117274130414` — EE — Local Service Businesses — Broad (consolidated INTO v5, intentionally paused)
- `120247100964050414` — EE — Fencing (paused — audience saturation, freq hit 4.16)
- `120247020814570414` — EE — Stone/Hardscape
- `120247020812170414` — EE — Landscaping
- `120248493457530414` — EE — Prospector — Cold
- `120246731473960414` — EE — Plastic Surgery
- (+ older 2025 campaigns, all paused)
- ⚠️ `120241638244290414` — "We Don't Do Marketing" shows **ACTIVE** but its run window ended 2026-03-10. Verify it isn't quietly spending; pause if it is.

**MPG v5 last-7-day performance (2026-06-07 → 06-13):**
- Spend ≈ **$390**, 924 clicks, **CTR 2.36%**, CPC **$0.42**, 439 landing-page views
- ⚠️ **Frequency 5.5** — this is high (saturation/fatigue threshold is ~2.5–3.0). The audience is being over-served. Creative refresh or audience expansion is likely needed soon. This is the #1 media-side issue to watch.

---

## 4. ⚠️ DEPLOY PATH (the landing pages) — DO NOT GET THIS WRONG

`marketingperformance.net` is served by a **Cloudflare Worker named `rough-brook-782b`** — **NOT a Pages project.** Custom domains on that worker: `marketingperformance.net`, `www.marketingperformance.net`, `thesystem.marketingperformance.net`.

**The Astro source for the snapshot pages lives in THIS worktree** (`~/.claude/worktrees/youthful-tu`).

**Correct deploy (verified working 2026-06-14):**
```bash
cd ~/.claude/worktrees/youthful-tu
npm run build
wrangler deploy --config wrangler-worker.toml      # → rough-brook-782b
```
`wrangler-worker.toml` binds: `main = dist/_worker.js/index.js`, `ASSETS = dist`, R2 `PDFS = marketingperformance-pdfs`, D1 `DB = marketingperformance-leads`.

**NEVER use `wrangler pages deploy`.** The `engageengine-staging` and `30-day-sprint` Pages projects have **no domain pointing at them** — deploying there changes nothing on the live site and burns time. There is also a stale `worker.js` build artifact, an `mp-worker` backup, and a `homepage-apple.html` draft in the tree — **do not edit those**, they're not what serves the site.

Cache: after deploy the live URL may show `cf-cache-status: HIT` briefly. The worker content updates immediately; if you need certainty, verify against the worker's own `*.workers.dev` URL or wait out the edge cache.

---

## 5. Landing page files & copy state (2026-06-14)

**Gate page:** `src/pages/snapshot/index.astro`
- Hero H1 (curiosity hook): *"How many people in {displayMarket} searched for your service this week?"*
- Sub: *"Type your service and find out."*
- Above-the-fold trust/guarantee block was **removed** (was killing conversion).
- Form card eyebrow: *"Free Buyer Sample · {displayMarket} · 24 Hours"*
- Inline form sentence: *"Send me 10 buyers in {displayMarket} searching for [your service]."*
- Button: **"Pull My Free Sample →"**
- Micro: *"Delivered to your inbox within 24 hours. No call required."*

**Preview page:** `src/pages/snapshot/[id].astro` (serves `/snapshot/preview?city_state=X&trade=Y`)
- Waitlist language removed. Claim button: **"Send Me the Names →"**
- Confirm headline: *"On its way."* / body references 24-hour manual delivery.
- GA4 event renamed `snapshot_waitlist_submit` → `snapshot_sample_request`.

`displayMarket` auto-detects via Cloudflare geo (`Astro.locals.runtime?.cf.city/.region`), fallback "your market".

---

## 6. Current GA4 funnel (last 7 days, pre-copy-fix — baseline)

| Metric | Value |
|---|---|
| Landing on `/` | 128 sessions |
| Landing on `/snapshot` (+`/snapshot/`) | ~44 sessions |
| `snapshot_viewed` events | **2** |
| `snapshot_gate1_submit` events | **1** |
| `snapshot_sample_request` | 0 |

**Read:** Meta traffic IS arriving at `/snapshot` (fbclid params visible in landing-page report), but almost nobody completes the gate. That's the conversion problem the new copy targets. **Re-measure after 2026-06-15** to see if the rewrite moved it.

Custom events to watch: `snapshot_viewed`, `snapshot_gate1_submit`, `snapshot_sample_request`. Only `page_view / session_start / first_visit / user_engagement` fire reliably today — if the custom events stay near zero after the fix, suspect the event wiring, not just copy.

GA4 query gotchas (learned): date ranges use **snake_case** `start_date`/`end_date`; dimensions/metrics are **plain strings** (`"sessions"`, not `{"name":"sessions"}`); `sessionCampaign` is rejected — use `sessionManualAdContent` for utm_content.

---

## 7. Open tasks / next steps

1. **Measure the copy fix.** After 2026-06-15, pull GA4 `/snapshot` sessions → `snapshot_gate1_submit` → `snapshot_sample_request`. Did the curiosity-hook + free-sample offer lift gate completion above the ~1/week baseline?
2. **MPG v5 frequency 5.5 is too high.** Refresh creative or widen the audience before fatigue tanks CTR. Watch CTR trend vs. the 2.36% current.
3. **LinkedIn UTMs missing.** Boosted LinkedIn posts point to `/snapshot` with no UTMs — attribution is blind. Add `?utm_source=linkedin&utm_medium=paid_social&utm_campaign=hvac_dallas_boost` (Robbie to do on the LinkedIn side).
4. **Combined Meta-vs-LinkedIn funnel readout** was deferred to ~2026-06-16 when clean post-fix data exists.
5. **Verify "We Don't Do Marketing" (120241638244290414)** isn't spending despite a closed run window.

---

## 8. Hard rules (do not break)

- **No dollar amounts in any client-facing copy or report** — spend/CPC/CPL/CPM are internal only.
- **Never name a client** in ads or public copy.
- **Never say "Audiencelab"** in client/public copy — always "custom intent data" (or, in these ads, "buyer data" / "active buyers").
- **Blur real names/addresses/phones** in any demo video before uploading to Meta.
- Account-access requests go to `marketingperformancemcc@gmail.com`, not the personal Gmail.
- Meta ad messaging rules live in `META-ADS.md`: never say "leads"/"lead generation", never "targeting" without "exclusive", always close with the 2X guarantee.

---

## 9. Reference files in this worktree

- `META-ADS.md` — ad creative copy, variants A/B/C, per-market launch checklist, messaging rules
- `LEADS.md` — lead/data notes
- `REPLY-TEMPLATES.md` — DM / reply templates
- `DESIGN.md` — design context
- `wrangler-worker.toml` — the **only** correct deploy config (§4)

---

## 10. Environment notes (carried over, non-campaign)

- **Engram memory** had a corruption incident 2026-06-14 (orphaned `engram mcp` processes racing on the DB). Fixed + permanently guarded by `~/.engram/reap-orphan-mcp.sh` via LaunchAgent `com.engram.reaper`. If Engram ever throws "database disk image is malformed" again: `pkill -f "engram mcp"` then `sqlite3 ~/.engram/default.db "PRAGMA wal_checkpoint(TRUNCATE);"`.
- `engageengine.ai` is a **separate** site deployed from a **different worktree** — do NOT touch it from here. It is correct as-is.
- A Cloudflare token (`cfut_Kr3…`) was exposed in a prior transcript and should be rotated.
