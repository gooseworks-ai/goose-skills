# Replan modes

Load when the ask is a replan ("plan next month", "rebalance the budget", a trigger fired). For this ICP the monthly replan *is* the standing plan; a quarterly re-plan is the same run with a 3-month horizon and a fresh channel-decision pass.

## Monthly replan

Reads, in order (run-memory's Start steps, `run-memory.md`, do the reading and score last month's bets):
0. The last plan record and its bets — `runs/plan-campaign/campaign-plan/<slug>/`; then analyze-performance's monthly and weekly run records and run-paid-campaigns' run records since that date (scorecards, money moves with their verdicts). With `brain_*` tools, chapter 23 readouts and worn-out angles and chapter 20 decisions and experiments.
1. The current campaign record(s) — `campaign_read` — the brief, its targets, test plan and channel decisions.
2. The last four weekly performance reads and the latest monthly unit-economics read from analyze-performance (`reports/performance/` in the brand's coworker workspace).
3. The change log from run-paid-campaigns — the `### YYYY-MM-DD — <title>` blocks of `ads/campaigns/<slug>/decisions.md` (its own and the server's Meta outcomes: approved, declined, paused) and the open recommendations in `state.md` — what was actually done, so results are not credited to moves that never happened.
4. The learnings log (`brain_map` chapters 14 and 23 where listed; else `brand_read` learnings and `knowledge_search` `source_types: ["learning"]`).
5. Anything new: stock, offers, the promo calendar for the coming month, a competitor digest.

Then:
- Score every bet in the last plan record — every test that ended (from analyze-performance's calls and readouts) and every leg against its target and the allowable CAC — on blended / store-joined numbers, not platform claims: done or not (from a source), then worked / didn't work / too early / can't tell. A leg that never ran is neither credited nor blamed. Each money move run-paid-campaigns made carries its own verdict; quote it, labelled claimed unless analyze-performance's store check confirms it.
- Re-run the channel decision only where something changed: a "Later" whose flip condition is now met, a "Run" missing its target two months running, a new channel the marketer asked about.
- Stage a **revised split**: each reallocation as a finished recommendation — from → to, $ amount, the evidence (the bet's verdict, record and report dates, numbers), expected effect (direction and range from the brand's history, or "unknown"), and what would reverse it.
- Write next month's tests (the learnings decide what is worth testing next) and the asset list for the month.
- Save the run record with next month's bets (`run-memory.md` § End); on approval, propose the target, tests and reallocations to chapter 20.
- Version the brief (version N+1) on the same campaign record, with a short "What changed and why" section at the top; the campaign keeps its status (`active` stays `active`) and its change-log slug. Do not create a new campaign for a monthly replan of the same always-on campaign.

## Trigger replan (scoped)

When a pre-committed replan trigger fires (stock-out, CAC breach, account restriction, competitor move, tracking break, date slip, budget cut, early winner) — read from the "Replan triggers fired" line of the latest analyze-performance report, run-paid-campaigns' `state.md`, or the marketer — revise **only the affected leg(s)**: name the trigger and its evidence, the leg affected, the proposed change, and what stays as is. Hand the change to the owning playbook (paid moves → run-paid-campaigns; email → email-lifecycle) as a written recommendation; plan-campaign does not act.

## What a replan never does

- Never moves money — reallocations are recommendations the marketer approves, then run-paid-campaigns stages them.
- Never quietly changes the goal — a missed goal goes back to the marketer as a renegotiation case.
- Never rewrites the brief while ad creative plans are waiting for approval on the campaign (saving any non-status change discards them): check `ads_creative_read` `view: "approvals"`; if plans are pending, tell the marketer and ask whether to wait or proceed.
