---
name: listen-social
description: >-
  Use when a founder or marketer asks "what are people saying about me and my category this week?", "who's talking about us", "any mentions this week", "what are people saying about <competitor>" (what people say, not what they run), "is a complaint blowing up", "something's brewing on TikTok / Reddit", "what's trending in my category", "draft replies to these comments", or wants the weekly listening pass. Delivers a weekly report — what to act on first, mentions with links and week-over-week counts with sample sizes, comment themes in customers' words, every item routed, outlier posts saved with a one-line why, trends with a post-by date, risks triaged by severity — and a reply-draft queue with a recommendation on each. A short report on quiet weeks. Reads public social data within a credit cap you approve; never posts, replies or contacts anyone. Not for writing posts on a trend — use run-organic-social; not for what rivals run — use research-competitors.
---

# listen-social

The listening half of organic social, and the place crisis replies are drafted (pillar 11 has no playbook). Runs on ask, or weekly once the human opts in.

## What you get

1. **Weekly listening report** — opens with "Do this first, because…" and the **Act now** block (0–3 items), then a five-line so-what. Full form: coverage table, mentions by platform and class with change versus last week, notable items, comment themes with counts and verbatim quotes, the competitor conversation, outliers saved, trends (first seen, evidence, stage, fit, audio rights, risk, post-by date, confidence), items routed out, gaps and next week's plan. **Short form** when fewer than ~20 items were collected: header, Act now, so-what, coverage, the items themselves, and next week's plan — no empty sections.
2. **Reply-draft queue** — one finished draft per item worth answering, each with the item and link, a recommendation (reply / take private / stay silent) and why, the claims used, voice and banned-word check, disclosure (per the shared `disclosure.md`), and the escalation note on anything risky. Nothing is posted.
3. **Saved outliers** — overperforming category posts and rivals' winners, saved to the inspiration library with the outlier multiple and a one-line why (hook · format · topic).
4. **On an S1 risk:** a cross-channel hold list — the brand's paid ads, scheduled posts and promo emails that touch the product at risk — for the human to pause.

Formats and example drafts: `references/report-format.md`, `references/reply-drafting.md`.

## Before you start

1. **Connection.** No GooseWorks tools listed (after one `gooseworks:tools_load` for a missing group: brand, social, files, media, data, automation) → say only: "Connect GooseWorks first — I listen to social and save what I find through it." First GooseWorks call of the conversation: `gooseworks:get_started` with the marketer's words (`wants: "more"`), used only to settle setup and the brand. Send `client` on every call that takes it.
2. **Brand.** The brand named; with several and none named, list them and ask. Keep `brand_id`, `brand_slug`, `coworker_agent_id` (scope and no-coworker fallback: `../../atoms/save-to-brain/ATOM.md`; the weekly run needs a coworker).
3. **Read the brain first.**
   - `gooseworks:brand_read` sections `summary`, `kit`, `products`, `accounts`, `competitors`, `organic`, `learnings`. `organic` gives own accounts and posts (even with nothing managed in GooseWorks) and rivals' top posts — note `last_synced_at`. `gooseworks:social_account_list` / `social_analytics_get` add metrics for managed accounts.
   - Claims and voice: load `../../atoms/claims-gate/ATOM.md` once (a lean `brand_read` is enough). Replies state only what it allows; where learn-my-brand has not confirmed the voice, drafts are marked "voice not yet confirmed". Always apply every `dont` and `must`. Also `gooseworks:knowledge_search` for operating rules: crisis escalation, refund and returns policy, disclosure.
   - `gooseworks:automation_list`: if a weekly listening run exists, show its recent runs and credits at the top of this run.
   - `gooseworks:competitor_read` (roster with socials); the 3 most relevant tracked rivals are the "deep" ones.
   - Workspace (`gooseworks:file_list`, `file_read`): `social/listening/watchlist.md`, the baseline report and items per `atoms/listening-window/ATOM.md`, `research/market/voc-bank.md` (category language), `research/credits-log/` (prices).
4. **Ask only what is missing, in one message** (merged with the watchlist confirmation and, on a first run, the spend gate's probe yes): platforms that matter, competitor and category terms to add, the timezone for the weekly window, who gets woken up for a crisis (if not in the operating rules or watchlist), and anything they can paste from places this playbook cannot reach (Google, Yelp or App Store reviews, Discord, LinkedIn comments, the support inbox).

## Steps

1. **Confirm what to listen for.** Load `references/queries-and-coverage.md`. Build the watchlist — name forms and misspellings, handle without the @, domain, products, founder and execs, hashtags, competitors, category and problem terms, exclusions, and the bare name scoped to the category's communities — and show it with the coverage table. First run: the human confirms it, precision "–"; later runs propose adds and drops by measured precision. *Writes:* `social/listening/watchlist.md` (save-to-brain, `supersede`).

2. **Read free sources.** Own and rival posts (`organic`), managed-account metrics, the research runs' discovered posts (`gooseworks:social_inspiration_search` `source: "research"`), anything pasted. No paid tool runs in this step.

3. **Plan and approve the paid pull.** Through `../../atoms/spend-gate/ATOM.md` branch B, with paths and keys in `../../atoms/spend-gate/proxy-endpoints.md` and paging per `atoms/listening-window/ATOM.md`: brand and category searches per platform; `gooseworks:competitor_research` `mentions` for the deep rivals (priced like a proxy read); a crisis reserve of up to 3 calls; then comments on the top posts and author baselines for outlier candidates inside the same ceiling or a new yes. Untracked rivals: offer to track them (`gooseworks:competitor_save`, free) or search them as normal queries. Pre-revenue: one cheap brand-name check. Hosted chat: halve comment caps.

4. **Collect and clean.** Apply `atoms/listening-window/ATOM.md`: the counting week and the triage window, file names, baseline, re-run merge, de-duplication, carried-forward open items. Drop off-target hits and posts by the brand's own accounts and its founder or execs (owned: their comments can be mined; the posts are not mentions). *Writes:* `social/listening/<D>-items.jsonl`.

5. **Classify and route — risk first.** Load `references/classify-and-route.md` and `references/crisis-triage.md`. First pull out every safety, health, legal, claims or misinformation item and triage it now (step 9); post any S1 and fast-moving S2 in chat before continuing. Then every item gets a sentiment class and exactly one route (a risk item may also carry `support`). Counts with n; no percentages under ~30 items.

6. **Mine comment themes.** On the brand's and rivals' top posts: recurring praise, complaints and questions, each with n, direction versus the baseline, two verbatim quotes with links and a so-what. Buyer quotes worth keeping are tagged `VoC` for research-market.

7. **Spot outliers and save the keepers.** Load `references/outliers-and-trends.md`. Outlier = views ≥ 3× the author's median over their last 10–20 posts (≥ 5 posts of history, post ≥ 48 hours old); excludes the brand's own and founder's posts and negative or risk-routed posts about the brand. Save keepers with `gooseworks:social_inspiration_save` (note and tags per that reference), checking the library first. Never posts by apparent minors.

8. **Read the trends.** Per trend: first seen, evidence (dated sample posts; use versus the baseline, or "no prior snapshot"), stage, fit, brand-safety and origin, audio rights ("unverified" unless the pull flagged commercial use), effort versus time left, a post-by date, confidence. Skips get a reason. Time left is an estimate, never a fact.

9. **Triage risk.** S1 / S2 / S3 by `references/crisis-triage.md`. An S1 stops the pass and goes first in chat, with the escalation contact (operating rules, else the watchlist) or "no escalation contact on record — decide now", and the cross-channel hold list. Use the crisis reserve to count separate posters. A weekly pass catches crises late — say so.

10. **Draft replies.** Load `references/reply-drafting.md`. One finished draft per item routed reply or take private. A brand-wide holding statement is recommended only when 3+ separate people raise it, press has picked it up, or contamination, a recall or legal action is confirmed by the brand, a regulator or the press; any single-poster item, even an S1, gets an on-post reply, a private draft and escalation, with the statement held and its trigger named. While an S1 or S2 about a product is open, sales, poaching and promo replies touching it stay silent. Regulated categories never diagnose, suggest a cause or promise results; third-party communities need a disclosure and a rules check (unchecked → stay silent).

11. **Check links, write the report, save.** With a browser, open every Act-now link and five others; otherwise mark links "as returned, unchecked". Load `references/report-format.md`; use the short form under ~20 items. Save `social/listening/<D>-report.md` through `../../atoms/save-to-brain/ATOM.md` (`keep-history`, tags `listen-social`, `listening-report`); `<D>-replies.md` and the items file are workspace-only (`import: no`). Hand over: "Do this first, because…", Act now, the so-what, the queue. Learnings through `../../atoms/save-learning/ATOM.md`: offer rules drawn from recurring themes (each one idea, prefixed `[listening YYYY-MM-DD]`), written only on the human's yes in their words, retiring, in the same call, the earlier `[listening …]` facts each new rule replaces or contradicts.

12. **Offer the weekly run.** One question: run this every week? Explain the two options in `references/report-format.md` § Standing run (free sources only, or paid reads up to a standing per-run ceiling the human names). Under `../../atoms/spend-gate/ATOM.md` branch C the automation is created paused, switched on only on the human's yes, and its own run cost is shown after the first run. Always-on spike alerts are watch-and-alert's (backlog).

## Approval gates

- **Every reply stops at the human.** Never post, reply, comment, like, DM, hide, delete, report or contact anyone — poster, press or platform. Each draft carries a recommendation, not a question; crisis items carry the escalation note.
- **Spend:** paid reads only inside a ceiling the human said yes to; a scheduled run spends only within a standing per-run ceiling named in the yes.
- **Weekly run:** created paused, on only on a yes.
- **The hold list is a recommendation** — the human pauses ads, posts and emails; this playbook pauses nothing.
- **UGC is a rights request, not permission** — never reuse a creator's post without written permission.
- **Trend posts and founder-voice replies** are human calls. **Learnings** only on the human's yes, in their words.

## Output and write-back

| Artifact | Where it lives | How readers find it | Who reads it next |
|---|---|---|---|
| Listening report | `social/listening/<D>-report.md` (`<D>` = the counting week's Monday) + document "Listening report — <Brand> — <D>" (keep-history) | the newest `*-report.md` in `social/listening/`; freshness = the `Run:` date on line 2; header lines fixed | the human; analyze-performance (mention, sentiment, share-of-voice lines); run-organic-social (trend table with first seen and post-by); research-market (`VoC` quotes) |
| Watchlist | `social/listening/watchlist.md` + document (supersede) | the path | this playbook |
| Items | `social/listening/<D>-items.jsonl` (workspace only) | the path | next week's de-duplication; same-week re-runs |
| Reply queue | `social/listening/<D>-replies.md` (workspace only) + chat | the path | the human, who sends |
| Saved outliers | inspiration library (`social_inspiration_save`, tag `listen-social`) | `social_inspiration_library` / `social_inspiration_search` | make-static-ads, make-video-ads, make-content, work-with-creators, run-organic-social |
| Learnings | `[listening …]` learnings on the human's yes, one idea each | `brand_read` learnings | ad and content generation |

## Done when

- The report opens with "Do this first, because…", catches every conversation the operator knew of on covered surfaces plus at least one they did not; Act-now links and a sample of five open, or are marked unchecked.
- Anything risky posted up to the run was triaged, even outside the counting week; an S1 came with the hold list.
- Uncovered surfaces are named; week-over-week numbers carry n (or "baseline week", or "not the prior week" with no change after skipped weeks); open risks are carried forward.
- Every item has a route; every reply-worthy item has a finished draft; nothing was posted.
- Outliers are saved with their why; quiet weeks got the short form, not padding.
- Credits within the approved ceiling.

## Out of scope

- Posting, replying, DMs, scheduling — the human sends; automated posting is run-organic-social's parked part.
- Calendars and post drafts, including posts on a trend — run-organic-social.
- Deep review mining and personas — research-market.
- What rivals themselves run — research-competitors.
- The brand's own post performance — analyze-performance.
- Always-on spike alerts — watch-and-alert (backlog). Review-site replies (Google, Yelp, App Store, Amazon) — not covered yet (pending decision on a reviews surface).
