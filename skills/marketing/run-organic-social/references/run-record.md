# Run memory for the social calendar

The calendar is a repeat job, so every full plan and every refill runs the `run-memory` skill (`../../run-memory/SKILL.md`): its **Start** steps before step 1 (refills: step 7), and its **End** steps after the final report. This file says what this playbook passes to that atom and what a social run record holds. The atom's rules win wherever this file is silent.

**Not for one-offs.** A single post or script, and a one-off account teardown, write no run record.

## Inputs to run-memory

| Input | Value |
|---|---|
| `playbook` | `run-organic-social` |
| `job` | `social calendar` (the full plan and every refill use the same job, so the next run finds it) |
| `subject` | none. One record covers every platform in the plan. |
| `cadence` | `weekly` (run-memory has no two-week value yet). **For this job, "old" means over 6 weeks**, three missed refills, not 3 weeks. |
| `outcome_sources` | the calendars' per-slot reconciliation (posted, edited, skipped); `brand_read` `organic` own posts (TikTok/IG, free, about the last week only); `social_analytics_get` (managed accounts); `social_post_list` (managed drafts marked posted); the X profile and posts read and other own-post proxy reads (paid, inside a ceiling); numbers the marketer pastes; signups from tracked links, where the marketer or analyze-performance's latest report gives them |

## Start: "since last time" for social

After run-memory's steps 1–3 (find the record, read what happened since, check each recommendation), write 3–5 lines that say, per platform:
- **What went out:** posted as drafted, edited or skipped, out of the posts due.
- **How each format did** against that format's frozen baseline: "On X, the 4 screenshot posts got a median of 2,100 views against your usual 900; the 2 videos got 600."
- **Each format test's verdict** in plain words.
- **Whether last time's recommendations were done,** with what changed: the bio, the pinned post, the reply routine, Premium, a new series.
- **What we couldn't read,** in one line, if a platform went unscored.

These lines lead the report's "Since last time" section (references/report-shape.md). Only the single most important one goes in "In short" and in the chat.

## What gets scored this run

- **The posts due:** every calendar slot dated before today that no earlier run reconciled, from any calendar (calendars overlap: a refill adds two weeks while the last one's second week is still running), plus every `too new` or `not read` row in the last record.
- **Settled age:** a post is scored once it is at least 3 days old. That's our rule of thumb, not a platform fact: most reach comes in the first days, and the free TikTok/IG read only covers about a week, so a later read would miss the post entirely.
  - Posts younger than 3 days are `too new`.
  - Posts no source can see (outside the free week, no ceiling for a paid read, nothing pasted) are `not read`.
  - Both carry to the next run. A post still `not read` after two runs is dropped from scoring and counted in "What we couldn't check".
- **Label every number** `claimed` (platform-reported), with its source and the post's age when read.

## Baselines are frozen numbers, not a recipe to re-pull

The free sources can't re-read a 30-day window later (a week of TikTok/IG; X returns popular posts with no date range; LinkedIn person feeds are patchy). So:
- **The first run freezes a baseline** per platform × format from the audit: the median of the metric over the account's posts in the 30 days before the calendar, each at least 3 days old. Record it with the account (platform plus whose account: "the brand's Instagram", "the founder's X"), the metric, the post count, the source, the date read and its label.
- **The metric** is whatever the source gives, named: views; or likes plus replies plus reposts where views aren't returned; saves and shares on Instagram where available.
- **Later runs compare against the frozen baseline** and never re-pull it. A baseline is replaced only when a fuller read exists: the managed account's analytics, or a paid own-post read inside a ceiling. Replace it at most once every 90 days, with old → new in Decisions.
- **Fewer than 5 posts in a format:** that format has no baseline yet. Its first 5 scored posts become it.
- **Set apart** giveaways, collaborations, paid boosts and one-off virals, as platform-research does.

## Format tests carry until they have a verdict

- **Each test is a recommendation row** with run-memory's id (`<YYYYMMDD>-<n>`, kept for life). The calendar header writes it beside the test (`T1 (20261019-2)`), so the calendar and the record point at the same test. Owner `agent`.
- **Review-by is a date:** the first refill after the test's last post is 3 days old. Before that, the test is `too early (not yet posted)`. It carries forward **without** being placed again, because its slots are already in a calendar.
- **Judge the two sides against each other** on one metric: the median of side A's scored posts against side B's. Every side needs at least 4 scored posts for a verdict (2–3 a side: `too early`, with the direction noted as "a first look"). The format baselines are context, not the test. New account or no baseline: call it only on a gap of more than 2×.
- **Verdicts are run-memory's, everywhere** (calendar, record, report): `worked` (the hypothesis side won), `didn't work`, `too early` (fewer than 4 scored posts a side; give the date it becomes readable), `can't tell` (something else changed: a viral outlier, a skipped side, a format changed mid-test; say which).
- **A test with no verdict carries forward with its first id.** If its sides are short because posts were skipped or `not read`, the next calendar places only the missing posts, ahead of any new test. A calendar holds at most 2 tests.
- **Still no verdict two refills after its review-by:** ask the marketer once to keep or drop it (run-memory's `asked on` rule). Never quietly retire it.
- **A result becomes a learning** only when the marketer agrees it is a rule (save-learning). A `worked` or `didn't work` readout may be saved as a numbers-only readout (run-memory §7), but never from a scheduled run: mark its outcome row `readout pending`, and the next run with the marketer present saves it.

## The record's Numbers section

Keep the whole record under 1,500 words (run-memory). The calendar files hold what was posted, edited or skipped; link them, don't copy them.

1. **Baselines** (once per platform × format; the rows below refer to them): account · format · metric · median · posts · source · read on · label.
2. **Per-post scorecard:** posts scored this run, in posting order, at most 15 rows plus one "all others" row. Columns: day · platform · format · test (id and side, or —) · metric · vs baseline (×) · verdict (`above`, `in line`, `below`, `too new`, `not read`). Day and format only, never the post's words, so no private name gets in.
3. **Per-format scorecard:** one row per platform × format: posts scored · median · baseline · change · what we'll do (more, keep, less, too few).
4. **Also:** follows gained per account (from the profile reads), and signups or clicks from the tracked links where known, each with its window, source and label. Skipped posts as a count per platform, with the calendar link.

## The record's Recommendations

Besides the format tests, record each move the plan asked someone to make:
- the bio and pinned-post rewrites (owner marketer; done when a profile read shows them);
- the daily reply routine (owner marketer; `judgement call` unless they report it);
- Premium (owner marketer; done when the profile shows it);
- a new series (owner agent; done when its first posts went out).

Each has a review-by date and how we'll know, pointing at a Baselines row rather than repeating it. Count the reply targets; never list them.

## Scheduled refills (no human present)

The worker runs from the method copy and prompt in references/scheduled-refill.md. Follow run-memory's scheduled-run rules:
- Reconcile from the sources above only, and don't ask. A post no source shows is `not read`, and one question goes into "Decisions for you".
- **X and LinkedIn need paid reads.** With no standing per-run ceiling in the automation's yes, they go unscored: their posts are `not read`, and profile checks (bio, Premium) are `unknown`. Step 8's offer says this before the yes.
- No readout is saved, and there is no "saved" line in chat unless the save failed.
- Still write the record. A refill that stops early writes `Not run: <why>` and carries every test and recommendation forward unchanged.
