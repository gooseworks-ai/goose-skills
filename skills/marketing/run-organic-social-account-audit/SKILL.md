---
name: run-organic-social-account-audit
description: >-
  Reviews a brand's own social accounts: what each is for, the last ~30 posts ranked against the
  account's own median with the likely reason for top and bottom posts, cadence actually kept, best
  posting times, and bio and pinned-post fixes. Use alone when you already know which accounts to
  review and can read their posts; otherwise run run-organic-social.
version: 0.1.0
---

# Account audit

Run before the first calendar, and lightly (reconciliation only) on later runs.

## 1. Which accounts exist and what each is for
- `gooseworks:brand_read` `sections: ["accounts","sources","organic"]`. `organic.own_accounts` lists the brand's own TikTok/IG handles. `sources` lists saved public sources, including `relationship: self` social accounts. `accounts` lists connected accounts.
- `gooseworks:social_account_list`: the TikTok/IG accounts the product manages, with their setup status. Read each with `gooseworks:social_strategy_get` (pillars, voice, rules, plug-ratio cap).
- The brain has no record of LinkedIn, X, Threads, YouTube, Pinterest or Facebook accounts today, so check `social/accounts.md` in the workspace for a previous run's answers. Ask only for what is still missing: handles, which ones matter, brand vs founder, who approves founder posts, the time zone, the tool they post from, their free windows for the first hour after posting.

## 2. What has worked (per account)
- **TikTok/IG:** `own_posts` from `brand_read organic` give caption, `posted_at`, views, likes and comments. `gooseworks:social_analytics_get` adds more for managed, connected accounts (it says `not_available` otherwise).
- **More history, or LinkedIn, X and Threads:** read the account's own posts through the proxy (the `marketing-data-access` skill (`../marketing-data-access/SKILL.md`); verified endpoints only, as listed in `../run-organic-social/references/voice-card.md`). Use the author's own posts only. For X: `/v1/twitter/profile`, then `/v1/twitter/user-tweets` (popular posts, not the newest: check `created_at`; the numbers are in `legacy`). This runs under the `spend-gate` skill (`../spend-gate/SKILL.md`) branch B: **one** yes to a ceiling, asked in the draft-report message (SKILL.md step 2), with the probe run inside it and every charge logged. Without the yes: the public profile in the host browser, or 5–10 pasted posts.
- **State the window you actually got** (e.g. "7 IG posts, Oct 5–12"). The server returns recent posts only, and some captions come back cut off mid-word: flag those.
- Rank by engagement relative to the account's own median, not absolute numbers. For the top and bottom posts (5 each with 15+ posts, 3 each below that), note the likely why: hook, format, topic, person featured, length, time.
- Note efficacy or other claims in past captions that are not signed off, so drafts don't copy them.
- **Cadence actually kept:** posts per week over the window you have (up to ~8 weeks). Say how long the window is.
- **Best posting slots:** day and hour (in the account's time zone; ask it if unknown, since the server gives UTC) of the top performers. With fewer than ~10 posts, use the account's **own** usual posting times as the starting guess (label it so), not generic charts.
- **Competitor and category references:** `gooseworks:social_inspiration_search`, then `brand_read organic.competitor_top_posts`. These are for formats and hooks only; never copy them. Skip any that are clearly outside the brand's category (a mis-resolved competitor).

## 3. Profile hygiene (text the human can paste)
- **Bio and pinned posts:** no tool returns these today, so read the public profile in the host browser; if it won't open, ask in the draft-report message. Then: does the bio say who it's for and why to follow, in the voice? If not, draft one rewrite within the platform limit (IG 150, TikTok 80, X 160, LinkedIn headline 220).
- **Link in bio / pinned posts:** do they point at the current priority? Suggest the swap.

## Output
```
Account audit — <brand> · <date>
| Account | Platform | Job | Cadence kept (8 wks) | Median engagement | Best slots | Voice card? |
Top 5 / bottom 5 per account, with the why
What to make more of / stop: …
Bio + pinned suggestions: …
Unknowns asked: …
```
Write it to `social/audit/<YYYY-MM-DD>.md`. Write the account roster (jobs, handles, time zone, posting tool, free windows) to `social/accounts.md`. Both use `gooseworks:file_write` in the brand coworker scope.
