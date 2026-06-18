---
name: meta-ad-scraper
description: Scrape competitor ads from Meta's Ad Library (Facebook, Instagram, Messenger, Threads, WhatsApp). Search by company name, Facebook Page URL, or keyword. Returns ad creatives, spend estimates, reach, impressions, and campaign details. Use for competitive ad research, messaging analysis, and creative inspiration.
---

# Meta Ad Library Scraper

Scrape ads from Meta's Ad Library using the Apify `apify/facebook-ads-scraper` actor. Covers Facebook, Instagram, Messenger, Threads, and WhatsApp.

## Quick Start

Requires `APIFY_API_TOKEN` env var (or `--token` flag). Install dependency: `pip install requests`.

```bash
# Search ads by company name
python3 skills/meta-ad-scraper/scripts/search_meta_ads.py \
  --company "Nike"

# Search with country filter
python3 skills/meta-ad-scraper/scripts/search_meta_ads.py \
  --company "Shopify" --country US

# Search by keyword (broader than company name)
python3 skills/meta-ad-scraper/scripts/search_meta_ads.py \
  --company "project management software"

# Limit results
python3 skills/meta-ad-scraper/scripts/search_meta_ads.py \
  --company "HubSpot" --max-ads 20

# Search by Facebook Page URL directly
python3 skills/meta-ad-scraper/scripts/search_meta_ads.py \
  --page-url "https://www.facebook.com/nike"

# Only active ads (default), or all ads
python3 skills/meta-ad-scraper/scripts/search_meta_ads.py \
  --company "Salesforce" --ad-status all

# Human-readable summary
python3 skills/meta-ad-scraper/scripts/search_meta_ads.py \
  --company "Stripe" --output summary
```

## How It Works

1. Takes a company name, keyword, or Facebook Page URL
2. Constructs a Meta Ad Library URL with the search query and filters
3. Calls the Apify `apify/facebook-ads-scraper` actor via REST API
4. Polls until the run completes, then fetches the dataset
5. Parses and outputs ad data as JSON or human-readable summary

## Resolving Company Name → Ads

The script handles the advertiser lookup automatically:
- **Company name**: Constructs a search URL like `facebook.com/ads/library/?q=CompanyName` — the Apify actor searches Meta's Ad Library for matching advertisers
- **Page URL**: If you have the Facebook Page URL, pass it via `--page-url` for exact matching
- **Domain**: You can also pass a domain and the script will search for it

No need to manually find Page IDs. The Apify actor resolves the search internally.

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--company` | *required** | Company name or keyword to search |
| `--page-url` | none | Facebook Page URL for exact advertiser match |
| `--country` | ALL | 2-letter country code (US, GB, DE, etc.) or ALL |
| `--ad-status` | active | `active` or `all` (includes inactive) |
| `--max-ads` | 50 | Maximum number of ads to return |
| `--output` | json | Output format: `json` or `summary` |
| `--token` | env var | Apify token (prefer `APIFY_API_TOKEN` env var) |
| `--timeout` | 300 | Max seconds to wait for the Apify run |

*Either `--company` or `--page-url` is required.

## Output Fields

Each ad in the output contains:

```json
{
  "ad_id": "123456789",
  "page_name": "Nike",
  "page_id": "123456789",
  "ad_text": "Just Do It. Shop the latest...",
  "ad_creative_link_title": "Nike.com",
  "ad_creative_link_description": "Free shipping on orders...",
  "ad_creative_link_url": "https://nike.com/...",
  "image_url": "https://...",
  "video_url": "https://...",
  "ad_delivery_start_time": "2026-01-15",
  "ad_delivery_stop_time": null,
  "currency": "USD",
  "spend_lower": 100,
  "spend_upper": 499,
  "impressions_lower": 1000,
  "impressions_upper": 4999,
  "platforms": ["facebook", "instagram"],
  "status": "ACTIVE"
}
```

## Cost

~$5 per 1,000 ads scraped on Apify Free plan. Paid plans are cheaper ($3.40-$5/1K).

## Common Workflows

### 1. Competitor Ad Research

```bash
python3 skills/meta-ad-scraper/scripts/search_meta_ads.py \
  --company "Competitor Name" --country US --max-ads 100 --output summary
```

### 2. Industry Ad Landscape

```bash
# Search by keyword to see all advertisers in a space
python3 skills/meta-ad-scraper/scripts/search_meta_ads.py \
  --company "CRM software" --max-ads 50
```

### 3. Compare Multiple Competitors

Run the script multiple times for each competitor and compare creative approaches, messaging, and spend ranges.

## Important Notes

- **EU/UK ads are most complete**: Meta archives all ads shown in EU/UK. For US-only ads, coverage may be limited to political/issue ads.
- **Active vs All**: By default only active ads are returned. Use `--ad-status all` to include historical ads.
- **Rate limits**: Apify handles rate limiting internally. For large scrapes, increase `--timeout`.

## Configuration

See `references/apify-config.md` for detailed API configuration, token setup, and rate limits.
