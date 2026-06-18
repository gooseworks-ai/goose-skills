---
name: lead-enrichment
description: Enrich leads with email, phone, company data using multiple data sources
source: orthogonal
---


# Lead Enrichment - Complete Contact Data

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Enrich partial lead data with emails, phone numbers, and company information using multiple APIs.

## Workflow

### Step 1: Find Email Address
Use Hunter to find email:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-finder","query":{"domain":"stripe.com","first_name":"John","last_name":"Doe"}}'
```

### Step 2: Verify Email
Verify the email is deliverable:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-verifier","query":{"email":"john@stripe.com"}}'
```

### Step 3: Get More Contact Info
Use Sixtyfour for additional enrichment:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-lead"}'
  "lead_info": {
    "first_name": "John",
    "last_name": "Doe",
    "company": "Stripe",
    "linkedin_url": "https://linkedin.com/in/johndoe"
  },
  "struct": {"email": "Work email", "phone": "Phone number"}
}'
```

### Step 4: Find Phone Number
Use Sixtyfour to find phone:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-phone"}'
  "lead": {
    "first_name": "John",
    "last_name": "Doe",
    "company": "Stripe"
  }
}'
```

### Step 5: Enrich Company Data
Get detailed company information:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/companies/find","query":{"domain":"stripe.com"}}'
```

### Step 6: Get LinkedIn Data
Fetch real-time LinkedIn profile:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/profile/single","body":{"identifier":"https://linkedin.com/in/johndoe"}}'
```

## Full Enrichment Pipeline

```bash
# 1. Start with name + company
export NAME="John Doe"
export COMPANY="Stripe"
export DOMAIN="stripe.com"

# 2. Find email (Hunter)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-finder","query":{"domain":"$DOMAIN","first_name":"John","last_name":"Doe"}}'

# 3. Verify email
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-verifier","query":{"email":"john@stripe.com"}}'

# 4. Get full lead profile (Sixtyfour)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-lead","body":{"lead_info":{"first_name":"John","last_name":"Doe","company":"Stripe"},"struct":{"email":"Work email"}}}'

# 5. Find phone
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-phone","body":{"lead":{"first_name":"John","last_name":"Doe","company":"Stripe"}}}'

# 6. Get company details
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/companies/find","query":{"domain":"stripe.com"}}'
```

## Tips

- Always verify emails before outreach
- Use multiple sources for better coverage
- LinkedIn URLs dramatically improve match rates
- Cache results to avoid duplicate lookups

## Discover More

List all endpoints, or add a path for parameter details:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"fiber API endpoints"}' api show hunter
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"sixtyfour API endpoints"}'

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes`"}' for endpoint parameters.
