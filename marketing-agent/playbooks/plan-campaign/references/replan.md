# Replan modes

Load when the ask is a replan ("plan next month", "rebalance the budget", a trigger fired). For this ICP the monthly replan *is* the standing plan; a quarterly re-plan is the same run with a 3-month horizon and a fresh channel-decision pass.

## Monthly replan

Reads, in order:
1. The current campaign record(s) — `campaign_read` — the brief, its targets, test plan and channel decisions.
2. The last four weekly performance reads and the latest monthly unit-economics read from analyze-performance (`reports/performance/` in the brand's coworker workspace).
3. The change log from run-paid-campaigns — the `### YYYY-MM-DD — <title>` blocks of `ads/campaigns/<slug>/decisions.md` (its own and the server's Meta outcomes: approved, declined, paused) and the open recommendations in `state.md` — what was actually done, so results are not credited to moves that never happened.
4. The learnings log (`brand_read` learnings; `knowledge_search` `source_types: ["learning"]`).
5. Anything new: stock, offers, the promo calendar for the coming month, a competitor digest.

Then:
- Score every test that ended (from analyze-performance's calls) and every channel against its target and the allowable CAC — on blended / store-joined numbers, not platform claims.
- Re-run the channel decision only where something changed: a "Later" whose flip condition is now met, a "Run" missing its target two months running, a new channel the founder asked about.
- Stage a **revised split**: each reallocation as a finished recommendation — from → to, $ amount, the evidence (report dates and numbers), expected effect (direction and range from the brand's history, or "unknown"), and what would reverse it.
- Write next month's tests (the learnings decide what is worth testing next) and the asset list for the month.
- Version the brief (version N+1) on the same campaign record, with a short "What changed and why" section at the top; the campaign keeps its status (`active` stays `active`) and its change-log slug. Do not create a new campaign for a monthly replan of the same always-on campaign.

## Trigger replan (scoped)

When a pre-committed replan trigger fires (stock-out, CAC breach, account restriction, competitor move, tracking break, date slip, budget cut, early winner) — read from the "Replan triggers fired" line of the latest analyze-performance report, run-paid-campaigns' `state.md`, or the human — revise **only the affected leg(s)**: name the trigger and its evidence, the leg affected, the proposed change, and what stays as is. Hand the change to the owning playbook (paid moves → run-paid-campaigns; email → email-lifecycle) as a written recommendation; plan-campaign does not act.

## What a replan never does

- Never moves money — reallocations are recommendations the human approves, then run-paid-campaigns stages them.
- Never quietly changes the goal — a missed goal goes back to the founder as a renegotiation case.
- Never rewrites the brief while ad creative plans are waiting for approval on the campaign (saving any non-status change discards them): check `ads_creative_read` `view: "approvals"`; if plans are pending, tell the human and ask whether to wait or proceed.
