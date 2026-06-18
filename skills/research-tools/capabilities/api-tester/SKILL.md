---
name: api-tester
description: Test and document API endpoints - validate responses, check status, generate examples
source: orthogonal
---


# API Tester - Test Any API Endpoint

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Test API endpoints, validate responses, and generate documentation examples.

## Workflow

### Step 1: Test GET Endpoints
Make GET requests to test endpoints:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":{"url":"https://api.example.com/health"}}'
```

### Step 2: Test POST Endpoints
Test POST requests by fetching API docs:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://api.example.com/docs",
  "user_prompt": "Extract all API endpoints, methods, parameters, and example responses"
}'
```

### Step 3: Get API Documentation
Fetch and parse API docs:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/markdownify","body":{"website_url":"https://api.example.com/docs"}}'
```

### Step 4: Validate Response Schema
Check response structure:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"riveter","path":"/v1/run"}'
  "url": "https://api.example.com/endpoint",
  "schema": {
    "id": "string",
    "name": "string",
    "created_at": "string"
  }
}'
```

## Example Usage

```bash
# Extract API spec from docs
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://stripe.com/docs/api",
  "user_prompt": "Extract API authentication methods and example curl commands"
}'

# Fetch API page
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":{"url":"https://api.openai.com/v1/models"}}'
```

## Tips

- Test both happy paths and error cases
- Verify response schemas match documentation
- Check rate limits and authentication
- Document any discrepancies found

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
