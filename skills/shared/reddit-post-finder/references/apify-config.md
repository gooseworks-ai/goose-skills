# Apify Reddit Scraper Configuration

## API Token

Set the `APIFY_API_TOKEN` environment variable:

```bash
export APIFY_API_TOKEN="your_token_here"
```

Get a token at: https://console.apify.com/account/integrations

## Apify Actor: parseforge/reddit-posts-scraper

### Required Input Parameters

```json
{
  "startUrls": [{"url": "https://www.reddit.com/r/growthhacking/top/?t=week"}],
  "maxPostCount": 50,
  "scrollTimeout": 40,
  "searchType": "posts",
  "proxyConfiguration": {"useApifyProxy": true}
}
```

**Important notes:**
- `startUrls` takes **full Reddit URLs** (not bare subreddit names like `r/foo`)
- `proxyConfiguration` is **required** — the actor will reject input without it
- Sort and time window are controlled via the **URL path**, not separate fields

### URL Patterns for Subreddit Scraping

| Goal | URL Pattern |
|------|-------------|
| Top posts this week | `https://www.reddit.com/r/{sub}/top/?t=week` |
| Top posts this month | `https://www.reddit.com/r/{sub}/top/?t=month` |
| Hot posts (right now) | `https://www.reddit.com/r/{sub}/hot/` |
| Newest posts | `https://www.reddit.com/r/{sub}/new/` |
| Rising posts | `https://www.reddit.com/r/{sub}/rising/` |

For small/low-traffic subreddits, prefer `top` with a time window — `hot` may return zero posts.

### Output Format

Array of post objects:

```json
{
  "id": "post_id",
  "title": "Post title",
  "author": "username",
  "subreddit": "growthhacking",
  "createdAt": "2026-02-18T12:00:00.000Z",
  "score": 42,
  "numComments": 15,
  "selfText": "Post content...",
  "url": "https://reddit.com/r/..."
}
```

## Direct API Usage (curl)

```bash
# Start a run
curl -X POST "https://api.apify.com/v2/acts/parseforge~reddit-posts-scraper/runs?token=$APIFY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startUrls": [{"url": "https://www.reddit.com/r/growthhacking/top/?t=week"}],
    "maxPostCount": 50,
    "scrollTimeout": 40,
    "searchType": "posts",
    "proxyConfiguration": {"useApifyProxy": true}
  }'

# Poll for status (replace RUN_ID)
curl "https://api.apify.com/v2/acts/parseforge~reddit-posts-scraper/runs/RUN_ID?token=$APIFY_API_TOKEN"

# Fetch results (replace DATASET_ID from the run status response)
curl "https://api.apify.com/v2/datasets/DATASET_ID/items?token=$APIFY_API_TOKEN&format=json"
```

Or use the synchronous endpoint (blocks until done):

```bash
curl -X POST "https://api.apify.com/v2/acts/parseforge~reddit-posts-scraper/run-sync-get-dataset-items?token=$APIFY_API_TOKEN&timeout=120" \
  -H "Content-Type: application/json" \
  -d '{
    "startUrls": [{"url": "https://www.reddit.com/r/growthhacking/top/?t=week"}],
    "maxPostCount": 20,
    "scrollTimeout": 40,
    "searchType": "posts",
    "proxyConfiguration": {"useApifyProxy": true}
  }'
```

## MCP Server Setup (Optional)

```bash
claude mcp add apify-reddit "https://mcp.apify.com/?tools=actors,docs,parseforge/reddit-posts-scraper" \
  -t http \
  -H "Authorization: Bearer $APIFY_API_TOKEN"
```

## Rate Limits & Costs

- Free tier includes $5/month in Apify credits
- Reddit rate limiting is handled by the actor internally
- Cost depends on number of posts scraped and compute time
- Typical run for 50 posts from one subreddit: ~$0.01-0.05
