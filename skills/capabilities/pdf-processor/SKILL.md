---
name: pdf-processor
description: Process PDFs - extract text, tables, and structured data from documents
source: orthogonal
---


# PDF Processor - Extract Data from PDFs

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Extract text, tables, and structured data from PDF documents.

## Workflow

### Step 1: Fetch PDF Content
Use Linkup to fetch PDF URLs:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":{"url":"https://example.com/document.pdf"}}'
```

### Step 2: Extract with AI
Use ScrapeGraph to extract specific content:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://example.com/report.pdf",
  "user_prompt": "Extract all financial figures, tables, and key metrics from this document"
}'
```

### Step 3: Extract Tables
Get structured table data:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run"}'
  "input": {
    "urls": ["https://example.com/report.pdf"]
  },
  "output": {
    "tables": {"prompt": "Extract all tables with titles, headers, and rows", "contexts": ["urls"]}
  }
}'
```

### Step 4: Convert to Markdown
Get readable markdown output:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/markdownify","body":{"website_url":"https://example.com/document.pdf"}}'
```

## Example Usage

```bash
# Extract data from financial report
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://example.com/annual-report.pdf",
  "user_prompt": "Extract revenue, profit, and key business metrics with their values"
}'

# Extract invoice data
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run"}'
  "input": {"urls": ["https://example.com/invoice.pdf"]},
  "output": {
    "vendor": {"prompt": "Vendor name", "contexts": ["urls"]},
    "amount": {"prompt": "Total amount", "contexts": ["urls"]},
    "date": {"prompt": "Invoice date", "contexts": ["urls"]}
  }
}'
```

## Tips

- Specify exact data you need for better extraction
- Use schemas for consistent structured output
- Handle multi-page documents in chunks
- Verify extracted numbers against source

## Discover More

List all endpoints, or add a path for parameter details:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"linkup API endpoints"}' api show riveter
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"scrapegraph API endpoints"}'

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes`"}' for endpoint parameters.
