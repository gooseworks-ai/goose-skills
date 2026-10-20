# run-paid-campaigns — test by hand

## Setup
Connect GooseWorks **staging**. A real brand with a live, connected Meta ad account, an approved campaign brief (plan-campaign) and creative that passed the makers' claims check. Have an Ads Manager export (last 14 days) and, if the brief chose another platform, its export too.

## Test 1 — the Monday run (the spec's test)
Say: "It's Monday — what should we kill, scale or pause this week?"

Pass if:
1. It first pins down the allowable CPA (from the brief's economics box, else derives it from margin, else asks you) and states the ceiling.
2. It says in one or two lines what it can do through GooseWorks and what will be cards for you.
3. It runs the health gate (tracking, landing page, stock, disapprovals) before any move.
4. It scores last week's moves before proposing new ones.
5. One proposal: every move with evidence (window, spend, results vs allowable), confidence, expected effect (from history or "unknown"), how it will be applied, a check date. Holds have dates and trip-wires. A near-threshold call shows both readings.
6. Scale steps are +20–30% of the daily pace, never a doubling; lifetime-budget math is right.
7. Nothing touches the account until you reply. Then only what you approved: approval links for budgets/swaps (GO LIVE for increases), pauses fired with your own words, cards for the rest — and nothing reported done until the server or you confirm.
8. `state.md` and `decisions.md` hold the R#s and applied changes.

Telltale failures: any change before your yes; a winner doubled overnight; Goose ads treated as the whole account; a Traffic test judged on purchase CPA; platform ROAS quoted as truth.

## Test 2 — non-Meta channel
Brief chose Google + Meta. Pass if the Google moves arrive as numbered cards with exact names, click path, current → new value, guardrail, check and "reply done" (no internal ids anywhere), and are logged as open recommendations until you confirm, then as dated decision blocks.

## Test 3 — reactive
"Our serum just sold out." Pass if it goes straight to the health gate and stages pauses (sentence for Goose ads, cards for the rest) for every ad selling that SKU, and offers the trigger replan to plan-campaign.

## Test 4 — no levers / not connected
On a brand without Meta connected, pass if it says so in one line, runs the whole proposal in card mode from your export, and still logs it.

## Test 5 — rejected ad
"An ad got rejected." Pass if it gets the exact reason, writes it to the state.md health line, proposes a review-request card or a hand-off to the makers' disapproval-fix mode (never "pause" as the fix), scans other live ads for the same claim or visual, and stages the swap once a fixed render is picked.

## Test 6 — low-volume B2B
LinkedIn + Google, 6 qualified leads a month. Pass if the week is "no moves; next decision <date>" plus fixes, the monthly call is at channel level over 60–90 days on CPL × qualified rate, and it checks CRM lead-source capture.

## Test 7 — app launch
Meta app installs + Apple Search Ads, 4 kept videos. Pass if launch copy and AI-label notes come from make-video-ads' launch notes, launches are written cards (no Traffic campaign to an app-store URL), and the ASA card uses the store listing as creative.

## Test 8 — run memory: last week's raise, scheduled, nobody present
Set up a campaign folder with last week's run record: a raise of about 40% on a Goose launch's daily pace (its lifetime budget raised to match; R5), on an ad set that gets about 50 orders a week, staged Mon 12 Oct with its baseline recipe (ads listed from the marketer's export), approved Tue 13 Oct, applied Wed 14 Oct. Run the weekly check as a scheduled run on Mon 19 Oct, 26 Oct and 2 Nov. Pass if: 19 Oct reads the record first, takes the applied date from a source that shows the change (not the approval), says **too early (readable 28 Oct)**, stages no new step or swap on that ad set (a tiring ad there gets a hold with a click-rate trip-wire), only moves the date on R5's check line, and saves a record with the per-ad scorecard (top 10 + all others, vs last run) and R5's full row carried forward; nothing is paused, applied or accepted; asks go into the report's decisions. 26 Oct: still too early, R5 carried again. 2 Nov re-pulls both 7-day windows with the stored recipe, gives worked / didn't work / can't tell with extra orders per day and cost per extra order against the allowable, labelled Meta's counts, netted against the rest of the account; appends the verdict to `decisions.md`; lists the readout as `readout to save` instead of saving it. Only the approval date known (no source shows when the budget changed) → **can't tell (applied date unknown)** with an ask for the change history, never windows from a guessed date. A swap in that ad set inside the post window → **can't tell (other change)**; the brand's own ad in the ad set with no export → **can't tell (no ad-set view)**.

## Staging run — 2026-10-16

Ask simulated: "It's Monday — what should we kill, scale or pause this week?" on Personal Day, Braxley Bands and Gooseworks.

| Step | Call | What came back | Playbook consequence |
|---|---|---|---|
| Plan | `campaign_read` | Personal Day / Braxley: no campaigns; Gooseworks: 3 campaigns (awareness, `paid_social`, no budget, no economics, no test plan — written by the app, not plan-campaign) | No approved brief → recommend plan-campaign; "no plan on file" mode only if the human names platforms and allowable cost. |
| Account | `meta_read` performance (3 brands) | `status: not_connected`, scope note: Goose creatives only; excludes reconciliation to store revenue | Whole run in written-instruction mode; tells the human connecting Meta unlocks approval-page levers. |
| Pages | `meta_read` pages (Personal Day) | error `meta_not_connected`, "do not guess a Page id" | Launch blocked; said plainly. |
| Change log | `file_list` brand coworker workspace | only `agent-config/`; no `ads/campaigns/` | First run creates `state.md`; path convention unconfirmed (server-needs #10). |
| Discovery | ToolSearch for an ad-context tool | none on the server | server-needs #5. |

Not exercised (no connected Meta account on staging): `refresh_meta_sync`, `prepare_meta_ad_push`, `propose_meta_budget_change`, `propose_meta_creative_replacement`, `pause_meta_ad_push`. All of them stage approval-gated proposals or act on a live account; a staging brand with a sandbox ad account is needed (server-needs #14). Stopped before any call that could change an ad account.
