---
name: competitor-post-engagers
description: >
  Find leads by scraping engagers from a competitor's top LinkedIn posts.
  Given one or more company page URLs, scrapes recent posts, ranks by
  engagement, selects the top N, extracts all reactors and commenters,
  ICP-classifies, and exports CSV. Use when someone wants to "find leads
  engaging with competitor content" or "scrape people who interact with
  [company]'s LinkedIn posts".
tags: [lead-generation]
---

# Competitor Post Engagers

Find ICP-fit leads by scraping engagers from a competitor's top-performing LinkedIn posts. Given one or more company page URLs, this skill finds their highest-engagement recent posts, extracts everyone who reacted or commented, and classifies by ICP fit.

**Core principle:** Scrape all posts in one call per company, then locally rank and select the top N. This minimizes Apify costs while maximizing lead quality.

## Phase 0: Intake

Ask the user these questions:

### Target Companies

1. LinkedIn company page URL(s) to scrape (e.g., `https://www.linkedin.com/company/11x-ai/`)
2. Time window — how many days back to look (default: 30)
3. Top N posts per company to extract engagers from (default: 1)

### ICP Criteria

4. ICP keywords — job title/role terms that indicate a good lead (e.g., "sales", "SDR", "revenue")
5. Exclude keywords — roles to filter out (e.g., "software engineer", "designer")
6. Geographic focus (optional, e.g., "United States")

Save config in the current working directory (or user-specified path):
```bash
competitor-post-engagers-config.json
```

Config JSON structure:
```json
{
  "name": "<run-name>",
  "company_urls": ["https://www.linkedin.com/company/<competitor>/"],
  "days_back": 30,
  "max_posts": 50,
  "max_reactions": 500,
  "max_comments": 200,
  "top_n_posts": 1,
  "icp_keywords": ["sales", "revenue", "growth", "SDR", "BDR", "outbound"],
  "exclude_keywords": ["software engineer", "developer", "designer"],
  "enrich_companies": true,
  "competitor_company_names": ["<competitor-name>"],
  "industry_keywords": ["freight", "logistics", "trucking", "transportation", "3pl", "supply chain", "carrier", "brokerage", "shipping", "warehousing"],
  "output_dir": "output"
}
```

- `enrich_companies` — Enable Apollo company enrichment (default: true). Set to false or use `--skip-company-enrich` to skip.
- `competitor_company_names` — Company names to exclude from enrichment (the competitor itself).
- `industry_keywords` — Industry terms that indicate ICP fit. Matched against Apollo's industry field.

The `output_dir` is relative to the script directory by default. Override it with an absolute path to write output to a specific location.

## Phase 1: Run the Pipeline

```bash
python3 skills/competitor-post-engagers/scripts/competitor_post_engagers.py \
  --config competitor-post-engagers-config.json \
  [--test] [--yes] [--skip-company-enrich] [--top-n 3] [--max-runs 30]
```

**Flags:**
- `--config` (required) — path to config JSON
- `--test` — small limits (20 posts, 50 profiles, 1 top post)
- `--yes` — skip cost confirmation prompts
- `--skip-company-enrich` — skip Apollo company enrichment step (saves credits)
- `--top-n` — override top_n_posts from config
- `--max-runs` — override Apify run limit

### Pipeline Steps

**Step 1: Scrape company posts + engagers** — For each company URL, one Apify call using `harvestapi/linkedin-company-posts` with `scrapeReactions: true, scrapeComments: true`. Returns posts, reactions, and comments in a single dataset.

**Step 2: Rank & select top posts** — Filter posts by time window (`days_back`), rank by total engagement (reactions + comments), select top N per company. Then extract engagers (reactors + commenters) only from those selected posts. Deduplication by name. Score engagers by position:
- `+3` Commenter (higher intent)
- `+2` Position matches ICP keywords
- `-5` Position matches exclude keywords

**Step 3: Company enrichment (Apollo)** — Extract unique company names from engagers, call `apollo.enrich_organization(name=...)` for each. Returns industry, employee count, description, and location. ~1 Apollo credit per unique company. Merge data back to all engagers from that company. Skip with `--skip-company-enrich` or `"enrich_companies": false`.

**Step 4: ICP classify & export** — Classify as Likely ICP / Possible ICP / Unknown / Tech Vendor. Uses both headline keyword matching AND company industry data (from Step 3) — if the engager's company industry matches `industry_keywords`, they're classified as "Likely ICP" regardless of role. Export CSV.

### Cost Estimates

| Parameter | Test | Standard |
|-----------|------|----------|
| Posts scraped per company | 20 | 50 |
| Max reactions | 50 | 500 |
| Max comments | 50 | 200 |
| Est. Apify cost (1 company) | ~$0.10 | ~$0.50-1 |
| Est. Apollo credits (company enrich) | ~10-20 | ~30-80 unique companies |
| Est. Apollo cost | ~$0.05-0.10 | ~$0.15-0.40 |

## Phase 2: Review & Refine

Present results:
- **Post selection** — which posts were chosen and why (engagement counts, preview)
- **Per-company breakdown** — how many leads from each competitor
- **ICP breakdown** — counts by tier
- **Top 15 leads** — name, role, company, engagement type

Common adjustments:
- **Too many irrelevant leads** — tighten `icp_keywords` or add `exclude_keywords`
- **Missing ICP leads** — broaden `icp_keywords`
- **Wrong posts selected** — increase `top_n_posts` or adjust `days_back`
- **Too expensive** — use `--test` mode or lower `max_reactions`/`max_comments`

## Phase 3: Output

CSV exported to `{output_dir}/{name}-engagers-{date}.csv`:

| Column | Description |
|--------|-------------|
| Name | Full name |
| LinkedIn URL | Profile link |
| Role | Parsed from headline |
| Company | Parsed from headline |
| Company Industry | From Apollo enrichment |
| Company Size | Estimated employee count from Apollo |
| Company Description | Short company description from Apollo |
| Company Location | City, State, Country from Apollo |
| Source Page | Which competitor's page |
| Post URL | Link to the specific post |
| Post Preview | First 120 chars of post content |
| Engagement Type | Comment or Reaction |
| Comment Text | Their comment (personalization gold) |
| ICP Tier | Likely ICP / Possible ICP / Unknown / Tech Vendor |
| Pre-Filter Score | Priority score from pre-filter |

## Tools Required

- **Apify API token** — set as `APIFY_API_TOKEN` in `.env`
- **Apollo API key** — set as `APOLLO_API_KEY` in `.env` (for company enrichment)
- **Apify actors used:**
  - `harvestapi/linkedin-company-posts` (post + engager scraping)
- **Apollo endpoints used:**
  - `organizations/enrich` (company industry/size lookup, 1 credit per company)

## Example Usage

**Trigger phrases:**
- "Find leads engaging with [competitor]'s LinkedIn posts"
- "Scrape engagers from [company]'s top posts"
- "Who is interacting with [competitor]'s content?"
- "Run competitor-post-engagers for [company]"

**Test mode:**
```bash
python3 skills/competitor-post-engagers/scripts/competitor_post_engagers.py \
  --config competitor-post-engagers-config.json --test --yes
```

**Full run:**
```bash
python3 skills/competitor-post-engagers/scripts/competitor_post_engagers.py \
  --config competitor-post-engagers-config.json --yes
```
