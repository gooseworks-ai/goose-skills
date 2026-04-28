---
name: linkedin-scraper
description: Get LinkedIn profiles, company pages, and posts
source: orthogonal
---


# LinkedIn Scraper

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Scrape public LinkedIn data including profiles, company pages, and posts.

## When to Use

- User asks about someone's LinkedIn profile
- User wants company information from LinkedIn
- Research on a professional or company

## How It Works

Uses the Scrape Creators API via Orthogonal to scrape LinkedIn data.

**Note:** Scrape Creators LinkedIn endpoints use full LinkedIn URLs as the query parameter (not usernames).

## Usage

### Get User Profile

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/profile","query":{"url":"https://linkedin.com/in/satyanadella"}}'
```

<details>
<summary>curl equivalent</summary>

```bash
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/profile","query":{"url":"https://linkedin.com/in/satyanadella"}}'
```
</details>

### Get Company Page

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/company","query":{"url":"https://linkedin.com/company/anthropic"}}'
```

### Get Specific Post

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/post","query":{"url":"https://linkedin.com/posts/somepost"}}'
```

## Parameters

### User Profile
- **url** (required) - LinkedIn profile URL (e.g., `https://linkedin.com/in/username`)

### Company Page
- **url** (required) - LinkedIn company page URL (e.g., `https://linkedin.com/company/name`)

### Post
- **url** (required) - LinkedIn post URL

## Response

### User Profile includes:
- Name, headline, location
- Current position
- Education history
- Skills
- Connection count
- Profile URL

### Company Page includes:
- Company name and description
- Industry and size
- Headquarters location
- Founded date
- Employee count
- Specialties

## Examples

**User:** "Look up Satya Nadella on LinkedIn"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/profile","query":{"url":"https://linkedin.com/in/satyanadella"}}'
```

**User:** "Tell me about Anthropic's LinkedIn page"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/linkedin/company","query":{"url":"https://linkedin.com/company/anthropic"}}'
```

## Error Handling

- **success: false** — the API may temporarily fail to access LinkedIn; retry after a few seconds
- Private/restricted profiles return limited or no data
- Rate limiting may apply — add short delays between sequential requests


## Tips

- Use full LinkedIn URLs (e.g., `https://linkedin.com/in/USERNAME`)
- For companies, use the full company page URL
- Some profiles may have restricted visibility
