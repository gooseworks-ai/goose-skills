---
name: analyze-performance-rank-and-read
description: >-
  Step of the analyze-performance playbook: ranks creative by angle, hook and format with spend gates,
  writes short per-channel reads and drafts what to make next. Run analyze-performance instead; not
  for direct use.
version: 0.1.0
---

# Creative ranking and channel reads (atom)

**Load:** `../analyze-performance/references/creative-and-channels.md`.

**Inputs:** `meta_read performance` (ranked by spend; the scorecard on the settled `days: 14` minus `days: 3` window, 7- and 28-day reads for the fatigue trend); each Goose ad's angle annotation (`ads_creative_read` and the campaign concepts); the non-Goose export; UTM store conversion per angle; email export; `social_analytics_get` posts and accounts; Google export and search terms; app/local exports.

**Do:**
1. Creative: group by angle → hook → format; rank by spend; apply minimum-spend gates; verdict with confidence; fatigue trend; name no winner if `insight.available` is false; state coverage.
2. Build the per-channel and per-ad scorecards against last run's rows and the angle history line (`../analyze-performance/references/run-memory.md`).
3. Draft "what to make next" from the history: tiring 2+-run winners first, retire losers, fair test for too-early, organic overperformers as paid candidates; nothing that already failed without a new reason; unmade items carried with their first date — producer and date for each.
4. Email & SMS, organic, Google (+ wasted-spend terms), apps, local: one short block each, or "not measured this week" / "not used".
5. Future rows: creators (codes), outreach (reply rates), WhatsApp — named, never dropped.

**Output:** the scorecards for the run record; the report's Creative ranking, channel blocks, channel-table rows and What-to-make-next draft.
