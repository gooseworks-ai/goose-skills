---
name: investor-research
description: Research VCs, angels, and investors - portfolio, thesis, contact info
source: orthogonal
---


# Investor Research - Find and Research Investors

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Research venture capitalists, angel investors, and their investment patterns.

## Workflow

### Step 1: Search for Investors
Find investors in your space:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/investor-search"}'
  "searchParams": {
    "investment_stages": ["Seed", "Series A"],
    "industries": ["AI", "SaaS", "Developer Tools"]
  }
}'
```

### Step 2: Find Portfolio Companies
See their existing investments:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "Sequoia Capital portfolio companies AI 2023 2024",
  "num_results": 30
}'
```

### Step 3: Find Partner Contacts
Get contact info for partners:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/people-search"}'
  "searchParams": {
    "company_names": ["Sequoia Capital"],
    "job_titles": ["Partner", "General Partner", "Principal"]
  }
}'
```

### Step 4: Get Partner Email
Find email for outreach:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-email"}'
  "lead": {
    "first_name": "Alfred",
    "last_name": "Lin",
    "company": "Sequoia Capital"
  }
}'
```

## Example Usage

```bash
# Find AI-focused investors
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/investor-search"}'
  "searchParams": {
    "industries": ["AI", "Machine Learning"],
    "investment_stages": ["Seed"],
    "locations": ["San Francisco", "New York"]
  }
}'

# Find angels in your space
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "angel investors who invest in developer tools startups",
  "num_results": 25
}'
```

## Tips

- Check for portfolio overlap before reaching out
- Find warm intros through mutual connections
- Research partner's personal investment interests
- Time outreach when raising (not too early/late)

## Discover More

List all endpoints, or add a path for parameter details:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"exa API endpoints"}' api show fiber
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"sixtyfour API endpoints"}'

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes`"}' for endpoint parameters.
