---
name: product-hunt-scraper
description: >
  Scrape Product Hunt trending products using Apify. Use when you need to discover
  new product launches, track competitors on Product Hunt, or monitor the startup
  ecosystem for relevant launches.
---

# Product Hunt Scraper

Scrape trending products from Product Hunt using the Apify `maximedupre/product-hunt-scraper` actor.

**Output fields:** Each product has `name`, `tagline`, `description`, `url` (Product Hunt URL), and additional fields depending on the actor's output.

## Quick Start

Requires `APIFY_API_TOKEN` env var (or `--token` flag).

```bash
# Today's top products
python3 skills/product-hunt-scraper/scripts/scrape_producthunt.py \
  --time-period daily --max-products 10 --output summary

# This week's products filtered by keyword
python3 skills/product-hunt-scraper/scripts/scrape_producthunt.py \
  --time-period weekly --keywords "AI,marketing" --output summary

# Monthly top products as JSON
python3 skills/product-hunt-scraper/scripts/scrape_producthunt.py \
  --time-period monthly --max-products 50
```

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--time-period` | weekly | `daily`, `weekly`, or `monthly` |
| `--max-products` | 50 | Max products to scrape |
| `--keywords` | none | Keywords to filter (comma-separated, OR logic) |
| `--output` | json | Output format: `json` or `summary` |
| `--token` | env var | Apify token (prefer `APIFY_API_TOKEN` env var) |
| `--timeout` | 300 | Max seconds to wait for the Apify run |

## Notes

- Keyword filtering is client-side on product name + tagline + description
- Results are sorted by upvote count (descending)
