---
name: meta-ads-campaign-builder
description: >
  End-to-end Meta Ads campaign builder for Facebook and Instagram. Takes ICP + objective,
  generates audience targeting recommendations, ad set structure, copy framework per
  placement, and exports as a campaign brief or structured CSV. Focused on campaign
  architecture, not creative generation.
tags: [ads]
---

# Meta Ads Campaign Builder

Build a complete Meta Ads campaign structure — targeting, ad sets, placements, copy framework, and budget allocation. This skill handles the strategic architecture that determines whether a campaign succeeds before a single ad runs.

**Core principle:** The biggest Meta Ads mistake startups make is boosting a post and calling it a campaign. Proper campaign structure — objective selection, audience layering, placement optimization, and testing framework — is what separates burning money from building pipeline.

## When to Use

- "Set up Meta Ads for our product"
- "Build a Facebook/Instagram ad campaign"
- "Help me structure a Meta campaign"
- "I want to run ads on Facebook — where do I start?"
- "Create a Meta Ads plan for [product launch / lead gen / awareness]"

## Phase 0: Intake

1. **Product name + URL** — What are we advertising?
2. **Campaign objective:**
   - Awareness (brand reach)
   - Traffic (website visits)
   - Lead Generation (in-platform lead forms)
   - Conversions (website sign-ups / purchases)
   - App Installs
3. **ICP** — Target buyer: role, company size, industry, pain points
4. **Monthly budget** — How much for Meta specifically?
5. **Landing page(s)** — Where will traffic go?
6. **Competitor names** — For audience analysis
7. **Existing Meta Pixel / Conversions API?** — Tracking setup status
8. **B2B or B2C?** — Changes targeting strategy significantly

## Phase 1: Campaign Architecture

### 1A: Objective Selection

| Business Goal | Meta Objective | Why |
|--------------|---------------|-----|
| "Get demos/leads" | Lead Generation OR Conversions | Lead Gen = in-app forms (higher volume, lower quality). Conversions = website (lower volume, higher quality) |
| "Drive free trial sign-ups" | Conversions | Optimize for on-site conversion event |
| "Build awareness for launch" | Awareness (Reach) | Maximize eyeballs in target audience |
| "Retarget website visitors" | Conversions | Bring warm traffic back to convert |
| "Drive traffic to content" | Traffic | Optimize for clicks to blog/resource |

### 1B: Campaign Structure

```
Campaign: [Product Name] — [Objective]
├── Ad Set 1: [Audience — Prospecting: Interest-Based]
│   ├── Ad 1: [Primary creative variant]
│   ├── Ad 2: [Secondary creative variant]
│   └── Ad 3: [Tertiary creative variant]
├── Ad Set 2: [Audience — Prospecting: Lookalike]
│   ├── Ad 1-3: [Same creative variants]
├── Ad Set 3: [Audience — Retargeting: Website Visitors]
│   ├── Ad 1-3: [Retargeting-specific creative]
└── Ad Set 4: [Audience — Retargeting: Engagement]
    └── Ad 1-3: [Engagement retargeting creative]
```

### 1C: Competitor Ad Research (Optional)

If competitors were provided, check what they're running on Meta:

```
web_search: site:facebook.com/ads/library "[competitor name]"
web_search: "[competitor name]" Meta Ads examples
```

The Meta Ad Library (facebook.com/ads/library) is publicly accessible — search for competitor pages to see their active ads, formats, and messaging angles. Use findings to inform copy angles and audience strategy.

## Phase 2: Audience Strategy

### 2A: Prospecting Audiences

**Interest-Based Targeting:**

Research relevant interests, behaviors, and demographics:

```
web_search: [product category] Meta Ads targeting options
web_search: [ICP role] Facebook ad audience interests
```

Build audience layers:

| Layer | Targeting | Rationale |
|-------|----------|-----------|
| **Job title / Industry** | [Specific titles, industries] | Direct ICP match |
| **Interests** | [Tools they use, publications they read, topics they follow] | Behavioral proxy |
| **Behaviors** | [Business decision makers, technology early adopters, etc.] | Meta behavioral data |
| **Demographics** | [Age range, education, income (if B2C)] | Narrowing |

**Audience size target:** 500K-2M for prospecting (smaller = expensive, larger = diluted)

**Lookalike Audiences:**

| Source | Lookalike % | Rationale |
|--------|------------|-----------|
| Customer list (emails) | 1% | Closest match to actual buyers |
| Website converters (Pixel) | 1% | People who took action |
| Website visitors (Pixel) | 1-3% | Broader interest signal |
| Page engagers | 3-5% | Widest cold audience |

### 2B: Retargeting Audiences

| Audience | Window | Purpose |
|----------|--------|---------|
| All website visitors | 30 days | Broad retarget |
| Visited pricing/demo page | 14 days | High intent — push to convert |
| Engaged with ads (no click) | 30 days | Awareness → consideration |
| Video viewers (50%+) | 30 days | Warmed but not clicked |
| Lead form openers (not submitted) | 14 days | Abandoned lead capture |

### 2C: B2B-Specific Adjustments

B2B targeting on Meta is harder. Recommended approach:

1. **Upload customer email lists** → Build lookalikes (best B2B signal)
2. **Layer interests with behaviors** — "Business decision makers" + "[specific software interest]"
3. **Use LinkedIn for precision targeting** — Meta for retargeting/awareness
4. **Exclude broad audiences** — No one under 25, exclude students, exclude job seekers (unless relevant)

## Phase 3: Ad Copy Framework

### Per Placement, Generate Copy Structure

| Placement | Headline Limit | Primary Text Limit | Notes |
|-----------|---------------|-------------------|-------|
| **Feed** (FB + IG) | 40 chars | 125 chars visible (500 max) | Most versatile |
| **Stories** (FB + IG) | 40 chars | Minimal text — visual-first | CTA button matters most |
| **Reels** | Overlay text only | Hook in first 3 seconds | Video required |
| **Right column** (FB) | 40 chars | Short | Desktop only — cheap impressions |
| **Audience Network** | 40 chars | 90 chars | Lower quality traffic |

### Copy Framework Per Ad

| Element | Framework | Example |
|---------|-----------|---------|
| **Primary text** | [Hook → Pain/Outcome → Proof → CTA] | "Still prospecting manually? [Product] finds qualified leads while you sleep. 500+ teams use it. Try free →" |
| **Headline** | [Direct benefit or action] | "Automate Your Outbound in 5 Min" |
| **Description** | [Support or specificity] | "No credit card required. Cancel anytime." |
| **CTA button** | [Match to objective] | Learn More / Sign Up / Get Started / Book Demo |

### Generate 3-5 Ad Copy Variants Per Ad Set

| Variant | Angle | Primary Text Hook | Headline |
|---------|-------|------------------|----------|
| 1 | Pain | "[Pain point question]" | "[Solution benefit]" |
| 2 | Outcome | "[Result promise]" | "[Specific metric]" |
| 3 | Social proof | "[Customer result + name]" | "[Join X teams]" |
| 4 | Contrarian | "[Myth busting]" | "[Unexpected claim]" |
| 5 | Product-led | "[Feature highlight]" | "[Feature → benefit]" |

## Phase 4: Budget & Bidding

### Budget Allocation

| Budget Tier | Prospecting | Retargeting | Testing |
|------------|-------------|-------------|---------|
| < $1K/mo | 60% | 30% | 10% |
| $1K-5K/mo | 50% | 30% | 20% |
| $5K+/mo | 45% | 25% | 30% |

### Bidding Strategy

| Objective | Recommended Bid Strategy | When to Switch |
|-----------|------------------------|----------------|
| Conversions | Lowest Cost (start) → Cost Cap (after 50 conversions) | Once you have conversion data |
| Lead Gen | Lowest Cost | Usually sufficient for lead forms |
| Traffic | Lowest Cost per Click | Keep it simple |
| Awareness | Lowest Cost per 1K Impressions | Maximize reach |

### Learning Phase

**Critical:** Each ad set needs ~50 conversions/week to exit learning phase. If your budget can't support that:
- Consolidate ad sets (fewer, larger audiences)
- Use an earlier funnel event as the optimization target (e.g., "Add to Cart" instead of "Purchase")
- Start with Traffic or Landing Page Views objective, switch to Conversions later

## Phase 5: Output Format

```markdown
# Meta Ads Campaign Plan — [Product Name] — [DATE]

## Campaign Overview
- **Objective:** [Selected objective]
- **Monthly budget:** $[X]
- **Target audience:** [ICP summary]
- **Geographic targeting:** [Countries/regions]
- **Placements:** [Automatic / Manual selection]
- **Conversion event:** [What we're optimizing for]

---

## Campaign Structure

[Visual tree]

---

## Audience Targeting

### Ad Set 1: [Name — e.g., "Interest-Based Prospecting"]
- **Audience size:** ~[N]
- **Interests:** [List]
- **Behaviors:** [List]
- **Demographics:** [Age, etc.]
- **Exclusions:** [Existing customers, recent converters]
- **Budget:** $[X]/day

### Ad Set 2: [Lookalike]
...

### Ad Set 3: [Retargeting — Website]
...

---

## Ad Copy

### Ad Set 1 — Ad Variant 1: [Angle Name]
- **Primary text:** "[Copy]"
- **Headline:** "[Copy]"
- **Description:** "[Copy]"
- **CTA:** [Button]
- **Landing page:** [URL]

### Ad Variant 2: ...

---

## Budget & Bidding
[Allocation table + strategy]

---

## Tracking Setup Checklist
- [ ] Meta Pixel installed on all landing pages
- [ ] Conversion events configured (lead, purchase, etc.)
- [ ] Conversions API connected (if server-side tracking)
- [ ] UTM parameters set for GA4 tracking
- [ ] Custom audiences created (website visitors, customer list)
- [ ] Lookalike audiences built

---

## Launch Checklist
- [ ] Campaign structure created in Ads Manager
- [ ] All ad copy uploaded with correct placements
- [ ] Audiences configured with proper exclusions
- [ ] Daily budget caps set
- [ ] A/B test structure confirmed (one variable per test)
- [ ] Conversion tracking verified (test conversion fired)
- [ ] Campaign set to start on [date]

---

## Week 1-2 Monitoring Plan
- Day 1-3: Check delivery — are ads spending? Any disapprovals?
- Day 4-7: Review CTR and CPC — are we in range?
- Day 7-14: First conversion data — any ad set clearly winning/losing?
- Day 14: First optimization pass — pause losers, scale winners
```

Save to `meta-campaign-plan-[YYYY-MM-DD].md` in the current working directory (or user-specified path).

## Cost

| Component | Cost |
|-----------|------|
| Audience research (web search) | Free |
| Competitor ad research (web search) | Free |
| Copy generation + structure | Free (LLM reasoning) |
| **Total** | **Free** |

## Tools Required

- **web_search** — for audience research, targeting ideas, and competitor ad research via Meta Ad Library

## Trigger Phrases

- "Build a Meta Ads campaign for [product]"
- "Set up Facebook Ads for us"
- "Create an Instagram ad campaign"
- "Help me structure Meta Ads for lead gen"
- "Plan a Facebook campaign for our launch"
