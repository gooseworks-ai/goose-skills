---
name: ai-web-scraping-scrapegraph
description: AI-powered web scraping - extract data using natural language prompts
source: orthogonal
---


# ScrapeGraph AI - Intelligent Web Scraping

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Extract web content using AI with natural language prompts.

## Capabilities

- **Start SmartScraper**: Extract content from a webpage using AI by providing a natural language prompt and a URL
- **Start SearchScraper**: Start a new AI-powered web search request
- **Scrape**: Extract raw HTML content from web pages with JavaScript rendering support
- **Start SmartCrawler**: Start a new web crawl request with AI extraction or markdown conversion
- **Start Sitemap**: Extract all URLs from a website sitemap automatically
- **Start Markdownify**: Convert any webpage into clean, readable Markdown format
- **Get SearchScraper Status**: Get the status and results of a previous search request (free)
- **Get Markdownify Status**: Check the status and retrieve results of a Markdownify request (free)
- **Get Sitemap Status**: Check the status and retrieve results of a Sitemap request (free)
- **Get SmartCrawler Status**: Get the status and results of a previous smartcrawl request (free)
- **Get SmartScraper Status**: Check the status and retrieve results of a SmartScraper request (free)

## Usage

### Start SmartScraper
Extract content from a webpage using AI by providing a natural language prompt and a URL.

Parameters:
- user_prompt* (string) - Natural language description of what information you want to extract from the webpage.
- website_url* (string) - The URL of the webpage you want to extract information from. You must provide exactly one of: website_url, website_html, or website_markdown.
- website_html (string) - Raw HTML content to process directly (max 2MB). Mutually exclusive with website_url and website_markdown. Useful when you already have HTML content cached or want to process modified HTML.
- headers (object) - Optional custom HTTP headers to send with the request. Useful for setting User-Agent, cookies, authentication tokens, and other request metadata. Example: {"User-Agent": "Mozilla/5.0...", "Cookie": "session=abc123"}
- output_schema (object) - Optional schema to structure the output. If provided, the AI will attempt to format the results according to this schema.
- stealth (boolean) - Enable stealth mode to bypass bot protection using advanced anti-detection techniques. Adds +4 credits to the request cost
-  website_markdown (string) - Raw Markdown content to process directly (max 2MB). Mutually exclusive with website_url and website_html. Perfect for extracting structured data from Markdown documentation, README files, or any content already in Markdown format.
- total_pages (number) - Optional parameter to enable pagination and scrape multiple pages. Specify the number of pages to extract data from. Default: 1 Range: 1-100
-  number_of_scrolls (number) - Optional parameter for infinite scroll pages. Specify how many times to scroll down to load more content before extraction. Default: 0 Range: 0-50
-  render_heavy_js (boolean) - Optional parameter to enable enhanced JavaScript rendering for heavy JS websites (React, Vue, Angular, SPAs). Use when standard rendering doesn’t capture all content. Default: false
-  mock (boolean) - Optional parameter to enable mock mode. When set to true, the request will return mock data instead of performing an actual extraction. Useful for testing and development. Default: false
-  cookies (object) - Optional cookies object for authentication and session management. Useful for accessing authenticated pages or maintaining session state. Example: {"session_id": "abc123", "auth_token": "xyz789"}
-  steps (array) - Optional array of interaction steps to perform on the webpage before extraction. Each step is a string describing the action to take (e.g., “click on filter button”, “wait for results to load”). Example: ["click on search button", "type query in search box", "wait for results"]

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://example.com/products",
  "user_prompt": "Extract all product names and prices"
}'
```

### Start SearchScraper
Start a new AI-powered web search request

Parameters:
- user_prompt* (string) - The search query or question you want to ask. This should be a clear and specific prompt that will guide the AI in finding and extracting relevant information. Example: “What is the latest version of Python and what are its main features?”
- headers (object) - Optional headers to customize the search behavior. This can include user agent, cookies, or other HTTP headers. Example: {   "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",   "Cookie": "cookie1=value1; cookie2=value2" }
- output_schema (object) - Optional schema to structure the output. If provided, the AI will attempt to format the results according to this schema. Example: {   "properties": {     "version": {"type": "string"},     "release_date": {"type": "string"},     "major_features": {"type": "array", "items": {"type": "string"}}   },   "required": ["version", "release_date", "major_features"] }
- mock (string) - Optional parameter to enable mock mode. When set to true, the request will return mock data instead of performing an actual search. Useful for testing and development. Default: false
- stealth (boolean) - Optional parameter to enable stealth mode. When set to true, the scraper will use advanced anti-detection techniques to bypass bot protection and access protected websites. Adds +4 credits to the request cost. Default: false

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper","body":{"user_prompt":"Find the latest iPhone prices from major retailers"}}'
```

### Scrape
Extract raw HTML content from web pages with JavaScript rendering support

Parameters:
- website_url* (string) - The URL of the webpage to scrape. Example: "https://example.com"
- render_heavy_js (boolean) - Set to true for heavy JavaScript rendering. Default: false
- branding (boolean) - Return extracted brand design and metadata. Default: false
- stealth (string) - Enable stealth mode for anti-bot protection. Adds additional credits. Default: false

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/scrape","body":{"website_url":"https://example.com"}}'
```

### Start SmartCrawler
Start a new web crawl request with AI extraction or markdown conversion

Parameters:
- url* (string)
- prompt (string)
- extraction_mode (boolean)
- cache_website (boolean)
- depth (number)
- max_pages (number)
- same_domain_only (boolean)
- batch_size (integer)
- schema (object)
- rules (object)
- sitemap (string)
- render_heavy_js (string)
- stealth (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/crawl"}'
  "url": "https://docs.example.com",
  "prompt": "Extract all API endpoints and their descriptions"
}'
```

### Start Sitemap
Extract all URLs from a website sitemap automatically.

Parameters:
- website_url* (string) - The URL of the website you want to extract the sitemap from. The API will automatically locate the sitemap.xml file.
- headers (object) - Optional headers to customize the request behavior. This can include user agent, cookies, or other HTTP headers.
- mock (boolean) - Optional parameter to enable mock mode. When set to true, the request will return mock data instead of performing an actual extraction. Useful for testing and development.
- stealth (boolean) - Optional parameter to enable stealth mode. When set to true, the scraper will use advanced anti-detection techniques to bypass bot protection and access protected websites. Adds +4 credits to the request cost.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/sitemap","body":{"website_url":"https://example.com"}}'
```

### Start Markdownify
Convert any webpage into clean, readable Markdown format.

Parameters:
- website_url* (string) - The URL of the webpage you want to convert to markdown.
- headers (object) - Optional headers to send with the request, including cookies and user agent
- stealth (boolean) - Enable stealth mode to bypass bot protection using advanced anti-detection techniques. Adds +4 credits to the request cost

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/markdownify","body":{"website_url":"https://example.com/article"}}'
```

### Get SearchScraper Status (free)
Get the status and results of a previous search request

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper/{request_id}"}'
```

### Get Markdownify Status (free)
Check the status and retrieve results of a Markdownify request.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/markdownify/{request_id}"}'
```

### Get Sitemap Status (free)
Check the status and retrieve results of a Sitemap request.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/sitemap/{request_id}"}'
```

### Get SmartCrawler Status (free)
Get the status and results of a previous smartcrawl request

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/crawl/{task_id}"}'
```

### Get SmartScraper Status (free)
Check the status and retrieve results of a SmartScraper request.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper/{request_id}"}'
```

## Use Cases

1. **Data Extraction**: Extract structured data without writing selectors
2. **Research**: Gather information from multiple sources
3. **Price Monitoring**: Track prices across e-commerce sites
4. **Content Conversion**: Convert web pages to markdown for LLMs
5. **Site Analysis**: Map site structure and content

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"scrapegraph API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'   # Get endpoint details
```
