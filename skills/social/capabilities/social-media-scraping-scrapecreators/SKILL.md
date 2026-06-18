---
name: social-media-scraping-scrapecreators
description: Social media scraping - Instagram, TikTok, LinkedIn, and X/Twitter profiles, posts, and content
source: orthogonal
---


# Scrape Creators - Social Media Scraping API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Scrape profiles, posts, and content from Instagram, TikTok, LinkedIn, and X/Twitter.

## Capabilities

- **X/Twitter User Profile**: Get X/Twitter profile data including bio, follower counts, and profile info
- **X/Twitter User Tweets**: Get tweets from a user's profile
- **X/Twitter Tweet Details**: Get detailed data for a specific tweet by URL
- **LinkedIn Profile**: Get comprehensive LinkedIn profile data including work experience, education, skills, and contact info
- **LinkedIn Post**: Get data for a specific LinkedIn post
- **LinkedIn Company Page**: Get company information including size, industry, locations, and specialties
- **Instagram Profile**: Get Instagram profile data and recent posts
- **Instagram Basic Profile**: Get basic Instagram profile data by user ID
- **Instagram Post/Reel**: Get detailed data for a specific Instagram post or reel
- **TikTok Profile**: Get TikTok profile data
- **TikTok Hashtag Search**: Search TikTok videos by hashtag
- **TikTok Trending Feed**: Get videos from TikTok's trending feed


## Usage

### X/Twitter User Profile

Parameters:
- handle* (string) - Twitter handle (without @)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/profile","query":{"handle":"openai"}}'
```

### X/Twitter User Tweets

Parameters:
- handle* (string) - Twitter handle (without @)
- trim (string) - Set to "true" for a trimmed response

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"openai"}}'
```

### X/Twitter Tweet Details

Parameters:
- url* (string) - Tweet URL

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/tweet","query":{"url":"https://x.com/OpenAI/status/123456"}}'
```

### LinkedIn Profile

Parameters:
- url* (string) - LinkedIn profile URL

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/profile","query":{"url":"https://linkedin.com/in/satyanadella"}}'
```

### LinkedIn Post

Parameters:
- url* (string) - The URL of the LinkedIn post

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/post","query":{"url":"https://linkedin.com/posts/somepost"}}'
```

### LinkedIn Company Page

Parameters:
- url* (string) - The URL of the LinkedIn company page

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/company","query":{"url":"https://linkedin.com/company/anthropic"}}'
```

### Instagram Profile

Get Instagram profile data and recent posts.

Parameters:
- handle* (string) - Instagram handle (without @)
- trim (string) - Set to "true" for a trimmed response

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/instagram/profile","query":{"handle":"openai"}}'
```

### Instagram Basic Profile

Parameters:
- userId (string) - Instagram user ID

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/instagram/basic-profile","query":{"userId":"12345"}}'
```

### Instagram Post/Reel

Parameters:
- url* (string) - Instagram post or reel URL
- trim (string) - Set to "true" for a trimmed response

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/instagram/post","query":{"url":"https://instagram.com/p/abc123"}}'
```

### TikTok Profile

Parameters:
- handle* (string) - TikTok handle (without @)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/tiktok/profile","query":{"handle":"charlidamelio"}}'
```

### TikTok Hashtag Search

Parameters:
- hashtag* (string) - Hashtag to search for (without #)
- region (string) - Region for the proxy
- cursor (string) - Cursor for pagination
- trim (string) - Set to "true" for a trimmed response

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/tiktok/search/hashtag","query":{"hashtag":"tech"}}'
```

### TikTok Trending Feed

Parameters:
- region* (string) - Region for the proxy (e.g., "US")
- trim (boolean) - Set to true for a trimmed response

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/tiktok/get-trending-feed","query":{"region":"US"}}'
```

## Use Cases

1. **Social Listening**: Monitor brand mentions across platforms
2. **Influencer Research**: Analyze influencer profiles and engagement
3. **Competitive Analysis**: Track competitor social media activity
4. **Content Research**: Discover trending content and hashtags
5. **Lead Generation**: Find prospects through social profiles

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"scrapecreators API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/profile"}'   # Get endpoint details
```
