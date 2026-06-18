---
name: social-listening
description: Monitor brand mentions, competitor activity, and industry conversations across social media and the web
source: orthogonal
---


# Social Listening

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Track brand mentions, competitor activity, and industry conversations across social media and the web.

## When to Use

- User wants to monitor what people say about a brand or product
- User asks "what are people saying about [company]?"
- Tracking competitor launches or announcements
- Monitoring industry trends and sentiment
- Social media due diligence before partnerships

## Workflow

### Step 1: Search Web Mentions with Exa

Find recent mentions, reviews, and discussions across the web:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "Notion reviews opinions user feedback",
  "numResults": 30,
  "contents": {"text": true}
}'
```

### Step 2: Monitor Social Media with Scrape Creators

Check what's being posted on X/Twitter:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"NotionHQ"}}'
```

Check LinkedIn company activity:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/company","query":{"url":"https://linkedin.com/company/notion"}}'
```

> **Note:** Scrape Creators does not have a dedicated "company posts" endpoint. Use `/v1/linkedin/company` to get company page data, or `/v1/linkedin/post` with a specific post URL.

### Step 3: Deep Scrape Key Pages with Scrapegraph

Extract structured data from specific pages found in Steps 1-2:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://example.com/review-page",
  "user_prompt": "Extract sentiment, key complaints, and praise about the product"
}'
```

## Examples

**User:** "What are people saying about Slack?"
```bash
# Step 1: Web mentions
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search","body":{"query":"Slack reviews complaints praise 2025 2026","numResults":20,"contents":{"text":true}}}'

# Step 2: Their social presence
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"SlackHQ"}}'
```

**User:** "Monitor competitor launches in the AI space"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search","body":{"query":"AI startup launch announcement new product 2026","numResults":30,"contents":{"text":true}}}'
```

## Tips

- Use Exa for broad web monitoring (blogs, forums, news)
- Use Scrape Creators for social media (X/Twitter, LinkedIn, Instagram, TikTok)
- Use Scrapegraph for extracting structured data from specific URLs
- Include date ranges in Exa queries for recent results
- Track both your brand and competitors for comparative insights
