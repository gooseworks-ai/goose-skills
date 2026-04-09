---
name: trending-ad-hook-spotter
description: >
  Monitor Twitter/X, Reddit, LinkedIn, and Hacker News for trending narratives,
  viral posts, and hot-button topics in your space. Maps trends to ad hook
  opportunities with timing urgency scores. Tells you what to run ads about
  right now while the topic is hot.
tags: [ads]
---

# Trending Ad Hook Spotter

Scan social platforms for what's trending in your space right now — viral posts, hot debates, breaking news, memes — and translate each trend into a concrete ad hook you can run while the topic is still hot.

**Core principle:** The highest-performing ads ride cultural and industry moments. This skill finds those moments before your competitors do and tells you exactly how to capitalize.

## When to Use

- "What's trending in our space that we could run ads about?"
- "Find viral hooks for our paid campaigns"
- "What topics are hot in [industry] right now?"
- "I want to ride a trend with a paid campaign"
- "What should we be running ads about this week?"

## Prerequisites

- **Environment variable:** `APIFY_API_TOKEN` — required for Reddit scraping (optional if using only web_search + HN API)
- **Web search access** — your AI agent must support `web_search` or equivalent for Twitter/X and LinkedIn lookups
- **No API key needed** for Hacker News (Algolia HN API is free and public)

## Phase 0: Intake

1. **Your product** — Name + one-line description
2. **Industry/category** — What space are you in? (e.g., "AI sales tools", "developer infrastructure")
3. **ICP keywords** — 5-10 keywords that define your buyer's world
4. **Competitor names** — So we can spot when they become part of a trend
5. **Platforms to scan** (default: all):
   - Twitter/X
   - Reddit (specific subreddits if known)
   - LinkedIn
   - Hacker News
6. **Content velocity** — How fast can you create ads? (Same-day / 2-3 days / Weekly)

## Phase 1: Social Scanning

### 1A: Twitter/X Trend Scan (web_search)

Use web_search with `site:x.com` or `site:twitter.com` to find trending posts — no scraper or credentials needed:

```
# Industry trending topics
web_search: "<industry keyword> (viral OR trending OR hot take OR thread) site:x.com"

# Competitor mentions (momentum signals)
web_search: "<competitor1> OR <competitor2> (raised OR launched OR shut down OR acquired OR outage) site:x.com"

# Pain/frustration spikes
web_search: "<category> (broken OR frustrating OR tired of OR switched from) site:x.com"
```

Run 3-5 queries to cover:
- Industry trending topics and hot takes
- Competitor momentum signals (launches, outages, funding)
- Pain/frustration spikes in the category
- Viral threads with high engagement

Score each tweet/thread by engagement velocity (likes + retweets relative to account size and age).

### 1B: Reddit Trend Scan (Apify)

Use the `trudax/reddit-scraper-lite` actor to scan relevant subreddits for hot posts:

**Browse specific subreddits (for trending/hot posts):**
```
POST https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/runs?token=$APIFY_API_TOKEN
Content-Type: application/json

{
  "startUrls": [
    {"url": "https://www.reddit.com/r/SUBREDDIT1/hot/"},
    {"url": "https://www.reddit.com/r/SUBREDDIT2/hot/"}
  ],
  "maxItems": 30
}
```

**Search by keyword (for specific topics):**
```
POST https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/runs?token=$APIFY_API_TOKEN
Content-Type: application/json

{
  "searches": ["<industry keyword> OR <competitor>"],
  "maxItems": 30
}
```

Poll until the run finishes:

```
GET https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/runs/{RUN_ID}?token=$APIFY_API_TOKEN
```

When `status` is `SUCCEEDED`, fetch results:

```
GET https://api.apify.com/v2/datasets/{DATASET_ID}/items?token=$APIFY_API_TOKEN
```

**Output fields:** Each item has `dataType` ("post" or "comment"), `title` (posts only), `body`, `communityName`, `upVotes`, `numberOfComments` (posts), `url`, `createdAt`.

Look for:
- Posts with unusually high upvote/comment ratios
- "What do you use for [X]?" threads (buying intent)
- Complaint threads about incumbents
- "I just switched from X to Y" posts

### 1C: LinkedIn Trend Scan (web_search)

Use web_search with `site:linkedin.com/posts` to find high-engagement KOL posts — no scraper or credentials needed:

```
web_search: "<industry keyword> site:linkedin.com/posts"
web_search: "<competitor_name> site:linkedin.com/posts"
web_search: "<KOL_name> <industry keyword> site:linkedin.com/posts"
web_search: "<trending topic> site:linkedin.com/pulse"
```

Run queries for:
- 5-10 key opinion leaders (KOLs) in the space — search their names + topic keywords
- Industry-level keyword searches to find viral posts
- Competitor mentions from thought leaders

Identify high-engagement posts on topics relevant to your product category.

### 1D: Hacker News Scan (Algolia HN API)

Use the free Algolia HN Search API — no API key needed:

**Search for relevant stories:**

```
GET https://hn.algolia.com/api/v1/search?query=KEYWORD&tags=story&hitsPerPage=20
```

**Search for recent stories (past 7 days):**

```
GET https://hn.algolia.com/api/v1/search?query=KEYWORD&tags=story&numericFilters=created_at_i>UNIX_TIMESTAMP_7_DAYS_AGO&hitsPerPage=20
```

**Get front page stories (current trending):**

```
GET https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30
```

The response includes `points`, `num_comments`, `title`, `url`, and `created_at` for each story. Sort by `points` to find the highest-engagement discussions.

Run queries for:
- Each ICP keyword
- Each competitor name
- The product category
- Check front page for anything tangentially related

## Phase 2: Trend Identification & Scoring

### Trend Detection Framework

Group collected signals into trends. A "trend" is:
- A topic appearing across 2+ platforms within the past 7 days
- A single post/thread with exceptional engagement (10x+ the norm)
- A breaking event (funding, acquisition, outage, launch) with cascading conversation

### Score Each Trend

| Factor | Weight | Description |
|--------|--------|-------------|
| **Recency** | 25% | How fresh? (< 24h = max, > 7 days = low) |
| **Velocity** | 25% | Is engagement accelerating or decelerating? |
| **Cross-platform** | 20% | Appearing on multiple platforms? |
| **ICP relevance** | 20% | Does your target buyer care about this? |
| **Product fit** | 10% | Can you credibly connect your product to this trend? |

**Total score out of 100. Urgency tiers:**
- **90-100:** Run today — this peaks within 24-48h
- **70-89:** Run this week — 3-5 day window
- **50-69:** Worth testing — stable trend, less time pressure
- **Below 50:** Monitor — not actionable yet

## Phase 3: Hook Translation

For each trend scoring 50+, generate:

### Ad Hook Formula

```
[Trend reference] + [Your unique angle] + [CTA tied to the moment]
```

### Per Trend, Produce:

1. **Trend summary** — What's happening in 2 sentences
2. **Why it's an ad opportunity** — Connection to your product/ICP
3. **3 hook variants:**
   - **Newsjack hook** — Reference the trend directly ("Everyone's talking about X. Here's what they're missing...")
   - **Contrarian hook** — Take the opposite stance ("Hot take: [trend] doesn't matter. Here's what does...")
   - **Practical hook** — Offer a solution related to the trend ("[Trend] means you need [your feature] now")
4. **Recommended format** — Static / video / carousel / search ad
5. **Recommended platform** — Where the trend is hottest
6. **Time window** — How long before this trend fades

## Phase 4: Output Format

```markdown
# Trending Ad Hooks — [DATE]

Industry: [category]
Platforms scanned: [list]
Trends identified: [N]
Actionable hooks (score 50+): [N]

---

## Run Today (Score 90+)

### Trend: [Trend Title]
**What's happening:** [2-sentence summary]
**Engagement signal:** [X likes/comments across Y platforms in Z hours]
**Time window:** [Estimated hours/days before this fades]

**Hook 1 (Newsjack):** "[Ad headline]"
> [1-2 sentence body copy]
- Format: [Static/Video/Carousel]
- Platform: [Twitter/Meta/Google/LinkedIn]

**Hook 2 (Contrarian):** "[Ad headline]"
> [Body copy]

**Hook 3 (Practical):** "[Ad headline]"
> [Body copy]

---

## Run This Week (Score 70-89)

[Same format]

---

## Worth Testing (Score 50-69)

[Same format, briefer]

---

## Trend Velocity Dashboard

| Trend | Twitter | Reddit | LinkedIn | HN | Score | Window |
|-------|---------|--------|----------|----|----|--------|
| [Trend 1] | High | Medium | Low | — | 92 | 24h |
| [Trend 2] | Medium | — | High | Low | 78 | 5d |
| [Trend 3] | Low | Medium | — | Medium | 61 | 2w |

---

## Competitor Trend Involvement

| Trend | Competitor Riding It? | Their Angle | Your Counter-Angle |
|-------|----------------------|-------------|-------------------|
| [Trend] | [Y/N — who] | [Their take] | [Your differentiated take] |
```

Save to `trending-hooks-[YYYY-MM-DD].md` in the current working directory (or user-specified path).

## Cost

| Component | Cost |
|-----------|------|
| Twitter/X (web_search) | Free |
| Reddit scraper (Apify) | ~$0.05-0.10 |
| LinkedIn (web_search) | Free |
| Hacker News (Algolia API) | Free |
| Analysis & hook generation | Free (LLM reasoning) |
| **Total** | **~$0.05-0.10** (or free if skipping Reddit Apify scraper) |

## Tools Required

- **Environment variable:** `APIFY_API_TOKEN` — for Reddit scraping via Apify (optional — skill works without it using web_search fallback for Reddit)
- **Web search** — built into your AI agent (for Twitter/X, LinkedIn)
- **Hacker News Algolia API** — free, no key needed (`https://hn.algolia.com/api/v1/`)
- No third-party libraries needed. All data collection uses HTTP APIs (`requests` or equivalent) and web_search.

## Trigger Phrases

- "What's trending we could run ads about?"
- "Find viral hooks for our campaigns"
- "What's hot in [space] this week?"
- "Newsjacking opportunities for [client]"
- "Run the trending hook spotter"
