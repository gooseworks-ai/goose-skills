---
name: analyze-performance-revenue-join
description: >-
  Step of the analyze-performance playbook: joins cleaned store or CRM numbers with ad spend to build
  the business-truth table, MER, new-customer cost and the overclaim ratio. Run analyze-performance
  instead; not for direct use.
version: 0.1.0
---

# Revenue join (atom)

**Load:** `../analyze-performance/references/revenue-join.md`.

**Inputs:** clean store/CRM numbers; total spend per platform; platform claims; break-even MER and allowable CAC (campaign brief economics box / measurement contract); last week's report (the story the marketer picked).

**Do:**
1. Business-truth table: this week, last week, 4-week average, same week last year.
2. MER, new-customer MER, nCAC, contribution after ads — each vs break-even / allowable / target.
3. Overclaim ratio, like-for-like as in the reference (claimed purchases ÷ store orders, or claimed revenue ÷ store gross; a floor when a claimant is missing), with its 4-week trend.
4. Marginal: Δ new-customer revenue ÷ Δ spend vs last week and vs the 4-week average.
5. If the platform and blended stories point different ways: write both at the same grain, each ending "if true, you'd…", a recommendation, and the cheapest test that would settle it. Carry forward the story the marketer picked last time unless a test changed it.
6. B2B: pipeline chain and cost per qualified lead / opportunity instead of revenue.

**Output:** the report's Business truth, overclaim line and Two stories sections.
