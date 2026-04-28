---
name: email-finder-tomba
description: Email finder and verifier - find emails from domains, LinkedIn, or company search
source: orthogonal
---


# Tomba - Email Finding & Verification

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Find and verify email addresses from domains, LinkedIn profiles, or natural language search.

## Capabilities

- **Validate Phone**: Validate a phone number and get carrier information
- **Domain Status**: Check the status and availability of a domain
- **Email Format**: Get the email format patterns used by a domain (e.g. first.last, firstlast)
- **Find Person**: Get person information from an email address
- **Combined Enrichment**: Get combined person and company information from an email
- **Domain Suggestions**: Get domain suggestions for a company name
- **Email Count**: Get the count of email addresses for a domain, broken down by department and seniority
- **Author Finder**: Find the email address of a blog post author from the article URL
- **LinkedIn Finder**: Find the email address from a LinkedIn profile URL
- **Technology Stack**: Discover technologies used by a website
- **Verify Email**: Verify the deliverability of an email address
- **Find Company**: Get company information from a domain
- **Location**: Get employee location distribution for a domain
- **Domain Search**: Search emails based on a website domain
- **Email Enrichment**: Enrich an email address with person and company data (name, location, social handles)
- **Find Phone**: Find phone numbers associated with an email, domain, or LinkedIn profile
- **Similar Domains**: Find domains similar to a given domain
- **Email Finder**: Find the most likely email address from a domain name, first name, and last name
- **Email Sources**: Find the sources where an email was found on the web
- **Search Companies**: Search for companies using natural language queries or structured filters

## Usage

### Validate Phone
Validate a phone number and get carrier information.

Parameters:
- phone* (string) - Phone number to validate
- country_code (string) - Country code (e.g., US)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/phone-validator","query":{"phone":"+14155552671"}}'
```

### Domain Status
Check the status and availability of a domain.

Parameters:
- domain* (string) - Domain to check

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/domain-status","query":{"domain":"stripe.com"}}'
```

### Email Format
Get the email format patterns used by a domain (e.g. first.last, firstlast).

Parameters:
- domain* (string) - Domain name, e.g. stripe.com

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-format","query":{"domain":"stripe.com"}}'
```

### Find Person
Get person information from an email address.

Parameters:
- email* (string) - Email address to look up

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/people/find","query":{"email":"john@stripe.com"}}'
```

### Combined Enrichment
Get combined person and company information from an email.

Parameters:
- email* (string) - Email address to enrich

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/combined/find","query":{"email":"john@stripe.com"}}'
```

### Domain Suggestions
Get domain suggestions for a company name

Parameters:
- query* (string) - The domain or company name to find suggestions for

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/domain-suggestions","query":{"query":"Google"}}'
```

### Email Count
Get the count of email addresses for a domain, broken down by department and seniority.

Parameters:
- domain* (string) - Domain name, e.g. stripe.com

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-count","query":{"domain":"openai.com"}}'
```

### Author Finder
Find the email address of a blog post author from the article URL.

Parameters:
- url* (string) - URL of the blog post/article

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/author-finder","query":{"url":"https://example.com/blog/post"}}'
```

### LinkedIn Finder
Find the email address from a LinkedIn profile URL.

Parameters:
- url* (string) - LinkedIn profile URL
- enrich_mobile (string) - Set to true to get phone number

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/linkedin","query":{"url":"https://linkedin.com/in/johndoe"}}'
```

### Technology Stack
Discover technologies used by a website.

Parameters:
- domain* (string) - Domain to analyze

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/technology","query":{"domain":"stripe.com"}}'
```

### Verify Email
Verify the deliverability of an email address.

Parameters:
- email* (string) - The email address to verify

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-verifier","query":{"email":"john@example.com"}}'
```

### Find Company
Get company information from a domain.

Parameters:
- domain* (string) - Domain name (e.g., stripe.com)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/companies/find","query":{"domain":"anthropic.com"}}'
```

### Location
Get employee location distribution for a domain.

Parameters:
- domain* (string) - Domain name, e.g. stripe.com

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/location","query":{"domain":"stripe.com"}}'
```

### Domain Search
Search emails based on a website domain. Returns all email addresses found on the internet for a given domain, with organization info and employee details.

Parameters:
- domain* (string) - Domain name to search, e.g. stripe.com
- company* (string) - Company name (3-75 chars)
- page (string) - Page number (default 1)
- limit (string) - Results per page: 10, 20, or 50 (default 10)
- country (string) - Two-letter country code filter
- department (string) - Department filter: engineering, sales, finance, hr, it, marketing, operations, management, executive, legal, support, communication, software, security, pr, warehouse, diversity, administrative, facilities, accounting

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/domain-search","query":{"domain":"stripe.com"}}'
```

### Email Enrichment
Enrich an email address with person and company data (name, location, social handles).

Parameters:
- email* (string) - Email address to enrich
- enrich_mobile (string) - Set to true to get phone number

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/enrich","query":{"email":"john@stripe.com"}}'
```

### Find Phone
Find phone numbers associated with an email, domain, or LinkedIn profile.

Parameters:
- email (string) - Email address to find phone for
- domain (string) - Domain to find phone numbers for
- linkedin (string) - LinkedIn profile URL
- full (boolean) - Set to true to get all phone numbers

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/phone-finder","query":{"domain":"stripe.com","first_name":"John","last_name":"Doe"}}'
```

### Similar Domains
Find domains similar to a given domain.

Parameters:
- domain* (string) - Domain to find similar domains for

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/similar","query":{"domain":"stripe.com"}}'
```

### Email Finder
Find the most likely email address from a domain name, first name, and last name.

Parameters:
- domain* (string) - Domain name, e.g. stripe.com
- company* (string) - Company name (3-75 chars)
- full_name (string) - Full name of the person
- first_name (string) - First name of the person
- last_name (string) - Last name of the person
- enrich_mobile (string) - Set to true to get phone number

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-finder","query":{"domain":"stripe.com","first_name":"John","last_name":"Doe"}}'
```

### Email Sources
Find the sources where an email was found on the web.

Parameters:
- email* (string) - Email address to find sources for

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-sources","query":{"email":"john@stripe.com"}}'
```

### Search Companies
Search for companies using natural language queries or structured filters. AI assistant generates appropriate filters from your query.

Parameters:
- query (string) - Natural language query (8-100 chars). AI generates filters from this. Use only on first request, then use filters for pagination.
- filters (object) - Structured filters: company, location_country, location_city, location_state, industry, size, type, keywords, founded, technologies, similar, revenue, sic, naics. Each has include/exclude arrays.
- page (integer) - Page number for pagination (1-1000, default: 1)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/reveal/search","body":{"query":"AI startups in San Francisco with 50+ employees"}}'
```

## Use Cases

1. **Sales Prospecting**: Find contact emails at target companies
2. **Lead Generation**: Build email lists from LinkedIn
3. **Email Validation**: Clean email lists before campaigns
4. **Company Research**: Find companies matching criteria
5. **Outreach**: Verify emails before sending

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"tomba API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/phone-validator"}'   # Get endpoint details
```
