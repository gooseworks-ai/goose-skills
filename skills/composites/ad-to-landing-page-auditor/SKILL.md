---
name: ad-to-landing-page-auditor
description: >
  Analyze the message match between your ads and landing pages. Checks if the promise
  in the ad copy carries through to the landing page headline, body, and CTA. Flags
  disconnects that kill conversion rates. Works with Google, Meta, and LinkedIn ads.
tags: [ads]
---

# Ad-to-Landing Page Auditor

The #1 reason ads get clicks but not conversions: the landing page doesn't deliver on the ad's promise. This skill audits the full click path — from ad copy to landing page experience — and flags every disconnect.

**Core principle:** A great ad with a mismatched landing page is worse than a mediocre ad with a matched one. Message match is the single biggest conversion lever most startups ignore.

## When to Use

- "Why are my ads getting clicks but no conversions?"
- "Audit my ad-to-landing page flow"
- "Check message match on our campaigns"
- "My conversion rate is low — help me figure out why"
- "Review our landing pages for our ad campaigns"

## Phase 0: Intake

1. **Ad copy** — For each ad, provide:
   - Headline(s)
   - Body / description text
   - CTA text
   - Platform (Google Search / Meta / LinkedIn)
2. **Landing page URLs** — The URL each ad points to
3. **Conversion goal** — What should happen after someone clicks? (Demo / Trial / Purchase / Download)
4. **Known conversion rates?** — Current click → conversion rate per ad/LP (if available)

If the user has a CSV export from their ad platform, parse that instead.

## Phase 1: Ad Inventory

Parse the provided ads into:

| Ad ID | Platform | Headline | Body/Description | CTA | Landing Page URL | Conv Rate (if known) |
|-------|----------|----------|-----------------|-----|-----------------|---------------------|

## Phase 2: Landing Page Audit

For each unique landing page URL, fetch the page content:

```
fetch_webpage: [landing_page_url]
```

If `fetch_webpage` is not available, use `curl` to retrieve the page HTML.

Extract and score:

### 2A: Content Elements

| Element | Found? | Content |
|---------|--------|---------|
| **Hero headline** | [Y/N] | "[Text]" |
| **Subheadline** | [Y/N] | "[Text]" |
| **Primary CTA** | [Y/N] | "[Button text]" |
| **CTA above fold** | [Y/N] | — |
| **Social proof** | [Y/N] | [Logos / testimonials / metrics] |
| **Benefit list** | [Y/N] | [Key benefits listed] |
| **Form / Sign-up** | [Y/N] | [Field count: N] |
| **Video** | [Y/N] | — |
| **Trust signals** | [Y/N] | [Security badges, guarantees] |

### 2B: Message Match Scoring

For each ad → landing page pair, score on:

| Dimension | Score (1-10) | Criteria |
|-----------|-------------|----------|
| **Promise continuity** | [X] | Does the LP headline deliver on the ad's promise? |
| **Language match** | [X] | Does the LP use the same words/phrases as the ad? |
| **Visual continuity** | [X] | Does the LP feel like a continuation of the ad? (Not assessable for search) |
| **CTA alignment** | [X] | Does the LP's ask match what the ad implied? |
| **Specificity match** | [X] | If the ad was specific ("for sales teams"), is the LP specific too? |
| **Emotional match** | [X] | If the ad used fear/urgency, does the LP carry that forward? |

**Message Match Score: [Average/60]**

### Scoring Guide

| Score | Rating | Meaning |
|-------|--------|---------|
| 50-60 | Excellent | Strong match — LP delivers on every ad promise |
| 40-49 | Good | Minor disconnects but overall coherent |
| 30-39 | Needs work | Noticeable gaps — visitor has to hunt for relevance |
| 20-29 | Poor | Ad and LP feel like different products |
| Below 20 | Critical | Complete mismatch — fix immediately |

## Phase 3: Conversion Friction Analysis

Beyond message match, assess landing page conversion friction:

| Friction Type | Check | Status |
|--------------|-------|--------|
| **Load time** | Does the page feel heavy/slow? (Asset count proxy) | [Fast/Slow/Unknown] |
| **Form length** | How many fields before conversion? | [N fields] — [Appropriate/Too many] |
| **CTA clarity** | Is there one clear CTA or competing actions? | [Clear/Cluttered] |
| **Above-fold conversion** | Can someone convert without scrolling? | [Yes/No] |
| **Social proof placement** | Is proof near the CTA? | [Yes/No] |
| **Navigation distraction** | Does the LP have full site nav? (Should be minimal) | [Minimal/Full nav] |
| **Mobile experience** | Any mobile-unfriendly elements? | [Good/Issues] |

## Phase 4: Output Format

```markdown
# Ad-to-Landing Page Audit — [Product/Client] — [DATE]

Ads audited: [N]
Unique landing pages: [N]
Platform(s): [Google / Meta / LinkedIn]
Overall message match: [Score/60] — [Rating]

---

## Executive Summary

[3-4 sentences: Overall finding, biggest disconnect, top recommendation, estimated conversion impact]

---

## Audit Results by Ad → Landing Page Pair

### Ad 1: "[Ad headline excerpt]"
**Platform:** [Google Search / Meta / LinkedIn]
**Ad copy:**
> Headline: "[text]"
> Body: "[text]"
> CTA: "[text]"

**Landing page:** [URL]
> LP headline: "[text]"
> LP subhead: "[text]"
> LP CTA: "[button text]"

**Message Match Score: [X/60] — [Rating]**

| Dimension | Score | Issue |
|-----------|-------|-------|
| Promise continuity | [X/10] | [Specific finding] |
| Language match | [X/10] | [Specific finding] |
| CTA alignment | [X/10] | [Specific finding] |
| Specificity match | [X/10] | [Specific finding] |
| Emotional match | [X/10] | [Specific finding] |

**Disconnect found:** [Specific description of mismatch]
**Recommended fix:** [Specific change to ad or LP]

### Ad 2: ...

---

## Landing Page Friction Report

### [Landing Page URL]
| Friction Point | Status | Impact | Fix |
|---------------|--------|--------|-----|
| [Friction] | [Red/Yellow/Green] | [High/Med/Low] | [Specific fix] |

---

## Priority Fixes

### Critical (Fix This Week)
1. **[Ad/LP pair]:** [Specific mismatch] → [Specific fix]
   - Est. conversion impact: [X% improvement]

### Important (Fix This Month)
2. **[Issue]:** [Fix]

### Nice-to-Have
3. **[Issue]:** [Fix]

---

## Rewrite Suggestions

### For [Ad or LP with worst match]:

**Current ad headline:** "[current]"
**Suggested ad headline:** "[rewrite that matches LP]"

OR

**Current LP headline:** "[current]"
**Suggested LP headline:** "[rewrite that matches ad]"
```

Save to `ad-lp-audit-[YYYY-MM-DD].md` in the current working directory (or user-specified path).

## Cost

| Component | Cost |
|-----------|------|
| Landing page fetching | Free |
| Analysis | Free (LLM reasoning) |
| **Total** | **Free** |

## Tools Required

- **fetch_webpage** or **curl** — for landing page analysis
- No API keys required

## Trigger Phrases

- "Audit my ad-to-landing page match"
- "Why is my conversion rate so low?"
- "Check message match on our campaigns"
- "Do our landing pages match our ads?"
- "Run a CRO audit on our ad funnels"
