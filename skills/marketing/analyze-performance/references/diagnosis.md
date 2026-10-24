# The why — named causes with evidence, and plumbing flags

Load at step 3. A delta is not an explanation. For every metric that moved materially (vs last week **and** the 4-week average, at equal maturity), walk the checklist, name the causes that fit with one piece of evidence each and a confidence, and state the causes you ruled out and how.

## Before blaming anything

- **Compare like with like:** same weekdays, same maturity (drop the immature last ~3 days of platform conversions), promo week vs promo week, same timezone, same attribution setting.
- **Read the change log first** (run-paid-campaigns' `decisions.md`): a budget step, a swap or a launch inside the window explains many spikes; learning resets after significant edits.
- **Noise:** conversions are roughly Poisson (SD ≈ √n). 25 vs 36 purchases is ~1.4σ apart — not a result. Under ~30 conversions per arm, only ~2× gaps are readable.
- **Mix shift / Simpson's paradox:** blended CPA rises because spend moved to prospecting or a pricier product, not because anything got worse — read within segment before blaming creative.
- **Breakdown effect:** Meta buys the cheap marginal conversions in a placement or age band; the segment with the high *average* CPA is not necessarily the waste.
- **Denominator changes:** a new SKU, price change, out-of-stock hero product or site change moves conversion rate regardless of ads.

## The cause checklist (in this order)

| Cause | Evidence that confirms it | Evidence that rules it out |
|---|---|---|
| **Tracking / plumbing** | overclaim ratio jumps or collapses; zero-conversion days with spend; ROAS spike with flat store orders; landing-page views per click drop sharply; UTM traffic disappears from the store | ratio steady (state the numbers) |
| **Spend / mix shift** | spend moved between campaigns, audiences, products (change log, exports) | mix steady |
| **Auction / seasonality** | CPM up across the account (export), known season (Q4/BFCM CPMs commonly +30–80%), same week last year moved the same way | CPM flat; LY flat |
| **Creative fatigue** | CTR (and CVR) sliding 2–3 weeks at flat spend; frequency rising (export) | CTR steady |
| **Offer / price / stock** | promo ended or started; price change; featured SKU out of stock | none in the window |
| **Site / landing page** | CTR steady or up while click → purchase falls; page change; slow/broken page | funnel steady |
| **Competitor move** | the competitor watch digest (research-competitors) shows a launch or promo in the window | nothing in the digest |
| **Conversion lag** | the window's last days immature; B2B stage lag | window mature |
| **Retail / marketplace halo** | ads drive sales at a retailer or Amazon the store doesn't see; sell-through moved with ad spend | retailer data flat or provided and unmoved |
| **Organic / PR / halo** | a post or press spike (social analytics, research-market's "What people are saying"), brand-search lift | none |

Without frequency or CPM data, fatigue and auction causes are **candidate, unconfirmed** — say so and ask for the export if the call depends on it.

Write each cause as: *Cause (how sure — confirmed / likely / first look): evidence.* Example:
> 1. Creative fatigue on the top 2 ads (likely): CTR 1.1% → 0.7% over 14 days on steady spend; they carry 55% of Goose spend.
> 2. Seasonal CPM (likely): same week last year CPA +22%.
> Ruled out — tracking break: Meta purchases ÷ store new orders held at 0.71 (vs 0.69).
> Unconfirmed — competitor promo: competitor digest shows 30%-off from 6 Oct; no way to size its effect.

## Plumbing flags (loud, top of the report)

Inputs: the numbers; run-paid-campaigns' `state.md` health line (tracking, stock, disapprovals, push failures); the marketer's reports. **Measurement absent by design** (no attribution/analytics on an app, no source field on leads, no UTMs) is a plumbing flag with setup steps: what to turn on, who does it, and which next decision it unblocks.

Fix instructions are plain click-path steps the marketer asked for (as with run-paid-campaigns' cards), never ids or code. The agent cannot inspect pixels, server events, tags or feeds directly; it detects breaks from the numbers and from what run-paid-campaigns or the marketer reports (push failures, disapprovals, feed errors). For each break write a **fix instruction** at the depth the evidence allows:

> **Tracking — likely broken since Thu 9 Oct.** Symptom: Meta reported 3 purchases Thu–Sun vs 61 store orders from Meta UTMs (normal ratio ~0.7). Likely location: the purchase event on the order-confirmation page (a theme or checkout change Thursday?). Check: Events Manager → your pixel → Purchase event, last 7 days; Test Events on a test order. Fix if confirmed: re-add the purchase event to the confirmation page / re-connect the store integration. Until fixed: run-paid-campaigns makes no scale moves; Meta's CPA this week is not usable.

A break poisons every later number, so the report marks every affected figure as suspect and tells run-paid-campaigns its "tracking verified" gate is failing.

## Page and message match (light, read-only)

For the top 2–3 winning and losing ads only: open the destination (when the host can browse; otherwise ask for a screenshot) and check the product shown, headline promise, offer/code, price and stock match the ad. Mismatches are listed with the ad, the page and the gap. If the marketer provides the store funnel (sessions → add-to-cart → checkout → purchase), note the step that moved. Fixes are audit-my-pages' (backlog) — this playbook only reports.
