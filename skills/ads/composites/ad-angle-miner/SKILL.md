---
name: ad-angle-miner
description: >
  Find the ad angles worth running and turn them into ready-to-make ad ideas: static ads, video
  ads, or just the copy. Each angle is backed by what buyers actually say (the brand's reviews,
  competitors' bad reviews, comments on the ads and posts that work) and by what advertisers keep
  paying to run, never by one Reddit thread. Static ideas come with a matching template from the
  live template library; video ideas with a video format and the organic posts behind them. Every
  reference is labelled paid or organic and links to the real post or ad. Picked ideas can be
  handed straight to making the ads.
tags: [ads]
---

# Ad Angle Miner

An ad is **copy plus creative**. This skill finds the angles real buyers respond to and turns each
into an ad idea the user can make:

- **Static**: a headline and primary text, plus a template from the live library whose layout fits the message.
- **Video**: a hook, plus a video format from the live catalogue and the organic posts that prove the pattern.
- **Copy only**: the headline and primary text lines, with no creative. Same evidence as static.

**Core principle:** a good angle shows up in two places at once: in what buyers say (reviews,
comments) and in what the market keeps paying to run (long-running ads, many variants). One
source alone is a hunch. A paid ad's reach is never proof on its own, and a single forum thread
never is either.

**Do only the work the chosen output needs.** Copy and static never search for videos or read
video formats. Copy never looks at templates. Video doesn't mine product reviews unless asked.

## When to Use

- "What static ads should I make?" / "Give me image ad ideas for [brand]" (static)
- "What video ads should I make?" / "Give me video ad hooks for [brand]" (video)
- "Write ad copy / headlines for [brand]" / "What should our ads say?" (copy)
- "What's working in my competitors' ads?" (any; ask which output)
- "I need fresh ad angles" (ask which output)

## Prerequisites

- **GooseWorks MCP connector** (recommended): brand context, competitors, the Meta Ad Library
  (imported and live search), comments and reviews through the ScrapeCreators proxy (no key), the
  video format catalogue and the static template library. With it connected, no API key is needed.
- **Without GooseWorks**: a direct ScrapeCreators key (`scrapecreators-api`,
  `competitor-ad-intelligence`) and web search. Static and video ideas then describe the layout or
  format in words instead of naming a library entry, and there is no hand-off step.

## Phase 0: Intake

### 0A: Choose the output

Read it from the request:

| The user says | Output |
|---|---|
| static, image ads, banners, "what image ads" | **static** |
| video, UGC, reels, TikTok, "what video should I make" | **video** |
| copy, headlines, primary text, "what should our ads say" | **copy** |
| "ads" or "angles" with no hint | **ask once**: "Static ad ideas, video ad ideas, or just the copy?" |

The user can pick more than one (for example static and video); then run the union of their
sources, once. Never widen the scope on your own.

### 0B: What each output runs

| Source | static | video | copy |
|---|---|---|---|
| Brand context (1-0) | yes | yes | yes |
| The brand's own ads (1A) | yes | yes | yes |
| Competitor ads (1B) | yes, image ads first | yes, video ads first | yes, the copy |
| Customer voice: reviews + comments (1C) | **yes** | comments on the top posts only | **yes** |
| Organic short-form reach (1D) | no | **yes** | no |
| Internal data (1E) | if provided | if provided | if provided |
| Reddit and forums (1F) | only if asked | only if asked | only if asked |
| Template library (2.5) | **yes** | no | no |
| Video format catalogue (2.5) | no | **yes** | no |

### 0C: The rest of the intake

Take what the request and the brand context already answer; ask only for what's missing, in one message:

1. **Your product**: name and what it does in one sentence (with GooseWorks: the brand context).
2. **Competitors**: 2-5 names (with GooseWorks: the tracked ones, or the suggested ones).
3. **Who it's for**, if the brand context doesn't say.
4. **Search terms** the user wants covered, if any. Use them first.

Never invent a customer, a result or a claim: an angle may only promise what the brand's own facts support.

## Phase 1: Source Collection

Run only the sections Phase 0B selected. ScrapeCreators calls go through `scrapecreators-api`
(GooseWorks: `data_call_provider` with provider scrapecreators, GET). Each is billed per call:
before the first one, say roughly how many you'll run and ask one yes/no. Free sources never need
asking. Large results are saved to a file by some hosts: request a full page and parse the saved
file rather than paging in small pieces.

### 1-0: Brand Context

With the GooseWorks MCP: `brand_read` (one brand in the org means use it and say which), with
sections summary, products, competitors, accounts and learnings (the reply is large: parse the
saved file); add kit when you need claims,
voice or photos. Note what it sells, who buys it, its claims and can't-say rules, its offers, which
products have clean photos (check the files: an SVG logo or a small thumbnail is not a clean
product photo), and whether it has screen recordings or footage. `competitor_read` lists tracked
competitors; with none, its suggestions view names likely ones. Say them in one line and carry on.

### 1A: The Brand's Own Ads

What the brand already runs decides what is new.

1. **Find the right page.** Search the Meta Ad Library for the brand by name
   (/v1/facebook/adLibrary/search/companies, query = brand name) and compare the page with the
   one stored on the brand. If the stored page returns no ads but the search finds an active page
   with the brand's name, use the found page and tell the user the stored page looks wrong.
2. **Read its ads** (/v1/facebook/adLibrary/company/ads with that page id; status ACTIVE, then
   INACTIVE for the stopped ones when the endpoint returns them). Group ads with the same primary
   text as variants of one message.
3. **Sort them:**
   - **Still running for 30+ days, or with 3+ variants**: the brand's own winner. A young ad
     account has few old ads, so lean on the variant rule there. Don't skip it;
     an idea can refresh it with a new creative. Flag fatigue if it has run for months.
   - **Stopped**: tested and dropped. Don't propose it again unless the evidence is new.
   - **Never run**: the white space. An angle buyers talk about that the brand has never run is
     the most valuable find.

### 1B: Competitor Ads

1. **Imported ads (free)**: `ads_template_read` in competitor mode, one tracked competitor at a time
   (filter by its source id). Rows are heavy; keep the source ad id, primary text, CTA, start and
   end dates and ratio. Today most imported ads are images; their copy is still evidence.
2. **Keep it on-category.** A tracked competitor can sell something else in another market. Drop
   ads that aren't about the same kind of product, and say which competitor was off-category.
3. **Find who actually advertises in the category** (paid): Meta Ad Library keyword search
   (/v1/facebook/adLibrary/search/ads) with 2-3 category terms ("chai concentrate", "masala chai"),
   country set to the brand's market and status ACTIVE. Keyword search also returns unrelated
   advertisers: drop anything off-category. This finds the real competitors the roster misses.
4. For every ad keep: the link, advertiser, the hook (first line), the offer, the CTA, **days
   running** and the **number of variants**. Live searches return each ad's url: use it. Imported
   rows return only the ad id: there, and only there, build the link as facebook.com/ads/library
   with that id. For a live ad the end date is the day it was fetched (imported rows: the day they
   were imported), so write "at least N days, still running".

### 1C: Customer Voice

What buyers say in their own words. This is what keeps angles from being guesses.

1. **The brand's own reviews**: its product pages (review widgets often load by script, so a
   plain web fetch shows only a few; fetch the raw page HTML and read the review blocks and any
   "customers say" summary in it), its TikTok Shop reviews if it sells there (/v1/tiktok/shop/product/reviews), its Amazon
   listing (web search and fetch). Keep 4-5 star reviews for outcomes and proof, and 1-3 star
   reviews for objections to answer.
2. **Competitors' bad reviews**: 1-2 star reviews of the top 2 competitors' products, from the same
   kinds of sources. These are the gaps the brand can claim.
3. **Comments on what's working**: most ads link to a landing page, not a post, so their comments
   usually can't be read. Read comments instead on:
   - the brand's own top posts (its accounts from the brand context; Instagram
     /v2/instagram/user/posts, TikTok /v3/tiktok/profile/videos, then the comments of the 2 best);
   - 1-2 complaint or comparison threads found by keyword search in the category (TikTok
     /v1/tiktok/search/keyword, then /v1/tiktok/video/comments);
   - in video mode, the top organic posts from 1D.

   Comments paths: TikTok /v1/tiktok/video/comments, Instagram /v2/instagram/post/comments, YouTube
   /v1/youtube/video/comments, Facebook /v1/facebook/post/comments. Look for questions, objections
   and "I switched because…".

Keep every quote verbatim with its link. Never paraphrase a quote into something the buyer didn't say.

### 1D: Organic Short-Form Reach (video only)

What is getting **earned** reach right now.

1. **Free first**: the competitor dossiers (`competitor_read` with a slug) and `social_inspiration_library`
   / `social_inspiration_search`. These are often empty; then go to the paid searches.
2. **Paid searches** (one yes/no for the batch). Terms: the user's own first, then the category, the
   main problem it solves, each competitor's name.

   | Platform | Path | Query | Notes |
   |---|---|---|---|
   | TikTok | /v1/tiktok/search/keyword | query, date_posted last-3-months, sort_by most-liked | About 2MB per call: parse it; keep url (tiktok.com/@author/video/id), author, followers, statistics.play_count, create_time, desc, commerce_info |
   | Instagram Reels | /v2/instagram/reels/search | query, date_posted last-month | Google-indexed, best-effort, about 9 results a page; no follower count |
   | YouTube Shorts | /v1/youtube/search | query, type shorts, nothing else | Adding uploadDate or sortBy with type shorts returns nothing. Rows have only url, title and views: for the 3-5 you'd cite, call /v1/youtube/video for channel, publishDate and isPaidPromotion. YouTube evidence is evergreen: cite its date |
   | X | none | none | No X keyword search: use `competitor_search_mentions` with platform x, or /v1/twitter/user-tweets for a handle |

   The full list is the official OpenAPI (docs.scrapecreators.com/openapi.json). If a call errors,
   read it there; never guess a path.
3. Keep vertical videos only, far above their account's usual views, from the last ~90 days.
4. Watch the 3-5 strongest (the `watch` skill, or `social_inspiration_watch` for saved posts). When
   neither is available, read the transcript (YouTube /v1/youtube/video/transcript; otherwise the
   caption and first spoken line) rather than guessing from the title.

### 1E: Internal Data (Optional)

Support tickets, NPS comments, sales call notes the user provides. Treat them as customer voice.

### 1F: Reddit and Forums (only if asked)

Only when the user asks, or for a product whose buyers mainly talk there (developer tools, some
software). Use `reddit-post-finder` or /v1/reddit/search. A thread is one person's view: it counts
as customer voice only when the same point also shows up in reviews or comments.

### 1G: Label Every Reference Paid or Organic

- **paid**: any of
  - it came from an ad library;
  - TikTok: commerce_info.bc_label_test_text says "Paid partnership", "Promotional content" or
    "Creator earns commission". The is_ads flag is almost always false; ad_source or adv_promotable
    alone means unknown;
  - Instagram: is_paid_partnership or sponsor tags, or the caption says #ad, sponsored, gifted or
    tags the brand as a partner;
  - YouTube: isPaidPromotion from /v1/youtube/video (/v1/youtube/video/sponsors only for the
    sponsor's name; if they disagree, unknown);
  - **boosted**: the same caption or script on several accounts, plays far above the account's
    followers, or the same creative in the ad library.
- **organic**: a post with none of the above.
- **unknown**: you can't tell. Say so; never guess organic.

Reviews and comments are **customer voice**, a third kind of evidence. Label them as such.

## Phase 2: Angle Extraction

| Category | What to look for |
|---|---|
| **Pain** | Specific frustrations with the status quo or competitors |
| **Outcome** | Results buyers describe in their own words |
| **Identity** | How buyers describe themselves or want to be seen |
| **Switching** | Why people left a competitor |
| **Proof** | Outcomes, ratings or credentials buyers and the brand can back up |
| **Contrast** | Old way vs new way, them vs us |
| **Objection** | The doubt that stops a purchase, answered |

For each angle record: the one-sentence angle, 2-5 verbatim quotes with links, which kinds of
evidence back it (customer voice, organic reach, sustained ads), whether the brand already runs it
(1A: winner, stopped, or never run) and the competitor gap it exploits, if any.

## Phase 2.5: Turn Each Angle Into an Ad

**Every output** gets the words: a headline (8 words or fewer for static, 12 or fewer as a video
hook) and 1-2 sentences of primary text, in the brand's voice.

**Claims**: only what the brand's own data says (certifications, guarantees, ingredients, offers),
checked **for the exact product the ad shows**: two products of one brand can differ (one has no
added sugar, the other does).
Flag anything the brand should approve, such as review counts, health benefits, price comparisons
or a named person, rather than writing it as fact. When the brand's sources disagree (two
different numbers for the same claim), flag both.

### Static: find the template live, never from a list

The template library grows every week, so never rely on a remembered list of templates or layouts.

1. **Describe the layout the message needs**, in a sentence. Work it out from the angle, not from
   a menu: a contrast angle wants two things side by side with ticks and crosses; a proof angle
   wants a review card or a rating next to the product; an objection angle might want the doubt as
   a quote and the answer as the headline; an offer wants the price story.
2. **Search for it**: `ads_template_read` in query mode, with the brand id and that sentence as the
   query. It searches the whole library by meaning and returns each match with its description,
   search tags and a score, so templates added tomorrow are found the same way. Rank by score.
   Run one search per angle; when the best similarity is under about 0.5, try a second phrasing.
3. **Judge the fit from the template's own description**: does the layout carry this message, does
   it have room for the headline (some layouts have no text slot), and can the brand supply what it
   shows (a product photo, a lifestyle shot, a person)? Pick the best one and say why in one line.
4. **A competitor's ad can be the template** only when nothing in the library fits (from 1B; its
   row id is a template id). It is a third party's ad: take the layout only, never its words,
   branding or images, and say it's a competitor's ad.
5. Keep the result's source type with the id: a community result goes to `goose-ads` as a
   community ad id, a template as a template id.

### Video: pick from the live format catalogue

`video_catalog_list` with kind formats and the brand id. Only these formats can be made; never map
to one that isn't listed. For each angle: the format's template id, its card description quoted
(never reworded), why it fits, and its needs checked against what the brand has. Match the product
to the format: a creator holding a product needs a physical product; a screen-recording format
needs an app.

### Copy only

No template or format. Give 2-3 headline and primary-text variants per angle instead.

Adapt the pattern, never copy: take the shape, structure and angle, never another brand's words,
claims, faces, footage or offer. Spread the list: no more than 3 ideas on one template or format,
and no more than 3 on one angle (variants of one angle count toward that 3).

## Phase 3: Scoring & Ranking

| Factor | Weight | Description |
|---|---|---|
| **Evidence** | 40% | How many kinds back it (customer voice, organic reach, sustained ads) and how strong each is |
| **Gap** | 20% | Never run by the brand, and weak or absent in competitors' ads |
| **Fit** | 20% | The brand can claim it with its own facts, and buyers like its own customers say it |
| **Make-ready** | 20% | The template or format fits and the brand has what it needs (copy: 100%) |

Score out of 100 and rank.

- **Sustained ads** means still running for 30+ days, or 3+ variants of one message. A single
  short-lived ad is weak evidence.
- **Static and copy** can have two kinds (customer voice and sustained ads; there is no organic
  search). The brand's own winners count as sustained ads, but lower the Gap score.
- **Caps**: an idea backed by only one kind of evidence caps at 70. One backed only by short-lived
  ads or a single thread caps at 50. In video, a paid post's views never count as evidence.

## Phase 4: Output

Print one table in the chat, best first, with 10-15 ideas. Every idea needs at least one link a
tool actually returned; no link, no idea.

**Static:**

| # | Headline | Primary text | Angle | Template (why it fits) | Evidence | Needs | Score |
|---|---|---|---|---|---|---|---|

**Video:**

| # | Hook | Angle | Format (quoted card) | Evidence | Needs | Score |
|---|---|---|---|---|---|---|

**Copy:**

| # | Angle | Headline variants | Primary text | Evidence | Score |
|---|---|---|---|---|---|

In Evidence, label each link: customer voice, organic (with views vs usual), or paid (with days
running and variants).

Under the table:

- one line on which sources ran and which were skipped (and why);
- the brand's own ads in one line: winners, stopped, and the white space found;
- the claims the brand must approve;
- if the stored ad page looked wrong (1A), say so.

Save the angle bank (one line per angle with its quotes) as angle-bank-[brand]-[YYYY-MM-DD].md and
the ideas as JSON next to it (rank, headline or hook, primary text, angle, template or format id
with its source type, why, references with url / kind / metric, needs, score), so a later session
can pick them up without re-running the research.

Then ask: "Which ones should I make? Pick up to 5, or say 'the top 3'." (Copy: skip this.)

## Phase 5: Make These (GooseWorks only)

For the picked ideas, with no manual step in between:

- **Static**: hand each idea's template id (with its source type), headline and primary text to
  the `goose-ads` skill as the source and the brief.
- **Video**: one project per idea with `video_project_upsert` (brand id, a short name from the
  hook, format set to the template id, and no brief, since a brief makes a multi-concept batch).
  Then make them one after another with `goose-video-local`; each idea is that project's brief.
  It needs a terminal agent (Claude Code, Codex, Cursor); on a hosted connector, say the ideas are
  ready and making them needs one of those.

Up to 5 per request; offer the rest after. Each paid step of making an ad is approved before it runs.

## Tools Required

- **GooseWorks MCP** (recommended): `brand_read`, `competitor_read`, `competitor_search_mentions`,
  `ads_template_read`, `social_inspiration_library`, `social_inspiration_search`,
  `data_call_provider`, `video_catalog_list`, `video_project_upsert`
- **`scrapecreators-api`**: ad libraries, comments, reviews, social search
- **`competitor-ad-intelligence`**: deeper teardown of one competitor's ads, when asked
- **`comment-mining`**: structured mining of a long comment thread
- **`reddit-post-finder`**: only when Reddit is asked for (1F)
- **Web search and fetch**: product-page and Amazon reviews

## Trigger Phrases

- "What static ads should I make for [brand]?"
- "What video ads should I make for [brand]?"
- "Write ad copy for [brand]"
- "What angles should we run?"
- "What's working in my competitors' ads?"
