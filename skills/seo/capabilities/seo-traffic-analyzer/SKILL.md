---
name: seo-traffic-analyzer
description: >
  Analyze a website's SEO visibility, keyword rankings, traffic estimates, and
  competitive positioning. Uses web search probes, SimilarWeb (free tier via web),
  and site: queries to build an SEO profile without requiring paid tool subscriptions.
  Useful for competitive intel, gap analysis, and reverse-engineering a company's
  organic acquisition strategy.
tags: [competitive-intel, seo]
---

# SEO & Traffic Analyzer

Analyze a website's organic search visibility, estimate traffic, and map competitive positioning — all without paid SEO tool subscriptions. Uses web search probes, public data sources, and site: queries to build a comprehensive SEO profile.

## Quick Start

```
Analyze SEO and traffic for [domain]. Check rankings for [keywords]. Compare against [competitors].
```

Example:
```
Analyze SEO and traffic for pump.co.
Check rankings for: AWS cost optimization, cloud cost reduction, reduce AWS bill, FinOps tools, AWS savings plans automation.
Compare against: vantage.sh, antimetal.com, prosperops.com, zesty.co, nops.io.
```

## Inputs

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| target-domain | Yes | — | Domain to analyze (e.g., "pump.co") |
| competitor-domains | No | none | Comma-separated competitor domains to compare |
| target-keywords | No | auto-inferred | Keywords to check rankings for |
| output-path | No | stdout | Where to save the analysis |

## Cost

Free — uses only WebSearch and WebFetch (no paid SEO tool APIs).

## Process

### Phase 1: Site Indexation & Structure

Assess the site's SEO footprint using site: queries.

**Searches to run:**
- `site:[domain]` — Estimate total indexed pages
- `site:[domain] blog` — Find blog content
- `site:[domain] intitle:` — See page title patterns
- `site:[domain]/pricing` or `site:[domain]/features` — Key conversion pages
- `site:[domain] filetype:pdf` — Whitepapers, guides (content marketing signal)

**What to extract:**
- Approximate number of indexed pages
- Content categories (blog, docs, landing pages, comparison pages)
- URL structure patterns
- Presence of key conversion pages (pricing, demo, signup)

### Phase 2: Keyword Ranking Probes

Check where the target ranks for important keywords. For each keyword:

**Technique:** Run a WebSearch for the keyword and scan results for the target domain.

**Standard keyword categories to check:**

#### A) Brand keywords
- `[company name]`
- `[company name] review`
- `[company name] alternative`
- `[company name] vs [competitor]`
- `[company name] pricing`

#### B) Product/category keywords
- `[primary category]` (e.g., "cloud cost optimization")
- `[primary category] tools`
- `[primary category] platform`
- `[primary category] software`
- `best [primary category]`

#### C) Problem/pain keywords
- `[core problem]` (e.g., "reduce AWS bill")
- `how to [solve problem]`
- `[problem] for startups`
- `[problem] free tool`

#### D) Competitor comparison keywords
- `[competitor] alternative`
- `[competitor] vs [target]`
- `[competitor] pricing`

For each search, note:
- Does the target appear on page 1? (positions 1-10)
- What position approximately?
- What page/URL ranks?
- Who else ranks for this term? (competitive landscape)

### Phase 3: Traffic Estimation

Gather traffic signals from multiple sources:

#### A) SimilarWeb (free tier)
- WebFetch `https://www.similarweb.com/website/[domain]/`
- Extract: estimated monthly visits, top traffic sources, geographic distribution, bounce rate

#### B) Search volume inference
- For keywords where the target ranks well, estimate search volume:
  - WebSearch: `"[keyword]" search volume` or check Google Trends
  - High-ranking keywords with high volume = significant organic traffic

#### C) Social/referral signals
- WebSearch: `"[domain]" -site:[domain]` — Count and categorize referring sites
- Look for directory listings, review sites, blog mentions, social shares

#### D) Wayback Machine snapshot frequency
- WebFetch `https://web.archive.org/web/*/[domain]` — More frequent snapshots often correlate with higher traffic/importance

### Phase 4: Backlink & Authority Signals

Estimate domain authority through proxy signals:

- **Who links to them?** WebSearch: `"[domain]" -site:[domain]` and categorize sources
- **Press mentions:** WebSearch: `"[company name]" (TechCrunch OR VentureBeat OR Forbes OR "Business Insider")`
- **Industry recognition:** WebSearch: `"[company name]" (award OR "named" OR "recognized" OR "leader")`
- **Directory presence:** Check for listings on G2, Capterra, Product Hunt, AlternativeTo, AWS Marketplace

### Phase 5: Competitive Comparison

For each competitor domain, repeat a subset of the above analysis:

- `site:[competitor]` — Indexed pages count
- Check the same target keywords — who ranks where?
- Compare content strategies (blog frequency, topics)

Build a comparison matrix:

| Keyword | [Target] Position | [Competitor 1] | [Competitor 2] | ... |
|---------|-------------------|-----------------|-----------------|-----|

### Phase 6: Content Gap Analysis

Identify keywords and topics where competitors rank but the target doesn't:

- For each competitor, run: `site:[competitor] [keyword]` for keywords where target is absent
- WebSearch for `[category] + [topic]` and note which competitors appear but target doesn't
- Identify high-value content types competitors have that target lacks:
  - Comparison pages ("X vs Y")
  - Use case pages
  - ROI calculators / interactive tools
  - Integration pages
  - Customer stories / case studies
  - Glossary / educational content

### Phase 7: Output

Generate a comprehensive SEO report:

```markdown
# SEO & Traffic Analysis: [domain]
**Date:** YYYY-MM-DD
**Competitors analyzed:** [list]

## Executive Summary
[2-3 sentence overview of SEO posture]

## Site Indexation
- Estimated indexed pages: X
- Content categories: [list]
- Key pages: [list]

## Keyword Rankings
### Brand Keywords
| Keyword | Position | URL | Notes |
|---------|----------|-----|-------|

### Category Keywords
| Keyword | Position | URL | Top Competitors |
|---------|----------|-----|-----------------|

### Problem Keywords
| Keyword | Position | URL | Top Competitors |
|---------|----------|-----|-----------------|

## Traffic Estimates
- Estimated monthly visits: X
- Top traffic sources: [organic, direct, referral, social, paid]
- Geographic breakdown: [if available]

## Competitive Comparison
| Metric | [Target] | [Comp 1] | [Comp 2] | ... |
|--------|----------|----------|----------|-----|
| Indexed pages | | | | |
| Blog posts (est.) | | | | |
| Ranks for X keywords | | | | |

## Content Gaps & Opportunities
1. [Gap 1]: Competitors rank for X but target doesn't
2. [Gap 2]: No comparison pages exist
3. [Gap 3]: Missing content type

## SEO Strategy Assessment
### Strengths
### Weaknesses
### Opportunities
### Threats

## Recommendations
1. [Priority action 1]
2. [Priority action 2]
...
```

## Tips

- **Run quarterly** per client to track SEO progress
- **Brand keyword monitoring** is especially important — if competitors bid on your brand, you'll see it
- **Content gap analysis** directly feeds into content strategy recommendations
- **Comparison pages** are often the highest-ROI SEO content for B2B SaaS
- **This skill works without paid tools** but results from tools like Ahrefs/SEMrush will be more precise. If you have access to those, supplement this analysis with their data.
- **Combine with `industry-scanner`** to correlate SEO gaps with industry trends
- **SimilarWeb free tier** is rate-limited — if blocked, fall back to other estimation methods

## Limitations

- Traffic estimates are rough approximations without paid tools
- Exact keyword positions can't be determined — only presence/absence on page 1
- Backlink analysis is limited to what's discoverable via web search
- Results may vary by geography and personalization

## AI Agent Integration

When using this skill as an agent:

1. User provides target domain, optional competitors, optional keywords
2. Agent auto-infers relevant keywords from the domain's content if not provided
3. Agent runs all phases, collecting data into a structured report
4. Agent highlights the most actionable findings
5. User decides which gaps to address
6. Agent can chain to content creation or `sponsored-newsletter-finder` for distribution

**Example prompt:**
> "Analyze pump.co's SEO. Compare against vantage.sh, antimetal.com, prosperops.com. Check if they rank for cloud cost optimization keywords."
