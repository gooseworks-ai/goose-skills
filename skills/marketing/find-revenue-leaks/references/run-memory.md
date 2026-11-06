# Run memory for the revenue leak check

What this skill hands the `run-memory` skill (`../../run-memory/SKILL.md`) at the start and end of every run. The atom does the work; this file says what is specific here.

## Jobs

| `job` | When | `cadence` |
|---|---|---|
| `revenue leak check` | the full run (every check the tools allow) | `monthly` |
| `quick leak check` | on request or a weekly schedule: only the checks whose cadence is daily, twice a week or weekly | `weekly` |

`playbook` = `find-revenue-leaks`; no `subject`. A narrower ask ("just my email") runs as the full job with fewer checks; the record says which ran, and the next run compares only checks that ran both times.

`outcome_sources`: the same check re-run today (the main one: did it come back clean?); the marketer's words; the paid-ads job's records and `decisions.md` blocks (a pause or budget move it made); the email job's files (a flow rebuilt). Never mark a fix `done` from inference.

## Each finding's key

`<check slug>:<thing>`, where the thing is a stable, non-personal id: an ad or ad set id, a flow message id, a product handle, a discount code name (not a customer's), a country code, a domain. A finding with no natural thing uses the slug alone. The key lets the next run say what changed.

## Numbers (the record's "Numbers" section)

1. **Coverage:** checks selected / found / clean / partial / couldn't run / skipped, and the tools used (live or export).
2. **Findings table**, one row per finding:

| key | kind | money at stake (monthly, label) | math and window | how sure | effort | status vs last run |
|---|---|---|---|---|---|---|

Status vs last run: `new`, `still open` (with the money then → now), `worse`, `smaller`, `fixed` (the check ran again and came back clean), `not re-checked` (the tool wasn't available this time: carried, not fixed).
3. **Clean checks** by slug, so a later "found" on one of them shows as new.

## Recommendations

Each finding's recommended action is one recommendation: id `<YYYYMMDD>-<n>` unless a stable id exists (the paid job's `R<n>`); owner `marketer` (or the job they handed it to); review by = today plus the check's cadence (a monthly check: one month; a daily check: one week at most); how we'll know = "the same check comes back clean" plus the number it should move, with the window recipe (source, window length, settled days). A fix that came back clean is `done` with verdict `worked`; a fix the marketer says they made but the check still finds is `done`, verdict `didn't work`, and the finding stays open.

## Start: what the next run says first

After the atom's Start steps, open with 3–5 lines: what was fixed since the last run and what that recovered (the earlier estimate, labelled), what is still open and whether it grew, and how many checks ran this time vs last ("12 more, now that your email tool is connected").

## Setting up a schedule

Offer one only when repeating would help: a monthly full run when anything was found or several checks are monthly; a weekly quick run when a daily or weekly check found something (sold-out ads, unshipped orders, a spend limit). Say which checks would be better as standing alerts (those marked Daily) and that standing alerts aren't built yet.

**With GooseWorks:** by the `spend-gate` skill (`../../spend-gate/SKILL.md`) §C and the `marketing-guide` skill's §3 Schedules (`../../marketing-guide/SKILL.md`): created paused, switched on by the marketer. Copy this skill's method (this folder's references, plus the selected checks' text) to `reports/revenue-leaks/method/` and give the worker a self-contained prompt:

> Run the revenue leak check (or quick leak check) for <Brand>, read-only. Read the method in `reports/revenue-leaks/method/` and the last run record. Use only the connections listed there and free reads; never pause, change, send, publish, or spend. Ask nothing. Re-run each check the tools allow, rank findings, mark each new / still open / fixed against the last record, and save the run record. Send a report only when there is a new leak, a still-open leak grew, or a question is due; otherwise save the record only.

**Local mode:** the host's own scheduler only, created switched off, with the same prompt naming local mode and the folder. No scheduler → "I can't schedule this here; ask me again when you want the next one."
