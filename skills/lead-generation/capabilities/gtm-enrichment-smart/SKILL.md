---
name: gtm-enrichment-smart
description: Multi-provider waterfall lead enrichment. Takes an email (+ optional name) and returns person + company data by cross-referencing cheap APIs first, using expensive AI agents only as fallback. Cost-efficient (~$0.04-$0.10/lead) with confidence scoring and full error visibility.
source: orthogonal
---


# GTM Enrichment — Smart (Multi-Provider Waterfall)

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Enrich a lead from an email address (+ optional name) using a waterfall strategy: start with cheap APIs ($0.01 each), cross-reference for confidence, then use expensive AI agents only for gaps. Spends proportionally to lead quality.

**Cost**: $0.04 (best) to ~$0.12 (typical with buying signals) to ~$0.26 (worst, Sixtyfour fallback)
**Latency**: ~5-15s typical, up to 60s if Sixtyfour fallback triggers

## Input

Required:
- **email** — the lead's email address (e.g., `jane@acme.com`)

Optional:
- **name** — full name if known (improves match rate)

## Workflow

### Step 0: Extract Domain + Free Email Check

Extract the domain from the email. Check if it's a free email provider.

**Free email providers** (skip Brand.dev if match): `gmail.com`, `yahoo.com`, `hotmail.com`, `outlook.com`, `aol.com`, `icloud.com`, `mail.com`, `protonmail.com`, `zoho.com`, `yandex.com`, `gmx.com`, `live.com`

Set `is_free_email = true/false` — this gates whether Brand.dev runs in Phase 1.

---

### PHASE 1 — Core (always run, parallel) — ~$0.03-$0.06

Run ALL of these simultaneously:

**1a. Apollo People Match** ($0.01):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"apollo","path":"/api/v1/people/match"}'
  "email": "{email}",
  "reveal_personal_emails": true
}'
```

Extract: `person.name`, `person.title`, `person.linkedin_url`, `person.city`, `person.state`, `person.country`, `person.organization.name`, `person.organization.id` (save org_id for Phase 4), `person.organization.industry`, `person.organization.estimated_num_employees`, `person.organization.keywords`, `person.organization.funding_events`, `person.organization.total_funding`.

**1b. Hunter Combined Enrichment** ($0.01):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/combined/find","query":{"email":"{email}"}}'
```

Extract: `data.person.first_name`, `data.person.last_name`, `data.person.linkedin_handle`, `data.person.title`, `data.company.name`, `data.company.domain`, `data.company.industry`, `data.company.description`, `data.company.headcount`, `data.company.technologies`, `data.company.twitter`, `data.company.category`.

**1c. Brand.dev Retrieve** ($0.03 — CONDITIONAL: only if `is_free_email == false`):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"{domain}"}}'
```

Extract: `title` (company name), `description`, `industries` (including `eic` code), `socials` (twitter URL, github URL, linkedin URL), `employeeCount`, `foundedYear`, `location`.

**SKIP this call if `is_free_email == true`** — saves $0.03.

**1d. Hunter Email Verifier** ($0.01):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-verifier","query":{"email":"{email}"}}'
```

Extract: `data.status` (valid/invalid/accept_all/webmail/disposable/unknown), `data.result` (deliverable/undeliverable/risky).

---

### PHASE 1 MERGE — Cross-Reference & Confidence

After all Phase 1 calls complete, merge data:

**Person merge rules:**
1. Full name: prefer Apollo (structured), cross-ref with Hunter
2. Title: prefer Apollo, cross-ref with Hunter
3. LinkedIn URL: prefer Apollo `linkedin_url`, fallback to Hunter `linkedin_handle` (prepend `https://linkedin.com/in/`)
4. Location: prefer Apollo (structured city/state/country)
5. If Apollo and Hunter **agree** on name+title: `confidence = "high"`
6. If only one source has data: `confidence = "medium"`
7. If they **disagree** on name or title: flag conflict, keep both, `confidence = "low"`

**Company merge rules:**
1. Name: prefer Apollo org name, cross-ref with Hunter + Brand.dev
2. LinkedIn URL: prefer Brand.dev socials, fallback Apollo
3. Description: prefer Brand.dev (richer), fallback Hunter
4. Employee count: prefer Apollo, cross-ref with Brand.dev + Hunter headcount
5. Funding: use Apollo `funding_events` and `total_funding`
6. Geo: prefer Apollo org location, cross-ref with Brand.dev
7. Tech stack: use Hunter `technologies`
8. Social URLs: use Brand.dev `socials` (twitter, github)

**AI/B2B Classification (zero extra cost):**

Cross-reference three sources from Phase 1:

| Source | AI Signals | B2B Signals |
|--------|-----------|-------------|
| Brand.dev `description` + `industries.eic` | Parse description for: AI, ML, machine learning, deep learning, neural, LLM, GPT, NLP, computer vision | Parse for: SaaS, B2B, enterprise, platform, API, developer tools, infrastructure |
| Apollo `keywords[]` + `industry` | Match keywords against AI terms | Match keywords against B2B terms |
| Hunter `category` + company description | Check for AI/ML terms | Check for software/SaaS/B2B terms |

Confidence rules:
- `high`: 2+ sources agree
- `medium`: 1 source has signal
- `low`: weak inference only (e.g., "tech company" but no explicit AI/B2B terms)

---

### PHASE 2 — Gap-Fill (conditional) — $0.00-$0.02

**2a. Apollo Organization Enrich** ($0.01 — ONLY if Apollo Phase 1 returned NO `funding_events` or funding data is empty):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"apollo","path":"/api/v1/organizations/enrich","query":{"domain":"{domain}"}}'
```

Extract: `organization.funding_events[]`, `organization.total_funding`, `organization.latest_funding_stage`, `organization.latest_funding_amount`, `organization.estimated_num_employees`, `organization.annual_revenue`.

**2b. Tomba Enrich** ($0.01 — ONLY if Apollo and Hunter **disagree** on person name OR title):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/enrich","query":{"email":"{email}"}}'
```

Use as tie-breaker. If Tomba agrees with Apollo: use Apollo data. If Tomba agrees with Hunter: use Hunter data. If all three disagree: keep Apollo as primary, flag conflict.

---

### PHASE 3 — Sixtyfour Fallback (conditional, expensive) — $0.00-$0.20

**3a. Sixtyfour Enrich Lead** ($0.10 — ONLY if person NOT found after Phases 1-2, meaning no name AND no title AND no LinkedIn URL from any source):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-lead"}'
  "lead_info": {
    "email": "{email}",
    "domain": "{domain}"
  },
  "struct": {
    "full_name": "Full legal name of this person",
    "title": "Current job title",
    "linkedin_url": "LinkedIn profile URL (full URL)",
    "city": "City",
    "state": "State or region",
    "country": "Country"
  }
}'
```

**3b. Sixtyfour Enrich Company** ($0.10 — ONLY if company has major gaps AND org has >500 employees):

Major gaps = missing 2+ of: LinkedIn URL, description, employee count, funding data.

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
    "description": "One-paragraph description",
    "linkedin_url": "LinkedIn company page URL",
    "employee_count": "Number of employees",
    "total_funding_usd": "Total funding raised in USD",
    "latest_funding_date": "Most recent funding round date",
    "latest_funding_stage": "Most recent round stage",
    "latest_funding_amount_usd": "Most recent round amount"
  }
}'
```

---

### PHASE 4 — Buying Signals (qualified leads only) — $0.00-$0.04

**Gate**: Only run Phase 4 if the company is:
- Funded (total_funding > 0) AND
- Classified as B2B (is_b2b_saas = true) AND
- Has >50 employees

**4a. Brand.dev AI Products** ($0.03 — extracts products, pricing tiers, and features from the website):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/ai/products"}'
  "domain": "{domain}"
}'
```

From the products response, extract buying signals:
- **has_enterprise_plan**: Check if any product has "enterprise" in name, tier, or target_audience
- **has_self_serve**: Check if any product has a listed price (self-serve) vs "Contact sales" pricing
- **target_market**: Infer from `target_audience` arrays across products

**4b. Apollo Job Postings** ($0.01 — ONLY if `organization_id` was captured from Phase 1):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"apollo","path":"/api/v1/organizations/{organization_id}/job_postings","query":{"organization_id":"{organization_id}"}}'
```

Search job postings for enterprise sales signals: titles containing "Enterprise", "Account Executive", "Solutions Engineer", "Sales Director", "Customer Success". If found, set `hiring_enterprise_reps = true`.

---

### PHASE 5 — Cheap/Free Signals — $0.00-$0.01

**5a. GitHub Stars** (free — ONLY if Brand.dev socials or Apollo data returned a GitHub URL):

```bash
# Extract org name from GitHub URL, e.g., https://github.com/ngrok -> ngrok
# Use the GitHub public API (no auth needed for public repos):
curl -s "https://api.github.com/orgs/{org_name}/repos?sort=stars&per_page=5" | jq '[.[] | {name: .name, stars: .stargazers_count}]'
```

Sum the top repo stars or report the flagship repo star count.

**5b. Twitter/X Followers** (Scrape Creators — ONLY if a Twitter handle was found in Brand.dev socials or Apollo data):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/profile","query":{"handle":"{twitter_handle}"}}'
```

Extract: `legacy.followers_count`, `legacy.friends_count`, `legacy.statuses_count`, `legacy.description`.

---

### FINAL — Compile & Output

Merge all phase results into the output format. Track which phases ran.

## Output Format

Present the results as a JSON code block:

```json
{
  "person": {
    "full_name": "string",
    "title": "string",
    "linkedin_url": "string",
    "location": {"city": "string", "state": "string", "country": "string"},
    "email_verified": "deliverable | undeliverable | risky | unknown",
    "confidence": "high | medium | low",
    "source": "apollo | hunter | sixtyfour | tomba | merged"
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
      "rounds": [{"date": "", "type": "", "amount": 0, "investors": ""}],
      "confidence": "high | medium | low"
    },
    "classification": {
      "is_ai": {"value": true, "confidence": "high", "evidence": ["Brand.dev description mentions ML", "Apollo keywords include 'artificial intelligence'"]},
      "is_b2b_saas": {"value": true, "confidence": "high", "evidence": ["Hunter category: software", "Apollo industry: SaaS"]}
    },
    "buying_signals": {
      "has_enterprise_plan": "boolean | null",
      "has_self_serve": "boolean | null",
      "hiring_enterprise_reps": "boolean | null",
      "website_traffic_rank": "number | null",
      "github_stars": "number | null",
      "twitter_followers": "number | null",
      "tech_stack": ["array | null"]
    },
    "confidence": "high | medium | low",
    "source": "apollo | hunter | brand-dev | sixtyfour | merged"
  },
  "meta": {
    "total_cost": "$0.XX",
    "api_calls": [
      {
        "api": "apollo",
        "endpoint": "/api/v1/people/match",
        "status": "success",
        "cost": "$0.01",
        "latency_ms": 1200,
        "fields_returned": ["name", "title", "linkedin_url", "organization"],
        "fields_missing": [],
        "error": null
      }
    ],
    "phases_run": [1, 2, 4, 5],
    "enrichment_timestamp": "ISO datetime"
  }
}
```

## Error Visibility

Track EVERY API call in the `meta.api_calls` array with this structure:

```json
{
  "api": "string (apollo | hunter | brand-dev | sixtyfour | tomba | scrapecreators | github)",
  "endpoint": "string",
  "status": "success | partial | error | skipped",
  "cost": "$0.XX",
  "latency_ms": 0,
  "fields_returned": [],
  "fields_missing": [],
  "error": "string | null"
}
```

Rules:
- **If an API call fails, returns empty data, or times out**: include it with `status='error'` and a clear error message. Never silently skip failures.
- **If an API call was skipped due to gating logic** (e.g., Brand.dev skipped for free email): include it with `status='skipped'`, `cost='$0.00'`, and reason in error field (e.g., "Skipped: free email provider").
- **If an API call returns partial data**: use `status='partial'`, list what was returned and what was missing.

## Cost Tracking

Sum all API call costs and report in `meta.total_cost`:

| API | Endpoint | Cost | When |
|-----|----------|------|------|
| Apollo | /api/v1/people/match | $0.01 | Always (Phase 1) |
| Hunter | /v2/combined/find | $0.01 | Always (Phase 1) |
| Brand.dev | /v1/brand/retrieve | $0.03 | Phase 1, skip for free email |
| Hunter | /v2/email-verifier | $0.01 | Always (Phase 1) |
| Apollo | /api/v1/organizations/enrich | $0.01 | Phase 2, only if funding missing |
| Tomba | /v1/enrich | $0.01 | Phase 2, only if person data conflicts |
| Sixtyfour | /enrich-lead | $0.10 | Phase 3, only if person not found |
| Sixtyfour | /enrich-company | $0.10 | Phase 3, only if major gaps + >500 employees |
| Brand.dev | /v1/brand/ai/products | $0.03 | Phase 4, only if funded + B2B + >50 employees |
| Apollo | /organizations/{id}/job_postings | $0.01 | Phase 4, only if org_id available |
| Scrape Creators | /v1/twitter/profile | ~$0.01 | Phase 5, only if Twitter handle found |
| GitHub API | public | $0.00 | Phase 5, only if GitHub URL found |

## Example

**Input**: `jane@acme.com`

**Expected flow**:
1. Domain: `acme.com`, `is_free_email = false`
2. **Phase 1** (parallel): Apollo people/match, Hunter combined, Brand.dev retrieve, Hunter email-verifier
3. **Phase 1 merge**: Cross-reference person data, classify AI/B2B from descriptions+keywords
4. **Phase 2**: Check if Apollo returned funding — if not, call Apollo org enrich. Check if person data conflicts — if so, call Tomba.
5. **Phase 3**: Skip if person found and company data sufficient
6. **Phase 4**: If company is funded + B2B + >50 employees, run Brand.dev AI products + Apollo job postings
7. **Phase 5**: If GitHub URL found, grab star counts. If Twitter handle found, grab follower count via Scrape Creators
8. Compile and output JSON

## Tips

- Phase 1 calls should all fire simultaneously — they're independent
- Apollo's people/match is the single best-value call — it returns person AND embedded company data including funding events
- Brand.dev is the richest source for company description, industry classification, and social URLs — but costs 3x more than Apollo/Hunter, so skip it for free email providers
- The AI/B2B classification uses data already returned by Phase 1 — no extra API calls needed
- Hunter's `technologies` array is the only source of tech stack data — valuable for technical buyers
- Phase 3 (Sixtyfour) should be rare — Apollo + Hunter find most people. Only trigger for truly obscure leads
- Phase 4 buying signals are the most actionable data for GTM — but gate them to avoid wasting $0.04 on unqualified leads
- GitHub stars and Twitter followers are cheap/free social proof signals — always grab them if URLs/handles are available
