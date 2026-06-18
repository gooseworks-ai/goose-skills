---
name: linkedin-job-scraper
description: >
  Scrapes LinkedIn job postings using the JobSpy library (python-jobspy). Use this skill
  whenever the user wants to find jobs on LinkedIn, search for open roles, pull job listings,
  build a job pipeline, source job targets for GTM research, or monitor hiring signals.
  Even if the user just says "find me some jobs" or "what roles is [company] hiring for",
  use this skill. It runs a local Python script that outputs a CSV of job postings with
  title, company, location, salary, job type, description, and direct URLs.
tags: [lead-generation]
---

# LinkedIn Scraper

## Overview

This skill finds LinkedIn job postings by running `tools/jobspy_scraper.py`, a thin wrapper
around the [JobSpy](https://github.com/speedyapply/JobSpy) library. It handles installation,
parameter construction, execution, and result interpretation.

## Quick Start

**Install the dependency once (requires Python 3.10+):**
```bash
python3.12 -m pip install -U python-jobspy --break-system-packages
```

**Run the scraper:**
```bash
python3.12 tools/jobspy_scraper.py \
  --search "software engineer" \
  --location "San Francisco, CA" \
  --results 25 \
  --output .tmp/jobs.csv
```

Results are saved as CSV and printed as a summary table.

---

## Workflow

### Step 1 — Understand the request

Identify from the user's message:
- **Search term** — job title, role, or keyword (required)
- **Location** — city, state, or "Remote" (optional but recommended)
- **Results wanted** — default to 25 if not specified
- **Recency** — `hours_old` filter if user wants recent posts (e.g. "last 48 hours")
- **Company filter** — `linkedin_company_ids` if targeting a specific company
- **Full descriptions** — set `--fetch-descriptions` if user needs job description text

If anything is ambiguous (e.g. "find AI jobs"), pick reasonable defaults and tell the user what you used.

### Step 2 — Construct the command

Build the `tools/jobspy_scraper.py` command using the parameters below.
Always save output to `.tmp/` so it's disposable and easy to find.

```bash
python tools/jobspy_scraper.py \
  --search "<term>" \
  --location "<location>" \
  --results <N> \
  [--hours-old <N>] \
  [--fetch-descriptions] \
  [--company-ids <id1,id2>] \
  [--job-type fulltime|parttime|contract|internship] \
  [--remote] \
  --output .tmp/<descriptive_filename>.csv
```

**Note:** `--hours-old` and `--easy-apply` cannot be used together (LinkedIn API constraint).

### Step 3 — Run the script

Execute the command. The script will print a progress message and a summary of results found.

If the script is not found at `tools/jobspy_scraper.py`, check whether the file needs to be created
by reading `skills/linkedin-job-scraper/scripts/jobspy_scraper.py` and copying it to `tools/`.

### Step 4 — Interpret and present results

After the run:
- Report how many jobs were found
- Show a brief table: Title | Company | Location | Salary | Posted
- Note the output file path so the user can open it
- If 0 results: suggest broadening the search term or removing the location filter

---

## Parameters Reference

| Flag | Description | Default |
|------|-------------|---------|
| `--search` | Job title / keywords | required |
| `--location` | City, state, or country | none |
| `--results` | Number of results to fetch | 25 |
| `--hours-old` | Only jobs posted within N hours | none |
| `--fetch-descriptions` | Fetch full job descriptions (slower) | false |
| `--company-ids` | Comma-separated LinkedIn company IDs | none |
| `--job-type` | fulltime, parttime, contract, internship | any |
| `--remote` | Filter for remote jobs only | false |
| `--output` | Path for CSV output | .tmp/jobs.csv |

---

## Output Columns

The CSV output includes:

| Column | Description |
|--------|-------------|
| `TITLE` | Job title |
| `COMPANY` | Employer name |
| `LOCATION` | City / State / Country |
| `IS_REMOTE` | True/False |
| `JOB_TYPE` | fulltime, contract, etc. |
| `DATE_POSTED` | When the listing was posted |
| `MIN_AMOUNT` | Minimum salary |
| `MAX_AMOUNT` | Maximum salary |
| `CURRENCY` | Currency code |
| `JOB_URL` | Direct link to the LinkedIn posting |
| `DESCRIPTION` | Full job description (if --fetch-descriptions used) |
| `JOB_LEVEL` | Seniority level (LinkedIn-specific) |
| `COMPANY_INDUSTRY` | Industry classification |

---

## Common Use Cases

**Find recent engineering roles at a startup:**
```bash
python tools/jobspy_scraper.py --search "growth engineer" --location "New York" \
  --results 50 --hours-old 72 --output .tmp/growth_eng_nyc.csv
```

**Monitor what a specific company is hiring for:**
```bash
# First find the LinkedIn company ID from the company's LinkedIn URL
python tools/jobspy_scraper.py --search "engineer" --company-ids 1234567 \
  --results 100 --fetch-descriptions --output .tmp/company_hiring.csv
```

**Find remote contract roles:**
```bash
python tools/jobspy_scraper.py --search "data analyst" --remote \
  --job-type contract --results 30 --output .tmp/remote_contracts.csv
```

---

## Error Handling

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: jobspy` | Run `pip install -U python-jobspy` |
| 0 results returned | Broaden search term, remove location, increase `--results` |
| Rate limited / blocked | Wait a few minutes; avoid running back-to-back large scrapes |
| `hours_old and easy_apply cannot both be set` | Remove one of those flags |

---

## Script Location

The scraper script lives at `tools/jobspy_scraper.py`.

If it doesn't exist, copy it from `skills/linkedin-scraper/scripts/jobspy_scraper.py` to `tools/`:
```bash
cp skills/linkedin-job-scraper/scripts/jobspy_scraper.py tools/
```
