---
name: company-domain-lookup-logodev
description: Logo.dev - search for company domains by brand name
source: orthogonal
---


# Logo.dev - Company Domain Search

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Find company domains by searching brand names.

## Capabilities

- **Brand Search**: Search for company domains by brand name

## Usage

### Brand Search
Search for company domains by brand name

Parameters:
- q* (string)
- strategy (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"logo","path":"/search","query":{"q":"Stripe"}}'
```

## Use Cases

1. **Domain Discovery**: Find official domains for companies
2. **Brand Research**: Identify company websites
3. **Lead Enrichment**: Get domains from company names
4. **Data Cleaning**: Standardize company domains in datasets

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"logo API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"logo","path":"/search"}'   # Get endpoint details
```
