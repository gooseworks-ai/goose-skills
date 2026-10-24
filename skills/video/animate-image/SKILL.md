---
name: animate-image
description: Animate an existing product image or static ad into a short branded video using the GooseWorks Animate Images workflow, with source-image continuity and optional end-frame control.
---

# Animate Image

Turn an existing product image or static ad into a short motion creative through GooseWorks. This skill uses the same backend workflow as the Animate Images interface.

## Prerequisite

This workflow requires the GooseWorks MCP connector (`https://mcp.gooseworks.ai/mcp`). Animate Images has no tools of its own: it is the `animate` action of `ads_creative_edit`, and the job is polled with `job_get`. If `ads_creative_edit` and `job_get` are not in the advertised tool list, or `account_whoami` reports `features.animate_image: false`, explain that the connection or feature is not available and stop; do not substitute an unrelated image generator.

Older versions of this skill called `estimate_animate_image`, `submit_animate_image` and `get_animate_image`. Those names are no longer advertised. Use the calls below.

## Tool calls

| Step | Call | Notes |
|---|---|---|
| Estimate | `ads_creative_edit` with `action: "animate"`, `dry_run: true` | Free. Reserves nothing. Returns `{ dry_run: true, estimate: { frame, duration_seconds, model, estimated_credits, estimated_cost_usd } }`. |
| Submit | `ads_creative_edit` with `action: "animate"` (no `dry_run`) | Paid. Reserves credits and starts the job. Returns `{ job_id, kind: "animate", status }`. |
| Poll | `job_get` with `{ job_id, kind: "animate" }` | Read-only. `result.output_url` holds the video when `status` is `complete`; `result.error` explains a failure. |

Both `ads_creative_edit` calls take the same payload:

```json
{
  "brand_id": "<brand id from brand_list>",
  "creative_id": "<ad project id from ads_creative_read>",
  "action": "animate",
  "animate": {
    "source_render_id": "<render id, or null when animating a plain image URL>",
    "source_image_url": "<public https URL of the still>",
    "frame": "end",
    "prompt": "<motion prompt>",
    "duration_seconds": 5
  }
}
```

- `creative_id` is the ad project the animation belongs to. Prefer an existing render (`source_render_id` plus its URL as `source_image_url`) so provenance is preserved.
- `frame` is `"start"` (the still is the opening frame) or `"end"` (the still is the closing frame, the default). End-frame mode costs slightly more.
- `duration_seconds` must be `5` or `10`. Other values are rejected.
- Submitting needs an agent-scoped token or a default agent on the account; the tool returns `agent_required` otherwise.

## Workflow

1. Resolve the brand with `brand_list` and the project or creative with `ads_creative_read` (include renders to get `source_render_id` and the render URL). A plain image that is not yet in GooseWorks can be registered with `media_upload` first to get a public URL.
2. Clarify the motion goal, duration (5 or 10 seconds), and whether the user wants the source image as the start frame or the end frame.
3. Write a motion prompt describing camera movement, subject movement, environment movement, pacing, and what must remain unchanged. Do not redesign the product or add unsupported claims.
4. Call `ads_creative_edit` with `dry_run: true` and confirm the quoted credits with the user before generating.
5. Call `ads_creative_edit` once without `dry_run`. Save the returned `job_id`.
6. Poll `job_get` with `kind: "animate"` every few seconds until `status` is `complete` or `failed`. Never re-submit a running job; it double-bills.
7. Return `result.output_url` and the source image used. If it fails, report `result.error` before proposing a retry.

## Rules

- Ask before spending credits. The estimate call is the only free call; every non-dry-run submit is a paid generation.
- Never submit without an explicit user approval of the quoted credits.
- Preserve product shape, logo, packaging, and on-image copy unless the user explicitly requests a change.
- Prefer subtle, physically plausible motion for product shots and graphic ads.
- A new prompt for an already-running job is a new paid generation; do not silently create it.
