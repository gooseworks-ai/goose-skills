---
name: google-search-ads-builder
description: >
  End-to-end Google Search Ads campaign builder. Performs deep keyword research
  (competitor SEO, review language mining, Reddit/HN community terminology, site audit),
  builds keyword architecture with funnel mapping and intent classification, creates
  ad group structure, generates headline/description variants, builds negative keyword
  lists, recommends bid strategy, and exports a campaign-ready CSV for Google Ads Editor import.
tags: [ads]
---

# Google Search Ads Builder

Build a complete Google Search Ads campaign from scratch. This skill handles everything from deep keyword research through community and review language mining, to ad copy generation and campaign structure — outputting files ready to import into Google Ads Editor.

**Core principle:** Most early-stage teams waste their first $5K on Google Ads because of bad keyword strategy and bad structure. This skill builds the strategic keyword foundation AND a tight, well-organized campaign from day one.

## When to Use

- "Set up Google Search Ads for us"
- "Build a Google Ads campaign for [product]"
- "I want to start running search ads — help me set it up"
- "Create a PPC campaign structure"
- "Generate Google Ads copy for our product"
- "Do keyword research for Google Ads"
- "What keywords should we bid on?"
- "Build a keyword strategy for paid search"
- "Find high-intent keywords in our space"

## Phase 0: Intake

1. **Product name + URL** — What are we advertising?
2. **One-line value prop** — What does it do, for whom?
3. **Product category** — How would a buyer search for this? (e.g., "sales automation", "AI writing tool")
4. **ICP** — Who is searching for this? (Role, pain, company stage)
5. **Monthly budget** — What are you willing to spend? (Affects structure and bid recommendations)
6. **Goal** — Free trial sign-ups / Demo bookings / Content downloads / Direct purchase
7. **Landing pages** — URLs you'll send traffic to (or "need to create")
8. **Competitor domains** — 3-5 competitors (for keyword gap analysis)
9. **Geographic targeting** — Countries/regions
10. **Existing keywords?** — Any keywords you already know work or are currently bidding on
11. **Known converting keywords?** — Any existing performance data

## Phase 1: Deep Keyword Research

### 1A: Seed Keyword Generation

From the product description and ICP, generate 3 keyword buckets:

| Bucket | Intent | Examples |
|--------|--------|---------|
| **Problem-aware** | Searching for solutions to a pain | "how to automate outbound", "fix slow sales pipeline" |
| **Solution-aware** | Searching for a category of product | "AI SDR tool", "outbound automation software" |
| **Brand/Competitor** | Searching for you or competitors by name | "[your brand]", "[competitor] alternative" |

### 1B: Competitive Keyword Mining

For each competitor domain, research their organic keyword rankings and ad presence using `web_search`:

```
Search: site:<competitor_domain> [product category keywords]
Search: <competitor> SEO keywords ranking
Search: <competitor> top pages organic traffic
Search: "[competitor] site:google.com/ads" OR "[competitor] PPC keywords"
Search: "[competitor]" alternative OR vs OR comparison
Search: best [product category] tools 2026
```

Use `fetch_webpage` on competitor landing pages and pricing pages to extract the language and positioning they use — these reveal keyword opportunities.

Extract keywords with buying intent — skip informational-only terms.

### 1C: Review Language Mining

The exact language buyers use matters more than what marketers think they search. Mine review sites for real buyer vocabulary.

Use `web_search` to find reviews:

```
Search: "[product name]" site:g2.com reviews
Search: "[product name]" site:capterra.com reviews
Search: "[competitor name]" site:g2.com reviews
Search: "best [product category]" site:g2.com
```

Use `fetch_webpage` on the top review pages to extract phrases like:
- "I was looking for a [term] that could..."
- "We switched from [X] because we needed..."
- "Best [term] for [use case]"

These phrases reveal how real buyers describe the problem and the solution — gold for keyword targeting.

### 1D: Reddit Community Terminology Mining

Reddit threads contain the unfiltered language your ICP actually uses.

**Option A — Apify Reddit Scraper** (if `APIFY_API_TOKEN` is set):

```
POST https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/runs?token=${APIFY_API_TOKEN}
Content-Type: application/json

{
  "searches": ["best <category> tool OR software OR platform"],
  "maxItems": 30
}
```

Then poll for results:
```
GET https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/runs/{RUN_ID}?token=${APIFY_API_TOKEN}
```

Once status is `SUCCEEDED`, fetch dataset:
```
GET https://api.apify.com/v2/datasets/{DATASET_ID}/items?token=${APIFY_API_TOKEN}
```

**Output fields:** Each item has `dataType` ("post" or "comment"), `title` (posts only), `body`, `communityName`, `upVotes`, `url`, `createdAt`.

**Option B — Web search fallback:**

```
Search: site:reddit.com "best [product category] tool" OR "recommend [product category]"
Search: site:reddit.com "[competitor name]" alternative
Search: site:reddit.com "[pain point]" solution software
```

Extract the terminology, slang, and product descriptions real users use in these threads.

### 1E: Hacker News Terminology Mining

HN discussions reveal how technical buyers describe tools and problems.

Use the free HN Algolia API:

```
GET https://hn.algolia.com/api/v1/search?query=<product category>&tags=story&hitsPerPage=20
GET https://hn.algolia.com/api/v1/search?query=<competitor name>&tags=story&hitsPerPage=20
GET https://hn.algolia.com/api/v1/search?query=<pain point>&tags=comment&hitsPerPage=30
```

No API key needed. Extract terminology and product framing from titles and comment text.

### 1F: Your Site Content Audit

Use `fetch_webpage` to crawl key pages on the user's own website:

- Homepage
- Product/features pages
- Pricing page
- Blog posts (top 5-10)
- Any existing landing pages

Identify:
- Pages that could serve as ad landing pages
- Keywords the site content already targets (leverage in ads)
- Gaps — search terms the site doesn't cover yet
- Language and positioning already in use

### 1G: Search Suggest & Related Terms

```
Search: "[category] tool" → note Google autocomplete suggestions
Search: "[category] software for [ICP role]"
Search: "[pain point] solution"
Search: "how to [problem your product solves]"
```

### 1H: Keyword Expansion

For each seed keyword discovered across all sources, expand with:
- **Modifiers:** best, top, free, cheap, enterprise, for startups, for [role]
- **Long-tail:** "[category] for [specific use case]"
- **Question queries:** "how to [solve problem your product addresses]"
- **Comparison:** "[competitor] vs [your brand]", "[competitor] alternative"

## Phase 2: Keyword Architecture

### 2A: Funnel Stage Mapping

Organize ALL discovered keywords by buyer journey stage:

| Stage | Intent Signal | Example Keywords | Bid Priority |
|-------|--------------|-----------------|-------------|
| **Problem-aware** | Searching for solutions to a pain | "how to scale outbound without hiring SDRs" | Medium — educational intent |
| **Solution-aware** | Searching for a category | "AI SDR tool", "outbound automation platform" | High — comparing options |
| **Product-aware** | Searching for specific products | "[competitor] alternative", "[competitor] vs" | Very high — close to purchase |
| **Most-aware** | Searching for your brand | "[your brand]", "[your brand] pricing" | Must-have — defend brand |

### 2B: Intent Classification

| Intent Type | Ad Group Strategy | Landing Page Strategy |
|-------------|------------------|---------------------|
| **Transactional** ("buy", "pricing", "free trial") | Aggressive bid, exact match | Direct product/pricing page |
| **Commercial** ("best", "top", "vs", "alternative") | Strong bid, exact + phrase | Comparison or feature page |
| **Informational** ("how to", "what is", "guide") | Low bid or skip — save for SEO | Blog/resource (if targeting) |
| **Navigational** (brand searches) | Must-bid, exact match | Homepage or brand LP |

### 2C: Competitive Density Assessment

For the top 30 keywords, estimate competition level:

| Density | Signal | Strategy |
|---------|--------|----------|
| **Low** | Few ads showing, no big brands | Bid aggressively — first mover advantage |
| **Medium** | Some competitors, not saturated | Bid strategically — differentiate with copy |
| **High** | Major players dominating | Bid selectively — long-tail variants, exact match only |
| **Very high** | Big ad budgets, position 1-4 locked | Avoid head-on — focus on long-tail or competitor terms |

### 2D: Match Type Matrix

| Keyword | Exact [keyword] | Phrase "keyword" | Broad keyword | Recommendation |
|---------|----------------|-----------------|---------------|---------------|
| [keyword 1] | Y | Y | N | Start exact, expand to phrase after data |
| [keyword 2] | Y | N | N | Exact only — too broad in phrase |
| [keyword 3] | Y | Y | Y | All match types — high-volume, need coverage |

**General match type rules:**

| Keyword Type | Recommended Match | Reason |
|-------------|-------------------|--------|
| Brand terms | Exact | Protect — don't waste spend on broad |
| High-intent solution | Exact + Phrase | Capture precisely, discover adjacent |
| Competitor terms | Exact + Phrase | Control the narrative |
| Problem-aware | Phrase + Broad (with negatives) | Cast wider net for top-of-funnel |

### 2E: Keyword Scoring

| Keyword | Est. Volume | Intent Strength | Competition | Priority |
|---------|------------|----------------|-------------|----------|
| [keyword] | [H/M/L] | [High/Med/Low] | [H/M/L] | [1-5] |

**Priority scale:**
- **5** = High intent + medium competition (sweet spot)
- **4** = High intent + high competition (important but expensive)
- **3** = Medium intent + low competition (good for budget stretch)
- **2** = Low intent + low competition (awareness only)
- **1** = Skip — too broad or irrelevant

### 2F: Quick Wins List

Identify the top 10 keywords to launch with — highest intent, manageable competition:

| # | Keyword | Match Type | Intent | Competition | Why |
|---|---------|-----------|--------|-------------|-----|
| 1 | [keyword] | Exact | Transactional | Medium | [Reason] |

## Phase 3: Campaign Structure

### 3A: Ad Group Design

Group keywords by theme and intent. Each ad group = one tight topic.

**Structure template:**

```
Campaign: [Product Name] — Search
+-- Ad Group: [Problem Keyword Theme 1]
|   +-- Keywords (5-15 per group)
|   +-- Ads (3 responsive search ads)
+-- Ad Group: [Problem Keyword Theme 2]
+-- Ad Group: [Solution Category]
+-- Ad Group: [Competitor Alternatives]
|   +-- "[Competitor A] alternative"
|   +-- "[Competitor B] alternative"
|   +-- "best [category] alternative"
+-- Ad Group: [Brand]
    +-- "[Your brand name]" (defense)
```

**Rules:**
- Max 15 keywords per ad group
- All keywords in an ad group should share a theme
- Each ad group gets its own landing page (if possible)
- Use the match type matrix from Phase 2D to assign match types

## Phase 4: Ad Copy Generation

### Per Ad Group: 3 Responsive Search Ads

Each RSA needs:
- **15 headlines** (max 30 chars each)
- **4 descriptions** (max 90 chars each)

### Headline Framework (15 per ad group)

| Slot | Purpose | Example |
|------|---------|---------|
| 1-3 | **Keyword match** — Include the search term | "AI Outbound Automation" |
| 4-5 | **Value prop** — Primary benefit | "10x Your Pipeline in 30 Days" |
| 6-7 | **Social proof** — Credibility | "Trusted by 500+ B2B Teams" |
| 8-9 | **Differentiation** — Why you vs alternatives | "No-Code Setup in 5 Minutes" |
| 10-11 | **CTA** — Action driver | "Start Free Trial Today" |
| 12-13 | **Offer/Urgency** — Incentive | "Free 14-Day Trial" |
| 14-15 | **Trust/Risk reversal** — Remove friction | "No Credit Card Required" |

### Description Framework (4 per ad group)

| Slot | Purpose | Example |
|------|---------|---------|
| 1 | **Feature-benefit** — What + so what | "Automate personalized outbound emails so your team closes more deals without the manual work." |
| 2 | **Pain-agitate** — Problem + solution | "Tired of reps spending 4 hours on prospecting? Our AI handles it in minutes." |
| 3 | **Social proof + CTA** | "Join 500+ growth teams. Start your free trial — no credit card needed." |
| 4 | **Differentiator + CTA** | "Unlike legacy tools, [Product] works out of the box. See it in action — book a 15-min demo." |

## Phase 5: Negative Keywords

### 5A: Universal Negatives (Apply to all campaigns)

```
free (if not freemium)
jobs, careers, hiring, salary, internship
tutorial, course, certification, learn, how to become
review, reddit, quora, forum (if not desired)
login, support, help desk, documentation
download, open source (if not applicable)
```

### 5B: Category-Specific Negatives

Industry-specific terms that share words with your keywords but have wrong intent. Based on keyword research, add terms that would waste spend.

### 5C: Intent Negatives

Terms that indicate the searcher is not a buyer:
- Job seekers: "jobs", "careers", "hiring", "salary"
- Students: "tutorial", "course", "certification", "assignment"
- Support seekers: "login", "support", "help", "docs"

### 5D: Competitor Brand Negatives (Optional)

If NOT running competitor campaigns, negative-match competitor brand names to prevent waste. If you ARE running competitor campaigns, apply these as negatives only on non-competitor ad groups.

### 5E: Ad Group-Level Negatives

Cross-negative between ad groups to prevent internal keyword cannibalization. Each ad group should only trigger for its own theme.

## Phase 6: Bid Strategy Recommendation

| Budget Range | Recommended Strategy | Reason |
|-------------|---------------------|--------|
| < $1K/mo | Manual CPC or Max Clicks | Need data first — don't let Google optimize on nothing |
| $1K-5K/mo | Max Conversions (after 30+ conversions) | Enough data for Google's algo |
| $5K+/mo | Target CPA or Target ROAS | Optimize for efficiency at scale |

**First 2 weeks:** Always start with Manual CPC or Max Clicks with a daily budget cap. Collect data before switching to automated bidding.

### Budget Allocation by Funnel Stage

| Funnel Stage | % of Budget | Reasoning |
|-------------|------------|-----------|
| Brand defense | [X%] | Protect brand searches |
| Competitor capture | [X%] | High-intent, ready to switch |
| Solution-aware | [X%] | Category buyers — highest volume |
| Problem-aware | [X%] | Only if budget allows |

## Phase 7: Output Format

### 7A: Campaign Strategy Doc

```markdown
# Google Search Ads Campaign — [Product Name] — [DATE]

## Campaign Overview
- **Goal:** [Conversions / Demos / Trials]
- **Monthly budget:** $[X]
- **Geographic targeting:** [Countries]
- **Bid strategy (start):** [Manual CPC / Max Clicks]
- **Bid strategy (after 30 conversions):** [Max Conversions / Target CPA]

## Research Summary
- Sources analyzed: [competitor SEO, G2/Capterra reviews, Reddit, Hacker News, site audit]
- Total keywords discovered: [N]
- After dedup + filtering: [N]
- Recommended for campaign: [N]

## Competitive Density Map

| Keyword Theme | Your Position | Top Competitors Bidding | Density | Recommendation |
|--------------|--------------|------------------------|---------|---------------|
| [Theme] | [Not bidding / Bidding] | [Names] | [H/M/L] | [Bid / Skip / Long-tail] |

## Campaign Structure
[Visual tree of campaigns -> ad groups]

## Keywords by Ad Group

### Ad Group: [Name]
**Landing page:** [URL]
| Keyword | Match Type | Funnel Stage | Intent | Priority |
|---------|-----------|-------------|--------|----------|
| [keyword] | Exact | Solution-aware | Commercial | High |
| [keyword] | Phrase | Problem-aware | Informational | Medium |

### Ad Group: [Name 2]
...

## Ad Copy

### Ad Group: [Name]
**RSA 1:**
Headlines: [list of 15]
Descriptions: [list of 4]

**RSA 2:** ...
**RSA 3:** ...

## Negative Keywords

### Campaign-Level Negatives
[List]

### Ad Group-Level Negatives
[Per ad group]

## Bid & Budget Recommendations
[Strategy + daily budget recommendation + funnel stage allocation]

## Quick Wins — Top 10 Launch Keywords
| # | Keyword | Match Type | Intent | Competition | Why |
|---|---------|-----------|--------|-------------|-----|
| 1 | [keyword] | Exact | Transactional | Medium | [Reason] |

## Launch Checklist
- [ ] Verify landing pages load and track conversions
- [ ] Set up conversion tracking (Google Tag / GA4)
- [ ] Confirm geographic targeting
- [ ] Set daily budget cap
- [ ] Review ad extensions (sitelinks, callouts, structured snippets)
- [ ] Enable search term report review (weekly)
```

### 7B: Google Ads Editor Import CSV

Generate a CSV file importable into Google Ads Editor:

```csv
Campaign,Ad Group,Keyword,Match Type,Max CPC,Final URL,Headline 1,Headline 2,Headline 3,Description 1,Description 2
```

Save strategy doc to `google-search-campaign-[YYYY-MM-DD].md` in the current working directory (or user-specified path).
Save CSV to `google-ads-import-[YYYY-MM-DD].csv` in the current working directory (or user-specified path).

## Cost

| Component | Cost |
|-----------|------|
| Keyword research (web search) | Free |
| Review mining (web search) | Free |
| Reddit scraping (Apify, if used) | ~$0.05-0.10 |
| HN Algolia API | Free |
| Site content audit (fetch_webpage) | Free |
| Ad copy generation | Free (LLM reasoning) |
| CSV generation | Free |
| **Total** | **Free-$0.10** |

## Tools Required

- **web_search** — for keyword research, competitor analysis, review mining, Reddit mining
- **fetch_webpage** — for landing page review, competitor page analysis, site content audit
- **HN Algolia API** — `https://hn.algolia.com/api/v1/search` (free, no key needed)
- **Optional:** Apify Reddit scraper — requires `APIFY_API_TOKEN` env var

## Trigger Phrases

- "Set up Google Search Ads for [product]"
- "Build a PPC campaign"
- "Create Google Ads for our product"
- "I need search ad keywords and copy"
- "Generate a Google Ads Editor import file"
- "Do keyword research for Google Ads"
- "What keywords should we bid on?"
- "Build a keyword architecture for [product]"
- "Find high-intent search keywords"
