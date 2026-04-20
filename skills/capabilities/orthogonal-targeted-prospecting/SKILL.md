---
name: orthogonal-targeted-prospecting
description: Build a prospect list of companies with decision makers, verified contact info, and hiring/intent signals. Use when asked to find leads by industry, build an account list with specific titles, prospect companies that are actively hiring, or create a targeted outreach list filtered by company size, location, and hiring activity.
source: orthogonal
---


# Targeted Prospecting — Industry + Decision Makers + Hiring Signals

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Build a prioritized prospect list for any industry. Finds companies matching your ICP, identifies decision makers by title, enriches with verified contact info, and layers on hiring/intent signals to prioritize who's ready to buy now.

## Workflow

### 1. Parse the Request

Extract from the user's query:
- **Industry/vertical** (required) — e.g., staffing, fintech, healthcare IT, construction
- **Decision maker titles** (required) — e.g., COO, VP Engineering, Head of Marketing
- **Location** (optional, default: US) — country, state, city, or region
- **Company size** (optional) — employee count min/max, revenue floor
- **Hiring signal roles** (optional) — job postings that indicate buying intent (e.g., "Scheduling Coordinator" = ops pain, "DevOps Engineer" = infra investment)
- **Max results** (optional, default 15)
- **Company/product** (optional) — if user mentions what they're selling, triggers competitive intel in Step 7

### 2. Find Target Companies

Run 2-3 search strategies **in parallel**:

**Strategy A — Scrapegraph searchscraper** (primary — most targeted results):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "top {industry} companies in {location} with company name, website, employee count, and headquarters",
  "num_results": 15
}'
```

Best source for industry-specific company lists. Returns targeted results from industry directories, Inc 5000 lists, and trade publications. In testing, returned 28 staffing companies in a single call vs Fiber's noisy mix of tech giants and staffing firms.

**Strategy B — Fiber NL company search** (co-primary — best structured data):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "{industry} companies in {location} with {employee_min}+ employees",
  "pageSize": 20
}'
```

Returns structured company data with employee counts, domains, LinkedIn URLs, and descriptions. **Caveat:** For niche industries (staffing, construction, etc.), Fiber NL search often returns broad/noisy results mixed with unrelated companies. Filter results by industry keywords from the description, `li_industries`, and `crunchbase_categories` fields. Use company `names` field (not `name_consensus`) for the company name.

**Strategy C — Nyne company search** (supplemental — attempt, may return errors):

```bash
# Step 1: POST to start search
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/search","body":{"query":"{industry} companies {location} {size_qualifier}"}}'
# Step 2: Poll with GET using request_id
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/search","query":{"request_id":"REQUEST_ID"}}'
```

Nyne is async — POST returns a `request_id`, poll with GET until complete (5-20s). **Note:** Nyne company search can return 400 errors depending on query format. If it fails, proceed with Scrapegraph + Fiber results — don't block on Nyne.

#### Scaling Up

For 20+ results, run parallel searches by sub-region or sub-vertical:

```bash
# Parallel searches for different sub-regions
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "{industry} companies in New York with {size}+ employees",
  "pageSize": 15
}'

curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "{industry} companies in California with {size}+ employees",
  "pageSize": 15
}'
```

### 3. Extract & Deduplicate

Merge results from all strategies. For each company, extract:
- **Company name**
- **Domain / website URL**
- **Employee count** (primary size proxy — revenue data is often unavailable)
- **Headquarters / location**
- **LinkedIn company URL** (if returned by Fiber/Nyne)
- **Description / industry tags**

Deduplicate by domain first, then by normalized company name. Apply user's size filters — use employee count as revenue proxy when revenue is unavailable (100+ employees ≈ $10M+ revenue as rough heuristic).

Enrich top companies with Brand.dev for industry context:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"{company_domain}"}}'
```

### 4. Find Decision Makers

**Cost ranking (25 results):** Apollo $0.01 | Fiber $0.50 | Nyne/PDL $7.50. Always try Apollo first.

**Best approach: Apollo search first, then Fiber for NL queries, then per-company fallbacks.**

**Primary — Apollo people search (cheapest at $0.01 flat):**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/apollo/mixed_people/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "person_titles": ["{title_1}", "{title_2}"],
  "person_locations": ["{location}"],
  "per_page": 25
}'
```

**Fallback — Fiber NL profile search ($0.02/record, good for broad industry queries):**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/fiber/v1/natural-language-search/profiles \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "query": "{title_1} or {title_2} at a {industry} company in {location}",
  "pageSize": 15
}'
```

This is the highest-yield approach. Returns decision makers across the industry with LinkedIn URLs, current titles, and company names.

**Per-company fallback — Fiber NL profile search ($0.02/record)** (for companies not covered above):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/fiber/v1/natural-language-search/profiles \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "query": "{title_1} or {title_2} at {company_name}",
  "pageSize": 5
}'
```

Per-company queries often return empty results, especially for large enterprises where C-suite profiles may not be indexed. Use this only for high-priority companies missing from the broad search.

**Last resort — Nyne person search (EXPENSIVE: $0.30/record, async):**

Only use if Apollo and Fiber returned insufficient results.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/pdl/person/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{title} at {company_name} {location}"}'
```

**Fallback — Scrapegraph website scrape** (scrape the company's leadership page):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://{company_domain}/about",
  "user_prompt": "Extract names, titles, and any contact info for the leadership team. Identify anyone with these titles: {target_titles}"
}'
```

If `/about` returns 422, fall back to the homepage URL.

### 5. Enrich Contacts

For each decision maker found, run **all** of these in parallel:

**Email discovery — Sixtyfour first** (highest hit rate for small/mid-market domains):

```bash
# Sixtyfour AI email finder (PRIMARY — found 9/12 emails in testing)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-email"}'
  "lead": {"first_name": "{first}", "last_name": "{last}", "domain": "{company_domain}"}
}'

# Hunter email-finder (supplemental — often returns null for small company domains)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-finder","query":{"domain":"{company_domain}","first_name":"{first}","last_name":"{last}"}}'

# Tomba email-finder (supplemental — similar limitations to Hunter on small domains)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-finder","query":{"domain":"{company_domain}","company":"{company_name}","first_name":"{first}","last_name":"{last}"}}'

# Tomba LinkedIn-to-email (if LinkedIn URL found in Step 4)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/linkedin","query":{"url":"{linkedin_url}"}}'
```

In testing, Sixtyfour found emails for 9 out of 12 prospects where Hunter and Tomba returned null. Sixtyfour is the most reliable source for small/mid-market company domains. Still run all sources in parallel — each occasionally finds emails the others miss.

**Phone discovery:**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-phone"}'
  "lead": {"first_name": "{first}", "last_name": "{last}", "company": "{company_name}"}
}'
```

Sixtyfour find-phone had a 100% hit rate in testing (10/10 prospects).

**Deep enrichment** (fire early, don't block — takes 30-60s):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-lead"}'
  "lead_info": {
    "first_name": "{first}", "last_name": "{last}",
    "company": "{company_name}", "linkedin_url": "{linkedin_url}"
  },
  "struct": {
    "work_email": "Work email",
    "personal_email": "Personal email",
    "phone": "Phone number",
    "title": "Current job title",
    "bio": "Short professional bio"
  }
}'
```

**Fiber kitchen-sink enrichment** (if LinkedIn URL available — may return 400):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/person"}'
  "profileIdentifier": "{linkedin_url}"
}'
```

Kitchen-sink can intermittently return 400 errors regardless of parameter format. If it fails, proceed with Sixtyfour + Hunter + Tomba results — don't block on kitchen-sink.

**Triple email verification** — verify ALL found emails with 3 services:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-verifier","query":{"email":"{email}"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-verifier","query":{"email":"{email}"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/validate-email/single","body":{"email":"{email}"}}'
```

Take the consensus. Label each email as verified/unverified. Collect both work and personal emails.

### 6. Hiring / Intent Signals

**Only run this step if the user specified hiring signal roles.** This is the key differentiator for prioritization.

**Primary — Scrapegraph searchscraper for hiring signals:**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "{industry} companies hiring {signal_role} in {location}, list company name, job title, and location",
  "num_results": 15
}'
```

**Supplemental — Tavily for job board coverage:**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/search"}'
  "query": "{industry} {signal_role} job opening {location}",
  "max_results": 10,
  "include_answer": false
}'
```

Then scrape top job board results for company names:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "{job_board_url}",
  "user_prompt": "Extract all company names hiring for {signal_role}, with job title and location"
}'
```

**Optional — Fiber job search** (attempt, may be unreliable):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/job-search"}'
  "searchParams": {
    "job_titles": ["{signal_role}"],
    "industries": ["{industry}"]
  },
  "pageSize": 20
}'
```

Note: Fiber job-search with searchParams filters can return 400 errors. Attempt it but don't rely on it — Scrapegraph is the primary method for hiring signals.

**Cross-reference:** Match companies found hiring signal roles against the company list from Step 2. Matches become **High Priority** prospects. Companies hiring for signal roles that weren't in your original list are bonus leads — add them.

**Growth signals:** Check Fiber company data (from Step 4 kitchen-sink results) for headcount growth percentage. Companies growing >20% YoY are additional high-priority signals.

### 7. Competitive Intel (Optional)

**Only run if the user mentioned their product/company.** Research what the user sells and check prospects for competing solutions.

```bash
# Research user's product
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://{user_company_domain}",
  "user_prompt": "What does this company sell? Describe the product in one sentence."
}'

# Find competitors
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "competitors and alternatives to {user_product} for {industry}",
  "num_results": 5
}'

# Check each prospect's website for competing products (parallel)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://{prospect_domain}",
  "user_prompt": "Does this company use or mention: {competitor_1}, {competitor_2}, {competitor_3}? Check page content, footer, and embedded widgets."
}'
```

Flag prospects: **Greenfield** (no competitor detected) > **Competitive displacement** (uses a competitor — note which one) > **Unknown**.

### 8. Present Results

Output a prioritized table with **full URLs** (not markdown links — users need to copy-paste):

```
## Prospect List: {Title} at {Industry} Companies in {Location}

Found {N} companies with {M} decision makers identified.

### High Priority — Hiring Signal Detected
| # | Company | Website | Employees | Decision Maker | Title | Email | Email Status | Phone | Signal |
|---|---------|---------|-----------|---------------|-------|-------|-------------|-------|--------|
| 1 | Acme Staffing | https://acmestaffing.com | 250 | Jane Smith | COO | jane@acme.com | Verified | (555) 123-4567 | Hiring Scheduling Coordinator |

### Medium Priority — Matches ICP, No Signal Detected
| # | Company | Website | Employees | Decision Maker | Title | Email | Email Status | Phone | Notes |
|---|---------|---------|-----------|---------------|-------|-------|-------------|-------|-------|
| 5 | Beta Corp | https://betacorp.com | 180 | John Doe | VP Ops | john@beta.com | Verified | — | Growing 25% YoY |

### Lower Priority — Limited Data or Below Target Size
| # | Company | Website | Employees | Decision Maker | Title | Email | Phone | Notes |
|---|---------|---------|-----------|---------------|-------|-------|-------|-------|
| 10 | Small Co | https://smallco.com | 85 | — | — | — | — | Below 100 employee threshold |

### Summary
- **Companies found**: {N}
- **Decision makers identified**: {count}/{N}
- **With verified email**: {count}
- **With phone**: {count}
- **High priority (hiring signal)**: {count}
- **Medium priority (right profile)**: {count}
- **Lower priority (limited data)**: {count}
```

## APIs Used

| API | Endpoint | Purpose |
|-----|----------|---------|
| **Fiber** | `/v1/natural-language-search/companies` | Find companies by industry + size |
| **Fiber** | `/v1/natural-language-search/profiles` | Find decision makers by title + company |
| **Fiber** | `/v1/kitchen-sink/person` | Enrich person by LinkedIn URL or name+company |
| **Fiber** | `/v1/kitchen-sink/company` | Enrich company data |
| **Fiber** | `/v1/job-search` | Job postings (unreliable, attempt only) |
| **Fiber** | `/v1/validate-email/single` | Email verification |
| **Nyne** | `/company/search` | Async company search by industry |
| **Nyne** | `/person/search` | Async person search by company + role |
| **Scrapegraph** | `/v1/searchscraper` | Web search for companies + hiring signals |
| **Scrapegraph** | `/v1/smartscraper` | Scrape websites for leadership/competitive intel |
| **Tavily** | `/search` | Supplemental web search for job boards |
| **Hunter** | `/v2/email-finder` | Find email by name + domain |
| **Hunter** | `/v2/email-verifier` | Email verification |
| **Tomba** | `/v1/email-finder` | Find email by name + domain |
| **Tomba** | `/v1/linkedin` | Email from LinkedIn URL |
| **Tomba** | `/v1/email-verifier` | Email verification |
| **Sixtyfour** | `/find-email` | AI email finder |
| **Sixtyfour** | `/find-phone` | AI phone finder |
| **Sixtyfour** | `/enrich-lead` | AI deep enrichment |
| **Brand.dev** | `/v1/brand/retrieve` | Company overview/context |

## Examples

**Example 1 — Staffing/recruiting (the Clay use case):**

"Find COOs at US staffing firms with 100+ employees that are hiring Scheduling Coordinators"

```bash
# Step 2: Find staffing companies (parallel)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "staffing and recruiting companies in the United States with 100 or more employees",
  "pageSize": 20
}'

curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/search","body":{"query":"staffing recruiting firms US 100+ employees"}}'

curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "top staffing and recruiting companies in the US with company name, website, employee count, and headquarters",
  "num_results": 15
}'

# Step 4: Find COOs (parallel, per company)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles"}'
  "query": "COO or Chief Operating Officer or Head of Operations at {company_name}",
  "pageSize": 3
}'

# Step 5: Enrich (parallel, per person)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-finder","query":{"domain":"{domain}","first_name":"{first}","last_name":"{last}"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-email","body":{"lead":{"first_name":"{first}","last_name":"{last}","domain":"{domain}"}}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-phone","body":{"lead":{"first_name":"{first}","last_name":"{last}","company":"{company}"}}}'

# Step 6: Hiring signals
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "staffing companies hiring Scheduling Coordinator or Recruiting Coordinator in the US, list company name, job title, and location",
  "num_results": 15
}'
```

**Example 2 — SaaS sales (fintech):**

"Find VP Engineering or CTO at fintech startups with 50-200 employees in the US that are hiring DevOps engineers"

```bash
# Companies
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "fintech startups in the United States with 50 to 200 employees",
  "pageSize": 20
}'

# Decision makers (per company)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles"}'
  "query": "VP Engineering or CTO at {company_name}",
  "pageSize": 3
}'

# Hiring signal
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "fintech companies hiring DevOps Engineer or Site Reliability Engineer in the US, list company name and job title",
  "num_results": 15
}'
```

**Example 3 — Recruiting (healthcare in Texas):**

"Find HR Directors at healthcare companies in Texas with 500+ employees"

```bash
# Companies
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "healthcare companies in Texas with 500 or more employees",
  "pageSize": 20
}'

# Decision makers
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles"}'
  "query": "HR Director or VP Human Resources at {company_name}",
  "pageSize": 3
}'
```

**Example 4 — Simple, no hiring signals (construction):**

"Build a prospect list of construction companies in California with Head of Safety as decision maker"

```bash
# Companies
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/companies"}'
  "query": "construction companies in California",
  "pageSize": 15
}'

# Decision makers
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles"}'
  "query": "Head of Safety or Safety Director or VP Safety at {company_name}",
  "pageSize": 3
}'
```

## Error Handling

- **Fiber NL company search returns noisy results** — For niche industries, Fiber often returns unrelated companies mixed in (e.g., tech giants alongside staffing firms). Filter results by `li_industries`, `crunchbase_categories`, or keywords in `short_description`. If too noisy, use Scrapegraph searchscraper as primary source instead
- **Fiber NL profile search returns empty per-company** — Per-company queries often return 0 results, especially for large enterprises. Use a broad industry-wide query instead (e.g., "COO at a staffing company in the US") which yields 10-15x more results
- **Fiber kitchen-sink returns 400** — Can fail intermittently regardless of parameter format (`profileIdentifier`, slug, or full URL all tested). This appears to be an API reliability issue, not a format issue. Proceed with Sixtyfour + Hunter + Tomba for enrichment
- **Nyne returns 400** — Nyne company and person search can return 400 errors. Query format sensitivity is unclear. Don't block on Nyne — proceed with Scrapegraph + Fiber results
- **Fiber job-search returns 400** — Known issue with searchParams filters. Use Scrapegraph searchscraper for hiring signals instead
- **Smartscraper 422 on /about path** — Fall back to scraping the homepage URL (no path appended)
- **Hunter/Tomba return null for email** — Expected for small/mid-market company domains. In testing, Hunter and Tomba returned null for most staffing firms while Sixtyfour found 9/12. Always run Sixtyfour as primary email source
- **No hiring signal found** — Not every industry/location has active job postings for specific roles. Mark as "No signal detected" — these are still valid medium-priority prospects

## Tips

- **Scrapegraph is the best company finder for niche industries** — In testing, Scrapegraph returned 28 targeted staffing companies vs Fiber's noisy mix. Use Scrapegraph as primary for industry-specific lists, Fiber as co-primary for structured data (employee counts, domains)
- **Broad profile search beats per-company search** — One query for "COO at staffing companies in the US" returned 15 profiles. The same search run per-company (8 companies) returned only 2 profiles total. Always start with a broad industry-wide NL profile search
- **Sixtyfour is the #1 email finder** — Found 9/12 emails in testing where Hunter and Tomba returned null. For small/mid-market company domains, Sixtyfour's AI approach dramatically outperforms pattern-based tools. Still run all sources in parallel for maximum coverage
- **Sixtyfour find-phone is highly reliable** — 100% hit rate in testing (10/10 prospects). Always include phone discovery
- **Hiring signals are the #1 prioritization tool** — A company actively hiring for a role your product replaces/supports is 3-5x more likely to buy. Scrapegraph searchscraper is the best source — found Randstad and Robert Half hiring for Scheduling Coordinators in a single call
- **Employee count is the best size proxy** — Revenue data is rarely available from APIs. Use employee count: 50+ ≈ established, 100+ ≈ mid-market, 500+ ≈ enterprise
- **Fiber kitchen-sink may be unreliable** — Can return 400 errors intermittently. Don't depend on it as the sole enrichment source — always have Sixtyfour running in parallel as fallback
- **LinkedIn URLs dramatically improve enrichment** — When Fiber NL profile search returns LinkedIn URLs, feed them into Tomba-LinkedIn for email and Sixtyfour enrich-lead for deep context
- **Deduplicate aggressively** — Multiple search strategies will return overlapping results. Dedup by domain first (most reliable), then by normalized company name
- **Hunter email-verifier is fast and reliable** — Even when Hunter email-finder returns null, Hunter email-verifier is excellent for verifying emails found by Sixtyfour. Every email verified came back with score 89-100
- **Include title variations** — Search for "COO OR Chief Operating Officer OR Head of Operations" to catch different title formats at the same level
- **Filter Fiber company results by industry** — Use `li_industries`, `crunchbase_categories`, or keywords in `short_description` to filter out irrelevant companies from Fiber NL results
