---
name: outcomes-ledger
description: >-
  Shared atom (owner: research-audience). Keeps one human-filled ledger per brand for the people or creators a playbook hands over: status per row, permanent suppression, a re-check date, and dated lessons read back into the next run. Parametrised by entity: person (prospect lists) or creator (creator rosters).
---

# outcomes-ledger

Every list a playbook hands over gets acted on outside GooseWorks: the human emails the prospects, messages the creators. This atom is how what happened comes back, so the next run never repeats a person who said no and gets better from what worked. It never contacts anyone and never requires outcomes: no outcomes, carry on.

## Parameters (the loading playbook sets them)

| | `entity: person` | `entity: creator` |
|---|---|---|
| Loaded by | research-audience (writes rows when a list is shown), write-outreach (updates statuses from replies and results) | work-with-creators |
| Ledger file | `research/audience/ledger.csv` | `creators/roster.csv` |
| Lessons document (file → brand document) | `research/audience/lessons/<YYYY-MM-DD>.md` → `Outreach lessons — <Brand> — <YYYY-MM-DD>` | `creators/lessons/<YYYY-MM-DD>.md` → `Creator lessons — <Brand> — <YYYY-MM-DD>` |
| Entity columns (after the required ones) | `segment, tier, value_tier, signal_type, email_status, region_flag, email, email_candidate, profile_url, root_domain, route, sequence_id, last_touch, reply_category` | `role, tier, deal_structure, vetting_depth, wave, wave_criterion, wave_result, quoted_rate`, then the roster's own columns |
| Status values | `listed · contacted · replied · meeting · not-a-fit · bounced · unsubscribed · do-not-contact` | `shortlisted · contacted · replied · quoted · declined · signed · posted · never-again` |
| Suppressing statuses (permanent) | `bounced · unsubscribed · do-not-contact` | `never-again` |
| Timed exclusions (not suppression) | `not-a-fit` — the account is skipped for 6 months, then eligible again; `contacted` with no reply after the sequence ended — the person is skipped for 12 weeks on every channel (cool-down) | `declined` — skipped until the human re-opens it |
| Match keys, in order | email (or email_candidate) → profile URL → name + root domain; account rows: root domain + route | handle + platform → profile URL |
| Grouped by (for lessons) | segment, tier, signal type, email status, region flag, sequence and touch, reply category | role, tier, deal structure, vetting depth, wave |
| Re-check | `recheck_by` = date listed + 30 days | `revet_by` = vetted on + 30 days |

## Files and scope

- Brand coworker workspace (`file_*` scope agent = the brand's `coworker_agent_id` from the `brand_read` list). No coworker → the default workspace with every path prefixed `brands/<brand-slug>/`, and tell the human teammates won't see it.
- **Read before write**: `file_write` replaces the whole file. Read the ledger, change rows, write it back complete.
- Every row a playbook *shows* the human is ledgered at the moment it is shown — sample rows included — not only at handover. Rows from a sample whose definition the human then rejected get status `listed-sample-rejected` and are **not** excluded later (the person was never handed over for outreach).
- Required columns, first and in this order (both entities): `row_type, key, name_or_handle, account_or_platform, date_listed, list_id, status, status_date, suppressed, suppressed_reason, suppressed_date, recheck_by|revet_by, outcome, notes`. `key` is the first available match key (person: email, else profile URL, else name + root domain; creator: `platform:handle`). Then the entity columns above, then the loading playbook's own columns. Never drop a column on write-back; unknown columns are kept as they are.
- A new entity (another playbook wanting a ledger) needs its row in the tables above, added by this atom's owner — ask before loading it.

## On every run (before any new sourcing)

1. Read the ledger. If it does not exist, create it with the header; carry on.
2. **Flag stale rows for free**: rows past `recheck_by` / `revet_by` that are not yet contacted. Tell the human in one line ("12 people from the 2026-09-10 list haven't been contacted and are past their re-check date"). Re-checking them is paid → the loading playbook's spend step (`atoms/spend-gate/ATOM.md`).
3. **Ask for outcomes once, never require them — in the run's closing decisions, never before the first result**: "Anything to report since <last list date> — replies, meetings, bounces, unsubscribes, declines, quotes? Paste, upload, or tell me in a sentence." Creators past a wave's read window (in `creators/<date>/wave-1.md`): also ask for each creator's views, orders on their code or link, and whether they posted. No answer → skip to step 6.
4. **Match** each reported outcome to a row by the match keys in order. Unmatched lines are shown back, never guessed onto a row.
5. **Update** `status`, `status_date`, `outcome` (and for creators `quoted_rate` when reported). Creators with wave results: score each against its `wave_criterion` → `wave_result` = `win · partial · miss · no-data`. A suppressing status sets `suppressed` with reason and date; a timed exclusion sets `outcome` and the date it lapses. **Suppression is permanent**: a suppressed row is excluded from every later run, of every list, and is never un-suppressed except by the human's own words.
6. **Exclude**: hand the loading playbook the full exclusion set — every suppressed key, every live timed exclusion, plus every key already listed and not yet resolved (so the next batch never repeats a person) — but not `listed-sample-rejected` rows.

## Lessons (only when outcomes came back)

1. Compare by the entity's groupings (person: read replies and fixes with write-outreach's `references/reading-results.md` — many "not relevant" → targeting, many "wrong person" → titles, bounces → list hygiene): reply and meeting rate (person) or reply, quote-vs-range, post rate and result vs the wave criteria (creator).
2. **Sample size**: person — judge on replies: under ~10 positive replies in a group (or under 50 contacted) → "directional only"; creator — under ~5 in a group. Said in the lesson.
3. Propose changes to the loading playbook's own rules (signal weights, segments, negative ICP; roles, tiers, price bands, vetting weights) and **get the human's yes before** any saved definition or plan changes.
4. Save the lessons to the entity's lessons file, then as a dated brand document through `atoms/save-to-brain/ATOM.md` (`versioned: keep-history`, tags `[<playbook>, lessons]`). It opens with "Do this first, because…" and the one change the numbers support most. **Numbers and groups only — no names, emails, handles of private people or contact data.** Named-creator operational notes ("missed the posting window twice") stay in the roster file's `notes`, never in the brain.
5. A lesson becomes a brand learning only through `atoms/save-learning/ATOM.md`: the human's own words, one idea each, retiring its own superseded ones, text starting `[outreach YYYY-MM-DD]` (research-audience, write-outreach) or `[creators YYYY-MM-DD]` (work-with-creators).

## Retention

Rows never contacted 12 months after `date_listed` are deleted from the ledger (keep suppressed keys forever — a suppression keeps only the key, the reason and the date). Say how many were removed.

## Never

- Never contact anyone, never send, never mark a row `contacted` on the agent's own inference.
- Never require outcomes to continue a run.
- Never drop a suppression to reach a list size.
- Never move personal contact data into the brain.
