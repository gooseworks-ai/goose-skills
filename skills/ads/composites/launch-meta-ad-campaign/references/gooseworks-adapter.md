# GooseWorks adapter

## Summary

Use this adapter when the GooseWorks launch tools are available. It keeps the campaign, creative, Meta context, approval page, push, and recovery state linked. The approval page is the only authorization mechanism for a GooseWorks write.

## Required tool surface

Use the consolidated tool names when available:

- `campaign_read`
- `ads_creative_read`
- `meta_status_get`
- `list_meta_entities`
- `get_meta_ad_context`
- `prepare_meta_ad_push`
- `get_meta_push_status`

Older split read names may exist for compatibility, but do not declare them as installable shared tools. `prepare_meta_ad_push` and `get_meta_push_status` are the write-workflow boundary.

## Workflow

1. If the conversation contains a `push_id`, call `get_meta_push_status` first and resume it.
2. Use `campaign_read` and a bounded `ads_creative_read` to inspect the current campaign and reusable creative. Start with at most 10 published creatives; if none exist, inspect at most five review candidates and load full detail only for the 2–3 under consideration.
3. Use `meta_status_get` and `list_meta_entities` for the connected account. Call `get_meta_ad_context` for current ads that overlap the new intent or may be reused. Trust its Page/Instagram identity and provenance; do not ask for opaque IDs already present in the dossier.
4. Recommend reuse when an existing ad set matches objective, geography, audience, schedule, and optimization. Explain overlap before proposing a separate campaign.
5. Call `prepare_meta_ad_push` only after every decision and destination/policy check is complete. Pass the source campaign ID so the push remains linked.
6. Present the exact summary and returned approval URL/card. Tell the human to choose **Approve paused launch** or **Decline**. Do not execute the push from chat.
7. After the human returns, call `get_meta_push_status` with the same `push_id`:
   - `COMPLETED`: report every ID only after paused readback.
   - `PARTIAL` or `FAILED`: list created IDs, verified states, failure, and `next_action`.
   - `CANCELED`: report that nothing was created.
   - `AWAITING_APPROVAL`: return the same approval link; do not create a new push.

Activation remains a separate GooseWorks UI flow with its own typed confirmation. Never activate during this skill or during tests.
