#!/usr/bin/env bash
# reflect-stop.sh — auto-reflect at session end.
# When enabled, blocks the stop once and feeds reflect instructions back to Claude.
# Loop guard: if stop_hook_active is true we're already in the reflect turn, so allow stop.

set -euo pipefail

CONFIG="$HOME/.claude/reflect/config.json"
input="$(cat || true)"

# Loop guard — never block twice in a row.
stop_active="$(printf '%s' "$input" | python3 -c 'import sys,json
try:
    print(json.load(sys.stdin).get("stop_hook_active", False))
except Exception:
    print(False)' 2>/dev/null || echo False)"

if [ "$stop_active" = "True" ]; then
  exit 0
fi

# Toggle check.
[ -f "$CONFIG" ] || exit 0
enabled="$(python3 -c 'import json,sys
try:
    print(json.load(open(sys.argv[1])).get("enabled", False))
except Exception:
    print(False)' "$CONFIG" 2>/dev/null || echo False)"

if [ "$enabled" != "True" ]; then
  exit 0
fi

# Auto-reflect is ON — block the stop and instruct Claude to reflect.
reason='Auto-reflect is ON. Before ending, run the reflect skill (~/.claude/skills/reflect/SKILL.md) in AUTO MODE: detect the target skill from this conversation, extract HIGH/MED/LOW signals, apply only learnings at or above auto_apply_confidence to the target SKILL.md ## Learnings section, queue the rest to ~/.claude/reflect/review-queue.md, commit + push per config, and print the one-line report. If there is nothing durable worth learning from this session, do nothing and stop silently. Do not use body-edit in auto mode.'

python3 -c 'import json,sys; print(json.dumps({"decision":"block","reason":sys.argv[1]}))' "$reason"
exit 0
