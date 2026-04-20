---
name: orthogonal-yc-batch-evaluator
description: Evaluate YC batch companies for investment — scrapes the YC directory, researches each company and its founders (work history, LinkedIn, website), assesses founder-company fit, and exports to Google Sheets with priority rankings. Use when asked to evaluate YC companies, research a YC batch, screen startups, or do due diligence on YC companies.
source: orthogonal
---


# YC Batch Evaluator

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Scrape a YC batch, research every company and founder, assess founder-company fit, and export a live-updating Google Sheet with priority rankings. Designed for investors evaluating YC companies.

## IMPORTANT: Do NOT ask clarifying questions. Just start immediately.

All inputs are optional. If the user said a batch, use it. If they didn't specify sectors or thesis, process ALL companies. **Always create a new Google Sheet** — never ask for an existing spreadsheet ID. **Start scraping immediately — do not ask "which batch?", "any sector filters?", or "should I create a sheet?".** This is designed for live demos where speed and visual impact matter.

"Spring 2026" is a real YC batch (also called "X26"). It exists and has ~22 companies.

## Input

- **batch** (optional) — defaults to "Spring 2026". Examples: "Winter 2026", "Summer 2025"
- **sectors** (optional) — filter to specific sectors (e.g. "AI", "fintech", "infrastructure"). If not provided, process ALL companies.
- **thesis** (optional) — investor's focus areas for tailored scoring and ranking. If not provided, rank on general investment quality.

## Step 1: Scrape the YC Batch Directory

The YC companies page is JavaScript-rendered (Algolia-powered). Scrapegraph handles the JS rendering.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://www.ycombinator.com/companies?batch={batch_url_encoded}",
  "user_prompt": "Extract every company listed: company name, one-line description, sector/tags, location, and URL slug for each company page (e.g. /companies/orthogonal). Return as a structured list."
}'
```

Batch URL encoding: "Spring 2026" → `Spring%202026`, "Winter 2026" → `Winter%202026`.

If the investor specified sectors, filter the list. Otherwise process all companies.

**Expected response structure:**
```json
{
  "result": {
    "companies": [
      {
        "name": "Indexable",
        "description": "sandbox infrastructure for AI agents",
        "tags": ["B2B", "Infrastructure"],
        "location": "San Francisco, CA, USA",
        "url_slug": "/companies/indexable"
      }
    ]
  }
}
```

Note: The batch page returns `tags` (e.g. "B2B", "Infrastructure"), NOT detailed sectors. Individual YC pages (Step 3a) return richer `sectors` (e.g. "Artificial Intelligence", "Manufacturing"). Always prefer individual page data when available.

## Step 2: Create Google Sheet and Share Link Immediately

Before any research, create the sheet and populate it with company names + descriptions from the batch scrape. Share the link so the investor can watch results fill in live.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"google-sheets","path":"/create-spreadsheet","body":{"title":"YC {batch} Batch Evaluation"}}'
```

**Column layout (A through N):**

| Col | Header | Source |
|-----|--------|--------|
| A | Company | Batch scrape |
| B | Description | Batch scrape |
| C | Sector | Individual YC page (`sectors`) — overwrite batch `tags` |
| D | Location | Individual YC page → Apollo fallback |
| E | Website | Individual YC page (`website_url`) |
| F | Founders | Individual YC page (names + titles) |
| G | Founder LinkedIn(s) | Individual YC page (`linkedin_url`) |
| H | Founder Twitter/X | Individual YC page (`twitter_url`) |
| I | Founder Background | Apollo employment history + YC page bios |
| J | Founder-Company Fit | Your assessment |
| K | Website Analysis | Company website scrape |
| L | Market/Competitors | Perplexity |
| M | Overall Assessment | Your assessment |
| N | Priority Rank | Your ranking |

Write header row + all company rows (research columns blank):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"google-sheets","path":"/update-values"}'
  "spreadsheet_id": "{spreadsheet_id}",
  "sheet_name": "Sheet1",
  "first_cell_location": "A1",
  "valueInputOption": "USER_ENTERED",
  "values": [
    ["Company", "Description", "Sector", "Location", "Website", "Founders", "Founder LinkedIn(s)", "Founder Twitter/X", "Founder Background", "Founder-Company Fit", "Website Analysis", "Market/Competitors", "Overall Assessment", "Priority Rank"],
    ["{company_name}", "{description}", "{tags}", "{location}", "", "", "", "", "", "", "", "", "", ""]
  ]
}'
```

Populate Sector (C) and Location (D) from the batch scrape initially — they'll be overwritten with richer data from the individual YC pages.

**Share the sheet link with the user immediately** so they can watch it fill in.

## Step 3: Research Each Company — Row by Row

### Parallelization Strategy

**The demo effect matters.** Rows filling in one-by-one on the spreadsheet is the visual payoff. Optimize for a steady stream of rows appearing — not for dumping everything at once.

Process companies in **batches of 3-5 at a time**. Within each batch, all companies' research runs in parallel. But **update each row individually** the moment that company's research completes — do NOT wait for the whole batch to finish before writing.

For each batch of companies (run all in parallel):
1. **Scrape all YC company pages** in the batch simultaneously (Step 3a)
2. As each YC page returns, **immediately launch its downstream calls in parallel**:
   - Scrape the company's website (Step 3b)
   - Apollo lookup for each founder (Step 3c) — multiple calls if multiple founders, all in parallel
   - Perplexity market analysis (Step 3d)
3. As each company's full research set completes, **compile and update its row** (Step 4) **immediately** — one `update-values` call per row, don't batch them
4. Move to the next batch

**Key: each row gets its own sheet update call.** This creates the live-fill effect where the investor watches rows appear every 3-5 seconds. Never batch multiple rows into a single sheet write — that kills the visual cadence.

With batches of 5, a 22-company batch completes in ~2-3 minutes with rows streaming in throughout.

### 3a. Scrape the YC company page (~$0.03 each)

YC company pages are server-rendered and contain rich data: founders with LinkedIn, Twitter/X, bios, team size, sectors, website.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://www.ycombinator.com/companies/{company_slug}",
  "user_prompt": "Extract: full company description, all founders (full name, title, LinkedIn URL, Twitter/X URL, bio), company website URL, team size, location, sectors, founding year."
}'
```

**Expected response structure:**
```json
{
  "result": {
    "founders": [
      {
        "full_name": "William Alexander",
        "title": "Founder",
        "linkedin_url": "https://www.linkedin.com/in/william--alexander/",
        "twitter_url": null,
        "bio": "Manufacturing nerd from Iowa. Stanford Econ + CS."
      },
      {
        "full_name": "Tom Blomfield",
        "title": "Primary Partner",
        "linkedin_url": null,
        "twitter_url": null,
        "bio": null
      }
    ],
    "website_url": "https://arzana.ai",
    "location": "San Francisco, CA, US",
    "sectors": ["Artificial Intelligence", "Manufacturing"],
    "team_size": 4,
    "founding_year": 2025
  }
}
```

**Critical parsing rules:**

1. **Filter out YC partners**: Entries with title "Primary Partner" or "Group Partner" are YC staff (e.g. Tom Blomfield, Harj Taggar), NOT founders. Exclude them.

2. **Website field name varies**: Check `website_url`, `company_website_url`, and `company_website` — Scrapegraph returns different field names depending on the page.

3. **Sectors field name varies**: Check `sectors`, `sector_tags`, and `tags`. Prefer the individual page's `sectors` over the batch page's `tags` — individual pages return specific sectors like "Artificial Intelligence" vs generic tags like "B2B".

4. **LinkedIn URL may be null**: Some founders don't have LinkedIn listed on YC. Use Apollo fallback (Step 3c) with name + company search.

5. **Twitter/X URL may be null**: Only populate if present, don't invent URLs.

### 3b. Scrape the company's own website (~$0.03 each)

**Always run this step.** Company websites have product details, pricing, customer logos, testimonials, and hiring signals that no other source provides.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://{company_website}",
  "user_prompt": "Extract: what the product does, target customer, pricing model, key features, traction signals (customer logos, metrics, testimonials), hiring signals. Be specific about what you find."
}'
```

**Expected response — varies by company, but typically includes:**
```json
{
  "result": {
    "product_description": "...",
    "target_customer": "..." or ["...", "..."],
    "pricing": "Not disclosed" or {"model": "...", "price": "..."},
    "key_features": ["...", "..."],
    "traction_signals": {
      "customer_logos": ["Heineken", "Toyota", "..."],
      "metrics": ["99.7% accuracy", "25K patients/day"],
      "testimonials": [{"author": "...", "quote": "..."}]
    },
    "hiring_signals": ["Careers page present"]
  }
}
```

Note: The response structure varies significantly between companies. The `traction_signals` field is sometimes called `traction`. Customer logos may be actual names or just "logos displayed but not identified". Pricing may be a string, object, or array. Parse flexibly.

If the scrape fails (404, timeout, empty), put "Website not available or pre-launch" in the Website Analysis column — never leave it blank.

### 3c. Apollo — founder work history (~$0.01 per founder)

Use the LinkedIn URL from the YC page to get full employment history. Run one call per founder.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/apollo/people/match \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "linkedin_url": "{founder_linkedin_url}",
  "reveal_personal_emails": true
}'
```

**Key fields in the Apollo response:**
```json
{
  "person": {
    "name": "William Alexander",
    "headline": "Co-Founder & CEO, Arzana | Stanford Economics + CS",
    "city": "San Francisco",
    "state": "California",
    "employment_history": [
      {
        "organization_name": "Arzana",
        "title": "Co-Founder",
        "start_date": "2025-06-01",
        "end_date": null,
        "current": true
      },
      {
        "organization_name": "Previous Company",
        "title": "Engineer",
        "start_date": "2022-01-01",
        "end_date": "2025-05-01",
        "current": false
      }
    ]
  }
}
```

**What to extract:**
- `person.employment_history[]` — the key input for Founder Background and Founder-Company Fit. Look at `organization_name`, `title`, and dates.
- `person.city` + `person.state` — use as **location fallback** if the YC page didn't have a location.
- `person.headline` — often has a concise summary of their background.

**No LinkedIn URL on YC page?** Fallback — match by name + company:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/apollo/people/match \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "first_name": "{first_name}",
  "last_name": "{last_name}",
  "organization_name": "{company_name}",
  "reveal_personal_emails": true
}'
```

Note: Use `people/match` with `first_name`, `last_name`, and `organization_name` as the fallback. This usually returns their employment history even without a LinkedIn URL.

### 3d. Perplexity — market context (~$0.005 each)

Include rich context in the prompt — company description and founder bios. Generic prompts like "tell me about {company}" return generic results.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/chat/completions"}'
  "model": "sonar",
  "messages": [{"role": "user", "content": "{company_name} ({website}) is a YC {batch} startup: {description}. Founders: {founder_names_and_bios}. Answer concisely:
1. Market size and opportunity?
2. Top 3 competitors?
3. What makes the founders uniquely qualified?
4. Any traction, press, or notable mentions?
5. Red flags or concerns?"}]
}'
```

**Response parsing:** The answer is in `choices[0].message.content` as a text string. Extract the key points for the Market/Competitors column.

## Step 4: Compile and Update Each Row

As each company's research completes, immediately update its row. **The values array MUST have exactly 12 elements in this exact order:**

```
values: [[
  C: sectors,           // e.g. "AI, Manufacturing" (from YC page)
  D: location,          // e.g. "San Francisco, CA" (from YC page, short)
  E: website,           // e.g. "https://arzana.ai" (plain URL)
  F: founders,          // e.g. "William Alexander (CEO)
Marshall Kools (COO)"
  G: linkedin_urls,     // e.g. "https://linkedin.com/in/william--alexander/
https://linkedin.com/in/marshallkools/"
  H: twitter_urls,      // e.g. "https://x.com/alexisaftalion" or ""
  I: background,        // Founder work history from Apollo
  J: fit_rating,        // "Strong — ..." or "Moderate — ..." or "Weak — ..."
  K: website_analysis,  // Summary of company website scrape
  L: market,            // Market size + competitors from Perplexity
  M: overall,           // "High Priority — ..." or "Interesting — ..." or "Pass — ..."
  N: ""                 // Priority Rank — leave blank, filled in Step 5
]]
```

**CRITICAL: Exactly 12 values starting at column C. Do NOT include extra fields like company description, founding year, or team size — those go in the wrong columns and misalign the entire row.**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"google-sheets","path":"/update-values"}'
  "spreadsheet_id": "{spreadsheet_id}",
  "sheet_name": "Sheet1",
  "first_cell_location": "C{row_number}",
  "valueInputOption": "USER_ENTERED",
  "values": [["{sectors}", "{location}", "{website}", "{founders}", "{linkedins}", "{twitters}", "{background}", "{fit}", "{website_analysis}", "{market}", "{overall}", ""]]
}'
```

This updates columns C through N for a single row. One call per company — this creates the live-fill demo effect.

### Formatting rules

**Links — plain URLs, not HYPERLINK formulas**

Google Sheets cannot have multiple `=HYPERLINK()` formulas in one cell — extras evaluate to FALSE. Instead:
- **Website (E)**: Plain URL (e.g. `https://arzana.ai`). Sheets auto-linkifies it.
- **Founder LinkedIn (G)**: One plain URL per line. If multiple founders, separate with newlines (`
`).
- **Founder Twitter/X (H)**: Same — one plain URL per line.

**Founders (F)**: List as "Name (Title), Name (Title)". Example: "William Alexander (CEO), Marshall Kools (COO)"

**Founder Background (I)**: One line per founder with key career highlights from Apollo employment history. Example:
> "William Alexander: Stanford Econ+CS, previously founded Athluence and Lost in the Sauce Pizza. Marshall Kools: Stanford MS Engineering, D1 wrestler, previously at [company]."

**Location (D)**: Use YC page location. If blank, use Apollo `person.city`, `person.state` from the first founder.

**Sectors (C)**: Use individual YC page `sectors` (e.g. "Artificial Intelligence, Manufacturing"). If unavailable, fall back to batch `tags`.

### Founder-Company Fit (J) — Strong / Moderate / Weak

Assess whether the founders' backgrounds make them uniquely suited to build THIS specific company. YC selects well, so most fits will be decent — but be specific about what makes it strong or where there are gaps.

**Strong** — Direct domain expertise or deep work history in the problem they're solving.
> "Strong — CEO spent 5 years at Stripe building payment APIs, now building payment infrastructure. Deep domain match."
> "Strong — manufacturing nerd from Iowa, Stanford Econ+CS, building AI for manufacturing. Direct domain background."

**Moderate** — Strong technical background but limited domain experience, or relevant adjacent experience.
> "Moderate — both founders are strong engineers (Google, Amazon) but no direct healthcare experience for a healthcare product."
> "Moderate — strong ML background from MIT/Caltech, but building for educators which is a different domain."

**Weak** — No relevant background for the space, or very thin visible track record.
> "Weak — general engineering background with no visible agent infrastructure or protocol experience for an agent communication platform."
> "Weak — first-time founders, Apollo shows minimal work history, no clear domain expertise for the space."

### Website Analysis (K)

Summarize what you found from the company website scrape. Be specific and include:
- What the product actually does (may be more detailed than YC one-liner)
- Target customer
- Pricing if disclosed
- Traction signals: customer logos by name, metrics, testimonials
- Hiring signals
- How mature the site/product looks

Examples from real scrapes:
> "Strong product site. AI for manufacturing office — quoting, estimating, purchasing, CRM. $2.5-7K/mo pricing. 9 customer logos (Tier1, Tecton, Koike, Zeiss, Schneider). TTQ reduced 5 days to 1 day. Testimonial from VP Sales. Hiring."
> "AI voice agents focused on MENA/Arabic dialects. Batch calling, knowledge base, call transfer. 100+ users. 8 testimonials. Hiring via Zoho Recruit."
> "Developer email service — email to webhook as JSON. Free for unlimited domains. Minimal traction signals — very early stage."

### Market/Competitors (L)

Extract from Perplexity response: market size, top competitors, any press/traction mentions. Keep it to 2-3 sentences.

### Overall Assessment (M) — High Priority / Interesting / Pass

Consider: founder-company fit, market size, competitive landscape, team completeness, product/website maturity, traction signals.

If the investor provided a thesis, weight the assessment heavily toward their focus areas.

> "High Priority — strong founder-market fit, clear product with paying customers, large TAM in manufacturing automation."
> "Interesting — impressive tech (26ms forks) but very early, single founder, no customers yet."
> "Pass — minimal traction, thin founder backgrounds for the space, crowded market."

### Priority Rank (N)

Assigned in Step 5 after all companies are researched.

## Step 5: Rank, Re-sort, and Summary

**This step is NOT optional. You MUST sort the sheet after all research is complete.** The investor expects the best companies at the top.

After ALL companies are researched and their rows updated:

1. **Assign ranks 1 to N** based on overall quality:
   - **With thesis**: Rank by thesis alignment (stage, sector, geography fit).
   - **Without thesis**: Rank on general investment quality = founder-company fit × market size × traction signals × team strength.

2. **Write ranks to column N** for all companies.

3. **Re-sort the entire sheet by Priority Rank.** This is critical — the sheet must end with rank #1 at the top.

```bash
# Step 5a: Read all current data
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"google-sheets","path":"/get-values"}'
  "spreadsheet_id": "{spreadsheet_id}",
  "ranges": ["Sheet1!A2:N{last_row}"]
}'
```

```bash
# Step 5b: Sort the rows by column N (Priority Rank) ascending, then rewrite ALL rows
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"google-sheets","path":"/update-values"}'
  "spreadsheet_id": "{spreadsheet_id}",
  "sheet_name": "Sheet1",
  "first_cell_location": "A2",
  "valueInputOption": "USER_ENTERED",
  "values": [{rows_sorted_by_column_N_ascending}]
}'
```

**Do not skip the sort.** Writing rank numbers without reordering the rows defeats the purpose. The investor opens the sheet and should see the top-ranked companies first.

4. **Output a summary** to the user:

```
Evaluated {N} companies from YC {batch}.
Sheet: {sheet_url}

Top Priority:
1. {Company} — {one-line why}
2. {Company} — {one-line why}
3. {Company} — {one-line why}

Worth a Look:
- {Company} — {one-line why}
- {Company} — {one-line why}

Skip:
- {Company} — {one-line why}
```

## Cost Estimate

For a batch of ~22 companies with ~40 founders:

| API | Calls | Cost |
|-----|-------|------|
| Scrapegraph (batch page) | 1 | ~$0.03 |
| Scrapegraph (YC pages) | 22 | ~$0.66 |
| Scrapegraph (company websites) | 22 | ~$0.66 |
| Apollo (founder lookups) | ~40 | ~$0.40 |
| Perplexity (market analysis) | 22 | ~$0.11 |
| Google Sheets | ~25 | free |
| **Total** | | **~$1.86** |

## Tips

- **Parallel, then row-by-row updates**: Research ALL companies in parallel phases, but UPDATE the sheet one row at a time as each company's data arrives. The live-fill effect is the point.
- **Never leave Website Analysis blank**: Either summarize what you found or note "Website not available / pre-launch".
- **Filter out YC partners**: Tom Blomfield, Harj Taggar, etc. appear with title "Primary Partner" or "Group Partner" on company pages. They are YC staff, not founders — exclude them.
- **Check multiple field names**: Scrapegraph returns varying field names. Always check `website_url` / `company_website_url` / `company_website` for websites; `sectors` / `sector_tags` / `tags` for sectors.
- **Apollo for missing data**: Use `person.city`/`person.state` as location fallback. Use `people/match` with `first_name`/`last_name`/`organization_name` as fallback when no LinkedIn URL on YC page. The `mixed_people/search` endpoint is NOT available.
- **Plain URLs, not HYPERLINK formulas**: Multiple `=HYPERLINK()` in one cell → FALSE. Plain URLs auto-linkify in Sheets.
- **Rich Perplexity prompts**: Include company description and founder bios. "Tell me about {company_name}" gets generic results. Specific context gets useful answers.
- **Be honest and specific**: Reference actual founder backgrounds, not generic assessments. If the market is tiny, say so. Investors value honesty over hype.
- **Skip gracefully**: If a company website 404s or Apollo returns nothing, still fill what you have. Partial data > empty row.
