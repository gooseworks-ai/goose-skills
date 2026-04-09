---
name: seo-domain-analyzer
description: >
  Pull real SEO metrics for any domain using Apify scrapers for Semrush and Ahrefs
  data. Gets domain authority, organic traffic estimates, keyword rankings, backlink
  profiles, top performing pages, and auto-discovers competitors from keyword overlap.
  No Semrush/Ahrefs subscription needed — uses Apify actors that scrape public pages.
tags: [competitive-intel, seo]
---

# SEO Domain Analyzer

Pull real SEO performance data for any domain — no Semrush or Ahrefs subscription needed. Uses Apify actors that scrape Semrush/Ahrefs public pages to get authority scores, traffic estimates, keyword rankings, backlink profiles, and competitor discovery.

## Quick Start

```bash
# Basic domain analysis
python3 scripts/analyze_domain.py --domain "example.com"

# With competitor comparison
python3 scripts/analyze_domain.py \
  --domain "example.com" \
  --competitors "competitor1.com,competitor2.com,competitor3.com"

# Check specific keywords
python3 scripts/analyze_domain.py \
  --domain "example.com" \
  --keywords "cloud cost optimization,reduce aws bill,finops tools"

# Save output
python3 scripts/analyze_domain.py \
  --domain "example.com" --output seo-profile.json
```

## Inputs

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| domain | Yes | — | Domain to analyze (e.g., "example.com") |
| competitors | No | auto-discovered | Comma-separated competitor domains |
| keywords | No | auto-inferred | Specific keywords to check rankings for |
| output | No | stdout | Path to save JSON output |
| skip-backlinks | No | false | Skip Ahrefs backlink analysis (saves ~$0.10) |

## Cost

| Data Source | Apify Actor | Est. Cost |
|-------------|------------|-----------|
| Domain overview (Semrush) | `devnaz/semrush-scraper` | ~$0.10/domain |
| Backlink profile (Ahrefs) | `radeance/ahrefs-scraper` | ~$0.10/domain |
| Keyword rank checks | `apify/google-search-scraper` | ~$0.002/keyword |
| **Typical full run** | | **~$0.50-1.00** |
| **With 3 competitors** | | **~$1.50-3.00** |

## Process

### Phase 1: Domain Overview (Semrush Data)

Use Apify actor `devnaz/semrush-scraper` to get:

```python
# Actor: devnaz/semrush-scraper
# Input: domain URL
{
    "urls": ["https://example.com"]
}
```

**Extracted metrics:**
- **Authority Score** (0-100)
- **Organic monthly traffic** estimate
- **Organic keywords count** (how many keywords the domain ranks for)
- **Paid traffic** estimate (if any)
- **Backlinks count** (Semrush's count)
- **Referring domains count**
- **Top organic keywords** (keyword, position, traffic share)
- **Top competitors** (competing domains by keyword overlap)
- **Traffic trend** (month-over-month direction)

### Phase 2: Backlink Profile (Ahrefs Data)

Use Apify actor `radeance/ahrefs-scraper` to get:

```python
# Actor: radeance/ahrefs-scraper
# Input: domain for backlink analysis
{
    "urls": ["https://example.com"],
    "mode": "domain-overview"
}
```

**Extracted metrics:**
- **Domain Rating (DR)** (0-100)
- **URL Rating** of homepage
- **Referring domains** count and trend
- **Backlinks** total count
- **Top referring domains** (which sites link to them)
- **Anchor text distribution** (branded vs keyword vs generic)
- **Dofollow vs nofollow ratio**

### Phase 3: Keyword Rank Verification

For specific keywords (user-provided or auto-inferred from Phase 1), verify actual rankings using Google search:

```python
# Actor: apify/google-search-scraper
# Input: keyword queries
{
    "queries": "cloud cost optimization",
    "maxPagesPerQuery": 1,
    "resultsPerPage": 10,
    "countryCode": "us",
    "languageCode": "en"
}
```

**For each keyword:**
- Does the target domain appear in top 10?
- What position?
- What specific URL ranks?
- Who else ranks? (competitive landscape for that keyword)

**Keyword sources (in priority order):**
1. User-provided keywords
2. Top organic keywords from Semrush data (Phase 1)
3. Auto-inferred from domain content (WebSearch `site:[domain]` to see page titles)

### Phase 4: Top Pages Analysis

From the Semrush data, extract the highest-traffic pages:
- URL
- Estimated monthly traffic
- Primary keyword(s) driving traffic
- Number of ranking keywords

If Semrush doesn't provide per-page data, supplement with:
- WebSearch: `site:[domain]` and note which pages appear first (proxy for importance)
- WebSearch: `site:[domain] blog` for top blog content

### Phase 5: Competitor Discovery

Competitors are identified from multiple sources:

1. **Semrush competitor data** (Phase 1) — domains competing for same keywords
2. **User-provided competitors** — always included
3. **Google SERP competitors** — from Phase 3 keyword checks, note which domains consistently appear

For each competitor, run a lighter version of Phase 1 (domain overview only):
- Authority score
- Organic traffic estimate
- Keyword count
- Top keywords

### Phase 6: Output

#### JSON Output
```json
{
  "domain": "example.com",
  "analysis_date": "2026-02-25",
  "domain_metrics": {
    "semrush_authority_score": 45,
    "ahrefs_domain_rating": 52,
    "organic_monthly_traffic": 28500,
    "organic_keywords": 1240,
    "backlinks": 8930,
    "referring_domains": 412,
    "traffic_trend": "increasing"
  },
  "top_pages": [
    {
      "url": "https://example.com/blog/reduce-aws-costs",
      "estimated_traffic": 3200,
      "top_keyword": "reduce aws costs",
      "ranking_keywords": 45
    }
  ],
  "keyword_rankings": [
    {
      "keyword": "cloud cost optimization",
      "position": 4,
      "url": "https://example.com/blog/cloud-cost-optimization-guide",
      "serp_competitors": ["vantage.sh", "antimetal.com", "finout.io"]
    }
  ],
  "backlink_profile": {
    "domain_rating": 52,
    "total_backlinks": 8930,
    "referring_domains": 412,
    "dofollow_ratio": 0.78,
    "top_referring_domains": ["techcrunch.com", "producthunt.com", ...],
    "anchor_text_distribution": {
      "branded": 0.45,
      "keyword": 0.22,
      "generic": 0.18,
      "url": 0.15
    }
  },
  "competitors": [
    {
      "domain": "competitor1.com",
      "authority_score": 62,
      "organic_traffic": 45000,
      "organic_keywords": 2100,
      "keyword_overlap": 340
    }
  ]
}
```

#### Markdown Summary (also generated)
```markdown
# SEO Domain Profile: example.com
**Date:** 2026-02-25

## Domain Metrics
| Metric | Value |
|--------|-------|
| Semrush Authority Score | 45/100 |
| Ahrefs Domain Rating | 52/100 |
| Monthly Organic Traffic | ~28,500 |
| Organic Keywords | 1,240 |
| Backlinks | 8,930 |
| Referring Domains | 412 |
| Traffic Trend | Increasing |

## Top Performing Pages
| # | URL | Est. Traffic | Top Keyword |
|---|-----|-------------|-------------|
| 1 | /blog/reduce-aws-costs | 3,200 | reduce aws costs |
| ... |

## Keyword Rankings
| Keyword | Position | URL | SERP Competitors |
|---------|----------|-----|-----------------|
| cloud cost optimization | #4 | /blog/cloud-cost... | vantage.sh, antimetal.com |
| ... |

## Backlink Profile
- Domain Rating: 52/100
- Referring Domains: 412
- Dofollow Ratio: 78%
- Top linking sites: TechCrunch, Product Hunt, ...

## Competitor Comparison
| Domain | Authority | Traffic | Keywords | Overlap |
|--------|-----------|---------|----------|---------|
| example.com | 45 | 28.5K | 1,240 | — |
| competitor1.com | 62 | 45K | 2,100 | 340 |
| ... |
```

## Tips

- **Semrush scraper data quality varies.** The Apify actors scrape public Semrush pages, which show limited data for non-subscribers. Traffic estimates and top keywords are available, but detailed per-page breakdowns may be partial.
- **Combine with site-content-catalog** to get both the content inventory AND performance data — together they tell you what content exists AND which pieces actually drive traffic.
- **Keyword rank verification via Google** is the most reliable data point. Semrush/Ahrefs estimates can be off, but checking actual SERPs gives ground truth.
- **Run competitors lighter.** Full backlink analysis on 5 competitors gets expensive. Domain overview (Semrush only) is usually sufficient for comparison.
- **Apify actors may break.** These scrape Semrush/Ahrefs public pages, which can change. If an actor fails, fall back to the free `seo-traffic-analyzer` skill which uses web search probes.

## Fallback: Free Mode

If `APIFY_API_TOKEN` is not set or Apify actors fail, the script falls back to:
1. WebSearch probes (like `seo-traffic-analyzer` skill)
2. `site:[domain]` for indexed page count
3. SimilarWeb free tier for traffic estimates
4. Manual Google SERP checks for keyword rankings

This gives less precise data but still produces a useful report.

## Dependencies

- Python 3.8+
- `requests` library
- `APIFY_API_TOKEN` env var (for Apify mode; falls back to free probes without it)
