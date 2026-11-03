# Drafting the moves

Load at step 4. Each move is a recommendation `R<n>` in `state.md` (cards too) — an internal id the marketer never sees; the proposal numbers moves 1, 2, 3 — with: object · move · evidence (window, spend, results vs allowable) · how sure (confirmed / likely / first look) · expected effect · how it will be applied · check date and decision rule at the check. Rules of thumb are labelled; judgment stays with you.

In the **low-volume regime** a normal week is fixes plus "no moves; next decision <date>"; scale/pause decisions are monthly on matured 14–28-day windows. In the **app regime** never point a Goose Traffic campaign at an app-store URL as a stand-in for an install campaign.

## Move types

| Move | When (rules of thumb) | How |
|---|---|---|
| **Scale** | Past learning, CPA (or store-joined CPA) within allowable on mature data, enough conversions to read; **blended read agrees** (no scale while new-customer MER is below break-even, whatever the platform CPA) | +20–30% per weekly run while CPA holds (a second step mid-week only via a scheduled check on an ad set past learning); never more than 2× in one step; never overnight doubling. Horizontal (duplicate into a new ad set) when vertical scaling stalls — written instruction. |
| **Pause / kill** — note: pausing one ad inside an ad set moves its spend to the sibling ads; it only saves money if the ad set budget is cut too (a separate move) | 0 conversions after 2–3× allowable CPA spent; or CPA > 1.5–2× allowable after 3–5× allowable spent; or broken (destination 404, out-of-stock SKU, ended offer still in the copy, disapproved) | Goose ad: pause with the marketer's sentence. Anything else: written instruction. Kill = pause, never revert. |
| **Hold** | Inside learning; under ~1× allowable spend; 1.0–1.5× allowable on modest spend (1.3–1.5× after 3–5× allowable spent is a near-threshold call — both readings); data immature; within a week of another significant edit | No action; **always** a re-decide date and a trip-wire. |
| **Rotate** | Fatigue proxy (CTR/CVR sliding 2–3 weeks at flat spend) or frequency past threshold; or a winner ageing toward its usual lifespan (Meta/TikTok prospecting 2–4 weeks, TikTok often 7–14 days, LinkedIn 4–6 weeks) | Swap in an approved finished render (`propose_meta_creative_replacement`) **before** decay; if none exists, a rotation request to make-static-ads for image ads (see below), or, for video ads, a brief offered as the next job with the goose-video skill (without GooseWorks: for whoever makes their videos). Keep 2–3 new concepts in test at meaningful spend at all times. |
| **Launch / test** | The brief's test plan calls for it, new approved creative exists | See `launch-and-graduate.md`. |
| **Graduate** | A Goose Traffic test's angle wins on cost per LPV and UTM store conversion | Push the winning ads into the marketer's conversion-optimised ad set (EXISTING_AD_SET); scaling that ad set is a written instruction. |
| **Consolidate** | Several ad sets each under the learning floor | Written instruction: merge into one ad set / one campaign, broad targeting. |
| **Fix / setup** | Tracking, exclusions (purchasers out of prospecting), Advantage+ creative-enhancement toggles altering approved claims, account spending limit, offline conversion upload | Written instruction. |
| **Google / TikTok / LinkedIn moves** | Same logic on the marketer's export | Written instructions; Google search-terms negatives from analyze-performance's wasted-spend list. Google Smart Bidding: change tCPA/tROAS by ≤15–20% at a time, ~7 days to re-learn. |

## Lifetime budgets (Goose launches)

A lifetime increase is not a daily-rate increase. Implied daily pace = (lifetime − spent) ÷ days remaining. Express each scale step against that pace: e.g. $900 lifetime, $540 spent, 6 days left = $60/day; +25% → $75/day → new lifetime $540 + 6 × $75 = **$990**. Never raise a lifetime budget in a flight's last 2 days (it dumps spend). The end date can't be changed through the tools — "flight ends Friday: extend or let it end" is its own item (written instruction).

## Pacing and the ceiling

Checks and pacing, in every proposal: month-to-date spend vs plan (tolerance ±10%), and projected month-end **if every move is approved**, vs the budget ceiling. Approved moves must sum within the ceiling; if they don't, cut the lowest-confidence scale first. Kill-switches can't be scheduled, so risky items get a **trip-wire** the marketer can fire: *"If this ad's CPA passes $60 by Thursday, say 'pause Founder story'."* Recommend an account spending limit (written instruction) when none is set.

## Near-threshold calls — both readings, never silently decided

When a call sits inside the noise (roughly 0.8–1.3× allowable, or under ~15 conversions), present:
- **Reading A (kill/scale):** the case, with numbers.
- **Reading B (hold):** the case, with the noise range (±1/√n), maturity and any mitigating signal (AOV, upstream metrics).
- **Recommendation** + a trip-wire + a re-decide date. The marketer picks.

## Expected effect — never invented

Write it as a direction plus a range from **this account's own history** ("spend +$15/day; cost/LPV may rise 10–20% as marginal cost climbs, as it did on R3"), or direction-only, or "unknown — first scale step on this ad set". Never a precise predicted number with no basis.

## Rotation request — a request line in `ads/campaigns/<slug>/rotation-requests.md`: `Rotation needed: for make-static-ads · <what> · return to: ads/campaigns/<slug>/rotation-requests.md`; the maker answers under it with `Rotation ready: <ids> · <hand-off file (ads/batches/…)> · <date>`; de-duplicate against the weekly read's "What to make next"

> **Rotation request — <campaign>, <date>.** Angle "<winning angle>" is fatiguing (CTR 1.4% → 0.9% over 3 weeks at flat spend). What won: hook "<hook>", format <UGC 15s>, proof <claim id>. Make: 4 new hooks on the same angle (2 × 9:16 video, 2 × 4:5 static), keep the proof, vary the first 2 seconds. Needed live by <date> (before the current winners decay). Retire: "<losing angle>".

## Failure modes (check each before presenting)

1. Any change before the yes. 2. A pause without the marketer's words this turn. 3. "Done" before the approval page and `change_status` confirm. 4. Overnight doubling, or stacking edits on one ad set in a week. 5. Treating Goose ads as the whole account. 6. Judging Traffic tests on purchase CPA. 7. Winner calls on < ~10–15 conversions. 8. ROAS ranking led by tiny-spend ads. 9. Platform ROAS quoted as truth. 10. Scaling into an out-of-stock SKU or an ended offer. 11. A lifetime raise in a flight's last days. 12. Re-proposing on resume instead of reading `push_status`/`change_status`. 13. Retrying a refused budget proposal. 14. Invented expected effects. 15. A hold with no date or trip-wire. 16. A near-threshold call decided silently. 17. Retargeting or brand-search ROAS presented as the scale case. 18. A money move staged without its baseline recipe, or a new step on an ad set whose last move hasn't been read.

## Pause vs swap on the same ad

An ad with a pending swap never goes in the pause sentence — the swap turns the new ad on first only if the old one is live.

## Freeze until read

A money move (budget step, pause, swap, launch or graduation into an ad set) holds that ad set still until its readout date (`run-memory.md` § The baseline recipe): no second step, swap or launch there in between, or the next run can only say "can't tell". Fatigue in a frozen ad set → a hold with a click-rate trip-wire, not a swap; no fatigue call in the week after a step of 30% or more. A health failure or a tripped trip-wire overrides the freeze; the proposal then says the earlier move will read as "can't tell" and why. A raise that didn't work is not repeated on that ad set without a new reason, named.

## Collisions (one significant edit per ad set per week)

If two moves touch the same ad set in the same week — e.g. graduating winners into "Sales – Broad" (adds ads) and a budget raise on "Sales – Broad" — keep the higher-confidence one and move the other to next week's check, saying so in the proposal.
