---
name: messaging-ab-tester
description: >
  Generate 3-5 messaging variants for a value proposition, design structured A/B tests,
  and analyze results to determine which framing resonates most with ICP. Tests can run
  via LinkedIn organic posts, cold email subject line splits, or both. Pure reasoning for
  variant generation and analysis — the user deploys the tests through their own tools.
  Use when a team can't decide between messaging angles and needs data, not opinions.
tags: [brand]
---

# Messaging A/B Tester

Stop debating which message is better — test it. Generate messaging variants, deploy them through real channels, and measure which framing actually resonates with your ICP.

**Core principle:** At seed/Series A, you don't have enough traffic for website A/B tests. But you do have enough LinkedIn impressions and cold email sends to test messaging angles fast.

## When to Use

- "Which of these value props should we lead with?"
- "Test our messaging angles and tell me which works"
- "I can't decide between [message A] and [message B]"
- "What messaging resonates most with [ICP]?"
- "Run a messaging test for [product/feature]"

## Phase 0: Intake

### What to Test
1. **Core value prop** — The claim or positioning you want to test (e.g., "We help growth teams run outbound 10x faster")
2. **Test goal** — What are you deciding? (Headline for website, cold email angle, LinkedIn content strategy, ad copy direction)
3. **ICP** — Who should this resonate with? (Title, company type, stage)
4. **Current messaging** — What are you using today? (Baseline to beat)

### Test Channel
5. **Where to test:**
   - **LinkedIn organic** — Post variants across consecutive days, compare engagement
   - **Cold email** — A/B test subject lines or opening hooks via Smartlead
   - **Both** — Run in parallel for fastest signal
6. **Sample size available:**
   - LinkedIn: followers/typical impressions per post
   - Email: list size available for testing

### Constraints
7. **Number of variants** — 3-5 recommended (more = slower signal)
8. **Test duration** — How long to run? (Default: 1 week for LinkedIn, 3-5 days for email)

## Phase 1: Generate Messaging Variants

Create 3-5 variants that test different **angles**, not just different words. Each variant should represent a distinct strategic bet:

### Variant Types

| Type | What It Tests | Example |
|------|--------------|---------|
| **Outcome-driven** | Leading with the result | "3x your pipeline in 30 days" |
| **Pain-driven** | Leading with the problem | "Tired of spending 4 hours a day on manual prospecting?" |
| **Identity-driven** | Leading with who they are | "Built for growth teams who move fast" |
| **Proof-driven** | Leading with evidence | "How [Customer] went from 10 to 50 demos/month" |
| **Contrast-driven** | Leading with what you're not | "Not another CRM. An outbound engine." |

### Variant Template

For each variant:
```
VARIANT [N]: [Type — e.g., "Outcome-driven"]

Hypothesis: This framing will resonate because [reasoning tied to ICP psychology]

LinkedIn post version:
---
[Full post copy — 100-200 words, native LinkedIn format]
---

Email subject line version:
[Subject line — max 50 chars]

Email opening hook version:
[First 2 sentences of an email]

Headline version:
[Website headline — max 10 words]
```

## Phase 2: Deploy Tests

### Option A: LinkedIn Organic Test

**Setup:**
1. Schedule variants as consecutive posts (1 per day, same time of day)
2. Each post should be similar length and format (control for post structure)
3. Don't boost any posts — organic only for clean comparison

**Measurement (after 48 hours per post):**
- Impressions
- Reactions (likes, celebrates, etc.)
- Comments
- Comment sentiment (positive/negative/neutral)
- Profile visits (if trackable)
- DMs received mentioning the post

### Option B: Cold Email A/B Test

**Setup via your outreach tool (Smartlead, Instantly, Lemlist, or any tool with A/B testing):**
1. Create campaign with all variants as A/B test sequences
2. Split list evenly across variants (minimum 50 per variant for signal)
3. Same send time, same sender, same CTA — only the messaging changes

**Measurement (after 5 days):**
- Open rate (tests subject line)
- Reply rate (tests full message resonance)
- Positive reply rate (tests conversion quality)
- Click rate (if link included)

### Option C: Both (Recommended)

Run LinkedIn and email in parallel. Different channels may show different winners — that's valuable signal about where each message works best.

## Phase 2B: Collect Results

After the test has run for the planned duration, gather your results:

**How to provide data:**
- **Paste metrics** — Copy open rates, reply rates, engagement numbers directly into the chat
- **CSV export** — Export campaign analytics from your outreach tool and share the file
- **Screenshot** — Take a screenshot of your dashboard/analytics and share it
- **Manual input** — Just tell the agent the numbers: "Variant A got 45% open rate and 3% reply rate, Variant B got 52% open rate and 5% reply rate"

**For LinkedIn tests:** Go to your post analytics (click "View analytics" on each post) and share impressions, reactions, comments, and profile visits per post.

**For email tests:** Export or screenshot your campaign's variant/A-B test results showing sends, opens, and replies per variant.

The agent will normalize whatever format you provide into the scoring framework below.

## Phase 3: Analyze Results

### Scoring Framework

| Metric | Weight (LinkedIn) | Weight (Email) |
|--------|-------------------|----------------|
| Engagement rate | 30% | — |
| Comment quality | 30% | — |
| Open rate | — | 30% |
| Reply rate | — | 40% |
| Positive reply rate | — | 30% |
| Impressions | 20% | — |
| Profile visits / clicks | 20% | — |

### Statistical Significance Check

For email tests:
- **Minimum sends per variant:** 50 (for directional signal), 200+ (for confident decisions)
- **Minimum difference to call a winner:** >20% relative difference in primary metric

For LinkedIn tests:
- **Minimum posts per variant:** 1 (you're testing with limited data — treat as directional)
- **Minimum impressions:** 500 per post to be comparable

### Winner Selection

```
WINNER: Variant [N] — [Type]

Primary metric: [X] (vs average of [Y] across other variants)
Relative improvement: [Z%] over baseline

Why it won:
[1-2 sentences on what this tells us about ICP messaging preferences]

Runner-up: Variant [N]
[1 sentence on when this might work better — different channel, different segment]
```

## Phase 4: Output Format

```markdown
# Messaging A/B Test Results — [DATE]
Value prop tested: [description]
ICP: [target audience]
Test duration: [dates]

---

## Test Design

| Variant | Type | Hypothesis |
|---------|------|-----------|
| A | [Type] | [Hypothesis] |
| B | [Type] | [Hypothesis] |
| C | [Type] | [Hypothesis] |

---

## Results

### LinkedIn Test

| Variant | Impressions | Reactions | Comments | Engagement Rate | Score |
|---------|------------|-----------|----------|----------------|-------|
| A | [N] | [N] | [N] | [X%] | [weighted] |
| B | [N] | [N] | [N] | [X%] | [weighted] |
| C | [N] | [N] | [N] | [X%] | [weighted] |

### Email Test

| Variant | Sends | Opens | Open Rate | Replies | Reply Rate | Positive | Score |
|---------|-------|-------|-----------|---------|------------|----------|-------|
| A | [N] | [N] | [X%] | [N] | [X%] | [N] | [weighted] |
| B | [N] | [N] | [X%] | [N] | [X%] | [N] | [weighted] |
| C | [N] | [N] | [X%] | [N] | [X%] | [N] | [weighted] |

---

## Winner: Variant [N] — "[Headline]"

**Why it won:** [Analysis — what does this tell us about how our ICP thinks?]

**Recommended deployment:**
- Website headline: "[adapted version]"
- Sales deck opening: "[adapted version]"
- LinkedIn bio: "[adapted version]"
- Cold email default: "[adapted version]"

---

## Variant Details & Copy

### Variant A: [Full copy used in test]
### Variant B: [Full copy used in test]
### Variant C: [Full copy used in test]

---

## What to Test Next

Based on these results, the next messaging test should explore:
1. [Angle suggested by results — e.g., "test more specific proof points since proof-driven won"]
2. [Segment test — e.g., "test winning message against different ICP segment"]
```

Save to the current working directory or wherever the user prefers.

## Cost

| Component | Cost |
|-----------|------|
| Variant generation | Free (LLM reasoning) |
| LinkedIn posting | Free (organic) |
| Email testing | Included with your outreach tool's plan |
| Results analysis | Free (LLM reasoning) |
| **Total** | **Free** |

## Tools Required

None. Pure reasoning for variant generation, test design, and result analysis. The user deploys tests through their own tools:
- **LinkedIn organic** — post variants manually or via scheduling tool
- **Cold email** — set up A/B tests in whatever outreach tool they use (Smartlead, Instantly, Lemlist, etc.)
- **Results** — user provides metrics (screenshots, CSV exports, or manual input) for analysis

## Trigger Phrases

- "Test which messaging angle works best for [ICP]"
- "Run a messaging A/B test for [value prop]"
- "Which of these messages should we lead with?"
- "Help me decide between these positioning options"
