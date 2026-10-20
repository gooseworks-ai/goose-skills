# Run memory for research-audience

How this playbook uses [the `run-memory` skill](../../run-memory/SKILL.md): the Start steps before any research, the End steps after the report. This file says only what is specific here: the jobs, where outcomes come from, what the record counts, and what never goes in it.

## Jobs (keep the `job` text identical on every run — the next run searches by it)

| Job (`job`) | `subject` | `cadence` | Runs when |
|---|---|---|---|
| `audience research` | — | `ad hoc` (twice a year, or on a trigger) | The audience report |
| `prospect list` | the list slug (`<D>-<list>` folder name) | `ad hoc` | A list built |
| `lead scoring` | the upload's slug | `ad hoc` | A list the marketer brought, scored |
| `champion watch` · `account hiring watch` · `switch-intent watch` | — | the watch's own (monthly / weekly) | Each watch run, scheduled or not |

A new list is a new `subject`. To find "what happened with the lists before", the Start step also reads the newest `prospect list` records for any subject (`runs/research-audience/prospect-list/`, newest first, up to 3).

## Start: "since last time"

**Outcome sources** (`outcome_sources`), all free:
- **The outcomes ledger** (`research/audience/ledger.csv`, the `outcomes-ledger` skill (`../../outcomes-ledger/SKILL.md`)) — the source of truth for every person. Recount from it, never from the last record: per list, per segment, per `list_source` and per `signal_type` — listed, contacted, replied, positive = **distinct rows** where `reply_category` is `interested` **or** `status` is `meeting` (a booked row is counted once), with meetings reported separately as a subset, meetings, not-a-fit, bounced, unsubscribed — for rows listed since the last record's date, and for older rows whose status changed since.
- **write-outreach's results** (`outreach/*/results.md`, and `results-working.md` for open request lines) and lessons (`research/audience/lessons/`), for what the messages showed (which segments and signals replied) and open request lines.
- **The brain**, with `brain_*` tools: `brain_search` `since` the last record, `source_types: ["learning", "audience", "document"]` — new `[outreach …]` rules, audience items the marketer confirmed or rejected, new customer evidence. Otherwise `knowledge_search`.
- **Watches:** `research/audience/watch/<D>.md`, `seen.csv`, `champions.csv` (moves found, alerts sent, and — from the ledger — what each alert led to).

**Say, in 3–5 lines** (the run-memory format), what fits the job:
- **Audience research:** what changed (new customer data, new evidence, a group that grew or fell), and whether last run's "What to do" moves were done and what they showed — e.g. "the forum answers were done (4 threads); 2 sign-ups came from them (your note, 3 Nov)".
- **Lists:** what happened to the last lists — "Of the 42 people listed on 19 Oct, 30 were contacted; 4 replied, 2 positive, 1 meeting — all from the hiring segment; the no-signal segment got 0 replies from 12." Then use it: weight the sources and signals that replied, demote the ones that didn't (sample-size rule below), and say so.
- **Watches:** "Since 12 Oct: 2 of 40 champions moved, 1 to a company that fits (alerted); that alert was contacted and booked a meeting. 3 new hiring posts at watched accounts."
- **Lead scoring:** whether the "answer first" leads were answered in time and what came of them, when the marketer reported it.

**Sample size, said every time** (the ledger's rule): under 50 contacted in a group → counts and what to watch only; 50+ but under ~10 positive replies → "directional only"; nothing about the fit or signal weights changes for good on either.

## End: the record

- **Numbers** (3–6 lines, each with its window and label `reported` — the marketer's outcomes — or `derived`): audience — group sizes and the lead group, quote count and recent share, sources read vs blocked; list — accounts screened / kept, people found, email status mix, rows with a signal, universe size; then the ledger's outcome counts for earlier lists; watch — people or accounts checked, moves or posts found, alerts, credits spent; lead scoring — rows by urgency and tier, overdue count.
- **Recommendations** — the report's "What to do" moves and the list's "send first" call, each with an id, owner (`marketer`, `write-outreach`, `agent`), review-by date and **how we'll know** with its recipe: the object (segment, list, signal type), the metric (positive reply rate, meetings, or for audience moves the observable result), the window (people whose touch 1 falls between two dates), and the source (`ledger.csv` statuses as reported).
- **Links, not copies:** `Report:` the report path; and in "Checked", the ledger path, the list folder, the lessons file and the watch file. The record never repeats per-row state.

## Never in a run record

No person's name, email, phone, profile URL, handle or title-at-company, and **no ledger keys** — for people they are emails or profile URLs, which are personal data. Only list ids, segment names, signal types, account counts and totals. Public company names appear only in the report, not in the record. (The ledger and list files hold the rows; the record links them.)
