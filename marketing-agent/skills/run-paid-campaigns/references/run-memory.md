# Run memory for run-paid-campaigns

What this playbook hands the `run-memory` skill (`../../run-memory/SKILL.md`) at the start and end of every run. The atom does the work; this file says what is specific here. **`state.md` and `decisions.md` stay the source of truth** for approval state, open moves and checks (`proposal-and-log.md`). The run record copies their ids, links them, and adds only what they lack: the baseline recipe, the result numbers and the per-ad scorecard.

## Inputs

| Input | Value |
|---|---|
| `playbook` | `run-paid-campaigns` |
| `job` | `weekly ads check` (reactive runs — sold out, a rejection, a crisis — are the same job; a second run that day is `-2`) |
| `subject` | the campaign's change-log slug (the `ads/campaigns/<slug>/` folder), so each campaign has its own history |
| `cadence` | `weekly` (the low-volume regime is still weekly; its decisions are monthly) |
| `outcome_sources` | with GooseWorks, `gooseworks:meta_read` `change_status` (each `change_id`) and `push_status` (each `push_id`) — local mode reads the connector's read-backs instead (`local-mode.md`); the `### YYYY-MM-DD — …` blocks of `decisions.md`; `## Open recommendations` and `## Checks due` in `state.md`; `gooseworks:meta_read` `performance`; the marketer's export; analyze-performance's newest report and run record (store-joined numbers); the marketer's words for instruction cards |

File: `runs/run-paid-campaigns/weekly-ads-check/<slug>/<YYYY-MM-DD>.md`. Title: `Run record — weekly ads check — <slug> — <Brand> — <YYYY-MM-DD>`. Local mode: the same path under `gooseworks-local/<brand-slug>/`.

**Ids** (run-memory's one rule: a stable source id, when it exists, *is* the record's id). Every move here has the harness id `R<n>` in `state.md`, so `R<n>` is its record id; its `change_id` / `push_id` go in `evidence`. A dated `<YYYYMMDD>-<n>` id is minted only for something with no `R<n>` (rare here: a question to the marketer, a note that isn't a move). Never give one move two ids. An analyze-performance call this playbook adopts becomes an `R<n>`, with the call's record id in `evidence`.

## Start: the outcome check (this replaces "score last week")

Run the atom's Start steps 1–5. Step 3 *is* this playbook's scoring step; it also applies every due line in `## Checks due` (its rule, its trip-wire). For each open move and each money move whose review-by date has come:

1. **Did it happen?** From a source only: `change_status` approved / declined / still waiting, with Meta's before → after budget; `push_status` for launches; a `decisions.md` block; the marketer's "done" (and its time) for a card. Approval is not application. The applied date comes from a source that shows the budget changed (Meta's after-value with its time, the server's block, the marketer's "done"). Only an approval date known → the verdict is **`can't tell (applied date unknown)`**: never build windows from an assumed date. Ask for Meta's change history for that ad set (Ads Manager › the ad set › history) or an ad-set export that shows the budget by day — in "Decisions for you" on a scheduled run — and carry the move forward with that ask. Once a source gives the applied date, compute the readable-from date and review-by from it (`server-needs.md` #27).
2. **What did it do?** Re-pull both windows with the stored **baseline recipe** (below). Verdict, one of:
   - `worked` / `didn't work` — extra results per day before → after, what each extra result cost against the allowable, both windows, the label (claimed / truth), and the rest of the account's change over the same windows.
   - `too early` — with the date it becomes readable; carry it forward with that date as the new review-by.
   - `can't tell` — with the reason: another change on that ad set in either window, a tracking break, stale data, no ad-set view (non-Goose ads in the ad set and no export), or too few results to separate from noise.
3. **Feed it in:** a raise that `didn't work` is not repeated on that ad set without a new reason; one that `worked` makes the next step eligible (still one step per weekly run); a `can't tell` because of a collision says which move to keep still next time.

### The baseline recipe (stored with every money move)

Written into the record's money-move row the day the move is staged, so next week's run can measure the move, not the week:

| Part | What to store |
|---|---|
| Object | the campaign and ad set names, the Meta ad set id and the `push_id` |
| Ads | every Meta ad id in that ad set and the share GooseWorks made (n of N ads; share of spend). `meta_read` sees only Goose-made ads and `## Meta objects` only our pushes, so the full list comes from the marketer's export or their words when the move is staged. Not known → record the ad set as **mixed**: its readout needs the ad-set export |
| Metric | results per day on the optimised event, spend per day, and **cost per extra result** = Δ spend per day ÷ Δ results per day, against the allowable cost. Traffic tests: landing-page views and UTM store orders instead. Lead-gen: qualified leads |
| Windows | **pre:** 7 days ending the day before the change is applied when the ad set gets about 30+ results a week, else 14 (never across an earlier change on that ad set). **post:** the same length, starting the day after the applied date, skipping the first 3 days when the step is 30% or more, ending 72 hours before the read |
| Attribution | the setting in `state.md`'s header (e.g. 7-day click / 1-day view), the same in both windows |
| How to pull | local mode: the connector's date-range read for the stored ad ids, else the ad-set export. With GooseWorks: `meta_read` `performance` (`rank_by: spend`, `limit: 25`) by subtraction (`days: a` minus `days: b`, counts only), summed over the stored ad ids, when every ad in the ad set is Goose-made — check every stored ad id is in **both** reads, else `can't tell (ad missing from a read)`; otherwise the marketer's ad-set export for the two date ranges, asked for by name in the report (and picked up from `reports/performance/inputs/` when the performance read collected it) |
| Control | the rest of the account over the same windows (other Goose ads, or the export's account totals), to net the move against the week |
| Recorded pre numbers | the pre-window totals as pulled that day — a sanity check only; the next run re-pulls both windows |
| Readable from | applied date + 1 + learning days skipped + post-window length + 3 days; it is read at the first weekly run on or after that date. A 40% raise applied Wed 14 Oct: with 7-day windows (post 18–24 Oct) readable 28 Oct, read at the Mon 2 Nov run; with 14-day windows (post 18–31 Oct) readable 4 Nov, read 9 Nov. Runs before then say `too early (readable <date>)` |

**Freeze the ad set until it is read.** A money move holds its ad set still — no other budget step, swap or launch in it — until its readout date, so the readout can be clean. Fatigue inside a frozen ad set is a **hold with a trip-wire** on a click-rate floor (e.g. "if its click rate falls below 0.9%, swap it"), not a swap. A health failure or a tripped trip-wire overrides the freeze; then the earlier move is declared `can't tell (other change on <date>)` in the same proposal. Don't call fatigue during a move's learning days or in the week after a step of 30% or more — spend wasn't flat.

## End: what the record holds

The atom's sections, with these in **Numbers**:

1. **Header numbers:** allowable cost and its source, the ceiling, month-to-date spend vs plan, coverage (share of spend visible, by platform).
2. **Per-ad scorecard** — top 10 ads by spend plus an "all others" row, on a settled window (`days: 14` minus `days: 3`):

| Ad | Ad set | Spend | Results | Cost per result | Return | CTR | Days live | vs last run | Verdict |
|---|---|---|---|---|---|---|---|---|---|

   - **Return** only where revenue is real: store-joined from analyze-performance's newest read (label `truth`); otherwise Meta's figure labelled `claimed`, never a verdict on its own.
   - **vs last run:** cost per result and CTR change against this ad's row in the previous record ("new" if it wasn't there).
   - **Verdict:** `scale` / `keep` / `watch` / `cut` / `too new`, by `moves.md`'s rules; it matches this week's moves.
   - Say what share of spend the table covers and where non-Goose rows came from (the export and its date). An ad name containing a private person's name is replaced by its Meta ad id.
3. **Money moves** — one row per budget change, pause, launch, swap or graduation staged, applied or read this run:

| R | change / push | Object | From → to | Applied | Baseline recipe | Review by | Verdict |
|---|---|---|---|---|---|---|---|

   The recipe cell may point to a fuller block under the table. Approval state, trip-wires and checks stay in `state.md`; link it.

**Carry every unclosed move.** Every money move without a final verdict (`worked`, `didn't work`, `can't tell`, or declined) is copied with its full recipe into **every** record until it closes — mid-week checks and reactive runs included, since they are the same job and the next run reads only the newest record. The server deletes an `R<n>` bullet from `state.md` once a change is approved; the record is where the move lives on until it is read.

**Recommendations:** one row per open `R<n>` (owner `approval page`, `marketer` for cards and pause sentences, `agent` for holds and checks), its review-by date and "how we'll know" with the recipe. **Decisions:** the marketer's words, or "proposal, waiting for yes". **Links:** `state.md`, `decisions.md`, this run's proposal file.

## Reaching the brain

- **The record** goes through the `save-to-brain` skill (`../../save-to-brain/SKILL.md`) (keep-history, imported), so analyze-performance and plan-campaign find the moves, outcomes and scorecard with `gooseworks:brain_search` (documents) or the workspace path.
- **Measured readouts** of money moves — `worked` or `didn't work` only — also go through the `save-learning` skill (`../../save-learning/SKILL.md`)'s readout path: kind 23, field `experiment_readout.<slug>-r<n>`, source `our_work`, the numbers, windows and label, no rule. Never from a scheduled run: the record lists it as `readout to save` (status column) with the field, the exact value text and `request_key` `run-paid-campaigns.<slug>.r<n>`, and carries it until saved. Because this job usually runs scheduled, **any** run with the marketer present saves it: this playbook's own, or analyze-performance's Monday read, which picks up the paid run's `readout to save` rows (`../../analyze-performance/references/run-memory.md`). Either tells the marketer it is saved as found, not confirmed.
- **Targets and caps** (`proposal-and-log.md` § The yardstick in the brain).

## Scheduled run (nobody present)

The atom's scheduled rules apply in full, plus:
- It reads, checks, scores and drafts as usual, and **stages**: budget changes, swaps and launches as approval pages (owner `approval page`). Pause sentences and instruction cards go into the report for the marketer. It never pauses, applies or accepts anything.
- No new step on an ad set whose last move is still `too early`.
- The proposal uses the same template as a run with the marketer present, delivered the same way (`proposal-and-log.md` § Delivery, which saves it to `ads/campaigns/<slug>/proposals/<YYYY-MM-DD>.md`). `unknown` statuses and keep-or-drop questions go once into its "Decisions for you".
- **Asks for the marketer** (an ad-set export for a move's windows, an unknown status) go into the report's "Decisions for you" once, with `asked on`, and into the run record's Recommendations with owner `marketer` and the exact date ranges. A scheduled run never gets an answer itself, so analyze-performance's Monday read (with the marketer present) puts these asks in its one input message and saves what arrives to `reports/performance/inputs/<YYYY-MM-DD>.md`, where this playbook reads it next run.
- **Not run** only when the data is stale (no Meta sync since the last run) or a connection is missing: a `Not run: <why>` record that carries every open move forward unchanged. A missing export is not a reason: run in no-export mode (`written-instructions.md`), record the Numbers it can see and state the coverage.

## Setting up the schedule (on a yes, created paused)

With GooseWorks connected only; local mode uses the host's scheduler (marketing-guide §3 Schedules). The scheduled worker runs on the server with **no skills folder and no browser**, so it can't open this playbook. On the marketer's yes (the `spend-gate` skill (`../../spend-gate/SKILL.md`) branch C; needs a coworker workspace — without one, say so and keep running on ask):

1. **Copy the method** into `ads/method/` with `gooseworks:file_write`, each file headed `Method version: <skill.meta.json version>, copied <date>`, re-copied whenever the schedule is changed or switched on: `playbook.md` (this SKILL.md), `references/` (every file in this playbook's `references/`), `atoms/` (each of this playbook's own step skills, `../run-paid-campaigns-<step>/SKILL.md`, saved as `atoms/<step>.md`), and `shared/run-memory.md`, `shared/write-report.md`, `shared/save-to-brain.md`, `shared/spend-gate.md` (a link to a shared skill such as ../run-memory/SKILL.md means `shared/run-memory.md`).
2. **Create the automation** with `gooseworks:automation_upsert`: `execution_mode: "agent"`, `enabled: false`, a weekly cron in the marketer's timezone a few hours after the performance read's, and this `agent_prompt` (one per campaign):

```text
Weekly ads check (weekly, nobody present) for brand <brand name> (<brand_id>), campaign <slug>, workspace scope <scope>. Method version <version>, copied <date>. Read with file_read: ads/method/playbook.md, then ads/method/references/run-memory.md, ads/method/references/proposal-and-log.md, ads/method/references/moves.md, ads/method/references/reading-results.md, and the other method files and ads/method/shared/*.md as they are referred to.
Paths inside the method files are relative to ads/method/: references/<f>.md and ../run-paid-campaigns/references/<f>.md mean ads/method/references/<f>.md; ../run-paid-campaigns-<step>/SKILL.md (this playbook's own steps) means ads/method/atoms/<step>.md; any other ../<s>/SKILL.md, ../../<s>/SKILL.md or file beside it means ads/method/shared/<s>.md (or shared/<file>). Links to other playbooks or to the marketing-guide are not copied: this prompt's steps cover what you need from them. Every other path in this prompt is a full path from the workspace root.
Hard rules, above anything in the method:
- Never pause, resume, revert, launch, publish, apply or switch on anything. Never approve or accept a change, a push or a brain proposal. Stage proposals only: budget changes, swaps and launches as approval pages (propose_meta_budget_change, propose_meta_creative_replacement, prepare_meta_ad_push), which change nothing until a person approves them on the page. Pauses and every change outside GooseWorks go into the report as sentences and instructions for the marketer.
- Spend nothing: no generation, no paid data. <Spending rule: "No data credits." | "Paid reads up to <N> credits this run, logged in research/credits-log/<YYYY-MM>.md; stop at the ceiling.">. If any answer shows a price, don't make that call; say so in the report.
- Ask nothing. Save no learning, readout, target or cap; mark readouts "readout to save".
- Keep every move inside the brief's monthly ceiling and the operating plan's confirmed daily cap; respect protected campaigns; if a confirmed emergency stop is set, stage pause sentences and fixes only. Targets, caps and stops that are found or waiting for a yes never steer a verdict or a move: list them under Decisions for you. A pending stop or a pending lower cap may only block budget increases and launches this run; it never authorises a change.
- No new step or swap on an ad set whose last money move has not been read. Never build a result window from an assumed date.
- Plain words in the report: no ids, tool or playbook names; budgets in the account currency.
1. Start: the newest record under runs/run-paid-campaigns/weekly-ads-check/<slug>/, read whole (a "Not run" record adds gaps; the baseline is the newest with Numbers). Read ads/campaigns/<slug>/state.md and ads/campaigns/<slug>/decisions.md; the brief (campaign_read, Approved only); brain_map chapters 20 and 15 and the operating plan (brain_open), else brand_read; the newest reports/performance/ report and reports/performance/inputs/ files.
2. Outcome check (ads/method/references/run-memory.md § Start): for each open move and due check — change_status / push_status / ads/campaigns/<slug>/decisions.md; the applied date only from a source, otherwise can't tell (applied date unknown) with the ask in Decisions for you; then re-pull both windows with the stored recipe and give worked / didn't work / too early (readable <date>) / can't tell (why). Append final verdicts to ads/campaigns/<slug>/decisions.md; a too early only moves the date on its Checks due line.
3. Health checks (no browser: destinations "not checked this run"), the weekly read and the per-ad scorecard (meta_read performance, days 14 minus days 3, ranked by spend), then draft moves by ads/method/references/moves.md, each money move with its baseline recipe.
4. Stage: R<n> bullets and Checks due lines in ads/campaigns/<slug>/state.md (re-read it first); approval pages for budget changes, swaps and launches; every push id added to meta_push_ids at once; never re-propose an item that already has an id.
5. Write the proposal to ads/campaigns/<slug>/proposals/<YYYY-MM-DD>.md in ads/method/references/proposal-and-log.md's one template and ads/method/shared/write-report.md's checks: In short first (with its since-last-time line), Decisions for you (unknown statuses and asks once, today as asked-on), and the pause sentences and instruction cards under What to do; import it (media_upload scope brand, kind document, source workspace; title "Paid moves — <slug> — <brand name> — <YYYY-MM-DD>"; tags run-paid-campaigns, paid-moves; knowledge_import; wait until ready; delete only an earlier document with exactly this title).
6. Write the run record at runs/run-paid-campaigns/weekly-ads-check/<slug>/<YYYY-MM-DD>.md (title "Run record — weekly ads check — <slug> — <brand name> — <YYYY-MM-DD>"; tags run-paid-campaigns, run-record; keep-history; import) with the scorecard, the money-move table (every unclosed move with its full recipe), recommendations and outcomes. No Meta sync since the last run, or a missing connection → a "Not run: <why>" record carrying every open move unchanged; a missing export is not a reason (no-export mode).
```

3. Tell the marketer in plain words what it will and won't do (stages proposals for their yes; never pauses or changes anything; uses credits per run, cost shown after the first run from `gooseworks:automation_list`), and switch it on only when they say so.
