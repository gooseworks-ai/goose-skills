---
name: x-follower-scraper
description: 'Export public X audiences with Xquik X Follower Scraper on Apify. Compare followers, following, verified users, lists, communities, filters, and audience overlap.'
---

# X Follower Scraper

Use Xquik X Follower Scraper on Apify for public audience research.
The bundled wrapper supports handles, IDs, list targets, communities, and URLs.

## Workflow

1. Confirm the targets, relation, filters, output depth, and result cap.
2. Choose followers, following, verified followers, list members, list
   subscribers, or community members.
3. Use first-match deduplication for a clean export.
4. Use merge deduplication when the user needs overlap analysis.
5. Show the proposed result cap before starting a paid Actor run.
6. Use the bundled wrapper after the user accepts the scope.
7. Separate diagnostic and run-report rows from profile records.
8. Report source targets, source relations, overlap, and coverage limits.

## Actor Behavior

- Compact output returns normalized core profile fields.
- Full output adds optional profile metadata.
- Raw output preserves a source payload for advanced analysis.
- Target metadata preserves where each profile was discovered.
- Merge mode combines matching targets and exposes overlap counts.
- Filters run before matching profiles enter the result dataset.
- Diagnostic rows explain no-input, invalid-input, and zero-output runs.

## Cost And Safety

- Check the live Apify pricing box before every run.
- Apify platform usage may apply separately.
- Start with a small cap and ask before increasing it.
- Never expose tokens in output, logs, or URLs.
- Stop polling on every terminal Actor status.
- Abort a still-running Actor when the local timeout expires.
- Collect only public data needed for the stated purpose.
- Do not infer sensitive traits or bypass access controls.

## Output

Return JSON for downstream processing or a concise audience summary.
Keep target attribution when comparing accounts, lists, or communities.
State whether the output is sampled, filtered, deduplicated, or merged.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
