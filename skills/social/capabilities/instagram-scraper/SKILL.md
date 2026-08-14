---
name: instagram-scraper
description: Get Instagram profiles, posts, and reels
source: scrapecreators
---


# Instagram Scraper

## Setup

Read `scrapecreators-api` first. Execute every operation below through the runtime it selects: the GooseWorks MCP tool in terminal-free clients, the GooseWorks CLI in a local terminal, or the direct API with the user's own key. Never assume a shell is available.


Scrape public Instagram data including profiles, posts, and reels.

## When to Use

- User asks about Instagram content
- User wants to see posts from an account
- Social media research

## How It Works

Uses the ScrapeCreators API through its direct GooseWorks proxy.

## Usage

### Get User Profile & Posts

```yaml
provider: scrapecreators
method: GET
path: /v1/instagram/profile
query:
  handle: openai
```

### Get Individual Post/Reel

```yaml
provider: scrapecreators
method: GET
path: /v1/instagram/post
query:
  url: https://instagram.com/p/abc123
```

### Get Basic Profile by User ID

```yaml
provider: scrapecreators
method: GET
path: /v1/instagram/basic-profile
query:
  userId: "12345"
```

## Parameters

### Profile
- **handle** (required) - Instagram handle (without @)
- **trim** (optional) - Set to "true" for a trimmed response

### Post/Reel
- **url** (required) - Instagram post or reel URL
- **trim** (optional) - Set to "true" for a trimmed response

### Basic Profile
- **userId** (optional) - Instagram user ID

## Response

### Profile includes:
- Username, display name, bio
- Follower/following counts
- Recent posts with captions, URLs, engagement metrics
- Profile image

### Post includes:
- Post caption
- Image/video URLs
- Like count
- Comment count
- Timestamp

## Examples

**User:** "What's OpenAI posting on Instagram?"
Use the **Get User Profile & Posts** operation with `handle: openai`.

**User:** "Get details on this Instagram post"
Use the **Get Individual Post/Reel** operation with the supplied post URL.

## Error Handling

- **success: false** — the API may temporarily fail; retry after a few seconds
- Private accounts cannot be accessed — no workaround
- Rate limiting may cause failures on rapid requests — add delays between calls


## Tips

- Private accounts cannot be accessed
- Remove @ from handles
- API may return errors for rate limiting - retry after a few seconds
