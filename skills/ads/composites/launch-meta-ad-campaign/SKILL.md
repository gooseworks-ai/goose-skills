---
name: launch-meta-ad-campaign
description: Guide a user from campaign intent through a verified, human-approved Meta/Facebook/Instagram launch that creates only paused objects. Use automatically when the user asks to launch, run, create, publish, or set up Meta ads; use analysis skills instead for reporting-only requests.
---

# Launch Meta Ad Campaign

Own the conversation from intent to a correctly configured **paused** Meta campaign. Inspect the brand's existing work first, collect only missing facts, validate the destination, present one exact plan, and hand it to the human approval surface. Never claim a Meta write succeeded until the saved objects have been read back.

## Safety boundary

- `prepare_meta_ad_push` saves a proposal and creates nothing in Meta.
- Only the approval page returned by that tool can create Meta objects. The coworker cannot approve its own plan.
- Approval creates the campaign, ad set, creatives, and ads **PAUSED**. Do not call this “live.”
- Activation is a separate UI action that requires the human to type `GO LIVE`. Never infer that permission from chat and never activate during a test.
- A decline is final for that push. Do not prepare a replacement unless the user asks to change or retry the plan.

## 1. Resume before starting over

If the conversation already contains a `push_id`, call `get_meta_push_status` first. Use the persisted budget, schedule, audience, destination, creative, and approval state; do not ask for them again and do not create a duplicate push.

## 2. Inspect existing Goose and Meta work

Before proposing a new campaign:

1. Use `list_campaigns`, `get_campaign`, and `list_brand_creatives` to understand the current Goose campaign, approved creative, and reusable renders.
2. Use `get_meta_sync_status`, `get_meta_account_summary`, and `list_meta_entities` to inspect the connected account and its campaigns, ad sets, and ads.
3. For every current Meta ad that could be reused or overlaps the proposed work, call `get_meta_ad_context`. Treat its evidence map as the trustworthy dossier for Meta facts, Goose provenance, current creative identity, performance, and approval history. If it reports `conflict` or `stale_creative`, do not attribute that ad's results to the old Goose creative.

Then explain which path you recommend:

- **Reuse an existing ad set** when its objective, geography, audience, schedule, and optimization already fit the user's intent.
- **Create a new campaign** only when the user has explicitly chosen a separate Traffic test and overlap with current work has been explained.

Do not build another account-context system or reconstruct performance from unrelated calls when `get_meta_ad_context` can answer the question.

## 3. Collect only missing decisions

State what is already known, then ask for the missing items in one compact prompt:

- desired result and objective;
- total budget and duration or account-local start/end dates;
- destination URL;
- geography selected by the user;
- audience approach;
- optimization goal and bidding approach;
- 2–3 approved creative renders and the Facebook Page identity (plus Instagram identity when relevant).

For the initial new-campaign path, the supported configuration is deliberately narrow:

- Traffic objective only;
- one campaign, one ad set, and 2–3 genuinely different ads;
- total/lifetime budget with start and end in the Meta account timezone;
- broad country targeting selected by the user;
- `LANDING_PAGE_VIEWS` when the rendered destination has working Meta tracking, otherwise `LINK_CLICKS` with that limitation stated plainly;
- `IMPRESSIONS` billing and `LOWEST_COST_WITHOUT_CAP` bidding.

If the requested new campaign needs another objective, special-ad-category handling, detailed interests, bid caps, or multiple ad sets, explain that the first production path does not support it. Do not silently approximate it.

## 4. Prepare and validate

Call `prepare_meta_ad_push` only after every required decision is present. The tool renders the destination before saving the plan and blocks invalid/unreachable URLs or unsafe redirects. Treat message/claim mismatch, unclear CTA, and missing pixel as visible warnings; never hide them. A prepare failure means nothing was created in Meta.

Use `EXISTING_AD_SET` only for a user-selected compatible ad set. Use `NEW_CAMPAIGN` only for the constrained configuration above. Pass the current Goose campaign ID so the Meta push remains permanently linked to its source campaign.

## 5. Present the approval handoff

After preparation, summarize in plain language:

- campaign name, objective, and paused status;
- ad set name, total budget, account-local dates, countries, audience, optimization, and bidding;
- each ad and its creative;
- destination, CTA, rendered-page checks, and every warning;
- what will be created and that none of it will spend while paused.

Then give the returned approval URL/card and say: “Review this exact plan and choose Approve paused launch or Decline.” This is the explicit permission immediately before the Meta write. Do not execute the push from chat.

## 6. Resume after approval

When the user returns, call `get_meta_push_status` with the existing `push_id`.

- `COMPLETED`: report every campaign, ad set, creative, and ad ID; confirm readback showed all objects paused.
- `PARTIAL` or `FAILED`: say exactly what failed, list every object that was created, confirm its paused state, and repeat `next_action`. Retry only the failed scope after the user asks.
- `CANCELED`: say nothing was created in Meta.
- `AWAITING_APPROVAL`: link the same approval page again; do not prepare another push.

Never describe a create response alone as success. Success requires Meta readback of names, ownership, objective, budget, schedule, geography, optimization, bidding, destination/creative identity, and `PAUSED` status.

## Final response

End with a compact run record: what was reused or created, the exact configuration, destination-preflight result, Meta IDs, paused/readback status, warnings or failures, and the next human action. The normal stopping point is “ready in Meta, paused, spending nothing.”
