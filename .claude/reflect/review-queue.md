# Reflect — Review Queue

LOW-confidence observations captured by /reflect, awaiting promotion or deletion.
Run `/reflect review` to triage. Format: `- [LOW] (date) [target-skill] observation`

- [LOW] (2026-06-08) [operations-hub] Engram DB returned "malformed" + 401 Unauthorized during this session — may need vault maintenance before next checkpoint. Check if engram is healthy.
- [LOW] (2026-06-08) [operations-hub] Gojo brief is now live — verify the narrative tone (Gojo register: breezy/certain, cold+exact when it matters) matches intent once a few days of briefs accumulate.
- [LOW] (2026-06-08) [personalize-book] The Write tool requires the file to have been Read in the same tool-call sequence before writing. If a large file was read in chunked calls (offset/limit) in a prior session that got compacted, re-read the file once in the new session before attempting to Write — even if file content appears in session history.
- [LOW] (2026-06-08) [personalize-book] Large vault source files (e.g. Hormozi Playbooks.md ~1.1MB) require multiple chunked reads at different offsets to capture all content. Always read to the end before assuming the first chunk captured everything — prior session summary only noted 4 playbooks; later chunks revealed 2 more.
