---
name: tiktok-search
description: Search TikTok - find profiles, videos, hashtags, and trending content
source: scrapecreators
---


# TikTok Search

## Setup

Read `scrapecreators-api` first. Execute every operation below through the runtime it selects: the GooseWorks MCP tool in terminal-free clients, the GooseWorks CLI in a local terminal, or the direct API with the user's own key. Never assume a shell is available.


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

```yaml
provider: scrapecreators
method: GET
path: /v1/tiktok/profile
query:
  handle: charlidamelio
```

### Search Hashtag Videos

```yaml
provider: scrapecreators
method: GET
path: /v1/tiktok/search/hashtag
query:
  hashtag: tech
```

### Get Trending Feed

```yaml
provider: scrapecreators
method: GET
path: /v1/tiktok/get-trending-feed
query:
  region: US
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
Use the **Get TikTok Profile** operation with `handle: charlidamelio`.

**User:** "What's trending on TikTok?"
Use the **Get Trending Feed** operation with the user's region, defaulting to `US` only when appropriate.

**User:** "What's trending with #tech on TikTok?"
Use the **Search Hashtag Videos** operation with `hashtag: tech`.

## Error Handling

- **success: false** — the API may temporarily fail; retry after a few seconds
- Private accounts cannot be accessed
- Rate limiting may apply on rapid sequential requests


## Tips

- Remove @ from handles
- Remove # from hashtags
- Private accounts cannot be accessed
