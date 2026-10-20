---
name: analyze-performance-diagnose
description: >-
  Step of the analyze-performance playbook: flags tracking breaks with fixes and explains each big
  metric move with evidence, confidence and ruled-out causes. Run analyze-performance instead; not for
  direct use.
version: 0.1.0
---

# Plumbing and the why (atom)

**Load:** `../analyze-performance/references/diagnosis.md`.

**Inputs:** the clean dataset; the overclaim ratio and its trend; the change log (`decisions.md`); push failures/disapprovals reported by run-paid-campaigns or the marketer; the competitor watch digest; research-market's "What people are saying" section (newest `research/market/<D>-read.md`; check its window); the promo calendar and stock notes from the brief; destination URLs of top ads.

**Do:**
1. Plumbing: test each break signature (ratio jump/collapse, zero-conversion days with spend, ROAS spike with flat orders, LPV/click drop, UTM traffic missing). For each break: symptom, likely location, what to check, the fix when identifiable, what it blocks. Mark affected numbers suspect.
2. For each metric that moved materially at equal maturity: read the change log, check noise, mix shift, breakdown effect and denominator changes, then walk the cause checklist in order. One piece of evidence per named cause; confidence; ruled-out and unconfirmed causes listed.
3. Page/message match for the top 2–3 winners and losers (open the page if the host can browse; else ask for a screenshot): product, promise, offer, price, stock.

**Output:** the report's Plumbing and Why-it-moved sections, and mismatches to note.
