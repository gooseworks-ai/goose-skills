---
name: animate-image
description: Animate an existing product image or static ad into a short branded video using the GooseWorks Animate Images workflow, with source-image continuity and optional end-frame control.
---

# Animate Image

Turn an existing product image or static ad into a short motion creative through GooseWorks. This skill uses the same backend workflow as the Animate Images interface.

## Prerequisite

This workflow requires the GooseWorks MCP tools. If the animate-image tools are unavailable, explain that the connection or feature is not available and stop; do not substitute an unrelated image generator.

## Workflow

1. Resolve the brand and project. Use an existing render when one is available so provenance is preserved; otherwise use a public source image URL.
2. Clarify the motion goal, duration, aspect ratio, and whether the user wants:
   - source image as the start frame;
   - source image as the end frame;
   - source plus a separate end-frame image.
3. Write a motion prompt describing camera movement, subject movement, environment movement, pacing, and what must remain unchanged. Do not redesign the product or add unsupported claims.
4. Call `ads_creative_edit` with `action: "animate", dry_run: true` and confirm the quoted credits (`estimate`) before generation.
5. Call `ads_creative_edit` with `action: "animate"` (source render or `animate.source_image_url`, `animate.prompt`, `animate.duration_seconds`) once. Save the returned job ID.
6. Poll `job_get { job_id, kind: "animate" }` until it completes or fails. Never re-submit a running job.
7. Return the finished video URL and the source image used. If it fails, report the backend reason before proposing a retry.

## Rules

- Ask before spending credits.
- Preserve product shape, logo, packaging, and on-image copy unless the user explicitly requests a change.
- Prefer subtle, physically plausible motion for product shots and graphic ads.
- A new prompt for an already-running job is a new paid generation; do not silently create it.
