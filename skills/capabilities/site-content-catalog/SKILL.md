---
name: site-content-catalog
description: >
  Crawl a website's sitemap and blog index to build a complete content inventory.
  Lists every page with URL, title, publish date, content type, and topic cluster.
  Groups content by category and topic. Optionally deep-reads top N pages for
  quality analysis and funnel stage tagging. Use before SEO audits, content gap
  analysis, or brand voice extraction.
tags: [content, seo]
---

# Site Content Catalog

Crawl a website's sitemap and blog to build a complete content inventory — every page cataloged with URL, title, date, content type, and topic cluster. Groups content by category, identifies publishing patterns, and optionally deep-analyzes top pages.

## Quick Start

```bash
# Basic content inventory
python3 scripts/catalog_content.py --domain "example.com"

# With deep analysis of top 20 pages
python3 scripts/catalog_content.py --domain "example.com" --deep-analyze 20

# Output to specific file
python3 scripts/catalog_content.py --domain "example.com" --output content-inventory.json
```

## Inputs

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| domain | Yes | — | Domain to catalog (e.g., "example.com") |
| deep-analyze | No | 0 | Number of top pages to deep-read for content analysis |
| output | No | stdout | Path to save JSON output |
| include-non-blog | No | true | Also catalog landing pages, docs, etc. (not just blog) |

## Cost

- **Sitemap/RSS crawling:** Free (direct HTTP requests)
- **Apify sitemap extractor (fallback):** ~$0.50 per site
- **Deep analysis:** Free (WebFetch on individual pages)

## Process

### Phase 1: Discover All Pages

The script attempts multiple methods to find all pages on a site, in order:

#### A) Sitemap.xml
1. Fetch `https://[domain]/sitemap.xml`
2. If it's a sitemap index, recursively fetch all child sitemaps
3. Common alternate locations: `/sitemap_index.xml`, `/sitemap-index.xml`, `/wp-sitemap.xml`
4. Check `robots.txt` for `Sitemap:` directives

#### B) RSS/Atom Feeds
1. Check `/feed`, `/rss`, `/atom.xml`, `/blog/feed`, etc.
2. Extract posts with titles, dates, and URLs
3. RSS typically only surfaces recent content (last 10-50 posts)

#### C) Blog Index Crawl
1. Fetch `/blog`, `/resources`, `/insights`, `/news`, `/articles`
2. Extract links from the page
3. Follow pagination if present (`/blog/page/2`, `?page=2`, etc.)

#### D) Site: Search (fallback)
1. WebSearch: `site:[domain]` to estimate total indexed pages
2. WebSearch: `site:[domain]/blog` to find blog content
3. WebSearch: `site:[domain] intitle:` to discover page title patterns

#### E) Apify Sitemap Extractor (fallback for JS-heavy sites)
- Actor: `onescales/sitemap-url-extractor`
- Use when sitemap.xml is missing and the site is JS-rendered

### Phase 2: Classify Each Page

For each discovered URL, classify by:

#### Content Type
Classify based on URL patterns and page titles:

| Type | URL Patterns | Examples |
|------|-------------|----------|
| `blog-post` | `/blog/`, `/posts/`, `/articles/` | How-to guides, opinion pieces |
| `case-study` | `/case-study/`, `/customers/`, `/success-stories/` | Customer stories |
| `comparison` | `/vs/`, `/compare/`, `/alternative/` | X vs Y pages |
| `landing-page` | `/solutions/`, `/use-cases/`, `/for-/` | Product marketing pages |
| `docs` | `/docs/`, `/help/`, `/documentation/`, `/api/` | Technical documentation |
| `changelog` | `/changelog/`, `/releases/`, `/whats-new/` | Product updates |
| `pricing` | `/pricing/` | Pricing page |
| `about` | `/about/`, `/team/`, `/careers/` | Company pages |
| `legal` | `/privacy/`, `/terms/`, `/security/` | Legal/compliance |
| `resource` | `/resources/`, `/guides/`, `/ebooks/`, `/webinars/` | Gated/downloadable content |
| `glossary` | `/glossary/`, `/dictionary/`, `/terms/` | SEO glossary pages |
| `integration` | `/integrations/`, `/apps/`, `/marketplace/` | Integration pages |
| `other` | — | Anything else |

#### Topic Cluster
Group by extracting topic signals from URL slugs and titles:
- Extract keywords from URL path segments
- Group similar keywords into clusters (e.g., "aws-cost", "cloud-spending", "finops" → "Cloud Cost Management")
- Use simple keyword co-occurrence for clustering

### Phase 3: Analyze Publishing Patterns

From the dated content (primarily blog posts):
- **Total content pieces** by type
- **Publishing frequency:** Posts per month over last 12 months
- **Trend:** Increasing, decreasing, or stable output
- **Recency:** Date of most recent publish
- **Author diversity:** Unique authors (if extractable from RSS)

### Phase 4: Deep Analysis (Optional)

If `--deep-analyze N` is specified, fetch the top N pages (prioritizing blog posts) and extract:
- **Word count** (approximate)
- **Target keyword** (inferred from title + H1 + URL)
- **Funnel stage:** TOFU (awareness), MOFU (consideration), BOFU (decision)
- **Content depth:** Shallow (<500 words), Medium (500-1500), Deep (1500+)
- **Has images/video:** Boolean
- **Has CTA:** Boolean (detected by common CTA patterns)
- **Internal links count**

### Phase 5: Output

#### JSON Output (default)
```json
{
  "domain": "example.com",
  "crawl_date": "2026-02-25",
  "total_pages": 347,
  "discovery_methods": ["sitemap.xml", "rss"],
  "pages": [
    {
      "url": "https://example.com/blog/reduce-aws-costs",
      "title": "How to Reduce Your AWS Bill by 40%",
      "date": "2025-11-15",
      "type": "blog-post",
      "topic_cluster": "Cloud Cost Optimization",
      "deep_analysis": {
        "word_count": 2100,
        "target_keyword": "reduce aws costs",
        "funnel_stage": "TOFU",
        "content_depth": "deep",
        "has_images": true,
        "has_cta": true
      }
    }
  ],
  "summary": {
    "by_type": {"blog-post": 89, "landing-page": 23, "case-study": 12, ...},
    "by_topic": {"Cloud Cost Optimization": 34, "FinOps": 18, ...},
    "publishing_cadence": {
      "posts_per_month_avg": 4.2,
      "trend": "increasing",
      "most_recent": "2026-02-20"
    }
  }
}
```

#### Markdown Summary (also generated)
```markdown
# Content Inventory: example.com
**Crawled:** 2026-02-25 | **Total pages:** 347

## Content by Type
| Type | Count | % |
|------|-------|---|
| Blog Posts | 89 | 25.6% |
| Landing Pages | 23 | 6.6% |
| ...

## Content by Topic Cluster
| Topic | Posts | Most Recent |
|-------|-------|-------------|
| Cloud Cost Optimization | 34 | 2026-02-20 |
| ...

## Publishing Cadence
- Average: 4.2 posts/month
- Trend: Increasing (3.1 → 5.4 over last 6 months)
- Most recent: 2026-02-20

## Full Catalog
| # | Date | Type | Topic | Title | URL |
|---|------|------|-------|-------|-----|
| 1 | 2026-02-20 | blog-post | Cloud Cost | How to Reduce... | https://... |
```

## Tips

- **Sitemap.xml is the best source.** Most well-maintained sites have one. If missing, it's itself an SEO signal (negative).
- **RSS only shows recent content.** If you need the full catalog, sitemap is essential. RSS is supplementary.
- **Deep analysis is optional but valuable.** Use it when feeding into brand-voice-extractor or when you need funnel stage mapping.
- **JS-rendered sites** may need the Apify fallback. Signs: sitemap.xml returns HTML, or blog page returns mostly JavaScript.
- **Combine with seo-domain-analyzer** to overlay traffic data on the content inventory — see which content actually performs.

## Dependencies

- Python 3.8+
- `requests` library (`pip install requests`)
- `APIFY_API_TOKEN` env var (only for Apify fallback mode)
