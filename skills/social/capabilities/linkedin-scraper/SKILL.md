---
name: linkedin-scraper
description: Get LinkedIn profiles, company pages, and posts
source: scrapecreators
---


# LinkedIn Scraper

## Setup

Read `scrapecreators-api` first. Execute every operation below through the runtime it selects: the GooseWorks MCP tool in terminal-free clients, the GooseWorks CLI in a local terminal, or the direct API with the user's own key. Never assume a shell is available.


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

```yaml
provider: scrapecreators
method: GET
path: /v1/linkedin/profile
query:
  url: https://linkedin.com/in/satyanadella
```

### Get Company Page

```yaml
provider: scrapecreators
method: GET
path: /v1/linkedin/company
query:
  url: https://linkedin.com/company/anthropic
```

### Get Specific Post

```yaml
provider: scrapecreators
method: GET
path: /v1/linkedin/post
query:
  url: https://linkedin.com/posts/somepost
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
Use the **Get User Profile** operation with the supplied LinkedIn profile URL.

**User:** "Tell me about Anthropic's LinkedIn page"
Use the **Get Company Page** operation with the supplied LinkedIn company URL.

## Error Handling

- **success: false** — the API may temporarily fail to access LinkedIn; retry after a few seconds
- Private/restricted profiles return limited or no data
- Rate limiting may apply — add short delays between sequential requests


## Tips

- Use full LinkedIn URLs (e.g., `https://linkedin.com/in/USERNAME`)
- For companies, use the full company page URL
- Some profiles may have restricted visibility
