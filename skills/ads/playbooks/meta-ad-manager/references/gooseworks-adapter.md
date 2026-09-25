# GooseWorks adapter

## Summary

Use this mode when the GooseWorks tools are callable: inside the GooseWorks coworker (chat,
messaging channels, scheduled automations) or from any agent host with the GooseWorks MCP. The
`ads/` docs live in the brand's coworker workspace, so chat, scheduled checks and outside hosts all
see the same files.

## The `ads/` docs

**Inside the coworker** (chat, a messaging turn, a scheduled run): use the built-in `Read`,
`Write` and `Edit` tools with a path **relative to the working directory**, which is the workspace
root. The coworker has no `file_*` tools there.

```json
{ "tool": "Read",  "args": { "file_path": "ads/README.md" } }
{ "tool": "Write", "args": { "file_path": "ads/campaigns/<slug>/state.md", "content": "<whole file>" } }
```

Never write to an absolute path such as `/workspace/…`: that is the sandbox's local disk, which
is lost when the sandbox stops and which no other run can see.

**From an outside host** (Claude Code, Cursor, any MCP client): call `brand_list`, take the
brand's `coworker_agent_id`, and pass it as `scope` on **every** file call. Without `scope` the
tools fall back to the user's default agent, which is usually not the brand's.

```json
{ "tool": "brand_list", "args": {} }
{ "tool": "file_read",  "args": { "path": "ads/README.md",
    "scope": { "type": "agent", "agent_id": "<brand.coworker_agent_id>" } } }
{ "tool": "file_write", "args": { "path": "ads/README.md", "content": "<whole file>",
    "scope": { "type": "agent", "agent_id": "<brand.coworker_agent_id>" } } }
```

**Ids.** `brand_id` is the GooseWorks brand id and `coworker_agent_id` its coworker agent, both
from `brand_list`.

## Meta tools from an outside host

The launch, pause and proposal tools take **`brand_id`** on every call from an outside host (the
GooseWorks brand id from `brand_list`, not the coworker agent id). Inside the coworker they take no
brand: the session is already bound to one. Everything else about them is the same, and so are
the gates: they act as the signed-in user, on a brand in the user's own organisation.

```json
{ "tool": "list_meta_pages",      "args": { "brand_id": "<brand.id>" } }
{ "tool": "prepare_meta_ad_push", "args": { "brand_id": "<brand.id>", "render_ids": ["<render id>"],
    "mode": "NEW_CAMPAIGN", "page_id": "<id from list_meta_pages>", "...": "..." } }
{ "tool": "pause_meta_ad_push",   "args": { "brand_id": "<brand.id>", "push_id": "<push id>",
    "meta_ad_ids": ["<meta ad id>"], "user_instruction": "<the user's words>" } }
{ "tool": "propose_meta_budget_change", "args": { "brand_id": "<brand.id>", "push_id": "<push id>",
    "new_budget_minor_units": 5000, "reason": "<why, with the evidence>" } }
```

No tool approves, executes or activates anything. `prepare_meta_ad_push` and the two `propose_*`
tools return an `approval_url`: the user approves there, in the GooseWorks app. Give them the link
and never say it is done.

**Caching.** The coworker's file mount caches file info for up to two minutes. After an outside
`file_write`, a coworker run can see a stale or missing file for that long. Do not write a harness
file from outside and immediately start a run that reads it; wait, or put the change in the
message instead.

## Surfaces

- Web chat and messaging channels both pass Step 0. The per-turn context says which one it is.
- Scheduled checks are GooseWorks automations. They have no user message; the prompt names the
  check (daily quick check, weekly deep check).

## Stage → tools

| Stage | Tools |
|---|---|
| intake | `ad-management-intake` (its GooseWorks adapter): `brand_get_context` / `get_brand_kit`, `brand_onboarding`, `campaign_read` / `campaign_upsert` for the brief |
| connect | the in-app connection card (`render_meta_connection` with only an intent inside the coworker). Never ask for or repeat a token |
| strategy | `ads-north-star-strategy` (its GooseWorks adapter) |
| create, review | concepts via `add_campaign_concept`, then `request_campaign_generation({campaign_id, planned_ads})`, which generates three times the plan and waits in the approval queue until the user approves (the Generate button or `ads_approval_decide`). Tell the user where to approve. A one-off "make me an ad" outside a plan uses `ads_generate` with `dry_run: true` first (the cost quote), then `mode: generate` after the user's yes. `ads_creative_read` (`approved_only: true`) fetches the picks |
| launch | `launch-meta-ad-campaign` (its GooseWorks adapter): `list_meta_pages`, `prepare_meta_ad_push`, the approval page, `get_meta_push_status`, then `refresh_meta_sync` so the new ads show in reads |
| quick check | the daily Meta ads report automation and its watch findings |
| deep check | `meta-ads-analyzer` over `query_meta_insights` complete days |
| fix and adjust | `pause_meta_ad_push` (a whole push or one ad), `revert_meta_ad_push`, `propose_meta_budget_change`, `propose_meta_creative_replacement`, then `get_meta_change_status` after the user approves on the page |
| answers | `answer-ads-questions` (its GooseWorks adapter) |

`render_meta_connection` works inside the coworker only: from an outside host, send the user to
connect Meta in the GooseWorks app. The Meta read tools (`meta_status_get`, `list_meta_entities`,
`query_meta_insights`, `get_meta_ad_context`) may not be listed on an outside connection yet. When a
tool is not listed, say that step needs the brand's coworker in GooseWorks, and do not guess.

## Evidence pointers

In `decisions.md`: `report:<id>` from the daily report, `push:<id>` from `prepare_meta_ad_push`,
`finding:<id>` only when a daily report names that finding id. There is no tool that lists watch
findings, so never make one up.

## Whose ads are Goose's

GooseWorks records every launch as a push. The launch record for `answer-ads-questions` rule 5 is
the push list in `state.md` (`meta_push_ids`), and both pause and revert exist.
