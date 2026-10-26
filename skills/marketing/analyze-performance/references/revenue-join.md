# The revenue join — blended truth vs platform claims

Load at step 2. This file is written for the DTC referee; for B2B and apps use the same logic on the type's referee (`measurement-contract.md` §1). Every ad platform overclaims: add up what Meta, Google and the email tool each claim and it exceeds real revenue, because each counts the same order. Blended numbers are the referee; platform numbers explain *within* a platform.

## The business-truth table (store / CRM)

| | This wk | Last wk | 4-wk avg | Same wk LY |
|---|---|---|---|---|
| Net revenue (after refunds/discounts, ex tax/ship) | | | | |
| New-customer revenue | | | | |
| Orders new / returning | | | | |
| AOV · SKU mix (share of revenue from low-margin SKUs, vs per-SKU margins in the brief) | | | | |
| Total marketing spend (all platforms, account totals) | | | | |
| **MER** = net revenue ÷ total spend (label **DTC MER** when retail/marketplace sales exist but aren't in it) | | | | |
| **New-customer MER (aMER)** = new-customer revenue ÷ total spend | | | | |
| **nCAC** = total spend ÷ new customers | | | | |
| Contribution after ads = net revenue × CM% − spend | | | | |

Read against: break-even MER (1 ÷ contribution margin %), the allowable CAC (campaign brief's economics box), and the target in the measurement contract. **Revenue without margin misleads every call** — a week of record revenue at a loss is a bad week.

B2B: replace with leads → qualified → opportunities → pipeline value → won **by original source** (and the self-reported field), cost per qualified lead / per opportunity, CAC payback in months (ACV or ARPA × margin; rule of thumb: under 12–18 months). Check platform-claimed leads against CRM contacts created from that source. Under ~20 SQLs a month the weekly read is leading indicators (meetings held, SQL rate) and pipeline is read monthly, cohorted by lead-created week.

Apps: first-time downloads by source vs platform-claimed installs; activated and D7-retained users by install week; cost per activated/retained user.

**Pacing** (every report): month-to-date spend vs the brief's monthly plan, per platform where known.

## The overclaim ratio

Compare like with like: **sum of platform-claimed purchases ÷ store orders** (preferred), or claimed revenue ÷ store **gross** revenue (platforms count tax, shipping and often view-through; net excludes them). When a claimant's numbers are missing, show the ratio as a floor ("≥ 1.37× — email not provided"). Where the export has attribution-comparison columns, say how much of the gap is view-through. Show it every week with its 4-week trend. A steady ratio (e.g. 1.2–1.4×) is normal; a jump means double counting rose, attribution changed, or a tag broke (see `diagnosis.md`). A ratio below 1 means tracking is losing conversions.

## Marginal, not average

The scale question is what the **last** dollars bought. Spend +$2,000 and new-customer revenue +$1,200 → marginal aMER 0.6, even if blended MER still looks fine. Compute week-on-week deltas (and vs the 4-week average) and put the marginal number next to the average one.

## Two stories, side by side

When the platform story and the blended story point different ways, present both at the same grain — never average them:

> **Platform story:** Meta ROAS 3.2 vs target 2.5 → scale Meta +20%. *If true, you'd scale.*
> **Blended story:** spend +$2,650, new-customer revenue +$300 → marginal aMER ~0.1. Extra spend is buying credit, not customers. *If true, you'd hold and fix creative.*
> **Recommendation:** run on blended this week — hold. **What would settle it:** a 2-week −30% prospecting step-down (or a geo holdout in 3 regions), or a post-purchase "how did you hear about us?" survey to triangulate.
> **Your call** — I'll log which story we run on so it doesn't flip each week.

Log the marketer's pick in the report and use it next week unless new evidence (a test) changes it.

## Incrementality — recommend the cheapest test that settles the disagreement

Match the measurement to the spend: small budgets get tagged links, codes and common sense; larger ones earn a spend step-down, a geo holdout, or a platform lift study (needs scale). Recommend one only when the two stories disagree enough to change where money goes; it becomes a test in plan-campaign's next plan.

## Coverage statement (every report)

"This read sees: store revenue ✓ (export), Meta account total ✓ (pasted), Goose ads in detail (62% of Meta spend), Google ✓, email ✓ (export). Not measured: creators (codes not provided), TikTok (no export)." A channel the brand uses is never silently missing.
