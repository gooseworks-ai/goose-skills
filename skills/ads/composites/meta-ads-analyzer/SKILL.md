---
name: meta-ads-analyzer
description: Diagnose Meta Ads campaign performance using Meta's actual system mechanics — Breakdown Effect, Learning Phase, Auction Overlap, Pacing, and Creative Fatigue — and produce structured, testable recommendations that avoid judging segments by average CPA instead of marginal efficiency.
tags: [ads]
---

# Meta Ads Analyzer

Most "Meta Ads analysis" stops at "this CPA is high, pause it." That's wrong more often than it's right. Meta's delivery system optimizes for **marginal efficiency** — the cost of the *next* conversion — not average efficiency across a snapshot. A segment with a higher average CPA is often the one keeping your overall campaign cheap. Pausing it makes things worse.

This skill diagnoses Meta campaigns the way a senior media buyer would: at the right evaluation level, accounting for learning state, separating noise from signal, and explaining *why* the system is making the decisions it's making before recommending any change.

**Core principle:** Holistic first, then drill down. Marginal over average. Dynamic over static. Every recommendation is a testable hypothesis with expected impact, not a directive.

## When to Use

- "Analyze my Meta Ads campaign performance"
- "Why is the system spending more on the higher-CPA placement?"
- "Diagnose what's wrong with this ad set"
- "Should I pause this audience / placement / ad?"
- "My CPA jumped — is this normal or a real problem?"
- "Audit this campaign before I scale budget"
- "I exported my Meta data — what does it actually mean?"

## Phase 0: Intake

1. **Campaign data** — One of:
   - CSV export from Meta Ads Manager (Campaign / Ad Set / Ad level + breakdowns)
   - Pasted performance table
   - Screenshots (we'll extract the metrics)
   - Live data via your existing Meta Marketing API connection
2. **Campaign setup**:
   - Objective (Awareness / Traffic / Engagement / Lead Gen / Conversions / Sales / App Installs)
   - Budget type (Advantage+ Campaign Budget = CBO, or Ad Set Budget = ABO)
   - Placements (Automatic vs. manual)
   - Number of ad sets and ads
3. **Time period** — Date range covered, with any known events (creative refresh, budget change, audience edit, account issue)
4. **Target metrics** — CPA target, ROAS target, or "no target — benchmark me"
5. **Funnel context** (if relevant) — On-platform conversion vs. website event vs. downstream qualification rate
6. **What's making you ask?** — Specific concern ("CPA up 40%"), routine review, or pre-scale audit

## Phase 1: Identify the Correct Evaluation Level

This is the most important step. **Evaluating at the wrong level is the #1 source of wrong recommendations.**

| Campaign Setup | Correct Evaluation Level | Why |
|---|---|---|
| Advantage+ Campaign Budget (CBO) | **Campaign level** | System pools budget across ad sets — only campaign totals reflect reality |
| Automatic placements (no CBO) | **Ad Set level** | System pools budget across placements within the ad set |
| Multiple ads in 1 ad set | **Ad Set level** | System pools delivery across ads |
| Manual placements + ABO | Placement / Ad Set level | Each is independent |

**Output for this phase:** State the evaluation level explicitly and explain why before any metric is interpreted.

> If asked "is this Meta placement underperforming?" on a CBO campaign, the answer is "wrong question — at CBO the placement-level CPA is misleading. Here's the campaign total..."

## Phase 2: Check Learning Phase Status

Before judging anything, check delivery state per ad set.

**Learning state checklist:**
- Status is `Learning` (delivery less stable, CPA typically higher, results not predictive)
- Exits after ~50 optimization events within 7 days of last significant edit
- Shops ads exception: 17 website purchases + 5 Meta purchases
- Status `Learning Limited` = can't get enough events → flag as a structural issue, not a performance issue

**Significant edits that reset learning:**
- Targeting changes
- Optimization event change
- Creative changes (large)
- Bid strategy / amount changes
- Budget changes >20%

**Output for this phase:** Per ad set, mark `Active` / `Learning` / `Learning Limited`. Caveat all conclusions for anything in learning. **Do not recommend pausing a Learning ad set based on CPA alone.**

## Phase 3: Diagnose with Meta-Specific Lenses

Run the diagnosis through these five lenses. Each one explains a different class of "weird" behavior.

### 3A: Marginal Efficiency Analysis (Breakdown Effect)

The Breakdown Effect: the system shifts budget toward segments where the *next* conversion is cheapest, not where the *average* conversion is cheapest. A segment can have a high average CPA in a breakdown report and still be the right place for budget.

**How to spot it:**
- Time-series the segment's CPA. If marginal CPA is rising sharply, expect the system to shift budget out — even if average looks fine.
- A breakdown row with high average CPA + high spend usually means the system found cheap marginal conversions there earlier in the period.

**Mandatory framing in the report:** Never recommend pausing a segment based solely on higher average CPA/CPM in a breakdown report. Removing it will often *raise* total cost. Frame any cut as a hypothesis to test with a holdout, not an instruction.

### 3B: Ad Relevance Diagnostics

For each ad with sufficient impressions (~500+), check the three rankings:

| Ranking | Below Average → | Action |
|---|---|---|
| **Quality Ranking** | Creative is the problem | Test new creative formats / hooks |
| **Engagement Rate Ranking** | Hook isn't pulling | Test new opener / first 3 seconds |
| **Conversion Rate Ranking** | Post-click is leaking | Audit landing page (use `ad-to-landing-page-auditor`) |

Two below average + one average = creative refresh. All three below average = scrap and rebuild.

### 3C: Auction Overlap Check

Symptoms: ad sets in the same campaign chronically `Learning Limited`, underspending budget, or showing erratic delivery.

**Causes:** Overlapping audiences within the same ad account / Page mean only one of your ads enters each auction (Meta picks the highest-value one; the others are excluded — you don't bid against yourself, but the suppressed ad sets can't learn).

**Action:**
- Run Account Overview → Opportunity Score for explicit overlap flags
- Combine similar ad sets (consolidate learning) or pause the weaker overlapping ones

### 3D: Pacing Analysis

Pacing = the system smoothing budget across the day/period to capture the best opportunities. Daily snapshots will look uneven *by design*.

**How to read it:**
- Evaluate spend over the full campaign window, not single days
- If the system is consistently underspending budget, that's a pacing/learning issue, not a "good thrift" — usually points to overlap, narrow audience, or bid-strategy mismatch
- Ignore "$X budget unspent today" alarms unless sustained over 3+ days

### 3E: Performance Fluctuation Assessment

Distinguish noise from trend before recommending anything.

| Signal | Verdict |
|---|---|
| Day-to-day CPA swing within 20–30% | Normal — ignore |
| Weekend vs. weekday delta | Normal — control for it |
| Gradual change over weeks | Trend — investigate |
| Sudden ≥50% cost increase sustained 3+ days | Real problem — diagnose |
| Delivery near zero | Account/asset/policy issue — check first |
| Conv rate dropping while spend rises | Creative fatigue or LP regression |

Always check sample size. A 1-conversion difference at low volume is meaningless.

## Phase 4: Synthesize Through the Breakdown Effect Lens

Before writing the report, restate every finding from Phase 3 in terms of *what the system is trying to do*:

> "Placement A shows $10 average CPA vs Placement B's $15. Time-series shows A's CPA rising. The system is correctly shifting toward B because B's marginal CPA is now lower. Recommendation: do nothing on placements; test new creative in A to lower its marginal CPA."

If a finding can't be restated in marginal/system-mechanics terms, it's probably noise — drop it.

## Phase 5: Generate the Report

Use this exact structure. No deviation.

```
1. EXECUTIVE SUMMARY
   - 2–3 sentences on overall health
   - Top 1 thing to do, top 1 thing NOT to do

2. EVALUATION LEVEL
   - Stated explicitly with the reason

3. LEARNING STATUS
   - Per-ad-set table: Active / Learning / Learning Limited
   - Caveats applied to any in-learning analysis

4. PERFORMANCE OVERVIEW
   - Standardized metric naming (see table below)
   - Aggregate first, then drill-down
   - Compare to target where given, benchmarks otherwise

5. DIAGNOSIS
   - Findings from Phase 3, each tagged to its lens
     (Marginal / Relevance / Overlap / Pacing / Fluctuation)
   - Each finding cites specific data

6. RECOMMENDATIONS
   - Each = hypothesis + expected impact + how to test
   - Marked Critical / High / Medium / Low priority
   - Anything paused/scaled has a rollback plan

7. BREAKDOWN EFFECT NOTES
   - Explicit callouts where average ≠ marginal
   - "Do not do X" warnings if the data tempts a wrong move
```

## Output Standards (Mandatory)

These are not style suggestions. Violating them produces wrong analysis.

- **Never recommend pausing or reducing budget on a segment based solely on higher average CPA/CPM in a breakdown report.** Removing it often raises total cost. State this explicitly when the data tempts a wrong move.
- **Every recommendation includes:** evidence cited from the data + the system mechanic that explains it + expected impact + a rollback plan if it doesn't work.
- **Every recommendation is a hypothesis,** not a directive. Use "test", "try", "hypothesize" — not "do this".
- **Disambiguate clicks.** Never use bare "clicks". Use **Clicks (all)** for total interactions or **Link Clicks** for offsite clicks.
- **Audience size language.** Use "Accounts Center accounts" or a bare number. Never "people". If quoting a specific count, use "person" as the noun (e.g., "17,000 person").
- **Check `get_recommendations` first** if you have live API access. If your recommendation diverges from Meta's, explicitly explain why.

## Metric Naming Standard

Always rename raw metric names to these standardized display names in any output:

| Raw | Display |
|---|---|
| `impressions` | Impressions |
| `reach` | Reach (Accounts Center accounts) |
| `frequency` | Frequency |
| `spend` | Amount Spent |
| `cpm` | CPM |
| `clicks` | Clicks (all) |
| `cpc` | CPC (all) |
| `ctr` | CTR (all) |
| `cost_per_action_type:link_click` | CPC (Link Click) |
| `outbound_clicks_ctr` | Outbound CTR |
| `actions:purchase` | Purchases |
| `action_values:purchase` | Purchase Value |
| `cost_per_action_type:purchase` | Cost per Purchase |
| `purchase_roas` | Purchase ROAS (return on ad spend) |
| `video_thruplay_watched_actions` | ThruPlays |

## Reference: Domain Concepts

### The Breakdown Effect

The misinterpretation that Meta's system shifts budget into "underperforming" segments. In reality the system maximizes total results by optimizing for **marginal efficiency**. A breakdown report sliced by placement, demographic, or device shows averages — but the system optimizes for the next dollar, not the average. A segment with high average CPA may be protecting overall campaign efficiency by preventing even higher marginal cost elsewhere.

### Learning Phase

Delivery state where the system is exploring how to deliver a new or significantly edited ad set. Performance is less stable, CPA is typically higher, and results are not predictive of long-term performance. Exits after ~50 optimization events within 7 days of the last significant edit. **Don't edit during learning** (resets the clock). **Don't fragment** with too many ad sets (each needs its own 50 events). Use **realistic budgets** — too small or too large gives bad signal.

### Auction Overlap

When ad sets share overlapping audiences within the same ad account, only the highest-value ad from your portfolio enters each auction. The others are excluded. Symptoms: chronic `Learning Limited`, underspending, erratic delivery. Fix: consolidate ad sets, or pause the lower-performing overlapping ones to free up auction entries.

### Pacing

The system spreads spend across the day/period to capture best opportunities. Daily under/overspend is by design — only sustained underspend (3+ days) is a real signal.

### Creative Fatigue

Effectiveness decreases as the same audience sees the same creative repeatedly. Watch frequency (>3–4 in a 7-day window for prospecting) and conversion-rate decline while spend stays flat. Refresh creative on a rotation rather than waiting for fatigue to show in CPA.

### Performance Fluctuations

Day-to-day CPA variation within 20–30% is normal. Weekend/weekday differences are normal. Sudden ≥50% sustained cost increases over 3+ days, near-zero delivery, or conv-rate drops while spend rises are the only patterns worth diagnosing as "problems."

## What This Skill Will Not Do

- **Will not write to your ad account.** Pure analysis. Use Meta Ads Manager or whatever write tool the calling agent has available for execution.
- **Will not generate creative.** Use `messaging-ab-tester` for variants and `ad-angle-miner` for source material.
- **Will not analyze landing pages.** Use `ad-to-landing-page-auditor` — and use it whenever Conversion Rate Ranking is below average.
- **Will not multi-platform compare.** Use `ad-campaign-analyzer` for cross-channel budget reallocation.

## Related Skills

- **`ad-campaign-analyzer`** — Multi-platform performance review and budget reallocation. Run this first if you have multiple channels; run `meta-ads-analyzer` after for the Meta-specific deep dive.
- **`ad-to-landing-page-auditor`** — Always pair with this when Conversion Rate Ranking is below average.
- **`messaging-ab-tester`** — Generate variants when creative fatigue is the diagnosis.
- **`meta-ads-campaign-builder`** — Architect a new campaign when the diagnosis points to "rebuild, don't fix".

## Credit

Meta system-mechanics framing (Breakdown Effect, Learning Phase, Auction Overlap reference content) adapted from an MIT-licensed Meta ads analyzer project by Mathias Chu.
