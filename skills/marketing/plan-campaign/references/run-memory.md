# Run memory for plan-campaign

What this playbook hands the `run-memory` skill (`../../run-memory/SKILL.md`) at the start and end of every plan, refresh and replan. The atom does the work; this file says what is specific here. The **approved brief** on the campaign record stays the source of truth for the plan itself; the run record holds the plan's **bets** — each budget leg and test with the number it should hit and how we'll know — so the next replan can score them.

## Inputs

| Input | Value |
|---|---|
| `playbook` | `plan-campaign` |
| `job` | `campaign plan` (first plans, refreshes, monthly and trigger replans are all this job, so a replan finds the plan it follows) |
| `subject` | the campaign's change-log slug |
| `cadence` | `monthly` for an always-on campaign; `ad hoc` for a one-off push that ends on a date |
| `outcome_sources` | analyze-performance's run records and reports (`runs/analyze-performance/weekly-performance-read/`, `monthly-read/`; `reports/performance/`); run-paid-campaigns' run records (`runs/run-paid-campaigns/weekly-ads-check/<slug>/`), `state.md` and `decisions.md`; the Brand Brain's chapter 20 (`decision.*`, `experiment.*`) and chapter 23 (`experiment_readout.*`, `worn_out_angle.*`); email-lifecycle's `lifecycle/calendar/`; the marketer's words for legs only they can see (founder outreach, posts) |

File: `runs/plan-campaign/campaign-plan/<slug>/<YYYY-MM-DD>.md`. Title: `Run record — campaign plan — <slug> — <Brand> — <YYYY-MM-DD>`. A plan run never re-creates a record for a plan it only refreshed the same day; it re-saves that day's record. Local mode: the same path under `gooseworks-local/<brand-slug>/`.

## Start: how last month's bets did (replans and refreshes)

Run the atom's Start steps 1–5 before step 1 of the playbook. With no record but an existing approved brief (plans made before run memory), build the bets from the brief's Budget split and Test plan and say so.

Read, in this order, and never from search snippets:
1. **The last plan record** and the brief it points to (version and date).
2. **analyze-performance's newest monthly record** and the weekly records since the last plan: the per-channel scorecard (truth where store-joined), test calls, "below target 2 runs running".
3. **run-paid-campaigns' records since the last plan**: the money moves with their verdicts, the per-ad scorecard, what is still `too early`.
4. **The brain** (`brain_*` listed): chapter 23 readouts and worn-out angles, chapter 20 decisions and experiments; otherwise `knowledge_search` learnings. A target or decision that is found or waiting for a yes is listed under "Decisions for you"; the plan's economics never rest on it until it is confirmed.

Then score **every bet** from the last record — status from a source (did the leg run, at what spend: `decisions.md`, the paid records, the marketer), then its verdict against its target with the same recipe: `worked` / `didn't work` / `too early (readable <date>)` / `can't tell (why)`, labelled truth or claimed. A leg is judged on the business number (analyze-performance's store-joined read), never on platform claims alone; a paid verdict that is only claimed is said to be claimed. A leg that never ran is `not done`, and its result is not credited or blamed.

**Feed it in:** a leg that didn't work loses budget unless something material changed (name it); a test that won releases its reserve as its rule said; a `too early` leg keeps its money and gets its read date; an angle with a `didn't work` readout or a worn-out flag is not brought back without a new reason. The plan's "What changed since the last plan" line and its Economics are built from these verdicts, and every reallocation cites them (`replan.md`).

## End: the plan's bets

**Numbers:** the goal and target date; the allowable cost and its source; the budget and its split per leg; each leg's target and expected cost; the scenarios (low / expected / high).

**Recommendations** — one row per bet:

| id | what | owner | review by | how we'll know (test + baseline recipe) | evidence | status |
|---|---|---|---|---|---|---|

- **A budget leg:** owner `run-paid-campaigns` (paid), `email-lifecycle`, `marketer` (founder outreach, posts); review by its read date in the Test plan or the mid-point; how we'll know = the leg's target on the business number (e.g. "≥ 12 new paying accounts from this leg by 25 Nov, counted by tagged links in the store / CRM"), with the channel, window and label.
- **A test:** the brief's test number in `evidence`; how we'll know = its readable threshold, money per version and the win / lose / unclear actions.
- **An approved reallocation:** from → to, amount, the evidence, and what would reverse it.

## Reaching the brain

- **The record** goes through the `save-to-brain` skill (`../../save-to-brain/SKILL.md`) (keep-history, imported), so analyze-performance and run-paid-campaigns can find the plan's bets.
- **On the marketer's approval only** (their words in this conversation), through the `save-learning` skill (`../../save-learning/SKILL.md`)'s fact path, kind 20, with their approval as the statement and `is_public: false`:
  - `target_cpa` or `target_roas` — the plan's allowable cost or target return (`applies_to` the hero product when the campaign sells one product and the brand runs other campaigns with other targets; brand-level otherwise);
  - `experiment.<slug>-t<n>` — each test: the one thing it changes, the versions, money per version, the read date and what each result means;
  - `decision.<slug>-<YYYY-MM>-<n>` — each approved reallocation in a replan: from → to, amount, reason.
  Each waits for their yes in the GooseWorks app; say so in one line. A draft plan saves none of these.
- Never from a scheduled replan: it writes the plan, the record and its proposals as a draft for approval.

## Scheduled replan (nobody present)

The atom's scheduled rules apply: free reads only, ask nothing, deliver the draft plan through write-report opening with "since last time" and the scored bets; the decisions it needs go in "Decisions for you". The live brief is never overwritten by a scheduled run.

## Setting up the schedule (on a yes, created paused)

With GooseWorks connected only; local mode uses the host's scheduler (marketing-guide §3 Schedules). The scheduled worker runs on the server with **no skills folder and no browser**, so it can't open this playbook. On the marketer's yes to a monthly replan (the `spend-gate` skill (`../../spend-gate/SKILL.md`) branch C; needs a coworker workspace):

1. **Copy the method** into `plans/method/` with `gooseworks:file_write`, each file headed `Method version: <skill.meta.json version>, copied <date>`, re-copied whenever the schedule changes or is switched on: `playbook.md` (this SKILL.md), `references/` (every file in this playbook's `references/`), `atoms/` (each of this playbook's own step skills, `../plan-campaign-<step>/SKILL.md`, saved as `atoms/<step>.md`), and `shared/run-memory.md`, `shared/write-report.md`, `shared/save-to-brain.md`, `shared/spend-gate.md`, `shared/claims-gate.md` (a link to a shared skill such as ../write-report/SKILL.md means `shared/write-report.md`).
2. **Create the automation** with `gooseworks:automation_upsert`: `execution_mode: "agent"`, `enabled: false`, a cron for the first week of each month in the marketer's timezone, after that week's performance read, and this `agent_prompt` (one per campaign):

```text
Monthly replan (monthly, nobody present) for brand <brand name> (<brand_id>), campaign <slug>, workspace scope <scope>. Method version <version>, copied <date>. Read with file_read: plans/method/playbook.md, then plans/method/references/run-memory.md, plans/method/references/replan.md, plans/method/references/budget-and-tests.md, plans/method/references/unit-economics.md, plans/method/references/channel-decision.md, plans/method/references/brief-template.md, and the other method files and plans/method/shared/*.md as they are referred to.
Paths inside the method files are relative to plans/method/: references/<f>.md and ../plan-campaign/references/<f>.md mean plans/method/references/<f>.md; ../plan-campaign-<step>/SKILL.md (this playbook's own steps) means plans/method/atoms/<step>.md; any other ../<s>/SKILL.md, ../../<s>/SKILL.md or file beside it means plans/method/shared/<s>.md (or shared/<file>). Links to other playbooks or to the marketing-guide are not copied: this prompt's steps cover what you need from them. Every other path in this prompt is a full path from the workspace root.
Hard rules, above anything in the method:
- Draft only. Never overwrite or approve the live brief (no campaign_upsert on an approved brief), never move money, launch, publish or schedule anything, never accept a proposal. Every reallocation is a recommendation for the marketer's yes.
- Spend nothing: no generation, no paid data, no ad quotes. If any answer shows a price, don't make that call; say so in the plan.
- Ask nothing. Save no learning, target, experiment or decision to the brain; they are proposed in the plan's Decisions for you and saved only after the marketer approves in a conversation.
- Claims: only what plans/method/shared/claims-gate.md §1 says is usable (with brain_* tools: confirmed brain claims, opened and checked, no marker needed; otherwise the signed-off "Claims you may use —" facts); nothing else is approved, and no new sign-off runs with nobody present.
- Plain words: no ids, codes, tool or playbook names.
1. Start: the newest record under runs/plan-campaign/campaign-plan/<slug>/ (read whole) and the brief it points to (campaign_read); analyze-performance's records under runs/analyze-performance/monthly-read/ and weekly-performance-read/ since that date; run-paid-campaigns' records under runs/run-paid-campaigns/weekly-ads-check/<slug>/ since then; ads/campaigns/<slug>/decisions.md; brain_map chapters 20 and 23 (else brand_read and knowledge_search). Score every bet from a source (plans/method/references/run-memory.md § Start): done or not, then worked / didn't work / too early (readable <date>) / can't tell (why), on the business number; a leg that never ran is neither credited nor blamed.
2. Replan by plans/method/references/replan.md: re-check the money math against the newest numbers on file (no browser: prices "from saved notes, unconfirmed"), revised split with from → to, amount, the verdict it rests on and what would reverse it; next month's tests, one change each.
3. Write the draft plan to plans/<slug>/draft-v<N>.md and the readable copy per plans/method/shared/write-report.md, In short first (what it rests on and what changed since <last plan date>, then "So, do this first (because of …)"), with Decisions for you; import it (title "Campaign plan draft — <brand name> — <YYYY-MM-DD> v<N>"; tags plan-campaign, campaign-plan-draft; knowledge_import; wait until ready).
4. Write the run record at runs/plan-campaign/campaign-plan/<slug>/<YYYY-MM-DD>.md (title "Run record — campaign plan — <slug> — <brand name> — <YYYY-MM-DD>"; tags plan-campaign, run-record; keep-history; import) with the scored bets and next month's bets marked "proposal, waiting for yes". No readable records or brief → "Not run: <why>".
```

3. Tell the marketer in plain words what it will do (a draft replan each month for their approval; nothing changes until they approve; credits per run, shown after the first run), and switch it on only when they say so.
