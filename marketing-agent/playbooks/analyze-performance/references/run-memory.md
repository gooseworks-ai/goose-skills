# Run memory for analyze-performance

What this playbook hands `../../../atoms/run-memory/ATOM.md` at the start and end of every run. The atom does the work; this file says what is specific here. `definitions.md` (the measurement contract) stays the source of truth for definitions; the weekly report stays the long-form record. The run record is the short, structured note the next run reads: the scorecards, the calls and what happened to them.

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
- The paid run's `readout to save` rows: with the marketer present, save each through `../../../atoms/save-learning/ATOM.md`'s readout path exactly as the paid record states it (field `experiment_readout.<slug>-r<n>`, its numbers and label), tell the marketer it is saved as found, and note it in this run's record so the paid run stops carrying it.

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

- An ended test called **Win** or **Loss** against the brief's criteria is a measured result. In a run with the marketer present, save it through `../../../atoms/save-learning/ATOM.md`'s readout path: kind 23, field `experiment_readout.<campaign-slug>-t<n>` (the brief's test number), source `our_work`, value = what changed, both arms' numbers, windows, the label (`truth` when store-joined, else `claimed`) and the verdict `worked` / `didn't work`. Numbers only, never a rule. Tell the marketer it is saved as found, not confirmed.
- **Unclear** calls, single-week patterns and anything from a **scheduled run** are not saved as readouts: the record marks them, and a scheduled run's Win/Loss waits as `readout to save` until the next run with the marketer present.
- A money move's truth check is saved as its own readout, `experiment_readout.<campaign-slug>-r<n>-store`, beside the paid run's claimed one, only when the store check itself gives `worked` or `didn't work` over the move's windows; never edit the paid run's fact. When the paid verdict is `can't tell (no ad-set view)`, the store check alone can't isolate one ad set: record it, save no readout.
- A **rule** drawn from results ("open cold hooks with X") stays a proposed learning (`tests-and-learnings.md`), written only in the marketer's words. A **worn-out angle** is proposed the same way and, on their yes, saved as kind 23 `worn_out_angle.<angle-id>` through save-learning's fact path.

## Recommendations and how to check them

The report's calls become the record's recommendations (`<YYYYMMDD>-<n>` ids), each with an owner — `run-paid-campaigns` for kill / scale / hold and negatives, a maker for make-next, `marketer` for plumbing fixes and exports — a review-by date and "how we'll know" with its baseline recipe (object, metric, window, label). When run-paid-campaigns adopts a call, its `R<n>` goes in `evidence`; don't mint another id.

## Scheduled runs

The atom's scheduled rules apply: free reads only, ask nothing, claims-only unless a connector exists (say so). `unknown` statuses go once into the report's decisions block. A run whose exports never came writes `Not run: <why>` and keeps the last baseline.
