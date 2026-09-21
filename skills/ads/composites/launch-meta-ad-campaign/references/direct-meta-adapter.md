# Direct Meta Marketing API adapter

## Summary

Use the bundled adapter only when GooseWorks launch tools are unavailable and a valid Meta token plus ad-account access are available. The adapter validates permissions/account/Page access, inspects existing objects, performs technical destination preflight, stores recovery state, writes only paused objects, and verifies them through readback. It intentionally provides no activation command.

## Configuration

Set credentials in the environment; never put tokens in prompts, plan files, command arguments, logs, or recovery files.

- `META_MARKETING_ACCESS_TOKEN` (preferred) or `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID` (for example, `act_123456789`)
- optional `META_PAGE_ID` as an additional account/Page mismatch guard
- optional `META_GRAPH_API_VERSION` (defaults to the bundled tested version)

The token must grant `ads_management`. Account and Page reads must succeed before preparation. Missing/expired permissions are a recoverable planning-only condition, not permission to try writes.

## Exact plan file

Create a JSON plan outside the installed skill directory. Use account minor units for budgets. The direct writer currently supports `OUTCOME_TRAFFIC`, one campaign, one ad set, image/video or existing Meta creatives, and no special-ad category. Planning-only mode can cover broader structures.

```json
{
  "launch_id": "stable-unique-id",
  "account_id": "act_123456789",
  "page_id": "123456789",
  "campaign": {
    "name": "Campaign name",
    "objective": "OUTCOME_TRAFFIC",
    "special_ad_categories": []
  },
  "ad_set": {
    "name": "Ad set name",
    "lifetime_budget": 2500,
    "start_time": "2026-09-23T09:00:00-07:00",
    "end_time": "2026-09-30T09:00:00-07:00",
    "optimization_goal": "LANDING_PAGE_VIEWS",
    "billing_event": "IMPRESSIONS",
    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    "targeting": { "geo_locations": { "countries": ["US"] } }
  },
  "destination": { "url": "https://example.com/offer" },
  "destination_review": {
    "status": "passed",
    "rendered": true,
    "message_match": true,
    "claim_match": true,
    "clear_cta": true
  },
  "policy_review": { "status": "passed", "notes": [] },
  "ads": [
    {
      "name": "Ad A",
      "creative": {
        "name": "Creative A",
        "message": "Approved primary text",
        "headline": "Approved headline",
        "description": "Approved description",
        "call_to_action": "LEARN_MORE",
        "image_path": "/absolute/path/to/approved-image.jpg"
      }
    }
  ]
}
```

Each creative may instead use exactly one of `image_hash`, `video_id`, or `meta_creative_id`. A video creative may include `video_thumbnail_url`. Reusing an existing Meta creative still creates a new paused ad and is recorded in recovery state.

## Commands

Resolve the installed skill directory, then use its bundled tool:

```bash
node tools/meta_marketing_api.js prepare --plan /absolute/path/plan.json --state /absolute/path/state.json
```

`prepare` performs only reads and destination fetches. It verifies the exact plan, technical destination safety, token permission, ad account, Page, and existing campaigns/ad sets/ads. It writes an `awaiting_approval` state file with a plan digest and no credential.

Show the human the plan plus preparation results. Ask for explicit confirmation immediately before publishing. Only after the user clearly approves that unchanged plan, run:

```bash
node tools/meta_marketing_api.js publish \
  --plan /absolute/path/plan.json \
  --state /absolute/path/state.json \
  --confirm "APPROVE PAUSED META CAMPAIGN" \
  --confirmed-by "user"
```

Never manufacture the confirmation phrase from earlier intent. It is an adapter guard, not a substitute for asking the human.

Inspect recovery state without making requests:

```bash
node tools/meta_marketing_api.js status --state /absolute/path/state.json
```

## Recovery

The state file records campaign, ad set, creative, and ad IDs after each successful create. `partial` means some IDs exist and remain paused. Explain the failure and IDs, fix the cause, show any changed plan again, and obtain fresh explicit approval before rerunning `publish`. The adapter reuses recorded steps and completes only missing ones.

Treat `completed` as success only when `readback` contains the campaign, ad set, every creative/ad, and paused verification. The token is never persisted.
