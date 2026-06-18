---
name: champion-tracker
description: >
  Track product champions for job changes and qualify their new companies against ICP.
  Takes a CSV of known champions (with LinkedIn URLs), creates a baseline snapshot via
  Apify enrichment, then detects when champions move to new companies. Scores new
  companies on a 0-4 ICP fit scale. Outputs a downloadable CSV of movers with
  qualification verdicts.
tags: [lead-generation]
---

# Champion Tracker

Detect when product champions change jobs and qualify their new companies against ICP.

## When to Use

- You have a list of known product users/champions (from reviews, LinkedIn posts, CRM exports)
- You want to detect when they change companies (high-intent re-sell signal)
- You want each job change scored against ICP before reaching out

## Two Phases

### Phase A: Discover Champions (agent-driven, one-time)

Build the initial champion list from public sources. This is done by the agent, not the script.

1. **Scrape reviews** — Use `review-site-scraper` skill to pull G2/Trustpilot reviews. Extract reviewer names + companies.
2. **Search LinkedIn posts** — Use the `linkedin-post-research` skill (Apify-based) to find people who posted about the product.
3. **Resolve LinkedIn URLs** — Use Fiber `/v1/kitchen-sink/person` (name + company → profile URL) or ContactOut via Orthogonal.
4. **Compile CSV** — Merge all sources into `champions.csv` with required columns.

### Phase B: Track Job Changes (script-driven, repeatable)

Use `champion_tracker.py` for ongoing tracking.

## Script Usage

### Prerequisites

- `APIFY_API_TOKEN` in `.env` (for LinkedIn profile enrichment)
- Champion CSV with columns: `name`, `linkedin_url` (required); `original_company`, `original_title`, `email`, `source`, `notes` (optional)

### Commands

**Initialize baseline** (first run):
```bash
# Dry run — see cost estimate
python3 skills/champion-tracker/scripts/champion_tracker.py init -i champions.csv --dry-run

# Create baseline
python3 skills/champion-tracker/scripts/champion_tracker.py init -i champions.csv
```

**Check for job changes** (subsequent runs):
```bash
# Dry run
python3 skills/champion-tracker/scripts/champion_tracker.py check --dry-run

# Detect changes and output CSV
python3 skills/champion-tracker/scripts/champion_tracker.py check -o changes.csv
```

**View status**:
```bash
python3 skills/champion-tracker/scripts/champion_tracker.py status
```

## Output CSV Columns

| Column | Description |
|--------|-------------|
| champion_name | Full name |
| linkedin_url | LinkedIn profile URL |
| previous_company | Company at baseline |
| previous_title | Title at baseline |
| new_company | Current company (changed) |
| new_title | Current title |
| change_detected_date | Date this check was run |
| position_start_date | When they started the new role |
| days_since_change | Days since new position started |
| icp_score | 0-4 ICP qualification score |
| icp_verdict | Strong Fit / Good Fit / Possible Fit / Weak Fit |
| icp_notes | Scoring breakdown |
| email | Email if available |
| notes | Original notes from champion CSV |

## ICP Scoring (0-4)

| Signal | Points | What it checks |
|--------|--------|----------------|
| B2B signal | 1.0 | Title contains sales/SDR/revenue/growth keywords |
| Outbound motion | 1.0 | Sales leadership title (VP Sales, Head of Growth, etc.) |
| Company size | 1.0 / 0.5 | SMB/mid-market = 1.0; unknown = 0.5 benefit-of-doubt |
| Seniority | 1.0 | VP, Director, Head of, C-level, Founder |

**Verdicts**: Strong Fit (>=3) / Good Fit (>=2) / Possible Fit (>=1.5) / Weak Fit (<1.5)

## Cost

- ~$3 per 1,000 LinkedIn profiles enriched
- 50-80 champions ≈ $0.15-0.25 per run
- `--dry-run` always shows cost before any API calls

## File Structure

```
skills/champion-tracker/
  SKILL.md                    # This file
  scripts/
    champion_tracker.py       # Main CLI script
  input/
    champions_template.csv    # Template for manual additions
  snapshots/                  # Created at runtime
    baseline.json             # Latest full snapshot
    archive/                  # Timestamped copies
  output/                     # Created at runtime
    changes-YYYY-MM-DD.csv    # Generated output
```

## Dependencies

- Reuses `LinkedInEnricher` from `skills/lead-qualification/scripts/enrich_leads.py`
- Falls back to inline implementation if import fails
- Requires: `requests` (Python package), `APIFY_API_TOKEN` (env var)
