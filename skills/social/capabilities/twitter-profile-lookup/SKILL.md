---
name: twitter-profile-lookup
description: Look up Twitter/X profiles - get bio, followers, tweets, and engagement
source: scrapecreators
---


# Twitter/X Profile Lookup

## Setup

Read `scrapecreators-api` first. Execute every operation below through the runtime it selects: the GooseWorks MCP tool in terminal-free clients, the GooseWorks CLI in a local terminal, or the direct API with the user's own key. Never assume a shell is available.


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

```yaml
provider: scrapecreators
method: GET
path: /v1/twitter/profile
query:
  handle: openai
```

### Get User's Tweets

```yaml
provider: scrapecreators
method: GET
path: /v1/twitter/user-tweets
query:
  handle: openai
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
Use the **Get User's Tweets** operation with `handle: openai`.

**User:** "Show me Sam Altman's recent tweets"
Use the **Get User's Tweets** operation with `handle: sama`.

**User:** "What's Anthropic sharing on Twitter?"
Use the **Get User's Tweets** operation with `handle: AnthropicAI`.

## Error Handling

- **success: false** — the API may temporarily be unable to access the profile; retry after a few seconds
- Protected/private accounts return errors — no workaround
- Rate limiting may cause failures on rapid sequential requests — add short delays between calls

## Tips

- Remove @ from handles
- Protected/private accounts cannot be accessed
- Returns recent tweets (not full history)
- Rate limiting may apply for very frequent requests
