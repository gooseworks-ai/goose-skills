# Standing watches — tell me when it happens

Load when the marketer asks to be told when something happens ("tell me when a past champion changes jobs", "watch these accounts for hiring", "flag anyone asking for an alternative to <rival>"), or when a list run ends and a watch would clearly help. A watch is not a repeated list: it checks a fixed set of people or accounts and reports only what changed.

## The three watches

| Watch | Checks | Signal | Cost per run |
|---|---|---|---|
| **Champion moved** | The champions list — people who praised the product publicly under their own name (with the link they published), or the marketer's own list of users and contacts | A new employer that passes the fit gates | **Paid:** one LinkedIn profile read per person checked (`/v1/linkedin/profile`), skipping anyone read in the last 7 days |
| **Account hiring** | A target-account list (up to ~100 accounts) | A new post for a role the product replaces or supports (list-sources.md § Hiring) | Free: careers pages and job-board searches |
| **Switch intent** | The rival names and pain phrases from the last list | New "alternative to <rival>", "moving off <rival>" posts by identifiable people at fitting companies | Free: Hacker News search and web search; paid only for Reddit or LinkedIn post search at volume |

## Champion moved — snapshot, then compare

1. **Baseline (first run):** for each champion, the profile URL, the company and title seen, and the date (`research/audience/watch/champions.csv` — people's data, never imported into the brain).
2. **Each check:** re-read profiles not read in the last 7 days. Compare the current company with the baseline after normalising both (drop legal and group suffixes such as inc, llc, ltd, gmbh, group, holdings; strip punctuation; lower-case). Different after normalising → a move. Skip a row when either side is blank or the read failed (say how many).
3. **Days since the move** from the current role's start date (year only → assume mid-year, say so). Fresh = under 120 days; best under 30.
4. **Does the new company fit?** Run the fit gates (fit-and-scoring.md). Pass → an alert row with the angle (write-outreach § Champion moved); fail → logged, no alert.
5. Write the new baseline with the check date. Alerts are keyed on **person + new employer**, so a champion who moves again alerts again.

## Account hiring and switch intent

State: the saved queries in `research/audience/watch/queries.md` and what was already seen in `watch/seen.csv` (post URL or job URL, date) — a post is alerted once. Account hiring: per account, search its careers page and the job boards for the mapped roles; a new post since the last check → alert with the post's URL and date, the tier (act today / this week / queue) and who to contact (one level above the role). Switch intent: run the saved queries over the period since the last check; an identifiable author at a fitting company → alert; anonymous posts → quotes for the bank, no alert.

## Setting one up

- Offer it only when it would help this brand, with the reason, a cadence and the **cost per run** (champion watch: about one paid profile read per champion; account hiring: about 2 web searches per account, free but run time; switch intent: about 18 searches): champions monthly; account hiring weekly or every two weeks; switch intent weekly.
- **Created paused**, through `automation_upsert`, per the `spend-gate` skill (`../../spend-gate/SKILL.md`) § C (scheduled runs): the marketer's yes names a **standing per-run credit ceiling** (champion watch: about one profile read per champion per run, from the credits log), and says the run itself uses credits. Free watches still need the yes; they cost only the run.
- Each run starts and ends with run-memory ([run-memory.md](run-memory.md), job `champion watch` / `account hiring watch` / `switch-intent watch`): the last record tells it what was already alerted and what each alert led to (from the ledger); the new record holds the counts (checked, moves or posts found, alerts, credits) — never names or profile URLs. A quiet run still writes its record.
- Each run writes `research/audience/watch/<D>.md` — what changed, nothing else — and delivers it through write-report only when something fired ("No moves among 42 champions this month" is one line in chat, not a report).
- Every alert row is ledgered (outcomes-ledger); the same person at the same employer is never alerted twice; suppressed people are never watched.

## Never

**Retention:** watch rows not alerted or contacted in 12 months are deleted, with a one-line note. Never watch private individuals, consumers or anyone who asked not to be contacted; never store emails or phones in a watch file; never scrape who liked or commented on posts; never run a paid watch without a standing ceiling.
