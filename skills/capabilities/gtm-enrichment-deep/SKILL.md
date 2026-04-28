---
name: gtm-enrichment-deep
description: AI-agent-powered lead enrichment using Sixtyfour as primary source. Takes an email (+ optional name) and returns comprehensive person + company data with funding, AI/B2B classification, and full error visibility. Higher cost (~$0.20/lead) but simpler architecture.
source: orthogonal
---


# GTM Enrichment — Deep (Sixtyfour AI Agent)

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Enrich a lead from an email address (+ optional name) using Sixtyfour's AI agents as the primary enrichment source. Returns person data, company data, funding history, and AI/B2B classification.

**Cost**: ~$0.20-$0.22 per lead
**Latency**: ~30-60s (Sixtyfour AI agents browse the web)

## Input

Required:
- **email** — the lead's email address (e.g., `jane@acme.com`)

Optional:
- **name** — full name if known (improves match rate)

## Workflow

### Step 1: Extract Domain

Extract the domain from the email address. Example: `jane@acme.com` -> domain: `acme.com`

### Step 2: Run Sixtyfour Enrichment (parallel)

Fire both calls simultaneously. These are the primary data sources.

**Enrich Lead** ($0.10):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-lead"}'
  "lead_info": {
    "email": "{email}",
    "first_name": "{first_name_if_known}",
    "last_name": "{last_name_if_known}",
    "company": "{company_name_if_known}",
    "domain": "{domain}"
  },
  "struct": {
    "full_name": "Full legal name of this person",
    "first_name": "First name",
    "last_name": "Last name",
    "title": "Current job title at their company",
    "linkedin_url": "LinkedIn profile URL (full URL starting with https://linkedin.com/in/)",
    "city": "City where the person is located",
    "state": "State or region where the person is located",
    "country": "Country where the person is located"
  }
}'
```

**Enrich Company** ($0.10):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-company"}'
  "target_company": {
    "domain": "{domain}"
  },
  "struct": {
    "company_name": "Official company name",
    "description": "One-paragraph description of what the company does",
    "linkedin_url": "LinkedIn company page URL (full URL starting with https://linkedin.com/company/)",
    "hq_city": "Headquarters city",
    "hq_state": "Headquarters state or region",
    "hq_country": "Headquarters country",
    "employee_count": "Approximate number of employees (number only)",
    "founded_year": "Year the company was founded (number only)",
    "total_funding_amount_usd": "Total funding raised in USD (number only, no $ sign)",
    "latest_funding_date": "Date of most recent funding round (YYYY-MM-DD format)",
    "latest_funding_stage": "Stage of most recent funding round (e.g., Series A, Series B, Seed)",
    "latest_funding_amount_usd": "Amount raised in most recent round in USD (number only)",
    "is_ai_company": "true or false - does this company build or primarily use AI/ML technology?",
    "ai_evidence": "Brief explanation of why this is or is not an AI company",
    "is_b2b_saas": "true or false - is this a B2B SaaS company?",
    "b2b_evidence": "Brief explanation of why this is or is not B2B SaaS"
  }
}'
```

Record the status, latency, and any errors for both calls.

### Step 3: Fallback — Apollo Person Match (conditional)

**ONLY run if Sixtyfour /enrich-lead did NOT return a LinkedIn URL.**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"apollo","path":"/api/v1/people/match"}'
  "email": "{email}",
  "reveal_personal_emails": true
}'
```

Cost: $0.01. Extract `linkedin_url`, and also grab `name`, `title`, `organization` as cross-reference data.

### Step 4: Fallback — Apollo Organization Enrich (conditional)

**ONLY run if Sixtyfour /enrich-company did NOT return funding data** (total_funding_amount_usd is null/empty).

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"apollo","path":"/api/v1/organizations/enrich","query":{"domain":"{domain}"}}'
```

Cost: $0.01. Extract funding events, total funding, latest funding stage, and latest funding amount.

### Step 5: Compile Results

Merge all data into the output format below. Apply these rules:

1. **Sixtyfour is primary** — use its data first for all fields
2. **Apollo is fallback** — only used to fill gaps Sixtyfour missed
3. **Source tracking** — for each field, note whether it came from `sixtyfour` or `apollo`
4. **Confidence**:
   - `high` — Sixtyfour returned the field directly
   - `medium` — Apollo fallback provided the field
   - `low` — field was inferred or partially matched

## Output Format

Present the results as a JSON code block:

```json
{
  "person": {
    "full_name": "string",
    "title": "string",
    "linkedin_url": "string",
    "location": {"city": "string", "state": "string", "country": "string"},
    "email_verified": "unknown",
    "confidence": "high | medium | low",
    "source": "sixtyfour | apollo"
  },
  "company": {
    "name": "string",
    "domain": "string",
    "linkedin_url": "string",
    "description": "string",
    "geo": {"city": "string", "state": "string", "country": "string"},
    "employee_count": "number | null",
    "founded_year": "number | null",
    "funding": {
      "total_amount": "number | null",
      "total_amount_printed": "string | null",
      "latest_round_date": "string | null",
      "latest_round_stage": "string | null",
      "latest_round_amount": "number | null",
      "rounds": [],
      "confidence": "high | medium | low"
    },
    "classification": {
      "is_ai": {"value": true, "confidence": "high | medium | low", "evidence": ["string"]},
      "is_b2b_saas": {"value": true, "confidence": "high | medium | low", "evidence": ["string"]}
    },
    "buying_signals": {
      "has_enterprise_plan": null,
      "has_self_serve": null,
      "hiring_enterprise_reps": null,
      "website_traffic_rank": null,
      "github_stars": null,
      "tech_stack": null
    },
    "confidence": "high | medium | low",
    "source": "sixtyfour | apollo | merged"
  },
  "meta": {
    "total_cost": "$0.XX",
    "api_calls": [],
    "phases_run": [1, 2],
    "enrichment_timestamp": "ISO datetime"
  }
}
```

## Error Visibility

Track EVERY API call in the `meta.api_calls` array:

```json
{
  "api": "sixtyfour",
  "endpoint": "/enrich-lead",
  "status": "success | partial | error",
  "cost": "$0.10",
  "latency_ms": 35000,
  "fields_returned": ["full_name", "title", "linkedin_url"],
  "fields_missing": ["city"],
  "error": null
}
```

**If an API call fails, returns empty data, or times out, include it in the api_calls array with status='error' and a clear error message. Never silently skip failures.**

## Cost Tracking

Sum all API call costs and report in `meta.total_cost`:
- Sixtyfour /enrich-lead: $0.10
- Sixtyfour /enrich-company: $0.10
- Apollo /api/v1/people/match: $0.01 (only if used)
- Apollo /api/v1/organizations/enrich: $0.01 (only if used)

## Example

**Input**: `jane@acme.com`

**Expected flow**:
1. Extract domain: `acme.com`
2. Fire Sixtyfour /enrich-lead and /enrich-company in parallel
3. Check if LinkedIn URL returned — if not, call Apollo /people/match
4. Check if funding data returned — if not, call Apollo /organizations/enrich
5. Compile and output JSON with all fields, error visibility, and cost

## Tips

- Sixtyfour takes 30-60s per call — be patient, do NOT timeout early
- If Sixtyfour returns partial data, still use what it returned and fill gaps with Apollo
- AI/B2B classification comes from Sixtyfour's web research — it reads the company website
- The `struct` field in Sixtyfour tells the AI agent exactly what to research — modify fields there if you need different data points
