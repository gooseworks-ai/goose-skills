---
name: email-finder-hunter
description: Email finder and verifier - find emails, verify deliverability, discover companies
source: orthogonal
---


# Hunter - Email Intelligence

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Find email addresses, verify deliverability, and discover companies.

## Capabilities

- **Combined Enrichment**: Get both person AND company information from an email address in a single request
- **Email Enrichment**: Get detailed person information from an email address - name, location, employment, social profiles
- **Email Count**: Get count of email addresses we have for a domain, broken down by department and seniority
- **Discover Companies**: Find companies matching criteria using filters or natural language
- **Company Enrichment**: Get detailed company information from a domain - industry, description, location, size, tech stack, funding
- **Domain Search**: Find all email addresses for a domain
- **Email Finder**: Find the most likely email address for a person given their name and company domain
- **Email Verifier**: Verify if an email address is deliverable

## Usage

### Combined Enrichment
Get both person AND company information from an email address in a single request.

Parameters:
- email* (string) - Email address to enrich

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/combined/find","query":{"email":"jane@company.com"}}'
```

### Email Enrichment
Get detailed person information from an email address - name, location, employment, social profiles.

Parameters:
- email (string) - Email address to enrich
- linkedin_handle (string) - LinkedIn handle to enrich

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/people/find","query":{"email":"john@company.com"}}'
```

### Email Count
Get count of email addresses we have for a domain, broken down by department and seniority. FREE endpoint.

Parameters:
- domain (string) - Domain to count emails for
- company (string) - Company name (domain preferred)
- type (string) - Filter: personal or generic

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-count","query":{"domain":"google.com"}}'
```

### Discover Companies
Find companies matching criteria using filters or natural language. Returns up to 100 companies per request. FREE endpoint.

Parameters:
- query (string) - Natural language search (e.g. Companies in Europe in Tech)
- headquarters_location (object) - Filter by HQ location
- industry (object) - Filter by industry
- headcount (array) - Filter by employee count ranges
- limit (integer) - Max results (default 100)
- offset (integer) - Skip N results for pagination

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/discover","body":{"query":"AI startups in San Francisco"}}'
```

### Company Enrichment
Get detailed company information from a domain - industry, description, location, size, tech stack, funding.

Parameters:
- domain* (string) - Company domain to enrich (e.g. hunter.io)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/companies/find","query":{"domain":"anthropic.com"}}'
```

### Domain Search
Find all email addresses for a domain. Returns emails with sources, confidence scores, and verification status.

Parameters:
- domain* (string) - Domain to search (e.g. stripe.com)
- limit (integer) - Max emails to return (default 10)
- offset (integer) - Skip N emails
- type (string) - Filter: personal or generic
- seniority (string) - Filter: junior, senior, or executive
- department (string) - Filter by department (sales, marketing, etc)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/domain-search","query":{"domain":"stripe.com"}}'
```

### Email Finder
Find the most likely email address for a person given their name and company domain.

Parameters:
- domain (string) - Company domain (e.g. reddit.com)
- company (string) - Company name (domain preferred)
- first_name (string) - Person first name
- last_name (string) - Person last name
- full_name (string) - Full name (if first/last not available)
- linkedin_handle (string) - LinkedIn profile handle

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-finder","query":{"domain":"openai.com","first_name":"Sam","last_name":"Altman"}}'
```

### Email Verifier
Verify if an email address is deliverable. Returns status (valid, invalid, accept_all, webmail, disposable, unknown).

Parameters:
- email* (string) - Email address to verify

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-verifier","query":{"email":"john@example.com"}}'
```

## Use Cases

1. **Sales Outreach**: Find verified emails at target companies
2. **Lead Generation**: Build email lists by domain
3. **Email Validation**: Clean lists before campaigns
4. **Company Research**: Find companies matching criteria
5. **Contact Enrichment**: Get full profiles from emails

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"hunter API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/combined/find"}'   # Get endpoint details
```
