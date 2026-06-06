---
description: Reflect on this session and write learnings back into the relevant skill (self-improving skills). Subcommands: on | off | status | review.
argument-hint: "[skill name] | on | off | status | review"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

Invoke the `reflect` skill (`~/.claude/skills/reflect/SKILL.md`) and follow it exactly.

Argument passed: `$ARGUMENTS`

Routing:
- empty → run the full manual reflection flow on the current conversation.
- `on` / `off` → flip `enabled` in `~/.claude/reflect/config.json`, confirm the new state, and commit the config change.
- `status` → print enabled state, target mode/skill, git settings, and how many items are in `~/.claude/reflect/review-queue.md`.
- `review` → walk the review queue, promoting/keeping/deleting each LOW item.
- anything else → treat `$ARGUMENTS` as the target skill folder name and reflect into it.

Always read `~/.claude/reflect/config.json` first.
