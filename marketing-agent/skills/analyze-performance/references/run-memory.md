# Run memory for analyze-performance

What this playbook hands the `run-memory` skill (`../../run-memory/SKILL.md`) at the start and end of every run. The atom does the work; this file says what is specific here. `definitions.md` (the measurement contract) stays the source of truth for definitions; the weekly report stays the long-form record. The run record is the short, structured note the next run reads: the scorecards, the calls and what happened to them.

## Jobs

| `job` | When | `cadence` |
|---|---|---|
| `weekly performance read` | the Monday report | `weekly` |
| `monthly read` | the first Monday of the month | `monthly` |
| `daily pulse` | on request or an approved schedule | `ad hoc` |

`playbook` = `analyze-performance`; no `subject` (the read covers every channel). A **monthly read with no monthly record** takes its baseline from the newest weekly record and says so. A **pulse** record keeps only the thresholds checked, what broke, and "nothing" otherwise; it never becomes the weekly baseline.

`outcome_sources`: run-paid-campaigns' run records (`runs/run-paid-campaigns/weekly-ads-check/<slug>/`) and `decisions.md` blocks (what was actually done, and the paid run's verdict on each money move); `state.md` open recommendations; the brief's Test plan; this week's store / CRM numbers; the makers' batch files and `rotation-requests.md` answers (was the "make next" made?); `gooseworks:social_post_list` for organic picks; the marketer's words.

## What the one input message also asks for

With the marketer usually present here and the paid run usually scheduled, this read collects what the paid run can't ask for itself:
- **Daily store totals** (orders, new-customer orders, net revenue) covering the pre and post windows of every open money move in the paid run's newest record, named by date — not only this week and last.
- The paid run's open asks (its run record's Recommendations with owner `marketer`, e.g. an ad-set export for two date ranges), by name. Whatever arrives is saved to `reports/performance/inputs/<YYYY-MM-DD>.md` under a line naming the move it is for, where the paid run reads it.
- The paid run's `readout to save` rows: with the marketer present, save each through the `save-learning` skill (`../../save-learning/SKILL.md`)'s readout path exactly as the paid record states it (field `experiment_readout.<slug>-r<n>`, its numbers and label), tell the marketer it is saved as found, and note it in this run's record so the paid run stops carrying it.

## Numbers (the record's "Numbers" section)

1. **Business truth** — the type's referee (DTC: net and new-customer revenue, MER, new-customer MER, nCAC, contribution after ads vs break-even; B2B: qualified pipeline by source; app: activated / retained users), this week and the 4-week average, labelled `truth` with the source.
2. **Overclaim ratio** — claimed purchases ÷ store orders, and its 4-week range (`derived`).
3. **Per-channel scorecard** — one row per rostered channel:

| Channel | Spend | Results (claimed) | Cost per result | Store-joined / blended | vs target | vs last run | Verdict |
|---|---|---|---|---|---|---|---|

   A rostered channel without numbers is a row that says "not measured (send X)". Verdict: `on target` / `below target` / `above target` / `not readable`, and "below target 2 runs running" when the last record says so too (a replan trigger).
4. **Per-ad scorecard** — top 10 ads by spend across paid platforms plus an "all others" row, on the same settled window as the paid run's scorecard (`days: 14` minus `days: 3` for Goose ads; the export's matching dates for the rest): ad, angle and hook (from the makers' annotations; "unannotated" otherwise), spend, results, cost per result, return (`truth` where store-joined, else `claimed`), CTR, days live, change vs this ad's row last run, verdict (`scale` / `keep` / `watch` / `cut` / `too new`). Same ad keys as run-paid-campaigns' scorecard (Meta ad id), so the two can be read side by side. Say the share of spend covered.
5. **Angle history line** — for each angle with spend this week: weeks it has been ranked, weeks it won on the business number, and its CTR trend across the records read (`derived`).

## Start: reading the history, not just this week

Run the atom's Start steps 1–5. Then read back **up to the last 4 weekly records** (not only the newest): the scorecards and angle history are what "what worked" and "what to make next" rest on.

- **Calls carried forward** (`tests-and-learnings.md` § Calls carried forward) *are* the atom's step 3: each earlier call → `done` / `not done` / `unknown` / `dropped` from a source (`decisions.md`, run-paid-campaigns' record), then the result against its "how we'll know". A kill/scale call run-paid-campaigns adopted is judged with **its** money-move verdict and recipe, not re-measured here on platform numbers.
- **A money move's result** (for example a budget raise): status and applied date come only from the paid run's newest record (this playbook can't see the change status); a server approval block alone is "approved, applied date unknown". Take the paid run's verdict (`worked` / `didn't work` / `too early` / `can't tell`, claimed) and add the **truth check** only this playbook can make: over the move's own pre and post windows (from its baseline recipe), did store orders or new-customer revenue rise in line with the extra spend (marginal new-customer MER vs break-even)? Show both. When they disagree it is the "Two stories" block, and the store number decides the call. A `too early` paid verdict stays `too early` here too. Without store data for those dates → `can't tell (store data for <dates>)`, carried to the next run, and the dates are asked for by name.
- **Order of runs.** This read usually runs before the paid run, so it judges the moves in the paid run's *newest* record; a move the paid run reads later the same day is picked up next week. Say which paid record it used.

## What worked, and what to make next — from the history

- **What worked** = held on the business number for **2+ runs** on settled data, or a test called Win. A one-week top ad is "watch" with its date to re-check, never "worked".
- **What's tiring** = a winner whose CTR or conversion rate has fallen across 2–3 records at steady spend. It goes first on the make-next list (more hooks on the same angle before it decays).
- **Don't bring back what failed.** An angle with a `didn't work` readout, a `worn_out_angle.*` fact in chapter 23 or a Loss test call is not recommended again without a new reason, named.
- **Did last time's make-next get made?** Check the makers' answers under the rotation request lines and the batch files. Made and live → judge it in the scorecard; not made → carry it with its first date, don't restate it as new.
- Every make-next item cites the records it rests on ("won 3 of the last 4 weeks; CTR 1.6% → 1.1% since 29 Sep").

## Experiment readouts (measured results)

- An ended test called **Win** or **Loss** against the brief's criteria is a measured result. In a run with the marketer present, save it through the `save-learning` skill (`../../save-learning/SKILL.md`)'s readout path: kind 23, field `experiment_readout.<campaign-slug>-t<n>` (the brief's test number), source `our_work`, value = what changed, both arms' numbers, windows, the label (`truth` when store-joined, else `claimed`) and the verdict `worked` / `didn't work`. Numbers only, never a rule. Tell the marketer it is saved as found, not confirmed.
- **Unclear** calls, single-week patterns and anything from a **scheduled run** are not saved as readouts: the record marks them, and a scheduled run's Win/Loss waits as `readout to save` until the next run with the marketer present.
- A money move's truth check is saved as its own readout, `experiment_readout.<campaign-slug>-r<n>-store`, beside the paid run's claimed one, only when the store check itself gives `worked` or `didn't work` over the move's windows; never edit the paid run's fact. When the paid verdict is `can't tell (no ad-set view)`, the store check alone can't isolate one ad set: record it, save no readout.
- A **rule** drawn from results ("open cold hooks with X") stays a proposed learning (`tests-and-learnings.md`), written only in the marketer's words. A **worn-out angle** is proposed the same way and, on their yes, saved as kind 23 `worn_out_angle.<angle-id>` through save-learning's fact path.

## Recommendations and how to check them

The report's calls become the record's recommendations (`<YYYYMMDD>-<n>` ids), each with an owner — `run-paid-campaigns` for kill / scale / hold and negatives, a maker for make-next, `marketer` for plumbing fixes and exports — a review-by date and "how we'll know" with its baseline recipe (object, metric, window, label). When run-paid-campaigns adopts a call, its `R<n>` goes in `evidence`; don't mint another id.

## Scheduled runs

The atom's scheduled rules apply: free reads only, ask nothing, claims-only unless a connector exists (say so). `unknown` statuses go once into the report's decisions block. A run whose exports never came writes `Not run: <why>` and keeps the last baseline.

## Setting up the schedule (on a yes, created paused)

With GooseWorks connected only; local mode uses the host's scheduler (marketing-guide §3 Schedules). The scheduled worker runs on the server with **no skills folder and no browser**, so it can't open this playbook. On the marketer's yes (the `spend-gate` skill (`../../spend-gate/SKILL.md`) branch C; needs a coworker workspace), record the offer in `definitions.md`, then:

1. **Copy the method** into `reports/performance/method/` with `gooseworks:file_write`, each file headed `Method version: <skill.meta.json version>, copied <date>`, re-copied whenever the schedule changes or is switched on: `playbook.md` (this SKILL.md), `references/` (every file in this playbook's `references/`), `atoms/` (each of this playbook's own step skills, `../analyze-performance-<step>/SKILL.md`, saved as `atoms/<step>.md`), and `shared/run-memory.md`, `shared/write-report.md`, `shared/save-to-brain.md`, `shared/spend-gate.md` (a link to a shared skill such as ../run-memory/SKILL.md means `shared/run-memory.md`).
2. **Create the automation** with `gooseworks:automation_upsert`: `execution_mode: "agent"`, `enabled: false`, a Monday cron in the marketer's timezone before the paid check's, and this `agent_prompt` (the pulse uses the same prompt with "Daily pulse" and only step 1 and references/monthly-and-pulse.md § Daily pulse):

```text
Weekly performance read (weekly, nobody present) for brand <brand name> (<brand_id>), workspace scope <scope>. Method version <version>, copied <date>. Read with file_read: reports/performance/method/playbook.md, then reports/performance/method/references/run-memory.md, reports/performance/method/references/measurement-contract.md, reports/performance/method/references/monday-report.md, reports/performance/method/references/revenue-join.md, reports/performance/method/references/creative-and-channels.md, reports/performance/method/references/tests-and-learnings.md, and the other method files and reports/performance/method/shared/*.md as they are referred to.
Paths inside the method files are relative to reports/performance/method/: references/<f>.md and ../analyze-performance/references/<f>.md mean reports/performance/method/references/<f>.md; ../analyze-performance-<step>/SKILL.md (this playbook's own steps) means reports/performance/method/atoms/<step>.md; any other ../<s>/SKILL.md, ../../<s>/SKILL.md or file beside it means reports/performance/method/shared/<s>.md (or shared/<file>). Links to other playbooks or to the marketing-guide are not copied: this prompt's steps cover what you need from them. Every other path in this prompt is a full path from the workspace root.
Hard rules, above anything in the method:
- Read and report only. Never pause, scale, launch, publish, change a budget or campaign, or accept a proposal. Recommendations are labelled recommendations for the marketer's yes.
- Spend nothing: no generation, no paid data. <Spending rule: "No data credits." | "Paid reads up to <N> credits this run, logged in research/credits-log/<YYYY-MM>.md; stop at the ceiling.">. If any answer shows a price, don't make that call; say so in the report.
- Ask nothing. Save no learning, readout or worn-out angle; propose them in the report's decisions block and mark readouts "readout to save" in the record.
- No store or CRM numbers this week (no connector, none in reports/performance/inputs/) → claims-only mode: say so at the top; platform numbers are labelled claimed and never quoted as truth.
- Plain words: no ids, tool or playbook names.
1. Start: the newest record under runs/analyze-performance/weekly-performance-read/ (read whole) and up to four weekly records back; reports/performance/definitions.md; the newest run record under runs/run-paid-campaigns/weekly-ads-check/<slug>/ for each campaign; ads/campaigns/<slug>/state.md and ads/campaigns/<slug>/decisions.md; campaign_read briefs; brain_map chapters 18, 20, 22, 23 (else brand_read and knowledge_search). Check each earlier call from a source (reports/performance/method/references/run-memory.md § Start); a money move's status and applied date only from the paid record.
2. Read the week by the method's steps 1–6 with what is available (meta_read performance on the settled days 14 minus days 3 window; social_account_list and social_analytics_get; inputs files the marketer left). Build the per-channel and per-ad scorecards against last run's rows; "what worked" only what held 2+ runs or won a test; "what to make next" from the history.
3. Write the report to reports/performance/<YYYY-MM-DD>.md in reports/performance/method/references/monday-report.md's shape and reports/performance/method/shared/write-report.md's checks: In short first (with its since-last-time line), "Since last time" opening The story, and one Decisions for you block (unknown statuses and the paid run's asks once each, today as asked-on); import it (media_upload scope brand, kind document, source workspace; title "Performance read — <brand name> — <YYYY-MM-DD>"; tags analyze-performance, performance-read; keep-history; knowledge_import; wait until ready; delete only an earlier document with exactly this title).
4. Write the run record at runs/analyze-performance/weekly-performance-read/<YYYY-MM-DD>.md (title "Run record — weekly performance read — <brand name> — <YYYY-MM-DD>"; tags analyze-performance, run-record; keep-history; import). Sources unreadable (no connection) → a "Not run: <why>" record that keeps the last baseline; missing exports are not a reason (claims-only).
```

3. Tell the marketer in plain words what it will do (a claims-only read unless their store numbers can reach it; recommendations only; credits per run, shown after the first run), and switch it on only when they say so.
