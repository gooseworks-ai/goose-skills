---
name: orthogonal-market-research
description: Research market trends, size, competitors, and growth opportunities
source: orthogonal
---


# Market Research - Comprehensive Market Analysis

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Research market size, trends, competitors, and growth opportunities for any industry.

## Workflow

### Step 1: Identify Key Players
Find companies in the market:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "AI software companies with over 100 employees, Series B or later funding"
}'
```

### Step 2: Research Company Details
Get detailed info on key players:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/company-search"}'
  "searchParams": {
    "company_names": ["OpenAI", "Anthropic", "Cohere"],
    "include_financials": true
  }
}'
```

### Step 3: Find Decision Makers
Identify leadership at key companies.

**Use Apollo first ($0.01 flat per call — cheapest option):**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/apollo/mixed_people/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "person_titles": ["CEO", "CTO", "VP Product", "Head of Sales"],
  "organization_domains": ["openai.com", "anthropic.com"],
  "per_page": 25
}'
```

**Fallback — Fiber people search ($0.02/record):**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/fiber/v1/people-search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "searchParams": {
    "company_names": ["OpenAI", "Anthropic"],
    "job_titles": ["CEO", "CTO", "VP Product", "Head of Sales"]
  }
}'
```

## Example Usage

```bash
# Find companies by industry and size
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "EdTech companies with 50-500 employees founded after 2018"
}'

# Search by specific criteria
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/company-search"}'
  "searchParams": {
    "industries": ["Enterprise Software"],
    "employee_count_min": 100,
    "funding_stage": ["Series A", "Series B"]
  }
}'
```

## Tips

- Cite specific sources and dates for statistics
- Compare multiple analyst reports
- Look for both bullish and bearish perspectives
- Update research quarterly for fast-moving markets

## Discover More

List all endpoints, or add a path for parameter details:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"fiber API endpoints"}'

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes`"}' for endpoint parameters.
