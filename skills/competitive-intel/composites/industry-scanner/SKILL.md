---
name: industry-scanner
description: >
  Daily industry intelligence scanner. Scans web, social media, news, blogs,
  and communities for industry-relevant events, trends, and signals. Produces
  a comprehensive intelligence briefing plus strategic GTM opportunity ideas.
  Orchestrates existing scraping skills — does not reimplement data collection.
---

# Industry Scanner

Daily deep-research agent that scans the internet for everything relevant to a client's industry, then generates strategic GTM opportunities based on what it finds.

## Quick Start

```
Run an industry scan for <client>. Use the config at clients/<client>/config/industry-scanner.json.
```

Or for a weekly deeper scan:

```
Run a weekly industry scan for <client> with --lookback 7.
```

## Inputs

- **Client name** — determines which config and context files to load
- **Lookback period** (optional) — `1` for daily (default), `7` for weekly deep scan
- **Focus area** (optional) — limit scan to specific categories (e.g., "competitors only", "events only")

---

## Step-by-Step Process

### Phase 1: Load Configuration

1. Read `clients/<client>/config/industry-scanner.json` — this contains all the keywords, sources, competitors, and URLs to scan
2. Read `clients/<client>/context.md` — need the ICP, value props, and positioning to generate relevant strategies
3. Set the lookback period: use `1` day for daily scans, `7` for weekly, or whatever the user specifies
4. Note today's date for the output filename

If no client config exists, ask the user for the key inputs and offer to create one from the example at `skills/industry-scanner/config/example-config.json`.

### Phase 2: Data Collection

Run these data sources in parallel where possible. Skip any source that isn't configured. For each source, use the existing skill's CLI or tool as documented.

**IMPORTANT:** Run as many of these bash commands in parallel as possible to minimize total scan time. Sources are independent of each other.

#### 2A. Web Search (built-in WebSearch tool)

Run 5-8 web searches combining the configured `web_search_queries` with time-sensitive modifiers. Examples:

- `"<industry keyword> news this week"`
- `"<competitor name> shutdown OR closing OR acquired 2026"`
- `"<industry> conference 2026 speaker applications"`
- `"<industry keyword> new regulation OR policy change"`
- `"<competitor name> layoffs OR pivot OR rebrand"`

Also search for each competitor name directly to catch any recent news.

#### 2B. Industry Blogs & Publications

```bash
python3 skills/blog-feed-monitor/scripts/scrape_blogs.py \
  --urls "<comma-separated blog_urls from config>" \
  --days <lookback> --output json
```

Read `skills/blog-feed-monitor/SKILL.md` for full CLI reference.

#### 2C. Reddit

For each configured subreddit, run:

```bash
python3 skills/reddit-post-finder/scripts/search_reddit.py \
  --subreddit "<comma-separated subreddits from config>" \
  --keywords "<comma-separated reddit_keywords from config>" \
  --days <lookback> --sort hot --output json
```

Also run a separate search with `--sort top --time week` to catch high-engagement posts.

Read `skills/reddit-post-finder/SKILL.md` for full CLI reference.

#### 2D. Twitter/X

For each configured Twitter query:

```bash
python3 skills/twitter-mention-tracker/scripts/search_twitter.py \
  --query "<twitter_query>" \
  --since <yesterday-YYYY-MM-DD> --until <today-YYYY-MM-DD> \
  --max-tweets 30 --output json
```

Read `skills/twitter-mention-tracker/SKILL.md` for full CLI reference.

#### 2E. LinkedIn

Search each configured LinkedIn keyword via the linkedin-post-research skill.

Delegate to the `linkedin-post-research` skill (uses the `apimaestro~linkedin-posts-search-scraper-no-cookies` Apify actor). Search each keyword with `date_posted: "past-day"` (or `"past-week"` for weekly scans).

Read `skills/linkedin-post-research/SKILL.md` for the full Apify workflow.

#### 2F. Hacker News

```bash
python3 skills/hacker-news-scraper/scripts/search_hn.py \
  --query "<hn_query>" --days <lookback> --output json
```

Run once per configured `hn_queries` entry. Read `skills/hacker-news-scraper/SKILL.md` for full CLI reference.

#### 2G. RSS News Feeds

If the client has an accounting-news-monitor (or similar) configured:

```bash
python3 skills/accounting-news-monitor/scripts/monitor_news.py \
  --new-only --days <lookback> --output json
```

Read `skills/accounting-news-monitor/SKILL.md` for full CLI reference.

#### 2H. Newsletter Inbox

If the client has newsletter monitoring configured:

```bash
python3 skills/newsletter-monitor/scripts/scan_newsletters.py \
  --days <lookback> --output json
```

Read `skills/newsletter-monitor/SKILL.md` for full CLI reference.

#### 2I. Review Sites

For each configured review URL:

```bash
python3 skills/review-site-scraper/scripts/scrape_reviews.py \
  --platform <platform> --url "<review_url>" \
  --days <lookback> --max-reviews 20 --output json
```

Read `skills/review-site-scraper/SKILL.md` for full CLI reference.

### Phase 3: Consolidate & Categorize

After all data collection completes, consolidate the results:

1. **Deduplicate** — items appearing across multiple sources (e.g., a news story on both a blog and Reddit). Keep the richest version but note multi-source appearance (higher signal).

2. **Categorize** each item into one of these types:

| Category | What to Look For |
|----------|-----------------|
| **Competitor News** | Shutdowns, launches, funding, pivots, negative reviews, leadership changes, pricing changes |
| **Industry Events** | Upcoming conferences, webinars, meetups, speaker slots, CFPs, award nominations |
| **Market Trends** | Viral discussions, hot topics, emerging themes, sentiment shifts, adoption data |
| **Regulatory / Policy** | New regulations, compliance changes, government actions, standards updates |
| **People Moves** | Key hires, departures, promotions at competitors or target companies |
| **Technology** | New product launches, integrations, platform changes, deprecations |
| **Funding / M&A** | Acquisitions, mergers, funding rounds, PE investments, IPO signals |
| **Pain Points** | People publicly complaining about problems the client solves |
| **Content Opportunities** | Trending content, viral posts, gaps in existing coverage, unanswered questions |

3. **Rate relevance** — High / Medium / Low based on how directly it relates to the client's ICP and value props.

4. **Filter out noise** — Drop items rated Low relevance unless they're genuinely noteworthy. The goal is signal, not volume.

### Phase 4: Generate Strategic Opportunities

Review the consolidated intelligence and identify items (or clusters of related items) that present genuine GTM opportunities.

**CRITICAL: Do NOT force-fit a strategy for every item.** Many items are just "good to know" — that's fine, they go in the intelligence briefing. Only generate strategy ideas where there is a real, actionable opportunity that could meaningfully impact growth.

For each genuine opportunity, produce:

| Field | Description |
|-------|-------------|
| **Trigger** | What happened — the intelligence item(s) that sparked this idea |
| **Strategy** | What to do about it — specific and actionable, not vague |
| **Tactics** | 2-4 concrete next steps with skill references where applicable |
| **Urgency** | `Immediate` (do this today/this week), `Soon` (next 2 weeks), or `Evergreen` |
| **Effort** | `Low` (1-2 hours), `Medium` (half day), `High` (multi-day project) |
| **Expected Impact** | Why this could matter — who it reaches, what it could generate |

#### Strategy Patterns to Draw From

Use these as inspiration, not as a checklist. Match the pattern to the trigger:

**Competitor in trouble (shutdown, bad reviews, layoffs, pivot):**
- Publish a migration/comparison guide targeting their customers
- Find their customers via review sites, LinkedIn posts mentioning them → outreach
- Engage on social posts where people discuss the shutdown/issues
- Create "alternative to X" content for SEO capture
- Skills: `web-archive-scraper` (recover their customer list), `review-site-scraper` (find reviewers), `linkedin-post-research` (find posts about them), `cold-email-outreach`

**Industry event coming up:**
- Apply to speak (if speaker slots are open)
- Plan pre-event outreach to attendees (skill: `luma-event-attendees` or `conference-speaker-scraper`)
- Create event-specific content (e.g., "What We're Watching at [Event]")
- Plan on-site presence and follow-up campaign

**Viral post or trending discussion:**
- Engage thoughtfully on the thread (LinkedIn comment, Reddit reply, tweet)
- Create response content (blog post, LinkedIn post) with the client's expert take
- If the poster is ICP, follow up directly
- Skills: `linkedin-post-research`, `company-contact-finder`

**Acquisition or merger announced:**
- Reach out to the acquired company's clients (they're in transition, open to alternatives)
- Create content about what the acquisition means for the industry
- Skills: `web-archive-scraper` (find client lists), `company-contact-finder`

**New regulation or policy change:**
- Create educational content positioning the client as an expert
- Direct outreach to companies affected by the change
- Host a webinar or publish a guide about compliance

**Pain point surfaced (Reddit complaint, negative review, LinkedIn vent):**
- Engage helpfully on the post (don't pitch — add value first)
- If the poster is ICP, follow up with a direct message/email
- Create content addressing the specific pain point
- Skills: `company-contact-finder`

**Trending topic or content gap:**
- Publish thought leadership content while the topic is hot
- CEO/founder LinkedIn post with a unique take
- Podcast or webinar on the trending topic

**Funding round announced at target company:**
- Outreach to the company (post-raise = budget for new tools)
- Skills: `company-contact-finder`, `cold-email-outreach`

### Phase 5: Generate Output

Save the report to the current working directory as `industry-scan-<YYYY-MM-DD>.md` (or user-specified path) using this structure:

---

```markdown
# Industry Intelligence Briefing — <Client Name>
**Date:** <YYYY-MM-DD>
**Scan type:** Daily / Weekly
**Sources scanned:** <list of sources that returned results>

---

## Executive Summary

<2-3 sentence overview of the most important findings. What should the client pay attention to today?>

---

## Intelligence Briefing

### Competitor News
| Item | Source | Link | Relevance |
|------|--------|------|-----------|
| ... | ... | ... | High/Med |

### Industry Events
| Item | Source | Link | Date | Relevance |
|------|--------|------|------|-----------|

### Market Trends
| Item | Source | Link | Engagement | Relevance |
|------|--------|------|------------|-----------|

### Funding / M&A
| Item | Source | Link | Relevance |
|------|--------|------|-----------|

### Regulatory / Policy
| Item | Source | Link | Relevance |
|------|--------|------|-----------|

### Technology
| Item | Source | Link | Relevance |
|------|--------|------|-----------|

### People Moves
| Item | Source | Link | Relevance |
|------|--------|------|-----------|

### Pain Points & Complaints
| Item | Source | Link | Engagement | Relevance |
|------|--------|------|------------|-----------|

### Content Opportunities
| Item | Source | Link | Why | Relevance |
|------|--------|------|-----|-----------|

*(Only include sections that have items. Skip empty categories.)*

---

## Strategic Growth Opportunities

*(Only include opportunities where there's a genuine, actionable strategy with meaningful potential impact. It is completely fine to have zero opportunities on a quiet day.)*

### Opportunity 1: <Short title>

**Trigger:** <What happened>

**Strategy:** <What to do about it>

**Tactics:**
1. <Specific action> *(skill: <skill-name> if applicable)*
2. <Specific action>
3. <Specific action>

**Urgency:** Immediate / Soon / Evergreen
**Effort:** Low / Medium / High
**Expected Impact:** <Why this matters>

---

### Opportunity 2: ...

---

## Scan Statistics

- **Total items found:** X
- **By category:** Competitor News (X), Events (X), Trends (X), ...
- **Opportunities identified:** X
- **Sources that returned results:** X of Y configured
```

---

## Configuration

Each client needs a config file at `clients/<client>/config/industry-scanner.json`. See `skills/industry-scanner/config/example-config.json` for the full schema.

Key fields:
- `web_search_queries` — broad industry search terms
- `competitors` — competitor names to monitor
- `subreddits` + `reddit_keywords` — Reddit monitoring config
- `twitter_queries` — Twitter/X search terms
- `linkedin_keywords` — LinkedIn post search terms
- `blog_urls` — industry publication URLs (for RSS scraping)
- `hn_queries` — Hacker News search terms
- `review_urls` — competitor review page URLs (G2, Capterra, Trustpilot)
- `event_keywords` — conference and event search terms

## Tips

- **Daily vs Weekly:** Daily scans (`--lookback 1`) are fast but may miss slower-developing stories. Run a weekly deep scan (`--lookback 7`) every Monday for comprehensive coverage.
- **Noisy sources:** If a source consistently returns irrelevant results, tune the keywords in the config rather than dropping the source entirely.
- **Multi-source signals:** Items that appear across multiple sources (e.g., on both Reddit and Twitter) are higher-signal. Flag these in the briefing.
- **Strategy quality > quantity:** A day with zero strategic opportunities is better than a day with five forced ones. The intelligence briefing has standalone value even without opportunities.
- **Follow up:** When an opportunity references a downstream skill (e.g., `company-contact-finder`), the user can chain directly into that skill to take action.

## Dependencies

No additional dependencies beyond what the sub-skills require:
- `requests` (Python) — for blog-feed-monitor, reddit-post-finder, twitter-mention-tracker, hn-scraper, review-site-scraper, news-monitor
- `APIFY_API_TOKEN` env var — for Reddit, Twitter, and review scraping
- `agentmail` + `python-dotenv` — for newsletter-monitor (if configured)
- `APIFY_API_TOKEN` — LinkedIn post search goes through the `linkedin-post-research` skill (Apify-based)
