---
name: outcomes-ledger
description: >-
  Shared step of the marketing playbooks (research-audience, write-outreach, work-with-creators):
  keeps the brand's record of the prospects or creators that were handed over. Tracks a status for
  each person, permanent opt-outs, re-check dates and dated lessons, which the next run reads. Loaded
  by those playbooks; not for direct use.
version: 0.1.1
---

# outcomes-ledger

Every list a playbook hands over gets acted on outside GooseWorks: the human emails the prospects, messages the creators. This atom is how what happened comes back, so the next run never repeats a person who said no and gets better from what worked. It never contacts anyone and never requires outcomes: no outcomes, carry on.

## Parameters (the loading playbook sets them)

| | `entity: person` | `entity: creator` |
|---|---|---|
| Loaded by | research-audience (writes rows when a list is shown), write-outreach (updates statuses from replies and results) | work-with-creators |
| Ledger file | `research/audience/ledger.csv` | `creators/roster.csv` |
| Lessons document (file → brand document) | `research/audience/lessons/<YYYY-MM-DD>.md` → `Outreach lessons — <Brand> — <YYYY-MM-DD>` | `creators/lessons/<YYYY-MM-DD>.md` → `Creator lessons — <Brand> — <YYYY-MM-DD>` |
| Entity columns (after the required ones) | `segment, tier, value_tier, signal_type, email_status, region_flag, email, email_candidate, profile_url, root_domain, route, sequence_id, opener_id, first_touch_date, last_touch, reply_category, recontact_after` | `role, tier, deal_structure, vetting_depth, wave, wave_criterion, wave_result, quoted_rate`, then the roster's own columns |
| Status values | `listed · contacted · replied · meeting · not-a-fit · bounced · unsubscribed · do-not-contact` | `shortlisted · contacted · replied · quoted · declined · signed · posted · never-again` |
| Suppressing statuses (permanent) | `bounced · unsubscribed · do-not-contact` | `never-again` |
| Timed exclusions (not suppression) | `not-a-fit` — the account is skipped for 6 months, then eligible again; `contacted` with no reply after the sequence ended — the person is skipped for 12 weeks on every channel (cool-down) | `declined` — skipped until the human re-opens it |
| Match keys, in order | email (or email_candidate) → profile URL → name + root domain; account rows: root domain + route | handle + platform → profile URL |
| Grouped by (for lessons) | segment, tier, signal type, email status, region flag, sequence, opener and touch, reply category | role, tier, deal structure, vetting depth, wave |
| Re-check | `recheck_by` = date listed + 30 days | `revet_by` = vetted on + 30 days |

## Files and scope

- Brand coworker workspace (`file_*` scope agent = the brand's `coworker_agent_id` from the `brand_read` list). No coworker → the default workspace with every path prefixed `brands/<brand-slug>/`, and tell the human teammates won't see it.
- **Read before write**: `file_write` replaces the whole file. Read the ledger, change rows, write it back complete.
- Every row a playbook *shows* the human is ledgered at the moment it is shown — sample rows included — not only at handover. Rows from a sample whose definition the human then rejected get status `listed-sample-rejected` and are **not** excluded later (the person was never handed over for outreach).
- Required columns, first and in this order (both entities): `row_type, key, key_hash, name_or_handle, account_or_platform, date_listed, list_id, status, status_date, suppressed, suppressed_reason, suppressed_date, recheck_by|revet_by, outcome, notes`. `key` is the first available match key (person: email, else profile URL, else name + root domain; creator: `platform:handle`). Then the entity columns above, then the loading playbook's own columns. Never drop a column on write-back; unknown columns are kept as they are.
- A new entity (another playbook wanting a ledger) needs its row in the tables above, added by this atom's owner — ask before loading it.

## On every run (before any new sourcing)

1. Read the ledger. If it does not exist, create it with the header; carry on.
2. **Flag stale rows for free**: rows past `recheck_by` / `revet_by` that are not yet contacted. Tell the human in one line ("12 people from the 2026-09-10 list haven't been contacted and are past their re-check date"). Re-checking them is paid → the loading playbook's spend step (the `spend-gate` skill, `../spend-gate/SKILL.md`).
3. **Ask for outcomes once, never require them — in the run's closing decisions, never before the first result**: "Anything to report since <last list date> — replies, meetings, bounces, unsubscribes, declines, quotes? Paste, upload, or tell me in a sentence." Creators past a wave's read window (in `creators/<date>/wave-1.md`): also ask for each creator's views, orders on their code or link, and whether they posted. No answer → skip to step 6.
4. **Match** each reported outcome to a row by the match keys in order. Unmatched lines are shown back, never guessed onto a row. A `stop`, unsubscribe, complaint or bounce from an address not in the ledger gets a **suppression-only row: the `key_hash`, the reason and the date — never the address** (§ Suppression without personal data). Keeping the raw address needs the human's yes, asked once in the closing decisions.
5. **Update** `status`, `status_date`, `outcome` — and for people, `first_touch_date` when the first send is reported (never overwritten afterwards; it anchors rates and the cool-down), `last_touch`, `reply_category`, and `recontact_after` for a "not now, try in <month>" reply (and for creators `quoted_rate` when reported). Creators with wave results: score each against its `wave_criterion` → `wave_result` = `win · partial · miss · no-data`. A suppressing status sets `suppressed` with reason and date, and reduces the row to its suppression form (below); a timed exclusion sets `outcome` and the date it lapses. **Suppression is permanent**: a suppressed row is excluded from every later run, of every list, and is never un-suppressed except by the human's own words.
6. **Exclude**: hand the loading playbook the full exclusion set — every suppressed `key_hash` (the playbook hashes each candidate's keys the same way and drops any match), every live timed exclusion (including rows whose `recontact_after` date hasn't come), plus every key already listed and not yet resolved (so the next batch never repeats a person) — but not `listed-sample-rejected` rows.

## Lessons (only when outcomes came back)

1. Compare by the entity's groupings (person: read replies and fixes with write-outreach's `references/reading-results.md` — many "not relevant" → targeting, many "wrong person" → titles, bounces → list hygiene): reply and meeting rate (person) or reply, quote-vs-range, post rate and result vs the wave criteria (creator).
2. **Sample size** (one rule everywhere): person — under 50 contacted in a group → counts and what to watch only, no rates judged; 50+ but under ~10 positive replies → "directional only"; creator — under ~5 in a group → "directional only". Said in the lesson.
3. Propose changes to the loading playbook's own rules (signal weights, segments, negative ICP; roles, tiers, price bands, vetting weights) and **get the human's yes before** any saved definition or plan changes.
4. Save the lessons to the entity's lessons file, then as a dated brand document through the `save-to-brain` skill (`../save-to-brain/SKILL.md`) (`versioned: keep-history`, tags `[<playbook>, lessons]`). It opens with "Do this first, because…" and the one change the numbers support most. **Numbers and groups only — no names, emails, handles of private people or contact data.** Named-creator operational notes ("missed the posting window twice") stay in the roster file's `notes`, never in the brain.
5. A lesson becomes a brand learning only through the `save-learning` skill (`../save-learning/SKILL.md`): the human's own words, one idea each, retiring its own superseded ones, text starting `[outreach YYYY-MM-DD]` (research-audience), `[outreach-copy YYYY-MM-DD]` (write-outreach) or `[creators YYYY-MM-DD]` (work-with-creators).

## With run-memory (the `run-memory` skill)

The ledger and the run records hold different things and must agree:
- **The ledger is the per-row truth** — every person's or creator's status, dates and outcome. Nothing else stores rows.
- **A run record holds only the summary** — counts and rates by the groupings above, for a stated window — plus the ledger's path. It never holds a row, a key, a name, an email, a handle or a profile URL.
- **Recount, don't carry.** Each run's "since last time" recomputes its numbers from the ledger (statuses and dates as they stand today), never copies them from the last record. When a recount differs from what the last record said (the marketer reported outcomes late, a row was corrected), the ledger wins and the new record says "restated: <what changed>".
- **Lessons and records:** a lessons file is the analysis of outcomes (dated, keep-history); the run record links it and lists its proposed changes as recommendations with ids, so the next run can check whether they were adopted and what they did.
- Statuses a run record cites are only the ones the marketer reported into the ledger — never inferred.

## Suppression without personal data

A suppression must last forever, but the person's details must not. So:
- **`key_hash`** = SHA-256 (hex, prefixed `sha256:`) of the normalised key: email lower-cased and trimmed; profile URL lower-cased with no protocol, `www.`, query or trailing slash; name + root domain lower-cased, single-spaced, joined by `@`; creators `platform:handle` lower-cased. The same rule hashes every new candidate, so a suppressed person is blocked from every later list without the ledger keeping who they are.
- **When a row is suppressed** (bounced, unsubscribed, do-not-contact, never-again): keep `key_hash`, `suppressed`, `suppressed_reason`, `suppressed_date`, `list_id`; blank every other personal field (`key`, name, email, email_candidate, profile URL, route, notes). Counts by segment stay countable from `list_id` and the reason.
- **Compute the hash with the host's code tool** (shell or code execution). A host that can't compute one: don't store the address at all — tell the human to add it to their own sending tool's suppression list, and ask once whether to keep the raw address here so it stays blocked; store it only on their yes, labelled `raw, kept on your yes (<date>)`.
- Rows the human pastes or uploads for scoring follow the same rule when they become suppressed.

## Retention

Rows never contacted 12 months after `date_listed` are deleted from the ledger. Suppression rows are kept forever, in their hashed form only. Say how many were removed.

## Never

- Never contact anyone, never send, never mark a row `contacted` on the agent's own inference.
- Never require outcomes to continue a run.
- Never drop a suppression to reach a list size.
- Never move personal contact data into the brain.
