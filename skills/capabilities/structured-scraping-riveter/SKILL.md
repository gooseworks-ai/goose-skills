---
name: structured-scraping-riveter
description: Web scraping with structured data extraction - define your output schema
source: orthogonal
---


# Riveter - Structured Web Scraping

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Scrape web pages and extract data into your defined structure.

## Capabilities

- **Scrape**: Scrape a webpage and return the text content
- **Run**: Copy link Define the structure of your output directly in the API request
- **Run data**: Retrieve the processed data from a completed project run (free)
- **Run status**: Check the current status of a project run (free)
- **Stop run**: Stop a currently running project (free)

## Usage

### Scrape
Scrape a webpage and return the text content. This endpoint allows you to extract text content from any public webpage.

Parameters:
- url* (string) - Example: "https://example.com"
- proxy_country_code (string) - Optional two-character country code for proxy (e.g., 'us', 'gb', 'de')
- skip_cache (boolean) - Default: false. Set to true to bypass cache and always fetch fresh content

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/scrape","body":{"url":"https://example.com/article"}}'
```

### Run
Copy link Define the structure of your output directly in the API request. This endpoint allows you to define both your input data and output configuration in a single request.

Parameters:
- input* (object) - The input object contains your source data:  Keys are column/attribute names Values are arrays of strings (all arrays must be the same length) Maximum 1000 rows per request
- output* (object) - The output object defines what data you want to extract:  Keys are the names of attributes you want to extract Each attribute requires: prompt: Instructions for finding/extracting this data contexts: Array of input or other output attribute names this depends on. Optional Output Configuration Each output attribute can optionally include:  format: Data type ('number', 'json', 'url', 'text', 'email', 'tag', 'date', 'boolean') format_details: Format-specific configuration (varies by format type). For json format, you can provide either a description (string) or a schema (JSON Schema object) or both. tools: Array of tools to use (['web_search', 'web_scrape', 'query_pdf', 'query_image']) max_tool_calls: Number of tool calls allowed (0-10) run_when: When to run this extraction ('always', 'any_filled', 'all_filled')
- run_key (string) - Custom identifier for this run (optional, will be generated if not provided)

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
    "price": {"prompt": "Product price", "contexts": ["urls"], "format": "number"}
  }
}'
```

### Run data (free)
Retrieve the processed data from a completed project run

Parameters:
- run_key* (string) - The run key (UUID) of the project run to retrieve data for

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run_data","query":{"run_key":"abc123"}}'
```

### Run status (free)
Check the current status of a project run

Parameters:
- run_key* (string) - The run key (UUID) of the project run to check

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run_status","query":{"run_key":"abc123"}}'
```

### Stop run (free)
Stop a currently running project. This will halt all processing and mark the run as stopped. Behavior:  If the run is already stopped or success, returns success with current status. If the run is in progress, stops all pending cells and marks the run as stopped.  Stopped runs cannot be resumed

Parameters:
- run_key* (string) - The run key (UUID) of the project run to stop

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/stop_run","query":{"run_key":"abc123"}}'
```

## Use Cases

1. **E-commerce Scraping**: Extract product data in consistent format
2. **Job Listings**: Gather job postings with structured fields
3. **News Aggregation**: Extract articles with title, date, content
4. **Price Monitoring**: Track prices across competitor sites

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"riveter API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/scrape"}'   # Get endpoint details
```
