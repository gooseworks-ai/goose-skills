---
name: competitor-ad-intelligence
description: >
  Scrape competitor ads from Meta, TikTok, Google, and LinkedIn ad libraries,
  analyze creative patterns (hooks, formats, CTAs), reverse-engineer landing page funnels,
  and produce a strategic teardown with vulnerability analysis and counter-play recommendations.
  Use when you need to understand the competitive ad landscape, find new creative directions,
  or identify weaknesses in a competitor's paid strategy.
tags: [ads]
---

# Competitor Ad Intelligence

Scrape competitor ads from Meta, TikTok, Google, and LinkedIn, analyze creative patterns, reverse-engineer landing page funnels, and produce a full strategic teardown — hooks, formats, positioning bets, vulnerabilities, and counter-plays.

**Core principle:** A competitor's ad portfolio is evidence about its growth strategy, not access to its results. Long-running ads suggest sustained use. New ads suggest active testing. Landing pages reveal positioning bets. Use these signals to form differentiated tests without claiming conversion, spend, or causality the libraries do not expose.

## When to Use

- "What ads are my competitors running?"
- "Tear down [competitor]'s ad strategy"
- "Find new creative angles for our paid campaigns"
- "Reverse-engineer [competitor]'s paid funnel"
- "What hooks are working in [our space]?"
- "Audit the ad landscape before we launch"
- "Find weaknesses in [competitor]'s ad strategy"
- "What format — video, image, carousel — is dominant in our category?"

## Phase 0: Intake

Gather from the user:

1. **Competitor names + domains** (e.g., `apollo.io`, `clay.run`)
2. **Your product/domain** — for comparison framing
3. **Channels:** Meta, TikTok, Google, LinkedIn, or all relevant libraries? (default: all channels relevant to the brand and market)
4. **Depth level:**
   - **Standard:** Ad scrape + creative analysis + landing page analysis
   - **Deep:** Standard + historical comparison + funnel reconstruction + counter-plays
5. **Product category** — helps frame analysis
6. **Known competitor landing pages?** — any URLs already spotted in their ads

## Phase 1: Scrape Meta Ads

For each competitor domain, scrape ads from Meta Ad Library.

Use `scrapecreators-api` as the primary collection path. Resolve the advertiser first, then fetch its ads and individual ad details:

```yaml
- provider: scrapecreators
  method: GET
  path: /v1/facebook/adLibrary/search/companies
  query:
    query: "[competitor_name]"
- provider: scrapecreators
  method: GET
  path: /v1/facebook/adLibrary/company/ads
  query:
    companyName: "[competitor_name]"
- provider: scrapecreators
  method: GET
  path: /v1/facebook/adLibrary/ad
  query:
    id: "[ad_id]"
```

If the structured endpoint cannot resolve an advertiser, verify the name in the public Meta Ad Library and use web search as a documented fallback. Keep the library URL and ad ID with every result.

**Collect per ad:**
- Ad copy (headline + primary text)
- Visual type (image / video / carousel)
- CTA button text
- Landing page URL
- Active duration (first seen, still running or stopped)
- Platforms (Facebook, Instagram, Audience Network)
- Ad variations (A/B tests — same landing page, different creative)
- Video transcript when available; use `transcript-intelligence` to extract hooks, claims, proof, objections, and CTA structure

## Phase 2: Scrape TikTok Ads

For each competitor or category, use `scrapecreators-api` to resolve the current TikTok Ad Library search and ad-detail operations from the official provider reference.

Collect the advertiser, ad ID, caption or script, format, landing page, first-seen date, market, and available performance or reach indicators. Keep organic TikTok posts separate from paid-library ads.

Use `transcript-intelligence` when the ad includes spoken content. Analyze TikTok-native mechanics such as creator-led openings, product demonstrations, comment-style hooks, native captions, sounds, offer timing, and the first visible payoff.

## Phase 3: Scrape Google Ads

For each competitor domain, scrape ads from Google Ads Transparency Center.

Use the structured advertiser endpoints first:

```yaml
- provider: scrapecreators
  method: GET
  path: /v1/google/company/ads
  query:
    domain: "[competitor_domain]"
    get_ad_details: true
- provider: scrapecreators
  method: GET
  path: /v1/google/ad
  query:
    id: "[ad_id]"
```

Use the public Google Ads Transparency Center or web search only when the structured endpoint is incomplete. Mark fallback records so coverage limits remain visible.

**Collect per ad:**
- Headline variants (up to 3)
- Description lines
- Ad type (Search / Display / YouTube / Shopping)
- Landing page URL
- Geographic targeting (if visible)

## Phase 4: Scrape LinkedIn Ads

For each relevant competitor, use `scrapecreators-api` to resolve the current LinkedIn Ad Library search and ad-detail operations from the official provider reference.

Collect the advertiser, ad copy, creative format, CTA, landing page, dates, and visible targeting or company context. Keep organic company posts separate from paid-library ads.

LinkedIn is optional for consumer brands. Include it when the competitor sells high-consideration products, wholesale or retail partnerships, franchises, professional education, recruiting, or another business-facing offer.

## Phase 5: Analyze Creative Patterns

After collecting all ads, perform structured analysis.

### Hook Pattern Clustering

Group all ad headlines/openers by hook type:

| Hook Type | Pattern | Example |
|-----------|---------|---------|
| **Fear/Loss** | Risk of missing out or falling behind | "Your competitors are already using AI SDRs" |
| **Outcome** | Direct result promise | "10x your pipeline in 30 days" |
| **Question** | Challenges current assumption | "Still doing outbound manually?" |
| **Social proof** | Names customers or numbers | "Join 500+ B2B teams using [product]" |
| **Contrarian** | Challenges conventional wisdom | "Cold email isn't dead. Your copy is." |
| **Empathy** | Validates their pain | "We know SDR ramp time is brutal" |
| **Product-led** | Feature as hook | "[Feature] is live — see what's new" |

Count how many ads per competitor use each hook type. This reveals their primary messaging strategy.

### Format Distribution

| Format | Meta | TikTok | Google | LinkedIn |
|--------|------|--------|--------|----------|
| Static image | [N] | [N] | [N] | [N] |
| Video | [N] | [N] | [N] | [N] |
| Carousel | [N] | [N] | N/A | [N] |
| Search text | N/A | N/A | [N] | N/A |
| Display banner | N/A | N/A | [N] | [N] |

### CTA Taxonomy

List all unique CTAs found. Common patterns:
- **Urgency:** "Start free", "Try now", "Get started today"
- **Low-friction:** "See how it works", "Watch demo", "Learn more"
- **Outcome:** "Book a demo", "Get your free audit", "Calculate your ROI"

## Phase 6: Landing Page & Funnel Analysis

For each unique landing page URL found in ads, fetch and analyze:

```
fetch_webpage: [landing_page_url]
```

Or use `curl` if `fetch_webpage` is unavailable.

**Extract per landing page:**
- **Hero headline** — Does it match the ad promise?
- **Subheadline** — Value prop expansion
- **Primary CTA** — What action are they driving? (Demo / Free trial / Sign up / Download)
- **Social proof** — Logos, testimonials, case study metrics
- **Pricing visibility** — Is pricing shown or hidden?
- **Form fields** — How much info do they ask for?
- **Page type** — General homepage / dedicated LP / feature page / use-case page
- **Message match score** — How well does the LP deliver on the ad's promise? (1-10)

### Campaign Clustering

Group all ads into logical campaigns by:
- **Landing page destination** — Ads pointing to the same URL = same campaign
- **Messaging theme** — Similar copy angles = same strategic bet
- **Audience signal** — Different copy for different personas

### Per-Campaign Funnel Analysis

For each campaign cluster:

| Dimension | Analysis |
|-----------|----------|
| **Strategic intent** | What is this campaign trying to achieve? (Awareness / Lead gen / Free trial / Competitive displacement) |
| **Target persona** | Who is this ad speaking to? (Role, pain, stage) |
| **Positioning bet** | What market position are they claiming? |
| **Hook strategy** | Fear / Outcome / Social proof / Contrarian / Product-led |
| **Conversion path** | Ad → LP → CTA → [Demo call / Free trial / Content download] |
| **Longevity signal** | How long has this been running? Treat duration as sustained use, not proof of performance. |
| **A/B tests detected** | Multiple creatives to same LP = active testing |

### Portfolio Emphasis

Use ad volume and platform distribution to describe where the visible portfolio is concentrated:

| Platform | Ad Count | % of Visible Portfolio | Likely Objective |
|----------|----------|------------------------|------------------|
| Meta (Facebook) | [N] | [X%] | [Awareness / Retargeting] |
| Meta (Instagram) | [N] | [X%] | [Visual / younger audience] |
| TikTok | [N] | [X%] | [Creator-led discovery / conversion] |
| Google Search | [N] | [X%] | [Bottom-funnel capture] |
| Google Display | [N] | [X%] | [Awareness / retargeting] |
| YouTube | [N] | [X%] | [Education / awareness] |
| LinkedIn | [N] | [X%] | [Professional / partnership / high-consideration] |

Treat ad count as portfolio emphasis, not spend. Never label this table a budget estimate unless the library provides defensible spend data.

## Phase 7: Strategic Analysis

### Creative Gap Analysis

Identify across all competitors:

1. **Angles nobody is running** — Hook types absent from competitor ads = white space
2. **Overcrowded angles** — If everyone leads with "save time", avoid it or be more specific
3. **Format opportunities** — If no one is running video in your space, it may stand out
4. **Underutilized proof** — Are competitors avoiding specific proof points you could own?
5. **CTA patterns to test** — What CTAs do the longest-running ads use?

### Vulnerability Analysis

Identify weaknesses in each competitor's ad strategy:

| Vulnerability Type | Description |
|-------------------|-------------|
| **Message-LP mismatch** | Ad promises one thing, LP delivers another |
| **Single-persona dependency** | All ads target the same persona — missing segments |
| **Platform concentration** | Heavy on one platform, absent from others |
| **No social proof** | Ads or LPs lack credibility markers |
| **Weak CTA** | Asking for too much too soon (demo before value) |
| **Generic positioning** | Claims anyone could make — not differentiated |
| **Stale creative** | Same ads running unchanged for months — fatigue risk |

### Historical Comparison (Deep Mode)

If Web Archive data exists for their landing pages:
- Has their positioning changed in the last 6-12 months?
- What campaigns did they retire? (Possible losers)
- What campaigns have they scaled up? (Possible winners)

## Phase 8: Output

```markdown
# Competitor Ad Intelligence Report — [DATE]

## Coverage
- Competitors analyzed: [list]
- Meta ads collected: [N]
- TikTok ads collected: [N]
- Google ads collected: [N]
- LinkedIn ads collected: [N]
- Unique landing pages analyzed: [N]
- Estimated active campaigns: [N]

---

## Executive Summary

[3-5 sentence summary: What is the competitive ad landscape? What's working? Where are the gaps and vulnerabilities?]

---

## Meta Ad Analysis

### Hook Distribution
| Hook Type | [Comp1] | [Comp2] | [Comp3] |
|-----------|---------|---------|---------|
| Fear/Loss | 40% | 10% | 0% |
| Outcome | 30% | 50% | 60% |
...

### Longest-Running Ads (Not Performance Proof)
**[Competitor] — [Ad Title/Hook]**
> [Ad copy excerpt]
- Format: [type]
- CTA: [text]
- Running since: [date]
- Why it may have been sustained: [evidence and hypotheses to test]

---

## Google Ad Analysis

### Headline Patterns
[Top headline structures with examples]

### Most Common CTAs
[ranked list]

---

## TikTok Ad Analysis

### Native Creative Patterns
[Creator style, opening hooks, demonstrations, sounds, captions, offers, and CTA timing]

### Reusable Script Structures
[Sourced structures and why they may be working]

---

## LinkedIn Ad Analysis

### Professional and Partnership Angles
[Relevant messages, proof, formats, and landing-page paths; omit this section when LinkedIn is not relevant]

---

## Campaign Breakdown

### Campaign 1: [Inferred Campaign Name]
- **Competitor:** [name]
- **Ads in cluster:** [N]
- **Platform(s):** [Meta / Google / Both]
- **Strategic intent:** [Awareness / Lead gen / Competitive displacement / etc.]
- **Target persona:** [Description]
- **Hook strategy:** [Type]
- **Landing page:** [URL]
  - Hero: "[Headline text]"
  - CTA: "[Button text]"
  - Message match: [Score/10]
- **Longevity:** [First seen date → status]
- **A/B tests detected:** [Yes/No — what they're testing]

**Sample ad:**
> **Headline:** [text]
> **Body:** [text]
> **CTA:** [button]
> **Format:** [Image/Video/Carousel]

**Assessment:** [1-2 sentences — is this working? Why/why not?]

### Campaign 2: ...

---

## Funnel Map

```
[Ad: Hook/Angle] → [LP: /landing-page-url] → [CTA: Book Demo]
                                               ↓
[Ad: Different angle] → [LP: /same-or-different] → [CTA: Free Trial]
```

---

## Portfolio Emphasis

| Platform | Share | Focus Area |
|----------|-------|-----------|
| [Platform] | [X%] | [Intent] |

---

## Creative Gap Analysis

### Angles Nobody Is Running
1. [Angle] — Why it could work for you: [reasoning]
2. [Angle] — ...

### Overcrowded Angles (Avoid or Differentiate)
- [Angle] — [N] of [N] competitors use this

### Format White Space
- [Format] is not being used by competitors on [platform]

---

## Vulnerability Report

### 1. [Vulnerability]
**Competitor:** [name]
**Evidence:** [What we observed]
**Your opportunity:** [How to exploit this gap]

### 2. ...

---

## Recommended Counter-Plays

### Counter-Play 1: [Name]
- **Target their weakness:** [Which vulnerability]
- **Your ad angle:** [Hook]
- **Platform:** [Where to run]
- **Proposed headline:** "[headline]"
- **Proposed body:** "[copy]"
- **LP strategy:** [What your landing page should emphasize]
- **Why test this:** [rationale]

### Counter-Play 2: ...
```

## Tools Used

- **`scrapecreators-api`** — structured Meta, TikTok, Google, and LinkedIn ad-library collection
- **`transcript-intelligence`** — spoken-hook, claim, proof, objection, sponsorship, and CTA analysis for video ads
- **`web_search`** — verify advertiser identity and fill documented gaps
- **`fetch_webpage`** or **`curl`** — fetch and analyze landing pages

## Trigger Phrases

- "What ads are [competitor] running across Meta, TikTok, Google, and LinkedIn?"
- "Tear down [competitor]'s ad strategy"
- "Audit the ad landscape for [product category]"
- "Run ad intelligence for [competitors]"
- "Find new paid ad angles we haven't tried"
- "Reverse-engineer [competitor]'s paid funnel"
- "Find weaknesses in [competitor]'s ad strategy"
- "Deep competitive ad analysis on [competitor]"
