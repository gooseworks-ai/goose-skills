---
name: competitor-signals
description: Extract leads from competitor product activity — Product Hunt commenters/upvoters, HN posts about competitors, case studies, testimonials, tech press, and switching signals. Detects people actively switching from competitors as highest-priority leads.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch, WebSearch
argument-hint: [config-json-path]
---

# Competitor Signals

Find leads by monitoring competitor product activity. Instead of looking for your prospects directly, watch your competitors' audience — every person engaging with a competitor launch is self-identifying as in-market for your category.

## When to Use

- User wants to find people engaging with competitor products
- User mentions Product Hunt launches, competitor press coverage, or competitor case studies
- User wants to find people switching from or evaluating competitor products
- User asks "who is using [competitor]" or "who is looking at alternatives to [competitor]"
- User wants to monitor competitor activity for lead generation
- User has a clear list of competitors and wants to mine their audience

## Prerequisites

- Python 3.9+ with `requests` and optionally `python-dotenv`
- Product Hunt developer token (free, optional — get at `api.producthunt.com/v2/oauth/applications`)
- Apify API token in `.env` (fallback for PH if API names are redacted, optional)
- Working directory: the project root containing this skill

## Phase 1: Collect Context

### Step 1: Gather Competitor Information

Ask the user:

> "To find leads from competitor activity, I need:
> 1. **Who are your competitors?** (product names and company names)
> 2. **Do you know their Product Hunt slugs?** (the URL path on producthunt.com/posts/SLUG)
> 3. **Any specific competitor launches or announcements you've seen recently?**
> 4. **Are there competitors or signals you specifically want to track?** (e.g., a competitor just raised funding, launched a new feature, or got press coverage)"

### Step 2: Discover Competitors (if user needs help)

If the user doesn't have a complete competitor list, help them discover competitors:

**2a. Product Hunt search:**
- Search producthunt.com for the user's product category
- Note: PH doesn't have a great search API — use web search: "site:producthunt.com [product category]"

**2b. G2/Capterra category pages:**
- Search: "[product category] G2" or "[product category] Capterra"
- These pages list all competitors in a category with rankings

**2c. "Alternatives to" sites:**
- Search: "[known competitor] alternatives"
- Sites like alternativeto.net, slant.co, stackshare.io list competitors

**2d. Ask the user:**
> "Based on my research, here are competitors I've found in your space: [list]. Are there any I'm missing? Any you'd like to exclude (e.g., not really competitors, too different in market segment)?"

### Step 3: Find Product Hunt Slugs

For each competitor, find their PH launches:
- Search: "site:producthunt.com [competitor name]"
- Or browse: `producthunt.com/products/[competitor-name]`
- Note the slug from the URL: `producthunt.com/posts/SLUG`
- A competitor may have multiple launches (initial launch + feature launches)

### Step 4: Identify Competitor Web Pages to Scrape

For each competitor, identify pages the agent should scrape:

**Case studies page:** `[competitor].com/customers` or `[competitor].com/case-studies`
- Extract: company names, logos, quotes, person names, titles
- These are PROVEN BUYERS in the category

**Testimonials page:** Often on the homepage or a dedicated page
- Extract: person name, title, company, quote
- These are current users who publicly endorsed the competitor

**Blog:** `[competitor].com/blog`
- Guest posts by customers are case studies in disguise
- "How [Company X] uses [Competitor]" = case study

Present all discovered pages to the user for review.

## Phase 2: Agent-Driven Scraping

### Step 5: Scrape Competitor Websites

Before running the tool, the agent should manually scrape competitor case studies and testimonials. This is agent-driven because every competitor website has a different format.

**For each competitor's case study page:**
1. Navigate to the page using web fetch or Chrome DevTools
2. Extract all customer company names and any associated person names/quotes
3. Note the case study URL for reference

**For each competitor's testimonials page:**
1. Extract: person name, title, company, quote text
2. These are high-value signals — these people actively chose to endorse the competitor

**Save all scraped data** to `${CLAUDE_SKILL_DIR}/../.tmp/competitor_manual_signals.json`:
```json
[
    {
        "person_name": "Sarah Chen",
        "company": "TechCorp",
        "signal_type": "case_study_company",
        "signal_label": "Competitor Case Study",
        "competitor": "Twilio",
        "context": "How TechCorp scaled video calls to 100K users with Twilio",
        "url": "https://twilio.com/case-studies/techcorp",
        "profile_url": "",
        "date": "",
        "source": "Manual",
        "engagement": 0
    }
]
```

### Step 6: Check Tech Press

Search for recent articles about competitors:
- "[competitor] TechCrunch"
- "[competitor] The New Stack"
- "[competitor] InfoQ"
- "[competitor] DevOps.com"
- "[competitor] launch announcement"
- "[competitor] raises funding"

For articles found:
- Note the article URL and key companies/people mentioned
- If the article has comments, check for people expressing opinions
- Add notable findings to the manual signals JSON

## Phase 3: Execute Tool

### Step 7: Save Config

```bash
cat > ${CLAUDE_SKILL_DIR}/../.tmp/competitor_signals_config.json << 'CONFIGEOF'
{
    "competitors": ["Twilio", "Agora", "Vonage", "Daily.co"],
    "product_hunt_slugs": ["twilio-video", "agora-2", "daily-co"],
    "days": 90,
    "manual_signals_file": "${CLAUDE_SKILL_DIR}/../.tmp/competitor_manual_signals.json",
    "skip": []
}
CONFIGEOF
```

### Step 8: Run the Tool

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/competitor_signals.py \
    --config ${CLAUDE_SKILL_DIR}/../.tmp/competitor_signals_config.json \
    --output ${CLAUDE_SKILL_DIR}/../.tmp/competitor_signals.csv
```

The tool will:
1. Try Product Hunt API first (if `PRODUCTHUNT_TOKEN` is set)
2. Fall back to Apify PH scraper if API names are redacted
3. Search HN for all competitor names (stories + comments, last 90 days)
4. Load manual signals (case studies, testimonials, press)
5. Detect "switching signals" (highest priority — people saying they're moving to/from a competitor)
6. Deduplicate and score
7. Export CSV with switching signals highlighted

## Phase 4: Analyze & Recommend

### Step 10: Analyze Results

**10a. Switching Signals (HIGHEST PRIORITY)**
- These are people who publicly said they're switching from or evaluating alternatives to a competitor
- List every switching signal with full context
- These leads should be contacted IMMEDIATELY — they're in active evaluation
- Outreach angle: "I noticed you mentioned looking for alternatives to [competitor] — here's how we compare"

**10b. Case Study Companies**
- These are PROVEN BUYERS in the category
- They've already committed budget to the problem space
- The decision-maker already said yes once — they'll consider alternatives if you offer something better
- Recommend enriching these companies via SixtyFour to find the current decision-maker

**10c. Testimonial Authors**
- Current users of the competitor who are vocal about it
- They may be satisfied (hard sell) OR they may have moved on since the testimonial
- Good for understanding what the competitor does well (competitive intel)
- If the testimonial mentions specific pain points or limitations, that's an opening

**10d. Product Hunt Activity**
- Commenters asking questions = evaluating the category
- Commenters with negative feedback = potentially dissatisfied
- Upvoters = interested in the space (weaker signal, higher volume)

**10e. HN Discussion**
- Commenters engaging with competitor stories = following the space
- People sharing experiences (positive or negative) = active users or evaluators

**10f. Competitor-Level Analysis**
- Which competitor generates the most signals? (largest audience = most opportunity)
- Which competitor has the most negative signals? (weakest competitor = easiest to displace)
- Are there any surprises? (unknown competitor getting a lot of attention?)

### Step 11: Recommend Next Steps

1. **Switching signals (immediate outreach):**
   - Enrich these people via SixtyFour NOW
   - They're in active evaluation — speed matters
   - Personalize based on what they said ("You mentioned [specific pain]...")

2. **Case study companies (account-based approach):**
   - These companies have budget for this category
   - Use SixtyFour `/enrich-company` to understand them
   - Find the decision-maker (not the person in the case study, who may have left)
   - Outreach angle: "Companies like yours in [industry] are switching to us because..."

3. **PH commenters asking questions:**
   - They're early in evaluation
   - Can reply directly on Product Hunt (public, non-intrusive)
   - Or enrich and reach out privately

4. **Cross-reference with other signals:**
   - If a company appears in competitor case studies AND in job signals (hiring for the role) -> they're invested but possibly scaling beyond the competitor
   - If a person appears in competitor PH comments AND in community signals -> they're deeply researching the space

### Step 12: Ask for Go-Ahead

> "Would you like me to:
> 1. Enrich the switching signal leads immediately (highest priority)
> 2. Enrich the case study companies and find decision-makers
> 3. Cross-reference with data from other signal skills
> 4. Scrape additional competitor pages for more signals
> 5. Export for manual review first"

## Signal Scoring

| Signal Type | Score | Priority |
|---|---|---|
| Switching From/To Competitor | 9 | IMMEDIATE — active evaluation |
| Competitor Case Study Company | 9 | HIGH — proven buyer |
| Competitor Testimonial Author | 8 | HIGH — current/past user |
| PH Launch Commenter | 8 | HIGH — actively evaluating |
| HN Post Commenter | 7 | MEDIUM — interested in space |
| HN Post Author | 6 | MEDIUM — sharing competitor news |
| PH Launch Upvoter | 6 | MEDIUM — interested but passive |
| Tech Press Mention | 6 | MEDIUM — following the space |
| PH Product Maker | 5 | LOW — competitor team member |
| Changelog Engager | 5 | LOW — power user or evaluator |

## Output Schema (Single Sheet)

| Column | Description |
|--------|-------------|
| person_name | Name or username of the person |
| company | Company/headline from their profile |
| signal_type | Internal signal type code |
| signal_label | Human-readable label |
| competitor | Which competitor this signal is about |
| context | Comment text, case study excerpt, or description |
| url | Link to the source (PH comment, HN post, case study page) |
| profile_url | Link to the person's profile (PH, HN) |
| date | Date of the signal |
| signal_score | Weighted score |
| source | Product Hunt API, Hacker News, Manual |
| engagement | Upvotes/points on the post or comment |

## Cost Estimates

| Source | Cost | Notes |
|--------|------|-------|
| Product Hunt API | Free | Developer token (may have name redaction) |
| Product Hunt Apify | ~$5-10/run | Fallback if API names redacted |
| Hacker News | Free | Algolia API |
| Manual scraping | Free | Agent scrapes competitor websites |
| **Typical run** | **$0-10** | Free if PH API works; $5-10 if using Apify |

## Lookback Period

Default: **90 days.** Competitor launches and case studies have a longer shelf life than Reddit posts. Someone who commented on a competitor's PH launch 60 days ago is still a viable lead.
