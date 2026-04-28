---
name: instagram-scraper
description: Get Instagram profiles, posts, and reels
source: orthogonal
---


# Instagram Scraper

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Scrape public Instagram data including profiles, posts, and reels.

## When to Use

- User asks about Instagram content
- User wants to see posts from an account
- Social media research

## How It Works

Uses the Scrape Creators API via Orthogonal to scrape Instagram data.

## Usage

### Get User Profile & Posts

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/instagram/profile","query":{"handle":"openai"}}'
```

<details>
<summary>curl equivalent</summary>

```bash
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/instagram/profile","query":{"handle":"openai"}}'
```
</details>

### Get Individual Post/Reel

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/instagram/post","query":{"url":"https://instagram.com/p/abc123"}}'
```

### Get Basic Profile by User ID

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/instagram/basic-profile","query":{"userId":"12345"}}'
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
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/instagram/profile","query":{"handle":"openai"}}'
```

**User:** "Get details on this Instagram post"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/instagram/post","query":{"url":"https://instagram.com/p/abc123"}}'
```

## Error Handling

- **success: false** — the API may temporarily fail; retry after a few seconds
- Private accounts cannot be accessed — no workaround
- Rate limiting may cause failures on rapid requests — add delays between calls


## Tips

- Private accounts cannot be accessed
- Remove @ from handles
- API may return errors for rate limiting - retry after a few seconds
