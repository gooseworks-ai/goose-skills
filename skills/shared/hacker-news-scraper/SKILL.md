---
name: hacker-news-scraper
description: >
  Search Hacker News stories and comments using the free Algolia API.
  No Apify token needed. Use when you need to find HN discussions, track mentions,
  discover Show HN launches, or monitor tech community sentiment.
---

# Hacker News Scraper

Search Hacker News using the free [Algolia HN Search API](https://hn.algolia.com/api). No Apify token or API key needed.

## Quick Start

Only dependency: `pip install requests`.

```bash
# Stories about AI content marketing in last week
python3 skills/hacker-news-scraper/scripts/search_hn.py \
  --query "AI content marketing" --days 7

# Show HN posts in last month (summary view)
python3 skills/hacker-news-scraper/scripts/search_hn.py \
  --query "" --tags show_hn --days 30 --output summary

# Comments mentioning a specific tool
python3 skills/hacker-news-scraper/scripts/search_hn.py \
  --query "LangChain" --tags comment --days 14 --max-results 20
```

## How the Script Works

1. Queries the Algolia HN Search API (`search_by_date` endpoint)
2. Uses `numericFilters=created_at_i>{unix_timestamp}` for server-side date filtering
3. Paginates until max-results reached
4. Normalizes results to a consistent schema
5. Applies optional keyword filtering (client-side)
6. Sorts by points (descending) and outputs JSON or summary

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--query` | *required* | Search query |
| `--days` | 7 | How many days back to search |
| `--tags` | story | Item type: `story`, `comment`, `ask_hn`, `show_hn` |
| `--max-results` | 50 | Max results to return |
| `--keywords` | none | Additional filter keywords (comma-separated, OR logic) |
| `--output` | json | Output format: `json` or `summary` |

## Output Format

```json
{
  "id": "12345678",
  "title": "Show HN: My new tool",
  "url": "https://example.com",
  "author": "username",
  "points": 42,
  "num_comments": 15,
  "created_at": "2026-02-18T12:00:00.000Z",
  "hn_url": "https://news.ycombinator.com/item?id=12345678",
  "text": ""
}
```

## Cost

**Free.** No API key, no rate limits (within reason), no Apify credits.
