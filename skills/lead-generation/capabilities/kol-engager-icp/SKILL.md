---
name: kol-engager-icp
description: >
  Find ICP-fit leads from KOL audiences on LinkedIn. Given a list of KOLs,
  scrapes their most relevant high-engagement post from the last 30 days,
  extracts engagers (reactors + commenters), pre-filters by position,
  enriches top profiles, and ICP-classifies. Cost-controlled: 1 post per KOL.
  Use when someone wants to "find leads from KOL audiences" or "scrape
  engagers from influencer posts" or after running kol-discovery.
tags: [lead-generation]
---

# KOL Engager ICP

Find ICP-fit leads by scraping engagers from KOL posts on LinkedIn. This is the second half of the KOL pipeline — given KOLs (from kol-discovery or manually), it finds their best post, scrapes who engaged, and filters for your ICP.

**Core principle:** 1 post per KOL. Pick the most relevant, highest-engagement post from the last 30 days. This controls costs while maximizing lead quality.

## Phase 0: Intake

Ask the user these questions:

### ICP Criteria

1. What does your product/service do?
2. Topic keywords for post relevance filtering (3-5 terms the KOL posts should be about)
3. Target industries/verticals
4. Target job titles/roles (e.g., "VP Operations", "Head of Logistics")
5. Titles to EXCLUDE (e.g., "Software Engineer", "Data Scientist")
6. Competitors to filter out
7. Geographic focus (e.g., "United States")

### KOL Input

8. KOL list — LinkedIn profile URLs (from kol-discovery output or manual list)

Save config:
```bash
skills/kol-engager-icp/configs/{client-name}.json
```

Config JSON structure:
```json
{
  "client_name": "example",
  "topic_keywords": ["freight automation", "dispatch operations"],
  "topic_patterns": ["freight.*automat", "dispatch.*oper"],
  "icp_keywords": ["freight", "logistics", "3pl"],
  "target_titles": ["vp operations", "head of logistics", "coo"],
  "exclude_titles": ["software engineer", "data scientist"],
  "tech_vendor_keywords": ["competitor-name", "saas founder"],
  "country_filter": "United States",
  "kol_urls": ["https://www.linkedin.com/in/kol-1/"],
  "days_back": 30,
  "max_posts_per_kol": 20,
  "max_kols": 10,
  "max_enrichment_profiles": 200,
  "mode": "standard"
}
```

## Phase 1: Run the Pipeline

```bash
python3 skills/kol-engager-icp/scripts/kol_engager_icp.py \
  --config skills/kol-engager-icp/configs/{client-name}.json \
  [--test] [--probe] [--yes] [--kols "url1,url2"]
```

**Flags:**
- `--config` (required) — path to client config JSON
- `--test` — limit to 3 KOLs, 50 enrichment profiles
- `--probe` — test engager scraping with one post URL and exit
- `--yes` — skip cost confirmation prompts
- `--kols` — override KOL URLs from config (comma-separated)
- `--max-runs` — override Apify run limit

### Pipeline Steps

**Step 1: Scrape KOL posts** — For each KOL, fetch recent posts (last 30 days, max 20 posts to scan) using `harvestapi/linkedin-profile-posts`.

**Step 2: Select best post per KOL** — Filter posts by `topic_keywords`/`topic_patterns` relevance, then pick the ONE with highest engagement (reactions + comments). Result: 1 post URL per KOL.

**Step 3: Scrape engagers** — Use `harvestapi/linkedin-company-posts` with `scrapeReactions: true, scrapeComments: true` to get reactors and commenters from each selected post.

**Step 4: Pre-filter before enrichment** — Score engagers by position:
- `+3` Commenter (higher intent)
- `+2` Position matches ICP keywords
- `+2` Position matches target titles
- `-5` Position matches exclude titles or vendor keywords
- `+1` Engaged on multiple posts
- Keep only score > 0, cap at `max_enrichment_profiles`

**Step 5: Enrich** — `harvestapi/linkedin-profile-scraper` in batches of 25. Apply country filter after.

**Step 6: ICP classify & export** — Classify as Likely ICP / Possible ICP / Unknown / Tech Vendor. Export CSV.

### Hard Caps

| Parameter | Test | Standard | Full |
|-----------|------|----------|------|
| KOLs processed | 3 | 10 | 20 |
| Posts selected per KOL | 1 | 1 | 1 |
| Max reactions scraped | all | all | all |
| **Max profiles enriched** | **50** | **200** | **500** |
| Est. total cost | ~$0.50 | ~$1.50-2 | ~$5-8 |

### Probe Mode

Run `--probe` first to verify engager scraping works:

```bash
python3 skills/kol-engager-icp/scripts/kol_engager_icp.py \
  --config skills/kol-engager-icp/configs/{client-name}.json --probe
```

This scrapes posts from the first KOL, selects the best post, scrapes engagers from it, and prints a sample. No enrichment, no CSV.

## Phase 2: Review & Refine

Present results:
- **Per-KOL breakdown** — which KOL's post generated the most leads
- **Pre-filter stats** — how many engagers passed the position filter
- **ICP breakdown** — counts by tier
- **Top 15 leads** — name, role, company, KOL source, engagement type

Common adjustments:
- **Too many tech vendors** — add terms to `tech_vendor_keywords`
- **Missing ICP leads** — broaden `icp_keywords` or `target_titles`
- **Low engagement posts selected** — adjust `topic_keywords` to be less restrictive
- **Too expensive** — lower `max_enrichment_profiles` or switch to test mode

## Phase 3: Output

CSV exported to `skills/kol-engager-icp/output/{client-name}-kol-engagers-{date}.csv`:

| Column | Description |
|--------|-------------|
| Name | Full name |
| LinkedIn Profile URL | Profile link |
| Role | Parsed from headline |
| Company Name | Parsed from headline |
| Location | From enrichment |
| KOL Source | Which KOL's post they engaged with |
| Post URL | Link to the specific post |
| Engagement Type | Comment or Reaction |
| Comment Text | Their comment (personalization gold) |
| ICP Tier | Likely ICP / Possible ICP / Unknown / Tech Vendor |
| Pre-Filter Score | Priority score from Step 4 |

## Tools Required

- **Apify API token** — set as `APIFY_API_TOKEN` in `.env`
- **Apify actors used:**
  - `harvestapi/linkedin-profile-posts` (KOL post scraping)
  - `harvestapi/linkedin-company-posts` (engager scraping from posts)
  - `harvestapi/linkedin-profile-scraper` (profile enrichment)

## Example Usage

**Trigger phrases:**
- "Find leads from KOL audiences in [industry]"
- "Scrape engagers from these KOL posts"
- "Run kol-engager-icp for [client]"
- "Who is engaging with [KOL name]'s content?"

**After kol-discovery:**
```bash
# Use KOL URLs from discovery output
python3 skills/kol-engager-icp/scripts/kol_engager_icp.py \
  --config skills/kol-engager-icp/configs/example.json \
  --kols "https://linkedin.com/in/kol1,https://linkedin.com/in/kol2"
```

**Test mode:**
```bash
python3 skills/kol-engager-icp/scripts/kol_engager_icp.py \
  --config skills/kol-engager-icp/configs/example.json --test
```
