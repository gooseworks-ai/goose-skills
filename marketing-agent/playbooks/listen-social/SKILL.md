---
name: listen-social
description: >-
  Use when a founder or marketer asks "what are people saying about me and my category this week?", "who's talking about us", "any mentions this week", "what are people saying about <competitor>" (what people say, not what they run), "is a complaint blowing up", "something's brewing on TikTok / Reddit", "what's trending in my category", "draft replies to these comments", or wants the weekly listening pass. Delivers a weekly report — what to act on first, mentions with links and counts, comment themes in customers' words, outliers saved, trends with a post-by date, risks triaged — each finding ending in what it means for you ("people complain about X — post Y"), plus a reply-draft queue. Listens first with free search and public pages and asks only decisions at the end; paid reads only on one yes. Never posts, replies or contacts anyone. Not for writing posts on a trend — use run-organic-social; not for what rivals run — use research-competitors.
---

# listen-social

The listening half of organic social, and the place crisis replies are drafted. Runs on ask, or weekly once the human opts in. The craft is in `references/`; this file is the order of work.

**The rule that matters most: free pass first, ask nothing, report once** (AGENTS §8 research pattern). Before the first message to the founder: build the watchlist yourself, search the news and the web, read public posts and comments, and write the report. The draft watchlist, the paid top-up and the weekly run are decisions in the closing message — never questions up front. The one interruption allowed is an S1 risk, posted in chat the moment it is found.

## Before you start

1. **Connection and brand.** No GooseWorks tools listed (after one `gooseworks:tools_load`) → say only: "Connect GooseWorks first — I listen to social and save what I find through it." First call of the conversation: `gooseworks:get_started` with the marketer's words (`wants: "more"`); send `client` on every call that takes it. Pick the brand (list and ask if several); keep `brand_id`, `brand_slug`, `coworker_agent_id` (scope and fallback: `../../atoms/save-to-brain/ATOM.md`).
2. **Read the brain.** `gooseworks:brand_read` (`summary`, `kit`, `products`, `accounts`, `competitors`, `organic`, `learnings`) — `organic` gives own and rivals' recent posts (note `last_synced_at`); `gooseworks:social_account_list` / `social_analytics_get` for managed accounts; `gooseworks:competitor_read` (the 3 most relevant rivals are the deep ones); `gooseworks:automation_list` (an existing weekly run: show its recent runs at the top); `gooseworks:knowledge_search` for operating rules (crisis escalation, refunds, disclosure). Claims and voice: the read step of `../../atoms/claims-gate/ATOM.md` once; every `dont` and `must` applies. Workspace: `social/listening/watchlist.md`, the baseline per `atoms/listening-window/ATOM.md`, `research/market/voc-bank.md` (buyer words), `research/competitors/` (rival records), `research/credits-log/`.
3. **Do not message the founder yet.** Platforms, terms, exclusions and the timezone come from the brain and the free pass; what only the founder knows (an escalation contact, places this playbook can't reach) is asked in step 10.

## Steps

1. **Draft the watchlist.** Load `references/queries-and-coverage.md`. Name forms and misspellings, handle without the @, domain, products, founder and execs, hashtags, rivals, category and problem terms in buyers' words. **Search the bare name first to see what else it means** and write the exclusions (a common-word name like "Personal Day" mostly finds days off work); scope the bare name to the category's own communities. First run: `v1 (draft)` (title `Listening watchlist — <Brand> — <run date>`), run as is and confirmed in the closing message; later runs propose adds and drops by measured precision. Save it (`supersede`).

2. **News first.** Web-search the triage window and the month before for the brand, its products, its founder and the category: press, recalls, regulatory action, viral posts, a rival's launch or exit. Anything risky goes straight to step 4.

3. **Listen — the free pass.** For each query and platform: web search with recency (`site:reddit.com`, `site:tiktok.com`, `site:instagram.com`, `site:youtube.com`, `site:x.com`, `site:linkedin.com/posts`, news), then public pages read in the host browser — Reddit search sorted by new and the category's subreddits, TikTok and Instagram tag and search pages, YouTube search filtered by upload date, X where it shows without a login — and the comments on the top posts. Free server reads too: `organic`, `gooseworks:social_inspiration_search` (`source: "research"`), managed-account metrics. One worker per platform group where the host has subagents. Apply `atoms/listening-window/ATOM.md` (the counting week, the triage window, de-duplication, open items) and label every count **free-pass sample**. Drop off-target hits; tag owned, affiliated and undated items (`references/classify-and-route.md`); only the platforms' own public pages, never unofficial mirrors or archives. Platforms the free pass couldn't read go on the coverage table with what a paid read would add. Never pause for paid reads — they are offered in step 10. *Writes:* `social/listening/<D>-items.jsonl`.

4. **Classify and route — risk first.** `references/classify-and-route.md`, `references/crisis-triage.md`. Pull out every safety, health, legal, claims or misinformation item and triage it now (S1 / S2 / S3); **post any S1 and fast-moving S2 in chat at once**, with the escalation contact or "no escalation contact on record — decide who handles this now" and, for S1, the cross-channel hold list — an alert, the one thing allowed before the report. Then every item gets a class and one route. Counts with n; no percentages under ~30 items.

5. **Comment themes.** On the brand's and rivals' top posts: recurring praise, complaints and questions, with n, direction versus the baseline, two verbatim quotes with links. Buyer quotes worth keeping are tagged `VoC` for research-market.

6. **Outliers and trends.** `references/outliers-and-trends.md`. Outliers (views ≥ 3× the author's usual, from what the public pages show; never posts by apparent minors) saved with `gooseworks:social_inspiration_save` and a one-line why. Trends with first seen, evidence, stage, fit, audio rights ("unverified" unless shown), risk, a post-by date and confidence.

7. **Draft replies.** `references/reply-drafting.md`: one finished draft per item routed reply or take private, each with a recommendation (reply / take private / stay silent) and why. Holding statements and promo silence follow `crisis-triage.md`. Nothing is posted.

8. **For you, and You vs them.** Every finding closes with **For you** — does it fit us, and why, from our facts; if yes, what to make or do ("people complain about X → post Y", "reply to these 3 threads", "brief a creator on this format"), the approved claim behind it (or "needs your sign-off", or "you'd need proof of X first"), and who acts. **You vs them**: the conversation about us versus each deep rival — volume (same method only), what people praise and complain about, where everyone sounds the same. What people say outweighs what rivals post. Shapes in `references/report-format.md`.

9. **Deliver the report and the queue.** `references/report-format.md` (short form under ~20 items). Open every Act-now link and five others where the browser can. Write `social/listening/<D>-report.md`; in a host with files, also write it locally and offer to open it; in a hosted chat, an artifact or document if the host can, else the full report in chat. Save the report through `../../atoms/save-to-brain/ATOM.md` (`keep-history`, title `Listening report — <Brand> — <D>`, tags `listen-social`, `listening-report`); `<D>-replies.md` (drafts in order S1, S2, then by reach) and the items file are workspace-only.

10. **One message: the draft and the decisions.** Three lines — what matters this week (and, if most platforms couldn't be read, that plainly), the top "For you", the link — then only what is left to decide: which replies to send (the human sends); the draft watchlist (confirm, add, drop — say what the bare name was confused with); an escalation contact, if none is on record; a paid top-up for what the free pass couldn't count — name the gaps (full counts, more comments, platforms behind logins), one yes to "up to N credits" (`../../atoms/spend-gate/ATOM.md` branch B, the probe inside it, a crisis reserve inside the same ceiling); the weekly run (`references/report-format.md` § Standing run, created paused); keeping rules from recurring themes (`../../atoms/save-learning/ATOM.md`, on the founder's words, prefixed `[listening YYYY-MM-DD]`). Never ask a fact the free pass could find.

## Approval gates

- **Every reply stops at the human.** Never post, reply, comment, like, DM, hide, delete, report or contact anyone. Research recommends; it never makes the asset.
- **Spend:** the free pass needs no yes; paid reads only inside a ceiling the human said yes to; a scheduled run only within a standing per-run ceiling named in the yes.
- **Weekly run:** created paused, on only on a yes. **The hold list** is a recommendation — the human pauses. **UGC** is a rights request, not permission. **Learnings** only on the human's words.

## Output and write-back

| Artifact | Where it lives | Who reads it next |
|---|---|---|
| Listening report | `social/listening/<D>-report.md` (`<D>` = the counting week's Monday) + document (keep-history); header lines fixed | the human; analyze-performance (mention, sentiment, share-of-voice lines); run-organic-social (trends); research-market (`VoC` quotes) |
| Watchlist | `social/listening/watchlist.md` + document (supersede) | this playbook |
| Items | `social/listening/<D>-items.jsonl` (workspace only) | next week's de-duplication |
| Reply queue | `social/listening/<D>-replies.md` (workspace only) + chat | the human, who sends |
| Saved outliers | inspiration library (tag `listen-social`) | make-static-ads, make-video-ads, make-content, work-with-creators, run-organic-social |
| Rules | `[listening …]` learnings on the human's words | ad and content generation |

## Done when

- No question before the report; the watchlist was drafted with name-collision exclusions; news ran first; web search and public pages were read for every default platform of the company type, with a coverage table and couldn't-read gaps.
- The report opens with "Do this first, because…", every finding ends with "For you", it has "You vs them", counts are labelled free-pass sample (or paid, with n), quiet weeks get the short form; it arrived as a document and was saved.
- Anything risky in the triage window was triaged; an S1 went to chat at once with the hold list; every item has a route; every reply-worthy item has a finished draft; nothing was posted.
- The closing message held only decisions.

## Out of scope

Posting and scheduling (the human; run-organic-social) · posts on a trend (run-organic-social) · deep review mining and personas (research-market) · what rivals run (research-competitors) · own post performance (analyze-performance) · always-on spike alerts (watch-and-alert, backlog).
