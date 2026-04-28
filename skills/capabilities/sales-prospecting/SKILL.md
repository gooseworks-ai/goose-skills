---
name: sales-prospecting
description: Build targeted prospect lists with verified contact information
source: orthogonal
---


# Sales Prospecting - Build Quality Lead Lists

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Build targeted prospect lists with verified emails and contact information.

## Workflow

### Step 1: Define Target Companies
Search for companies matching your ICP:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "B2B SaaS startups in San Francisco with 50-200 employees Series A or B funded"
}'
```

### Step 2: Find Decision Makers
Search for people at target companies:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/people-search"}'
  "searchParams": {
    "job_titles": ["CTO", "VP Engineering", "Head of Engineering"],
    "company_names": ["Stripe", "Figma", "Notion"],
    "locations": ["San Francisco"]
  }
}'
```

### Step 3: Get All Emails for Company
Find all contacts at a domain:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/domain-search","query":{"domain":"stripe.com"}}'
```

### Step 4: Find Specific Contact's Email
Find email for a specific person:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-email"}'
  "lead": {
    "first_name": "Sarah",
    "last_name": "Chen",
    "domain": "stripe.com"
  }
}'
```

### Step 5: Verify Emails
Check deliverability before outreach:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/validate-email/single","body":{"email":"sarah@stripe.com"}}'
```

### Step 6: Enrich with Company Data
Get company context for personalization:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"stripe.com"}}'
```

## Prospecting Pipeline

```bash
# 1. Find companies (Fiber)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/company-search"}'
  "searchParams": {
    "industries": ["Software", "SaaS"],
    "employee_count_min": 50,
    "employee_count_max": 500,
    "locations": ["San Francisco", "New York"]
  }
}'

# 2. Find decision makers (Fiber)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/people-search"}'
  "searchParams": {
    "job_titles": ["VP Sales", "Head of Sales", "CRO"],
    "company_domains": ["company1.com", "company2.com"]
  }
}'

# 3. Get emails (Hunter)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/domain-search","query":{"domain":"company1.com"}}'

# 4. Verify emails (Fiber)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/validate-email/single","body":{"email":"lead@company.com"}}'
```

## Tips

- Target specific job titles relevant to your product
- Verify all emails before adding to sequences
- Personalize outreach with company context
- Track email engagement for list optimization

## Discover More

List all endpoints, or add a path for parameter details:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"brand-dev API endpoints"}' api show fiber
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"hunter API endpoints"}' api show sixtyfour 
```

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes`"}' for endpoint parameters.
