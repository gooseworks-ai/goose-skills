---
name: platform-research
description: Hidden step of run-organic-social. Before any planning, researches how each platform works right now (dated web sources), what is getting watched in the brand's niche there (examples with links), and the brand's and person's own accounts. Loaded by run-organic-social; never listed.
---
# platform-research

Run this before planning or writing anything. Never plan a platform from memory. Platforms change their ranking, formats and what they push every few months, and the marketer will know if the plan is stale (e.g. "X is giving more reach to video now").

Do everything below for **each platform in scope**: the ones the marketer named, or the 2–3 recommended for them. Do it free first and ask nothing. The free pass ends in the draft report; paid reads only deepen it, after one credit yes.

## 1. How the platform works right now (free, web search)

Run web searches dated to the **last 6 months** (put the current month and year in the query):
- `<platform> algorithm <month> <year>`
- `<platform> reach video vs text <year>`
- `<platform> what's working <niche> <year>`
- `<platform> premium / verified reach replies <year>` (e.g. X Premium: its effect on reply ranking, reach and video length)
- the platform's own announcements, e.g. `<platform> creator update`, `<platform> engineering blog ranking`

Prefer, in order:
1. the platform's own posts, help pages and executives' statements;
2. reporting on them (tech press, creator-economy newsletters);
3. large-sample studies, with the sample size and dates named.

**Source quality:** a tool vendor's "how the algorithm works" page is never the only source for a fact, because many carry made-up weights. Each platform card has at least one source that is the platform's own statement or a study that states its sample. **Keep share and per-post apart:** "video is half of all impressions" is a share of activity; whether one video reaches more people than one text post for an account this size needs per-post data. Label which kind each fact is.

**For reply-led plans, also research:** what the platform says paid verification (e.g. X Premium) does for replies and reach, sized data on it, and today's price and tiers. For links, X's own statement next to the independent data.

Open the pages (host browser or fetch) and read them. Never rely on a headline.

Write a **"How <platform> works now" card** for each platform:

| Line | What it says |
|---|---|
| What gets reach today | Ranking signals; video vs text vs images; links; replies; watch time; following vs for-you feeds |
| Formats rising, formats fading | With the source and date |
| What small or new accounts can do | How a 0–1k account gets seen there now: replies, communities, search, trends, collabs |
| Recent changes | Each change dated, with its link |
| Confidence | "confirmed by the platform", "widely reported" or "one source", in words |

If the research contradicts references/platform-native.md, the research wins. Say so in the report.

## 2. What is working in this niche on this platform

Find the accounts and posts that the brand's buyers actually watch on this platform.

**Free pass — use the routes that actually work per platform:**

| Platform | Free routes that work |
|---|---|
| X | **The host browser in the marketer's signed-in session**, when there is one (ask once in the draft message if not): X advanced search, `<terms> min_faves:100 since:<YYYY-MM-DD>`, add `filter:native_video` to see which videos win; then open the target accounts' posts and Replies tabs. **Without a session:** web search `site:x.com "<term>"` limited to the past month, then open the single post pages (they often load without a login); and the accounts' own websites and newsletters, which link their best posts. |
| YouTube | Search and channel pages open without a login: sort by views or recent. |
| LinkedIn | Web search `site:linkedin.com/posts "<term>"` for the past month; post pages often open. Profiles' activity needs a login: say so. |
| TikTok, Instagram | Web search `site:tiktok.com` / `site:instagram.com` plus the term; single video pages often open, search pages usually need a login: say so. |
| Any | `gooseworks:brand_read` `sections: ["organic"]` (`competitor_top_posts`), `gooseworks:social_inspiration_search`, `gooseworks:competitor_read` (skip anything outside the brand's category, such as a mis-matched competitor); research-market's latest report and `research/competitors/` files. |

**Finding who the buyers actually watch:** start from the people they follow, not "best accounts" listicles:
- competitors' founders and staff;
- the category's newsletter writers, podcast hosts and conference speakers;
- the accounts that reply most on those people's posts.

Web search finds these names; their profiles lead to the posts.

**Paid top-up** (offered once, in the draft-report message, under `../../../../atoms/spend-gate/ATOM.md` branch B). Use the verified reads only (`../../../../atoms/spend-gate/proxy-endpoints.md`):

| Platform | Reads |
|---|---|
| X | keyword search (`/v1/twitter/search/posts`) on the niche's terms. It is a relevance sample with no recency option, so drop out-of-window items and keep the high-engagement posts. Test in the probe whether operators like `min_faves:` pass through. |
| TikTok | keyword search sorted by likes, and search suggestions for buyer phrasing |
| Instagram | reels search |
| LinkedIn | posts by keyword (last month) |
| YouTube | Shorts search |
| Threads | search |

Plan the reads per platform, cap every row, and ask one yes to "up to N credits".

**Judging "what works":** X and TikTok show view counts publicly, so read them. Rank posts by engagement relative to the author's follower count, not raw likes. An example with no numbers seen is labelled "pattern, numbers not seen". Never call a winner without numbers, and never invent an example or a link.

**For each platform, keep 8–15 examples that worked, at least 3 from accounts under 10k followers** (big accounts' reach says little about what a small account can do). For each one record:
- link, account, date, numbers
- format: text, thread, video and its length, carousel, image, poll
- the hook (first line or first 2 seconds), quoted
- structure
- why it worked, in one line
- whether this brand could do the same honestly (yes or no, and why)

Then name the **3–5 patterns** that repeat, and note what everyone does that the brand should avoid. **Don't follow the herd:** when every account does the same thing, that's a reason to consider something else.

## 3. The brand's and the person's own accounts

**Find the accounts:**
- the brain (`brand_read` `accounts`, `sources` and `organic`, then `social/accounts.md`);
- the brand's website footer and the founder's bio;
- a web search: `<person name> <brand> <platform>`.

**Read them:**
- TikTok and Instagram: free via `brand_read organic`.
- Every platform: the public profile in the host browser.
- The paid top-up, for LinkedIn (company posts, or a keyword search filtered to the author's posts) and X (a keyword search for the handle, keeping only the author's own posts). It is unverified as an own-feed read, so say so.
- If none of these work, ask for 5–10 pasted posts in the draft-report message.

**Record:**
- handle and follower count
- how often they post, and what got the most replies or views
- bio and pinned post
- the voice: build or update the card with `../../../../atoms/voice-card/ATOM.md`

A new account with zero followers is a fact to plan around, not a gap to apologise for.

## 4. Output, kept for the report and the next run

Write `social/research/<YYYY-MM-DD>-<platform>.md` (brand coworker scope) per platform:
- the "how it works now" card
- the examples table
- the patterns
- the own-account read
- the sources, with dates

The report (SKILL.md, steps 2 and 6) uses these. The next run reads them and refreshes any card older than 30 days.

**Never:**
- copy a post;
- quote a number you didn't see;
- state an algorithm fact without a dated source.

"I couldn't confirm this" is an acceptable line. A guess presented as fact is not.
