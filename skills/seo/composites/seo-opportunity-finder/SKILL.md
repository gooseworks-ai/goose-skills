---
name: seo-opportunity-finder
description: >
  Find quick-win SEO content opportunities by comparing your site's existing content
  against competitor keyword rankings. Chains site-content-catalog and seo-domain-analyzer
  to build a content inventory, then identifies gaps — topics competitors rank for that
  you don't cover yet. Outputs a prioritized list of posts to write or update.
  Use when a seed/Series A team wants to start winning organic traffic without guessing.
tags: [seo]
---

# SEO Opportunity Finder

Identify the highest-leverage content gaps between your site and competitors. Combines a crawl of your existing content with competitor keyword/traffic analysis to surface a prioritized list of posts worth writing.

**Core principle:** Don't start from a blank keyword list. Start by knowing what you have, then find what competitors have that you don't — and pick the gaps most likely to convert.

## When to Use

- "Find SEO content gaps vs our competitors"
- "What topics should we write about to rank?"
- "We're starting a blog — where should we focus first?"
- "What keywords are [competitor] ranking for that we're missing?"

## Phase 0: Intake

1. Your website URL (e.g., `https://yourcompany.com`)
2. 2-3 competitor URLs to compare against
3. Primary ICP — who are you trying to attract? (This filters for commercial intent vs. general traffic)
4. Any topics/keyword themes that are definitely in scope? (Optional — helps prioritize output)

## Phase 1: Catalog Your Existing Content

Build an inventory of the target site's current pages and posts:

1. Fetch sitemap.xml (check `/sitemap.xml`, `/sitemap_index.xml`, `robots.txt` for `Sitemap:` directives)
2. Fall back to RSS feeds (`/feed`, `/blog/feed`) or blog index crawl if no sitemap
3. Extract: all blog post titles and URLs, inferred topics/themes per post, estimated content age

This prevents recommending content you've already written.

## Phase 2: Analyze Competitor SEO Footprint

For each competitor domain, pull SEO metrics:

1. **Domain overview** — authority score, organic traffic estimate, top ranking keywords (via Apify Semrush scraper if `APIFY_API_TOKEN` is set)
2. **Top pages** — highest-traffic pages and their primary keywords
3. **Keyword categories** — which topic clusters they're winning in

If Apify data is limited, supplement with web search probes:
- `site:[competitor]` for indexed page count
- Search target keywords and note which competitors rank where
- SimilarWeb free tier for traffic estimates

## Phase 3: Identify Gaps

Compare your content inventory (Phase 1) against competitor keyword/topic coverage (Phase 2):

### Gap Classification

| Type | Definition | Priority |
|------|------------|----------|
| **Hard gap** | Competitor has a page/post on topic, you have nothing | High |
| **Soft gap** | You have content on topic but it's thin (< 500 words, old, no depth) | Medium |
| **Positioning gap** | Competitor owns a keyword cluster that maps to your ICP's exact problem | High |
| **Informational gap** | High traffic, low commercial intent — good for awareness, not conversion | Low |

### Commercial Intent Filter

For each gap topic, score commercial intent (1-5):
- **5** — Directly maps to your product (e.g., "best AI SDR tools for startups")
- **4** — Problem-aware but not product-specific (e.g., "how to scale outbound SDR")
- **3** — Adjacent pain point (e.g., "cold email open rates benchmark 2026")
- **2** — Educational, tangential (e.g., "what is lead scoring")
- **1** — Generic traffic, low conversion potential

Prioritize gaps with score ≥ 3.

## Phase 4: Synthesize & Output

Produce a prioritized opportunity table + editorial brief starters:

```markdown
# SEO Opportunity Report — [Your Company] vs [Competitors]
Generated: [DATE]

## Your Content Snapshot
- Total indexed pages: [N]
- Blog posts: [N]
- Main topic clusters: [list]

## Competitor Benchmarks
| Domain | DR | Est. Monthly Organic Traffic | Top Keyword Clusters |
|--------|----|-----------------------------|----------------------|
| [comp1] | [X] | [X] | [topics] |
| [comp2] | [X] | [X] | [topics] |

## Top 10 Content Opportunities

### 1. [Topic/Title Suggestion]
- **Keyword target:** [keyword phrase]
- **Why it matters:** [what problem it solves for ICP]
- **Competitor owning it:** [competitor URL]
- **Est. monthly searches:** [range]
- **Commercial intent score:** [1-5]
- **Recommended format:** [listicle / how-to / comparison / landing page]
- **Estimated effort:** [hours or word count target]

### 2. [Topic/Title Suggestion]
...

## Quick Wins (update existing posts)

| Your Post | Issue | What to Add |
|-----------|-------|-------------|
| [URL] | [thin/outdated] | [recommendation] |

## Recommended Content Calendar (Next 90 Days)

| Month | Post | Intent Score | Est. Traffic Potential |
|-------|------|-------------|----------------------|
| Month 1 | [post 1] | [score] | [range] |
| Month 1 | [post 2] | [score] | [range] |
| Month 2 | [post 3] | [score] | [range] |
...
```

Save to the current working directory or wherever the user prefers.

## Cost

| Component | Cost |
|-----------|------|
| Site content catalog | Free (sitemap crawl) |
| SEO domain analyzer (per competitor) | ~$1-3 (Apify Semrush scraper) |
| Traffic analyzer (supplement) | ~$0.10-0.50 (web search probes) |
| **Total per run** | **~$3-10 for 3 competitors** |

## Tools Required

- **Apify API token** — `APIFY_API_TOKEN` env var (for Semrush/Ahrefs data; free web search probes work without it)
- Web search and web fetch capabilities

## Trigger Phrases

- "Find our SEO content gaps"
- "What should we write about to rank?"
- "Compare our content coverage to [competitor]"
- "Run SEO opportunity finder for [client]"
