---
name: blog-feed-monitor
description: >
  Scrape blog posts via RSS feeds (free, no API key) with Apify fallback for
  JS-heavy sites. Use when you need to monitor competitor blogs, track industry
  content, or aggregate blog posts by keyword.
---

# Blog Feed Monitor

Scrape blog posts via RSS/Atom feeds (free) with optional Apify fallback for JS-heavy sites.

## Quick Start

No API key needed for RSS mode.

```bash
# Scrape a blog's RSS feed
python3 skills/blog-feed-monitor/scripts/scrape_blogs.py \
  --urls "https://example.com/blog" --days 30

# Multiple blogs with keyword filter
python3 skills/blog-feed-monitor/scripts/scrape_blogs.py \
  --urls "https://blog1.com,https://blog2.com" --keywords "AI,marketing" --output summary

# Force Apify for JS-heavy sites
python3 skills/blog-feed-monitor/scripts/scrape_blogs.py \
  --urls "https://example.com" --mode apify
```

## How It Works

### Auto Mode (default)
1. For each URL, tries to discover an RSS/Atom feed:
   - Checks HTML `<link rel="alternate">` tags
   - Probes common paths: `/feed`, `/rss`, `/atom.xml`, `/feed.xml`, `/rss.xml`, `/blog/feed`, `/index.xml`
2. Parses discovered feeds (supports RSS 2.0 and Atom)
3. If any URLs fail, falls back to Apify `jupri/rss-xml-scraper` (if token available)
4. Applies date and keyword filtering client-side

> **Note:** The Apify fallback actor `jupri/rss-xml-scraper` may need updating -- it has not been verified recently. RSS mode works reliably without it.

### RSS Mode
Only tries RSS feeds, no Apify fallback.

### Apify Mode
Uses Apify actor directly, skipping RSS discovery.

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--urls` | *required* | Blog URL(s), comma-separated |
| `--keywords` | none | Keywords to filter (comma-separated, OR logic) |
| `--days` | 30 | Only include posts from last N days |
| `--max-posts` | 50 | Max posts to return |
| `--mode` | auto | `auto` (RSS + fallback), `rss` (RSS only), `apify` (Apify only) |
| `--output` | json | Output format: `json` or `summary` |
| `--token` | env var | Apify token (only needed for Apify mode/fallback) |
| `--timeout` | 300 | Max seconds for Apify run |

## Cost

- **RSS mode:** Free (no API, no tokens)
- **Apify mode:** Uses `jupri/rss-xml-scraper` -- minimal Apify credits
