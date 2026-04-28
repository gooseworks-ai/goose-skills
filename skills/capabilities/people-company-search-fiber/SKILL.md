---
name: people-company-search-fiber
description: People, company, investor, and job search with LinkedIn data enrichment
source: orthogonal
---


# Fiber AI - People & Company Intelligence

## Cost Reference

| Endpoint | Cost | Notes |
|----------|------|-------|
| `/v1/natural-language-search/profiles` | **$0.02/record** (pageSize × $0.02) | Default $0.50 if no pageSize |
| `/v1/people-search` | **$0.02/record** (pageSize × $0.02) | Default $0.50 if no pageSize |
| `/v1/natural-language-search/companies` | Varies | |
| `/v1/kitchen-sink/person` | Varies | Single lookup |
| `/v1/validate-email/single` | ~$0.02 | |

**Cheaper alternative for people search:** Apollo `mixed_people/search` costs **$0.01 flat** per call regardless of result count. Use `$GOOSEWORKS_API_BASE/v1/proxy/apollo/mixed_people/search` when possible.

**Tip:** Use the dedicated proxy route `$GOOSEWORKS_API_BASE/v1/proxy/fiber/...` instead of the generic orthogonal proxy for cleaner billing tracking.

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Comprehensive search and enrichment for people, companies, investors, and jobs.

## Capabilities

- **Search profiles from text**: Takes free-form text (e
- **Search companies from text**: Takes free-form text (e
- **Find person by email**: Do a reverse lookup: given an email address, find someone's LinkedIn profile and personal details
- **Live fetch LinkedIn profile**: Returns an enriched profile with details for a given LinkedIn profile identifier
- **Validate a single email**: Checks if a given email is likely to bounce using a waterfall of strategies
- **Kitchen sink person lookup**: Search for a person using a variety of parameters such as LinkedIn slug, LinkedIn URL, or their current company information
- **Kitchen sink company lookup**: Search for a company using a variety of parameters such as LinkedIn slug, LinkedIn URL, name, etc
- **Investor search**: Search for investors with flexible filtering capabilities
- **Fetch LinkedIn profile posts**: Fetches recent posts from a LinkedIn profile
- **Live fetch LinkedIn company**: Returns an enriched company with details for a given LinkedIn company identifier
- **People search**: Search for people using filters
- **Fetch LinkedIn post comments**: Fetches paginated comments for a LinkedIn post
- **Company search**: Search for companies using filters
- **Convert text into company search filters**: Takes free-form text (e
- **Convert text into profile search filters**: Takes free-form text (e
- **Job postings search**: Search for job postings with flexible filtering capabilities
- **Fetch LinkedIn post reactions**: Fetches paginated reactions of a specific type for a LinkedIn post

## Usage

### Search profiles from text
Takes free-form text (e.g., 'Software engineers in US with 5+ years of experience') and returns a list of matching profiles.

Parameters:
- query* (string)
- pageSize (integer) - The number of profiles to return, if you need to get more results, you can paginate.
- getDetailedEducation (['boolean', 'null']) - Whether to include deep details about each educational item, like the school's LinkedIn URL, website, location, etc. That'll be put in the detailedEducation array. This slows down the API call, so only enable this if you need it.
- getDetailedWorkExperience (['boolean', 'null']) - Whether to include deep details about each work experience item, like the company's LinkedIn URL, website, location, etc. That'll be put in the detailedWorkExperience array. This slows down the API call, so only enable this if you need it.
- cursor (['string', 'null']) - A pagination cursor returned from a previous search response. Use this to fetch the next page of results.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles","body":{"query":"Software engineers in San Francisco with 5+ years experience"}}'
```

### Search companies from text
Takes free-form text (e.g., 'Series A startups in USA with 50–200 employees') and returns a list of matching companies.

Parameters:
- query* (string)
- pageSize (integer) - The number of companies to return, if you need to get more results, you can paginate.
- cursor (['string', 'null']) - A pagination cursor returned from a previous search response. Use this to fetch the next page of results.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies","body":{"query":"Series A startups in fintech with 50-200 employees"}}'
```

### Find person by email
Do a reverse lookup: given an email address, find someone's LinkedIn profile and personal details. Note: if you also have the person's name, company, etc., you'll get better results with the Kitchen Sink endpoint, where you can pass all the information you have.

Parameters:
- email* (string) - The person's email address for which you want to do a reverse lookup
- num_profiles (['number', 'null']) - Number of profiles to return. Maximum 10 profiles can be returned for given query. The returned profiles will be sorted by best match first.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/email-to-person/single","body":{"email":"john@company.com"}}'
```

### Live fetch LinkedIn profile
Returns an enriched profile with details for a given LinkedIn profile identifier

Parameters:
- identifier* (string) - Identifier can be a profile's LinkedIn slug (e.g. 'williamhgates' from <linkedin.com/in/williamhgates>), a Sales Navigator URN (e.g. 'ACwAAA.....'), or a full LinkedIn URL (e.g. 'https://www.linkedin.com/in/williamhgates/')
- getDetailedEducation (['boolean', 'null']) - Whether to include deep details about each educational item, like the school's LinkedIn URL, website, location, etc. That'll be put in the detailedEducation array. This slows down the API call, so only enable this if you need it.
- getDetailedWorkExperience (['boolean', 'null']) - Whether to include deep details about each work experience item, like the company's LinkedIn URL, website, location, etc. That'll be put in the detailedWorkExperience array. This slows down the API call, so only enable this if you need it.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/profile/single","body":{"identifier":"https://linkedin.com/in/johndoe"}}'
```

### Validate a single email
Checks if a given email is likely to bounce using a waterfall of strategies. Works for catch-all email addresses, which are increasingly common yet hard for other APIs to validate.

Parameters:
- email* (string) - The email to validate

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/validate-email/single","body":{"email":"john@example.com"}}'
```

### Kitchen sink person lookup
Search for a person using a variety of parameters such as LinkedIn slug, LinkedIn URL, or their current company information. Returns profile data for the person if found.

Parameters:
- profileIdentifier (string) - If provided and correct, we would always be able to find the profile. You do not need to pass in any other info if you pass this.
- emailAddress (['string', 'null']) - The email address of the person to search for
- personName (['object', 'null'])
- jobTitle (['object', 'null'])
- companyIdentifier (string) - The company the profile is currently working at. If provided the accuracy of the lookup increases. You do not need to pass in any other company parameters if you pass this.
- companyName (['object', 'null'])
- companyDomain (['object', 'null'])
- numProfiles (integer) - The maximum number of profiles you want to fetch. Profiles are sorted by best match first.
- liveFetch (['boolean', 'null']) - Whether to fetch the freshest copy of the found profiles's LinkedIn data (costs extra). If omitted or set to false, we'll give the cached data present in our database. The boolean flag is deprecated and will be removed in future. Please use the object instead.
- forceCompanyMatch (['boolean', 'null']) - Whether to strictly match the company. If true, we will strictly lookup prospects which belong to given company details.
- fuzzySearch (['boolean', 'null']) - Whether to use fuzzy search on names, job titles and other parameters. This is good if you are not sure about the exact name or job title.
- getDetailedEducation (['boolean', 'null']) - Whether to include deep details about each educational item, like the school's LinkedIn URL, website, location, etc. That'll be put in the detailedEducation array. This slows down the API call, so only enable this if you need it.
- getDetailedWorkExperience (['boolean', 'null']) - Whether to include deep details about each work experience item, like the company's LinkedIn URL, website, location, etc. That'll be put in the detailedWorkExperience array. This slows down the API call, so only enable this if you need it.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/person","body":{"linkedin_url":"https://linkedin.com/in/johndoe"}}'
```

### Kitchen sink company lookup
Search for a company using a variety of parameters such as LinkedIn slug, LinkedIn URL, name, etc. Returns complete company data if found.

Parameters:
- companyIdentifier (string) - A unique identifier for the company. Accepts one of: linkedinSlug, linkedinUrl, or linkedinOrgID. Providing this increases the accuracy and speed of the lookup. If this is provided, you do not need to supply companyName or companyDomain.
- companyName (['object', 'null'])
- companyDomain (['object', 'null'])
- numCompanies (integer) - The number of companies you want to fetch. Companies are sorted by best match first.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/company","body":{"domain":"openai.com"}}'
```

### Investor search
Search for investors with flexible filtering capabilities

Parameters:
- searchParams* (object) - Investor search filter parameters
- pageSize (integer) - Number of investors to return per page (max 1000)
- cursor (['string', 'null']) - Pagination cursor returned from a previous search response. Use this to fetch the next page of results. Null for the first page.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/investor-search"}'
  "searchParams": {
    "investment_stages": ["Seed", "Series A"],
    "industries": ["AI", "SaaS"]
  }
}'
```

### Fetch LinkedIn profile posts
Fetches recent posts from a LinkedIn profile. Returns a paginated feed of posts with optional cursor for pagination. Each page returns up to 50 posts.

Parameters:
- identifier* (string) - Identifier can be a profile's LinkedIn slug (e.g. 'williamhgates' from <linkedin.com/in/williamhgates>), a Sales Navigator URN (e.g. 'ACwAAA.....'), or a full LinkedIn URL (e.g. 'https://www.linkedin.com/in/williamhgates/')
- cursor (['string', 'null']) - Pagination cursor for fetching additional pages of posts

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/profile-posts","body":{"identifier":"https://linkedin.com/in/johndoe"}}'
```

### Live fetch LinkedIn company
Returns an enriched company with details for a given LinkedIn company identifier

Parameters:
- type* (string)
- value* (string) - The company's LinkedIn slug (e.g., 'microsoft'), LinkedIn URL (e.g., 'https://www.linkedin.com/company/microsoft' or 'https://www.linkedin.com/company/1441'), LinkedIn organization ID (e.g., '1441' for Google), or Fiber company ID (e.g., 'comp_1441')

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/company/single","body":{"identifier":"https://linkedin.com/company/openai"}}'
```

### People search
Search for people using filters

Parameters:
- searchParams (object) - Search parameters for people search.
- pageSize (integer) - The number of profiles to return, if you need to get more results, you can paginate.
- cursor (['string', 'null']) - A pagination cursor returned from a previous search response. Use this to fetch the next page of results.
- currentCompanies (['array', 'null']) - Filter people by the companies they are currently working for. If you want to search over many companies, we suggest using the Combined Search API, which is optimized for this use case.
- prospectExclusionListIDs (['array', 'null']) - Filter out people which belong to the given prospect exclusion lists
- companyExclusionListIDs (['array', 'null']) - Filter out people who work at companies which belong to the given company exclusion lists

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/people-search"}'
  "searchParams": {
    "job_titles": ["CTO", "VP Engineering"],
    "locations": ["San Francisco", "New York"]
  }
}'
```

### Fetch LinkedIn post comments
Fetches paginated comments for a LinkedIn post. Each page contains up to 10 comments.

Parameters:
- contentId* (string) - You can get LinkedIn posts from the Profile or Company Posts endpoints. (e.g., 'urn:li:activity:7123456789012345678' or 'urn:li:ugcPost:7391650829398675456')
- cursor (['string', 'null']) - Pagination cursor for fetching additional pages of posts

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/post-comments","body":{"identifier":"https://linkedin.com/feed/update/urn:li:activity:1234"}}'
```

### Company search
Search for companies using filters

Parameters:
- searchParams* (object) - Search parameters for company search API.
- pageSize (integer) - The number of companies to return, if you need to get more results, you can paginate.
- cursor (['string', 'null']) - A pagination cursor returned from a previous search response. Use this to fetch the next page of results.
- companyExclusionListIDs (['array', 'null']) - Filter out companies which belong to the given company exclusion lists. You can create company exclusion lists via /v1/exclusions/companies/create-list

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/company-search"}'
  "searchParams": {
    "industries": ["Software", "AI"],
    "employee_count_min": 50,
    "employee_count_max": 500
  }
}'
```

### Convert text into company search filters
Takes free-form text (e.g., 'Series A startups in USA with 50–200 employees') and converts it into a structured set of filters for company search.

Parameters:
- query* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/text-to-search-params/companies","body":{"query":"AI startups in healthcare"}}'
```

### Convert text into profile search filters
Takes free-form text (e.g., 'Software engineers in US with 5+ years of experience') and converts it into a structured set of filters for profile search.

Parameters:
- query* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/text-to-search-params/profiles","body":{"query":"Senior engineers at FAANG companies"}}'
```

### Job postings search
Search for job postings with flexible filtering capabilities

Parameters:
- searchParams* (object) - Job search filter parameters
- pageSize (integer) - Number of jobs to return per page (max 1000)
- cursor (['string', 'null']) - Pagination cursor for fetching next page of results

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/job-search"}'
  "searchParams": {
    "job_titles": ["Software Engineer"],
    "locations": ["Remote"]
  }
}'
```

### Fetch LinkedIn post reactions
Fetches paginated reactions of a specific type for a LinkedIn post. Each page contains up to 10 reactions.

Parameters:
- contentId* (string) - You can get LinkedIn posts from the Profile or Company Posts endpoints. (e.g., 'urn:li:activity:7123456789012345678' or 'urn:li:ugcPost:7391650829398675456')
- reactionType (['string', 'null']) - Type of reaction to fetch. If null, all reactions will be fetched.
- cursor (['string', 'null']) - Pagination cursor for fetching additional pages of posts

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/post-reactions","body":{"identifier":"https://linkedin.com/feed/update/urn:li:activity:1234"}}'
```

## Use Cases

1. **Recruiting**: Find candidates matching specific criteria
2. **Sales Prospecting**: Build targeted lead lists
3. **Fundraising**: Research investors in your space
4. **Competitive Intel**: Track companies and their employees
5. **Job Search**: Find relevant job opportunities

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"fiber API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles"}'   # Get endpoint details
```
