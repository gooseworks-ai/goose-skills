---
name: job-signals
description: Extract leads from job boards by detecting hiring intent signals — companies mentioning competitor tools in job requirements, scaling hires, build-vs-buy language, new team creation, and pain language. Searches HN Who's Hiring, RemoteOK, Greenhouse, Lever, LinkedIn Jobs, and Google Jobs. Outputs a single-sheet xlsx of companies with signal scores.
---

# Job Signals

Extract high-intent company leads from job boards by analyzing job descriptions for buying signals. Job posts represent committed budget — if a company is hiring for a role, they've already decided to spend money solving that problem.

## When to Use

- User wants to find companies that are hiring for roles their product supports or replaces
- User wants to identify companies mentioning competitor tools in job requirements
- User mentions job boards, career pages, or hiring signals as lead sources
- User wants to find companies building teams around the problem their product solves
- User describes prospects who are scaling engineering teams, building infrastructure, or looking for specific technologies

## Prerequisites

- Python 3.9+ with `requests`, `openpyxl`, and optionally `python-dotenv`
- Apify API token in `.env` (for LinkedIn Jobs and Google Jobs — optional, free sources work without it)
- Working directory: the `goose-leadgen-toolkit` project root

## Phase 1: Collect Context

### Step 1: Gather Product & Competitor Information

Ask the user for the following. This is critical — signal detection depends entirely on this context.

> "To find companies with hiring intent signals, I need:
> 1. **What does your product do?** (one-liner)
> 2. **Who are your main competitors?** (I'll look for these in job descriptions)
> 3. **What technologies/keywords are in your space?** (e.g., WebRTC, Kubernetes, real-time communication)
> 4. **What problems does your product solve?** (e.g., 'scaling video calls', 'managing infrastructure', 'developer onboarding') — I'll look for these as job responsibilities
> 5. **Any specific companies you'd like to check?** (I can scan their Greenhouse/Lever career pages directly)
> 6. **What job titles would someone searching for your type of tool have?** (for LinkedIn/Google Jobs search)"

If context is already available from prior skills (github-repo-signals, community-signals), use it — don't ask again.

## Phase 2: Configure the Scan

### Step 2: Build Search Configuration

Based on the user's input, build the config. Here's what goes into each field:

**competitors** — Direct competitor product/company names to detect in job descriptions.
Example: `["Twilio", "Agora", "Vonage", "Daily.co"]`

**keywords** — Technologies and terms associated with the user's space. Used for stack_match signal detection.
Example: `["WebRTC", "video API", "real-time communication", "SIP", "VoIP"]`

**problems** — Problem statements to look for in job responsibilities. Phrased as they'd appear in a job description.
Example: `["video conferencing", "real-time communication", "audio/video infrastructure", "streaming platform", "media server"]`

**search_queries** — Queries for LinkedIn Jobs and Google Jobs search. Should be job titles or role descriptions.
Example: `["WebRTC engineer", "video platform engineer", "real-time communications developer", "SRE video infrastructure"]`

**greenhouse_slugs** — Company slugs for Greenhouse career pages. Usually the company name, lowercase, no spaces. Test by checking `https://boards.greenhouse.io/{slug}`.
Example: `["discord", "stripe", "anthropic", "figma"]`

**lever_slugs** — Company slugs for Lever career pages. Test by checking `https://jobs.lever.co/{slug}`.
Example: `["spotify", "netlify", "webflow"]`

### Step 3: Discover Company Career Pages

If the user has identified target companies (from github-repo-signals, community-signals, or manually), help them find the correct Greenhouse/Lever slugs:

1. Search for "{company name} careers greenhouse" or "{company name} careers lever"
2. Common patterns: `boards.greenhouse.io/{company}` or `jobs.lever.co/{company}`
3. Test the URL — the free APIs return 404 for invalid slugs

Also suggest companies to check based on:
- Companies found in the github-repo-signals output (users' employers)
- Companies that appeared in community-signals discussions
- Known competitors' customers

### Step 4: Present Configuration for Review

Show the user the full config:

```
Product: [name]
Competitors to detect: [list]
Keywords/tech: [list]
Problems to detect: [list]
LinkedIn/Google search queries: [list]
Greenhouse companies: [list]
Lever companies: [list]

Sources to scan:
  ✓ HN Who's Hiring (free)
  ✓ RemoteOK (free)
  ✓ Greenhouse (free, [N] companies)
  ✓ Lever (free, [N] companies)
  ✓ LinkedIn Jobs (~$0.10 via Apify)
  ✓ Google Jobs (~$0.05 via Apify)

Estimated cost: $[estimate]
```

Ask for approval before proceeding.

### Step 5: Save Config File

```bash
cat > .tmp/job_signals_config.json << 'CONFIGEOF'
{
    "product": "Product Name",
    "competitors": ["Competitor A", "Competitor B"],
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "problems": ["problem description 1", "problem description 2"],
    "search_queries": ["job title query 1", "job title query 2"],
    "greenhouse_slugs": ["company1", "company2"],
    "lever_slugs": ["company3", "company4"]
}
CONFIGEOF
```

## Phase 3: Execute Scan

### Step 6: Verify Environment

```bash
cd /Users/0xhbam/Desktop/Cursor/goose-leadgen-toolkit
python3 -c "import requests, openpyxl; print('OK')"
```

### Step 7: Run the Tool

```bash
python3 tools/job_signals.py \
    --config .tmp/job_signals_config.json \
    --days 30 \
    --output .tmp/job_signals.xlsx
```

The tool will:
1. Fetch HN "Who's Hiring" monthly threads and extract job posts (free)
2. Fetch all RemoteOK listings (free)
3. Fetch jobs from specified Greenhouse companies (free)
4. Fetch jobs from specified Lever companies (free)
5. Search LinkedIn Jobs via Apify (paid, ~$1/1K jobs)
6. Search Google Jobs via Apify (paid)
7. Analyze every job description for 10 signal types
8. Score, deduplicate, and export to xlsx

**To skip paid sources (test with free sources only):**
```bash
python3 tools/job_signals.py \
    --config .tmp/job_signals_config.json \
    --days 30 \
    --skip linkedin google \
    --output .tmp/job_signals.xlsx
```

**To scan only specific sources:**
```bash
# Only Greenhouse + Lever (free, targeted)
python3 tools/job_signals.py \
    --config .tmp/job_signals_config.json \
    --skip hn remoteok linkedin google \
    --output .tmp/job_signals.xlsx
```

### Step 8: Copy to Review Location

```bash
cp .tmp/job_signals.xlsx /Users/0xhbam/Desktop/Cursor/job_signals.xlsx
```

## Phase 4: Analyze & Recommend

### Step 9: Analyze the Results

Read the output xlsx and present a structured briefing:

**9a. Overall Stats**
- Total jobs with signals found
- Jobs filtered out (no matching signals)
- Unique companies
- High-signal jobs (score >= 15)

**9b. Source Breakdown**
- How many signal-bearing jobs per source
- Which sources produced the highest-quality signals

**9c. Signal Type Distribution**
- How many jobs triggered each signal type
- Which signal types are most common (this tells the user where market demand is concentrated)

**9d. Top Companies**
- Companies with the most signal-bearing job posts
- Companies with the highest average signal scores
- Flag companies that appear across multiple sources (stronger signal)
- Flag companies with "burst hiring" (3+ matching roles = scaling aggressively)

**9e. Highest-Signal Job Posts**
- Top 15-20 by signal score
- For each: company, title, signals matched, relevant snippet
- Highlight any with competitor_mentioned + build_vs_buy (= actively replacing a competitor tool)

**9f. Key Themes**
- What competitors are being mentioned most?
- What problems are companies hiring to solve?
- Any patterns in seniority (lots of senior hires = strategic investment)?

### Step 10: Recommend Next Steps

Based on findings + user's product context:

1. **If companies are mentioning competitors in job descriptions:**
   - These companies are USING the competitor — warm targets for displacement
   - Recommend enriching these companies via SixtyFour `/enrich-company`
   - Then find the hiring manager or VP of Engineering via `/enrich-lead`

2. **If "build vs buy" or "new team" signals are strong:**
   - These companies haven't committed to a tool yet — they're about to build in-house
   - Fastest time-to-close if you reach them before they start building
   - Recommend immediate outreach to the hiring manager

3. **If burst hiring detected (3+ matching roles at one company):**
   - This company is scaling the exact function the user's product serves
   - Recommend enriching the company + finding the VP/Director leading the hiring

4. **If specific Greenhouse/Lever companies showed strong signals:**
   - Recommend checking if these companies were also found in GitHub or community signals
   - Cross-signal validation = highest confidence leads

5. **Always include:**
   - Cost estimate for enriching top companies
   - Suggested outreach angle per signal type
   - Note: the lead is NOT the person in the job post — it's the hiring manager or VP who approved the headcount. Use SixtyFour to find them.

### Step 11: Ask for Go-Ahead

> "Would you like me to:
> 1. Enrich the top [N] companies via SixtyFour (find decision-makers)
> 2. Cross-reference these companies with GitHub/community signals data
> 3. Scan more Greenhouse/Lever pages for additional companies
> 4. Export for manual review first"

## Signal Detection System

The tool analyzes every job description for these 10 signal types:

| # | Signal | Weight | What It Detects |
|---|---|---|---|
| 1 | **Competitor Tool Mentioned** | 9 | Competitor name appears in job description or requirements |
| 2 | **Problem as Responsibility** | 8 | Job describes solving the exact problem the user's product addresses |
| 3 | **Build vs Buy Language** | 9 | "Build our own", "from scratch", "greenfield", "internal platform" |
| 4 | **Tech Stack Match** | 8 | Keywords/technologies from user's space appear in requirements |
| 5 | **New Team Creation** | 8 | "Founding engineer", "first hire", "building a new team", "0 to 1" |
| 6 | **Scaling Hire** | 7 | Title matches SRE, Platform Engineer, DevOps, Infrastructure, etc. |
| 7 | **Senior/Leadership Hire** | 7 | VP, Director, Head of, Staff, Principal — strategic investment |
| 8 | **Pain Language** | 7 | "Struggling with", "replace our", "legacy", "technical debt", "outgrown" |
| 9 | **Budget/Pricing Pain** | 6 | Recently funded company (detected from company data if available) |
| 10 | **Burst Hiring** | 6 | Multiple matching roles at same company (detected in post-processing) |

Jobs that match NO signals are filtered out. The signal_score is the sum of weights of all matched signals.

## Output Schema (Single Sheet)

| Column | Description |
|--------|-------------|
| company_name | The company hiring |
| job_title | The role |
| source | Where we found it (HN, RemoteOK, Greenhouse, Lever, LinkedIn, Google) |
| signal_categories | Which signals matched (comma-separated labels) |
| signal_score | Weighted sum of matched signal weights |
| job_description_snippet | Most relevant excerpt showing the signal |
| location | Job location |
| posted_date | When posted |
| job_url | Link to the original posting |
| company_size | If available (LinkedIn provides this) |
| company_industry | If available |

## Cost Estimates

| Source | Cost | Notes |
|--------|------|-------|
| HN Who's Hiring | Free | Algolia API |
| RemoteOK | Free | Public JSON API |
| Greenhouse | Free | Public Board API (per company) |
| Lever | Free | Public Postings API (per company) |
| LinkedIn Jobs | ~$1/1K jobs | Apify harvestapi actor |
| Google Jobs | ~$0.15-0.50/1K | Apify actor |
| **Typical run** | **$1-3 total** | 4 free sources + LinkedIn/Google |

## Limitations

- **Greenhouse/Lever require known company slugs** — you can't search across all companies. Use other signals to discover companies first, then check their career pages.
- **HN Who's Hiring format varies** — job posts are freeform text. Company/title parsing is best-effort from the first line (typically "Company | Role | Location | ...").
- **RemoteOK is remote-only** — won't capture office-based roles.
- **LinkedIn Jobs caps at ~1,000 results** per search query via the Apify actor.
- **Signal detection is keyword-based** — may miss semantically similar but differently worded signals. The agent should review top results and adjust keywords if needed.
