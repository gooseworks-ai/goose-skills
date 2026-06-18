---
name: programmatic-seo-spy
description: >
  Reverse-engineer how competitors do programmatic SEO. Detects URL pattern clusters
  (vs/, integrations/, for-{industry}/), estimates page count per pattern, analyzes
  template quality, infers which patterns actually drive traffic, and identifies gaps
  you can exploit. Outputs a competitive pSEO landscape report.
tags: [seo]
---

# Programmatic SEO Competitor Spy

Before building your own programmatic SEO pages, know what your competitors are already doing. This skill crawls competitor sitemaps, detects which URL patterns are programmatic, estimates which ones actually drive traffic, assesses template quality, and finds the gaps they're missing.

**Core principle:** The best pSEO strategy starts with competitive intelligence. If 3 competitors have /vs/ pages and none have /for-{industry}/ pages, that's a signal. This skill turns competitor site structures into strategic intelligence.

## When to Use

- "What programmatic SEO are competitors doing?"
- "Reverse-engineer competitor SEO pages"
- "Which pSEO patterns actually work in our space?"
- "Find pSEO gaps our competitors are missing"
- "Analyze competitor URL structure for SEO patterns"

## Tool Enhancement (Optional)

This skill works with existing capabilities but is dramatically better with domain analytics data that shows actual traffic per URL pattern.

### Agent Prompt to User

> "I can analyze competitor site structures with our existing crawling tools. For the most accurate results — especially knowing which patterns actually drive traffic vs. just existing — I'd recommend connecting a domain analytics API."
>
> **Recommended: DataForSEO** (pay-per-use, ~$0.02-0.05 per domain analysis)
> - Sign up at dataforseo.com → get API login + password
> - Set `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` env vars
>
> **Alternatives that also work:**
> - **SEMrush API** (if you have a subscription) → set `SEMRUSH_API_KEY`
> - **Ahrefs API** (if you have a subscription) → set `AHREFS_API_TOKEN`
> - **SimilarWeb API** (if you have access) → set `SIMILARWEB_API_KEY`
>
> "Want to use one of these, or should I proceed with baseline mode? Baseline will detect patterns and assess template quality, but traffic estimates will be inferred rather than measured."

### Mode Selection

- **Enhanced mode** — Domain analytics API provides organic keywords and estimated traffic per URL. Enables confident "this pattern drives X traffic" conclusions. Can show which specific pages within a pattern rank well.
- **Baseline mode** — Uses `site-content-catalog` for URL crawling, `seo-domain-analyzer` for domain-level metrics, `web_search` for spot-checking rankings. Pattern detection is equally good. Traffic attribution is directional, based on page count × domain authority × keyword indicators.

## Phase 0: Intake

1. **Competitors** — 1-5 competitor URLs to analyze
2. **Your product URL** — So we can compare coverage
3. **Category** — What market/category are these competitors in?
4. **Specific interest?** — Looking for anything specific (vs/ pages, integrations, etc.) or full analysis?
5. **Tool preference** — Enhanced mode with domain analytics API, or baseline? (see Tool Enhancement above)

## Phase 1: Sitemap Crawl

For each competitor, run `site-content-catalog`:

```bash
python3 skills/site-content-catalog/scripts/catalog_content.py \
  --url "<competitor_url>" \
  --output json
```

Collect:
- All URLs from sitemap and internal crawl
- Page titles
- URL structure/hierarchy
- Last modified dates (if available)

## Phase 2: Pattern Detection

### 2A: URL Clustering

Group URLs by structural patterns using regex matching:

| Pattern Regex | Example URLs | Category |
|--------------|-------------|----------|
| `/vs/.*` or `/compare/.*` | /vs/competitor-a, /vs/competitor-b | Comparison |
| `/integrations?/.*` | /integrations/slack, /integrations/hubspot | Integration |
| `/for-.*` or `/solutions/.*` | /for-startups, /for-enterprise | Vertical |
| `/use-cases?/.*` | /use-cases/project-management | Use case |
| `/alternatives?(-to)?/.*` | /alternatives/competitor-a | Alternatives |
| `/templates?/.*` or `/examples?/.*` | /templates/invoice, /templates/proposal | Templates |
| `/glossary/.*` or `/what-is/.*` | /glossary/term-a, /what-is/crm | Glossary |
| `/tools?/.*` or `/calculat(or|e)/.*` | /tools/roi-calculator | Tools |
| `/blog/.*` (exclude from pSEO) | /blog/how-to-x | Editorial (not pSEO) |

For each detected pattern:
- **Page count** — How many pages follow this pattern?
- **Data axis** — What varies per page? (competitor name, tool name, industry, etc.)
- **URL consistency** — Are URLs cleanly structured or messy?
- **Coverage completeness** — Have they covered the obvious variations?

### 2B: Programmatic vs. Editorial Classification

Not every URL pattern is programmatic. Classify each cluster:

- **Programmatic** — Clearly templated: consistent URL structure, similar page titles following a pattern, high page count, structured content
- **Semi-programmatic** — Template with heavy manual customization
- **Editorial** — Individually written, no template pattern
- **Auto-generated** — Thin/low-quality programmatic (tag pages, archive pages)

Focus analysis on Programmatic and Semi-programmatic clusters only.

## Phase 3: Traffic & Performance Analysis

### Enhanced Mode (DataForSEO / SEMrush / Ahrefs)

For each competitor domain, pull organic keywords data:

```
# DataForSEO example
POST /v3/dataforseo_labs/google/ranked_keywords/live
{
  "target": "competitor.com",
  "filters": [
    ["ranked_serp_element.serp_item.url", "contains", "/vs/"]
  ]
}
```

Per pattern cluster:
- **Total ranking keywords** across all pages in the pattern
- **Estimated monthly organic traffic** to the pattern
- **Average ranking position** for pages in this pattern
- **Top-performing pages** within the pattern (which variations rank best?)
- **Keyword difficulty** distribution (are they targeting easy or hard keywords?)

### Baseline Mode

Estimate traffic indicators:
- Run `seo-domain-analyzer` for overall domain metrics
- Spot-check 3-5 pages per pattern via `web_search` — do they appear in top 10?
- Check if pages are indexed (site:competitor.com/vs/)
- Infer relative traffic: pattern page count × indexation rate × domain authority proxy
- Note: these are directional estimates, not exact numbers

## Phase 4: Template Quality Assessment

For each programmatic pattern, fetch 3-5 sample pages via `fetch_webpage`:

```bash
# Pick pages from the pattern — one high-variation, one low-variation, one middle
```

Evaluate template quality on:

| Dimension | Score 1-5 | What to Look For |
|-----------|-----------|-----------------|
| **Content depth** | | Word count, sections, detail level |
| **Unique value per page** | | Does each page offer something you can't get from the template alone? |
| **Data richness** | | Tables, comparisons, stats, screenshots |
| **Freshness signals** | | Updated dates, current pricing, recent reviews |
| **Internal linking** | | Links to related pages, hub structure |
| **CTA integration** | | Contextual CTAs vs. generic banners |
| **Schema markup** | | Structured data, FAQ schema, review schema |

**Quality tiers:**
- **4-5 avg:** Well-executed pSEO — hard to beat without significant differentiation
- **3-4 avg:** Decent but improvable — opportunity to out-template them
- **1-3 avg:** Thin/low-quality — easy to dominate with better content

## Phase 5: Gap Analysis

### 5A: Pattern Coverage Matrix

| Pattern Type | Competitor A | Competitor B | Competitor C | You | Gap? |
|-------------|-------------|-------------|-------------|-----|------|
| vs/ comparisons | 25 pages ★★★★ | 10 pages ★★★ | 0 | 0 | ✓ A leads |
| integrations/ | 40 pages ★★★ | 60 pages ★★★★ | 20 pages ★★ | 0 | ✓ B leads |
| for-{industry}/ | 0 | 0 | 8 pages ★★ | 0 | ✓ Wide open |
| alternatives/ | 5 pages ★★★ | 0 | 0 | 0 | ✓ Lightly competed |
| glossary/ | 100 pages ★★ | 0 | 50 pages ★★★ | 0 | ⚠️ Volume play |

### 5B: Variation Gaps

Within each pattern competitors use, find missing variations:
- Competitors they haven't written vs/ pages for
- Integrations they support but haven't built pages for
- Industries they serve but haven't targeted
- These are your quick-win entries

### 5C: Pattern White Space

Entire pattern types no competitor has built:
- Highest opportunity — no one to outrank, first-mover advantage
- Validate search demand exists (Phase 1D of programmatic-seo-planner)

### 5D: Quality Gaps

Patterns where competitors have pages but they're low quality:
- Thin content (< 500 words, no unique data)
- Outdated (old screenshots, wrong pricing)
- Missing schema markup
- No visual differentiation between pages
- These are "out-template" opportunities

## Phase 6: Output

```markdown
# Programmatic SEO Competitive Landscape — [Category] — [DATE]

## Competitors Analyzed
- [Competitor A] — [domain metrics, total pages crawled]
- [Competitor B] — [domain metrics, total pages crawled]
- [Competitor C] — [domain metrics, total pages crawled]

## Executive Summary
- [N] programmatic patterns detected across [M] competitors
- Strongest competitor pSEO: [Competitor X] with [pattern] ([N] pages, [quality])
- Biggest opportunity: [pattern type] — [reasoning]
- Quick wins: [N] variation gaps in existing competitor patterns

---

## Pattern-by-Pattern Analysis

### Pattern: [vs/ Comparisons]
**Who's doing it:** [Competitor A (25 pages, ★★★★), Competitor B (10 pages, ★★★)]
**Traffic estimate:** [X monthly visits across pattern] (enhanced) / [directional estimate] (baseline)
**Template quality:** [summary of strengths/weaknesses]
**Top-performing pages:** [specific pages that rank well]
**Variation gaps:** [competitors/variations they're missing]
**Your opportunity:** [specific recommendation]

### Pattern: [integrations/]
...

---

## Opportunity Ranking

| Priority | Pattern | Opportunity Type | Effort | Expected Impact |
|----------|---------|-----------------|--------|----------------|
| P0 | [pattern] | White space — no competitors | Medium | High |
| P0 | [pattern] | Quality gap — beat weak templates | Low | Medium |
| P1 | [pattern] | Variation gap — fill missing pages | Low | Medium |
| P2 | [pattern] | Head-to-head — outrank strong competitor | High | High |

---

## Recommended Action Plan

1. **Immediate (Week 1-2):** Build [pattern] — [rationale]
2. **Short-term (Month 1):** Build [pattern] — [rationale]
3. **Medium-term (Month 2-3):** Build [pattern] — [rationale]

---

## Raw Data
[Link to crawl data, pattern clusters, sample pages analyzed]
```

Save to the current working directory or wherever the user prefers.

## Cost

| Component | Cost |
|-----------|------|
| Site catalog per competitor (Apify) | ~$0.05-0.10 |
| SEO domain analyzer per competitor | ~$0.10-0.20 |
| Page fetches (3-5 per pattern × N patterns) | ~$0.01-0.05 |
| DataForSEO domain analytics (enhanced) | ~$0.10-0.50 per competitor |
| Analysis | Free (LLM reasoning) |
| **Total (baseline, 3 competitors)** | **~$0.50-1.00** |
| **Total (enhanced, 3 competitors)** | **~$0.80-2.00** |

## Tools Required

- **Apify API token** — `APIFY_API_TOKEN` env var
- **Upstream skills:** `site-content-catalog`, `seo-domain-analyzer`, `fetch_webpage`
- **Optional (enhanced):** DataForSEO (`DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`), SEMrush (`SEMRUSH_API_KEY`), Ahrefs (`AHREFS_API_TOKEN`), or SimilarWeb (`SIMILARWEB_API_KEY`)

## Trigger Phrases

- "What pSEO are competitors doing?"
- "Reverse-engineer competitor programmatic pages"
- "Analyze competitor URL structure"
- "Find pSEO gaps in our space"
- "What comparison pages do competitors have?"
