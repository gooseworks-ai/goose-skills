---
name: job-search
description: Search for jobs matching your skills, experience, and preferences
source: orthogonal
---


# Job Search - Find Your Next Role

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Search for jobs matching your skills, experience level, and location preferences.

## Workflow

### Step 1: Search Job Listings
Use Fiber to search for jobs:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/job-search"}'
  "searchParams": {
    "job_titles": ["Software Engineer", "Full Stack Developer"],
    "locations": ["San Francisco", "Remote"],
    "experience_level": "senior"
  }
}'
```

### Step 2: Research Companies
Get company information for interesting roles:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/company-search"}'
  "searchParams": {
    "company_names": ["Stripe", "Figma", "Notion"]
  }
}'
```

### Step 3: Get Company Intel
Use Brand.dev for detailed company info:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"stripe.com"}}'
```

### Step 4: Find Hiring Managers
Find people at the company to network with:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/people-search"}'
  "searchParams": {
    "company_names": ["Stripe"],
    "job_titles": ["Engineering Manager", "VP Engineering", "CTO"]
  }
}'
```

### Step 5: Get Contact Info
Find email for outreach:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-finder","query":{"domain":"stripe.com","first_name":"John","last_name":"Doe"}}'
```

## Example Usage

```bash
# Search for remote AI jobs
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/job-search"}'
  "searchParams": {
    "job_titles": ["Machine Learning Engineer", "AI Engineer"],
    "locations": ["Remote"],
    "keywords": ["LLM", "generative AI"]
  }
}'

# Research a company
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "Tell me about Anthropic - funding, team size, culture"
}'
```

## Tips

- Customize your search for each application
- Research company culture before applying
- Network with people at target companies
- Set up alerts for new postings

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
  -d '{"prompt":"hunter API endpoints"}'

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes`"}' for endpoint parameters.
