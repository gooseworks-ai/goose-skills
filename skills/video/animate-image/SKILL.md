---
name: animate-image
description: Animate an existing product image or static ad into a short branded video using the GooseWorks Animate Images workflow, with source-image continuity and optional end-frame control.
---

# Animate Image

Turn an existing product image or static ad into a short motion creative through GooseWorks. This skill uses the same backend workflow as the Animate Images interface.

## Prerequisite

This workflow requires the GooseWorks MCP connector (`https://mcp.gooseworks.ai/mcp`). It uses three tools: `ads_creative_animation_quote` (free price), `ads_creative_animate` (paid start) and `job_get` (poll). Some clients list tools by group and show the `ads` tools only after they are loaded. If `ads_creative_animation_quote` or `ads_creative_animate` is not in the advertised tool list, call `tools_load` with `{ "groups": ["ads"] }` first (free). If the tools are still missing, or `account_whoami` reports `features.animate_image: false`, explain that the connection or feature is not available and stop; do not substitute an unrelated image generator.

## Tool calls

| Step | Call | Notes |
|---|---|---|
| Quote | `ads_creative_animation_quote` | Free and read-only. Fetches nothing and reserves nothing. Returns `{ dry_run: true, estimate: { frame, duration_seconds, model, estimated_credits } }`. |
| Start | `ads_creative_animate` | Paid. Reserves credits and starts the job. Returns `{ job_id, kind: "animate", status }`. |
| Poll | `job_get` with `{ job_id, kind: "animate" }` | Read-only. `result.output_url` holds the video when `status` is `complete`; `error` explains a failure. |

Both `ads_creative_animation_quote` and `ads_creative_animate` take the same payload:

```json
{
  "brand_id": "<brand id from brand_read>",
  "creative_id": "<ad creative id from ads_creative_read or ads_save>",
  "animate": {
    "source_render_id": "<render id, or null>",
    "source_image_url": "<public https URL of the still>",
    "frame": "end",
    "prompt": "<motion prompt>",
    "duration_seconds": 5
  }
}
```

- `creative_id` is the ad creative the animation belongs to. Prefer an existing render (`source_render_id` plus its URL as `source_image_url`) so provenance is preserved.
- `frame` is `"start"` (the still is the opening frame) or `"end"` (the still is the closing frame, the default). The two can cost different credits; the quote shows the price for the frame you pass.
- `duration_seconds` must be `5` or `10`. Other values are rejected.
- Starting needs an agent-scoped token or a default agent on the account; the tool returns `agent_required` otherwise.

## Workflow

1. Resolve the brand with `brand_read` (leave out `brand_id` to list the brands). Then find the still:
   - **An existing ad:** read it with `ads_creative_read` (include renders) to get `creative_id`, `source_render_id` and the render URL.
   - **A plain image not yet in GooseWorks:** upload it with `media_upload` under the brand, then save it as an ad creative with `ads_save` (pass the `media_id`; free). `ads_save` returns `creative_id`, `render_id` and `output_url`; use them as `creative_id`, `source_render_id` and `source_image_url`.
2. Clarify the motion goal, duration (5 or 10 seconds), and whether the user wants the source image as the start frame or the end frame.
3. Write a motion prompt describing camera movement, subject movement, environment movement, pacing, and what must remain unchanged. Do not redesign the product or add unsupported claims.
4. Call `ads_creative_animation_quote` and show the user `estimated_credits` exactly as the tool returns it. Never convert it to dollars or do your own math. Ask for their yes to that credit number.
5. After their yes, call `ads_creative_animate` once with the same payload. Save the returned `job_id`.
6. Poll `job_get` with `kind: "animate"` every few seconds until `status` is `complete` or `failed`. Never start the same animation again while it runs; a second start pays again.
7. Return `result.output_url` and the source image used. If it fails, report the error in plain words before proposing a retry.

## Rules

- Ask before spending credits. The quote is free; every `ads_creative_animate` call is a paid generation.
- Never start without the user's explicit yes to the quoted credits.
- Money is the credit number the quote returns. Never show dollars.
- Preserve product shape, logo, packaging, and on-image copy unless the user explicitly requests a change.
- Prefer subtle, physically plausible motion for product shots and graphic ads.
- A new prompt for an already-running job is a new paid generation; quote it and ask again.
