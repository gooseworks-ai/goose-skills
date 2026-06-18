---
name: competitor-content-tracker
description: >
  Monitor competitor content across blogs, LinkedIn, and Twitter/X on a recurring basis.
  Surfaces new posts, trending topics, and content gaps you can own. Chains blog-feed-monitor,
  linkedin-profile-post-scraper, and twitter-mention-tracker. Use when you want a weekly digest
  of what competitors are publishing and which topics are generating engagement.
tags: [competitive-intel]
---

# Competitor Content Tracker

Monitor competitor content activity across three channels — blog, LinkedIn, Twitter/X — and produce a consolidated digest highlighting what's new, what's getting traction, and where you have a content gap.

## When to Use

- "Track what [competitor] is publishing"
- "Show me what my competitors posted this week"
- "What topics are competitors winning on?"
- "I want a weekly competitor content digest"

## Phase 0: Intake

### Competitors to Track
1. List of competitor company names + blog URLs (e.g., `https://clay.com/blog`)
2. LinkedIn profile URLs of competitor founders/CMOs to track (optional but high-value)
3. Twitter/X handles of the competitors or their founders (optional)

### Scope
4. How far back? (default: 7 days for weekly digest, 30 days for first run)
5. Any topics/keywords you care most about? (used to surface relevant posts first)

### Output
6. Format preference: full digest (everything) or highlights only (top 3-5 per competitor)?

Save config to `clients/<client-name>/configs/competitor-content-tracker.json`.

```json
{
  "competitors": [
    {
      "name": "Clay",
      "blog_url": "https://clay.com/blog",
      "linkedin_profiles": ["https://www.linkedin.com/in/kareem-amin/"],
      "twitter_handles": ["@clay_hq", "@kareemamin"]
    }
  ],
  "days_back": 7,
  "keywords": ["GTM", "outbound", "AI agents", "growth"],
  "output_mode": "highlights"
}
```

## Phase 1: Scrape Blog Content

Run `blog-feed-monitor` for each competitor blog URL:

```bash
python3 skills/capabilities/blog-feed-monitor/scripts/scrape_blogs.py \
  --urls "<competitor_blog_url>" \
  --days <days_back> \
  --keywords "<keywords>" \
  --output summary
```

Collect: post title, publish date, URL, excerpt.

## Phase 2: Scrape LinkedIn Posts

Run `linkedin-profile-post-scraper` for each tracked founder/executive LinkedIn URL:

```bash
python3 skills/capabilities/linkedin-profile-post-scraper/scripts/scrape_linkedin_posts.py \
  --profiles "<linkedin_url_1>,<linkedin_url_2>" \
  --days <days_back> \
  --max-posts 20 \
  --output summary
```

Collect: post text preview, date, reactions, comments, post URL.

## Phase 3: Scrape Twitter/X

Run `twitter-mention-tracker` for each handle:

```bash
python3 skills/capabilities/twitter-mention-tracker/scripts/search_twitter.py \
  --query "from:<handle>" \
  --since <YYYY-MM-DD> \
  --until <YYYY-MM-DD> \
  --max-tweets 20 \
  --output summary
```

Collect: tweet text, date, likes, retweets, URL.

## Phase 4: Analyze & Synthesize

After collecting raw data, synthesize across all channels:

### For each competitor, identify:
- **New blog posts** — titles, dates, topics
- **Top LinkedIn post** — by engagement (reactions + comments), topic, key message
- **Top tweet** — by likes, topic
- **Recurring themes** — what topics did they post about most this period?
- **Content format patterns** — are they doing listicles, opinion pieces, case studies?

### Cross-competitor analysis:
- **Shared trending topics** — what are multiple competitors writing about?
- **Coverage gaps** — topics they're covering that you're not
- **Topics you own** — where you're publishing and they're not
- **Engagement benchmarks** — average likes/reactions across competitors (context for your own performance)

## Phase 5: Output Format

Produce a structured markdown digest:

```markdown
# Competitor Content Digest — Week of [DATE]

## Summary
- [N] new blog posts tracked across [N] competitors
- Top trending topic: [topic]
- Biggest content gap for you: [topic]

---

## [Competitor Name]

### Blog
- [Post Title] — [Date] — [URL]
  > [One-sentence summary]

### LinkedIn (top post)
> "[Post preview...]"
— [Author], [Date] | [Reactions] reactions, [Comments] comments
[URL]

### Twitter/X (top tweet)
> "[Tweet text]"
— [@handle], [Date] | [Likes] likes
[URL]

### Themes this week: [tag1], [tag2], [tag3]

---

## Content Gap Analysis

| Topic | Competitors covering | You covering |
|-------|---------------------|--------------|
| [topic] | Clay, Apollo | ❌ No |
| [topic] | Nobody | ✅ Yes |

## Recommended Actions
1. [Specific content opportunity to act on this week]
2. [Topic to consider writing a response/alternative take on]
```

Save digest to `clients/<client-name>/intelligence/competitor-content-[YYYY-MM-DD].md`.

## Scheduling

This skill is designed to run weekly (Mondays recommended). Set up a cron job:

```bash
# Every Monday at 8am
0 8 * * 1 python3 run_skill.py competitor-content-tracker --client <client-name>
```

## Cost

| Component | Cost |
|-----------|------|
| Blog scraping (RSS mode) | Free |
| LinkedIn post scraping | ~$0.05-0.20/profile (Apify) |
| Twitter scraping | ~$0.01-0.05 per run |
| **Total per weekly run** | **~$0.10-0.50** depending on scope |

## Tools Required

- **Apify access** — via Gooseworks proxy by default (no key needed); set `APIFY_API_TOKEN` to BYO Apify
- **Upstream skills:** `blog-feed-monitor`, `linkedin-profile-post-scraper`, `twitter-mention-tracker`

## Trigger Phrases

- "Run competitor content tracker for [client]"
- "What did my competitors publish this week?"
- "Give me a competitor content digest"
- "What's [competitor] writing about?"
