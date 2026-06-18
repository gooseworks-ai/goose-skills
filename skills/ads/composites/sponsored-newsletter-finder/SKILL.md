---
name: sponsored-newsletter-finder
description: >
  Discover newsletters in a target niche relevant to your ICP, evaluate audience fit,
  estimate reach and CPM, and output a ranked shortlist of sponsorship opportunities.
  Uses web search to find newsletters, then scores each against ICP alignment criteria.
  Use when a marketing team wants to reach an existing engaged audience for less than
  the cost of building their own, or when testing a new channel before committing.
tags: [ads]
---

# Sponsored Newsletter Finder

Find newsletters your ICP reads, evaluate their audience fit, and produce a ranked shortlist ready for outreach. Cheaper and faster than building your own list from scratch — newsletters already have the trust and the audience.

**Best for:** Seed/Series A teams with $500-5,000/month to test a paid distribution channel. Not for companies without budget or companies targeting a mass-market ICP.

## When to Use

- "Find newsletters I can sponsor to reach [ICP]"
- "What newsletters does my target audience read?"
- "I want to test newsletter sponsorship — where should I start?"
- "Give me a ranked list of newsletters for [industry/role]"

## Phase 0: Intake

1. **ICP definition** — Target title, industry, company stage (e.g., "VP of Sales at Series A-C B2B SaaS companies")
2. **Monthly budget** — Rough range for sponsorships (e.g., "$1,000-3,000/month")
3. **Geography** — US only, global, or specific region?
4. **Campaign goal** — Awareness (brand mention) or direct response (signup/demo)?
5. Any newsletters you're already subscribed to or know about in this space? (Seeds the search)

## Phase 1: Discovery via Web Search

Search for newsletters using multiple angles:

### Search Queries to Run

```
"[ICP industry] newsletter" sponsorship
"[ICP role] newsletter" site:substack.com OR site:beehiiv.com
"best newsletters for [ICP role/industry]"
"[ICP industry] newsletter" "advertise" OR "sponsor"
"[competitor company] newsletter sponsorship" (find where competitors are already advertising)
newsletter directory "[ICP industry]"
```

Also search curated newsletter directories:
- `newsletter.directory` for category browsing
- `paved.com` for sponsorship marketplace listings
- `swapstack.co` for newsletter ad network
- `sparkloop.co` for referral partnerships

Collect: newsletter name, URL, estimated subscribers, topics covered, sponsorship page URL if found.

## Phase 2: Evaluate Each Newsletter

For each discovered newsletter, score across 5 dimensions (1-5 each):

### Scoring Criteria

| Dimension | 1 | 3 | 5 |
|-----------|---|---|---|
| **Audience match** | Unrelated audience | Partial overlap | Direct ICP match |
| **Reach** | <1,000 subscribers | 5,000-20,000 | 20,000+ |
| **Engagement** | No open rate data | ~30-40% open rate | 40%+ open rate |
| **Niche specificity** | Generic business newsletter | Industry newsletter | Role-specific newsletter |
| **Sponsor accessibility** | No sponsor info found | Inquiry required | Clear pricing / marketplace listing |

**Total score: /25. Shortlist newsletters scoring ≥ 15.**

### Data Points to Find for Each Newsletter

Search for:
- Subscriber count (often on the "About" or "Advertise" page)
- Open rate (sometimes disclosed, often ~40-50% for niche newsletters)
- CPM or flat sponsorship rate
- Audience demographics (if disclosed)
- Past sponsors (who's already buying? = validation)
- Send frequency (weekly, daily, etc.)

For newsletters with no pricing page, estimate CPM from industry benchmarks:
- **Micro** (<5k subs): $50-150 flat rate
- **Small** (5k-20k subs): $100-500 flat rate
- **Mid** (20k-50k subs): $500-2,000 flat rate
- **Large** (50k+ subs): $1,000-10,000 flat rate

## Phase 3: Competitive Intelligence

Check if known competitors are sponsoring newsletters in this space:

```
Search: "[competitor name]" "sponsored by" newsletter
Search: "[competitor name]" advertisement site:substack.com
```

If a competitor is sponsoring a newsletter, it's validated audience fit — flag it as high priority.

## Phase 4: Output Format

```markdown
# Newsletter Sponsorship Shortlist — [DATE]
ICP: [description] | Budget: [range] | Goal: [awareness/direct response]

---

## Tier 1 — High Priority (Score 20-25)

### 1. [Newsletter Name]
- **URL:** [url]
- **Subscribers:** [N] (~[source])
- **Open rate:** [X%] (disclosed/estimated)
- **Audience:** [description]
- **Send frequency:** [weekly/daily/etc]
- **Sponsorship type:** [dedicated / classified / banner mention]
- **Estimated cost:** $[X] per send
- **Estimated CPM:** $[X]
- **Past sponsors:** [list — competitive validation]
- **Score:** [X/25]
- **Fit rationale:** [1-2 sentences on why this is a strong match]
- **Sponsor page:** [url or "inquiry required"]

### 2. [Newsletter Name]
...

---

## Tier 2 — Worth Testing (Score 15-19)

### 1. [Newsletter Name]
...

---

## Tier 3 — Watchlist (Score 10-14)
(Monitor these — audience fit is good but reach or accessibility is limited)

---

## Where Competitors Are Already Advertising

| Newsletter | Competitor | Notes |
|-----------|-----------|-------|
| [Name] | [Competitor] | Validated ICP match |
...

---

## Budget Allocation Recommendation

Given budget of [X]/month and campaign goal of [goal]:

| Newsletter | Send frequency | Cost per send | Sends/month | Monthly cost |
|-----------|---------------|--------------|-------------|-------------|
| [Name] | Weekly | $[X] | 4 | $[X] |
| [Name] | Bi-weekly | $[X] | 2 | $[X] |
| **Total** | | | | $[X] |

**Recommended test:** Start with [Newsletter 1] for 2 sends to validate conversion rate before expanding.

---

## Outreach Templates

### Cold outreach to newsletter with no sponsor page:

Subject: Sponsoring [Newsletter Name] — [Your Company]

> Hi [Name],
>
> I'm [Name] from [Company] — we [one-line pitch]. We're fans of [Newsletter Name] and think our audience overlap is strong: [ICP match rationale].
>
> Would you be open to a sponsored mention or dedicated send? Happy to share what we're looking for and see if it's a fit.
>
> [Name]

### Request for media kit:

> Hi [Name] — big fan of [Newsletter Name]. Could you share your media kit and current sponsorship rates? [Your Company] is evaluating newsletter partnerships for Q[X].
```

Save to `newsletter-sponsors-[YYYY-MM-DD].md` in the current working directory (or user-specified path).

## Cost

| Component | Cost |
|-----------|------|
| Web search (discovery phase) | Free |
| All analysis and scoring | Free (LLM reasoning) |
| **Total** | **Free** |

## Tools Required

- **web_search** — for newsletter discovery and verification
- No API keys required

## Trigger Phrases

- "Find newsletters I can sponsor to reach [ICP]"
- "What newsletters does [title/industry] read?"
- "Run newsletter sponsorship research for [client]"
- "I want to test paid newsletter distribution — where should I start?"
