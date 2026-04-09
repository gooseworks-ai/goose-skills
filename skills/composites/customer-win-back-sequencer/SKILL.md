---
name: customer-win-back-sequencer
description: >
  For churned accounts, research what has changed since they left — new funding, team
  growth, competitor dissatisfaction, product updates that address their pain — then
  assess re-engagement potential and generate a personalized win-back email sequence
  with timing recommendations. Chains web research and LinkedIn monitoring with email
  sequence generation.
tags: [outreach]
---

# Customer Win-Back Sequencer

Not every churned customer is gone forever. This skill identifies which ones to pursue, finds the right re-engagement angle, and generates a personalized win-back sequence. Timing and relevance are everything — no generic "we miss you" emails.

**Built for:** Startups that have churned customers sitting in a spreadsheet with no plan to re-engage them. The best win-back campaigns are triggered by change — this skill monitors for those changes and strikes when the timing is right.

## When to Use

- "Which churned customers should we try to win back?"
- "Build a win-back campaign for [customer]"
- "Research our churned accounts for re-engagement opportunities"
- "Generate win-back emails for customers who left because of [reason]"
- "Run the win-back scan on our churn list"

## Phase 0: Intake

### Churned Account Data
1. **Churn list** — CSV/sheet with: company name, domain, contact email, contact LinkedIn URL (if available), churn date, MRR at churn, churn reason (if known)
2. **Time since churn filter** — Min/max months since churn to consider (default: 3-18 months. Too recent = too soon. Too old = too stale.)
3. **Minimum value** — Only pursue accounts above $X MRR? (Focus effort on worthwhile wins)

### Product Context
4. **Major product updates since churn** — What's new? (Features, pricing changes, integrations, performance improvements)
5. **Churn reasons addressed** — Which past churn reasons have you actually fixed?
6. **Current offer** — Any win-back incentive? (Discount, extended trial, concierge onboarding, free migration)

### Sequence Preferences
7. **Sender** — Who should the emails come from? (Founder, CSM, account exec)
8. **Channel** — Email only, or email + LinkedIn?
9. **Sequence length** — How many touches? (Default: 3-4 over 3-4 weeks)

## Phase 1: Churned Account Research

For each account in the churn list, research what's changed:

### 1A: Company Changes

```
Search: "[company name]" funding OR raised OR "series" OR acquisition 2025 2026
Search: "[company name]" hiring OR "we're hiring" OR "growing team"
Search: "[company name]" launch OR "new product" OR expansion OR pivot
```

Extract:
- **Funding:** New round raised? (More budget available)
- **Growth:** Headcount increasing? New hires in relevant roles?
- **Product changes:** Launched something new that would benefit from your product?
- **Market moves:** Entered a new market, new partnerships?

### 1B: Contact Changes

```
Search: "[contact name]" "[company name]" OR linkedin.com
Search: "[company name]" "[relevant title]" new OR hired OR promoted
```

Determine:
- **Same contact still there?** If yes, continuity helps. If no, find the new person.
- **Contact promoted?** More authority = bigger potential deal.
- **New decision-maker?** Fresh eyes, no baggage from the old experience.

### 1C: Competitor Dissatisfaction Signals

If you know which competitor they switched to:

```
Search: "[competitor name]" complaints OR issues OR "looking for alternative"
Search: "[competitor name]" site:g2.com negative reviews
Search: "[company name]" "[competitor name]" OR "switched from"
```

Look for:
- Public complaints about the competitor they switched to
- Reviews mentioning problems that your product solves
- Signs of "buyer's remorse" in the market

### 1D: Product-Churn Fit Analysis

Match what's changed in your product against their churn reason:

| Churn Reason | Product Update | Win-Back Angle |
|-------------|----------------|----------------|
| "Too expensive" | New pricing tier / startup discount | Price-based re-engagement |
| "Missing [feature]" | [Feature] shipped | Feature announcement |
| "Too complex" | Simplified onboarding / UX overhaul | "We listened" narrative |
| "Switched to [competitor]" | Competitive advantage developed | Competitive displacement |
| "Didn't see ROI" | New ROI dashboard / case studies | Proof-based approach |
| "Champion left" | N/A — find new champion | Fresh start narrative |
| "Company downsized" | Company now growing again (from research) | Timing-based re-engagement |

## Phase 2: Win-Back Scoring

Score each churned account's re-engagement potential:

```
Win-Back Score = (Change Signal × Churn Reason Addressability × Account Value) / Time Decay

Change Signal (1-5):
  5 = Multiple strong signals (funding + growth + competitor issues)
  4 = One strong signal (funding or significant growth)
  3 = Moderate signal (hiring, product launch)
  2 = Minor signal (still operating, no major changes)
  1 = No detectable change

Churn Reason Addressability (1-3):
  3 = You've directly fixed the reason they left
  2 = Partially addressed or different angle available
  1 = Same issues exist / unknown churn reason

Account Value (multiplier):
  2.0x = Was top 20% by MRR
  1.5x = Mid-tier MRR
  1.0x = Lower MRR

Time Decay (divisor):
  1.0 = Churned 3-6 months ago (sweet spot)
  1.2 = Churned 6-12 months ago
  1.5 = Churned 12-18 months ago
  2.0 = Churned 18+ months ago
```

### Priority Tiers

| Tier | Score | Action |
|------|-------|--------|
| **High Priority** | 8+ | Full personalized sequence + founder outreach |
| **Medium Priority** | 4-7 | Personalized sequence |
| **Low Priority** | 1-3 | Batch campaign or skip |

## Phase 3: Sequence Generation

### Win-Back Sequence — High Priority (4 emails over 4 weeks)

**Email 1: The Relevant Update (Day 0)**

```
Subject options:
A: "[First name], [specific thing] changed since we last spoke"
B: "We fixed the thing that made you leave"
C: "[Company] + [Your Product] — worth another look?"

---

Hi [First name],

[1 sentence acknowledging they left — no guilt, no desperation]

Since then, we've [specific improvement that addresses their churn reason]:

- [Change 1 — most relevant to their pain]
- [Change 2]
- [Change 3]

[If you have a relevant customer proof point]:
"[Company in their space] switched back and saw [result]."

Would it be worth a 15-minute look at what's different?

[Soft CTA — no pressure]

[Signature]
```

**Email 2: The Proof Point (Day 7)**

```
Subject: "How [similar company] is using [product] now"

Hi [First name],

Quick follow-up — wanted to share something relevant.

[Case study or proof point from a company similar to theirs]:
- [What they achieved]
- [Metric that matters]

[1 sentence connecting this to their specific situation]

[CTA — slightly stronger: "Want me to show you the new [feature] in 10 minutes?"]

[Signature]
```

**Email 3: The Offer (Day 14)**

```
Subject: "[Specific offer — e.g., 'Free migration + 30 days on us']"

Hi [First name],

I know switching tools is a pain — that's usually what keeps people from
coming back even when the product has improved.

So we're making it easy:
- [Offer detail 1 — e.g., "We'll handle the full migration"]
- [Offer detail 2 — e.g., "30 days free to test everything"]
- [Offer detail 3 — e.g., "Dedicated onboarding session"]

[If applicable: "This offer is available through [date]"]

Worth a conversation?

[Signature]
```

**Email 4: The Breakup (Day 28)**

```
Subject: "Closing the loop"

Hi [First name],

Totally understand if the timing isn't right — just wanted to
make sure this didn't slip through the cracks.

Quick summary of what's new:
→ [Key improvement 1]
→ [Key improvement 2]
→ [Standing offer, if applicable]

If anything changes on your end, my inbox is always open.

[Signature]

P.S. [Genuinely helpful resource — e.g., "We just published [relevant content].
Worth a read regardless of which tool you're using."]
```

### Win-Back Sequence — Medium Priority (3 emails over 3 weeks)

Shorter, less personalized but still relevant:

**Email 1:** Product update announcement + relevance to their use case
**Email 2:** Customer proof point + specific offer
**Email 3:** Soft breakup with resource share

### Win-Back Sequence — Competitor-Specific

If they switched to a known competitor:

**Email 1:** "How [product] compares to [competitor] today" — honest, non-aggressive comparison focused on what changed
**Email 2:** Customer story of someone who switched back from that specific competitor
**Email 3:** Offer + easy migration path

## Phase 4: Output Format

```markdown
# Win-Back Opportunity Report — [DATE]
Churned accounts analyzed: [N]
Time window: [Churned between X and Y months ago]

---

## Summary

| Priority | Accounts | Total MRR Opportunity |
|----------|----------|----------------------|
| High Priority | [N] | $[X]/mo |
| Medium Priority | [N] | $[X]/mo |
| Low Priority / Skip | [N] | $[X]/mo |

**Total recoverable MRR:** $[X]/mo (estimated, assuming [Y%] win-back rate)

---

## High Priority Accounts

### [Company 1] — Churned: [date] | Former MRR: $[X]
**Churn reason:** [Reason]
**What's changed (them):** [Research findings]
**What's changed (us):** [Product updates that address their pain]
**Win-back angle:** [The core pitch]
**Contact:** [Name, title, email]
**Sequence:** [Attached — 4 emails, personalized]

### [Company 2] — ...

---

## Medium Priority Accounts

| Account | Churned | MRR | Churn Reason | Win-Back Angle | Score |
|---------|---------|-----|-------------|---------------|-------|
| [Name] | [Date] | $[X] | [Reason] | [Angle] | [N] |

---

## Email Sequences

### [Company 1] — Full Personalized Sequence
[Email 1: Subject + body]
[Email 2: Subject + body]
[Email 3: Subject + body]
[Email 4: Subject + body]

### [Company 2] — ...

---

## Accounts to Skip (and Why)

| Account | Reason to Skip |
|---------|---------------|
| [Name] | [Still in same situation / company shut down / too recent] |

---

## Win-Back Campaign Setup

If using Smartlead:
- Campaign name: "Win-Back — [Month] [Year]"
- Sequences: [Use generated sequences above]
- Timing: [Recommended send schedule]
- Sender: [Recommended — founder for high priority, CSM for medium]
```

Save to `clients/<client-name>/customer-success/win-back/win-back-report-[YYYY-MM-DD].md`.

## Cost

| Component | Cost |
|-----------|------|
| Web research per churned account | Free |
| LinkedIn research (optional) | ~$0.25-0.50 per account |
| Sequence generation | Free (LLM reasoning) |
| **Total** | **Free — $5** (for ~10 accounts with LinkedIn research) |

## Tools Required

- **web_search** — for company and competitor research
- **fetch_webpage** — for career pages, news, competitor reviews
- **Optional:** `linkedin-profile-post-scraper` for contact monitoring
- **Optional:** `review-site-scraper` for competitor dissatisfaction signals
- **Optional:** `cold-email-outreach` for campaign creation

## Trigger Phrases

- "Which churned customers should we win back?"
- "Build a win-back sequence for [customer]"
- "Research our churn list for re-engagement"
- "Run the win-back scan"
- "Generate win-back emails for churned accounts"
