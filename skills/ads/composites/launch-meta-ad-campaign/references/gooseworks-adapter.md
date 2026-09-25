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
- `list_meta_pages`
- `prepare_meta_ad_push`
- `get_meta_push_status`

Older split read names may exist for compatibility, but do not declare them as installable shared tools. `prepare_meta_ad_push` and `get_meta_push_status` are the write-workflow boundary.

## From an outside host

From Claude Code, Cursor or any MCP client, `list_meta_pages`, `prepare_meta_ad_push`, `get_meta_push_status` and `refresh_meta_sync` take **`brand_id`** on every call: the GooseWorks brand id from `brand_list`. Inside the GooseWorks coworker they take no brand, because the session is bound to one. The calls act as the signed-in user, on a brand in their own organisation.

```json
{ "tool": "prepare_meta_ad_push", "args": { "brand_id": "<brand.id>", "render_ids": ["<render id>"],
    "mode": "NEW_CAMPAIGN", "page_id": "<id from list_meta_pages>", "...": "..." } }
```

The read tools in step 3 (`meta_status_get`, `list_meta_entities`, `get_meta_ad_context`) may not be listed on an outside connection yet. Without them you cannot see existing ad sets. Do not ask the user for raw Meta ids. Offer the new paused Traffic campaign (`NEW_CAMPAIGN`) and say that reusing an existing ad set needs the brand's coworker in GooseWorks.

## Workflow

1. If the conversation contains a `push_id`, call `get_meta_push_status` first and resume it.
2. Use `campaign_read` and a bounded `ads_creative_read` to inspect the current campaign and reusable creative. Start with at most 10 published creatives; if none exist, inspect at most five review candidates and load full detail only for the 2–3 under consideration.
3. Use `meta_status_get` and `list_meta_entities` for the connected account. Call `get_meta_ad_context` for current ads that overlap the new intent or may be reused. Trust its Page/Instagram identity and provenance; do not ask for opaque IDs already present in the dossier.
4. Recommend reuse when an existing ad set matches objective, geography, audience, schedule, and optimization. Explain overlap before proposing a separate campaign.
5. Call `list_meta_pages` and use one of its ids as `page_id`. Call `prepare_meta_ad_push` only after every decision and destination/policy check is complete. Pass the source campaign ID so the push remains linked.
6. Present the exact summary and returned approval URL/card. Tell the human to choose **Approve paused launch** or **Decline**. Do not execute the push from chat.
7. After the human returns, call `get_meta_push_status` with the same `push_id`:
   - `COMPLETED`: report every ID only after paused readback.
   - `PARTIAL` or `FAILED`: list created IDs, verified states, failure, and `next_action`.
   - `CANCELED`: report that nothing was created.
   - `AWAITING_APPROVAL`: return the same approval link; do not create a new push.

Activation remains a separate GooseWorks UI flow with its own typed confirmation. Never activate during this skill or during tests.
