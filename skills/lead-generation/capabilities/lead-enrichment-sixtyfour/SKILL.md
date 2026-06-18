---
name: lead-enrichment-sixtyfour
description: AI-powered lead enrichment - find emails, phones, and enrich company/lead data
source: orthogonal
---


# Sixtyfour - AI Lead Enrichment

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Find contact information and enrich lead data using AI-powered discovery.

## Capabilities

- **Find email**: Find email address for a lead
- **Enrich lead**: Enrich lead information with additional details such as contact information, social profiles, and company details
- **Find Phone API**: The Find Phone API uses Sixtyfour AI to discover phone numbers for leads
- **Enrich company**: Enrich company data with additional information and find associated people

## Usage

### Find email
Find email address for a lead.

Parameters:
- lead* (object) - Lead information to find email for
- mode (string) - Email discovery mode. Allowed values: `"PROFESSIONAL"` (default) for company emails, `"PERSONAL"` for personal emails.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-email"}'
  "lead": {
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Inc",
    "domain": "acme.com"
  }
}'
```

### Enrich lead
Enrich lead information with additional details such as contact information, social profiles, and company details.

Parameters:
- lead_info* (object) - Initial lead information as key-value pairs
- struct* (object) - Fields to collect about the lead
- research_plan (string) - Optional research plan to guide enrichment

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-lead"}'
  "lead_info": {
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Inc",
    "linkedin_url": "https://linkedin.com/in/johndoe"
  },
  "struct": {"email": "Work email", "phone": "Phone number"}
}'
```

### Find Phone API
The Find Phone API uses Sixtyfour AI to discover phone numbers for leads. It extracts contact information from lead data and returns enriched results with phone numbers.

Parameters:
- lead* (object) - Lead information object
- name (string) - Full name of the person
- company (string) - Company name
- linkedin_url (string) - LinkedIn profile URL
- domain (string) - Company website domain
- email (string) - Email address

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-phone"}'
  "lead": {
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Inc"
  }
}'
```

### Enrich company
Enrich company data with additional information and find associated people.

Parameters:
- target_company* (object) - Company data to enrich
- struct* (object) - Fields to collect
- lead_struct (object) - Custom schema to define the structure of returned lead data.
- find_people (boolean) - Whether to find people associated with the company
- research_plan (string) - Optional strategy describing how the agent should search for information
- people_focus_prompt (string) - Description of people to find, typically includes the roles or responsibilities of the people you’re looking for

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-company"}'
  "target_company": {"domain": "acme.com"},
  "struct": {"description": "Company description", "industry": "Industry"}
}'
```

## Use Cases

1. **Sales Prospecting**: Find contact info for potential customers
2. **Lead Enrichment**: Complete partial lead data with emails/phones
3. **CRM Data Quality**: Fill in missing fields in your CRM
4. **Account Research**: Get comprehensive company information

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"sixtyfour API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-email"}'   # Get endpoint details
```
