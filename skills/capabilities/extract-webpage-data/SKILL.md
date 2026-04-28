---
name: extract-webpage-data
description: Extract structured data from web pages using AI
source: orthogonal
---


# Extract Webpage Data

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Extract structured data from any web page using AI. Turn messy HTML into clean, organized data.

## When to Use

- User wants to extract specific data from a website
- User asks to scrape information from a page
- User needs structured data from unstructured content
- User wants to pull product info, contact details, etc.
- Converting web content to usable data

## How It Works

Uses Olostep, Scrapegraph, or Riveter APIs for AI-powered data extraction.

## Usage

### Simple Scrape with Olostep

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes","body":{"url_to_scrape":"https://example.com/products"}}'
```

### AI-Powered Extraction with Scrapegraph

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper","body":{"website_url":"https://example.com/team","user_prompt":"Extract all team members with their names, titles, and LinkedIn URLs"}}'
```

### Schema-Based Extraction with Riveter

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/scrape","body":{"url":"https://example.com","schema":{"name":"string","price":"number","description":"string"}}}'
```

### Get AI Answer from Web

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/answers","body":{"task":"Find the pricing for Notion Teams plan from their website"}}'
```

### Crawl Multiple Pages

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/crawls","body":{"start_url":"https://example.com","max_pages":10}}'
```

## Parameters

### Olostep Scrape
- **url_to_scrape** (required) - URL to scrape
- **formats** - Output formats (markdown, html, text)

### Scrapegraph
- **website_url** (required) - URL to scrape
- **user_prompt** (required) - Natural language description of what to extract

### Riveter
- **url** (required) - URL to scrape
- **schema** - JSON schema defining the data structure to extract

### Olostep Answer
- **task** (required) - Natural language task/question

## Response

### Olostep Response
Returns a scrape object:
- **id** (string) - Scrape ID (e.g., `scrape_z926lxxon3`)
- **result.markdown_content** (string|null) - Page content as markdown
- **result.html_content** (string|null) - Raw HTML (if requested via `formats`)
- **result.text_content** (string|null) - Plain text (if requested)
- **result.markdown_hosted_url** (string|null) - S3 URL for large content
- **result.links_on_page** (array) - Links found on the page
- **result.screenshot_hosted_url** (string|null) - Screenshot URL (if requested)
- **result.page_metadata** (object) - `status_code` of the page
- **credits_consumed** (integer) - Credits used for this scrape

**Async crawls**: POST `/v1/crawls` returns an `id`. Poll with GET `/v1/crawls/{id}` until complete.

### Scrapegraph Response
Returns structured extraction result:
- **request_id** (string) - Unique request identifier
- **status** (string) - `completed` or `pending`
- **result** (object) - AI-extracted data matching your prompt (dynamic keys)
- **error** (string) - Empty on success, error message on failure

**Note**: For large pages, the POST may return `status: "pending"`. Poll with GET `/v1/smartscraper/{request_id}` until `status` is `completed`.

### Riveter Response
Returns scrape result:
- **request_status** (string) - `success` or `error`
- **message** (string) - Human-readable status
- **text** (string) - Extracted page text content
- **url** (string) - URL that was scraped
- **status_code** (integer) - HTTP status of the page
- **run_key** (string) - Unique run identifier
- **base_url_for_links** (string) - Base URL for resolving relative links
- **riveter_app_link** (string) - Link to view run in Riveter dashboard
- **credit_used** (integer) - Credits consumed

## Examples

**User:** "Get all the product names and prices from this page"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper","body":{"website_url":"https://example.com/products","user_prompt":"Extract all products with name, price, and description"}}'
```

**User:** "Scrape the team page and get everyone's info"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper","body":{"website_url":"https://example.com/about/team","user_prompt":"Extract team members: name, role, bio, photo URL, LinkedIn"}}'
```

**User:** "What are Stripe's API pricing details?"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/answers","body":{"task":"Find Stripe API pricing breakdown from stripe.com/pricing"}}'
```

**User:** "Get all blog post titles and dates from this blog"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/scrape","body":{"url":"https://blog.example.com","schema":{"posts":[{"title":"string","date":"string","url":"string"}]}}}'
```

## Error Handling

- **504** - Olostep timeout on slow pages — retry or try a simpler URL
- **400** - Missing required parameters (`url_to_scrape` for Olostep, `website_url` + `user_prompt` for Scrapegraph, `url` for Riveter)
- Scrapegraph returns `error` field in response body — check it even on 200 status
- Riveter returns `request_status: "error"` with details in `message`
- Some sites block automated scraping — try a different API if one fails

## Tips

- Scrapegraph is best for natural language extraction
- Riveter is best when you know the exact schema you want
- Olostep is great for general scraping and AI answers
- For dynamic sites (JavaScript-heavy), these tools handle rendering
- Be specific in your prompts for better extraction results
- Some sites may block automated access
