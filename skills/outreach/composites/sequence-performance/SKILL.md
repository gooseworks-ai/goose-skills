---
name: sequence-performance
version: 1.0.0
description: >
  Email campaign/sequence performance review composite. Pulls campaign data
  (sends, opens, replies, bounces), reads actual email copy and subject lines,
  analyzes reply content (objections, positive interest, questions), and produces
  a diagnostic report covering quantitative metrics, copy quality, lead quality,
  and actionable recommendations. Tool-agnostic — works with Smartlead (MCP),
  Instantly, Outreach, Lemlist, Apollo, or CSV data.
tags: [research]
---

# Sequence Performance

Goes beyond vanity metrics. Most campaign reports tell you open rate and reply rate. This skill reads the actual emails you sent, reads every reply you received, classifies the responses, evaluates your copy, evaluates your lead quality, and tells you specifically what's working, what's not, and what to do about it.

**Three layers of analysis:**
1. **Quantitative:** The numbers — sends, opens, replies, bounces, conversions, by touch and by variant
2. **Qualitative (Copy):** Are the subject lines, email bodies, CTAs, and personalization actually good?
3. **Qualitative (Replies):** What are people actually saying? What objections keep coming up?

## When to Use

Use this skill when:
- User says "how's my campaign doing", "sequence performance", "campaign review", "email analytics"
- User says "analyze my outreach", "why isn't my campaign working", "review my email results"
- A campaign has been running for 7+ days and has meaningful data

## Phase 0: Intake

### Outreach Tool
1. What outreach tool do you use? (Smartlead / Instantly / Outreach.io / Lemlist / Apollo / Other)
2. How do we access campaign data? (MCP tools / API / CSV export / paste metrics)

### Campaign Selection
3. Which campaign? (name or ID)
4. Date range? (or "all data")

### Your Company Context (for copy evaluation)
5. What does your company do? (one-liner)
6. Who is your ICP? (titles, industries, company size)
7. What problem do you solve?
8. What's your CTA goal? (book meeting, get reply, drive to page)

### Benchmark Context
9. Is this cold outreach or warm/nurture?
10. What segment are you selling to? (SMB, mid-market, enterprise)

## Step 1: Pull Campaign Data

Pull three categories of data from the user's outreach tool:

### A) Campaign Metrics

| Data Point | What We Need |
|-----------|-------------|
| Total emails sent | By touch (Touch 1, Touch 2, Touch 3, etc.) |
| Total unique recipients | Deduplicated count |
| Opens | By touch, unique opens vs. total opens |
| Replies | By touch, total reply count |
| Bounces | Hard bounces + soft bounces |
| Unsubscribes | Count |
| Clicks | If link tracking is on |
| Positive replies | If categorized in the tool |
| Meetings booked | If tracked |

**How to pull by tool:**

| Tool | Method |
|------|--------|
| **Smartlead** (MCP) | `mcp__smartlead__get_campaign_stats`, `mcp__smartlead__get_campaign_sequence_analytics`, `mcp__smartlead__get_campaign_variant_statistics` |
| **Instantly / Outreach / Lemlist / Apollo** | Ask user for CSV export or paste metrics |
| **Other** | User provides CSV with columns: email, status, opened, replied, bounced |

### B) Email Copy (Sequence Content)

Pull the actual templates for every touch:

| Tool | Method |
|------|--------|
| **Smartlead** (MCP) | `mcp__smartlead__get_campaign_sequences` |
| **Others** | User pastes the copy or provides CSV export |

### C) Reply Content

Pull the actual text of every reply:

| Tool | Method |
|------|--------|
| **Smartlead** (MCP) | `mcp__smartlead__get_campaign_leads_history`, `mcp__smartlead__fetch_master_inbox_replies` |
| **Others** | User provides reply dump or CSV export |

### Human Checkpoint

```
Campaign: [name]
Status: [active/paused/completed]
Sent: X emails to Y recipients
Replies: Z (full text pulled for analysis)
Touches: N touches, M variants

Data looks complete? (Y/n)
```

## Step 2: Quantitative Analysis

### Benchmarks

| Metric | Cold (SMB) | Cold (Mid-Market) | Cold (Enterprise) | Warm/Nurture |
|--------|-----------|-------------------|-------------------|-------------|
| Open rate | 40-60% | 30-50% | 25-40% | 50-70% |
| Reply rate | 3-8% | 2-5% | 1-3% | 10-20% |
| Positive reply rate | 1-3% | 0.5-2% | 0.3-1% | 5-10% |
| Bounce rate | <3% | <3% | <2% | <1% |
| Unsubscribe rate | <1% | <1% | <0.5% | <0.5% |

### Calculate

**Overall metrics:** open rate, reply rate, positive reply rate, bounce rate, unsubscribe rate, deliverability rate. Compare each to the benchmark.

**Per-touch breakdown:**
- Touch-level open/reply rates
- Marginal reply rate (replies from THIS touch / people who received this touch but hadn't replied yet)
- Touch contribution (what % of total replies came from each touch)

**Variant analysis (if A/B testing):**
- Open rate and reply rate per variant
- Statistical confidence: <50 sends = "insufficient data", 50-100 = "directional", 100-250 = "likely winner", 250+ = "statistically significant"
- Winner recommendation: scale, keep testing, or kill

## Step 3: Reply Analysis

Read every reply, classify it, and extract patterns.

### Reply Categories

| Category | Definition |
|----------|-----------|
| **Positive interest** | Wants to learn more, open to a conversation |
| **Meeting request** | Explicitly asks to meet or provides availability |
| **Warm / Curious** | Interested but non-committal, asks questions |
| **Objection — Timing** | Not now, but potentially later |
| **Objection — Budget** | Can't afford or not a priority |
| **Objection — Competitor** | Already using a competing solution |
| **Objection — Relevance** | Doesn't see the fit |
| **Objection — Authority** | Not the right person |
| **Not interested** | Flat no |
| **Auto-reply / OOO** | Automated response |
| **Referral** | Redirects to someone else |
| **Question** | Asks about product/offering |

### Objection Patterns

- Which objection appears most? (reveals systemic issues)
- Do objections cluster at Touch 1 (bad targeting) vs. Touch 3 (fatigue)?
- Which are handleable (timing, authority) vs. terminal (relevance)?
- What exact language do people use?

### Positive Signal Patterns

- Which touch/variant generated positive replies?
- What do positive responders have in common? (title, industry, company size)
- What questions do warm leads ask? (reveals what's missing from the email)

### Reply Quality Score

| Score | Criteria |
|-------|---------|
| **Strong** | >50% positive/warm. Objections are handleable. |
| **Mixed** | 30-50% positive. Mix of handleable and terminal. |
| **Weak** | <30% positive. Dominated by "not interested" and "not relevant." |
| **Toxic** | High unsubscribe + angry replies. Something is fundamentally wrong. |

## Step 4: Copy Quality Assessment

Evaluate the actual email copy against best practices and reply data.

### Subject Lines

| Criterion | Red Flags |
|-----------|-----------|
| Length | >60 chars gets truncated on mobile |
| Specificity | Generic "Quick question" or "Checking in" |
| Spam triggers | "Free", "Limited time", ALL CAPS |
| Open rate correlation | Low open rate = subject line problem |

### Email Body

| Criterion | Red Flags |
|-----------|-----------|
| Hook (first line) | "I'm reaching out because..." or "We are a company that..." |
| Length | Over 150 words |
| Value prop clarity | Jargon, vague language, buzzwords |
| Proof points | No proof = no credibility |
| Personalization | Only `{first_name}` merge field |
| CTA | Multiple CTAs, high-friction asks, or no CTA |
| Filler language | "Hope this finds you well", "just checking in" |
| Sequence progression | Touch 2 is just a "bump" of Touch 1 |

### Grades

Grade each touch A through F on: hook quality, value prop clarity, proof usage, personalization level, CTA quality.

## Step 5: Lead Quality Assessment

Evaluate whether we're sending to the right people.

### Targeting Check

- Do lead titles match ICP buyer/champion/user personas?
- Are leads in target industries?
- Right seniority level for the ask?
- Company size in target range?

### Signal Quality (from replies)

| Pattern | What It Tells You |
|---------|------------------|
| High "not relevant" replies | Sending to people who don't have the problem |
| High "wrong person" replies | Right companies, wrong roles |
| High "already have a solution" | Right problem, late to the party |
| High "timing" objections | Right people, right problem, wrong moment — not a targeting issue |
| Low reply + high open rate | People open but don't find it relevant — copy/targeting mismatch |
| High bounce rate | List quality issue — bad emails, old data |

## Step 6: Generate Report

### Report Structure

```
# Sequence Performance Review: [Campaign Name]
**Period:** [date range] | **Status:** [active/paused/completed]

---

## Executive Summary

**Overall verdict:** [One sentence]

| Dimension | Grade | Assessment |
|-----------|-------|-----------|
| Metrics | [A-F] | [one-liner] |
| Copy Quality | [A-F] | [one-liner] |
| Lead Quality | [A-F] | [one-liner] |
| Reply Quality | [Strong/Mixed/Weak/Toxic] | [one-liner] |

### What's Working (Double Down)
- [Specific thing with data]

### What's Not Working (Fix or Kill)
- [Specific thing with data]

### Top 3 Actions
1. [Highest-impact action]
2. [Second]
3. [Third]

---

## Detailed Metrics

### Overall Performance
| Metric | Actual | Benchmark | Status |
|--------|--------|-----------|--------|
| Open rate | X% | Y% | [above/below] |
| Reply rate | X% | Y% | [above/below] |
| Bounce rate | X% | <3% | [flag] |
| ... | ... | ... | ... |

### Performance by Touch
| Touch | Sent | Open Rate | Reply Rate | Marginal Reply Rate | % of Total Replies |
|-------|------|-----------|------------|--------------------|--------------------|
| 1 | X | Y% | Z% | Z% | W% |

### Variant Performance (if A/B testing)
| Touch | Variant | Subject | Sent | Open Rate | Reply Rate | Confidence | Action |
|-------|---------|---------|------|-----------|------------|------------|--------|

---

## Reply Deep Dive

### Reply Classification
| Category | Count | % of Replies |
|----------|-------|-------------|

### Top Objections
| Objection | Count | Handleable? | Suggested Response |
|-----------|-------|------------|-------------------|

### Notable Replies
[5-10 most instructive replies with quotes]

---

## Copy Assessment
[Subject line verdicts, body grades, sequence architecture assessment]

---

## Lead Quality
[Targeting assessment, actual vs intended ICP]

---

## Recommendations (Prioritized)

### High Priority (Do This Week)
1. **[Action]** — [data point] → [expected impact]

### Medium Priority (Do This Month)
2. **[Action]** — [data point] → [expected impact]

### Kill List
- [Anything that should be stopped]
```

### Recommendation Logic

| Finding | Recommendation |
|---------|---------------|
| Open rate below benchmark | Subject line rewrite — suggest 3 alternatives |
| Reply rate below + open rate fine | Body copy issue — focus on hook, proof, CTA |
| Both below benchmark | Full sequence rewrite |
| High "not relevant" objections | Targeting issue — tighten ICP filters |
| High "wrong person" referrals | Title targeting issue — shift to referred titles |
| High "already have solution" | Add competitive differentiation to copy |
| High "timing" objections | Not a problem — set up 90-day re-engagement |
| One variant clearly winning | Scale winner, test new idea in losing slot |
| Touch 2/3 near-zero marginal replies | Cut sequence short or rewrite with new angles |
| High bounce rate | List hygiene — verify emails, check data source |
| Deliverability <95% | Infrastructure — check SPF/DKIM/DMARC, reduce volume |

### Human Checkpoint

Present the executive summary, then ask:

```
Full detailed report available. Want to see the full breakdown, or act on a specific recommendation?
```

## Adapting to Data Availability

| Missing Data | What Gets Skipped | Still Useful? |
|-------------|-------------------|--------------|
| Reply text | Reply classification + objection patterns | Partially — metrics + copy still run |
| Variant data | Variant analysis | Yes — single-variant analysis still runs |
| Lead demographics | Targeting assessment | Yes — infers from reply patterns |
| Open tracking | Open rate analysis | Partially — reply rate + copy still run |

**Minimum viable data:** Emails sent + reply count + email copy text.

## Cost

Free. Pure reasoning + data from user's outreach tool.

## Tips

- **Run at Day 7 and Day 14.** Day 7 catches deliverability and subject line problems. Day 14 gives enough replies for objection analysis.
- **Reply analysis is where the gold is.** Metrics tell you WHAT. Replies tell you WHY.
- **High open + low reply = copy problem.** The subject gets them to open but the email doesn't deliver.
- **Low open + decent reply rate = subject line problem.** The email works, people just aren't seeing it.
- **"Not relevant" is the most important objection.** If >20% say "this isn't for me," it's targeting, not copy.
- **Don't kill a variant too early.** Need 100+ sends per variant for directional data.
- **Touch 2/3 should contribute 30-40% of replies.** If Touch 1 is 90%+, your follow-ups aren't adding value.
