---
name: twitter-profile-lookup
description: Look up Twitter/X profiles - get bio, followers, tweets, and engagement
source: scrapecreators
---


# Twitter/X Profile Lookup

## Setup

Use `scrapecreators-api` for authentication and current endpoint guidance. With GooseWorks, run `npx gooseworks login` once; the commands below use the managed ScrapeCreators key.


Get profile information, tweets, and engagement data for any Twitter/X account.

## When to Use

- User asks about a Twitter/X account
- User wants to see someone's tweets
- User asks "who is @username on Twitter?"
- Research on a public figure or company
- Social media due diligence

## How It Works

Uses the ScrapeCreators API through its direct GooseWorks proxy.

## Usage

### Get User Profile

```bash
gooseworks call scrapecreators /v1/twitter/profile --query='{"handle":"openai"}'
```

### Get User's Tweets

```bash
gooseworks call scrapecreators /v1/twitter/user-tweets --query='{"handle":"openai"}'
```

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
gooseworks call scrapecreators /v1/twitter/user-tweets --query='{"handle":"openai"}'
```

**User:** "Show me Sam Altman's recent tweets"
```bash
gooseworks call scrapecreators /v1/twitter/user-tweets --query='{"handle":"sama"}'
```

**User:** "What's Anthropic sharing on Twitter?"
```bash
gooseworks call scrapecreators /v1/twitter/user-tweets --query='{"handle":"AnthropicAI"}'
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
