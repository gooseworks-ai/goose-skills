---
name: run-paid-campaigns-weekly-read
description: >-
  Step of the run-paid-campaigns playbook: reads each platform's last mature results window against
  the allowable cost, as evidence for the week's moves. Run run-paid-campaigns instead; not for direct
  use.
version: 0.1.1
---

# Weekly read (atom)

**Load:** `../run-paid-campaigns/references/reading-results.md`.

**Inputs:** the volume regime; `meta_read view: performance` (a 14-day and a 3-day window, ranked by spend) for Goose ads, when Meta is chosen and GooseWorks is connected (local mode: the connector's date-range reads, `../run-paid-campaigns/references/local-mode.md`); the marketer's exports for non-Goose Meta and other platforms; analyze-performance's weekly read (blended MER, new-customer CAC, store-joined CPA per angle, its kill/scale/hold calls); `decisions.md` (edits inside the window); the brief's test plan and targets.

**Do:**
1. Set the window for the regime (high-volume: 14-day minus the immature last 3 days; low-volume: 14–28 days matured past the qualified lag; app: 7–14 days past postback delay); same attribution setting as last week. Trends from trailing totals are approximate — say so.
2. State coverage: share of spend visible per platform; what is not visible (frequency, learning status, CPM unless exported).
3. Per ad set / ad, sorted by spend: spend, results, cost per result vs allowable, CTR trend over 3 weeks, conversions (n) and its noise band (±1/√n), learning (events/week vs ~50), and any edit inside the window. Traffic tests: CTR, cost per LPV, UTM store CVR.
4. Join to the blended read: does store-joined data agree with the platform? If not, the store-joined number decides and the disagreement is stated.
5. Mark each object: readable winner · readable loser · near-threshold · too early · broken.

6. Build the per-ad scorecard (`../run-paid-campaigns/references/run-memory.md` § End): top 10 by spend plus all others, each row against its row in the last run record.

**Output:** the evidence table the moves are drafted from, with confidence per row, and the scorecard. No moves yet.
