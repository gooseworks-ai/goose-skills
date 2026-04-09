---
name: review-site-scraper
description: >
  Scrape product reviews from G2, Capterra, and Trustpilot using Apify.
  Single script with platform dispatch. Use when you need to monitor competitor
  reviews, track product sentiment, or gather customer feedback from review sites.
---

# Review Site Scraper

Scrape product reviews from G2, Capterra, and Trustpilot using platform-specific Apify actors.

## Quick Start

Requires `APIFY_API_TOKEN` env var (or `--token` flag). No external dependencies needed (uses stdlib `urllib`).

```bash
# Trustpilot reviews
python3 skills/capabilities/review-site-scraper/scripts/scrape_reviews.py \
  --platform trustpilot \
  --url "https://www.trustpilot.com/review/example.com" \
  --max-reviews 10 --output summary

# G2 reviews with keyword filter
python3 skills/capabilities/review-site-scraper/scripts/scrape_reviews.py \
  --platform g2 \
  --url "https://www.g2.com/products/example/reviews" \
  --keywords "pricing,support"

# Capterra reviews (uses company name, not URL)
python3 skills/capabilities/review-site-scraper/scripts/scrape_reviews.py \
  --platform capterra \
  --company-name "HubSpot CRM" \
  --max-reviews 20
```

## Supported Platforms

| Platform | Actor | Input | Cost |
|----------|-------|-------|------|
| G2 | `focused_vanguard/g2-reviews-scraper` | `--url` (G2 product page URL) | Free tier available |
| Capterra | `getdataforme/capterra-reviews-scraper-bulk` | `--company-name` (company name, not a URL) | Pay-per-result |
| Trustpilot | `agents/trustpilot-reviews` | `--url` (Trustpilot review page URL) | ~$0.20/1k reviews |

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--platform` | *required* | `g2`, `capterra`, or `trustpilot` |
| `--url` | none | Product review page URL (required for G2 and Trustpilot) |
| `--company-name` | none | Company name to search (Capterra only) |
| `--max-reviews` | 50 | Max reviews to scrape |
| `--keywords` | none | Keywords to filter (comma-separated, OR logic) |
| `--days` | none | Only include reviews from last N days |
| `--output` | json | Output format: `json` or `summary` |
| `--token` | env var | Apify token (prefer `APIFY_API_TOKEN` env var) |
| `--timeout` | 300 | Max seconds for Apify run |

## Normalized Output Schema

All platforms are normalized but each has platform-specific fields.

**G2 output fields:**

```json
{
  "platform": "g2",
  "id": "review-id",
  "product_name": "Product Name",
  "title": null,
  "text": "Review body text",
  "rating": 4,
  "author": "Reviewer Name",
  "author_title": "Job Title",
  "author_company": "Company Name",
  "author_company_size": "51-200",
  "author_industry": "Software",
  "date": "2026-02-18",
  "source": "organic",
  "url": "https://..."
}
```

**Capterra output fields:**

```json
{
  "platform": "capterra",
  "title": "Review title",
  "text": "Review body text",
  "overall_rating": 4,
  "ease_of_use": 5,
  "customer_service": 3,
  "features": 4,
  "author": "Reviewer Name",
  "job_title": "Marketing Manager",
  "industry": "Marketing and Advertising",
  "usage_duration": "1-2 years",
  "date": "2026-02-18",
  "url": "https://..."
}
```

**Trustpilot output fields:**

```json
{
  "platform": "trustpilot",
  "id": "review-id",
  "title": "Review title",
  "text": "Review body text",
  "rating": 4,
  "author": "Reviewer Name",
  "date": "2026-02-18T12:00:00.000Z",
  "experienced_date": "2026-02-15T00:00:00.000Z",
  "likes": 2,
  "input_source": "organic",
  "url": "https://..."
}
```
