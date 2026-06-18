---
name: company-current-gtm-analysis
description: >
  Comprehensive GTM analysis of any target company. Researches what a company is
  currently doing across all go-to-market dimensions — content/blog, founder LinkedIn
  activity, SEO/traffic, hiring signals, social/community presence, customer acquisition
  channels, podcast appearances, review sites, competitive positioning, and partnerships.
  Produces a structured report identifying what's working, what's missing, and where
  white space exists for new strategies. Use before designing GTM strategies for a client
  or prospect.
---

# Company Current GTM Analysis

Deep-research agent skill that produces a comprehensive analysis of what a target company is currently doing across all go-to-market dimensions. The output identifies what's working, what's missing, and where white space exists — so you can design strategies that fill genuine gaps rather than duplicating what they already do.

## Quick Start

```
Run a GTM analysis for <company>. Website: <url>. Founder LinkedIn profiles: <urls>.
```

Or if a client context file already exists:

```
Run a GTM analysis for <client>. Use the context at clients/<client>/context.md.
```

## Inputs

| Input | Required | Source |
|-------|----------|--------|
| **Company name** | Yes | User provides or read from `clients/<client>/context.md` |
| **Company website** | Yes | User provides or read from context |
| **Founder/exec LinkedIn URLs** | Recommended | User provides, or search web for "[founder name] LinkedIn" |
| **Known competitors** | Optional | Improves competitive positioning section |
| **Client context file** | Optional | `clients/<client>/context.md` — if exists, use for ICP, positioning, etc. |

---

## Step-by-Step Process

### Phase 1: Load Context

1. If a client context file exists at `clients/<client>/context.md`, read it for:
   - Company overview, founders, product, pricing
   - Known competitors, customers, market positioning
   - Any existing research or intelligence

2. If no context file exists, gather basics from the user:
   - Company name, website URL
   - Founder names and LinkedIn URLs (if known)
   - Industry/category
   - Known competitors (if any)

3. Create the output directory in the current working directory (or user-specified path).

### Phase 2: Data Collection (Run in Parallel)

Run as many of these research threads as possible in parallel. Each thread is independent.

#### 2A. Blog & Content Strategy

**Goal:** Understand their content strategy — topics, frequency, types, target audience, gaps.

1. **Fetch the blog page:**
   - WebFetch `<website>/blog` — extract all visible post titles, dates, categories, authors
   - If no `/blog`, try `/resources`, `/insights`, `/news`, `/articles`
   - Note: Many sites are JS-rendered. If WebFetch returns empty content, fall back to WebSearch: `site:<website> blog`

2. **Catalog content types:**
   - Product updates / changelogs
   - Comparison / "vs" / "alternative" pages
   - How-to guides / tutorials
   - Case studies / customer stories
   - Thought leadership / opinions
   - Industry reports / data
   - SEO-optimized list posts ("Best X tools for Y")

3. **Assess content strategy:**
   - Publishing frequency (daily/weekly/monthly/sporadic)
   - Author diversity (one person vs. team vs. guest contributors)
   - Content depth (shallow SEO vs. deep expertise)
   - Funnel coverage (top/mid/bottom)
   - Downloadable assets (ebooks, whitepapers, calculators)
   - Video content (embedded, YouTube channel)

4. **Check for comparison/vs pages:**
   - WebSearch: `site:<website> vs OR alternative OR compare`
   - Catalog which competitors they compare against
   - Note which competitors are MISSING from their comparison content

#### 2B. Founder/Exec LinkedIn Activity

**Goal:** Understand founder thought leadership presence, posting frequency, engagement, topics.

**Requires:** Founder LinkedIn profile URLs. If not provided, search: `"<founder name>" LinkedIn <company>`

1. **Scrape recent posts:**
   ```bash
   python3 skills/linkedin-profile-post-scraper/scripts/scrape_linkedin_posts.py \
     --profiles "<comma-separated LinkedIn URLs>" \
     --max-posts 20 --days 90 --output json
   ```

2. **Analyze the posts:**
   - Posting frequency (daily/weekly/monthly/rarely)
   - Content type breakdown: original posts vs. reposts vs. articles
   - Topics covered (product, industry, personal, hiring, culture)
   - Average engagement (likes, comments, shares)
   - Top-performing posts and why they worked
   - Whether they engage in comments (reply to commenters)

3. **Assess thought leadership posture:**
   - Are founders positioned as industry voices or just company operators?
   - Is there a personal brand beyond the company?
   - Are they engaging with industry influencers?

#### 2C. SEO & Web Traffic

**Goal:** Estimate traffic, identify traffic sources, assess SEO investment level.

1. **Get traffic data:**
   - WebSearch: `<website> traffic site visitors similarweb`
   - WebFetch: `https://www.similarweb.com/website/<domain>/` (may or may not return data)
   - Look for: monthly visits, bounce rate, pages/visit, traffic sources, top countries

2. **Assess keyword strategy:**
   - WebSearch: `site:<website>` to see indexed pages
   - Check for programmatic SEO (template pages like "find [role] in [city]")
   - Check for competitor keyword targeting ("alternative to X", "X vs Y")
   - Identify keywords they likely rank for based on blog content

3. **Check for paid advertising:**
   - WebSearch: `<company name>` and `<category> tool` — note if ads appear
   - Look for Google Ads, LinkedIn Ads, or Facebook Pixel on their site

4. **Assess SEO maturity:**
   - Content volume (how many blog posts / pages)
   - Keyword sophistication (broad terms vs. long-tail vs. competitor terms)
   - Programmatic SEO presence
   - Backlink signals (guest posts, press mentions, directory listings)

#### 2D. Hiring & Team Signals

**Goal:** Understand team composition, growth trajectory, and strategic priorities from hiring patterns.

1. **Check careers page:**
   - WebFetch: `<website>/careers` or `<website>/jobs`
   - If JS-rendered, WebSearch: `<company> careers open positions <current year>`
   - Also check: Glassdoor, LinkedIn Jobs, Greenhouse (`boards.greenhouse.io/<company>`), Lever (`jobs.lever.co/<company>`)

2. **Catalog open roles by department:**
   - Engineering (what kind — ML, backend, frontend, infra, data)
   - Product / Design
   - Sales / Business Development
   - Marketing / Content / Growth
   - Customer Success / Support
   - Operations / Finance / People
   - Recruiting (hiring recruiters = aggressive growth mode)

3. **Interpret the signals:**
   - Heavy engineering hiring = product-led, building moat
   - First sales hires = transitioning from PLG to sales-assisted
   - Marketing hires = investing in brand/demand gen
   - CS hires = customer base growing, retention focus
   - Recruiting hires = expecting rapid overall headcount growth
   - Senior/VP hires = building leadership layer, moving upmarket

4. **Note key people:**
   - Recent senior hires (VP+) and their backgrounds
   - Team size and growth trajectory
   - Notable talent signals (where are they hiring from?)

#### 2E. Social Media & Community Presence

**Goal:** Map their presence and activity level across every relevant channel.

1. **Twitter/X:**
   - WebSearch: `<company> Twitter OR X.com`
   - Find their handle, follower count, posting frequency
   - What do they post? (Product updates, industry commentary, engagement with community)

2. **Reddit:**
   - WebSearch: `"<company name>" OR "<product name>" site:reddit.com`
   - What are people saying? Positive/negative/neutral?
   - Is the company team actively engaging in threads?

3. **YouTube:**
   - WebSearch: `<company> OR <product> YouTube channel`
   - Do they have a channel? How many subscribers? What content?
   - Are there third-party reviews/tutorials?

4. **Product Hunt:**
   - WebSearch: `<company> OR <product> site:producthunt.com`
   - Did they launch? When? How did it perform?

5. **Slack/Discord Communities:**
   - WebSearch: `<company> community Slack OR Discord`
   - Do they run their own community? Are they active in industry communities?

6. **Overall assessment:** Rate each channel as Active / Present but Inactive / Absent

#### 2F. Customer Acquisition & Reviews

**Goal:** Understand how they get customers and what customers think.

1. **Review sites:**
   - WebSearch: `<company> OR <product> review G2 Capterra <current year>`
   - WebFetch G2/Capterra pages if URLs are findable
   - Note: rating, review count, common praise, common complaints
   - Optional: use `review-site-scraper` skill for detailed extraction

2. **Customer logos and case studies:**
   - WebFetch: `<website>/customers` or `<website>/case-studies`
   - WebSearch: `<company> case study OR testimonial OR customer story`
   - Note which customer segments they showcase

3. **Partnerships and integrations:**
   - WebFetch: `<website>/integrations` or `<website>/partners`
   - WebSearch: `<company> partner program OR integration marketplace`
   - Note: ATS/CRM integrations, reseller programs, co-marketing partnerships

4. **Referral/affiliate programs:**
   - WebSearch: `<company> referral program OR affiliate program`
   - Check website footer/navigation for referral links

5. **Paid advertising signals:**
   - Check for Facebook Pixel, Google Ads tags on their site
   - Search their brand + category terms and note if ads appear

#### 2G. Podcast & Speaking Appearances

**Goal:** Understand their earned media and thought leadership distribution.

1. **Search for podcast appearances:**
   - WebSearch: `"<founder name>" podcast interview <company>`
   - WebSearch: `<company> OR <product> podcast`
   - Catalog: podcast name, host, topic, date

2. **Search for conference appearances:**
   - WebSearch: `"<founder name>" speaker conference <current year>`
   - WebSearch: `<company> conference talk OR keynote OR panel`

3. **Search for press coverage:**
   - WebSearch: `<company> TechCrunch OR Forbes OR Bloomberg OR news`
   - Note: Is coverage only around funding rounds, or sustained?

4. **Analyst coverage:**
   - WebSearch: `<company> Gartner OR Forrester OR "Josh Bersin" OR analyst`
   - Are they in any industry analyst reports or evaluations?

### Phase 3: Synthesize & Score

After all data collection completes, synthesize into a structured analysis.

#### 3A. Channel-by-Channel Scorecard

Rate each GTM dimension:

| Dimension | Grade (A-F) | Evidence |
|-----------|-------------|----------|
| Product-Led Growth | | Self-serve, freemium, pricing |
| SEO / Content Marketing | | Traffic, keyword strategy, content depth |
| Social Proof / Case Studies | | Customer logos, testimonials, case studies |
| Review Site Presence | | G2/Capterra rating, review count |
| Founder Thought Leadership | | LinkedIn activity, podcast appearances |
| Paid Advertising | | Google Ads, social ads signals |
| Conference / Events | | Speaking, sponsoring, attending |
| Analyst Coverage | | Gartner, Forrester, industry analysts |
| Referral Program | | Formal referral/affiliate mechanism |
| Partner / Reseller Programs | | Co-marketing, reseller, marketplace presence |
| Community Engagement | | Reddit, Slack, Discord, forums |
| Video / YouTube | | Official channel, tutorials, demos |
| Enterprise Sales Motion | | Sales team, enterprise pricing, procurement docs |
| Compliance / Trust | | Trust center, SOC 2, compliance content |
| International Presence | | Localized content, non-US marketing |

#### 3B. Identify White Space

For each dimension graded C or below, document:
- What specifically is missing
- Why it matters for their stage/market
- How large the opportunity is (High/Medium/Low impact)
- How hard it would be to address (Low/Medium/High effort)

#### 3C. Competitive Positioning Map

Document:
- How they position themselves (tagline, value props, key differentiators)
- Which competitors they actively compare against
- Which competitors they DON'T compare against (gaps)
- Their pricing strategy relative to alternatives

### Phase 4: Generate Output

Save the report to the current working directory as `current-gtm-analysis.md` (or user-specified path) using this structure:

---

```markdown
# <Company Name> — Comprehensive GTM & Market Presence Analysis

**Date:** <YYYY-MM-DD>
**Purpose:** Understand what <Company> is currently doing across all GTM dimensions
to identify white space for new strategies.
**Sources:** <list sources used>

---

## Executive Summary

<3-5 sentence overview. What is the company's primary GTM motion? What are they
doing well? What are the biggest gaps? What is the single most important finding?>

---

## 1. Blog & Content Strategy

### What They Publish
<Content catalog — types, topics, frequency, authors>

### Content Strategy Assessment
**Strengths:** <what's working>
**Weaknesses / White Space:** <what's missing>

---

## 2. Founder LinkedIn Activity

### <Founder Name> (Title)
**Posting frequency:** <X posts/month>
**Top post:** <title, engagement, date>
**Assessment:** <thought leadership posture>

---

## 3. SEO & Web Traffic

### Traffic Data
<Monthly visits, traffic sources, key metrics>

### SEO Strategy Assessment
<What they're doing, what's missing, programmatic SEO assessment>

---

## 4. Hiring & Team Signals

### Current State
<Team size, open roles by department>

### Key Hires
<Recent notable hires and what they signal>

### Strategic Implications
<What the hiring pattern tells us about their priorities>

---

## 5. Social Media & Community Presence

| Platform | Activity Level | Assessment |
|----------|---------------|------------|
| LinkedIn | | |
| Twitter/X | | |
| Reddit | | |
| YouTube | | |
| Product Hunt | | |
| Slack/Discord | | |

---

## 6. Podcast & Speaking Appearances

<Table of podcast appearances, conference talks, press coverage>

### Assessment
<Coverage level, which audiences they reach, gaps>

---

## 7. Review Sites & Customer Sentiment

### G2 / Capterra / TrustRadius
<Ratings, review counts, key themes>

### Sentiment Summary
**Strengths users report:** <list>
**Weaknesses users report:** <list>

---

## 8. Customer Acquisition Channels

### Currently Using
| Channel | Status | Effectiveness |
|---------|--------|--------------|
| ... | ... | ... |

### Completely Untapped
| Channel | Opportunity Size | Effort |
|---------|-----------------|--------|
| ... | ... | ... |

---

## 9. Competitive Positioning

### How They Position
<Tagline, key differentiators, pricing strategy>

### Comparison Pages
| Competitor | Comparison Exists? | Notes |
|-----------|-------------------|-------|
| ... | Yes/No | ... |

---

## 10. White Space Summary

### Critical White Space (High Impact, Act Now)
1. <Gap description, why it matters, opportunity size>
2. ...

### Significant White Space (Medium Impact, Plan For)
1. ...

### Emerging White Space (Time-Sensitive)
1. ...

---

## GTM Scorecard

| Dimension | Grade | Biggest Opportunity |
|-----------|-------|---------------------|
| Product-Led Growth | | |
| SEO / Content | | |
| Social Proof / Case Studies | | |
| Pricing Strategy | | |
| Review Sites | | |
| Founder Thought Leadership | | |
| Paid Advertising | | |
| Conference Presence | | |
| Analyst Relations | | |
| Partner Programs | | |
| Community Engagement | | |
| Video / YouTube | | |
| Enterprise Sales | | |
| Compliance Marketing | | |
| International | | |
```

---

## Tips

- **Parallelize aggressively.** Phases 2A through 2G are all independent — run them simultaneously to minimize total research time. Use background agents or parallel tool calls wherever possible.

- **JS-rendered sites are common.** If WebFetch returns mostly CSS/JS without content, fall back to WebSearch with `site:<domain>` queries to discover pages.

- **Don't guess — flag unknowns.** If you can't verify something (e.g., exact G2 rating), say "[NEEDS VERIFICATION]" rather than inventing data.

- **Grade relative to stage.** A 10-person seed startup doesn't need analyst coverage. A $30M Series A company does. Adjust your grading to what's appropriate for their stage.

- **White space ≠ weakness.** Not every gap needs to be filled. The most valuable insight is which gaps represent the highest-leverage opportunities given the company's stage, resources, and market.

- **Founder LinkedIn is usually the #1 finding.** Almost every company underinvests in founder thought leadership. If the founder has a compelling story and isn't posting regularly, this is almost always the highest-ROI recommendation.

- **Check existing client workspace first.** If `clients/<client>/` already has research, intelligence reports, or strategy docs, read them before re-researching. Build on existing knowledge.

## Dependencies

- `APIFY_API_TOKEN` env var — for LinkedIn profile post scraping
- `requests` (Python) — for LinkedIn scraper script
- Web search and web fetch capabilities — for all other research
- Optional: `review-site-scraper` skill for detailed G2/Capterra extraction
- Optional: `blog-feed-monitor` skill for RSS-based blog analysis
