---
name: run-memory
description: >-
  Shared step of the marketing playbooks (analyze-performance, run-paid-campaigns,
  research-competitors, email-lifecycle): reads the last run's record, checks whether its
  recommendations were done and whether they worked, and saves a short record of this run for the next
  one. Loaded by those playbooks; not for direct use.
version: 0.1.1
---

# run-memory

A playbook that runs again (often as a weekly or monthly automation) must know what its last run found, what it recommended and whether that worked. This atom is that memory. The **report** is separate (the `write-report` skill, `../write-report/SKILL.md`); a run record is the short, structured note the next run reads.

**Who loads it:** every playbook that can run more than once for the same brand: research, analysis, ads, social, email, search, creators. Not one-off makers (a single post, one photo set). It runs twice per run: **Start** before the playbook's own work, **End** after its report.

**What it does not replace.** Where a playbook already keeps a working log, that log stays the source of truth: run-paid-campaigns' `ads/campaigns/<slug>/state.md` + `decisions.md` (the server's campaign-harness grammar, `R<n>` ids, `## Checks due`), the `outcomes-ledger` skill's ledgers, analyze-performance's `definitions.md`. The run record copies their ids and adds only what they lack (the baseline recipe and the result numbers). It never keeps a second, different copy of their state, and when the playbook has its own scoring rule (run-paid-campaigns' "Score last week"), step 3 below *is* that step. Use its rule and add only what is missing.

## Inputs (the calling playbook supplies them)

| Input | Rule |
|---|---|
| `playbook` | The playbook slug (`analyze-performance`). Goes in the tags. |
| `job` | The job in plain words (`weekly ads check`, `monthly read`, `competitor watch`). Never a slug, tool or id. One playbook with several cadences has one `job` per cadence. Keep it the same on every run, because the next run searches by it. `job-slug` is `job` lower-cased and hyphenated. |
| `subject` | Optional. Only when a job keeps separate runs per campaign, rival or list (`spring-launch`). Lower-case slug. |
| `cadence` | `daily`, `weekly`, `monthly`, `quarterly`, or `ad hoc`. Used to judge whether the last record is old. |
| `outcome_sources` | Where this playbook can see whether a recommendation happened and what it did. Examples: `meta_read` change or push status, its own log file, `social_post_list`, `campaign_read`, a ledger. |

Brand inputs (`brand_id`, `brand_slug`, `coworker_agent_id`, scope) come from the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2.

**File:** `runs/<playbook>/<job-slug>/[<subject>/]<YYYY-MM-DD>.md`. A second run on the same day is `<YYYY-MM-DD>-2.md`.
**Title:** `Run record — <job>[ — <subject>] — <Brand> — <YYYY-MM-DD>`, with ` (2)` added for a second run that day (save-to-brain's never-overwrite rule, its step 1). The subject sits in the title because brain search cannot filter by tag.
**Local mode** (the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §5) calls no `gooseworks:` tool and no brain or knowledge search:
- **Step 1:** with the host's file tools, list `gooseworks-local/<brand-slug>/runs/<playbook>/<job-slug>/[<subject>/]` and read the newest record whole. Empty → no earlier run (step 1's rule).
- **Step 2:** the sources are the local files (the playbook's own log and reports in that folder), the marketer's connectors (read-only), their exports and their words.
- **Step 7:** the record through save-to-brain's local branch; rules learned through save-learning (it writes `brand-notes.md`); no readout fact (it stays in the record). The line says "Saved this run's notes in this folder", never "to your brand".
- **Hosted chat without files:** ask once for last time's notes ("paste last time's notes if you kept them"); none → no earlier run. At the end, give the record in chat to paste back next time.

## Start of run

### 1. Find the last record

Look in the workspace first, because it is the canonical copy and the exact check. Use the brain search to catch a record saved somewhere else.
- **Workspace.** Call `gooseworks:file_list` on `runs/<playbook>/<job-slug>/` (or the subject folder) in the brand's scope. If the coworker scope has no record, also list `brands/<brand_slug>/runs/…` in the default workspace. Records saved before the brand had a coworker live there.
- **Brain.** If `brain_*` tools are listed, call `gooseworks:brain_search` with query `Run record <job> <Brand>`, `source_types: ["document"]`, `since` = today minus 180 days, and `limit: 5`. Otherwise call `gooseworks:knowledge_search` with the same query and `source_types`. Keep only hits whose title matches this job's title up to the date, subject included. An empty search proves nothing: the brain may still be indexing ("Still indexing: 65 of 204…"), or the import may not have finished.

The newest dated record wins. **Read the whole record:** use `gooseworks:file_read` on the workspace file, or, if the brain is the only place it exists, `gooseworks:brain_open` on the document hit, following its continuations. **Without `brain_*` tools** (production today) a hit that exists only in the brain can't be opened in full: say "I found an earlier record I can't open here", treat this as a run with no readable record, and continue. Never work from a search snippet.

**The baseline is the newest record that has Numbers.** A `Not run` record (see Scheduled runs) only adds gaps and carried items. Keep reading back until you find one with Numbers.

**No record → no earlier run of this job.** Say so. Do not invent a "since last time". Still do step 2 with `since` = today minus 90 days. Server reports and the playbook's own log may hold history from before this job existed; if they do, say what they show and that it was not this job's own check. Every number this run records becomes the baseline.

**An old record** means older than 3× the cadence, or 90 days for `ad hoc`. Say so: "Last check was 2 August; a lot may have changed." Still check its open recommendations, but don't assume its baseline holds.

### 2. Read what happened since

All of these are free. Read only what this playbook needs. `since` is the last record's date.
- **Each open recommendation's `outcome_sources`.** For a money move, `gooseworks:meta_read` view `change_status` with its `change_id` tells you whether a person approved or declined it, and what Meta reported before and after. That is the **budget setting**, not results. For a launch, use view `push_status`.
- **The playbook's own log** (above), for decisions and other changes made since the last record.
- **The brain**, with `brain_*` tools listed: `gooseworks:brain_search` with `since` and `source_types` limited to what matters. `report` covers the server's own checks in chapter 18 "How we count results" (for example its weekly Meta deep check). `creative` and `meta_ad` cover chapter 22 "Everything we have made and run". `learning` covers chapter 23 "What is working". Without brain tools, use `gooseworks:knowledge_search` with the same filters.

### 3. Check every earlier recommendation

For each recommendation the last record left open (carried-forward ones included):

| Status | Only when |
|---|---|
| `done` | A source shows it happened: an approved and applied change, a published post, a file, a log entry, or the human saying so in this conversation. Never from your own inference. |
| `not done` | A source shows it did not happen (declined, still pending, nothing published by its date), or the human says so. |
| `unknown` | Nothing shows either way. Say what would settle it. In a scheduled run, put that question in the report's "Decisions for you", and record the date you asked (`asked on`). Don't ask again until the marketer has answered. |
| `dropped` | The human dropped it, or a newer recommendation replaced it (name which one). |
| `open` | Not due yet: its review-by date is still ahead. Carry it forward unchanged; don't question it. |

**Result, for `done` ones past their review-by date.** Re-run the record's "how we'll know" test with its **baseline recipe** (step 6). Pull both windows today, with the same lag and settings; never judge from a shorter window than the baseline, from unsettled days or from a single day. A number recorded last week was still filling in, so use it only as a sanity check. Give one verdict:
- `worked` or `didn't work`: the numbers before → after, with their windows and their truth/claimed label. Say what got worse, if anything did.
- `too early`: give the date it becomes readable. Carry it forward with that date as the new review-by.
- `can't tell`: say why. Other changes landed on the same thing in either window, tracking broke, the data is stale, there is no view at the right level, or the volume is too low to separate from noise.

**Paid moves** (budget changes, pauses, launches): use this recipe unless the playbook's own rule is stricter.
- **Post window:** starts the day after the change was **applied**. Approval is not application: take the applied date from `change_status` or `decisions.md`. It skips the first 3 days after a budget step of 30% or more, because that can restart Meta's learning. It ends 72 hours before today, since late conversions are still arriving.
- **Pre window:** the same length, ending the day before the change was applied.
- **Same attribution setting** in both windows.
- **Judge a budget raise on the extra results** per day, and what those extra results cost against the allowable cost. Never on average CPA. Net it against the rest of the account's change over the same windows.
- **Under about 30 results per window**, or with any other change logged in `decisions.md` for that object in either window (a swap, a launch, a promo, stock) → `can't tell` or `too early`, with a date.
- **`gooseworks:meta_read` view `performance`** returns trailing totals per Goose-made creative, with no date range. Totals for a past window can be built by subtracting two trailing reads (`days: 21` minus `days: 12`); ratios cannot. If the ad set holds ads GooseWorks didn't make, or its ads changed between the windows, the readout needs the marketer's Ads Manager export at ad-set level. Without one, the verdict is `can't tell (no ad-set view)`.
- **Label the numbers** `claimed` (platform-reported) unless they are joined to the brand's own store or CRM data (`truth`). Never compare a `truth` number with a `claimed` one as if they were alike.

### 4. Write "since last time" (3–5 lines)

Plain words, for the marketer. It opens the chat answer. In a report it goes at the top of "The story", with the one thing that matters most also in "In short". For example:
> Since 12 Oct: the summer ad set's budget went from $100 to $150 a day on 14 Oct. Over 9 settled days it brought about 1.3 more orders a day, at about $38 per extra order against your $40 limit, so it worked. These are Meta's own counts, and the rest of the account was flat.
> Two of last week's three recommendations were done; the new-hook test is still waiting for your yes.
> Not done: the landing-page fix, so I'm not judging the ads that send people there yet.

### 5. Feed it into this run

- **Don't repeat a move that didn't work** unless something material changed. Name what changed.
- **Follow up what's open.** Carry each open recommendation forward with its original id; don't restate it as new.
- **A declined move** comes back only with new evidence, and says it was declined before and when.
- **Open for two runs past review-by, with no evidence either way** → ask the human to keep it or drop it, once (the `asked on` rule above).

## End of run

### 6. Write the run record

**Prose under 400 words. The whole record, tables included, under 1,500 words.** Anything longer belongs in the report or in the playbook's own files, linked by path. Fixed sections, in this order. A section with nothing in it says "none".

```markdown
# Run record — <job>[ — <subject>] — <Brand> — <YYYY-MM-DD>
Playbook: <playbook> · Run: <with the marketer | scheduled> · Previous: <date or "none">
Report: <workspace path of this run's report, or "none">

## Checked
- Sources and period: <what was read, the date range, data freshness (e.g. "Meta synced 2026-10-18; settled through 2026-10-16")>
- Not checked: <what was skipped and why (no ceiling, not connected, stale)>

## Numbers
<scorecard or 3–6 key counts. Every number has its window and a label: truth / claimed / derived, with its source.>

## Decisions
- <YYYY-MM-DD> — <what was decided, and by whom: the marketer's words, or "proposal, waiting for yes">

## Recommendations
| id | what | owner | review by | how we'll know (test + baseline recipe) | evidence | status | asked on |
|---|---|---|---|---|---|---|---|

## Outcomes of the previous run's recommendations
| id | status | verdict | numbers (before → after, windows, label) | asked on |
|---|---|---|---|---|
```

- **Ids.** One rule: **when a stable source id already exists** (the campaign harness's `R<n>`, a `change_id`, a `push_id`), **that is the record's id**. Mint `<YYYYMMDD>-<n>` (the run date) only when none exists; a second run on the same day continues that day's numbering. A carried recommendation keeps its first id. Never give one thing two ids.
- **Owner** is who has to act: `marketer`; `agent` (this job's next run); `approval page` (waiting for a person's yes in GooseWorks); or another playbook that carries it out (`run-paid-campaigns`, with its `R<n>` or `decisions.md` block as evidence once it adopts the move).
- **"How we'll know"** names the metric, the threshold and the **baseline recipe**: the object (ad set, page, list, account), the metric, the window length, the attribution or data setting, and for ads, the ad ids in it and the share GooseWorks made. Store the recipe, not just a number, so the next run can re-pull both windows. A recommendation you can't test says `judgement call`, with what would show it was wrong.
- **Ads playbooks:**
  - **run-paid-campaigns** adds a **per-ad scorecard**: the top 10 ads by spend plus an "all others" row. Columns: ad, spend, results, cost per result or ROAS, CTR, days live, verdict (`scale` / `keep` / `watch` / `cut` / `too new`), change since the last record. Use a settled window (for example `days: 14` minus `days: 3`), and say what share of spend it covers and where any rows from outside GooseWorks came from.
  - run-paid-campaigns also adds **money moves**, one short row each: id + `R<n>` + `change_id`/`push_id`, from → to, applied on, baseline recipe, verdict. Approval state, trip-wires and checks stay in `state.md`. Link it.
  - **analyze-performance** keeps the scorecard but no money-move table. Its recommendations to change spend are owned by run-paid-campaigns.
- **Never put personal data in a run record.** No names, emails, phone numbers or handles of private people. Use counts and non-personal group ids only: list id, segment, opener, wave, ad id, campaign id. Never copy a ledger's row keys (emails, profile URLs, name plus domain) or any one person's row into a record. Public brand and ad names are fine, but an ad name that contains a private person's name (a UGC creator, say) is replaced by its ad id.

### 7. Save it

- **The record:** through the `save-to-brain` skill (`../save-to-brain/SKILL.md`), with `path` = the file above, `artifact` = `Run record — <job>[ — <subject>]`, `title` = the title above, `tags` = `[<playbook>, run-record]` (plus `subject:<slug>`), `versioned: keep-history`, `import: yes`. Earlier records are history and are never deleted.
- **Rules learned** ("never discount the hero product") go through the `save-learning` skill (`../save-learning/SKILL.md`), and only in the human's own words. A pattern you noticed yourself stays in the record and the report as a finding.
- **A measured readout** may also be saved as a numbers-only fact through save-learning's fact path (kind 23, field `experiment_readout.<id>`), when `brain_*` tools are listed. That means only a `worked` or `didn't work` verdict, with its truth/claimed label, and never from a scheduled run: it waits for a run with the marketer present. Tell the marketer it is saved as found, not confirmed.
- **Tell the marketer in one line:** "Saved this run's notes to your brand, so the next check starts from here." (Name the next check when one is scheduled: "next Monday's check", "next month's pulse".) If the save failed, say so plainly and put the record in the chat. In a scheduled run, there is no line unless the save failed; then the report says so in "What we couldn't check".

## Scheduled runs (no human present)

- **Still read the last record, and still write a new one.** The memory matters most here.
- **Free reads only**, unless the automation's yes named a standing per-run ceiling (the `spend-gate` skill (`../spend-gate/SKILL.md`) §C).
- **Ask nothing.** `unknown` statuses and keep-or-drop questions go into the report's "Decisions for you", once each (`asked on`). **A quiet run that sends no report** (a watch below its threshold) keeps those questions in the run record, with the date they were first raised, and the next run that does send a report asks them.
- **Anything that needs a yes waits as a proposal.** For example, a budget change through `gooseworks:propose_meta_budget_change` (its approval page), or a `brain_save` change that waits in the app. Record each one with owner `approval page`. Never accept a proposal yourself.
- **A run that stopped early** still writes its record, headed `Not run: <why>` (the data is stale, a connection is missing). It keeps the sources checked and carries every open recommendation forward unchanged, so the next run knows the gap and reads its baseline from the record before.
