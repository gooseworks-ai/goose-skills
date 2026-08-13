---
name: tiktok-search
description: Search TikTok - find profiles, videos, hashtags, and trending content
source: scrapecreators
---


# TikTok Search

## Setup

Use `scrapecreators-api` for authentication and current endpoint guidance. With GooseWorks, run `npx gooseworks login` once; the commands below use the managed ScrapeCreators key.


Search TikTok for profiles, videos, and hashtag content.

## When to Use

- User asks about a TikTok account
- User wants to find TikTok videos
- User asks about trending TikTok content
- Social media research

## How It Works

Uses the ScrapeCreators API through its direct GooseWorks proxy.

## Usage

### Get TikTok Profile

```bash
gooseworks call scrapecreators /v1/tiktok/profile --query='{"handle":"charlidamelio"}'
```

### Search Hashtag Videos

```bash
gooseworks call scrapecreators /v1/tiktok/search/hashtag --query='{"hashtag":"tech"}'
```

### Get Trending Feed

```bash
gooseworks call scrapecreators /v1/tiktok/get-trending-feed --query='{"region":"US"}'
```

## Parameters

### Profile
- **handle** (required) - TikTok handle (without @)

### Hashtag Search
- **hashtag** (required) - Hashtag to search (without #)
- **region** (optional) - Region for the proxy
- **cursor** (optional) - Cursor for pagination
- **trim** (optional) - Set to "true" for a trimmed response

### Trending Feed
- **region** (required) - Region for the proxy (e.g., "US")
- **trim** (optional) - Set to true for a trimmed response

## Response

### Profile includes:
- Username and display name
- Bio/description
- Follower and following counts
- Total likes
- Verified status
- Profile image

### Videos include:
- Video title/description
- View count
- Like count
- Comment count
- Video URL

## Examples

**User:** "Look up charlidamelio on TikTok"
```bash
gooseworks call scrapecreators /v1/tiktok/profile --query='{"handle":"charlidamelio"}'
```

**User:** "What's trending on TikTok?"
```bash
gooseworks call scrapecreators /v1/tiktok/get-trending-feed --query='{"region":"US"}'
```

**User:** "What's trending with #tech on TikTok?"
```bash
gooseworks call scrapecreators /v1/tiktok/search/hashtag --query='{"hashtag":"tech"}'
```

## Error Handling

- **success: false** — the API may temporarily fail; retry after a few seconds
- Private accounts cannot be accessed
- Rate limiting may apply on rapid sequential requests


## Tips

- Remove @ from handles
- Remove # from hashtags
- Private accounts cannot be accessed
