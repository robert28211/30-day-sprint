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
assemble.py           ← week_data.json → drafts.json + previews + flags.md
push.py               ← drafts.json → IMAP Drafts (idempotent)
archive.py            ← → Obsidian Weekly Recap
out/                  ← week_data.json, drafts.json, flags.md, preview/*.txt
```

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
audiencelab_key, meta_token, clarity_jwts, clients }`. Run the collector via the **Workflow tool**
(`scriptPath: ~/Dropbox/EngageEngine/weekly-emails/collect.workflow.js`, `args: <merged>`). When it
returns, **save the returned blob verbatim to `out/week_data.json`.** (Saving to disk is what makes
the run survive a context compaction — do it immediately.)

Before collecting, refresh any new Audiencelab IDs: a `GET` on the audiencelab endpoint lists ALL
audiences by name — match new clients, write the UUIDs into `clients.json`.

### Step 3 — Assemble
`python3 assemble.py --week START:END`. This writes `out/drafts.json`, `out/preview/*.txt`, and
`out/flags.md`. It already handles WoW math, IS classification, benchmark interpretation,
omit-on-zero, and the verbatim closings.

### Step 4 — REVIEW and elevate (your judgment — this is the 20%)
Read `out/flags.md` and every `out/preview/*.txt`. The assembler gives a strong first draft; you
make it Robbie. Specifically:
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
6. **Mandatory closings, verbatim, in order, every email** (assemble.py appends these):
   > My job is to make sure the right people see your ads, click them, and land on a page that earns
   > their trust. Phone volume is also shaped by pricing, reputation, seasonal demand, and your team's
   > response speed. When leads are slow, I look at whether it's the campaign or the market — and I'll
   > always tell you which one it is.

   > If anything ever looks off or raises a question, please don't wait for our next meeting — just
   > reach out right away. The sooner I hear from you, the sooner I can do something about it.

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
anomalies framed per §3, closings verbatim, no money, no vendor name, archive written, flags surfaced,
checkpoint saved.

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

- [HIGH] (2026-06-28) Never claim the roster is "reconciled / current / real" without actually diffing `clients.json` against the Sprint Tracker canon THAT run. Assert only what you verified this session; on any borderline send/no-send client, ask Robbie — don't guess.
- [MED] (2026-06-28) To find a client's GA4 property ID, use `get_account_summaries` — it needs the Analytics Admin API enabled on project `engageengine-command-center` (enabled 2026-06-28). A missing GA4 ID ≠ no data; look it up before omitting the section.
- [MED] (2026-06-28) A single-platform recap (Google-Ads-only, GA4-only) is acceptable when that's the only real data. Never fabricate sections to pad a thin email.
- [MED] (2026-06-28) 0 GA4 sessions while Google Ads shows real clicks usually means the client hasn't installed the GA4 tag on the landing page — verify before reporting, and don't flag it to the client as a market/tracking anomaly.
