---
name: customer-discovery
description: >
  Discover all customers of a given company by scanning websites, case studies, review sites,
  press, social media, job postings, and more. Use when you need competitive intelligence on
  who a company sells to.
---

# Customer Discovery

Find all customers of a company by scanning multiple public data sources. Produces a deduplicated report with confidence scoring.

## Quick Start

```
Find all customers of Datadog
```

```
Who are Notion's customers? Use deep mode.
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| Company name | Yes | — | The company to research |
| Website URL | No | Auto-detected | The company's website URL |
| Depth | No | standard | `quick`, `standard`, or `deep` |

## Procedure

### Step 1: Gather Inputs

Ask the user for:
1. **Company name** (required)
2. **Company website URL** (optional — if not provided, WebSearch for it)
3. **Depth tier** — present these options, default to Standard:
   - **Quick** (~2-3 min): Website logos, case studies, G2 reviews, press search
   - **Standard** (~5-8 min): Quick + blog posts, Wayback Machine, LinkedIn, Twitter, Reddit, HN, job postings, YouTube
   - **Deep** (~10-15 min): Standard + SEC filings, podcasts, GitHub, integration directories, BuiltWith, Crunchbase

### Step 2: Create Output Directory

```bash
mkdir -p customer-discovery-[company-slug]
```

### Step 3: Run Sources for Selected Tier

Collect all results into a running list. For each customer found, record:
- **name**: Company name
- **confidence**: high / medium / low
- **source_type**: e.g., "logo_wall", "case_study", "g2_review", "press", "job_posting"
- **evidence_url**: URL where the evidence was found
- **notes**: Brief description of the evidence

#### Quick Sources

**1. Website logo wall**

Run the scrape_website_logos.py script:
```bash
python3 skills/capabilities/customer-discovery/scripts/scrape_website_logos.py \
  --url "[company-url]" --output json
```

Parse the JSON output and add each result to the customer list.

**2. Case studies page**

Use WebFetch on the company's case studies page (try `/case-studies`, `/customers`, `/resources/case-studies`). Extract customer names from page headings and content.

**3. G2/Capterra reviews**

If the `review-site-scraper` skill is available, use it to find reviewer companies:
```bash
python3 skills/capabilities/review-site-scraper/scripts/scrape_reviews.py \
  --platform g2 --url "[g2-product-url]" --max-reviews 50 --output json
```

First, WebSearch for the company's G2 page: `site:g2.com "[company]"`. Extract reviewer company names from review author info.

**4. Web search for press**

WebSearch these queries and extract customer mentions from results:
- `"[company]" customer OR "case study" OR partnership`
- `"[company]" "we use" OR "switched to" OR "chose"`

#### Standard Sources (in addition to Quick)

**5. Company blog posts**

WebSearch: `site:[company-domain] customer OR "case study" OR partnership OR "customer story"`

**6. Wayback Machine logos**

Run the scrape_wayback_logos.py script:
```bash
python3 skills/capabilities/customer-discovery/scripts/scrape_wayback_logos.py \
  --url "[company-url]" --output json
```

Logos marked `still_present: false` are especially interesting — they indicate former customers.

**7. Founder/exec LinkedIn posts**

WebSearch: `site:linkedin.com "[company]" customer OR "excited to announce" OR "welcome"`

**8. Twitter/X mentions**

WebSearch: `site:twitter.com "[company]" "we use" OR "just switched to" OR "loving"`

**9. Reddit/HN mentions**

WebSearch these queries:
- `site:reddit.com "we use [company]" OR "[company] customer"`
- `site:news.ycombinator.com "[company]" customer OR user`

**10. Job postings**

WebSearch: `"experience with [company]" site:linkedin.com/jobs OR site:greenhouse.io OR site:lever.co`

Companies requiring experience with the product are likely customers.

**11. YouTube testimonials**

WebSearch: `site:youtube.com "[company]" customer OR testimonial OR review`

#### Deep Sources (in addition to Standard)

**12. SEC filings**

WebSearch: `site:sec.gov "[company]"` — Look for mentions in 10-K and 10-Q filings.

**13. Podcast transcripts**

WebSearch: `"[company]" podcast customer OR transcript OR interview`

**14. GitHub usage signals**

WebSearch: `site:github.com "[company-package-name]"` in dependency files, package.json, requirements.txt, etc.

**15. Integration directories**

WebFetch marketplace pages where the company lists integrations:
- Salesforce AppExchange
- Zapier integrations page
- Slack App Directory
- Any marketplace relevant to the company

**16. BuiltWith detection**

```bash
python3 skills/capabilities/customer-discovery/scripts/search_builtwith.py \
  --technology "[company-slug]" --max-results 50 --output json
```

**17. Crunchbase**

WebSearch: `site:crunchbase.com "[company]" customers OR partners`

### Step 4: Deduplicate Results

Merge results by company name using fuzzy matching:
- Normalize: lowercase, strip suffixes (Inc, Corp, LLC, Ltd, Co., GmbH)
- Treat "Acme Inc" = "Acme" = "ACME Corp" = "acme.com" as the same company
- When merging, keep the highest confidence level and all evidence URLs

### Step 5: Assign Confidence

Apply these rules:

**High confidence:**
- Logo on current website (from scrape_website_logos.py with confidence "high")
- Published case study or customer story
- Direct quote or testimonial on the company's site
- Official partnership page listing

**Medium confidence:**
- G2/Capterra review (reviewer's company)
- Press article mentioning customer relationship
- Job posting requiring experience with the product
- YouTube testimonial or video review
- Logo found only in Wayback Machine (was on site, now removed)

**Low confidence:**
- Single social media mention (tweet, Reddit post)
- Indirect reference ("heard good things about X")
- BuiltWith detection only (technology on site doesn't mean they're a paying customer)
- HN discussion mention

### Step 6: Generate Report

Create two output files:

**`customer-discovery-[company]/report.md`:**

```markdown
# Customer Discovery: [Company Name]

**Date:** YYYY-MM-DD
**Depth:** quick | standard | deep
**Total customers found:** N

## High Confidence (N)

| Customer | Source | Evidence |
|----------|--------|----------|
| Shopify | Case study | [link] |
| ... | ... | ... |

## Medium Confidence (N)

| Customer | Source | Evidence |
|----------|--------|----------|
| ... | ... | ... |

## Low Confidence (N)

| Customer | Source | Evidence |
|----------|--------|----------|
| ... | ... | ... |

## Sources Scanned

- Website logo wall: [url] — N customers found
- G2 reviews: N reviews analyzed — N companies identified
- Wayback Machine: N snapshots checked — N logos found (N removed)
- Web search: N queries — N mentions
- ...

## Methodology

This report was generated using the customer-discovery skill, which scans
public data sources to identify companies that use [Company Name]. Confidence
levels reflect the strength and directness of the evidence found.
```

**`customer-discovery-[company]/customers.csv`:**

CSV with columns: `company_name,confidence,source_type,evidence_url,notes`

Write the CSV using a code block or Python script.

## Scripts Reference

| Script | Purpose | Key flags |
|--------|---------|-----------|
| `scrape_website_logos.py` | Extract logos from current website | `--url`, `--output json\|summary` |
| `scrape_wayback_logos.py` | Find historical logos via Wayback Machine | `--url`, `--paths`, `--output json\|summary` |
| `search_builtwith.py` | BuiltWith technology detection (deep mode) | `--technology`, `--max-results`, `--output json\|summary` |

All scripts require `requests`: `pip3 install requests`

External skill scripts (use if available):
- `skills/capabilities/review-site-scraper/scripts/scrape_reviews.py` — G2/Capterra/Trustpilot reviews (requires Apify token)
- `skills/capabilities/linkedin-post-research/scripts/search_posts.py` — LinkedIn post search (requires Crustdata API key)

## Cost

- **Quick / Standard:** Free (uses WebSearch + free APIs like Wayback Machine CDX)
- **Deep:** Mostly free. BuiltWith paid API is optional (`--api-key` flag); free scraping is used by default.
- External skills (review-site-scraper, linkedin-post-research) may require paid API tokens.
