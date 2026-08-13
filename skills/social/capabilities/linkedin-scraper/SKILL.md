---
name: linkedin-scraper
description: Get LinkedIn profiles, company pages, and posts
source: scrapecreators
---


# LinkedIn Scraper

## Setup

Use `scrapecreators-api` for authentication and current endpoint guidance. With GooseWorks, run `npx gooseworks login` once; the commands below use the managed ScrapeCreators key.


Scrape public LinkedIn data including profiles, company pages, and posts.

## When to Use

- User asks about someone's LinkedIn profile
- User wants company information from LinkedIn
- Research on a professional or company

## How It Works

Uses the ScrapeCreators API through its direct GooseWorks proxy.

**Note:** Scrape Creators LinkedIn endpoints use full LinkedIn URLs as the query parameter (not usernames).

## Usage

### Get User Profile

```bash
gooseworks call scrapecreators /v1/linkedin/profile --query='{"url":"https://linkedin.com/in/satyanadella"}'
```

### Get Company Page

```bash
gooseworks call scrapecreators /v1/linkedin/company --query='{"url":"https://linkedin.com/company/anthropic"}'
```

### Get Specific Post

```bash
gooseworks call scrapecreators /v1/linkedin/post --query='{"url":"https://linkedin.com/posts/somepost"}'
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
gooseworks call scrapecreators /v1/linkedin/profile --query='{"url":"https://linkedin.com/in/satyanadella"}'
```

**User:** "Tell me about Anthropic's LinkedIn page"
```bash
gooseworks call scrapecreators /v1/linkedin/company --query='{"url":"https://linkedin.com/company/anthropic"}'
```

## Error Handling

- **success: false** — the API may temporarily fail to access LinkedIn; retry after a few seconds
- Private/restricted profiles return limited or no data
- Rate limiting may apply — add short delays between sequential requests


## Tips

- Use full LinkedIn URLs (e.g., `https://linkedin.com/in/USERNAME`)
- For companies, use the full company page URL
- Some profiles may have restricted visibility
