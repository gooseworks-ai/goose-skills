# Reading results before calling a winner or loser

Load at step 3 (the weekly read). The platforms automate targeting and bidding; the operator's job is to read noisy data honestly and move money, creative and signals. Rules of thumb are labelled — the account's own history beats them.

## The yardstick

- **Allowable CPA** (or cost per qualified lead / per retained user) comes from the campaign brief's economics box. If absent, derive it from margin and the goal (`../../plan-campaign/references/unit-economics.md` logic: contribution per first order, plus repeat contribution in the window the marketer accepts), or ask. Write it in `state.md`'s header; every call keys off it.
- **Break-even ROAS** = 1 ÷ contribution margin %. A "3.0 ROAS" ad is losing money at a 30% contribution margin.
- **Blended is the referee.** analyze-performance's store-joined read (MER, new-customer CAC) outranks any platform's claim. If platform ROAS rose but new customers or blended MER did not, the "win" is harvested demand — say so.

## The volume regime (decide it first — it changes windows, thresholds and cadence)

| Regime | Looks like | Window | Cadence | Judge on |
|---|---|---|---|---|
| **High-volume** | ≥ ~50 conversions/week on the optimised event (most DTC on Meta/Google) | last 7 and 14 days, matured | weekly moves | cost per result vs allowable, store-joined |
| **Low-volume lead-gen / services** | a handful of qualified leads a week (B2B, local, high-ticket) | 14–28 days, matured past the lead→qualified lag | **decide monthly**; weekly = fixes + "no moves; next decision <date>" | cost per qualified lead / opportunity; weekly only upstream signals (CTR, CPL × the source's qualified rate) |
| **App** | install campaigns, SKAN/AEM delays, MMP if any | 7–14 days matured past postback delay | weekly reads, decisions every 1–2 weeks | cost per trial / D7-retained user / payer, never CPI alone |

Very low volume (a handful of qualified leads a month): make the monthly call at **channel / campaign level over 60–90 days**, judge ads on CPL × the source's qualified rate and lead-quality notes, recommend consolidation, and offer offline-conversion import (Google) as a setup card. Below ~5 qualified conversions per object per window, do not write a both-readings block per object — say the object is unreadable and when it will be read. LinkedIn and Google have no Meta-style 50-event learning phase: the learning-budget formula below is a Meta rule; on Google Smart Bidding use its ~30 conversions / 30 days guidance, and on LinkedIn judge on spend and qualified rate.

## Getting windows from the tools

**Local mode** (`local-mode.md`): the connector's own date-range reads give exact windows (no subtraction), else the marketer's export; skip the rest of this paragraph. With GooseWorks: `meta_read view: performance` returns trailing totals, not daily series. Call it with `days: 14` and `days: 3` and subtract to get the matured 11-day window; call `days: 7` / `14` / `28` to approximate a trend. Trends from these are approximate — say so. Subtract counts (spend, results, clicks), never ratios; recompute cost per result from the subtracted counts. A past money move is read with its stored baseline recipe and two windows pulled the same way today (`run-memory.md`), never against last week's recorded numbers alone.

## Before any number is used

1. **Maturity.** Exclude the last ~72 hours (late-reported conversions); for B2B leads, the stage lag (2–6 weeks to qualified). Compare equal-maturity windows.
2. **Same attribution setting and window** (Meta default 7-day click / 1-day view). Comparisons across an attribution-setting change are void. Treat view-through credit with suspicion.
3. **Coverage.** With GooseWorks, `meta_read` sees Goose creatives only (local mode: say what share of spend the connector or export shows). State what share of spend the read covers; never treat the Goose subset as the account. Non-Goose numbers come from the marketer's export or analyze-performance.
4. **Change log first.** Read `decisions.md`: a budget edit, swap or launch inside the window explains a spike or dip. A promo, stock-out, price change or CPM season (Q4/BFCM CPMs commonly +30–80%; early January cheap) changes the denominator regardless of the ads.
5. **Objective.** A Goose NEW_CAMPAIGN is Traffic-optimised: Meta finds cheap clickers. Judge it on CTR, cost per landing-page view and the **store conversion rate of its UTM traffic** — never on purchase CPA against a purchase-optimised benchmark.

## Noise (say "unreadable" rather than force a call)

- Conversions are roughly Poisson: relative uncertainty ≈ 1/√n. 10 conversions ≈ ±32% (1σ); 25 ≈ ±20%; 100 ≈ ±10%.
- Two ads at equal spend: z ≈ (a − b) ÷ √(a + b). 100 vs 80 → z ≈ 1.5: still not a result.
- Under ~30 conversions per arm, only gaps of roughly 2× are readable.
- **Rank by spend first, then judge efficiency.** Ranking by return floats tiny-spend flukes to the top — ask for results ranked by spend. An ad at $30 with 2 orders does not beat an ad at $900 with a $35 CPA.

## Learning

- Meta's guideline: ~50 optimisation events per ad set per 7 days to exit learning. Learning status cannot be read — derive it from events per week.
- Significant edits (budget, bid, targeting, a new ad) can reset learning: **at most one significant edit per ad set per week**; a creative swap counts.
- Learning budget ≈ allowable CPA × 50 ÷ 7 per day per ad set (at $40 → ~$285/day). If unaffordable, optimise for a higher-funnel event or consolidate ad sets — and say so.
- Ads launched in the last 3–5 days or under ~1× allowable CPA in spend: **hold**, with a re-decide date.

## Breakdown effect and marginal cost

- Meta deliberately shifts spend to the lowest **marginal** cost. Ads inside one ad set are not a fair split test, and the ad (or placement, age band) with the higher *average* CPA often took little spend at good marginal efficiency. Pausing it frequently raises the blended CPA.
- After a scale step, judge **incremental spend ÷ incremental conversions**, not the new average. A $40 average at $100/day can be a $60 marginal at $150/day.

## Fatigue

Without frequency data, use the proxy: CTR (and/or conversion rate) falling over 2–3 weeks at flat spend and flat audience. With an export: prospecting 7-day frequency above ~2.5–3 with CTR falling = fatigue; retargeting tolerates ~5–8. Early creative floors (rules of thumb, vertical-dependent): Meta feed link CTR below ~0.5–0.8%, hook rate (3-second views ÷ impressions) below ~20–25% → weak hook.

## Quality (lead-gen)

CPL means nothing without the qualified rate. Key B2B/services calls to cost per SQL / opportunity / booked call from the CRM numbers the marketer or analyze-performance provides. A lead-form spam surge looks like a winner.

## Company types

- **DTC:** break-even ROAS and first-order vs LTV allowable; blended MER as referee; stock on the SKU an ad sells; retargeting and brand-search "wins" are low-incrementality — never the scale case.
- **B2B SaaS lead-gen:** volume rarely hits 50/week → optimise to a higher-funnel event; judge on 14–28-day windows; LinkedIn usually dominates (written-instruction mode); CRM offline-conversion upload is a written setup step.
- **Consumer app:** no install levers in GooseWorks (written instructions); SKAN/AEM delays 24–72h+; judge cost per D7-retained user or trial, not CPI; the MMP is the truth.
- **Local:** GooseWorks launches target whole countries only — radius campaigns are written instructions; $10–50/day budgets never exit learning on purchases — optimise for leads/calls; judge on leads per week and lead quality.
- **Services:** like B2B; tiny n; lead quality is the gate.
- **Marketplace seller (Amazon):** judge on TACoS (ad spend ÷ total sales) and organic rank on key terms, not ACoS alone; never scale an ASIN low on stock or off the Buy Box; all moves are cards (`written-instructions.md`).
