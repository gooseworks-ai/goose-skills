---
name: launch-positioning-builder
description: >
  Research competitors, analyze their messaging, and generate a positioning document
  with category definition, differentiation claims, value propositions, and proof points.
  Chains web research, competitor site analysis, and review mining to produce a positioning
  doc ready for website copy and sales deck use. Use when a product marketing team needs
  to define or refresh positioning ahead of a launch, rebrand, or competitive shift.
tags: [brand]
---

# Launch Positioning Builder

Research the competitive landscape and produce a complete positioning document — category definition, differentiation claims, value props, proof points, and messaging hierarchy. Output is directly usable in website copy, sales decks, and investor materials.

**Built for:** First PMM hire at a seed/Series A startup, or a founder wearing the product marketing hat. The output should be opinionated, not a generic template.

## When to Use

- "Help me position [product] against [competitors]"
- "We need a positioning doc before our launch"
- "How should we differentiate from [competitor]?"
- "Rewrite our positioning — it's too generic"
- "What category should we create or own?"

## Phase 0: Intake

1. **Product name + URL** — What are you positioning?
2. **One-sentence pitch** — How do you describe what you do today?
3. **Top 2-3 competitors** — Names + URLs. Who does your buyer compare you to?
4. **ICP** — Title, company type, stage (e.g., "Head of Growth at Series A B2B SaaS")
5. **Key differentiators** — What do you believe makes you different? (even if not yet articulated)
6. **Existing proof points** — Customer wins, metrics, logos, quotes (anything you have)
7. **Positioning trigger** — Why now? (new launch, competitive pressure, rebrand, entering new segment)

## Phase 1: Competitive Landscape Research

### 1A: Competitor Website Analysis

For each competitor, research and extract:

```
Search: "[competitor name]" site:[competitor-url]
Search: "[competitor name]" positioning OR "we help" OR "the only"
Fetch: competitor homepage, pricing page, about page
```

Extract from each competitor:
- **Tagline / hero copy** — their primary claim
- **Category language** — what category do they put themselves in?
- **Key differentiators** — what do they emphasize?
- **Proof points** — customer logos, metrics, case studies
- **Pricing model** — free trial, freemium, enterprise, usage-based
- **Target audience language** — who do they say they serve?

### 1B: Review Mining (if available)

If competitors have G2/Capterra reviews, scan for:
- What customers praise (their perceived strengths)
- What customers complain about (your potential wedge)
- How customers describe the category

### 1C: Ad Copy Analysis (optional)

Search for competitor ad copy:
```
Search: "[competitor name]" advertisement OR "sponsored"
```

Ad copy reveals what competitors believe converts — their sharpest positioning.

## Phase 2: Positioning Framework

Build the positioning doc using April Dunford's framework adapted for early-stage:

### 2A: Category Definition

| Approach | When to Use | Example |
|----------|-------------|---------|
| **Existing category** | You compete head-to-head | "CRM for startups" |
| **Subcategory** | You serve a niche better | "AI-native sales engagement" |
| **New category** | You do something genuinely different | "Revenue orchestration platform" |

**Decision criteria:**
- If your ICP already searches for the category → use existing or subcategory
- If you'd spend 50% of sales calls explaining the category → don't create a new one
- If no existing category captures what you do → create one, but keep it intuitive

### 2B: Competitive Alternatives

What would your customer do if you didn't exist?
- Direct competitors (same category)
- Adjacent tools (partial overlap)
- Manual process (spreadsheets, hiring, doing nothing)

### 2C: Unique Attributes → Value Props

Map each differentiator to a customer value:

| Unique Attribute | Value to Customer | Proof Point |
|-----------------|-------------------|-------------|
| [What you have] | [Why they care] | [Evidence] |
| [What you have] | [Why they care] | [Evidence] |

### 2D: Messaging Hierarchy

| Level | Message | Use Where |
|-------|---------|-----------|
| **Positioning statement** | For [ICP] who [pain], [Product] is the [category] that [key differentiator]. Unlike [alternative], we [unique value]. | Internal alignment, PR |
| **Primary headline** | [Outcome-driven claim] | Homepage hero, ads |
| **Supporting messages (3)** | [Value prop 1], [Value prop 2], [Value prop 3] | Feature sections, sales deck |
| **Proof line** | [Metric or customer quote] | Below the fold, case studies |

## Phase 3: Competitive Positioning Map

Create a 2x2 positioning matrix:

```
                    [Dimension A: e.g., Ease of Use]
                    High
                      |
         [You]        |       [Competitor A]
                      |
    ──────────────────┼──────────────────
                      |
      [Competitor C]  |       [Competitor B]
                      |
                    Low
        Low ──────────────────────── High
                    [Dimension B: e.g., Enterprise-readiness]
```

Choose dimensions where you win on at least one axis. Avoid dimensions where you lose on both.

## Phase 4: Output Format

```markdown
# Positioning Document — [Product Name]
Created: [DATE] | Trigger: [launch/rebrand/competitive shift]

---

## Positioning Statement

For [ICP] who [pain point],
[Product] is the [category]
that [key differentiator].
Unlike [primary alternative],
we [unique value that matters to ICP].

---

## Category

**Category:** [name]
**Approach:** [Existing / Subcategory / New]
**Rationale:** [1-2 sentences on why this framing]

---

## Competitive Landscape

### Direct Competitors
| Competitor | Positioning | Strength | Weakness (your wedge) |
|-----------|-------------|----------|----------------------|
| [Name] | "[Their tagline]" | [What they do well] | [Where they fall short] |

### Alternative Solutions
- [Manual process / spreadsheet / hiring]
- [Adjacent tool category]

---

## Value Propositions

### Primary: [Headline claim]
[2-sentence explanation + proof point]

### Secondary A: [Value prop]
[2-sentence explanation + proof point]

### Secondary B: [Value prop]
[2-sentence explanation + proof point]

---

## Proof Points Library

### With Metrics
- "[Customer quote with number]" — [Source]
- [Metric]: [claim] — [evidence]

### Logos & Social Proof
- [Customer logos to feature]
- [Review platform ratings]

---

## Messaging by Audience

### [Persona 1: e.g., Founder/CEO]
- **Pain:** [What keeps them up at night]
- **Hook:** "[Message that resonates]"
- **Proof:** [Evidence they'd trust]

### [Persona 2: e.g., Head of Growth]
- **Pain:** ...
- **Hook:** ...
- **Proof:** ...

---

## Positioning Map

[2x2 matrix with chosen dimensions]

---

## Where to Deploy This Positioning

| Asset | Key Message | Priority |
|-------|------------|----------|
| Homepage hero | [Primary headline] | P0 — update now |
| Sales deck slide 2-3 | [Positioning statement] | P0 |
| LinkedIn company tagline | [One-liner] | P1 |
| Cold email opening line | [Pain hook] | P1 |
| G2 profile description | [Category + differentiator] | P2 |

---

## What We're NOT Saying

(Guardrails to keep messaging consistent)
- We don't claim to be [X] — that's [competitor]'s territory
- We don't target [segment] — outside our ICP
- We avoid the word "[buzzword]" — overused, means nothing
```

Save to the current working directory as `positioning-[YYYY-MM-DD].md` (or user-specified path).

## Cost

| Component | Cost |
|-----------|------|
| Web research (competitor sites) | Free |
| Review mining (if using review-site-scraper) | ~$0.50-1.00 |
| All analysis and positioning | Free (LLM reasoning) |
| **Total** | **Free — $1** |

## Tools Required

- **web_search** — for competitor research
- **fetch_webpage** — for analyzing competitor sites
- **Optional:** `review-site-scraper` for review-based insights

## Trigger Phrases

- "Build a positioning doc for [product]"
- "How should we position against [competitor]?"
- "We need positioning before our launch"
- "Run the positioning builder for [client]"
