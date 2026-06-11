# Reflect — Review Queue

LOW-confidence observations captured by /reflect, awaiting promotion or deletion.
Run `/reflect review` to triage. Format: `- [LOW] (date) [target-skill] observation`

- [LOW] (2026-06-11) [global] Punch List Pros GA4, Google Ads, and Meta access all pending as of 2026-06-11 — no accounts visible on any platform yet.
- [LOW] (2026-06-08) [operations-hub] Gojo brief is now live — verify the narrative tone (Gojo register: breezy/certain, cold+exact when it matters) matches intent once a few days of briefs accumulate.
- [LOW] (2026-06-08) [personalize-book] The Write tool requires the file to have been Read in the same tool-call sequence before writing. If a large file was read in chunked calls (offset/limit) in a prior session that got compacted, re-read the file once in the new session before attempting to Write — even if file content appears in session history.
- [LOW] (2026-06-08) [personalize-book] Large vault source files (e.g. Hormozi Playbooks.md ~1.1MB) require multiple chunked reads at different offsets to capture all content. Always read to the end before assuming the first chunk captured everything — prior session summary only noted 4 playbooks; later chunks revealed 2 more.

- [LOW] (2026-06-11) [global] ElevenLabs `speed` voice_setting (0.7–1.2) does a crude time-stretch that distorts cloned voices — never use it to slow delivery; pick a slower-cadence model instead. turbo_v2_5 = rushed/clipped, multilingual_v2 = natural but +~1s latency, flash_v2 = balanced. (Operations Hub voice work.)

- [LOW] (2026-06-11) [global] GitHub Actions Node 20 deprecation: the client_health_report workflow uses actions/checkout@v4 + actions/setup-python@v5 (Node 20). Forced to Node 24 on 2026-06-16, Node 20 removed 2026-09-16. Bump the action versions before then.
