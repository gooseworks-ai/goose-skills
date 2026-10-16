# Test by hand — listen-social

## The test (from the spec, sharpened after critique)

Run it for a brand whose social week the operator has personally followed. Ask: **"What are people saying about me and my category this week?"**

You should see, in order:
1. The watchlist played back — brand name forms, handle, products, founder, hashtags, competitors, category terms, exclusions, platforms — asking only what the brand record does not answer (always: who to wake for a crisis, if not on record).
2. A pull plan and a credit total to say yes to (first run: one yes for a single probe call, price unknown until it returns, its results kept; then the stage A total, and later a stage B total). Nothing paid before the yes.
3. If anything is S1, it comes first in the reply, before the report.
4. The report: coverage table, Act now, so-what, mentions with deltas (or "baseline week"), themes with n and quotes, outliers saved, trends with evidence and post-by dates, routed-out items, gaps and next week's plan.
5. The reply queue: finished drafts, each with a recommendation (reply / take private / stay silent) and a reason; for anything crisis-shaped, an on-post reply and private draft, with a brand-wide holding statement only when 3 or more separate people, press, or a confirmed contamination, recall or legal action make it necessary.
6. One question: run this weekly? (free-only, or paid pulls up to a standing weekly credit total; its own run cost shown after week one)

Pass:
- Every conversation the operator knew of on covered surfaces is in the report, plus at least one real one they did not.
- Every Act-now link and a sample of five others open (or are marked unchecked where no browser exists).
- Uncovered surfaces are named in the coverage table.
- No sentiment percentage on fewer than ~30 items; every theme has two linked quotes.
- Outliers in the inspiration library carry the multiple and the hook · format · topic line.
- Nothing was posted, replied, DMed, hidden or reported. Credits ≤ approved.

Pass also: a week with fewer than ~20 items gets the short form; an S1 comes with a cross-channel hold list; the report's first line is "Do this first, because…".

Fail: a broken link, a missed known mention on a covered surface, a posted reply, a reply draft with a claim not on the approved list, a Reddit draft without disclosure, a padded quiet week.

Crisis drill: seed (or find) a high-reach complaint about a reaction to the product, posted after the counting week ended. It must still be triaged ("this week, not in counts"), flagged S1 or S2 with reach, velocity, separate posters and what is unknown, and posted in chat before the rest of the pass. A single poster gets an on-post reply and a private draft — the brand-wide holding statement is held with its trigger. No draft denies, blames, suggests a cause, or promises beyond policy; the escalation contact is named or "none on record — decide now". Next week's run keeps it open in Act now.

Date-convention drill (run on Friday 2026-10-16, then let the weekly run fire): Friday writes `social/listening/2026-10-05-report.md`, `2026-10-05-items.jsonl`, `2026-10-05-replies.md` (counting week Oct 5–11) and marks the morning's crisis "this week, not in counts". Monday 10-19 writes the `2026-10-12` files against the Oct 5 baseline, counts that item and keeps it open. A chat run on Wednesday 10-21 finds `2026-10-12-items.jsonl` and merges (counts unchanged for items already there, `Run:` shows both runs). Skip a week: pause the 10-26 run; the 11-02 run counts Oct 26–Nov 1, finds no 2026-10-19 files, writes `Compared against: 2026-10-12 (not the prior week)`, shows no Δ and n/a theme counts, and still carries the open S1 forward.

## Staging run — 2026-10-16 (GooseWorks staging, brand "Personal Day")

Ran every free step up to the first paid call. Nothing paid was called.

| Step | Call | What came back |
|---|---|---|
| Brain | `brand_read` sections summary, accounts, competitors, learnings, sources | Own handles known from research: IG @personalday, TikTok @personaldayskin (in `organic.own_accounts`); founder Lili Reinhart named in the description. No operating rules / escalation contact found. |
| Own and rival posts | `brand_read` section `organic` | 12 own posts with views/likes/comments (e.g. IG "don't take it personally, we're taking a personal day" 69,118 views; TikTok hypochlorous spray 3,290 views) and 10 rival top posts (The Ordinary, Paula's Choice) — free inputs for steps 2, 6, 7. |
| Managed accounts | `social_account_list` | None (`total: 0`) → `social_analytics_get` has nothing to read; own-post numbers come from `organic` instead. |
| Saved inspiration | `social_inspiration_search` (source all, "acne") | Empty — the library starts with this playbook's saves. |
| Watchlist / last report | `file_list` coworker workspace | None — first run is a baseline week. |
| Automations | `automation_list` | None. |

Observation that shaped the watchlist reference: "Personal Day" is two common words ("personal day off", "mental health day"); bare queries would be mostly noise, so Q1 pairs it with a category word plus exclusions, and the handle without the @ is its own query.

**First paid step (not run):** `competitor_research` `mentions` for the 5 tracked rivals (TikTok, Instagram) and ScrapeCreators searches for Q1–Q3 on TikTok, Instagram and Reddit (paged to the counting Monday, at most 3 pages each), then comments on the top 5 own and rival posts. No price on record → the run would ask one yes for a single probe (one brand search), keep its results, show its real charge, then ask for the stage A total; comments come later as stage B.
