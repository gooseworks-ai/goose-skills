---
name: work-with-creators-rate-and-deal
description: >-
  Prices a creator you have already vetted. Gives a low and a target fee from median views and the
  platform's typical cost per 1,000 views, a walk-away ceiling from your goal and margin, and usage
  rights priced on their own. Checks against real quoted rates and recommends gift, paid, affiliate or
  a mix, with one line showing the math. Use alone when you already have the creator's recent view
  numbers, your goal and your unit cost; otherwise run work-with-creators.
version: 0.1.0
---

# rate-and-deal

**Reads:** verdicts; goal; budget; product unit cost / margin / AOV and any repeat-purchase data from the brain (or the human's answers); past quoted rates (roster, brain learnings); the creator's public media kit or advertise page if found; `../work-with-creators/references/pricing-and-deals.md`.

**Does, per creator:**
1. Base by role: reach/affiliate = median organic views ÷ 1,000 × the platform's CPM band (sponsored median if it is much lower); UGC-for-ads = per asset, with usage as the core fee; LinkedIn = per-post flat-fee band; newsletter/podcast = their published rate, or a conditional range pending the media kit.
2. Apply modifiers that apply (niche, geography, bundle, rush) → floor / target.
3. Price the rights ask separately: organic repost, paid usage / whitelisting term, exclusivity (UGC-for-ads: the per-asset fee includes 30-day usage; longer terms priced with the modifiers).
4. Walk-away ceiling from the goal (reference §6) — sales: organic first order, plus the rights-amplified value = (target CAC − expected CPA on the asset) × expected conversions (planned media ÷ expected CPA), both assumptions labelled; the two add when the deal buys both the post and the usage; awareness: ~2× the brand's paid-social CPM; content: the brand's cost per tested creative, else "no independent ceiling"; B2B: target cost per demo and contract value (asked, never defaulted; missing → "walk-away: not set" and the smallest test); apps: target cost per install or trial.
5. Real evidence beats benchmark: past quoted rates, the creator's media kit. Above ~1.5× benchmark → flag with reason.
6. Deal structure with the reason (gift-first / paid / affiliate / hybrid / UGC per-asset). Target above walk-away → change the structure or cut.
7. One line of math with every input marked "brand number" or "placeholder".

**Writes:** `price_floor, price_target, walk_away, rights_addon, deal_structure, deal_reason, price_math, real_rate_evidence`.

**Rules:** in the free draft, price from public numbers and bands and mark the walk-away "rough — needs your budget and unit cost" instead of asking first; no unit cost or margin (DTC/CPG gifts) → never assume a number; apps are never asked for unit cost. Dollar figures are the human's deal money — never credits. Never present a single number as "the rate". Prices are recommendations; nothing is offered or agreed.
