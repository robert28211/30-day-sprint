---
name: reflect
version: 1.0.0
description: |
  Self-improving skills. Analyzes the current conversation for corrections,
  approved patterns, and observations, then writes durable learnings back into
  the relevant skill file so the same mistake never has to be corrected twice.
  Use when asked to "reflect", "learn from this session", "remember this for
  next time", "update the skill", or "/reflect". Also runs automatically at
  session end when auto-reflect is ON.
triggers:
  - reflect
  - learn from this session
  - remember this for next time
  - update the skill from this conversation
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Reflect — Self-Improving Skills

Correct once, never again. This skill reads the conversation, extracts what was
learned, and persists it into the skill that needs it. Everything lives in plain
markdown under version control (`~/.claude` is a git repo) — no embeddings, no
database. You can read, edit, and roll back every learning by hand.

## Configuration

Read `~/.claude/reflect/config.json` first. It controls:

- `enabled` — whether the Stop hook reflects automatically (toggle with `reflect on`/`off`).
- `auto_apply_confidence` — the minimum confidence tier auto-mode will apply without review (default `high`).
- `git.commit` / `git.push` — whether accepted learnings are committed and pushed.
- `target.mode` — `auto-detect` (reflect into whichever skill ran this session) or `pinned` (always `target.skill`).
- `target.skill` — the pinned skill folder name (e.g. `daily-pipeline` once the portalops pipeline skill ships).
- `write_strategy` — `learnings-section` (default, safe) or `body-edit`.

## Step 1 — Pick the target skill

1. If `target.mode` is `pinned`, the target is `~/.claude/skills/<target.skill>/SKILL.md`.
2. Otherwise auto-detect: scan the conversation for which skill(s) were invoked
   (a `/command`, a Skill tool call, or an explicit skill name). The target is the
   skill the corrections were *about*.
3. If exactly one skill is in play, use it. If several, list them and ask which to
   reflect into (or "all"). If none, fall back to the global learnings file
   `~/.claude/skills/reflect/LEARNINGS-global.md` and say so.

## Step 2 — Extract signals

Scan the whole conversation. Classify every signal into one of three tiers:

| Tier | Confidence | What it is | Examples |
|---|---|---|---|
| 🔴 HIGH | Correction / hard rule | The user corrected you, said "never/always do X", rejected an approach, or fixed your output | "No — always pass `manager_id`", "Stop putting dollar amounts in client reports", "that's the wrong endpoint" |
| 🟡 MEDIUM | Approved pattern | An approach you took that the user explicitly approved or that demonstrably worked | "Yes, that format is perfect", a flow that produced the accepted result |
| 🟢 LOW | Observation | Something worth noting but not yet a rule — a hunch, an edge case seen once | "the API was slow here", "client X seems to prefer Y" |

Rules for good signals:
- Corrections are the highest-value memories; approvals are confirmations. Capture both.
- Each learning is one atomic, imperative, testable statement ("Always X", "Never Y", "When Z, do W"). No vague advice.
- Deduplicate against what the target skill already says — never add a learning that's already there. If a new learning refines an existing one, edit the existing line instead of duplicating.
- Skip anything that only matters to this one conversation (no durable value).

## Step 3 — Propose changes (review gate)

When run manually (or for medium/low tiers in auto mode), present a review block **before** writing anything:

```
REFLECT — <target skill>

🔴 HIGH (will apply)
  • <learning>
🟡 MEDIUM (will apply)
  • <learning>
🟢 LOW (queued for review)
  • <learning>

Proposed commit: reflect(<skill>): <short summary>

Apply? [Y to accept all / edit in natural language / n to cancel]
```

The user can accept with `Y`, cancel with `n`, or revise in natural language
("drop the second one", "make the first one stricter", "move that to high"). Apply
their edits and re-confirm only if they changed tiers/wording materially.

## Step 4 — Write the learnings

**`learnings-section` strategy (default, safe):** append to or update a `## Learnings`
block at the END of the target `SKILL.md`. Never modify the procedure body. Format:

```markdown
## Learnings
<!-- Maintained by /reflect. Newest at top. Each line: - [TIER] (YYYY-MM-DD) statement -->

- [HIGH] (2026-06-06) Always pass `manager_id: "7536541386"` when querying managed Google Ads accounts.
- [MED] (2026-06-06) Two-column client-doc layout with #F4F4F4 fills is the approved format.
```

If the `## Learnings` section doesn't exist, create it at the end of the file. Keep
newest at top. When a new HIGH learning contradicts an old one, replace the old line
and note the change in the commit message.

**`body-edit` strategy:** only with explicit user approval and never in auto mode —
edit the actual procedure steps in place (e.g. correct a wrong endpoint in the
instructions). Show the exact diff before applying.

LOW-tier observations never go into SKILL.md. Append them to
`~/.claude/reflect/review-queue.md` (with date + target skill) for later promotion
via `/reflect review`.

## Step 5 — Version it

If `git.commit` is true, after writing:

```bash
git -C ~/.claude add -A
git -C ~/.claude commit -m "reflect(<skill>): <summary>"
```

If `git.push` is true, then `git -C ~/.claude push`. If push fails (no remote /
offline), keep the commit and report it — never lose the learning.

## Step 6 — Report

Manual: show what was written and the commit hash.
Auto (from Stop hook): print a single quiet line, e.g.
`📚 Learned from session → daily-pipeline (+2 high, 1 queued)`.

---

## Subcommands (from `/reflect <arg>`)

- `/reflect` — run the full manual flow above on the current conversation.
- `/reflect <skill>` — force the target skill (overrides auto-detect for this run).
- `reflect on` — set `enabled: true` in config. Auto-reflect now runs at session end.
- `reflect off` — set `enabled: false`. Auto-reflect stops.
- `reflect status` — print `enabled`, `target.mode`/`skill`, git settings, queued-review count.
- `reflect review` — show `~/.claude/reflect/review-queue.md`; for each LOW item, offer to promote (→ HIGH/MED into a skill), keep, or delete.

## Auto mode contract (when invoked by the Stop hook)

When the Stop hook triggers this skill automatically:
1. Detect the target and extract signals as above.
2. Apply only learnings at or above `auto_apply_confidence` (default HIGH).
3. Queue everything below that to `review-queue.md` — do **not** edit SKILL.md with it.
4. Never use `body-edit` in auto mode. `learnings-section` only.
5. Commit + push per config.
6. Emit the one-line report. If there's nothing worth learning, say nothing and stop.
