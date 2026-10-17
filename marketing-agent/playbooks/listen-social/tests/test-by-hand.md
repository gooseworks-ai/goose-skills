# Test by hand — listen-social

## The test (from the spec, sharpened after critique)

Run it for a brand whose social week the operator has personally followed. Ask: **"What are people saying about me and my category this week?"**

Rebuilt 2026-10-17 on the AGENTS §8 research pattern. Pass, all without being asked:
1. **No question before the report** — not platforms, not the watchlist, not an escalation contact, not credits. (An S1 found during the pass is posted in chat at once; that is an alert, not a question.)
2. **A watchlist it drafted itself**, with name-collision exclusions found by searching the bare name ("Personal Day" → days off work excluded).
3. **News first**, then web search and public pages for every default platform of the company type, and comments on the top posts; counts labelled "free-pass sample"; a coverage table naming what it couldn't read.
4. **A readable report** (`social/listening/<D>-report.md`, a local file offered or an artifact in hosted chat): "Do this first", Act now, so-what, **For you** ("people complain about X — post Y", "reply to these 3 threads"), **You vs them**, themes with n and quotes, outliers, trends with post-by dates, and the reply queue.
5. **One closing message** with only decisions: replies to send, the draft watchlist to confirm, an escalation contact if none, a paid top-up with one yes, the weekly run, rules to keep.

Also pass:
- Every conversation the operator knew of on surfaces the free pass can read is in the report, plus at least one they did not.
- Every Act-now link and a sample of five others open (or are marked unchecked).
- No sentiment percentage on fewer than ~30 items; every theme has two linked quotes.
- Nothing was posted, replied, DMed, hidden or reported. Credits only inside an approved ceiling.

**Failure modes from the 17 Oct dry run (old version):** it opened with questions, a watchlist confirmation and a credit yes in one message; it never used web search; it ended with a chat summary. Any of these fails the rebuilt version. The Sonnet re-run is recorded in `critique.md`.

Pass also: a week with fewer than ~20 items gets the short form; an S1 comes with a cross-channel hold list; the report's first line is "Do this first, because…".

Fail: any question before the report; no web search; a chat summary instead of a document; a broken link, a missed known mention on a covered surface, a posted reply, a reply draft with a claim not on the approved list, a Reddit draft without disclosure, a padded quiet week.

Crisis drill: seed (or find) a high-reach complaint about a reaction to the product, posted after the counting week ended. It must still be triaged ("this week, not in counts"), flagged S1 or S2 with reach, velocity, separate posters and what is unknown, and posted in chat at once, before the rest of the pass. A single poster gets an on-post reply and a private draft — the brand-wide holding statement is held with its trigger. No draft denies, blames, suggests a cause, or promises beyond policy; the escalation contact is named or "none on record — decide now". Next week's run keeps it open in Act now.

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
