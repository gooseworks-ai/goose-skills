---
name: twitter-mention-tracker
description: >
  Search and scrape Twitter/X posts using Apify. Use when you need to find tweets,
  track brand mentions, monitor competitors on Twitter, or analyze Twitter discussions.
  Uses Twitter native search syntax (since:/until:) for reliable date filtering.
---

# Twitter Mention Tracker

Search Twitter/X posts using the Apify `apidojo/tweet-scraper` actor.

## Quick Start

Requires `APIFY_API_TOKEN` env var (or `--token` flag).

```bash
# Search with date range (recommended -- uses Twitter native since:/until: operators)
python3 skills/twitter-mention-tracker/scripts/search_twitter.py \
  --query "YourCompany" --since 2026-02-15 --until 2026-02-23

# Quick summary of recent mentions
python3 skills/twitter-mention-tracker/scripts/search_twitter.py \
  --query "@yourhandle" --max-tweets 20 --output summary

# Search without date filtering
python3 skills/twitter-mention-tracker/scripts/search_twitter.py \
  --query "AI content marketing" --max-tweets 50
```

## Date Filtering

**Important:** The `apidojo/tweet-scraper` actor's built-in date parameters are unreliable.
This script embeds `since:YYYY-MM-DD` and `until:YYYY-MM-DD` directly into the search query
string, using Twitter's native advanced search syntax. This ensures date filtering works
correctly server-side.

## How the Script Works

1. Builds a search term with the query quoted and date operators appended
2. Calls the Apify `apidojo/tweet-scraper` actor via REST API
3. Polls until the run completes, then fetches the dataset
4. Deduplicates by tweet ID/URL
5. Applies optional keyword filtering (client-side)
6. Sorts by likes (descending) and outputs JSON or summary

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--query` | *required* | Search query (quoted in Twitter search) |
| `--since` | none | Start date YYYY-MM-DD (inclusive) |
| `--until` | none | End date YYYY-MM-DD (exclusive) |
| `--max-tweets` | 50 | Max tweets to scrape |
| `--keywords` | none | Additional filter keywords (comma-separated, OR logic) |
| `--output` | json | Output format: `json` or `summary` |
| `--token` | env var | Apify token (prefer `APIFY_API_TOKEN` env var) |
| `--timeout` | 300 | Max seconds to wait for the Apify run |

## Direct API Usage

```json
{
  "searchTerms": ["\"YourCompany\" since:2026-02-15 until:2026-02-22"],
  "maxTweets": 50,
  "searchMode": "live"
}
```

## Output Format

Tweets are returned as JSON array sorted by likes. Each tweet has:

```json
{
  "id": "...",
  "text": "Tweet text...",
  "fullText": "Full tweet text...",
  "likeCount": 42,
  "retweetCount": 5,
  "replyCount": 3,
  "viewCount": 1200,
  "createdAt": "2026-02-18T12:00:00.000Z",
  "author": {"userName": "handle", "name": "Display Name", ...},
  "twitterUrl": "https://twitter.com/..."
}
```

## Common Workflows

### Competitor Monitoring
```bash
python3 skills/twitter-mention-tracker/scripts/search_twitter.py \
  --query "CompetitorName" --since 2026-02-15 --until 2026-02-23 --output summary
```

### Brand Mention Tracking
```bash
python3 skills/twitter-mention-tracker/scripts/search_twitter.py \
  --query "@YourHandle OR \"YourBrand\"" --max-tweets 100
```
