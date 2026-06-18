---
name: linkedin-post-research
description: >
  Search LinkedIn posts by keywords, sorted by engagement or date. Use when researching
  what people are saying about a topic on LinkedIn, finding high-engagement content,
  identifying thought leaders, or discovering warm leads through post engagement.
  Returns author, post text, reactions, comments, shares, post URL, and date.
  No LinkedIn cookies or login required.
tags: [research, lead-generation]
---

# LinkedIn Post Research

Search LinkedIn for posts matching keywords via Apify. Returns posts sorted by engagement or date, with author info, full text, reaction counts, and direct URLs.

No LinkedIn cookies. No login. Just keywords in, posts out.

## When to Auto-Load

Load this skill when:
- User says "search LinkedIn posts", "what are people saying about X on LinkedIn", "find LinkedIn content about"
- User wants to find high-engagement posts on a topic
- User wants to identify who's posting about a specific topic (thought leader discovery)
- User wants to find posts to extract commenters from (warm lead pipeline)

## Prerequisites

### Apify API Token

Required for searching LinkedIn posts. Set in `.env`:

```
APIFY_API_TOKEN=your_token_here
```

No LinkedIn cookies, login, or session tokens needed. That's the only setup.

---

## How It Works

1. Takes one or more keywords
2. Calls the `apimaestro/linkedin-posts-search-scraper-no-cookies` Apify actor
3. Returns posts with author, text, engagement metrics, date, and URL
4. Deduplicates across keywords by `activity_id`
5. Sorts by engagement (total reactions) descending, or by date

## Quick Start

```bash
# Single keyword search
python3 skills/capabilities/linkedin-post-research/scripts/search_posts.py \
  --keyword "AI sourcing" --max-items 20

# Multiple keywords
python3 skills/capabilities/linkedin-post-research/scripts/search_posts.py \
  --keyword "AI sourcing" --keyword "recruiting automation" --max-items 30

# Sort by date (most recent first)
python3 skills/capabilities/linkedin-post-research/scripts/search_posts.py \
  --keyword "AI agents" --sort-by date_posted --max-items 20

# Output as CSV
python3 skills/capabilities/linkedin-post-research/scripts/search_posts.py \
  --keyword "AI agents" --output csv --output-file results.csv

# Summary table
python3 skills/capabilities/linkedin-post-research/scripts/search_posts.py \
  --keyword "AI agents" --output summary
```

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--keyword`, `-k` | *required* | Keyword to search (can be repeated for multiple keywords) |
| `--max-items` | 50 | Max posts to return per keyword |
| `--sort-by` | `relevance` | Sort order: `relevance` or `date_posted` |
| `--output`, `-o` | `json` | Output format: `json`, `csv`, `summary` |
| `--output-file` | stdout | Write output to file |
| `--token` | env var | Apify API token (overrides APIFY_API_TOKEN env var) |
| `--timeout` | 120 | Max seconds to wait for Apify run |

## Apify Actor Details

**Actor:** `apimaestro/linkedin-posts-search-scraper-no-cookies`

**API call:**
```bash
curl -X POST "https://api.apify.com/v2/acts/apimaestro~linkedin-posts-search-scraper-no-cookies/runs?token=$APIFY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "AI agents",
    "maxItems": 50,
    "sortBy": "date_posted"
  }'
```

**Polling for results:**
```bash
# Check run status
curl "https://api.apify.com/v2/acts/apimaestro~linkedin-posts-search-scraper-no-cookies/runs/{RUN_ID}?token=$APIFY_API_TOKEN"

# When status is SUCCEEDED, fetch results
curl "https://api.apify.com/v2/datasets/{DATASET_ID}/items?token=$APIFY_API_TOKEN"
```

## Output Schema

```json
{
  "author": "Jane Smith",
  "author_headline": "VP of Sales at Acme Corp",
  "author_profile_url": "https://www.linkedin.com/in/janesmith",
  "keyword": "AI sourcing",
  "reactions": 142,
  "comments": 28,
  "shares": 12,
  "reactions_by_type": {"LIKE": 100, "EMPATHY": 30, "PRAISE": 12},
  "date": "2026-04-01",
  "post_preview": "First 200 chars of the post text...",
  "full_text": "Complete post text...",
  "url": "https://www.linkedin.com/posts/...",
  "activity_id": "7447040447966826496",
  "hashtags": ["#AI", "#sales"],
  "is_repost": false,
  "content_type": "text"
}
```

## Output Columns (CSV)

| Column | Description |
|--------|-------------|
| author | Post author name |
| author_headline | Author's LinkedIn headline |
| author_profile_url | Author's LinkedIn profile URL |
| keyword | Which search keyword matched |
| reactions | Total reaction count |
| comments | Comment count |
| shares | Share count |
| date | Post date (YYYY-MM-DD) |
| post_preview | First ~200 characters |
| url | Direct link to the LinkedIn post |
| activity_id | Unique post identifier |
| hashtags | Comma-separated hashtags |

## Cost

Apify charges per compute usage. ~50 posts costs approximately $0.01-0.05 depending on the actor's pricing tier. The script prints cost info after each run.

## Error Handling

| Error | Fix |
|-------|-----|
| `APIFY_API_TOKEN` not set | Ask user to add it to `.env` |
| Apify run fails or times out | Retry once. If still fails, try a broader keyword. |
| 0 results | Keyword may be too specific. Try broader terms. |
