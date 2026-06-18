---
name: team-linkedin-profiles
description: Find LinkedIn profiles of a specific team or department at a company. Use when asked to get LinkedIn profiles, find team members, or look up people in a particular team/department/group at a company.
source: orthogonal
---


# Team LinkedIn Profiles

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Find everyone on a specific team/department at a company and return their LinkedIn profiles.

## Workflow

### 1. Parse the Request

Extract from the user's query:
- **Company name** (required)
- **Team/department name** (required) — e.g., fraud, engineering, sales, marketing, growth, data science
- **Filters** (optional) — seniority level, location, max results count

### 2. Resolve the Company

Use Brand.dev to disambiguate the company and get its domain, industry, and description. This is critical for companies with common names (e.g., "Mercury" the fintech vs "Mercury Financial" the credit card company).

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve-by-name","query":{"name":"Mercury"}}'
```

From the result, build a **company context string** combining the company name, domain, industry, and a short description. Example: `"Mercury fintech banking startup mercury.com"`. Use this context string in all subsequent search queries to improve precision.

If the user provides a domain directly, use `/v1/brand/retrieve` instead:
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"mercury.com"}}'
```

### 3. Search for Team Members

Run both searches **in parallel**:

**Primary — Exa people search** (best precision, returns LinkedIn URLs + structured data):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "{company context string} {team} team members",
  "category": "people",
  "numResults": 50,
  "includeDomains": ["linkedin.com"]
}'
```

Use `numResults: 50` by default — best balance of coverage vs context window size (~31K tokens). Each Exa result averages ~800 tokens of structured data, so 100 results would consume ~81K tokens and roughly half tend to be noise (wrong companies). If the user explicitly wants exhaustive results, bump to 100 (max). Exa costs 1 cent per request on Orthogonal regardless of numResults.

Try multiple query variations if results are sparse:
- `"{company} {team} team"`
- `"{team} at {company} {industry}"`
- `"{team} analyst OR engineer OR manager at {company}"`

**Supplement — Hunter domain search** (surfaces senior/executive people Exa misses):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/domain-search","query":{"domain":"{domain","from":"","Step":"","2}":""}}'
```

Hunter returns employees with names, titles, emails, and LinkedIn URLs. It has no useful department filter for niche teams (fraud people end up scattered across "management", "executive", "unknown"), so pull all results and filter by title keywords in Step 4. Hunter is especially good at finding senior leadership that Exa may miss.

### 4. Filter & Deduplicate

This step is critical for accuracy:

1. **Verify current company** — For each result, confirm they currently work at the target company (not a similarly-named one). Use the domain and description from Step 2 to distinguish:
   - Example: Mercury (fintech, mercury.com) vs Mercury Financial (credit cards, mercuryfinancial.com)
   - Check the person's current employer name and domain against the Brand.dev data

2. **Verify team/department** — Check that the person's title or department matches the target team. Be flexible with title variations:
   - "Fraud" team → fraud analyst, fraud investigator, fraud ops, risk & fraud, trust & safety
   - "Engineering" team → software engineer, SWE, developer, engineering manager
   - "Sales" team → account executive, SDR, BDR, sales manager, revenue

3. **Deduplicate** — Merge Exa and Hunter results by LinkedIn URL. Prefer Exa data when both have the same person (richer structured data). Hunter may provide email addresses that Exa doesn't.

4. **Flag uncertain matches** — If a person's company match is ambiguous, include them in the results but flag with a note (e.g., "Could not confirm current employer — verify manually").

### 5. Present Results

Output a clean markdown table:

```
## {Team} Team at {Company}

Found {N} members:

| Name | Title | Location | LinkedIn |
|------|-------|----------|----------|
| Jane Smith | Senior Fraud Analyst | San Francisco, CA | [Profile](https://linkedin.com/in/janesmith) |
| ... | ... | ... | ... |

**Uncertain matches** (verify manually):
| Name | Title | Note | LinkedIn |
|------|-------|------|----------|
| ... | ... | ... | ... |
```

Include a note about coverage: "Some profiles may show abbreviated names (e.g., 'Oneida D.') — these are LinkedIn members with restricted visibility settings. Team members with no LinkedIn presence won't appear."

### 6. Optional Deep Enrichment

Only if the user requests more detail on specific people, use Fiber live-fetch per profile:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/profile/single","body":{"identifier":"https://linkedin.com/in/USERNAME"}}'
```

This returns full work history, education, skills, and recent activity. Run these in parallel for multiple profiles.

## Tips

- **Add industry context** to all search queries — "Mercury fintech" finds the right Mercury much more reliably than just "Mercury"
- **Expand title keywords** — Teams use varied titles. "Data team" could include data scientist, data engineer, analytics engineer, ML engineer, data analyst
- **Exa vs Hunter** — Exa finds the most team members with best structured data. Hunter surfaces senior/executive people and provides email addresses. Use both in parallel for best coverage
- **Context window** — Each Exa result averages ~800 tokens. 50 results ≈ 31K tokens, 100 results ≈ 81K tokens. Default to 50; only go to 100 if the user wants exhaustive results
- **Handle pagination** — If Exa returns exactly `numResults`, there are likely more. Bump to 100 or run follow-up queries with different title keywords
- **Small teams** — For niche teams (e.g., "fraud" at a 200-person startup), expect 3-8 results. This is normal
- **Large teams** — For broad teams (e.g., "engineering" at a 5,000-person company), suggest the user narrow by sub-team or seniority
- **Abbreviated names** — Some Exa results show partial names like "Joey G." or "Oneida D." These are real profiles with restricted LinkedIn visibility, not errors. Include them in results with the name as-is
