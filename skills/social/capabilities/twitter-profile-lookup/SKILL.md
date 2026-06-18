---
name: twitter-profile-lookup
description: Look up Twitter/X profiles - get bio, followers, tweets, and engagement
source: orthogonal
---


# Twitter/X Profile Lookup

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Get profile information, tweets, and engagement data for any Twitter/X account.

## When to Use

- User asks about a Twitter/X account
- User wants to see someone's tweets
- User asks "who is @username on Twitter?"
- Research on a public figure or company
- Social media due diligence

## How It Works

Uses the Scrape Creators API via Orthogonal to scrape Twitter/X profile data and tweets.

## Usage

### Get User Profile

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/profile","query":{"handle":"openai"}}'
```

### Get User's Tweets

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"openai"}}'
```

<details>
<summary>curl equivalent</summary>

```bash
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"openai"}}'
```
</details>

## Parameters

### Profile
- **handle** (required) - Twitter handle (without @)

### Tweets
- **handle** (required) - Twitter handle (without @)
- **trim** (optional) - Set to "true" for a trimmed response

## Response

### Profile Response
- User display name and handle
- Bio/description
- Follower and following counts
- Tweet count
- Profile and banner image URLs
- Verified status
- Account creation date
- Location and website (if set)

### Tweets Response
- Tweet text content
- Like, retweet, reply counts
- Media attachments (images, videos)
- Timestamp
- Engagement metrics

## Examples

**User:** "What has OpenAI been posting on X?"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"openai"}}'
```

**User:** "Show me Sam Altman's recent tweets"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"sama"}}'
```

**User:** "What's Anthropic sharing on Twitter?"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"AnthropicAI"}}'
```

## Error Handling

- **success: false** — the API may temporarily be unable to access the profile; retry after a few seconds
- Protected/private accounts return errors — no workaround
- Rate limiting may cause failures on rapid sequential requests — add short delays between calls

## Tips

- Remove @ from handles
- Protected/private accounts cannot be accessed
- Returns recent tweets (not full history)
- Rate limiting may apply for very frequent requests
