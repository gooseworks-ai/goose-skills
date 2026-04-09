---
name: review-intelligence-digest
description: >
  Scrape G2, Capterra, and Trustpilot reviews for your product and competitors, then
  extract recurring themes, objections, proof points, and exact customer language for
  use in messaging. Chains review-site-scraper with LLM analysis. Produces a weekly or monthly
  digest that feeds directly into copywriting, positioning, and sales enablement.
  Use when a marketing team needs to ground messaging in real customer language.
tags: [research]
---

# Review Intelligence Digest

Scrape reviews for your product and top competitors, then extract what actually matters for marketing: the exact language customers use, recurring pain points, proof points that convert, and objections to pre-empt.

**Core principle:** Your best marketing copy is already written — by your customers, in their reviews. This skill surfaces it.

## When to Use

- "What are customers saying about us vs competitors?"
- "Find proof points and objections from our G2 reviews"
- "What language do our customers use to describe the problem we solve?"
- "Run a review audit for [client]"
- "What are [competitor]'s customers complaining about?"

## Phase 0: Intake

1. Your product name + review page URLs (G2, Capterra, Trustpilot — any/all)
2. Competitor names + their review page URLs (1-3 competitors recommended)
3. What are you trying to learn? (Pick primary focus or do all):
   - **Messaging mining** — extract ICP language and proof points
   - **Competitive displacement** — find competitor pain points to exploit
   - **Objection mapping** — identify what's stopping people from buying/staying
   - **Feature gaps** — what do customers wish existed?
4. Time range: last 3 months (default), last 6 months, or all time?

## Phase 1: Scrape Reviews

Run `review-site-scraper` for your product and each competitor:

```bash
# Your product
python3 skills/capabilities/review-site-scraper/scripts/scrape_reviews.py \
  --platform g2 \
  --url "<your_g2_url>" \
  --days 90 \
  --output json

# Competitor
python3 skills/capabilities/review-site-scraper/scripts/scrape_reviews.py \
  --platform g2 \
  --url "<competitor_g2_url>" \
  --days 90 \
  --output json
```

Repeat for Capterra and Trustpilot as needed.

Collect for each review: rating (1-5), title, body text, pros, cons, reviewer role/company (if available), date.

## Phase 2: Categorize & Cluster

Analyze all reviews through these five lenses:

### Lens 1: Proof Points (5-star reviews)
Extract specific outcomes and metrics customers mention:
- Time saved / speed improvements
- Revenue or pipeline impact
- Headcount equivalent replaced
- Process improvements
- Before/after comparisons

**Flag reviews with numbers** — these are the highest-value proof points.

### Lens 2: Core Pain Language
What words and phrases do customers use to describe the problem they had before using the product? This is gold for cold email hooks and ad copy.

Patterns to extract:
- "Before [product], we were..."
- "We used to [manual process]..."
- "The biggest frustration was..."
- "We couldn't [thing] until..."

### Lens 3: Objection Mapping (3-4 star reviews, negative cons)
What do customers wish was different? What almost stopped them from buying?
- Price/value concerns
- Onboarding friction
- Missing features
- Integration issues
- Support quality

Group by theme. Count frequency.

### Lens 4: Competitive Displacement Signals (competitor reviews)
In competitor reviews, look for:
- Specific pain points your product doesn't have
- Features they're missing that you offer
- Complaints about price, support, or reliability
- Mentions of switching ("we switched to X")

These are your competitive displacement angles.

### Lens 5: Buyer Language Patterns
How do customers categorize and search for your type of product?
- What category words do they use?
- What comparison phrases appear? (e.g., "compared to Salesforce", "vs HubSpot")
- What role/title wrote the reviews? (validates ICP)

## Phase 3: Output Format

```markdown
# Review Intelligence Digest — [DATE]
Products analyzed: [your product], [competitors]
Reviews analyzed: [N] total | Period: [date range]

---

## Proof Points Library (use in copy directly)

### With Metrics (highest value)
- "[Exact quote with number]" — [Reviewer role], [Platform], [Date]
- "[Exact quote with number]" — ...

### Process/Experience Wins
- "[Exact quote]" — [Reviewer role], [Platform]
- ...

---

## Customer Pain Language

Words and phrases customers use to describe the problem you solve:

**Verbatim phrases (use in hooks and subject lines):**
- "[Exact phrase]" (appeared in [N] reviews)
- "[Exact phrase]" (appeared in [N] reviews)
- ...

**Paraphrased themes:**
1. [Theme] — [N] reviews mention this | Example: "[quote]"
2. [Theme] — ...

---

## Objection Map

| Objection | Frequency | Verbatim example | How to address |
|-----------|-----------|-----------------|----------------|
| [Objection] | [N] reviews | "[quote]" | [suggested response] |
| ... | | | |

---

## Competitive Displacement Intel

### [Competitor Name]

**Top complaints (use as outreach hooks):**
1. [Complaint] — "[Verbatim quote]" | Appeared [N] times
2. ...

**What their customers want that we offer:**
- [Feature/capability] — "[review evidence]"

**Suggested displacement angle:**
> "[Pitch sentence targeting their unhappy customers]"

---

## SEO / Messaging Vocabulary

Words and phrases to incorporate in website copy, ads, and content:

**High-frequency ICP vocabulary:**
- "[word/phrase]" — used in [N] reviews
- ...

**Category comparison terms:**
- Customers compare you to: [list]
- Customers search for: [list]

---

## Recommended Actions

### Immediate (use this week)
1. Add "[proof point quote]" to homepage or outbound sequences
2. Address "[top objection]" in onboarding flow or sales deck
3. Use "[pain phrase]" as hook in next cold email batch

### Strategic
1. [Feature gap mentioned in reviews — prioritize or address in messaging]
2. [Competitive weakness to build a campaign around]
```

Save to `review-digest-[YYYY-MM-DD].md` in the current working directory.

## Scheduling

Run monthly (reviews don't change fast enough to warrant weekly):

```bash
0 8 1 * * python3 run_skill.py review-intelligence-digest --client <client-name>
```

## Cost

| Component | Cost |
|-----------|------|
| G2 reviews (per product) | Free tier available (Apify) |
| Capterra reviews (per product) | ~$0.20-0.50 (Apify, pay-per-result) |
| Trustpilot reviews (per product) | ~$0.20/1k reviews |
| **Total per monthly run (you + 2 competitors)** | **~$1-3** |

## Tools Required

- **Apify API token** — `APIFY_API_TOKEN` env var
- **Upstream skill:** `review-site-scraper`

## Trigger Phrases

- "Mine our reviews for proof points and messaging"
- "What are [competitor]'s customers complaining about?"
- "Run review intelligence for [client]"
- "Give me customer language I can use in copy"
