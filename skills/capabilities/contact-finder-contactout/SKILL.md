---
name: contact-finder-contactout
description: Find emails, phone numbers, and enrich profiles using ContactOut. LinkedIn enrichment, people search, company enrichment, and batch operations.
source: orthogonal
---


# ContactOut

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Sales and recruitment intelligence platform. Find anyone's email and phone number, enrich LinkedIn profiles, look up people from email or multiple signals, and get company info from domains.

## When to Use

- Find someone's email or phone from their LinkedIn profile
- Enrich a person from name + company or email
- Look up a profile from an email address
- Get company information from a domain
- Batch enrich multiple LinkedIn profiles
- Estimate how many people match a search (free count)

## Endpoints

### 1. LinkedIn Profile Enrichment

Get full profile details (email, phone, work history, education, skills) from a LinkedIn URL.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/linkedin/enrich","query":{"profile":"https://www.linkedin.com/in/williamhgates"}}'
```

<details>
<summary>curl equivalent</summary>

```bash
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/linkedin/enrich","query":{"profile":"https://www.linkedin.com/in/williamhgates"}}'
```
</details>

**Parameters:**
- **profile** (required) - LinkedIn profile URL (must start with http and contain linkedin.com/in/)
- **profile_only** (optional, boolean) - If true, returns profile without contact info (cheaper)

**Returns:** Full profile with emails, phones, work history, education, skills, company info, seniority, job function.

---

### 2. Contact Details from LinkedIn

Get just contact details (emails, phones) for a LinkedIn profile. Lighter than full enrichment.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/people/linkedin","query":{"profile":"https://www.linkedin.com/in/williamhgates","include_phone":"true"}}'
```

<details>
<summary>curl equivalent</summary>

```bash
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/people/linkedin","query":{"profile":"https://www.linkedin.com/in/williamhgates","include_phone":"true"}}'
```
</details>

**Parameters:**
- **profile** (required) - LinkedIn profile URL
- **include_phone** (optional, boolean, default: false) - Include phone numbers
- **email_type** (optional) - Filter emails: `personal`, `work`, `personal,work`, or `none`

---

### 3. Batch LinkedIn Enrichment (sync, up to 30)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/people/linkedin/batch","body":{"profiles":["https://linkedin.com/in/person1","https://linkedin.com/in/person2"]}}'
```

**Parameters:**
- **profiles** (required, array, max 30) - Array of LinkedIn profile URLs

---

### 4. Enrich from Email

Get profile details from an email address. Personal emails have higher match rates.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/email/enrich","query":{"email":"john@example.com","include":"work_email"}}'
```

**Parameters:**
- **email** (required) - Email address
- **include** (optional) - Set to `work_email` to include work email in response

---

### 5. People Enrich (multi-signal)

Enrich a person using multiple data points. Needs at least one primary identifier (linkedin_url, email, or phone) or name + company.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/people/enrich"}'
  "full_name": "Patrick Collison",
  "company": ["Stripe"],
  "company_domain": ["stripe.com"],
  "include": ["work_email", "personal_email", "phone"]
}'
```

**Parameters:**
- **linkedin_url** (optional) - LinkedIn profile URL
- **email** (optional) - Email address
- **phone** (optional) - Phone number
- **full_name** (optional) - Full name (or use first_name + last_name)
- **first_name** / **last_name** (optional) - Used together
- **company** (optional, array, max 10) - Company names
- **company_domain** (optional, array, max 10) - Company domains
- **job_title** (optional) - Job title
- **location** (optional) - Location
- **education** (optional, array, max 10) - Educational institutions
- **include** (optional, array) - Data to include: `work_email`, `personal_email`, `phone`

**Note:** Name-only searches need at least one secondary param (company, domain, education, location, or job_title).

---

### 6. Domain Enrichment

Get company information from domain names.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/domain/enrich","body":{"domains":["stripe.com","google.com"]}}'
```

**Parameters:**
- **domains** (required, array, max 30) - Domain names

**Returns:** Company details including name, industry, size, revenue, funding, headquarters, LinkedIn URL, specialties.

---

### 7. People Count (free)

Count matching profiles without returning data. Use to estimate results before searching.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/people/count","body":{"domain":["stripe.com"],"seniority":["VP","CXO","Director"]}}'
```

**Parameters:** Same search filters as People Search (name, job_title, company, domain, location, industry, seniority). Returns only `total_results`.

**Cost:** Free, no credits consumed.

## Accepted Values (for People Count)

### Seniority Levels
`Owner / Founder`, `CXO`, `Partner`, `VP`, `Head`, `Director`, `Manager`, `Senior`, `Entry`, `Intern`

### Job Functions
`Operations`, `Business Development`, `Sales`, `Education`, `Engineering`, `Healthcare Services`, `Information Technology`, `Administrative`, `Arts and Design`, `Customer Success and Support`, `Finance`, `Community and Social Services`, `Media and Communication`, `Accounting`, `Marketing`, `Human Resources`, `Research`, `Program and Project Management`, `Legal`, `Military and Protective Services`, `Consulting`, `Entrepreneurship`, `Real Estate`, `Quality Assurance`, `Purchasing`, `Product Management`, `Leadership`

### Company Size
`1_10`, `11_50`, `51_200`, `201_500`, `501_1000`, `1001_5000`, `5001_10000`, `10001`

### Industries
`Computer Software`, `Internet`, `Financial Services`, `Hospital & Health Care`, `Marketing and Advertising`, `Information Technology and Services`, `Telecommunications`, `Management Consulting`, `Real Estate`, `Retail`, and many more. Full list: https://docs.google.com/spreadsheets/d/14drLUuDLgxPflIsPNgV_w05N6guY4GtCCCd36zT4vg0

## Examples

**"Get Bill Gates' email"**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/linkedin/enrich","query":{"profile":"https://www.linkedin.com/in/williamhgates"}}'
```

**"Look up who this email belongs to"**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/email/enrich","query":{"email":"john@company.com"}}'
```

**"Find Patrick Collison's contact info"**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/people/enrich","body":{"full_name":"Patrick Collison","company":["Stripe"],"include":["work_email","personal_email","phone"]}}'
```

**"Get company info for stripe.com"**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/domain/enrich","body":{"domains":["stripe.com"]}}'
```

**"How many CTOs are there at fintech companies in SF?"**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/people/count","body":{"job_title":["CTO"],"industry":["Financial Services"],"location":["San Francisco"]}}'
```

**"Get contact details for these 3 LinkedIn profiles"**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"contactout","path":"/v1/people/linkedin/batch","body":{"profiles":["https://linkedin.com/in/person1","https://linkedin.com/in/person2","https://linkedin.com/in/person3"]}}'
```

## Error Handling

- **400** - Invalid parameter values. Check accepted values lists above (especially seniority and industry).
- **404** - Person/company not found. Try different identifiers or broader search.
- **429** - Rate limited. People Search: 60/min, Email Verify: 150/min, Others: 1000/min.

## Tips

- Use `/v1/people/count` first (free) to estimate results before committing to paid calls
- Personal emails have higher match rates than work emails for email enrichment
- For batch operations, v1 batch supports up to 30 profiles synchronously
- People enrich works best with a LinkedIn URL as the primary identifier
