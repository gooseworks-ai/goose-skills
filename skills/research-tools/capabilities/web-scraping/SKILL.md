---
name: web-scraping
description: Scrape websites, extract structured data, and automate browsers. Use when asked to scrape, extract, crawl, parse, or pull data from web pages or any URL.
source: orthogonal
---


# Scrape — General-Purpose Web Scraping & Data Extraction

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Scrape websites, extract structured data, and automate browser interactions. Pick the best API for the task — or combine several for comprehensive extraction.

## 1. Scrapegraph — AI-Powered Scraping with Natural Language

Best for: Extracting data using plain English prompts, converting pages to markdown, crawling with AI extraction, and search-based scraping.

**AI-powered extraction** (describe what you want in natural language):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://example.com/products",
  "user_prompt": "Extract all product names, prices, descriptions, and image URLs"
}'
```

**With output schema** (enforce structure):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://example.com/products",
  "user_prompt": "Extract all products",
  "output_schema": {
    "properties": {
      "products": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": {"type": "string"},
            "price": {"type": "number"},
            "description": {"type": "string"}
          }
        }
      }
    }
  }
}'
```

**Search + scrape** (search the web and extract from results):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper","body":{"user_prompt":"Find the latest iPhone prices from major retailers"}}'
# Poll for results:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper/{request_id}"}'
```

**Convert page to markdown:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/markdownify","body":{"website_url":"https://example.com/article"}}'
```

**Crawl with AI extraction:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/crawl"}'
  "url": "https://docs.example.com",
  "prompt": "Extract all API endpoints and their descriptions",
  "max_pages": 20
}'
# Poll for results:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/crawl/{task_id}"}'
```

**Raw HTML scrape:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/scrape","body":{"website_url":"https://example.com"}}'
```

**Get sitemap:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/sitemap","body":{"website_url":"https://example.com"}}'
```

Key parameters: `stealth` (bypass bot protection, +4 credits), `total_pages` (paginate up to 100), `number_of_scrolls` (infinite scroll pages), `render_heavy_js` (React/Vue/Angular SPAs), `steps` (interaction steps before extraction).

## 2. Olostep — Scalable Scraping & Batch Jobs

Best for: High-volume scraping, batch processing, site crawling, URL discovery, and AI-powered answers from pages.

**Scrape a single page:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes","body":{"url_to_scrape":"https://example.com/page"}}'
```

**AI-powered answer from the web:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/answers","body":{"task":"What is the pricing for Stripe?"}}'
```

**Discover all URLs on a site:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/maps","body":{"url":"https://example.com","search_query":"pricing"}}'
```

**Crawl a site** (async):
```bash
# Step 1: Start crawl
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/crawls"}'
  "start_url": "https://docs.example.com",
  "max_pages": 100,
  "include_urls": ["/docs/**"]
}'
# Step 2: Check status
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/crawls/{crawl_id}"}'
# Step 3: Get pages
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/crawls/{crawl_id}/pages"}'
# Step 4: Retrieve content
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/retrieve","body":{"retrieve_id":"RETRIEVE_ID"}}'
```

**Batch scrape** (process many URLs at once):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/batches"}'
  "items": [
    {"url_to_scrape": "https://example.com/page1"},
    {"url_to_scrape": "https://example.com/page2"},
    {"url_to_scrape": "https://example.com/page3"}
  ]
}'
# Check status:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/batches/{batch_id}"}'
# Get items:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/batches/{batch_id}/items"}'
```

Key parameters: `formats` (markdown/html/text), `country` (US, CA, IT, IN, GB, JP, etc.), `actions` (page interactions before scraping), `wait_before_scraping`, `remove_css_selectors`, `llm_extract`.

## 3. Riveter — Structured Extraction with Defined Schemas

Best for: Extracting data into a consistent, predefined structure. Define input URLs and output fields with prompts.

**Simple page scrape:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/scrape","body":{"url":"https://example.com/article"}}'
```

**Structured extraction** (define your output schema):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run"}'
  "input": {
    "urls": ["https://example.com/products"]
  },
  "output": {
    "name": {"prompt": "Product name", "contexts": ["urls"]},
    "price": {"prompt": "Product price", "contexts": ["urls"], "format": "number"},
    "description": {"prompt": "Product description", "contexts": ["urls"]}
  }
}'
# Check status:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run_status","query":{"run_key":"RUN_KEY"}}'
# Get data:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run_data","query":{"run_key":"RUN_KEY"}}'
```

**Multi-URL extraction with tools:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run"}'
  "input": {
    "company_urls": ["https://stripe.com", "https://vercel.com"]
  },
  "output": {
    "company_name": {"prompt": "Company name", "contexts": ["company_urls"]},
    "pricing_url": {"prompt": "URL to pricing page", "contexts": ["company_urls"], "format": "url"},
    "pricing_details": {"prompt": "Pricing tiers and costs", "contexts": ["pricing_url"], "tools": ["web_scrape"]}
  }
}'
```

Key parameters: Output `format` options (number/json/url/text/email/tag/date/boolean), `tools` (web_search/web_scrape/query_pdf/query_image), `max_tool_calls` (0-10), `run_when` (always/any_filled/all_filled).

## 4. Brand.dev — Brand Assets, Logos & Company Data

Best for: Extracting brand logos, colors, fonts, design systems, screenshots, and AI-powered data extraction from company websites.

**Get full brand data:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"stripe.com"}}'
```

**By company name / email / ticker:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve-by-name","query":{"name":"Stripe"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve-by-email","query":{"email":"john@stripe.com"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve-by-ticker","query":{"ticker":"AAPL"}}'
```

**Extract design system / styleguide:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/styleguide","query":{"domain":"linear.app"}}'
```

**Extract fonts:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/fonts","query":{"domain":"vercel.com"}}'
```

**Take website screenshot:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/screenshot","query":{"domain":"github.com","fullScreenshot":"true"}}'
```

**AI-powered data extraction:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/ai/query"}'
  "domain": "anthropic.com",
  "data_to_extract": [{"name": "products", "description": "What products does this company offer?"}]
}'
```

**Extract products:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/ai/products","body":{"domain":"stripe.com"}}'
```

## 5. Notte — Browser Automation & Page Interaction

Best for: Scraping pages that require browser interaction, CAPTCHAs, login flows, or complex JavaScript rendering. Also supports autonomous AI agents for multi-step browser tasks.

**Quick scrape** (no session needed):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/scrape","body":{"url":"https://example.com"}}'
```

**Session-based scraping** (for complex interactions):
```bash
# Step 1: Start a browser session
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/start","body":{"url":"https://example.com","proxies":true,"solve_captchas":true}}'

# Step 2: Observe available actions
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/observe","body":{"instruction":"Find the search box"}}'

# Step 3: Execute actions
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute","body":{"instruction":"Click the search button"}}'

# Step 4: Scrape the page
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/scrape","body":{"only_main_content":true}}'

# Step 5: Stop session
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/stop"}'
```

**AI agent** (autonomous multi-step browser task):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/agents/start"}'
  "task": "Go to Google, search for AI news, and summarize the top 5 results",
  "url": "https://google.com",
  "max_steps": 20
}'
# Check status:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/agents/{agent_id}"}'
```

**Take screenshot:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/screenshot","body":{"full_page":true}}'
```

Key parameters: `proxies` (rotate proxies), `solve_captchas` (auto-solve), `headless` (default true), `browser_type` (chromium/chrome/firefox), `viewport_width`/`viewport_height`.

## Tips

- **Simple page scrape**: Start with Olostep for raw content or Scrapegraph SmartScraper for AI-extracted data
- **Natural language extraction**: Scrapegraph is the go-to — describe what you want in English, optionally pass an `output_schema`
- **Structured/schema-based extraction**: Riveter lets you define exact fields and formats for consistent output
- **Brand assets & logos**: Brand.dev for logos, colors, fonts, design systems, and screenshots
- **Bot protection**: Use Scrapegraph's `stealth: true` or Notte's `proxies: true` + `solve_captchas: true`
- **JavaScript-heavy SPAs**: Use Scrapegraph's `render_heavy_js: true` or Notte browser sessions
- **Batch/bulk scraping**: Olostep batches for processing many URLs at once with constant processing time
- **Async crawls**: Olostep and Scrapegraph crawls are async — start with POST, poll for results
- **Page interactions**: Use Scrapegraph `steps` for simple interactions before extraction, or Notte sessions for complex multi-step flows
- **Pagination**: Scrapegraph's `total_pages` (up to 100) handles multi-page extraction automatically
- **Convert to markdown**: Scrapegraph `/v1/markdownify` for clean markdown from any page
- **Combine APIs**: For maximum data, use Scrapegraph for AI extraction + Riveter for structured validation + Olostep for raw content

## Discover More

List all endpoints for any API, or add a path for parameter details:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"scrapegraph API endpoints"}' api show olostep
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"riveter API endpoints"}' api show brand-dev
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"notte API endpoints"}'

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper`"}' for full parameter details.
