---
name: plan-campaign-goal-chain
description: >-
  Checks whether a stated goal is reachable on a given budget: fills an economics box with a source on
  every number, subtracts the baseline, works out the implied cost per customer against history or
  labelled base rates, and flags when the goal needs renegotiating. Use alone when you already have
  the goal (metric, number, date), budget, order value, margin and baseline; otherwise run
  plan-campaign.
version: 0.1.1
---

# Goal chain and economics (atom)

**Load:** `../plan-campaign/references/unit-economics.md`, `../plan-campaign/references/company-types.md` (the brand's type).

**Inputs:** the goal (metric, number, date) as the marketer stated it; budget; AOV / ARPA / first-job value; margin or contribution inputs; repeat behaviour if shown; baseline for the same period (marketer or past reports); conversion rates from the brand's history (learnings, past performance reads) or labelled base rates; stock or capacity.

**Do — part 1 (step 2):**
1. Fill the economics box. Every line gets a source: *own history · marketer · base rate (rule of thumb) · assumption*. Unknown margin → a labelled assumption with "confirm margin" first in What we couldn't check (asked only when the plan turns on it).
2. Baseline → incremental target (never credit the campaign for the baseline); implied CAC = budget ÷ incremental target vs history or labelled base rates; stock or capacity vs the goal. Pre-revenue: no allowable CAC — record the marketer's provisional cap.
**Do — part 2 (step 5, after the channels and split exist):**
3. Break the incremental target into per-leg targets with the chain that produces each (list × conversion; spend ÷ CPA; codes from creators), each with a "readable by" date.
4. Run conservative / expected / optimistic using the low / middle / high end of each assumption.
5. Check the forecast against stock (days of cover, inbound) or capacity (open slots).
6. If the expected scenario misses: write the renegotiation case (gap in numbers; what more budget, more time, a smaller goal or a different goal metric each buys; one recommendation). Return it to the playbook to show the marketer before planning further.

**Output:** the plan's `### Goal chain`, `### Economics`, `### If the goal needs changing` sections, and the assumptions list.

**Never:** invent the goal, a margin or a conversion rate and present it as the brand's; pick the renegotiation lever for the marketer.
