---
name: competitor-intel
description: >
  Competitor intelligence system. Research competitors across web, Reddit, Twitter/X,
  LinkedIn, and blogs. Build deep competitor profiles, monitor content and positioning
  changes, track what gets traction, and identify competitive gaps. Covers data collection,
  content tracking, and strategy analysis. Pure research skill — uses web search, web fetch,
  and optionally Apify for social scraping. No scripts required.
---

# Competitor Intelligence

Research and monitor competitors across multiple channels. Build profiles, track changes, and translate competitor moves into strategic recommendations.

**Three layers:**
1. **Data collection** — Research competitor activity across web, Reddit, Twitter/X, LinkedIn, and blogs
2. **Content tracking** — What competitors publish, which topics get engagement, where you have content gaps
3. **Strategy analysis** — What competitor moves mean for your positioning, pricing, and messaging

## When to Use

- "Research [competitor] for me"
- "What are our competitors doing?"
- "Build a competitor profile for [company]"
- "Monitor competitor content and positioning"
- "Competitive landscape analysis"

## Phase 0: Intake

1. **Which competitors?** — Ask the user for 2-5 competitor names + websites
2. **Your company context** — What do you sell? Who's your ICP? What's your positioning?
3. **Focus areas** — Everything, or specific focus? (pricing, content, product, messaging, hiring)
4. **Depth** — Quick scan (30 min) or deep dive (comprehensive)?

## Phase 1: Competitor Profile Research

For each competitor, research across these dimensions using web search and web fetch:

### Company Overview
- What do they do? (fetch their homepage, about page)
- Who's their ICP? (check their marketing copy, case studies)
- What's their pricing model? (fetch pricing page)
- Funding stage and size? (web search: "[company] funding")
- Key leadership? (web search: "[company] founders", "[company] leadership team")

### Product & Positioning
- Core value proposition (from homepage hero section)
- Key features and differentiators (from features/product page)
- How do they position against alternatives? (check /vs/ pages, comparison content)
- Recent product launches (web search: "[company] launch OR new feature OR announcement 2026")

### Content & Marketing
- Blog topics and frequency (fetch /blog, check RSS feed)
- Social presence — LinkedIn company page, Twitter/X handle, founder's LinkedIn
- Content themes — what topics do they write about most?
- Top-performing content (look for social share counts, engagement indicators)

### Customer Evidence
- Customer logos on their site
- Case studies (fetch /customers or /case-studies)
- G2/Capterra reviews — overall rating, common praise, common complaints (web search: "[company] G2 reviews")
- Testimonial quotes from their marketing

### Competitive Signals
- Who do THEY position against? (check their /vs/ and /alternatives/ pages)
- Job postings — what roles are they hiring for? (web search: "[company] careers" or fetch /careers)
- Partnerships and integrations (fetch /integrations or /partners)

### Optional: Social Monitoring (requires APIFY_API_TOKEN)

If Apify is available, scrape deeper data:
- **Reddit mentions:** Search for competitor name across relevant subreddits
- **Twitter/X activity:** Track competitor's account and founder's recent posts
- **LinkedIn posts:** Track founder/CMO LinkedIn content and engagement

Without Apify, web search covers the basics — just less structured.

## Phase 2: Competitor Profile Output

For each competitor, produce a structured profile:

```markdown
# Competitor Profile: [Company Name]
**Last updated:** [DATE]
**Website:** [URL]

## Overview
- **What they do:** [1-2 sentences]
- **ICP:** [who they sell to]
- **Stage:** [funding, headcount]
- **Pricing:** [model + price points]

## Positioning
- **Value prop:** [their core claim]
- **Key differentiators:** [what they emphasize]
- **Positioning against us:** [how they frame the comparison, if any]

## Product
- **Core features:** [list]
- **Recent launches:** [last 6 months]
- **Integrations:** [key partners]

## Content & Marketing
- **Blog frequency:** [posts/month]
- **Top topics:** [themes they write about]
- **Social activity:** [LinkedIn, Twitter/X presence and engagement level]
- **Content strategy:** [what type of content dominates — thought leadership, SEO, product marketing]

## Customer Evidence
- **Notable customers:** [logos]
- **G2/Capterra rating:** [score + review count]
- **Common praise:** [what customers love]
- **Common complaints:** [what customers dislike]

## Signals
- **Hiring:** [what roles, what it signals]
- **Partnerships:** [recent partnerships]
- **News:** [recent press/announcements]

## Strengths & Weaknesses (vs. You)
### Where they're strong:
- [strength 1]
- [strength 2]

### Where they're weak:
- [weakness 1]
- [weakness 2]

### Your opportunity:
- [gap you can exploit]
```

## Phase 3: Competitive Landscape Summary

After profiling all competitors, produce a landscape view:

```markdown
# Competitive Landscape — [Your Company] — [DATE]

## Positioning Map
| Company | Core Claim | ICP Focus | Price Point | Key Differentiator |
|---------|-----------|-----------|-------------|-------------------|
| You | [claim] | [ICP] | [price] | [differentiator] |
| Comp 1 | [claim] | [ICP] | [price] | [differentiator] |
| Comp 2 | ... | ... | ... | ... |

## Content Comparison
| Company | Blog Frequency | Top Topics | Social Presence |
|---------|---------------|-----------|-----------------|
| You | [X/month] | [topics] | [LinkedIn/Twitter activity] |
| Comp 1 | [X/month] | [topics] | [activity] |

## Feature Comparison
| Feature | You | Comp 1 | Comp 2 | Comp 3 |
|---------|-----|--------|--------|--------|
| [feature 1] | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |

## Key Takeaways
1. [Most important competitive insight]
2. [Second]
3. [Third]

## Recommended Actions
1. [What to do based on competitive gaps]
2. [Positioning adjustment]
3. [Content/feature opportunity]
```

## Phase 4: Ongoing Monitoring (Optional)

For recurring competitive tracking, set up a periodic review:

**Monthly check:**
- Re-fetch competitor pricing pages (detect changes)
- Check for new blog posts and content themes
- Search for recent news, funding, product launches
- Update profiles with changes
- Produce a "what changed" summary

**What to monitor:**
- Pricing page changes (compare against last snapshot)
- New /vs/ or /alternatives/ pages (competitive positioning shifts)
- Blog topic shifts (new content themes)
- Job posting patterns (hiring signals)
- New customer logos (market momentum)

## Cost

| Component | Cost |
|-----------|------|
| Web search + fetch (all research) | Free |
| Apify social scraping (optional) | ~$0.50-2.00 per competitor |
| Analysis | Free (LLM reasoning) |
| **Total per competitor (baseline)** | **Free** |
| **Total per competitor (with Apify)** | **~$0.50-2.00** |

## Dependencies

- Web search and web fetch capabilities (always available)
- `APIFY_API_TOKEN` (optional — for Reddit/Twitter/LinkedIn scraping)
