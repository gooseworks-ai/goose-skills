---
name: instagram-scraper
description: Get Instagram profiles, posts, and reels
source: scrapecreators
---


# Instagram Scraper

## Setup

Use `scrapecreators-api` for authentication and current endpoint guidance. With GooseWorks, run `npx gooseworks login` once; the commands below use the managed ScrapeCreators key.


Scrape public Instagram data including profiles, posts, and reels.

## When to Use

- User asks about Instagram content
- User wants to see posts from an account
- Social media research

## How It Works

Uses the ScrapeCreators API through its direct GooseWorks proxy.

## Usage

### Get User Profile & Posts

```bash
gooseworks call scrapecreators /v1/instagram/profile --query='{"handle":"openai"}'
```

### Get Individual Post/Reel

```bash
gooseworks call scrapecreators /v1/instagram/post --query='{"url":"https://instagram.com/p/abc123"}'
```

### Get Basic Profile by User ID

```bash
gooseworks call scrapecreators /v1/instagram/basic-profile --query='{"userId":"12345"}'
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
```bash
gooseworks call scrapecreators /v1/instagram/profile --query='{"handle":"openai"}'
```

**User:** "Get details on this Instagram post"
```bash
gooseworks call scrapecreators /v1/instagram/post --query='{"url":"https://instagram.com/p/abc123"}'
```

## Error Handling

- **success: false** — the API may temporarily fail; retry after a few seconds
- Private accounts cannot be accessed — no workaround
- Rate limiting may cause failures on rapid requests — add delays between calls


## Tips

- Private accounts cannot be accessed
- Remove @ from handles
- API may return errors for rate limiting - retry after a few seconds
