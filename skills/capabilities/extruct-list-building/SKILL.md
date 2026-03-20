---
name: extruct-list-building
description: >
  Build targeted company lists using Extruct's semantic search, lookalike search,
  and Deep Search. Supports ICP-driven query design, multi-angle discovery, and
  criteria-scored async research. Deduplicates by domain and uploads results to
  Extruct tables with auto-enriched Company Profiles.
tags: [lead-generation]
---

# Extruct List Building

Build company lists using Extruct's company discovery API, guided by a decision tree. Reads from the company context file for ICP and seed companies.

## Prerequisites

### Extruct API Token

Get your API token from [Extruct Settings](https://app.extruct.ai/settings). Add to `.env`:
```
EXTRUCT_API_TOKEN=your-token-here
```

### Extruct Plan & Pricing

Before running any search, check which plan the user is on — this determines which methods are available, cost per result, and monthly capacity.

| | Free ($0/mo) | Starter ($49/mo) | Pro ($149/mo) |
|---|---|---|---|
| Price per result | — | $0.082 | $0.075 |
| Instant (semantic) search | 10 results/mo | 600 results/mo | 2,000 results/mo |
| Lookalike search | — | 600 results/mo | 2,000 results/mo |
| Deep Search (verified) | — | — | 1,000 results/mo ($0.15/result) |

Deep Search costs 2× because each verified result requires deeper research — $0.075 × 2 = **$0.15/result** on Pro.


**Agent behavior:**
- If user is on Free: only offer Instant search, cap at 10 results
- If user is on Starter: offer Instant + Lookalike, budget across 600 results at $0.082/result
- If user is on Pro: all methods available, budget across 2,000 results at $0.075/result (Deep Search at $0.15/result)
- Always show the dollar cost of the run and remaining monthly budget

## Decision Tree

Before running any queries, determine the right approach:

```
Have a seed company from win cases or context file?
  YES → Lookalike Search (pass seed domain)
  NO  ↓

New vertical, need broad exploration?
  YES → Semantic Search (3-5 queries from different angles)
  NO  ↓

Need qualification against specific criteria?
  YES → Deep Search (criteria-scored async research)
  NO  ↓

Need maximum coverage?
  YES → Combine Search + Deep Search (~15% overlap expected)
```

## Before You Start

If the user has a company context file (ICP, win cases, DNC list), ask for the path and read it. Extract:
- **ICP profiles** — for query design and filters
- **Win cases** — for seed companies in lookalike mode
- **DNC list** — domains to exclude from results

## Method 1: Lookalike Search

Use when you have a seed company (from win cases, existing customers, or user input).

**When to use:**
- You have a happy customer and want more like them
- Context file has win cases with domains
- User says "find companies similar to X"

**Tips:**
- Run multiple lookalike searches with different seed companies for broader coverage
- Combine with filters to constrain geography or size
- Deduplicate across runs by domain

## Method 2: Semantic Search — Fast, Broad

**Query strategy:**
- Write 3-5 queries per campaign, each from a different angle on the same ICP
- Describe the product/use case, not the company type
- Deduplicate across queries by domain — overlap is expected
- Target 200-800 companies total across all queries

## Method 3: Deep Search — Deep, Qualified

**Query strategy:**
- Write queries like a job description — 2-3 sentences describing the ideal company
- Use criteria to auto-qualify — each company gets graded 1-5 per criterion
- Default 50 results for first pass; expand after quality review
- Use up to 5 criteria per task; keep criteria focused and non-overlapping
- Run separate tasks for different ICP segments

## Cost Estimation Before Running

**Always calculate the dollar cost and confirm with the user before executing.**

| Operation | Starter ($0.082/result) | Pro ($0.075/result) |
|-----------|------------------------|---------------------|
| 100 instant searches | $8.20 | $7.50 |
| 500 instant searches | $41.00 | $37.50 |
| 100 lookalike results | $8.20 | $7.50 |
| 50 Deep Search results | — | $7.50 |
| 200 Deep Search results | — | $30.00 |

**Before every run, present this to the user:**
> "This will run 3 semantic searches (~200 results × $0.075 = $15.00) + 1 Deep Search (50 results × $0.15 = $7.50). Total: $22.50 of your $149/mo Pro plan. [X] results remaining this month. Proceed?"

**If the run would exceed the plan's monthly budget, warn the user and suggest reducing result count or splitting across months.**

## Result Size Guidance

| Campaign stage | Target list size | Method |
|---------------|-----------------|--------|
| Exploration | 50-100 | Search (2-3 queries) |
| First campaign | 200-500 | Search (5 queries) + Deep Search |
| Scaling | 500-2000 | Deep Search (high result count) + multiple Search |

## Upload to Table

After collecting results, create an Extruct company table and upload domains. Extruct auto-enriches each domain with a Company Profile.

## Re-run After Enrichment

After enrichment adds data points to this list, consider re-running list building using enrichment insights as Deep Search criteria. For example:

- If enrichment reveals that "companies using legacy ERP" are the best fit, create a Deep Search task with that as a criterion
- If enrichment shows a geographic cluster, run a Search with tighter geo filters
- This creates a feedback loop: list → enrich → learn → refine list

## Workflow

1. Read context file for ICP, seed companies, and DNC list
2. Follow the decision tree to pick the right method
3. Draft queries (3-5 for Search, 1-2 for Deep Search)
4. Run queries and collect results
5. Deduplicate across all results by domain
6. Remove DNC domains
7. Upload to an Extruct company table
8. Ask user for preferred output: Extruct table link, CSV to `output/{campaign-slug}-{YYYY-MM-DD}.csv`, or both

## Scripts

This skill includes Python scripts for automated list building:

```bash
# Semantic search
python3 skills/extruct-list-building/scripts/list_builder.py \
  --mode search --query "AI procurement startups" --limit 50

# Lookalike search
python3 skills/extruct-list-building/scripts/list_builder.py \
  --mode lookalike --seed stripe.com --limit 50

# Deep Search with criteria
python3 skills/extruct-list-building/scripts/list_builder.py \
  --mode deep --query "vertical SaaS for freight" --num-results 25

# With filters, upload to table, and custom output
python3 skills/extruct-list-building/scripts/list_builder.py \
  --mode search --query "enterprise sales AI" --limit 200 \
  --filters '{"include":{"country":["United States"]}}' \
  --upload --table-name "US Sales AI" \
  --output output/us-sales-ai.csv

# Dry run (cost estimate only)
python3 skills/extruct-list-building/scripts/list_builder.py \
  --mode deep --query "..." --num-results 50 --dry-run
```

**Flags:**
- `--mode` (required): `search`, `lookalike`, or `deep`
- `--query`: search query (search/deep modes)
- `--seed`: seed domain (lookalike mode)
- `--limit`: max results (default: 50)
- `--num-results`: Deep Search target (default: 25)
- `--filters`: JSON filter string
- `--dnc`: path to DNC domain list
- `--upload`: upload results to an Extruct table
- `--plan`: your plan for cost estimation (`free`, `starter`, `pro`)
- `--dry-run`: show cost estimate, no API calls
- `--yes`: skip confirmation prompt

**API client:** `scripts/extruct_client.py` — thin urllib wrapper for the Extruct REST API. Zero external dependencies.
