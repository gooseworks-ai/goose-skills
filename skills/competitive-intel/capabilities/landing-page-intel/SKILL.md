---
name: landing-page-intel
description: >
  Extract competitor and customer intelligence from any company's landing page HTML.
  Discovers tech stack, analytics tools, ad pixels, customer logos, SEO metadata,
  CTAs, hidden elements, and more. No API keys required.
---

# Landing Page Intel

Extract GTM-relevant intelligence from any company's landing page by scraping its HTML source.

## Quick Start

Only dependency is `pip install requests`. No API key needed.

```bash
# Basic scan of a single URL
python3 skills/landing-page-intel/scripts/scrape_landing_page.py \
  --url "https://example.com"

# Scan multiple pages of the same site
python3 skills/landing-page-intel/scripts/scrape_landing_page.py \
  --url "https://example.com" --pages "/,/pricing,/about"

# Output as summary table instead of JSON
python3 skills/landing-page-intel/scripts/scrape_landing_page.py \
  --url "https://example.com" --output summary

# Save full report to file
python3 skills/landing-page-intel/scripts/scrape_landing_page.py \
  --url "https://example.com" --output json > report.json
```

## What It Extracts

| Category | Details |
|----------|---------|
| **Tech Stack** | Analytics (GA4, Mixpanel, Amplitude, PostHog, Heap), marketing automation (HubSpot, Marketo, Pardot), chat widgets (Intercom, Drift, Crisp, Zendesk), A/B testing (Optimizely, VWO, LaunchDarkly), session recording (Hotjar, FullStory, LogRocket), CDPs (Segment, Clearbit, 6sense) |
| **Ad Pixels** | Meta Pixel, Google Ads, LinkedIn Insight Tag, TikTok pixel, Twitter pixel |
| **Customer Logos** | Image URLs from "trusted by" / logo carousel sections, grouped by directory |
| **SEO Metadata** | Title, meta description, Open Graph tags, Twitter Cards, canonical URL, structured data (JSON-LD), hreflang tags |
| **CTAs & Sales Motion** | All CTA button text and links — reveals PLG vs sales-led motion |
| **Social Proof** | Testimonials, customer counts, case study links, badge images |
| **Integrations** | Links to integration/partner pages, embedded third-party widgets |
| **Hidden Elements** | Content in `display:none`, `hidden`, or HTML comments that may reveal upcoming features |
| **Infrastructure** | CMS platform (Webflow, WordPress, Next.js, etc.), detected from HTML signatures |

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--url` | *required* | Target website URL |
| `--pages` | `/` | Comma-separated paths to scan (e.g., `/,/pricing,/about`) |
| `--output` | `json` | Output format: `json` or `summary` |
| `--timeout` | `15` | Request timeout in seconds |

## GTM Use Cases

- **Competitive intel**: See what tools competitors use, how they position, who their customers are
- **Prospect research**: Before a sales call, scan a prospect's site to understand their stack and maturity
- **Market mapping**: Scan multiple competitors to compare positioning, customer segments, and GTM motions
- **Customer discovery**: Extract competitor customer logos as potential prospects for your own product

## Cost

Free. No API keys required. Uses only HTTP requests to fetch public HTML.
