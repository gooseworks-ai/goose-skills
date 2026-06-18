---
name: tam-builder
description: >
  Build and maintain a scored Total Addressable Market (TAM) using Apollo Company Search.
  Discovers companies matching ICP, scores fit (0-100), assigns tiers (1/2/3), and
  auto-builds a persona watchlist for Tier 1-2 companies using Apollo People Search (free).
  Outputs to CSV.
tags: [lead-generation]
---

# TAM Builder

Build and maintain a scored Total Addressable Market. Uses Apollo Company Search to discover companies, scores ICP fit (0-100), assigns tiers (1/2/3), and auto-builds a persona watchlist for Tier 1-2 companies using Apollo People Search (free).

**Three modes:**
- **build** — First-time TAM construction from Apollo search
- **refresh** — Update existing TAM: re-score, detect tier changes, deprecate stale companies
- **status** — Read-only report of current TAM state

## Prerequisites

### Apollo API Key
Add to `.env`:
```
APOLLO_API_KEY=your-api-key-here
```

That's it — one env var.

## Config Format

Create a JSON config per client/segment:

```json
{
  "client_name": "happy-robot",
  "tam_config_name": "voice-ai-midmarket",

  "company_filters": {
    "organization_num_employees_ranges": ["51,200", "201,500", "501,1000"],
    "q_organization_keyword_tags": ["call center", "contact center"],
    "organization_locations": ["United States"]
  },

  "scoring": {
    "weights": {
      "employee_count_fit": 30,
      "industry_fit": 25,
      "funding_stage_fit": 20,
      "geo_fit": 15,
      "keyword_match": 10
    },
    "tier_thresholds": { "tier_1_min_score": 75, "tier_2_min_score": 50 },
    "target_industries": ["Telecommunications", "Customer Service"],
    "target_employee_ranges": [[51, 200], [201, 500], [501, 1000]],
    "target_funding_stages": ["Series A", "Series B", "Series C"],
    "target_geos": ["United States"]
  },

  "watchlist": {
    "enabled": true,
    "personas_per_company": 3,
    "person_filters": {
      "person_titles": ["VP of Operations", "Head of Customer Service"],
      "person_seniority": ["vp", "director", "c_suite"]
    },
    "tiers_to_watch": [1, 2]
  },

  "mode": "standard",
  "max_pages": 50
}
```

## Approval Gate

**CRITICAL: Never export results without explicit user approval.**

**Required flow:**
1. Search Apollo for a small sample first (~100 companies)
2. Score them and present: tier distribution, example Tier 1/2 companies, scoring sanity check
3. **Get explicit user approval** before running the full build
4. Only then run the full search + score + export

## Pipeline: Build Mode

```
Step 0: --preview → total count + cost estimate (no DB writes)
Step 1: --sample --test → search 1 page, score in-memory, show results (no DB writes)
Step 2: User reviews sample → approves, adjusts filters, or caps scope
Step 3: Full build → Apollo Company Search → Export to CSV → Score → Tier → Watchlist
```

Phase details (Step 3 only — after user approval):
```
Phase 1: Apollo Company Search → Upsert raw companies → Score ICP fit → Assign tiers
Phase 2: (skipped in build mode — no prior data to deprecate)
Phase 3: Persona Watchlist — pull 2-3 personas per Tier 1-2 company (free)
```

## Pipeline: Refresh Mode

```
Phase 1: Apollo Company Search → Upsert/update companies → Re-score → Detect tier changes
Phase 2: Deprecation — companies missing 2+ consecutive refreshes get deprecated
Phase 3: Persona Watchlist — pull personas for new/promoted Tier 1-2 companies,
         disqualify personas at deprecated companies
```

## ICP Scoring (0-100)

Pure function, no API calls. Weighted scoring across 5 dimensions from config:
- `employee_count_fit` — headcount in target ranges?
- `industry_fit` — industry matches targets?
- `funding_stage_fit` — funding stage in targets?
- `geo_fit` — HQ location in target geos?
- `keyword_match` — org keywords overlap config keywords?

Score thresholds (configurable): >=75 = Tier 1, >=50 = Tier 2, else Tier 3.

## Deprecation Rules (refresh only)

- First miss (not returned by search): `metadata.refresh_miss_count = 1`, keep active
- Second consecutive miss: `tam_status = 'deprecated'`
- Employee count drops to 0: immediate deprecation
- Companies with `tam_status = 'converted'` are always exempt

## Watchlist — Persona Sync

| Scenario | Behavior |
|----------|----------|
| New Tier 1-2 company | Pull 2-3 personas immediately |
| Company promoted Tier 3→2 | Pull personas during refresh |
| Company deprecated | Disqualify monitoring personas |
| Company demoted Tier 1→3 | Keep existing personas, stop refreshing |

## Mode Caps

| Parameter | Test | Standard | Full |
|-----------|------|----------|------|
| Max pages | 1 | 50 | 200 |
| Max companies | 100 | 5,000 | 20,000 |

## Apollo API Reference

- **Company Search:** `POST https://api.apollo.io/api/v1/mixed_companies/search` — Returns matching companies in the `accounts` array (not `organizations`). Fields: `name`, `primary_domain`, `estimated_num_employees`, `industry`, `keywords`, `city`, `state`, `country`.
- **People Search:** `POST https://api.apollo.io/api/v1/mixed_people/search` — **$0.01 flat per call** (cheapest people search). Returns matching people in the `people` array. Fields: `first_name`, `title`, `organization.name`. Email/LinkedIn obfuscated on free tier.
- **People Match (enrich):** `POST https://api.apollo.io/api/v1/people/match` — ~$0.03 per match. Reveals email, phone, LinkedIn URL, full name.
- **Auth:** `x-api-key: {APOLLO_API_KEY}` header on all requests
- **Pagination:** `per_page` (max 100), `page` (1-indexed). `pagination.total_entries` gives total count.

## Output

Save results as CSV to the current working directory:
- `tam-companies-{date}.csv` — All discovered companies with ICP score and tier
- `tam-personas-{date}.csv` — Persona watchlist for Tier 1-2 companies (from People Search)
