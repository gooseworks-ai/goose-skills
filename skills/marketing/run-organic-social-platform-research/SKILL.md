---
name: run-organic-social-platform-research
description: >-
  Researches how one social platform works right now from dated sources (what gets reach, formats
  rising and fading, how small accounts get seen, recent changes) and finds what is getting watched in
  a given niche there, with linked examples and engagement read against each author's baseline. Use
  alone when you already have the platform and niche; otherwise run run-organic-social.
version: 0.1.0
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

**Source quality:** a tool vendor's "how the algorithm works" page is never the only source for a fact, because many carry made-up weights. Each platform card has at least one source that is the platform's own statement or a study that states its sample. **Published ranking code is "likely", never "confirmed":** open-sourced ranking code or weights show what the code reads, not how it is tuned or what runs today; label facts drawn from them "likely (published code, <date>)". Only the platform's own current statement is "confirmed". **One shared view:** the card you write here is also what standalone posts read, so state each ranking signal once (e.g. whether bookmarks count), with its confidence; if your read differs from a card under 30 days old, update that card and say what changed rather than contradicting it. **Keep share and per-post apart:** "video is half of all impressions" is a share of activity; whether one video reaches more people than one text post for an account this size needs per-post data. Label which kind each fact is.

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

If the research contradicts `../run-organic-social/references/platform-native.md`, the research wins. Say so in the report.

## 2. What is working in this niche on this platform

Find the accounts and posts that the brand's buyers actually watch on this platform.

**Free pass — use the routes that actually work per platform:**

| Platform | Free routes that work |
|---|---|
| X | **The host browser in the marketer's signed-in session**, when there is one (ask once in the draft message if not): X advanced search, `<terms> min_faves:100 since:<YYYY-MM-DD>`, add `filter:native_video` to see which videos win; then open the target accounts' posts and Replies tabs. **Without a session:** web search `site:x.com "<term>"` limited to the past month, then open the single post pages (they often load without a login); and the accounts' own websites and newsletters, which link their best posts. |
| YouTube | Search and channel pages open without a login: sort by views or recent. |
| LinkedIn | Web search `site:linkedin.com/posts "<term>"` for the past month; post pages often open. Profiles' activity needs a login: say so. |
| TikTok, Instagram | Web search `site:tiktok.com` / `site:instagram.com` plus the term; single video pages often open, search pages usually need a login: say so. |
| Bluesky (B2B and developer brands) | Check first that the niche's voices are there; many developer and B2B voices moved in 2025–26. Profiles and posts are public: read them in the host browser on bsky.app. Its public, keyless API (`public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=<handle>`) returns an account's posts with like and repost counts; check it on first use. Search may need a login, so say so if it does. |
| Any | `gooseworks:brand_read` `sections: ["organic"]` (`competitor_top_posts`), `gooseworks:social_inspiration_search`, `gooseworks:competitor_read` (skip anything outside the brand's category, such as a mis-matched competitor); research-market's latest report and `research/competitors/` files. |

**Finding who the buyers actually watch:** start from the people they follow, not "best accounts" listicles:
- competitors' founders and staff;
- the category's newsletter writers, podcast hosts and conference speakers;
- the accounts that reply most on those people's posts.

Web search finds these names; their profiles lead to the posts.

**Paid top-up** (offered once, in the draft-report message, under the `spend-gate` skill (`../spend-gate/SKILL.md`) branch B). Use the verified reads only (`../spend-gate/proxy-endpoints.md` (in the `spend-gate` skill)):

| Platform | Reads |
|---|---|
| X | keyword search (`/v1/twitter/search/posts`) on the niche's terms. It is a relevance sample with no recency option, so drop out-of-window items and keep the high-engagement posts. In the first probe, test whether `since:`, `until:`, `from:<handle>` and `min_faves:` pass through inside the query. If they do, X search gets a real date window. Named accounts: `/v1/twitter/profile`, then `/v1/twitter/user-tweets` (see §3 for its pitfalls). |
| Video examples | Transcripts of the top 5–10 video examples (`/v1/youtube/video/transcript`, `/v1/tiktok/video/transcript`, `/v2/instagram/media/transcript`, per the `marketing-data-access` skill (`../marketing-data-access/SKILL.md`)), so the hook and structure come from what is *said*, not just the caption. An auto-transcript isn't exact: flag unclear names and numbers. |
| TikTok | keyword search sorted by likes, and search suggestions for buyer phrasing |
| Instagram | reels search |
| LinkedIn | posts by keyword (last month) |
| YouTube | Shorts search |
| Threads | search |

Plan the reads per platform, cap every row, and ask one yes to "up to N credits".

**Judging "what works":**
- X and TikTok show view counts publicly, so read them.
- Rank posts by engagement relative to the author's follower count, not raw likes.
- **Baseline per format:** compare a carousel with the account's other carousels and a video with its videos, using each format's median. Never compare across formats.
- **Set apart** giveaways, collaborations, paid boosts and one-off viral events. They don't repeat.
- An example with no numbers seen is labelled "pattern, numbers not seen".
- Never call a winner without numbers, and never invent an example or a link.

**Read the comments under the best examples** (and later under the brand's own posts): what people say is often worth more than the post itself. Keep a parent comment when a reply changes its meaning. Tag each useful comment as one or more of:
- pain;
- question;
- objection;
- **product request** ("I wish it…");
- **workaround** ("I just use a spreadsheet for this"), a classic sign of an unmet need;
- praise.

Mark **buying intent** on a scale: curiosity → consideration → a price or availability question → comparison → stated purchase → repeat use → recommendation. Questions, requests and workarounds become hooks and topics. Buyers' own words become post lines (not claims).

**"Why did this one post do well?"** (a link the marketer pastes): read that post's page in the host browser. Use a single-post proxy read only once `../spend-gate/proxy-endpoints.md` (in the `spend-gate` skill) lists one for that platform. Compare the post with the author's own per-format baseline; name the likely drivers (hook, format, topic, timing, collaboration, a paid push) without claiming cause.

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
- **X:** `/v1/twitter/profile` (bio, followers, join date), then `/v1/twitter/user-tweets` for the posts, through the proxy under the spend gate's one yes. Three pitfalls:
  - it returns the account's **popular** posts, not the newest, so check each post's `created_at` before calling the account active or treating them as "the last 30 posts";
  - the numbers sit inside each post's `legacy` object (`favorite_count`, `retweet_count`, `reply_count`); the post link is the top-level `url`;
  - read profiles first for every account in question, then posts only for the shortlist.
- **LinkedIn:** company posts, or a keyword search filtered to the author's posts (patchy for a person's feed; say so).
- If none of these work, ask for 5–10 pasted posts in the draft-report message.
- Outliers are read against the account's own per-format median (§2).

**Record:**
- handle and follower count
- how often they post, and what got the most replies or views
- bio and pinned post
- the voice: build or update the card with the `voice-card` skill (`../voice-card/SKILL.md`)

A new account with zero followers is a fact to plan around, not a gap to apologise for.

## 3b. A model account: "tear down this one account" (when the marketer names one, or one account is clearly the pattern to learn from)

The question is why one account works and what this brand should take from it. Read that account in full (§3's routes) and answer:
- **Promise and positioning:** what a follower gets, in one line; who it's for; the profile funnel (bio, pinned post, link).
- **Pillars and recurring series:** a table with one linked example each.
- **Outliers against its own per-format baseline,** with giveaways, collaborations and paid pushes set apart, plus the likely drivers (labelled as inference, not cause). Read transcripts for its key videos and comments where the audience's reaction matters.
- **Mechanics:** hooks, formats, proof, CTAs, visual pattern, cadence.
- **Adapt vs don't copy:** take the mechanism and the audience insight, never the wording, likeness or identity.
- **Five tests for this brand,** ranked, each one a format test the calendar can run.

When the teardown is the whole ask, it's the report (through write-report). Inside a full plan, it's one section of the report.

## 3c. Voices the buyer follows: the refill read

At every refill (SKILL.md step 7), and in a weekly light pass if the marketer posts daily:
- Read the last 7 days of the 15–25 break-in accounts (§3's routes, X through the proxy reads).
- Cluster their posts by topic and flag four signals:
  - **convergence:** 3+ voices on one topic in the same week;
  - **spike:** a topic at 2× last week;
  - **underdog:** one voice early on a topic no one else covers;
  - **controversy:** a high comment-to-reaction ratio.
- Feed the strongest into the flex slots as reaction posts (`../run-organic-social/references/post-checks.md` §5). Post within about 3 days of the peak, or skip.
- **Finding more voices** (paid top-up): search LinkedIn and X posts on the category's *authority* terms (not pain words), group the posts by author, and keep authors with 2+ posts. Rank them on post count × engagement, drop recruiters and vendors, and merge with the web-found newsletter writers, podcast hosts and speakers.

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
