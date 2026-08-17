---
name: twitter-mention-tracker
description: 'Search public X posts with an existing Apify route or Xquik X Tweet Scraper. Track mentions, competitors, date ranges, engagement, and recurring conversations.'
---

# Twitter Mention Tracker

Use the existing Tweet Scraper route by default for public X post research.
Select Xquik X Tweet Scraper when the user requests that Actor.
The wrapper keeps Actor inputs separate and preserves native X search operators.

## Workflow

1. Clarify the query, date window, result cap, and output format.
2. Keep the existing route unless the user selects Xquik.
3. Preserve advanced search operators supplied by the user.
4. Add inclusive start and exclusive end dates only when requested.
5. Show the proposed result cap before starting a paid Actor run.
6. Use the bundled wrapper after the user accepts the scope.
7. Separate Xquik control rows from tweet records.
8. Deduplicate tweet records, then sort them by engagement.
9. Report the route, query, date window, result count, and limitations.

## Actor Behavior

- Both routes apply one run-wide result cap.
- The existing route keeps its live search mode and native input contract.
- Xquik supports latest, top, and combined ranking modes.
- Xquik rich output keeps normalized tweet and author fields.
- Xquik control rows report diagnostics and run summaries.

## Cost And Safety

- Check the live Apify pricing box before every run.
- Apify platform usage may apply separately.
- Start with a small cap and ask before increasing it.
- Never expose tokens in output, logs, or URLs.
- Stop polling on every terminal Actor status.
- Abort a still-running Actor when the local timeout expires.
- Respect public-data restrictions, privacy rules, and platform policies.

## Output

Return JSON for downstream processing or a concise engagement summary.
Keep tweet URLs and source search terms when the Actor returns them.
Explain when filters or ranking may have reduced coverage.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
