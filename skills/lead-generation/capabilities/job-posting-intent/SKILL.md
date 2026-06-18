---
name: job-posting-intent
version: 1.1.0
description: >
  Detect buying intent from job postings. When a company posts a job in your problem area,
  they've allocated budget and are actively thinking about the problem. This skill finds those
  companies, qualifies them, extracts personalization context, and outputs everything to a
  Google Sheet. Does NOT do outreach — just delivers qualified leads with reasoning.
tags: [lead-generation, outreach]
---

# Job Posting Intent Detection

Find companies that are hiring for roles related to the problem you solve. A job posting is a **budget signal** — the company has allocated money to solve a problem your product addresses.

Results are automatically exported to a **Google Sheet** with signal strength, decision-maker suggestions, outreach angles, and personalization context.

## Why This Works

When a company posts a job, they've:
- Allocated budget (headcount is expensive)
- Acknowledged the problem exists
- Started actively solving it

If your product helps solve that problem faster, cheaper, or better than a hire alone, the timing is perfect.

## Cost

**Apify Actor:** `harvestapi/linkedin-job-search` (pay-per-event)

| Component | Cost |
|-----------|------|
| Actor start (per run) | $0.001 |
| Per job result | $0.001 |
| Apify platform fee | +20% |

**Typical run costs:**
| Scenario | Titles | Jobs/title | Runs | Est. Cost |
|----------|--------|------------|------|-----------|
| Quick scan | 3 | 25 | 3 | ~$0.09 |
| Standard | 5 | 25 | 5 | ~$0.16 |
| Deep search | 5 | 100 | 5 | ~$0.60 |
| Multi-location | 5×3 | 25 | 15 | ~$0.47 |

Google Sheet creation is free (uses Rube/Composio integration).

Always run `--estimate-only` first to see the Apify cost before executing.

Track usage: https://console.apify.com/billing

## Setup

### 1. Apify API Token

```bash
# Get your token at https://console.apify.com/account/integrations
export APIFY_API_TOKEN="apify_api_YOUR_TOKEN_HERE"
```

### 2. Install dependencies

```bash
pip3 install requests
```

### 3. Rube/Composio (for Google Sheets)

Google Sheet creation uses Rube MCP with Composio. The token is preconfigured.
If it stops working, update the `RUBE_TOKEN` env var or the default in `search_jobs.py`.

## Usage

### Step 1: Define your ICP and target titles

Think about it this way: **"If a company is hiring for [role], it means they're investing in [problem area you solve]."**

Examples:
- GTM agency: "Growth Marketing Manager", "SDR Manager", "RevOps Engineer", "GTM Engineer"
- AI dev tools: "AI Engineer", "ML Ops Engineer", "Prompt Engineer", "LLM Engineer"
- Sales automation: "SDR", "BDR Manager", "Sales Ops", "Revenue Operations"

### Step 2: Estimate cost

```bash
python3 scripts/search_jobs.py \
  --titles "GTM Engineer,SDR Manager,Head of Demand Gen" \
  --locations "United States" \
  --max-per-title 25 \
  --estimate-only
```

### Step 3: Run the search

The script searches LinkedIn Jobs, groups results by company, qualifies leads, and creates a Google Sheet automatically.

```bash
# Standard search (creates Google Sheet)
python3 scripts/search_jobs.py \
  --titles "GTM Engineer,SDR Manager,RevOps Engineer" \
  --locations "United States" \
  --max-per-title 25

# Deep search with custom sheet name
python3 scripts/search_jobs.py \
  --titles "AI Engineer,ML Ops Engineer,Prompt Engineer" \
  --locations "United States" \
  --max-per-title 50 \
  --sheet-name "AI Hiring Signals - Feb 2026"

# Filter results to only relevant titles (LinkedIn search is fuzzy)
python3 scripts/search_jobs.py \
  --titles "GTM Engineer,Growth Marketing Manager,SDR Manager" \
  --locations "United States" \
  --relevance-keywords "gtm,growth,sdr,marketing,demand gen,revops"

# Also save raw JSON alongside the sheet
python3 scripts/search_jobs.py \
  --titles "GTM Engineer,SDR Manager" \
  --locations "United States" \
  --output results.json

# Skip Google Sheet, console + JSON only
python3 scripts/search_jobs.py \
  --titles "GTM Engineer" \
  --no-sheet --json
```

## What the Script Does

1. **Searches** LinkedIn Jobs for each title/location combination via Apify
2. **Groups** results by company (deduplicates)
3. **Computes signal strength** based on number of relevant postings + seniority
4. **Extracts personalization context** from job descriptions (tech stack, growth signals, pain points)
5. **Suggests decision-maker title** (one level above the hired role)
6. **Suggests outreach angle** (accelerate / replace / multiply the hire)
7. **Creates a Google Sheet** with all qualified leads
8. **Prints a console summary** of all companies found

## Options Reference

```
Required:
  --titles              Comma-separated job titles to search

Optional:
  --locations           Comma-separated locations (default: no filter)
  --max-per-title       Max jobs per title per location (default: 25)
  --posted-limit        Recency: 1h, 24h, week, month (default: week)
  --output, -o          Also save raw JSON to this file path
  --json                Print JSON output to console
  --estimate-only       Show cost estimate without running
  --no-sheet            Skip Google Sheet creation
  --sheet-name          Custom Google Sheet title (default: "Job Posting Intent Signals - {date}")
  --relevance-keywords  Comma-separated keywords to filter truly relevant postings
```

## Google Sheet Columns

| Column | Description |
|--------|-------------|
| Signal | HIGH / MEDIUM / LOW based on # postings + seniority |
| Company | Company name |
| Employees | Employee count |
| Industry | Company industry |
| Website | Company website |
| LinkedIn | Company LinkedIn URL |
| # Postings | Number of relevant job postings found |
| Job Titles | The actual job titles posted |
| Job URL | Link to the primary job posting |
| Location | Job location(s) |
| Decision Maker | Suggested title of person to contact |
| Outreach Angle | Accelerate / Replace / Multiply the hire |
| Tech Stack | Technologies mentioned in job descriptions |
| Growth Signals | Growth indicators (first hire, scaling, series stage) |
| Pain Points | Pain indicators (automate, optimize, manual processes) |
| Description | Company description snippet |

## AI Agent Integration

When using this skill as an agent, the typical flow is:

1. User describes their product and the types of roles that signal intent
2. Agent runs `--estimate-only` and confirms cost with user
3. Agent runs the search (Google Sheet is created automatically)
4. Agent shares the Google Sheet link with the user
5. Agent provides a brief summary of top leads and why they're qualified

**Example prompt:**
> "Find companies hiring growth marketers and SDRs in the US this week. These are signals they need GTM help. We sell AI-powered GTM systems to Series A-C B2B SaaS companies with 20-200 employees."

The agent should NOT:
- Do any outreach
- Send any emails or messages
- Contact anyone

The agent SHOULD:
- Present cost estimate before running
- Run the search (sheet is created automatically)
- Share the Google Sheet link
- Provide a brief summary of the top leads with reasoning

## Outreach Angle Templates

The script auto-assigns an angle based on job posting context:

**"Accelerate while you hire"** — Best when: posting is recent, role is junior/mid
> They're looking for someone to do X. Your product can deliver X outcomes while they ramp the hire.

**"Replace the hire"** — Best when: small company, "first hire" signals, building from scratch
> They want the output of a [role] but may not need a full-time person if they use your product.

**"Multiply the hire"** — Best when: company is clearly scaling, multiple related roles
> When their new hire starts, your product makes them 10x more effective from day one.

## Troubleshooting

### "No jobs found"
- Try broader titles (e.g., "marketing" instead of "demand generation specialist")
- Extend the time window: `--posted-limit month`
- Remove location filter to search globally

### "Too many irrelevant results"
- Use `--relevance-keywords` to filter by title keywords
- LinkedIn's search is fuzzy — the grouping and qualification step helps filter

### "Google Sheet creation failed"
- Check that Rube MCP is accessible (the token may have expired)
- Use `--no-sheet --json --output results.json` to save results without a sheet
- You can create the sheet later with `scripts/create_sheet_mcp.py`

### High cost estimate
- Reduce `--max-per-title` (25 is usually enough)
- Search fewer titles
- Use `--posted-limit 24h` for a quick daily scan

## Links

- [Apify LinkedIn Job Search Actor](https://apify.com/harvestapi/linkedin-job-search)
- [Apify API Token](https://console.apify.com/account/integrations)
- [Apify Billing Dashboard](https://console.apify.com/billing)
