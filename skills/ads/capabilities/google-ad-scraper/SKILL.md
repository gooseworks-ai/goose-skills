---
name: google-ad-scraper
description: Scrape competitor ads from Google Ads by domain. Returns ad creatives, formats, and campaign details. Use for competitive ad research and messaging analysis.
---

# Google Ads Scraper

Scrape ads from Google Ads using the Apify `burbn/google-ads-search` actor. Search by domain to get ad creatives, formats, and campaign details.

## Quick Start

Requires `APIFY_API_TOKEN` env var (or `--token` flag).

```bash
# Search by domain (recommended)
python3 skills/google-ad-scraper/scripts/search_google_ads.py \
  --domain "hubspot.com"

# Search by company name (resolves to domain via transparency center)
python3 skills/google-ad-scraper/scripts/search_google_ads.py \
  --company "Nike"

# Limit results
python3 skills/google-ad-scraper/scripts/search_google_ads.py \
  --domain "hubspot.com" --max-ads 30

# Human-readable summary
python3 skills/google-ad-scraper/scripts/search_google_ads.py \
  --domain "stripe.com" --output summary
```

## How It Works

1. **Domain Input**: Pass the target company's domain directly via `--domain`
2. **Company Name Resolution** (optional): If only `--company` is provided, the script searches Google Ads Transparency Center using Apify's web-scraper (Puppeteer) to resolve the company name to advertiser info
3. **Ad Scraping**: Calls the Apify `burbn/google-ads-search` actor with `{"domain": "...", "maxItems": N}`
4. **Output**: Returns ads as JSON or human-readable summary

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--domain` | none | Company domain (e.g. hubspot.com) — recommended |
| `--company` | none | Company name (resolved to domain via transparency center) |
| `--max-ads` | 50 | Maximum number of ads to return |
| `--output` | json | Output format: `json` or `summary` |
| `--token` | env var | Apify token (prefer `APIFY_API_TOKEN` env var) |
| `--timeout` | 300 | Max seconds to wait for Apify run |

At least one of `--company` or `--domain` is required.

## Output Fields

Each ad in the output contains:

```json
{
  "advertiserId": "AR13129532367502835713",
  "advertiserName": "Nike, Inc.",
  "creativeId": "CR12345678901234567890",
  "originalUrl": "https://www.nike.com/",
  "imageUrl": "https://...",
  "variantFormat": "TEXT",
  "variantContent": "Shop the latest Nike shoes...",
  "variants": [...],
  "variantCount": 3,
  "startDate": "2026-01-15"
}
```

**Output fields:**

| Field | Description |
|-------|-------------|
| `advertiserId` | Google Ads advertiser ID |
| `advertiserName` | Company/advertiser display name |
| `creativeId` | Unique ID for the ad creative |
| `originalUrl` | Destination URL the ad links to |
| `imageUrl` | URL of the ad image (if applicable) |
| `variantFormat` | Ad format (TEXT, IMAGE, VIDEO, etc.) |
| `variantContent` | Ad copy/text content |
| `variants` | Array of ad variants |
| `variantCount` | Number of variants for this creative |
| `startDate` | Date the ad first appeared |

## Cost

- Ad scraping: Varies by actor pricing, typically a few cents per domain
- Company name resolution (optional): ~$0.05 (one web-scraper page)

## Common Workflows

### 1. Competitor Ad Research

```bash
python3 skills/google-ad-scraper/scripts/search_google_ads.py \
  --domain "competitor.com" --max-ads 100 --output summary
```

### 2. Compare Multiple Competitors

```bash
# Run for each competitor domain
for domain in "competitor1.com" "competitor2.com" "competitor3.com"; do
  python3 skills/google-ad-scraper/scripts/search_google_ads.py \
    --domain "$domain" --max-ads 50
done
```

## Limitations

- **Company name resolution** uses Puppeteer-based web scraping of Google's SPA. It may occasionally fail — use `--domain` for best results.
- **Ad coverage**: Google only shows ads from verified advertisers. Some smaller advertisers may not appear.
- **Historical data**: Primarily shows recently active ads.
