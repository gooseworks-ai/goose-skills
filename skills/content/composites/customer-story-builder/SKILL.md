---
name: customer-story-builder
description: >
  Take raw customer inputs — interview transcripts, survey responses, Slack quotes,
  support tickets, review excerpts — and generate a structured case study draft with
  problem/solution/result narrative, pull-quotes, metric callouts, and multi-format
  outputs (full case study, one-pager, social proof snippet, sales deck slide).
  Pure reasoning skill. Use when a product marketing team has customer signal but no
  time to write the story.
tags: [content]
---

# Customer Story Builder

Turn raw customer signal into a polished case study — plus every derivative format you need. One input (messy transcript or quote), all outputs (case study, one-pager, social snippet, deck slide).

**Core principle:** The best customer stories already exist in your support tickets, Slack channels, and call recordings. You just need to extract and structure them.

## When to Use

- "Turn this customer interview into a case study"
- "We have a great Slack quote from [customer] — help me build a story around it"
- "Write a case study for [customer]"
- "I need social proof assets from [customer win]"
- "Package this customer result for the sales team"

## Phase 0: Intake

### Customer Context
1. **Customer name** — Can we use their name publicly? (Named vs. anonymous)
2. **Company description** — Industry, size, stage (1 sentence)
3. **Customer role/title** — Who's the champion?
4. **How long have they been a customer?**

### Raw Input (provide any/all)
5. **Interview transcript** — Full or partial transcript from a customer call
6. **Slack/email quotes** — Specific messages where they praised the product
7. **Survey responses** — NPS comments, CSAT feedback
8. **Support ticket excerpts** — Before/after of a problem solved
9. **Review excerpts** — G2, Capterra, Trustpilot quotes
10. **Metrics** — Any numbers: time saved, revenue impact, efficiency gains, before/after

### Story Angle
11. **Primary use case** — What were they using the product for?
12. **Key transformation** — What changed? (The "before → after" in one sentence)
13. **Output formats needed** — Full case study, one-pager, social snippet, sales slide, or all?

## Phase 1: Extract Story Elements

From the raw inputs, identify and extract:

### The Problem (Before)
- What was the customer's situation before using the product?
- What specific pain were they experiencing?
- What had they tried before? (Manual process, competitor, nothing)
- How bad was it? (Quantify if possible — hours wasted, money lost, deals missed)

### The Decision (Why You)
- Why did they choose your product?
- What alternatives did they consider?
- What was the deciding factor?

### The Solution (How)
- Which specific features/capabilities did they use?
- How did they implement it? (Timeline, effort)
- Any surprising use cases or creative applications?

### The Result (After)
- **Hard metrics** — numbers, percentages, time saved, revenue gained
- **Soft outcomes** — confidence, team morale, process improvements
- **Before/after comparison** — the transformation in concrete terms

### Best Quotes
Pull the 3-5 strongest verbatim quotes from the raw input:
- **Hero quote** — the single most powerful statement (for headlines)
- **Problem quote** — describes the pain vividly
- **Result quote** — describes the outcome with specificity
- **Recommendation quote** — would they recommend? Why?

## Phase 2: Generate Story Outputs

### Output 1: Full Case Study (800-1200 words)

```markdown
# [Headline: Outcome-driven, not product-driven]
*[Subhead: Customer name + one-line result]*

---

## About [Customer]

[2-3 sentences: company, industry, size, what they do]

## The Challenge

[2-3 paragraphs: What was the problem? Why did it matter? What had they tried?]

> "[Problem quote]"
> — [Name], [Title] at [Company]

## Why [Your Product]

[1-2 paragraphs: How did they find you? What made them choose you?]

## The Solution

[2-3 paragraphs: How did they use the product? Which capabilities mattered most?]

> "[Solution/experience quote]"

## The Results

[Results summary with metric callouts]

### Key Metrics
- **[Metric 1]:** [Number + context]
- **[Metric 2]:** [Number + context]
- **[Metric 3]:** [Number + context]

> "[Result quote]"

## What's Next

[1 paragraph: Future plans, expansion, what they're excited about]

---

**Industry:** [X] | **Company size:** [X] | **Use case:** [X] | **Product:** [X]
```

### Output 2: One-Pager (Sales Leave-Behind)

```markdown
# [Customer Name]: [Headline Result]

**Challenge:** [2 sentences]
**Solution:** [2 sentences — what they use and how]
**Results:**
- [Metric 1]
- [Metric 2]
- [Metric 3]

> "[Hero quote]"
> — [Name], [Title]

[CTA: Learn more / Request a demo]
```

### Output 3: Social Proof Snippets

**For website testimonial section:**
```
"[Short, punchy quote — max 2 sentences]"
— [Name], [Title] at [Company]
[Result: X% improvement in Y]
```

**For LinkedIn post:**
```
[Customer Name] just shared their results:

→ [Metric 1]
→ [Metric 2]
→ [Metric 3]

"[Quote]"

Here's their story: [link]
```

**For cold email insert:**
```
[Company in their industry] saw [key metric] after switching to [Product].

"[Short quote about the result]" — [Name], [Title]
```

### Output 4: Sales Deck Slide Content

```
Slide title: "[Customer] — [Key Result]"

Left side:
- Challenge: [1 line]
- Solution: [1 line]
- Result: [1 line with metric]

Right side:
> "[Hero quote]"
— [Name], [Title]

[Customer logo]
```

### Output 5: Metric Callout Cards

For website or marketing collateral:
```
[BIG NUMBER]
[Label — e.g., "hours saved per week"]
— [Customer Name]
```

Generate 2-3 of these from the strongest metrics.

## Phase 3: Story Quality Check

Before finalizing, verify:

- [ ] **Specificity** — Are results concrete, not vague? ("3x pipeline" > "improved results")
- [ ] **Credibility** — Is the customer named? Is the metric believable?
- [ ] **Relevance** — Does this story match your ICP? Will prospects see themselves?
- [ ] **Permission** — Flag if customer approval is needed before publishing
- [ ] **Freshness** — Are the results recent? (>12 months old = less impactful)

## Phase 4: Output

Save all assets to `clients/<client-name>/product-marketing/customer-stories/[customer-slug]/`:
- `case-study-full.md` — Complete case study
- `one-pager.md` — Sales leave-behind
- `social-snippets.md` — All social proof formats
- `slide-content.md` — Deck slide content
- `raw-inputs.md` — Original source material (for reference)

## Cost

| Component | Cost |
|-----------|------|
| All story generation | Free (LLM reasoning) |
| **Total** | **Free** |

## Tools Required

None. Pure reasoning skill. Takes raw text input and produces structured outputs.

## Trigger Phrases

- "Turn this transcript into a case study"
- "Build a customer story for [customer]"
- "Package [customer]'s results as social proof"
- "Run customer story builder for [customer]"
