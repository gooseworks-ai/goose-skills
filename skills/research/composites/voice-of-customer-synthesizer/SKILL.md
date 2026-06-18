---
name: voice-of-customer-synthesizer
description: >
  Aggregate customer feedback from multiple sources — support tickets, NPS comments,
  Slack messages, G2 reviews, call transcripts, survey responses — into a unified VoC
  report with theme clustering, sentiment analysis, trend detection, and actionable
  recommendations for product, marketing, and CS teams. Chains review-site-scraper for public
  review data.
tags: [research]
---

# Voice of Customer Synthesizer

Turn scattered customer feedback into a single source of truth. Aggregates signals from every source you have, clusters them into themes, and produces a report that product, marketing, and CS teams can actually act on.

**Built for:** Startups where customer feedback lives in 6 different places and nobody has time to synthesize it. The founder says "what are customers saying?" and nobody has a clear answer. This skill produces that answer.

## When to Use

- "What are our customers saying?"
- "Synthesize customer feedback from last quarter"
- "Build a VoC report for the product team"
- "What themes are coming up in customer feedback?"
- "Aggregate feedback from all our channels"

## Phase 0: Intake

### Feedback Sources (provide all you have)
1. **Support tickets** — Export from support tool (CSV: customer, date, subject, description, tags, resolution)
2. **NPS/CSAT survey responses** — Scores + verbatim comments
3. **Slack messages** — Customer channel messages, feedback channels
4. **G2/Capterra reviews** — Will scrape if product is listed (provide product name or URL)
5. **Call/meeting transcripts** — Customer call recordings or notes
6. **Churn exit survey responses** — Why did customers leave?
7. **Feature request log** — Internal tracker of what customers have asked for
8. **Social mentions** — Twitter/LinkedIn/Reddit threads mentioning your product
9. **Email threads** — Notable customer emails (praise or complaints)
10. **In-app feedback** — Any in-product feedback submissions

### Configuration
11. **Time period** — What window to analyze? (Last 30 days, quarter, 6 months)
12. **Product name** — For review scraping and context
13. **Report audience** — Who's reading this? (Product team, exec team, CS team, all)
14. **Focus areas** — Any specific themes to pay attention to? (e.g., "onboarding experience", "pricing feedback", "mobile app")

## Phase 1: Data Collection

### 1A: Internal Data Processing

From the provided inputs, normalize all feedback into a standard format:

```
SOURCE | DATE | CUSTOMER | SEGMENT | FEEDBACK_TEXT | SENTIMENT | CATEGORY
```

Sentiment classification per item:
- **Positive** — Praise, satisfaction, delight
- **Neutral** — Feature request, question, observation
- **Negative** — Complaint, frustration, disappointment
- **Critical** — Churn threat, escalation, anger

### 1B: External Review Scraping (if applicable)

If product is on review platforms:

```
Chain: review-site-scraper for G2, Capterra, Trustpilot
Filter: reviews from the target time period
```

Extract: rating, review text, reviewer role/company size, date, pros, cons.

### 1C: Social Listening (if applicable)

```
Search: "[product name]" feedback OR review OR "switched to" OR "stopped using"
Search: "[product name]" site:reddit.com OR site:twitter.com
```

## Phase 2: Theme Clustering

Group all feedback items into themes using a bottom-up approach:

### Clustering Method

1. Read all feedback items
2. Identify recurring topics (mentioned by 3+ customers or in 3+ sources)
3. Group into theme clusters
4. Rank by frequency AND severity

### Theme Template

```
THEME: [Name — e.g., "Onboarding Complexity"]
FREQUENCY: [N mentions across M sources]
SENTIMENT: [Predominantly positive/neutral/negative]
TREND: [↑ Growing / → Stable / ↓ Declining vs prior period]

REPRESENTATIVE QUOTES:
- "[Exact quote]" — [Source, Customer segment, Date]
- "[Exact quote]" — [Source, Customer segment, Date]
- "[Exact quote]" — [Source, Customer segment, Date]

CUSTOMER SEGMENTS AFFECTED:
- [Segment 1: e.g., "New customers in first 30 days"]
- [Segment 2: e.g., "Enterprise accounts"]

ROOT CAUSE HYPOTHESIS:
[1-2 sentences: Why is this coming up? What's the underlying issue?]

IMPACT:
- On retention: [High/Medium/Low]
- On expansion: [High/Medium/Low]
- On acquisition: [High/Medium/Low]
```

## Phase 3: Analysis

### 3A: Sentiment Overview

```
Overall Sentiment Distribution:
  Positive:  [N] items ([X%])  ████████░░
  Neutral:   [N] items ([X%])  ████░░░░░░
  Negative:  [N] items ([X%])  ██░░░░░░░░
  Critical:  [N] items ([X%])  █░░░░░░░░░
```

### 3B: Source Comparison

| Source | Volume | Avg Sentiment | Top Theme |
|--------|--------|---------------|-----------|
| Support tickets | [N] | [Pos/Neg score] | [Theme] |
| NPS comments | [N] | [Score] | [Theme] |
| G2 reviews | [N] | [Score] | [Theme] |
| Slack | [N] | [Score] | [Theme] |
| Calls | [N] | [Score] | [Theme] |

**Insight:** Different sources often reveal different stories. Support tickets skew negative (problems). Reviews skew bipolar (love/hate). Calls reveal nuance. Note where themes appear across sources for highest confidence.

### 3C: Segment Analysis

| Customer Segment | Dominant Sentiment | Top Request | Key Pain |
|-----------------|-------------------|-------------|----------|
| [New customers] | [Sentiment] | [Request] | [Pain] |
| [Power users] | [Sentiment] | [Request] | [Pain] |
| [Enterprise] | [Sentiment] | [Request] | [Pain] |
| [Churned] | [Sentiment] | [Request] | [Pain] |

### 3D: Trend Detection

Compare against prior period (if available):

| Theme | Prior Period | This Period | Trend | Alert |
|-------|-------------|-------------|-------|-------|
| [Theme 1] | [N mentions] | [N mentions] | [↑X%] | [New/Growing/Stable/Declining] |
| [Theme 2] | ... | ... | ... | ... |

**New themes this period:** [Themes that weren't present before]
**Resolved themes:** [Themes that decreased significantly — things you fixed]

## Phase 4: Recommendations

### For Product Team

| Priority | Theme | Recommendation | Evidence Strength |
|----------|-------|---------------|-------------------|
| P0 | [Theme] | [Specific action] | [N mentions, M sources, includes churn signals] |
| P1 | [Theme] | [Action] | [Evidence] |
| P2 | [Theme] | [Action] | [Evidence] |

### For CS/Support Team

| Action | Theme | Expected Impact |
|--------|-------|----------------|
| [Create help article for X] | [Theme] | Deflect ~[N] tickets/month |
| [Add onboarding step for Y] | [Theme] | Reduce confusion for new users |
| [Proactive outreach to segment Z] | [Theme] | Prevent churn in at-risk segment |

### For Marketing Team

| Action | Theme | Opportunity |
|--------|-------|------------|
| [Use this proof point in messaging] | [Positive theme] | "[Customer quote ready for marketing]" |
| [Address this objection on website] | [Negative theme] | Counter common concern pre-sale |
| [Build case study around X] | [Positive theme] | [N] customers mentioned this win |

## Phase 5: Output Format

```markdown
# Voice of Customer Report — [Period]
Sources analyzed: [list]
Total feedback items: [N]
Date range: [start] — [end]

---

## Executive Summary

[3-5 sentences: What are customers saying? What's the overall sentiment?
What's the single most important thing to act on?]

---

## Sentiment Overview

Positive: [X%] | Neutral: [X%] | Negative: [X%] | Critical: [X%]

Net Sentiment Score: [calculated — % positive minus % negative]
vs Prior Period: [+/- X points]

---

## Top Themes (Ranked by Impact)

### 1. [Theme Name] — [Sentiment] — [N mentions]
**Summary:** [2-3 sentences]
**Key quotes:**
> "[Quote]" — [Source]
> "[Quote]" — [Source]
**Recommended action:** [What to do]
**Owner:** [Product / CS / Marketing]

### 2. [Theme Name] — ...

### 3. [Theme Name] — ...

[Continue for top 5-8 themes]

---

## What Customers Love (Preserve These)

| Strength | Evidence | Marketing Opportunity |
|----------|---------|----------------------|
| [Feature/experience] | "[Quote]" — [N mentions] | [How to use in messaging] |

---

## What Customers Want (Feature Requests)

| Request | Frequency | Segments | Product Priority |
|---------|-----------|----------|-----------------|
| [Feature] | [N mentions] | [Who wants it] | [P0/P1/P2] |

---

## What Causes Pain (Fix These)

| Pain Point | Severity | Churn Risk | Recommended Fix |
|-----------|----------|------------|----------------|
| [Issue] | [High/Med/Low] | [Yes/No] | [Action] |

---

## Trends vs Prior Period

[What's getting better, what's getting worse, what's new]

---

## Team-Specific Action Items

### Product Team
1. [Action] — [Evidence]

### CS Team
1. [Action] — [Evidence]

### Marketing Team
1. [Action] — [Evidence]

---

## Appendix: All Themes Detail

[Full theme cards with all quotes and analysis]
```

Save to `voc-report-[YYYY-MM-DD].md` in the current working directory.

## Scheduling

Run monthly or quarterly:

```bash
0 8 1 */3 * python3 run_skill.py voice-of-customer-synthesizer --client <client-name>
```

## Cost

| Component | Cost |
|-----------|------|
| Review scraping (via review-site-scraper) | ~$0.50-1.00 |
| Web search (social mentions) | Free |
| All analysis and synthesis | Free (LLM reasoning) |
| **Total** | **Free — $1** |

## Tools Required

- **Optional:** `review-site-scraper` for G2/Capterra/Trustpilot reviews
- **Optional:** `twitter-mention-tracker` for social mentions
- **Optional:** `reddit-post-finder` for community feedback
- All analysis is pure LLM reasoning on provided data

## Trigger Phrases

- "What are customers saying?"
- "Build a VoC report"
- "Synthesize our customer feedback"
- "Run voice of customer analysis"
- "Customer feedback summary for [period]"
