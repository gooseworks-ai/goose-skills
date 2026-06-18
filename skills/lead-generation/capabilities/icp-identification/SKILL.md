---
name: icp-identification
description: >
  Research a company or idea, define the Ideal Customer Profile, and route to
  the right next step — either mapping the TAM or finding leads/prospects directly.
  The entry point for any "find me leads", "map my market", or "who should I sell to" request.
  Auto-loads when a user provides a company URL or idea and asks for leads or market mapping.
tags: [research]
---

# ICP Identification

Research a company or idea, define the Ideal Customer Profile, and route to the right next step. This is the **entry point** for any "find me leads" or "map my market" request — it sits upstream of all lead-finding and TAM-building skills and ensures we understand the business, define the target, and pick the right approach before executing.

## When to Auto-Load

- User says "find me leads", "help me find prospects", "who should I sell to", or similar
- User provides a company URL and asks for leads/prospects
- User describes an idea/product and wants to find customers
- User asks "who is my ICP?" or "help me define my target market"
- User asks to "map my TAM", "size my market", or "build a target account list"

## Phase 0: Gather Context

When triggered, collect these inputs from the user:

1. **Company URL** or describe your idea/product
2. **What does the product/service do?** (skip if URL provided — we'll research)
3. **Who are your current customers?** (if any — ask for specific company names, titles of buyers/champions, and how they found the product. These examples calibrate search filters far better than abstract descriptions.)
4. **What's your price point / deal size?** (helps determine buyer seniority)
5. **Who is NOT a fit?** — Ask about industries, company types, company sizes, or roles that are explicitly wrong for this product. Prompt with examples: *"Are there industries that definitely don't work? Company sizes too small or too large? Titles that look right but never buy?"* Even rough exclusions prevent noisy search results downstream.

If the user provides a company URL, research it using web tools before asking follow-up questions. Don't ask questions you can answer from the website.

**Intake principle:** Every answer here should help you populate a search filter (title, industry, headcount range, region) or an exclusion filter (titles to skip, industries to ignore, company types to avoid). If a user's answer is too vague to become a filter value, probe deeper. Don't ask generic strategy questions — ask questions that sharpen the search.

## Phase 1: Research

Using web search and the company URL, investigate:

1. **Company research** — What do they sell? Who do they sell to? Value proposition. Pricing model.
2. **Market analysis** — What category/space? Market size signals. Growth stage.
3. **Competitor identification** — Who are the top 3-5 competitors? How are they positioned?
4. **Buyer signals** — Who buys this kind of product? What titles? What triggers a purchase?

**Output:** Synthesize findings into a brief (5-10 bullet points) and present to the user for validation. Example:

> **Research Summary:**
> - Company sells X to Y
> - Main competitors: A, B, C
> - Typical buyer: VP/Director level at mid-market companies
> - Purchase triggers: scaling team, switching from legacy tool, new budget cycle
> - Pricing suggests mid-market / enterprise buyer

Ask the user: *"Does this match your understanding? Anything to correct or add?"*

## Phase 2: Define ICP

Based on research + user input, propose a structured ICP:

| Dimension | Recommendation | Reasoning |
|-----------|---------------|-----------|
| **Job Titles** | e.g., VP Sales, Head of Revenue Ops | Direct buyers of sales tools |
| **Seniority** | e.g., VP, Director | Budget authority at this deal size |
| **Company Size** | e.g., 51-200 employees | Sweet spot for this product |
| **Industry** | e.g., SaaS, FinTech | Highest product-market fit |
| **Region** | e.g., US, SF Bay Area | Current market focus |
| **Signals** | e.g., recently hired, posted about pain | Timing indicators |

Present as a table. Ask user to **confirm, adjust, or refine**. Iterate until they approve.

### Exclusion Criteria (Equally Important)

Define what to filter OUT. These map directly to "not in" / exclusion parameters in search tools:

| Dimension | Exclude | Reasoning |
|-----------|---------|-----------|
| **Titles to exclude** | e.g., Intern, Coordinator, Assistant, Student | No budget authority or decision power |
| **Industries to exclude** | e.g., Government, Education, Non-profit | Product doesn't serve these verticals |
| **Company types to exclude** | e.g., Agencies, consultancies, sole proprietors | Not a fit for the product model |
| **Company size to exclude** | e.g., 1-10 employees, 10,000+ | Too small to need it / too large to buy it |
| **Specific companies to exclude** | e.g., existing customers, competitors, partners | Already in pipeline or not appropriate |

Present exclusions alongside the inclusion table. Ask user to confirm both.

**Important:** The ICP definition becomes the input context for all downstream skills. Be specific — vague ICPs produce vague leads.

**Search precision warning:** Downstream tools (Apollo and similar databases) match on the exact title strings, industry tags, and keywords you pass them. Overly broad or stuffed filters (e.g., 15 keyword tags) return noisy results. Each filter value should be specific and intentional. When in doubt, use fewer, more precise values and let exclusions do the narrowing.

## Phase 3: Choose Path — TAM or Leads?

Once ICP is locked, ask the user:

> *"Now that we have the ICP defined, would you like to:*
> 1. **Map your TAM** — Build a scored Total Addressable Market: discover all companies matching your ICP, score and tier them, and build a persona watchlist for the best-fit accounts. This is the strategic, market-first approach.
> 2. **Find leads/prospects now** — Go straight to finding individual people to contact. This is the tactical, results-now approach.
>
> *TAM mapping is best when you want a full picture of your market, ongoing signal monitoring, and a systematic account-based approach. Lead finding is best when you need contacts to reach out to immediately."*

### Path A: Map the TAM

If the user chooses TAM mapping, hand off to the TAM builder skill with the ICP definition. The TAM builder will:
1. Search for companies matching the ICP filters
2. Score and tier them by fit
3. Build a persona watchlist for best-fit accounts

**When to recommend TAM path:**
- User wants a systematic, account-based approach
- Market is well-defined but user doesn't know which companies are in it
- User plans to run ongoing outbound (not a one-shot campaign)
- User wants to prioritize accounts by fit before reaching out
- User asks about "market sizing", "target account list", or "account-based"

### Path B: Find Leads/Prospects → Lead-Finding Skills

If the user chooses lead finding, present ranked strategies based on what's available in the skill graph:

| # | Strategy | Skill Used | Best For | Effort |
|---|----------|-----------|----------|--------|
| 1 | **Database search** — Search people DB by title, industry, region, company size | `apollo-lead-finder` | High volume, broad ICP | Low |
| 2 | **Pain language** — Find people posting about problems your product solves | `pain-language-engagers` | Warm leads with expressed need | Medium |
| 3 | **Competitor audiences** — Find people engaging with competitor content | `competitor-post-engagers` | Leads already in-market | Medium |
| 4 | **KOL audiences** — Find leads from industry influencer audiences | `kol-discovery` → `kol-engager-icp` | Niche, high-quality leads | Medium |
| 5 | **Hiring signals** — Find companies hiring roles your product replaces/supports | `job-posting-intent` | Companies with budget & urgency | Medium |
| 6 | **Event attendees** — Find leads from industry events | `get-qualified-leads-from-luma` | Engaged, in-market leads | Low |
| 7 | **Apollo database search** — Search Apollo's 210M+ contact database (free search, paid enrichment) | `apollo-lead-finder` | Broadest coverage, cost-controlled enrichment | Low |

**Recommendation logic:**
- Early-stage / broad ICP → Start with **database search** (volume) + **pain language** (warmth)
- Established with known competitors → **Competitor audiences** + **database search**
- Niche market → **KOL audiences** + **event attendees**
- High urgency / budget signals matter → **Hiring signals** + **database search**

Recommend 1-2 strategies based on the ICP and company stage. Ask user to pick which to execute.

## Phase 4: Hand Off

Once user selects their path and strategy(ies):

1. **Load the corresponding skill's `SKILL.md`**
2. **Pass the ICP definition as context** — titles, industries, regions, company size, signals
3. **Begin that skill's Phase 0 (intake)** with ICP already populated — don't re-ask questions the ICP already answers
4. **If multiple strategies selected**, execute sequentially — complete one before starting the next

### Handoff format

When transitioning to a downstream skill, carry forward:

```
ICP Context (from icp-identification):

Include:
- Titles: [list]
- Seniority: [list]
- Company size: [range]
- Industries: [list]
- Region: [list]
- Signals: [list]
- Product: [what the user sells]
- Competitors: [identified competitors]

Exclude:
- Titles to exclude: [list]
- Industries to exclude: [list]
- Company types to exclude: [list]
- Company size to exclude: [ranges]
- Companies to exclude: [specific names, if any]
```

This ensures downstream skills skip redundant intake questions and start executing immediately. Both inclusion and exclusion criteria must be passed — exclusions are what prevent noisy search results.
