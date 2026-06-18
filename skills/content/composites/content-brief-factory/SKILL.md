---
name: content-brief-factory
description: >
  Generate detailed, differentiated content briefs at scale. Each brief includes
  SERP analysis, competing page breakdown, unique angles from real customer language
  (reviews, Reddit), internal linking plan, and SERP feature targets. Batch mode
  produces 10-50 briefs in one run. Crushes generic "keyword density" briefs from
  tools like Surfer or Clearscope.
tags: [content]
---

# Content Brief Factory

Most content briefs are garbage. They tell you "mention these keywords 7 times" and call it a strategy. This skill produces briefs that include competitive analysis, unique angles mined from what real customers say, SERP feature targeting, and a differentiated outline — so your writer knows exactly what to create and why it'll rank.

**Core principle:** A great brief doesn't just say "write about X." It says "here's what's already ranking, here's why it's winning, here's the gap they missed, here's the customer language that proves the gap matters, and here's exactly how to structure a page that beats them."

**Batch mode:** Process 10-50 keywords in a single run. Each brief takes ~30 seconds in enhanced mode, ~60 seconds in baseline.

## When to Use

- "Create content briefs for these keywords"
- "I need briefs for our Q2 content calendar"
- "Write briefs for our pSEO templates"
- "Generate 20 briefs from this keyword list"
- "What should we write about [topic]? Give me a full brief."

## Tool Enhancement (Optional)

Briefs are significantly better with real SERP data (what's actually ranking, what SERP features appear) rather than inferred analysis.

### Agent Prompt to User

> "I can create strong content briefs using competitive research and customer language mining. For the best results — especially accurate SERP analysis and keyword metrics — I'd recommend connecting a SERP data API."
>
> **Recommended: SerpAPI** (100 free searches/month, $50/month for 5,000)
> - Sign up at serpapi.com → get API key
> - Set `SERPAPI_KEY` env var
>
> **Alternatives that also work:**
> - **Serper.dev** (2,500 free searches, then $50/month for 50K) → set `SERPER_API_KEY`
> - **DataForSEO SERP** (pay-per-use, ~$0.01/search) → set `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`
> - **ValueSERP** (free tier available) → set `VALUESERP_API_KEY`
>
> "Want to use one of these, or should I proceed with baseline mode? Baseline uses web search to analyze competing pages — still produces great briefs, just with less precise SERP feature and volume data."

### Mode Selection

- **Enhanced mode** — Real SERP data per keyword: exact ranking pages, SERP features present (featured snippets, PAA, video carousels), search volume, keyword difficulty. Briefs include specific "win this SERP feature" targeting.
- **Baseline mode** — Uses `web_search` to identify top-ranking pages, `seo-domain-analyzer` for domain metrics. SERP feature detection is inferred. Still produces excellent briefs — the competitive analysis and customer language components don't need SERP APIs.

## Phase 0: Intake

1. **Keywords** — List of target keywords (1-50). Can be:
   - Pasted list
   - CSV file
   - Output from `seo-opportunity-finder`
   - Output from `programmatic-seo-planner` (template keywords)
2. **Your site URL** — So we check for existing coverage
3. **ICP** — Who's reading this content? (role, pain, goal)
4. **Brand voice** — Formal/casual/technical? (or link to brand voice doc)
5. **Content type preference** — Blog posts, landing pages, guides, glossary entries?
6. **Brief depth** — Standard (outline + angle + competitors) or Deep (all of the above + customer quotes + SERP feature targeting + internal links)?
7. **Tool preference** — Enhanced mode with SERP API, or baseline? (see Tool Enhancement above)

## Phase 1: Existing Coverage Check

Run `site-content-catalog` on your site:

```bash
python3 skills/site-content-catalog/scripts/catalog_content.py \
  --url "<your_site_url>" \
  --output json
```

For each target keyword, check:
- Do you already have a page targeting this keyword? → **Update brief** (not new page)
- Do you have related pages that should link to this? → **Internal link candidates**
- What content gaps exist? → Confirms keyword is worth targeting

## Phase 2: Per-Keyword Analysis (Batch)

For each keyword, run in parallel where possible:

### 2A: SERP Analysis

**Enhanced mode (SerpAPI / Serper / DataForSEO):**

```
# SerpAPI example
GET https://serpapi.com/search?q={keyword}&api_key={key}&num=10
```

Extract per keyword:
- Top 10 ranking URLs
- SERP features present (featured snippet, PAA, video, knowledge panel, images)
- Featured snippet holder (if any) + snippet content
- People Also Ask questions (top 5)
- Related searches
- Search volume + keyword difficulty (if available from API)

**Baseline mode:**

Use `web_search` for each keyword:
- Note top 5-10 results
- Identify obvious SERP features from result format
- Use `seo-domain-analyzer` for volume/difficulty estimates

### 2B: Competing Page Analysis

For top 3-5 ranking pages per keyword, fetch via `fetch_webpage`:

Analyze each:
- **Word count** — How long are ranking pages?
- **Structure** — H1, H2 outline, content flow
- **Content type** — How-to, listicle, comparison, guide, definition
- **Unique data** — Do they include original research, surveys, screenshots?
- **Freshness** — When was it last updated?
- **Depth score** — Thin overview vs. comprehensive resource
- **Missing topics** — What did they NOT cover that they should have?

### 2C: Customer Language Mining

Run `review-site-scraper` + `reddit-post-finder` for the topic:

```bash
# Reviews — find how ICP talks about this problem
python3 skills/capabilities/review-site-scraper/scripts/scrape_reviews.py \
  --platform g2 \
  --url "<relevant_product_review_url>" \
  --output json

# Reddit — find real questions and pain language
python3 skills/reddit-post-finder/scripts/search_reddit.py \
  --subreddit "<relevant_subs>" \
  --keywords "<keyword>,<topic>" \
  --days 365 --sort top --time year
```

Extract:
- **Real questions people ask** about this topic → sections to include
- **Pain language** → angle for the intro hook
- **Misconceptions** → myth-busting section opportunity
- **Specific use cases** → concrete examples to include
- **Quotes** → proof points to weave into content

## Phase 3: Brief Generation

For each keyword, produce:

```markdown
# Content Brief: [Target Keyword]

## Metadata
- **Target keyword:** [primary keyword]
- **Secondary keywords:** [2-5 related keywords to include naturally]
- **Search volume:** [monthly, if available] | **Difficulty:** [score, if available]
- **Content type:** [blog post / guide / comparison / glossary / landing page]
- **Target word count:** [X-Y words] (based on competing pages)
- **Priority:** [P0/P1/P2]

---

## Search Landscape

### What's Currently Ranking
| # | Page | Domain | Type | Words | Strengths | Weaknesses |
|---|------|--------|------|-------|-----------|------------|
| 1 | [title] | [domain] | [type] | [count] | [what they do well] | [what they miss] |
| 2 | ... | | | | | |
| 3 | ... | | | | | |

### SERP Features Present
- Featured snippet: [Yes/No — current holder + content]
- People Also Ask: [list of PAA questions]
- Video carousel: [Yes/No]
- Images: [Yes/No]
- Knowledge panel: [Yes/No]

### SERP Feature Targets
- [ ] **Win featured snippet** — Structure answer in [format] under H2 "[heading]"
- [ ] **Answer PAA questions** — Include sections covering: [list]
- [ ] **Image pack** — Include [type of images/diagrams]

---

## Differentiation Angle

**The gap in existing content:** [What ALL ranking pages miss or do poorly]

**Your unique angle:** [How to approach this differently — based on customer language, product positioning, or data you have that competitors don't]

**Customer voice evidence:**
> "[Quote from review/Reddit showing the gap]" — [Source]
> "[Another quote]" — [Source]

---

## Recommended Outline

### Title Options (pick one)
1. [Title option A — SEO-optimized]
2. [Title option B — curiosity-driven]
3. [Title option C — outcome-focused]

### Meta Description
[155 characters, includes keyword, has clear value prop]

### Content Structure

**H1: [Exact H1]**

**H2: [Section 1 — Hook/Problem Statement]**
- What to cover: [specific guidance]
- Length: [~X words]
- Include: [customer pain quote as hook]

**H2: [Section 2 — Core Content]**
- What to cover: [specific guidance]
- Length: [~X words]
- Include: [comparison table / step-by-step / framework]

**H2: [Section 3 — Differentiated Angle]**
- What to cover: [the thing competitors miss]
- Length: [~X words]
- This is your competitive edge

**H2: [Section 4 — Practical Application]**
- What to cover: [concrete examples, use cases]
- Include: [screenshots, templates, or data]

**H2: [Section 5 — FAQ / PAA Answers]**
- [PAA question 1] — [brief answer guidance]
- [PAA question 2] — [brief answer guidance]
- [PAA question 3] — [brief answer guidance]

**H2: [Section 6 — CTA / Next Steps]**
- What to cover: [natural transition to your product]

---

## Internal Linking Plan
- **Link FROM this page TO:** [existing pages that are relevant]
- **Link TO this page FROM:** [existing pages that should reference this]
- **Anchor text suggestions:** [specific anchor text for each link]

---

## Content Requirements
- [ ] Include at least [N] original examples/screenshots
- [ ] Use customer language: "[specific phrases to work in]"
- [ ] Include structured data: [FAQ schema / HowTo schema / etc.]
- [ ] Add last-updated date (for freshness signals)
- [ ] Target readability: [grade level / reading time]

---

## Competitive Advantage Checklist
- [ ] Covers everything top 3 pages cover
- [ ] Adds [unique angle] they all miss
- [ ] Uses real customer language (not generic marketing speak)
- [ ] Targets [SERP feature] with optimized format
- [ ] Has stronger internal linking than competitors
- [ ] Includes original [data/images/templates] competitors lack
```

## Phase 4: Batch Output

For batch runs (10+ briefs):

```markdown
# Content Brief Batch — [Product/Client] — [DATE]

## Summary
- Briefs generated: [N]
- Total target search volume: [X]/month
- Content types: [N] blog posts, [N] guides, [N] comparisons, etc.

## Priority Order
| # | Keyword | Volume | Difficulty | Content Type | Unique Angle | Status |
|---|---------|--------|-----------|-------------|-------------|--------|
| 1 | [kw] | [vol] | [diff] | [type] | [angle summary] | Ready |
| 2 | [kw] | [vol] | [diff] | [type] | [angle summary] | Ready |
...

## Individual Briefs
[Brief 1]
---
[Brief 2]
---
...
```

Save to the current working directory or wherever the user prefers. For batch mode, also export a summary CSV.

## Cost

| Component | Cost |
|-----------|------|
| Site catalog (once) | ~$0.05-0.10 |
| Review scraper (per topic cluster) | ~$0.10-0.30 |
| Reddit scraper (per topic cluster) | ~$0.05-0.10 |
| Page fetches (3-5 per keyword) | ~$0.01-0.03 per keyword |
| SerpAPI (enhanced, per keyword) | ~$0.01-0.05 per keyword |
| Serper.dev (enhanced, per keyword) | ~$0.001 per keyword |
| Analysis | Free (LLM reasoning) |
| **Total per brief (baseline)** | **~$0.05-0.15** |
| **Total per brief (enhanced)** | **~$0.08-0.25** |
| **Batch of 20 briefs (baseline)** | **~$1.00-3.00** |
| **Batch of 20 briefs (enhanced)** | **~$1.60-5.00** |

## Tools Required

- **Apify API token** — `APIFY_API_TOKEN` env var
- **Upstream skills:** `site-content-catalog`, `seo-domain-analyzer`, `review-site-scraper`, `reddit-post-finder`, `fetch_webpage`
- **Optional (enhanced):** SerpAPI (`SERPAPI_KEY`), Serper.dev (`SERPER_API_KEY`), DataForSEO (`DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`), or ValueSERP (`VALUESERP_API_KEY`)

## Scheduling

For ongoing content operations, run weekly:
- Input: keywords from `seo-opportunity-finder` or content calendar
- Output: fresh briefs for the writing team
- Schedule: Monday mornings before editorial planning

## Trigger Phrases

- "Create content briefs for these keywords"
- "Brief me on [keyword]"
- "Generate 20 content briefs"
- "What should we write about [topic]?"
- "Build briefs for our content calendar"
- "Batch brief these keywords"
