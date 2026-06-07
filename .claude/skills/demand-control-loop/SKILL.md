---
name: demand-control-loop
description: >
  Operate and extend EngageEngine's Demand Control Loop — the agentic system
  (DIAGNOSE → DECIDE → ACT → NARRATE → LEARN) that runs the Four Failure Modes
  per client. Use when building, debugging, deploying, or reasoning about the
  Demand Control Loop, the MPG client portal (portalops), the client-health-pipeline,
  dc_diagnose / dc_learn / dc_writer, the Accountability Ledger, the Demand Ledger,
  per-client managed_scope, or how to sell it. Capture corrections here via
  `/reflect demand-control-loop`.
triggers:
  - demand control loop
  - accountability ledger
  - demand ledger
  - dc_diagnose
  - portalops demand control
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Demand Control Loop

The agentic loop that runs the Four Failure Modes per client, continuously, with a
human approval gate. Built 2026-06-05/06. Orchestrator = Opus, builder = Sonnet 4.6.

## What it is (entity doctrine — get this right always)
- **Marketing Performance** = the agency (manages client accounts; the entity that gets hired/fired).
- **EngageEngine™** (always ™) = the INSTRUMENT — creates demand and measures the Four Failure Modes. It does NOT "manage clients" or "get fired."
- The **Demand Control Loop** is part of the EngageEngine™ instrument.
- **Four Failure Modes:** FM1 Not Seen · FM2 Seen-Not-Trusted · FM3 Trusted-Still-Compared · FM4 Intended-No-Action. (FM1/FM2 are agency-controlled; FM4 is usually client-controlled — but `controlled_by` is per-client by actual managed scope.)

## Architecture
**Pipeline repo** (Stages 1 & 5): `~/Library/CloudStorage/Dropbox/EngageEngine/client-health-pipeline` → github `robert28211/client_health_report` (private, main). Python; runs locally / GitHub Actions. Key files: `dc_diagnose.py` (Claude Demand Collapse → diagnosis JSON; pixel excluded via IGNORED_SIGNALS; `_apply_scope` per-client controlled_by override; operator-guidance + prior-outcomes prompt blocks), `dc_learn.py` (measure executed moves → dc_outcomes), `dc_writer.py` (writes to portal D1 a816fa44; fetch_recent_outcomes, fetch_client_guidance, clear_diagnosis_children), `run_health.py` (`--diagnose --learn --pilot-only`), `config.py` (CLIENTS + managed_scope; secrets via os.getenv; `.env` gitignored).

**Portal repo** (Stages 2/3/4 + feedback): `~/Desktop/mpg-client-portal` → github `robert28211/mpg-client-portal` (private, default branch `demand-control-loop`; old `main` = archived pre-recovery work, unrelated history). Cloudflare Worker `mpg-client-portal`, hosts `portal.` (clients) + `portalops.` (admin). D1 binding `DB` = `a816fa44-4ab6-45b5-b7f0-67bb1ac202f0`. Deploy: `npx wrangler deploy` from repo dir.

**D1 tables (a816fa44):** dc_diagnoses, dc_proposed_moves, dc_ledger_entries, dc_outcomes, dc_dismissals; `clients.dc_diagnostic_notes`. Conventions: INTEGER PK autoincrement, client_id TEXT FK→clients(id) using **hyphen slugs** (austin-drilling, guttermen, mt-horeb, midlands-landscape), unix-sec timestamps, `_json` TEXT cols, UNIQUE for idempotency.

**Pipeline→portal client id map (critical):** the_guttermen→guttermen, austin_drilling→austin-drilling, mt_horeb→mt-horeb, midlands_landscape→midlands-landscape.

## The five stages
1. **DIAGNOSE** (nightly, pipeline): per pilot client → FM scores, binding constraint, one structural change, reasoning trace, proposed moves, ledger entries → dc_diagnoses (status draft). Pixel disabled until standardized.
2. **DECIDE** (portalops admin): exception-filtered approval queue. Approve/reject/edit moves; edit ledger; approve diagnosis. `/api/admin/demand-control/*`. Status-only.
3. **ACT** (portalops): approve→execute. v1 = `add_negative` on Guttermen only. Preview uses Google Ads `validateOnly:true` (applies nothing); execute = `validateOnly:false`, records resourceName for reversal. Reuses v24 Google Ads auth.
4. **NARRATE** (portalops): two renderings off the same data — internal full-truth view + client-facing **no-fault** client-view (Claude-generated, preview-only). Client-view never exposes agency fault.
5. **LEARN** (pipeline): dc_learn measures executed moves before/after → dc_outcomes; next diagnosis reads prior outcomes + operator guidance.

**Feedback channel:** portalops "Notes to the diagnostic" (`clients.dc_diagnostic_notes`) + "Dismiss — not an issue" (→ `dc_dismissals`, persists across nightly regen) → injected into the next diagnosis prompt ("don't re-flag dismissed unless materially changed").

## Operating rules (non-negotiable)
- **Nothing auto-executes.** Full approval gate; every move is approve/reject by Robbie. (Tiered auto-exec is deferred — future only, after tested + trusted.)
- Scale across 22+ clients via **exception filtering** (stable is silent; ~3–5 decisions/day) + a daily digest — NOT autonomy.
- **Pilot-gate everything** to austin-drilling / mt-horeb / guttermen / midlands-landscape until proven.
- Commit + deploy only on Robbie's explicit word. No secrets in git (os.getenv; `.env` gitignored).
- Client-facing surfaces: never agency fault; no dollar amounts; "custom intent data" not Audiencelab.

## How to sell it
Unique mechanism = **The Demand Ledger** (weekly: what we changed, what moved, where it leaks — our side vs yours). Maxes the value equation (proof via dc_outcomes, Day-7 win, effort-zero). Unlocks retainer→performance pricing (measured attribution). Assets: `~/Dropbox/EngageEngine/Demand-Control-Loop-Sales/`.

## Roadmap
Broaden Stage 3 move types/clients; wire Stage 4 client-view into live dashboard + weekly email (gated on rollout); enable cron + GOOGLE_SHEETS_CREDENTIALS GH secret; confirm managed_scope for austin/guttermen/mt-horeb; pixel-sheet standardization; auto-execution (deferred).

## Learnings
<!-- Maintained by /reflect. Newest at top. Each line: - [TIER] (YYYY-MM-DD) statement -->

- [HIGH] (2026-06-07) Operator feedback must loop back: dismissals (dc_dismissals) + per-client notes (clients.dc_diagnostic_notes) inject into the next diagnosis so the same flag is never re-surfaced. The approval gate is a two-way conversation, not a one-way filter.
- [HIGH] (2026-06-07) `controlled_by` is PER-CLIENT by what Marketing Performance actually manages (managed_scope). A Ledger that mislabels the line is worse than none. For Midlands MP runs ads+website+email+pixel+pipeline; client owns phone/form response + GBP/reviews.
- [HIGH] (2026-06-07) The Accountability Ledger has TWO renderings: internal = full blunt truth; client-facing = NEVER expose agency fault — reframe agency-controlled items as proactive optimization (Golden Rule), client items as their action area, lead with wins.
- [HIGH] (2026-06-07) NOTHING auto-executes. Full approval gate; nothing fires against an ad account without Robbie's explicit click. Scale via exception-filtering, not autonomy. Auto-exec is deferred until tested + trusted.
- [HIGH] (2026-06-07) Marketing Performance = the agency (managed/fired). EngageEngine™ = the instrument (creates demand, measures the four failure modes). Never write that EngageEngine manages or gets fired.
- [HIGH] (2026-06-07) The MPG portal is NOT paused — it is pre-rollout; only Sheppard's Glass has seen it. Don't describe it as paused.
- [HIGH] (2026-06-07) Pixel signal is disabled in diagnoses until the per-client pixel sheets are standardized — they're structurally inconsistent + partly stale (Austin export dead since April; Zap_ready is the canonical contact list but exists only for Midlands; Segment_ tabs are 1–2 day activity feeds, not weekly unique counts). Same sheets feed the weekly emails — treat pixel numbers with caution there too.
- [HIGH] (2026-06-07) Verify data before building a client story on it (the Midlands "4 vs 799 pixel collapse" was a parser artifact). Sanity-check inputs; don't ship a diagnosis with an unverified pillar.
- [MED] (2026-06-07) Build pattern: Opus orchestrates + owns schema/spec + verifies; Sonnet 4.6 builds. Build → verify (node --check / wrangler dry-run / py_compile) → commit (two clean labeled commits when batches are entangled) → deploy on Robbie's word → confirm route live.
- [MED] (2026-06-07) Idempotent re-runs: dc_diagnoses upserts on (client_id, iso_year, iso_week); clear child moves/ledger before re-insert; dismissals/outcomes live in separate tables so the nightly regen never wipes them.
- [MED] (2026-06-07) Google Ads safe-write pattern: preview with `validateOnly:true` (applies nothing), execute with `validateOnly:false`; record the created resourceName for reversal. Reuse the worker's existing v24 auth.
