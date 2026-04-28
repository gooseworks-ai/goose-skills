---
name: image-analyzer
description: Analyze images with AI - extract text, describe content, detect objects
source: orthogonal
---


# Image Analyzer - AI Image Analysis

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Analyze images to extract text, describe content, and detect objects using AI.

## Workflow

### Step 1: Get Image from URL
Fetch image content:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":{"url":"https://example.com/image.jpg"}}'
```

### Step 2: Extract Text (OCR)
Use AI to extract text from images:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://example.com/screenshot.png",
  "user_prompt": "Extract all visible text from this image"
}'
```

### Step 3: Extract Structured Data
Get specific data from images:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run"}'
  "input": {
    "urls": ["https://example.com/receipt.jpg"]
  },
  "output": {
    "store_name": {"prompt": "Store name", "contexts": ["urls"]},
    "date": {"prompt": "Date", "contexts": ["urls"]},
    "items": {"prompt": "Items with names and prices", "contexts": ["urls"]},
    "total": {"prompt": "Total amount", "contexts": ["urls"]}
  }
}'
```

### Step 4: Capture Website Screenshots
Get screenshots of web pages:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/screenshot","query":{"domain":"stripe.com"}}'
```

## Example Usage

```bash
# Extract receipt data
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://example.com/receipt.jpg",
  "user_prompt": "Extract store name, date, all items with prices, and total amount"
}'

# Get website screenshot
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/screenshot","query":{"domain":"openai.com"}}'
```

## Tips

- Use clear, high-resolution images
- Specify exact data needed for extraction
- Combine with OCR for text-heavy images
- Use screenshots for website analysis

## Discover More

List all endpoints, or add a path for parameter details:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"brand-dev API endpoints"}' api show linkup
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"riveter API endpoints"}' api show scrapegraph
```

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes`"}' for endpoint parameters.
