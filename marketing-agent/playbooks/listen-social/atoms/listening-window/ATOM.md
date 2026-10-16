---
name: listening-window
description: Hidden step of listen-social. The week, file and de-duplication rules - which week is counted, which items are triaged, how files are named, how a re-run merges, how skipped weeks and open crises carry forward, and how far each search pages. Loaded at steps 3, 4 and 11 of listen-social and by its standing run; never listed.
---

# listening-window

## The two windows

- **Counting week** = the last completed Monday–Sunday week in the brand's timezone. Every count and week-over-week change uses it.
- **Triage window** = from that Monday up to the moment of the run. Every item in it is triaged for risk; an item after Sunday is labelled "this week, not in counts" and is never dropped from triage.

## File names (all in `social/listening/`, coworker scope; `brands/<brand-slug>/` prefix when there is no coworker)

`<D>` = the counting week's Monday, `YYYY-MM-DD` — never the run date.

| File | What | Saved how |
|---|---|---|
| `<D>-report.md` | the weekly report (one predictable path; readers take the newest `*-report.md`) | save-to-brain, `keep-history`, tags `listen-social`, `listening-report` |
| `<D>-items.jsonl` | every collected item | `file_write` only (`import: no`) |
| `<D>-replies.md` | the reply-draft queue | `file_write` only (`import: no`) |
| `watchlist.md` | the versioned query set | save-to-brain, `supersede` |

Readers judge freshness by line 2 of the report (`Run:` and `Trends read: … · valid to: …`), not by the file name.

## Baseline

The baseline is the newest `*-report.md` and `*-items.jsonl` dated **before** `<D>` — normally the prior week's.
- If it is older (weeks were skipped): header `Compared against: <date> (not the prior week)`, no week-over-week change, "n/a" for last week's theme counts.
- No earlier file: `Compared against: baseline week`.
- Carry forward every open item from the baseline, whatever its age.

## Re-run in the same counting week

If `<D>-items.jsonl` already exists (for example the weekly run fired on Monday and someone asks again on Wednesday):
- Read it and merge: keep its `in_counts` flags and open items, add new items, recount from the merged set.
- Merge `<D>-replies.md`: keep earlier R-ids, add new drafts.
- Update `<D>-report.md` in place: line 2's `Run:` becomes `Run: <first>; <this run>`, `Triage covered up to:` becomes this run's time; the header shape never changes.
- Never overwrite a file with only the new items.

## De-duplication and `in_counts`

- `in_counts: true` = counted in that file's week. The next run drops those items as duplicates.
- `in_counts: false` items from the baseline are counted now only if dated inside this counting week.
- Carried-forward open items dated before `<D>` are written `in_counts: false` and listed under "open from earlier weeks"; one dated inside this week is counted now (`in_counts: true`) and shown in S1–S3.

## Open items

Every item with a severity has `status: open` until the human closes it. Each run copies still-open items into its items file (original date), re-reads them (views, separate posters, new stitches) and keeps them in Act now as "open since <date>". In a free-only run, an item whose re-read would spend is marked "not re-read (free-only run)".

## Items file fields

`id`, `link`, `platform`, `date`, `author`, `reach`, `engagement`, `excerpt`, `query`, `class`, `route`, `in_counts`, `severity` (if any), `status` (open | closed, for items with a severity). Read before write — `file_write` replaces the file.

## How far each search pages

Use the narrowest recency option that still reaches `<D>` (a run more than 6 days after it needs the month option; keys in `../../../../atoms/spend-gate/proxy-endpoints.md`).
- **Date-sorted** (TikTok keyword search sorted by date, Reddit sorted new): page until the oldest item is older than `<D>` or the row's cap is hit.
- **Recency-filtered, relevance order** (Instagram reels search, YouTube search, LinkedIn post search, Threads search with dates): page until results run out or the cap; count only in-window items.
- **No recency filter** (X search, TikTok hashtag search, Instagram general search, Pinterest, Facebook videos): a relevance sample; count only in-window items and say so in the coverage table.
- A row stopped by its cap, or early because a page was under 50% on-target, before results ran out or `<D>` was reached, is a floor: `≥n (cap hit: Q<n>)` or `≥n (stopped: Q<n>)`, and no week-over-week change for it.
