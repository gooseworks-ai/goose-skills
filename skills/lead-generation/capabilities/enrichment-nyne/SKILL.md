---
name: enrichment-nyne
description: Intelligence and enrichment - person and company data, social profiles, events, and funding
source: orthogonal
---


# Nyne - Intelligence & Enrichment API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Enrich person and company data with social profiles, events, interests, funding, and more.

## Capabilities

- **Person Search**: Search people by company, role, geography, and name
- **Person Enrichment**: Enrich person data from email, phone, or social URL
- **Person Events**: Find life events and career milestones
- **Person Social Profiles**: Get all social media profiles for a person
- **Person Single Social Lookup**: Look up a specific social media profile
- **Person Interactions**: Get social media interactions
- **Person Interests**: Get interests, skills, and topics a person engages with
- **Person Newsfeed**: Get social media newsfeed data
- **Company Search**: Search companies by industry and keywords
- **Company Enrichment**: Enrich company data from email, phone, or social URL
- **Company Check Seller**: Check if a company sells a specific product/service
- **Company Needs**: Analyze company needs from SEC filings and content
- **Company Funding**: Get company funding history and investment details
- **Company Funders**: Get investors and funders associated with a company

## Usage

### Person Search
Search people by company name, role, geography, and person name. Returns requestId for polling.

Parameters:
- query* (string) - Natural language search query (max 1000 chars)
- limit (integer) - Max results per request (default: 10, max: 100)
- offset (integer) - Starting position in results (default: 0, max: 999)
- cursor (string) - Pagination token from previous response
- request_id (string) - Request ID to continue fetching from same search
- force_new (boolean) - Force fresh search even if cached (default: false)
- type (string) - Search tier: light (fastest), medium, premium (best quality). Default: premium
- show_emails (boolean) - Include email addresses in results (default: false)
- show_phone_numbers (boolean) - Include phone numbers in results (default: false)
- require_emails (boolean) - Only return profiles with emails (default: false)
- require_phone_numbers (boolean) - Only return profiles with phones (default: false)
- require_phones_or_emails (boolean) - Only return profiles with phone OR email (default: false)
- insights (boolean) - Include AI-generated relevance insights (default: false, not available for light)
- high_freshness (boolean) - Prioritize recently updated profiles (default: false, not available for light)
- profile_scoring (boolean) - Include AI relevance scoring (default: false)
- callback_url (string) - URL to receive results via webhook
- custom_filters (object) - Structured filters (locations, industries, titles, etc.)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search","body":{"query":"Software engineers at OpenAI"}}'
```

### Person Enrichment
Enrich a person's profile from email, phone, or social media URL. Returns comprehensive data including work history, education, and social profiles.

Parameters:
- email (string) - Email address to enrich
- phone (string) - Phone number to enrich
- social_media_url (string) - Social media profile URL (LinkedIn, Twitter, etc.)
- name (string) - Person name to search (used with company)
- company (string) - Company name to narrow name-based search
- callback_url (string) - URL to receive results via webhook
- newsfeed (array) - Social media sources for newsfeed: linkedin, twitter, instagram, github, facebook, or all
- ai_enhanced_search (boolean) - Enable AI-powered deep search for more social profiles (slower)
- strict_email_check (boolean) - Enable strict email validation
- lite_enrich (boolean) - Lightweight enrichment mode (3 credits vs 6, returns only basic fields)
- probability_score (boolean) - Include confidence score in results

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/enrichment","body":{"email":"john@openai.com"}}'
```

### Person Events
Find life events and career milestones for people at specific events.

Parameters:
- event* (string) - Event name (e.g., YC Demo Day, TechCrunch Disrupt)
- company_name (string) - Filter by company to find employees who attended
- role (string) - Filter by job title (e.g., Founder, CTO)
- industry (string) - Filter by industry sector
- location (string) - Geographic filter for attendees
- callback_url (string) - HTTPS endpoint for automatic delivery

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/events","body":{"event":"YC Demo Day"}}'
```

### Person Social Profiles
Get all social media profiles associated with a person.

Parameters:
- email (string) - Email address to look up
- phone (string) - Phone number to look up
- social_media_url (string) - Social media profile URL to find other profiles from
- callback_url (string) - URL to receive results via webhook

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/social-profiles","body":{"email":"john@openai.com"}}'
```

### Person Single Social Lookup
Look up a single social media profile for a person on a specific platform.

Parameters:
- social_media_url (string) - Social media profile URL to look up from
- email (string) - Email address to look up from
- site* (string) - Target social media site: twitter, linkedin, instagram, facebook, tiktok, pinterest, github
- callback_url (string) - URL to receive results via webhook

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/single-social-lookup","body":{"email":"john@openai.com","site":"linkedin"}}'
```

### Person Interactions
Get social media interactions (replies, followers, following) from a profile.

Parameters:
- type* (string) - Interaction type: replies, followers, following, or followers,following
- social_media_url* (string) - Twitter/X or Instagram profile or post URL
- max_results (integer) - Maximum results to return (default: 100, max: 1000)
- callback_url (string) - URL to receive results via webhook

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/interactions","body":{"type":"followers","social_media_url":"https://twitter.com/openai"}}'
```

### Person Interests
Get interests, skills, and topics a person engages with.

Parameters:
- email (string) - Email address to look up
- phone (string) - Phone number to look up
- social_media_url (string) - Social media profile URL
- callback_url (string) - URL to receive results via webhook

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/interests","body":{"email":"john@openai.com"}}'
```

### Person Newsfeed
Get social media newsfeed data from LinkedIn, Twitter, Instagram, GitHub, or Facebook profiles.

Parameters:
- social_media_url* (string) - Social media profile URL (LinkedIn, Twitter, Instagram, GitHub, Facebook)
- callback_url (string) - URL to receive results via webhook

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/newsfeed","body":{"social_media_url":"https://linkedin.com/in/johndoe"}}'
```

### Company Search
Search for companies by industry focus and website keywords.

Parameters:
- industry (string) - Industry focus (e.g., Healthcare SaaS). Required if website_keyword not provided
- website_keyword (string) - Keyword that should appear on company sites (e.g., SOC 2). Required if industry not provided
- location (string) - Geographic filter (city, region, or country)
- max_results (integer) - Maximum results (1-50, default: 25)
- validate_keyword (boolean) - Validate keyword exists on company website HTML
- callback_url (string) - HTTPS endpoint for automatic delivery

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/search","body":{"industry":"AI","location":"San Francisco"}}'
```

### Company Enrichment
Enrich company data from email, phone, or LinkedIn company URL.

Parameters:
- email (string) - Company email address to enrich
- phone (string) - Company phone number to enrich
- social_media_url (string) - LinkedIn company profile URL
- callback_url (string) - HTTPS endpoint for automatic delivery

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/enrichment","body":{"social_media_url":"https://linkedin.com/company/openai"}}'
```

### Company Check Seller
Check if a company sells a specific product or service.

Parameters:
- company_name* (string) - Company name to check
- product_service* (string) - Product or service to verify (e.g., SOC 2 automation)
- callback_url (string) - HTTPS endpoint for automatic delivery

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/checkseller","body":{"company_name":"Vanta","product_service":"SOC 2 automation"}}'
```

### Company Needs
Analyze company needs based on SEC filings and provided content.

Parameters:
- company_name* (string) - Company to analyze (e.g., Uber Technologies, Inc.)
- content* (string) - Topic to surface (e.g., Regulatory challenges, Supply chain issues)
- filing (string) - Restrict to filing type (e.g., Form 10-K, Form 8-K)
- callback_url (string) - HTTPS endpoint for automatic delivery

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/needs","body":{"company_name":"Uber Technologies","content":"Regulatory challenges"}}'
```

### Company Funding
Get company funding history and investment details.

Parameters:
- company_name (string) - Company name to search (e.g., Stripe, OpenAI)
- company_domain (string) - Company domain to search (e.g., stripe.com, openai.com)
- callback_url (string) - HTTPS endpoint for automatic delivery

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/funding","body":{"company_name":"OpenAI"}}'
```

### Company Funders
Get investors and funders associated with a company.

Parameters:
- company_name (string) - Investor name (e.g., Y Combinator, Sequoia Capital, Andreessen Horowitz)
- company_domain (string) - Investor domain (e.g., ycombinator.com, sequoiacap.com, a16z.com)
- callback_url (string) - HTTPS endpoint for automatic delivery

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/funders","body":{"company_name":"OpenAI"}}'
```

## Use Cases

1. **Sales Intelligence**: Enrich leads with comprehensive data
2. **Recruiting**: Find candidates and their social profiles
3. **Investment Research**: Research company funding and investors
4. **Market Research**: Track company signals and news
5. **Lead Scoring**: Score leads based on interests and events

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"nyne API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search"}'   # Get endpoint details
```
