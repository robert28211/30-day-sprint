---
description: Build and push the weekly EngageEngine client recap emails. Runs the committed harness (collect → assemble → push → archive), then the model reviews/elevates drafts and gates on a sample before pushing.
argument-hint: [week-start YYYY-MM-DD] [week-end YYYY-MM-DD]
---

# Weekly Client Emails — EngageEngine

You are producing this week's EngageEngine client recap emails.

**Week to process:** $ARGUMENTS
*(No dates → default to the most recent Sunday-through-Saturday that fully ended before today. State the dates back to Robbie before proceeding.)*

---

## 0. WHAT THESE ARE — read every run

The weekly recap emails are the single most important client-facing artifact in the business.
Clients assume marketing is broken when phone volume dips and surface it in the monthly meeting.
These emails flip that: they put Robbie ahead of the narrative every week, in the voice of the
marketing **authority** — not a contractor filing a status report — with proprietary data the
client can't get anywhere else. Incomplete, sloppy, panicked, or apologetic makes the problem
worse. Treat them that way.

## 0A. THE HARNESS — this is how the work gets done

The mechanical 80% lives in a committed pipeline at **`~/Dropbox/EngageEngine/weekly-emails/`**.
Read its `README.md` first. Your job is to run it, then apply judgment to the output — NOT to
re-derive the pipeline by hand each week.

```
clients.json          ← single source of truth (roster, addresses, services, IDs, seasonal, vertical)
secrets.json          ← Meta token, Audiencelab key, IMAP pw, Clarity JWTs
benchmarks.json       ← per-vertical Q2 2026 anchors
collect.workflow.js   ← args-driven data collector (Workflow tool)
assemble.py           ← week_data.json → drafts.json + previews + flags.md + vault_context/*.md
push.py               ← drafts.json → IMAP Drafts (idempotent)
archive.py            ← → Obsidian Weekly Recap
out/                  ← week_data.json, drafts.json, flags.md, preview/*.txt, vault_context/*.md
```

**Grounded touches (`out/vault_touches.json` → the TOUCHES paragraph):** the per-client point-of-view
line each email carries. PRIMARY SOURCE = the portal narrative harvest (Step 3.5). Supplementary:
`out/vault_context/<key>.md` side files (Obsidian vault retrieval via `vault-retrieve.py`) — useful
for the non-portal clients and for doctrine/benchmark framing. Touches are week-stamped; assemble
ignores a stale file. (Opt-out: `WEEKLY_VAULT_CONTEXT=0` disables the vault side files only.)

`clients.json` replaces the old per-run reconciliation. If a client's roster facts are wrong or
missing, **fix `clients.json`** (and `secrets.json` for tokens) — that's the fix, not a one-off
workaround in chat.

**CANON = the Sprint Tracker client-services page**, backed by the `client_services` table in the
`command-center` D1 (database_id `13f98f2a-574d-495c-acd7-4f8900acd036`). It is the source of truth
for the client list AND which services each client gets. The CLAUDE.md registry and the Credentials
Index are secondary and have been wrong/stale — when they conflict with the Sprint Tracker, the
tracker wins. Reconcile `clients.json` to the tracker, not to the registry. Pull it with:

```sql
SELECT sc.name,
  MAX(CASE WHEN cs.service='gads'       THEN cs.status END) gads,
  MAX(CASE WHEN cs.service='meta'       THEN cs.status END) meta,
  MAX(CASE WHEN cs.service='ga4'        THEN cs.status END) ga4,
  MAX(CASE WHEN cs.service='clarity'    THEN cs.status END) clarity,
  MAX(CASE WHEN cs.service='audiencelab'THEN cs.status END) al,
  MAX(CASE WHEN cs.service='pixel'      THEN cs.status END) pixel,
  MAX(CASE WHEN cs.service='pipeline'   THEN cs.status END) pipeline
FROM sprint_clients sc LEFT JOIN client_services cs ON cs.client_id=sc.id
WHERE COALESCE(sc.archived,0)=0 GROUP BY sc.id ORDER BY sc.name;
```

A service counts as present only when status = `active` (`none`/`paused`/`cancelled`/`null` = off).
There is no reliable `weekly_email` flag in the data — the **send-list is a Robbie decision**, not a
column. A client gets a recap only when `send:true` in `clients.json`; `send:false` = tracked but no
email (missing contact/IDs, data-only tracker, or held). NEVER silently drop a client — every
non-send client stays in `clients.json` with a `send_note` so it's visible in `flags.md`.

---

## 1. WORKFLOW — same every week

### Step 1 — Confirm the week
`start` and `end` (`YYYY-MM-DD`, Sun–Sat). Compute `prior_start = start − 28d`, `prior_end = start − 1d`.

### Step 2 — Collect
Read `clients.json` + `secrets.json`. Merge into the `args` shape the collector expects (see the
header comment in `collect.workflow.js`): `{ week:{start,end,prior_start,prior_end}, manager_id,
audiencelab_key, meta_token, clarity_jwts, gbp_read_token, clients }`. (`gbp_read_token` from
secrets.json powers the GBP phase — the collector calls the gbp-intelligence internal API for every
client with `services.gbp` + `ids.gbp_locations`.) Run the collector via the **Workflow tool**
(`scriptPath: ~/Dropbox/EngageEngine/weekly-emails/collect.workflow.js`, `args: <merged>`). When it
returns, **save the returned blob verbatim to `out/week_data.json`.** (Saving to disk is what makes
the run survive a context compaction — do it immediately.)

Before collecting, refresh any new Audiencelab IDs: a `GET` on the audiencelab endpoint lists ALL
audiences by name — match new clients, write the UUIDs into `clients.json`.

### Step 3 — Assemble
`python3 assemble.py --week START:END`. This writes `out/drafts.json`, `out/preview/*.txt`, and
`out/flags.md`. It already handles WoW math, IS classification, benchmark interpretation,
omit-on-zero, and the rotating closings.

### Step 3.5 — Harvest the portal narratives into touches (REQUIRED — this is the differentiator)
The MPG client portal (D1 `mpg-client-portal`) generates a synthesized weekly narrative per client
— season frame, intent story, review velocity, AI visibility, GBP intel. That formed point of view
is what separates these emails from a data dump. Harvest it:

1. `python3 harvest_touches.py --week START:END` — pulls each portal client's latest report from D1
   into `out/portal_candidates.json` (20 of the email clients are portal-covered).
2. **YOU write `out/vault_touches.json`** from those candidates: one touch per client, following the
   voice contract in harvest_touches.py's PROMPT — lead with the market window / strength /
   momentum, gaps become "my focus right now is…", 1-2 sentences, ≤60 words, no dollars, no vendor
   names, no meta-words (report/dashboard/portal). Do NOT repeat numbers the email body already
   carries — intent-service clients get their intent count in the intel paragraph, so their touch
   leads with season/reviews/AI-visibility instead. For non-portal clients (803 Realty, MedConnect,
   Nature's Best, Penyak, Safe Oil, Stripewide, Winyah Bay), write the touch from the week's
   collected data. Include `"_week": "START:END"` — assemble IGNORES the file without a matching
   week stamp.
3. `python3 harvest_touches.py --week START:END --check` — mechanical validation (week stamp,
   banned terms, length). Must exit 0 before you proceed. Then RE-RUN assemble (Step 3) so the
   drafts pick the touches up — assemble prints a warning if touches are stale or missing.

### Step 4 — REVIEW and elevate (your judgment — this is the 20%)
Read `out/flags.md`, every `out/preview/*.txt`, `out/portal_candidates.json`, and the vault side
files. The assembler gives the mechanical draft; this step is what makes it Robbie. Specifically:
- **THE FOUR MOVES (locked by Robbie 2026-07-05 — read `GOLD_STANDARD.md` in the harness dir
  every run; it contains the approved reference email).** For every portal-covered client, edit
  the draft in `drafts.json` so it exhibits all four:
  1. The report's **market read replaces the generic opener** (buyer psychology + season, week's
     impressions folded into that frame — never "you're in the mid-cycle" boilerplate).
  2. **One numeric block gets the insight under the number** (conversion rate vs category norm,
     organic top-10 rankings, source-mix meaning — the strongest one, not all of them).
  3. **One friction finding becomes "I'm on it this week"** — plain English, named pages, no
     jargon (never "dead clicks"/"quickbacks"), owned and fixable.
  4. **One client-side ask closes the substance** (this is the touch slot): gap + plan + split of
     labor ("a text to every customer within 24 hours gets you to 100 by fall; I'll carry the
     rest"). Non-portal clients get the best-available touch from week data / vault context.
  **The immutable rules (§2) still beat anything in the harvested material** — portal reports and
  vault files DO contain dollars and vendor names; never surface those. A one-line touch alone
  does NOT satisfy this contract — that was the 2026-07-05 failure.
- **Anomalies in flags.md** (>50% WoW impression drops, Clarity errors) — rewrite those emails' framing.
  A delivery pullback gets the honest "campaign issue, I'm on it" treatment (see §3.5). But check the
  data first: a "drop" with strong conversions (e.g. a PMax pulling back but still converting) is not
  a crisis — frame accurately.
- **Mechanical seams** — fix any sentence that reads templated or self-contradictory (e.g. "held
  steady … up 38%"). Vary openers so 25 emails don't read identically.
- **Sweep every draft** against the immutable rules (§2) and voice rules (§3). Edit `drafts.json` in place.

### Step 5 — Sample for approval (REQUIRED before any push)
Show Robbie ONE full draft inline (To/Cc/Subject/Body). Use **Smith Built Metals** (Google Ads +
Meta + intent + Clarity, no anomalies). Wait for explicit approval. Apply any structural edit across
the whole portfolio.

### Step 6 — Push
`python3 push.py --week START:END --dry` to sanity-check recipients, then `python3 push.py --week START:END`.
Report the per-client list.

### Step 7 — Archive + checkpoint
`python3 archive.py --week START:END` (writes the Obsidian recap with tracker frontmatter). Then
surface `out/flags.md` to Robbie in chat, update the Credentials Index / `clients.json` with any new
IDs found, and `engram_checkpoint` the week's highlights + carry-forward items.

---

## 2. IMMUTABLE RULES — every one has been broken before

1. **No dollars, ever.** No spend, cost, CPC/CPL as dollars, budget figures. Allowed: impressions,
   clicks, CTR %, conversions, sessions, scroll depth, mobile %, audience counts, reach. "Well below
   market rate" is fine; "$0.29 CPC" is not. (assemble.py never emits dollars — don't add them.)
2. **Never "Audiencelab" in client copy.** Always "custom intent data" / "your in-market list."
   Internal files and the harness use the vendor name; client bodies never do.
3. **Omit zero-data sections silently.** No "GA4 showed no sessions," no "tracking issue," no "heads
   up." Just leave it out. assemble.py does this — don't reintroduce narration of absence.
4. **Never invent services from search terms.** An off-service search term is a negative-keyword
   candidate (flag internally), not a service line. The roster `service` field is what they do.
5. **IS is market intelligence, not a confession.** <35% → drop the number; use action language.
   (assemble.py already drops it — keep it dropped on review.)
6. **Mandatory closings — two paragraphs, in order, every email, drawn from the APPROVED VARIANT SET
   in assemble.py** (`ACCT_VARIANTS` + `ESC_VARIANTS`). Per Robbie (2026-07-05): closings rotate
   among an assortment of approved variants so neighboring emails don't read identically — but the
   variants themselves are FIXED. assemble.py assigns them; the review pass must NOT paraphrase,
   remix, or invent new closings. Every closing must match one approved variant word-for-word. To add
   or change a variant, edit the set in assemble.py — that's the canon for closing text, not this file.

   Then sign off exactly:
   ```
   Talk soon,
   Robbie
   ```
7. **Recipients/greetings come from `clients.json` only.** Greeting includes ALL names when CC'd
   ("Hey Shay & Blake,"). If a client's facts aren't in the roster, STOP and ask — don't guess.
8. **Never push before Robbie approves the sample** (Step 5).
9. **Market Context never excuses or predicts.** It describes the market — it does not say "the market
   was slow so your phone didn't ring," nor "buyers are primed to call." The accountability paragraph
   is the only place market↔phone-volume is named.
10. **Always second-person** (you / your), never "Atlantic's audience."
11. **Numeric blocks are prose, never bullets.**
12. **The moat line is verbatim and mandatory** on every intent paragraph: "This is data your
    competitors don't have access to."

---

## 3. VOICE & FRAMING — what your review enforces

### 3.1 Voice
Robbie is the marketing authority. Direct, plain, declarative. No hedging ("might," "I think"), no
throat-clearing openers, no condescension, no cheerleading ("crushing it"), no emojis, no exclamation
points except a genuine standout. Lead with the strongest signal.

### 3.2 Market Context (leads the substance)
Source = **Google Ads impressions WoW** (this week vs prior-4-week average), framed campaign-level,
fused with seasonal posture from the roster. (DataForSEO Trends is retired from the weekly run — it
lags 3–7 days. If it ever becomes reliable it's enrichment, not the primary.) Describe the market;
never excuse or predict.

### 3.3 Numeric blocks (report, not data dump)
Every metric = number + benchmark + interpretation, in prose. Benchmarks come from `benchmarks.json`
(per-vertical). Anchor with a real number ("ahead of the 6.47% home-improvement benchmark"). Separate
Robbie's lever (CTR, ad position) from external factors (scroll depth = page issue). Tie Meta back to
the custom intent data. If no benchmark supports a comparison, report the number cleanly without one —
never fabricate a benchmark.

### 3.4 Impression Share framing
High (≥65%): lead with coverage. Mid (35–65%): solid share, room to expand. Low (<35%) rank-constrained:
drop the number, "auctions are recoverable, ad position is the lever." Low budget-constrained: "demand
is there, campaigns are competitive when they show; constrained by budget, not how they're built."

### 3.5 Delivery-pullback framing (the anomaly case)
A >50% WoW impression drop is flagged by assemble.py. If it's a real campaign-delivery issue, frame it
honestly and own it: name it as a delivery pullback (not market collapse), say you're investigating,
promise a fast answer. Do NOT bury it and do NOT apologize for the campaign — own the fix. If the
"drop" still produced strong conversions, it's not a crisis — frame it accurately instead.

### 3.6 Intent + pixel paragraph
"our custom intent data identified N people actively in-market for [service] in [region] this week."
Fold pixel in when present ("Our pixel intelligence also identified N specific businesses and
homeowners…"). End with the verbatim moat line. Never name individuals or companies — aggregates only.

---

## 4. STOP-AND-ASK
Pause and ask Robbie (say exactly what's missing) if: a client's roster facts are absent; the collector
returns a token error (Meta 190 / expired, Audiencelab 401, Clarity JWT errors — note these surface in
flags.md); an anomaly you can't explain would otherwise land in client copy; or anything where a guess
reaches a client inbox.

## 5. THE BAR
Robbie reviews the sample and the push goes out with **no rework**: roster reconciled in `clients.json`,
data collected + saved to disk, every client gets exactly the sections their roster row allows, IS and
anomalies framed per §3, closings from the approved variant set, no money, no vendor name, **every
portal-covered client's draft exhibits the Four Moves (compare the sample against `GOLD_STANDARD.md`
before showing it)**, archive written, flags surfaced, checkpoint saved.

---

## 6. MONTHLY REPORT — separate trigger, same rules
Once a month (target: 4th week), a deeper report expands Market Context into a full Market Position
section (4 weeks of trend) and adds a Robbie Scorecard → Audience → Website → What's Next → Accountability
structure. All rules above still apply.

---

*Harness lives at `~/Dropbox/EngageEngine/weekly-emails/`. Read its README before running. Do the work.*

---

## Learnings
<!-- Maintained by /reflect. Newest at top. Each line: - [TIER] (YYYY-MM-DD) statement -->

- [HIGH] (2026-07-13) When hand-building the collector `args`, diff the client set against EVERY `send:true` client in `clients.json` BEFORE running the Workflow — a trimmed args silently drops clients (missed dumpster_mule/jaguars/medconnect this run and had to backfill them via direct MCP). Count send:true first; args client count must match.
- [HIGH] (2026-07-13) `harvest_touches.py`'s `wrangler d1` call FAILS on this machine — pull the portal narratives directly via the Cloudflare D1 MCP instead: db `mpg-client-portal` (uuid `a816fa44-4ab6-45b5-b7f0-67bb1ac202f0`), tables `reports_archive` + `clients`, join to latest `iso_year*100+iso_week` per client, extract section headlines with `json_each(sections_json)`. The section headlines (where_you_are / custom_intent / local_presence / site_experience / ai_visibility) ARE the POV substance — enough to write touches without pulling full bodies. Then hand-write `out/vault_touches.json` and run `--check`.
- [MED] (2026-07-13) Direct-MCP backfill recipe for clients missing from a collector run (merge into `out/week_data.json`): GA4 `run_report` date_ranges need snake_case `start_date`/`end_date` (NOT `startDate`); Audiencelab list/GET uses `x-api-key` header (not Bearer) and per-audience GET `?page=1&page_size=1` returns `total_records`; GBP via `gbp-intelligence.robertlbutt.workers.dev/internal/gbp-insights?locations=<loc>&days=7` with header `x-internal-token` = `secrets.gbp_read_token`. Match the collector's per-source JSON schema when merging (gads=json-string list, meta/ga4/al/clarity=json-string arrays, gbp=object list).
- [MED] (2026-07-13) Portal `reports_archive` can lag one ISO week behind the target week — use the latest report for slow-moving POV only (season / review velocity / AI-visibility band), NEVER for the week's live numbers, which come from the collector.
- [MED] (2026-07-13) On a flagged impression drop, never assert a CAUSE you haven't verified — I nearly shipped "your campaign concentrated on the highest-intent searches" for Stormy's -90% PMax week. The honest §3.5 framing when conversions stayed strong: state the pullback + the strong conversions + that you're investigating the dip. Naming an invented cause violates the anti-guessing gate.
- [HIGH] (2026-07-05) A single polite touch is NOT the point of view — Robbie rejected it ("fortune cookie"). The locked standard is the Four Moves in GOLD_STANDARD.md: market read replaces the opener, insight under one number, one named friction owned, one client-side ask with the plan. Compression that drops the named levers ("two specific levers" without naming them) is the failure mode.
- [HIGH] (2026-07-05) The touch's SOURCE is what makes it worth reading: harvest the portal narrative (Step 3.5), don't recycle the same week's ad metrics the email already reports — a touch restating the Meta paragraph's CTR is filler (the 803 Realty failure). Season window, review velocity, AI visibility, history = substance.
- [HIGH] (2026-07-05) Producer→consumer: an artifact nobody reads is a no-op. Every side file the pipeline writes must have a named consumer step in this skill, and the run must verify the consumption happened (touch present in previews) before push.

- [HIGH] (2026-06-28) Never claim the roster is "reconciled / current / real" without actually diffing `clients.json` against the Sprint Tracker canon THAT run. Assert only what you verified this session; on any borderline send/no-send client, ask Robbie — don't guess.
- [MED] (2026-06-28) To find a client's GA4 property ID, use `get_account_summaries` — it needs the Analytics Admin API enabled on project `engageengine-command-center` (enabled 2026-06-28). A missing GA4 ID ≠ no data; look it up before omitting the section.
- [MED] (2026-06-28) A single-platform recap (Google-Ads-only, GA4-only) is acceptable when that's the only real data. Never fabricate sections to pad a thin email.
- [MED] (2026-06-28) 0 GA4 sessions while Google Ads shows real clicks usually means the client hasn't installed the GA4 tag on the landing page — verify before reporting, and don't flag it to the client as a market/tracking anomaly.
