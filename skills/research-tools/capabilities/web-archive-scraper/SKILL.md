---
name: web-archive-scraper
description: >
  Search the Wayback Machine for archived versions of websites. Extract cached pages,
  customer lists, testimonials, and partner directories from sites that have changed or
  gone offline. Uses the free CDX API — no API key needed.
---

# Web Archive Scraper

Search the Wayback Machine (Internet Archive) for archived snapshots of websites. Fetch cached page content to find customer lists, testimonials, partner directories, and other information from sites that have changed or shut down.

## Quick Start

Only dependency is `requests`. No API key needed.

```bash
# Find all snapshots of a URL
python3 skills/web-archive-scraper/scripts/search_archive.py \
  --url "https://botkeeper.com/customers"

# Search with date range
python3 skills/web-archive-scraper/scripts/search_archive.py \
  --url "https://botkeeper.com" --from 2025-01-01 --to 2026-02-01

# Search all pages under a domain (prefix match)
python3 skills/web-archive-scraper/scripts/search_archive.py \
  --url "https://botkeeper.com" --match prefix --limit 50

# Fetch the actual archived page content
python3 skills/web-archive-scraper/scripts/search_archive.py \
  --url "https://botkeeper.com/customers" --fetch

# Output formats
python3 skills/web-archive-scraper/scripts/search_archive.py --url URL --output json
python3 skills/web-archive-scraper/scripts/search_archive.py --url URL --output csv
python3 skills/web-archive-scraper/scripts/search_archive.py --url URL --output summary
```

## How It Works

1. **CDX API search** — Queries `web.archive.org/cdx/search/cdx` for snapshots matching the URL
2. **Filtering** — Filters by date range, HTTP status code, and MIME type
3. **Dedup** — Collapses to one snapshot per day by default to avoid redundant results
4. **Content fetch** — Optionally fetches the raw archived HTML (using `id_` modifier to skip Wayback toolbar)
5. **Text extraction** — Strips HTML tags for readable text output when fetching content

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--url` | *required* | Target URL to search in the archive |
| `--match` | exact | Match type: `exact`, `prefix`, `host`, `domain` |
| `--from` | none | Start date (YYYY-MM-DD) |
| `--to` | none | End date (YYYY-MM-DD) |
| `--limit` | 25 | Max number of snapshots to return |
| `--fetch` | false | Fetch and display the content of the most recent snapshot |
| `--fetch-all` | false | Fetch content of ALL matched snapshots (use with small --limit) |
| `--status` | 200 | HTTP status filter (set to "any" to include all) |
| `--output` | json | Output format: `json`, `csv`, `summary` |
| `--collapse` | day | Dedup level: `none`, `day`, `month`, `year` |

## Output Schema

```json
{
  "url": "https://botkeeper.com/customers",
  "timestamp": "20250915143022",
  "datetime": "2025-09-15T14:30:22",
  "status_code": "200",
  "mime_type": "text/html",
  "archive_url": "https://web.archive.org/web/20250915143022/https://botkeeper.com/customers",
  "raw_url": "https://web.archive.org/web/20250915143022id_/https://botkeeper.com/customers",
  "content": "..."
}
```

The `content` field is only populated when `--fetch` or `--fetch-all` is used.

## Cost

Free. The Wayback Machine CDX API requires no authentication or API key. Rate limit is ~15 requests/minute.

## Common Use Cases

- **Find customer lists from shut-down companies** (e.g., botkeeper.com)
- **Recover testimonials/case studies** before a site redesign
- **Track how a competitor's messaging changed over time**
- **Find partner directories** that have been removed
