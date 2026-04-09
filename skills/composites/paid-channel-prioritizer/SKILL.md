---
name: paid-channel-prioritizer
description: >
  For founders who don't know where to start with paid ads. Analyzes ICP, competitor
  ad presence, budget constraints, and product type to recommend which 1-2 paid channels
  to start with and provides a 90-day ramp plan. Prevents the common mistake of
  spreading a small budget across too many platforms.
tags: [ads]
---

# Paid Channel Prioritizer

Answer the question every early-stage founder asks: "Where should I run ads?" This skill analyzes your product, ICP, competitors, and budget to recommend the right 1-2 channels to start with — plus a 90-day plan to get there.

**Core principle:** A $3K/month ad budget split across Google, Meta, LinkedIn, and TikTok means $750/channel — not enough for any platform to learn and optimize. This skill picks the best 1-2 channels and concentrates budget where it'll compound fastest.

## When to Use

- "Where should I run ads?"
- "Which ad platform is best for us?"
- "I have $X/month for ads — where should I spend it?"
- "Should I do Google Ads or Facebook Ads?"
- "Help me choose a paid channel"

## Phase 0: Intake

1. **Product name + URL** — What are you selling?
2. **Business model** — SaaS / Marketplace / E-commerce / Service / App
3. **B2B or B2C?** — Drives channel selection heavily
4. **ICP** — Who are you selling to? (Role, company size, industry)
5. **Monthly ad budget** — Be honest — how much can you spend?
6. **Average deal size / LTV** — What's a customer worth?
7. **Current acquisition channels** — How are you getting customers today? (Organic, referral, outbound, etc.)
8. **Competitor names** — 3-5 competitors
9. **Landing page ready?** — Do you have a dedicated LP or just a homepage?
10. **Conversion goal** — Free trial / Demo / Purchase / Lead magnet download

## Phase 1: Channel Scoring

### 1A: Buyer Intent Analysis

Where does your buyer look when they have a problem?

| Buyer Journey Stage | Likely Channel | Signal |
|--------------------|---------------|--------|
| "I need a tool for X" (active search) | **Google Search** | High-intent keywords exist |
| "I'm browsing and see something relevant" (passive) | **Meta (FB/IG)** | Visual/emotional product |
| "I need to solve this at work" (professional) | **LinkedIn** | B2B decision-maker targeting |
| "Everyone's talking about this" (social proof) | **Twitter/X Ads** | Category is trending |
| "I watch content about this" (education) | **YouTube** | Long consideration cycle |
| "I discovered it through content" (entertainment) | **TikTok** | B2C, young audience, visual |

### 1B: Competitor Ad Presence Research

Use web search to check publicly accessible ad libraries and gather competitor ad intelligence:

```
web_search: site:facebook.com/ads/library "[competitor name]"
web_search: "[competitor name]" Google Ads OR PPC OR paid search
web_search: "[competitor name]" LinkedIn Ads OR sponsored
web_search: "[competitor name]" advertising strategy
```

The Meta Ad Library (facebook.com/ads/library) and Google Ads Transparency Center (adstransparency.google.com) are publicly accessible — search them directly to see what competitors are running.

Build a competitor channel map:

| Competitor | Google | Meta | LinkedIn | Twitter | YouTube | TikTok |
|-----------|--------|------|----------|---------|---------|--------|
| [Comp A] | [Active/Not found] | [N ads] | [Active/Not found] | ... | ... | ... |
| [Comp B] | ... | ... | ... | ... | ... | ... |

**Insight:** Where competitors are spending = validated channel. Where they're absent = opportunity or dead end.

### 1C: Channel Scoring Matrix

Score each channel for this specific product:

| Factor (Weight) | Google Search | Meta | LinkedIn | YouTube | Twitter | TikTok |
|----------------|--------------|------|----------|---------|---------|--------|
| **Buyer intent** (25%) | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] |
| **Targeting precision** (20%) | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] |
| **Competitor validation** (15%) | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] |
| **Budget efficiency** (15%) | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] |
| **ICP reachability** (15%) | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] |
| **Creative requirements** (10%) | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] | [1-10] |
| **Weighted Score** | [X/10] | [X/10] | [X/10] | [X/10] | [X/10] | [X/10] |

### Channel Context Notes

| Channel | Best For | Worst For | Min Viable Budget | Creative Needs |
|---------|---------|-----------|-------------------|---------------|
| **Google Search** | High-intent capture, B2B, established category | New categories nobody searches for | $1K/mo | Text ads (low barrier) |
| **Meta (FB/IG)** | Visual products, B2C, retargeting, lookalikes | Niche B2B with tiny audience | $1K/mo | Images + video (medium) |
| **LinkedIn** | B2B enterprise, specific titles/industries | B2C, budget-conscious startups | $3K/mo | Professional content (medium) |
| **YouTube** | Education-heavy products, long consideration | Impulse purchases, tiny budgets | $2K/mo | Video production (high) |
| **Twitter/X** | Dev tools, trending categories, tech audiences | Mainstream B2C, precise targeting | $1K/mo | Short-form copy (low) |
| **TikTok** | B2C, Gen Z/millennial, visual/fun products | B2B enterprise, older audience | $500/mo | Short video (high frequency) |

## Phase 2: Recommendation

### Primary Channel Selection

Pick the #1 channel based on:
1. Highest weighted score
2. Budget viability (can they afford minimum viable spend?)
3. Creative readiness (can they produce the required content?)

### Secondary Channel Selection

Pick channel #2 only if:
- Budget > $3K/month (enough for two channels)
- It serves a different funnel stage than channel #1
- It doesn't require creative they can't produce

### Budget Allocation

| Budget Level | Recommendation |
|-------------|---------------|
| < $1.5K/mo | **1 channel only** — concentrate everything |
| $1.5K-3K/mo | **1 primary + retargeting** — primary channel + Meta/Google retargeting ($300-500) |
| $3K-7K/mo | **2 channels** — 65% primary, 25% secondary, 10% retargeting |
| $7K+/mo | **2-3 channels** — diversify with testing budget |

## Phase 3: 90-Day Ramp Plan

### Month 1: Foundation (Days 1-30)

**Week 1: Setup**
- Set up conversion tracking (Pixel, GTM, GA4)
- Create landing page (if needed)
- Build initial audiences / keyword list
- Launch 2-3 ad variants on primary channel

**Week 2-3: Learn**
- Collect data — do NOT optimize yet
- Monitor for setup issues (tracking, disapprovals, targeting)
- Minimum 500 impressions per variant before judging

**Week 4: First Optimization**
- Pause worst-performing ad variant
- Add 1-2 new variants based on early signals
- Adjust bids/budgets based on CPM/CPC data

### Month 2: Optimize (Days 31-60)

- Review conversion data — any ads producing results?
- Launch retargeting campaign (if not already)
- Test new audiences / keywords
- A/B test landing pages (if conversion rate is low)
- Begin secondary channel test (if budget allows)

### Month 3: Scale or Pivot (Days 61-90)

- If working: Increase budget 30-50% on winning audiences/keywords
- If not working: Diagnose (bad targeting? bad LP? bad offer?)
- Evaluate secondary channel test results
- Re-run this analysis with real performance data to validate or adjust channel selection

## Phase 4: Output Format

```markdown
# Paid Channel Strategy — [Product Name] — [DATE]

## Your Profile
- Product: [Name]
- Model: [SaaS / B2C / etc.]
- ICP: [Summary]
- Monthly budget: $[X]
- Conversion goal: [Goal]

---

## Channel Scoring

| Channel | Score | Verdict |
|---------|-------|---------|
| [Top channel] | [X/10] | **PRIMARY — Start here** |
| [Second channel] | [X/10] | **SECONDARY — Add in month 2** |
| [Third channel] | [X/10] | Test later if budget grows |
| [Others] | [X/10] | Not recommended now |

---

## Why [Primary Channel]

**Top reasons:**
1. [Reason — tied to their specific product/ICP]
2. [Reason]
3. [Reason]

**What competitors are doing there:** [Evidence]

**Minimum viable budget:** $[X]/mo
**Expected cost per conversion:** $[X-Y] range (category benchmark)

---

## Why NOT [Channel They Might Assume]

[Brief explanation of why the obvious choice isn't right — e.g., "LinkedIn is too expensive for your $2K budget — you'd only reach ~500 people/month"]

---

## Budget Allocation

| Channel | Monthly Budget | Purpose |
|---------|---------------|---------|
| [Primary] | $[X] | [Prospecting / Lead gen] |
| [Retargeting] | $[X] | [Bring back visitors] |
| [Secondary — Month 2] | $[X] | [Test — evaluate after 30 days] |

---

## 90-Day Ramp Plan

### Month 1: [Primary Channel] Launch
[Specific weekly actions]

### Month 2: Optimize + Test [Secondary]
[Specific actions]

### Month 3: Scale or Pivot
[Decision criteria]

---

## Pre-Launch Checklist
- [ ] Landing page live and tested
- [ ] Conversion tracking installed and verified
- [ ] Initial audiences / keywords built
- [ ] 3 ad variants ready
- [ ] Daily budget cap set ($[X]/day)
- [ ] Weekly review scheduled
```

Save to `channel-strategy-[YYYY-MM-DD].md` in the current working directory (or user-specified path).

## Cost

| Component | Cost |
|-----------|------|
| Competitor ad research (web search) | Free |
| Channel analysis and planning | Free (LLM reasoning) |
| **Total** | **Free** |

## Tools Required

- **web_search** — for competitor research, ad library lookups, and channel validation

## Trigger Phrases

- "Where should I run ads?"
- "Which ad platform should I use?"
- "Help me pick a paid channel"
- "Google Ads or Facebook Ads?"
- "I have $[X]/month — where should I advertise?"
- "What paid channels work for [product type]?"
