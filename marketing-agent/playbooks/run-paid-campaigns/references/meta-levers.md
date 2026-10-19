# What GooseWorks can and cannot do on Meta today

Load before the first move of any run. Say the relevant limits to the human up front, in plain words — never let them believe a lever exists that doesn't. Tool descriptions are the live truth; re-read them if a call is refused.

## Can (product levers)

| Lever | Tool | What it really does | Approval |
|---|---|---|---|
| Read Goose ads' results | `gooseworks:meta_read` `view: "performance"`  | Spend, clicks, landing-page views, leads, CTR, CPA, ROAS for **Goose-made creatives live in the account only**. Not attribution. `insight.available=false` → report numbers, name no winner. | — |
| Refresh the account copy | `gooseworks:refresh_meta_sync` | Re-syncs campaigns/ad sets/ads (normally daily). Use only when an object you know exists isn't visible (e.g. an ad set created today) — not as a routine freshness step. 1–3 min; poll the same tool. Reads only. | — |
| Publishable Pages | `gooseworks:meta_read` `view: "pages"` | The only valid `page_id`s. Empty → the human must grant Page access. | — |
| Launch | `gooseworks:prepare_meta_ad_push` | Saves a fully **paused** plan and checks destination + creatives. **NEW_CAMPAIGN**: Traffic objective only, landing-page views (if the destination has Meta tracking) or link clicks, lowest-cost bidding, lifetime budget, broad countries, a few ads, Facebook placements (no Instagram actor). **EXISTING_AD_SET**: adds Goose creatives to an ad set already in the account, inheriting its budget, schedule, audience, optimisation — the **only route to purchase/lead-optimised delivery**. | Human approves on the returned approval URL. You cannot approve. Read `push_status` until `AWAITING_APPROVAL`; never prepare a duplicate. |
| Change a budget | `gooseworks:propose_meta_budget_change` | Whole new budget, same kind as created (lifetime for Goose launches), **only on ad sets Goose created**. Refused if the budget moved in Ads Manager meanwhile — relay, re-read, never retry blind. | Approval URL; an increase makes the human type GO LIVE; a decrease is one click. |
| Swap a creative | `gooseworks:propose_meta_creative_replacement` | Adds a new finished Goose render to the same ad set (same Page, destination, CTA) and pauses the old **Goose** ad; if the old ad is live, the new one goes live first. Loses the old ad's likes/comments. | Approval URL; live swaps need GO LIVE. |
| Pause | `gooseworks:pause_meta_ad_push` | Pauses Goose-published ads — always pass the `push_id` from `state.md` (omitting it means the most recent push, and ids from another push pause nothing) plus the named `meta_ad_ids`. Reversible — but **there is no resume tool**; un-pausing is done by the human in Ads Manager. | Only with the human's own words **in the current turn** as `user_instruction`. Never on judgement or a schedule. |
| Undo a launch | `gooseworks:revert_meta_ad_push` | Deletes ads that never went live, pauses live ones, cancels the push. For mistakes only — **never use it for a kill**. Confirm intent first. | Human's words this turn. |
| Check a proposal | `gooseworks:meta_read` `view: "change_status"` / `"push_status"` | Approved or declined, and Meta's before/after values. Read on every resume instead of re-proposing. | — |

Every propose/pause call can carry `recommendation_ref` (`R<n>`); the server then removes that bullet from `## Open recommendations` in `ads/campaigns/<slug>/state.md` and appends a `### YYYY-MM-DD — …` block to `decisions.md` — but only if that `state.md` frontmatter lists the push in `meta_push_ids` or the campaign in `goose_campaign_id` (`proposal-and-log.md`).

## Cannot (→ written instructions the human applies, see `written-instructions.md`)

- Anything on campaigns, ad sets or ads **GooseWorks did not create** — usually most of the account. Budgets, pauses, duplications, audience edits there are written instructions.
- Sales/lead/app-install objectives on a new campaign; cost caps, bid caps, ROAS goals; Advantage+ shopping campaign settings; placements; dayparting; radius/local targeting; audience exclusions; attribution-setting changes; end-date changes; account spending limit.
- Un-pausing an ad.
- Reading frequency, reach, CPM, learning status, delivery status, disapprovals, placement/age breakdowns, or non-Goose ads' results. Ask the human for an Ads Manager export (last 14 days, campaign/ad set/ad level, with frequency, CPM, results, cost per result) or take them from analyze-performance's read.
- Finding an existing ad set's id for EXISTING_AD_SET: the tool refers to an ad-context tool that is not on the server; ask the human to copy the ad set id from Ads Manager, `refresh_meta_sync`, then prepare.

## What "one-tap yes" really is today

The weekly proposal resolves into three bundles, and the playbook says so:
1. **Approval links** — created when the proposal is staged (the propose/prepare calls change nothing in Meta), one approval each; increases and live swaps need GO LIVE typed on the page.
2. **One sentence to say in chat** that fires the approved pauses — e.g. *"pause the UGC unboxing and 3-benefits ads"* — which becomes the `user_instruction`. A bare "yes" is not a pause instruction.
3. **Written-instruction cards** for everything outside GooseWorks' levers, each under a minute of work, with a "reply done" confirmation; ids never appear in what the marketer sees.

Never report anything as done until the approval page is approved and `change_status`/`push_status` (or the human's "done") confirms the after-state.
