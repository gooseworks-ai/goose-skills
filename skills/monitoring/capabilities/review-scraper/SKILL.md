---
name: review-scraper
description: >
  Scrape product reviews from G2, Capterra, and Trustpilot using Apify.
  Single script with platform dispatch. Use when you need to monitor competitor
  reviews, track product sentiment, or gather customer feedback from review sites.
---

# Review Scraper

Scrape product reviews from G2, Capterra, and Trustpilot using platform-specific Apify actors.

## Quick Start

Requires `APIFY_API_TOKEN` env var (or `--token` flag). Install dependency: `pip install requests`.

```bash
# Trustpilot reviews
python3 skills/review-scraper/scripts/scrape_reviews.py \
  --platform trustpilot \
  --url "https://www.trustpilot.com/review/example.com" \
  --max-reviews 10 --output summary

# G2 reviews with keyword filter
python3 skills/review-scraper/scripts/scrape_reviews.py \
  --platform g2 \
  --url "https://www.g2.com/products/example/reviews" \
  --keywords "pricing,support"

# Capterra reviews
python3 skills/review-scraper/scripts/scrape_reviews.py \
  --platform capterra \
  --url "https://www.capterra.com/p/12345/Example"
```

## Supported Platforms

| Platform | Actor | Cost |
|----------|-------|------|
| G2 | `zen-studio/g2-reviews-scraper` | Free tier available |
| Capterra | `imadjourney/capterra-reviews-scraper` | Pay-per-result |
| Trustpilot | `agents/trustpilot-reviews` | ~$0.20/1k reviews |

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--platform` | *required* | `g2`, `capterra`, or `trustpilot` |
| `--url` | *required* | Product review page URL |
| `--max-reviews` | 50 | Max reviews to scrape |
| `--keywords` | none | Keywords to filter (comma-separated, OR logic) |
| `--days` | none | Only include reviews from last N days |
| `--output` | json | Output format: `json` or `summary` |
| `--token` | env var | Apify token (prefer `APIFY_API_TOKEN` env var) |
| `--timeout` | 300 | Max seconds for Apify run |

## Normalized Output Schema

All platforms are normalized to the same schema:

```json
{
  "platform": "trustpilot",
  "title": "Review title",
  "text": "Review body text",
  "rating": 4,
  "author": "Reviewer Name",
  "date": "2026-02-18",
  "pros": "What they liked (G2/Capterra only)",
  "cons": "What they disliked (G2/Capterra only)",
  "url": "https://..."
}
```
