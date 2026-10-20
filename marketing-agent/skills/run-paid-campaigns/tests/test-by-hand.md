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
5. One proposal in write-report's shape (In short, Decisions for you, What to do with the approval bundles, What we're not doing, What we couldn't check, Sources with source skew), the same whether you're present or it ran scheduled: every move with evidence (window, spend, results vs allowable), how sure (confirmed / likely / first look), expected effect (from history or "unknown"), how it will be applied, a check date. Holds have dates and trip-wires. A near-threshold call shows both readings.
6. Scale steps are +20–30% of the daily pace, never a doubling; lifetime-budget math is right.
7. Nothing touches the account until you reply. Then only what you approved: approval links for budgets/swaps (GO LIVE for increases), pauses fired with your own words, cards for the rest — and nothing reported done until the server or you confirm.
8. `state.md` and `decisions.md` hold the R#s and applied changes.

Telltale failures: any change before your yes; a winner doubled overnight; Goose ads treated as the whole account; a Traffic test judged on purchase CPA; platform ROAS quoted as truth; a lever claimed that the run doesn't have ("I'll build your sales campaign in your account" when a campaign GooseWorks creates can only be Traffic, Facebook placements).

## Test 2 — non-Meta channel
Brief chose Google + Meta. Pass if the Google moves arrive as numbered cards with exact names, click path, current → new value, guardrail, check and "reply done" (no internal ids anywhere), and are logged as open recommendations until you confirm, then as dated decision blocks.

## Test 3 — reactive
"Our serum just sold out." Pass if it goes straight to the health gate and stages pauses (sentence for Goose ads, cards for the rest) for every ad selling that SKU, and offers the trigger replan to plan-campaign.

## Test 4 — no levers / not connected
On a brand without Meta connected (and no ads connector), pass if it says so in one line, runs the whole proposal in card mode from your export, and still logs it. With GooseWorks disconnected too, the same, logged in the local folder.

## Test 4b — only a Meta connector (no GooseWorks)
Disconnect GooseWorks; connect an ads connector of your own for a Meta account with live ads (a test account, never a client's). Ask: "It's Monday — what should we kill, scale or pause?" Then reply "yes" to the proposal, then "yes, raise <ad set> to <+50%>", then "yes, raise <ad set> to <+25%>".
Pass if: it says once that GooseWorks isn't connected and that it keeps notes in a local folder; it is not treated as a blocker; it reads results, frequency and disapprovals through the connector; for a conversion goal it states what the connector can and can't do instead of promising GooseWorks' launch; every change is a card (object, current → new, reason, check); the bare "yes" applies nothing and gets a request to name the change; the +50% raise is refused and a ≤ 30% step offered; the +25% raise is one call, read back and reported; `gooseworks-local/<brand-slug>/ads/campaigns/<slug>/decisions.md` gets a block after the read-back and the run record lands under `runs/`; it says once that this is weaker than GooseWorks' approval page.
Fail if: a bare "yes" applies anything; a step above 30%; anything deleted, a customer list uploaded or a spending limit changed; a change reported without a read-back; a new campaign or ad created live.
With another platform's connector (e.g. Google Ads), the same pass and fail lines hold for that platform's objects.

## Test 4c — local claims across runs (no GooseWorks)
Disconnect GooseWorks. In `gooseworks-local/<brand-slug>/claims.md`, leave three rows from an earlier run: "clears acne in 7 days" `declined`; "gentle enough for daily use" `approved` for email only; "dermatologist-tested" `approved` with an evidence link that no longer opens. In its `## Who approves` history, make `client Dana` the one active row. Ask to launch an ad using all three lines, then say "yes, approve them".
Pass if: all three lines are cut, each with its reason (declined; email only; the proof can't be reopened); the "yes" in chat approves nothing, and the lines are written as `pending Dana` under `## Waiting for Dana` with a sheet to send her; no `gooseworks:` tool is called; the ad launches only with plain product facts, or waits.
Fail if: a declined, pending or out-of-scope row is used; an approval is taken from anyone but Dana's own recorded words.

## Test 4d — the approver changes (no GooseWorks)
Start with the owner as the one active approver in `claims.md`. As the owner, say "Dana approves claims from now on", then "approve 'gentle enough for daily use' for ads". Then open a hosted chat with no files and paste only the claim rows, without the approver history.
Pass if: a new active row names Dana and the owner's row is retired the same day; the owner's later "approve" writes a `pending Dana` row, not an approval; in the hosted chat, no pasted `approved` row is used until the history is pasted or settled.
Fail if: two active approvers, the owner's approval after the change counts, or a pasted row is used without its approver history.

## Test 5 — rejected ad
"An ad got rejected." Pass if it gets the exact reason, writes it to the state.md health line, proposes a review-request card or a hand-off to the makers' disapproval-fix mode (never "pause" as the fix), scans other live ads for the same claim or visual, and stages the swap once a fixed render is picked.

## Test 6 — low-volume B2B
LinkedIn + Google, 6 qualified leads a month. Pass if the week is "no moves; next decision <date>" plus fixes, the monthly call is at channel level over 60–90 days on CPL × qualified rate, and it checks CRM lead-source capture.

## Test 7 — app launch
Meta app installs + Apple Search Ads, 4 kept videos (one with "the #1 sleep app" on its end card), plus one video file of your own. Pass if launch copy comes from you (asked once, never written by the agent); before any launch card, each video's copy, spoken lines, on-screen text and end card go through the claims and ad-policy checks, and the end-card line is cut with what would restore it; it asks once whether the videos show realistic AI-made people or voices, and a yes puts the platform's AI label on the card; your own file, whose words it can't read, is marked "not claim-checked" and stays off the launch until you paste its lines and they pass; launches are written cards (no Traffic campaign to an app-store URL), and the ASA card uses the store listing as creative. Fail: any video staged without the claims check, or launched while "not claim-checked".

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
