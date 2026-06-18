---
name: comprehensive-enrichment
description: Enrich any person or company from any identifier — email, name, LinkedIn URL, domain, company name, Twitter/X handle. Use when asked to enrich, look up, or research a lead, contact, person, or company.
source: orthogonal
---


# Comprehensive Enrichment — Person & Company

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Maximum data + correctness. Use ALL relevant APIs, cross-reference results, flag conflicts.

## 1. Identifier Detection

Detect input type, then route:

| Input | Contains | Route |
|-------|----------|-------|
| Email | `@` | Person + Company (extract domain) |
| LinkedIn person URL | `linkedin.com/in/` | Person + Company (from results) |
| LinkedIn company URL | `linkedin.com/company/` | Company only |
| Domain | `*.com`, `*.io`, etc. | Company only |
| Company name | No special pattern | Company only |
| Name + company | "John Doe at Stripe" | Person + Company |
| Twitter/X handle | `@handle` or `x.com/` | Person + Company (from results) |

**Person always cascades to company.** Once person enrichment reveals their employer (company name, domain, or LinkedIn company URL), automatically run full company enrichment too. The only time you skip company is if you truly can't identify one.
**If LinkedIn person URL provided:** use full URL for Fiber calls, extract username/slug for other endpoints.

## 2. Person Enrichment

Run ALL of these in parallel where possible. Collect everything, then compile.

### 2a. Full Profile & Contact Info

**Fiber kitchen-sink** (accepts LinkedIn URL, email, or name+company):
```bash
# By LinkedIn URL:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/person","body":{"profileIdentifier":"https://linkedin.com/in/johndoe"}}'

# By email:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/person","body":{"emailAddress":"john@stripe.com"}}'

# By name + company:
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/person"}'
  "personName": {"fullName": "John Doe"},
  "companyName": {"name": "Stripe"},
  "companyDomain": {"domain": "stripe.com"}
}'
```

**Nyne person search** (async — deep work history, education, social):
```bash
# Step 1: POST to start search
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search","body":{"query":"John Doe Stripe"}}'
# Step 2: Poll with GET using request_id
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search","query":{"request_id":"REQUEST_ID"}}'
```

**Sixtyfour enrich-lead** (AI-powered — slow, ~30-60s, but finds rich context):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-lead"}'
  "lead_info": {"first_name": "John", "last_name": "Doe", "company": "Stripe", "linkedin_url": "https://linkedin.com/in/johndoe"},
  "struct": {"work_email": "Work email", "personal_email": "Personal email (Gmail, etc.)", "phone": "Phone number", "title": "Job title", "bio": "Short bio"}
}'
```

### 2b. Email — Find & Verify

Collect ALL emails — work AND personal. Many use cases (recruiting, etc.) need personal emails. Present each email with its type (work/personal) and verification status.

**Find work email** (cross-reference Hunter + Tomba):
```bash
# Hunter (returns work email)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-finder","query":{"domain":"stripe.com","first_name":"John","last_name":"Doe"}}'

# Tomba (returns work email + sometimes personal)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-finder","query":{"domain":"stripe.com","company":"Stripe","first_name":"John","last_name":"Doe"}}'
```

**Find personal email** — these sources often return personal (Gmail, etc.):
```bash
# Tomba from LinkedIn (often returns personal email)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/linkedin","query":{"url":"https://linkedin.com/in/johndoe"}}'

# Tomba enrich (returns all known emails for a person)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/enrich","query":{"email":"john@stripe.com"}}'
```
Nyne person/search and Sixtyfour enrich-lead (Section 2a) also return personal emails — check their results.

**Verify ALL found emails** (run all three verifiers per email):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-verifier","query":{"email":"john@stripe.com"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-verifier","query":{"email":"john@stripe.com"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/validate-email/single","body":{"email":"john@stripe.com"}}'
```
Verify every email found — work and personal. Run verifiers in parallel across all emails.

### 2c. Phone
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-phone"}'
  "lead": {"first_name": "John", "last_name": "Doe", "company": "Stripe"}
}'
```

### 2d. Social Profiles & Activity

**LinkedIn profile** (Fiber):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/profile/single","body":{"identifier":"https://linkedin.com/in/johndoe"}}'
```

**LinkedIn recent posts** (Fiber):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/profile-posts","body":{"identifier":"https://linkedin.com/in/johndoe"}}'
```

**Twitter/X activity** (Nyne — async, returns tweets + engagement metrics):
```bash
# Step 1: POST with Twitter URL
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"","path":"","body":{"social_media_url":"https://x.com/HANDLE"}}'
# Step 2: Poll with GET
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/newsfeed","query":{"request_id":"REQUEST_ID"}}'
```

### 2e. Open-Ended Research
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/search"}'
  "q": "John Doe Stripe VP Engineering recent news interviews talks",
  "depth": "deep",
  "outputType": "sourcedAnswer"
}'
```

### 2f. Compile Person Data

Cross-reference all API results. Merge name, title, emails (work + personal with verification status), phone, LinkedIn, Twitter, work history, education, and recent activity. When APIs disagree, keep both values with source labels. Once employer is identified, run full company enrichment (Section 3). See **Section 5** for output formatting.

## 3. Company Enrichment

Run ALL of these in parallel where possible.

### 3a. Overview

**Brand.dev** (industry, size, description, logo):
```bash
# By domain (primary):
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"stripe.com"}}'

# By company name (if no domain):
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve-by-name","query":{"name":"Stripe"}}'

# By email (extracts domain):
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve-by-email","query":{"email":"john@stripe.com"}}'
```

**Hunter company data:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/domain-search","query":{"domain":"stripe.com"}}'
```

**Fiber company data** (LinkedIn-enriched):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/company","body":{"companyDomain":{"domain":"stripe.com"}}}'
```

### 3b. Leadership & Employees

**Key people by title:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles","body":{"query":"CEO, CTO, CFO, COO, VP at Stripe","pageSize":10}}'
```


### 3c. Funding

**Nyne funding history** (async):
```bash
# Step 1: POST
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"","path":"","body":{"company_name":"Stripe"}}'
# Step 2: Poll with GET
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/company/funding","query":{"request_id":"REQUEST_ID"}}'
```

**Nyne investors:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"","path":"","body":{"company_domain":"stripe.com"}}'
```

### 3d. Products & Web Presence

**Products from website:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/ai/products","body":{"domain":"stripe.com"}}'
```

**Scrape for pricing/features:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://stripe.com/pricing",
  "user_prompt": "Extract all products, pricing tiers, and features"
}'
```

**Find competitors/similar companies:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/findSimilar"}'
  "url": "https://stripe.com",
  "numResults": 10,
  "contents": {"text": true}
}'
```

### 3e. Open-Ended Research
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/search"}'
  "q": "Stripe recent news funding announcements partnerships press releases",
  "depth": "deep",
  "outputType": "sourcedAnswer"
}'
```

### 3f. Compile Company Data

Cross-reference all API results. Merge overview, leadership, funding, products, competitors, news, and social presence. When APIs disagree, keep both values with source labels. See **Section 5** for output formatting.

## 4. Full Pipeline Example — `enrich john@stripe.com`

**Step 1: Detect** — Email → person enrichment + extract domain `stripe.com` for company.

**Step 2: Person enrichment** (run in parallel):
```bash
# Profile (3 sources)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/person","body":{"emailAddress":"john@stripe.com","companyDomain":{"domain":"stripe.com"}}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search","body":{"query":"john stripe.com"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-lead","body":{"lead_info":{"email":"john@stripe.com","company":"Stripe"},"struct":{"work_email":"Work email","personal_email":"Personal email","phone":"Phone","title":"Title","bio":"Bio"}}}'

# Find personal email
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/enrich","query":{"email":"john@stripe.com"}}'

# Verify work email (3 sources)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-verifier","query":{"email":"john@stripe.com"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-verifier","query":{"email":"john@stripe.com"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/validate-email/single","body":{"email":"john@stripe.com"}}'
# Also verify any personal emails found with the same 3 verifiers

# Phone
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/find-phone","body":{"lead":{"email":"john@stripe.com","company":"Stripe"}}}'

# Research
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/search","body":{"q":"john stripe.com","depth":"deep","outputType":"sourcedAnswer"}}'
```

Once you have the person's full name + LinkedIn from Step 2, fire off:
```bash
# LinkedIn profile + posts
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/profile/single","body":{"identifier":"LINKEDIN_URL"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/profile-posts","body":{"identifier":"LINKEDIN_URL"}}'

# Twitter (if discovered)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"","path":"","body":{"social_media_url":"https://x.com/TWITTER_HANDLE"}}'
```

**Step 3: Company enrichment** (run in parallel with person):
```bash
# Overview
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"stripe.com"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/domain-search","query":{"domain":"stripe.com"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/company","body":{"companyDomain":{"domain":"stripe.com"}}}'

# Leadership
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles","body":{"query":"CEO, CTO, CFO, COO, VP at Stripe","pageSize":10}}'

# Funding
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"","path":"","body":{"company_name":"Stripe"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"","path":"","body":{"company_domain":"stripe.com"}}'

# Products & competitors
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/ai/products","body":{"domain":"stripe.com"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper","body":{"website_url":"https://stripe.com/pricing","user_prompt":"Extract all products, pricing tiers, and features"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/findSimilar","body":{"url":"https://stripe.com","numResults":10}}'

# News
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/search","body":{"q":"Stripe recent news funding announcements","depth":"deep","outputType":"sourcedAnswer"}}'
```

**Step 4: Compile & Format** — Merge all results, cross-reference, flag conflicts, then present using the two-tier output format (Section 5): summary card first, full details below.

## 5. Output Format

**Always present results in two tiers: a scannable summary card on top, then full details below.**

### Tier 1: Summary Card

Lead with this. A sales rep should be able to scan it in 30 seconds.

**For a Person (+ their company):**

```
## 🔍 {Full Name} — {Title} at {Company}

**Contact**
- ✉️ Work: {email} ({verification status})
- ✉️ Personal: {email} ({verification status})
- 📱 {phone}
- 🔗 LinkedIn: {url}
- 𝕏 Twitter: {url}

**Bio**: {One-liner from best available source}

**Personalization Angles**
1. {Recent activity, talk, post, or news mention — with date}
2. {Another angle}
3. {Another angle}

**Company Snapshot**: {Company} · {industry} · {employee count} employees · HQ: {location}
Latest funding: {round type} — ${amount} ({date}) · Total raised: ${total} · Valuation: ${valuation}
```

**For a Company (standalone):**

```
## 🏢 {Company Name}

**Overview**
- 🌐 {domain}
- 🏷️ {industry}
- 👥 {employee count} employees
- 📍 HQ: {location}

**Funding**: {latest round} — ${amount} ({date}) · Total raised: ${total} · Valuation: ${valuation}

**Key Decision Makers**
| Name | Title | Email |
|------|-------|-------|
| {name} | {title} | {email} |
| ... | ... | ... |

**Recent News & Icebreakers**
1. {headline — date — source}
2. {headline — date — source}
3. {headline — date — source}
```

### Tier 2: Full Details

Below a clear separator (`---`), include the complete deep-dive for those who want to dig in:

- **Person**: Full work history, education, all social profiles, all LinkedIn posts, all tweets + engagement, publications, full Linkup research, all email sources + verification breakdown
- **Company**: Full description, all funding rounds with dates/amounts/investors, complete leadership list, products + pricing tiers, competitor analysis, full news results, social presence stats

Present Tier 2 with clear section headers. Include source labels on every data point. Flag all conflicts between APIs.

## 6. Tips

- **Parallelize**: Run all independent API calls concurrently — person and company enrichment can run simultaneously
- **Nyne is async**: POST returns `request_id`, poll with GET until status is complete (5-20 seconds)
- **Conflicts**: When APIs disagree, show both values with source labels — never silently pick one
- **LinkedIn URLs**: Dramatically improve match rates for Fiber and Tomba — extract from any source that returns them
- **All emails matter**: Always collect both work AND personal emails — recruiting and hiring use cases need personal emails. Label each as work/personal
- **Email verification**: Verify every email (work + personal) with all 3 verifiers (Hunter, Tomba, Fiber) and take consensus
- **Person → Company**: Person enrichment always cascades — once you identify their employer, run full company enrichment automatically
- **Linkup deep search**: Best for personalization angles — recent talks, interviews, blog posts, news mentions
- **Sixtyfour enrich-lead is slow**: Takes 30-60 seconds (AI web research). Fire it early, don't block on it — continue processing other API results and merge Sixtyfour data when it arrives
- **Nyne newsfeed for Twitter/X**: Pass the Twitter URL to get recent tweets + engagement. Async like other Nyne endpoints
- **Adaptive**: Skip APIs that don't apply (e.g., don't run email-finder if email is already known, don't run funding search for public megacorps)
- **Tomba linkedin**: If you have a LinkedIn URL but no email, Tomba's LinkedIn finder is very effective
- **Company from email**: Brand.dev's retrieve-by-email endpoint handles domain extraction automatically
