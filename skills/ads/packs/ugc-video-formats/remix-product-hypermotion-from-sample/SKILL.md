---
name: remix-product-hypermotion-from-sample
description: Remix a published "product hypermotion + kinetic-typography specs ad" ad from the Goose Ads library for a new brand — keep the source's format (a ~20-30s music-led hypermotion ad: ONE Seedance i2v virtuoso product clip diced into 5-6 segments and intercut with 5-7 PIL kinetic-typography spec/CTA cards, capped by a real-logo brand end card), swap in the brand's products/assets/copy, get the drafted scenes approved in-session, then render locally via create-product-hypermotion-video-from-refs and publish the MP4 back to Gooseworks with live stage reporting. This is what the app's "product hypermotion + kinetic-typography specs ad" format tab calls.
---

# remix-product-hypermotion-from-sample

## Purpose

Given **one published product hypermotion + kinetic-typography specs ad sample** (from the Goose Ads library) + a **researched
brand**, produce a finished vertical ad for that brand. The source sample defines the
*shape* — a ~20-30s music-led hypermotion ad: ONE Seedance i2v virtuoso product clip diced into 5-6 segments and intercut with 5-7 PIL kinetic-typography spec/CTA cards, capped by a real-logo brand end card — and this skill swaps the *substance* into the brand's products,
assets, voice, and offer.

This skill is **orchestration**: it derives + gets approval for the scene plan (the
`config.json`), then hands rendering to
[`create-product-hypermotion-video-from-refs`](../create-product-hypermotion-video-from-refs/SKILL.md) and handles all Gooseworks I/O (render rows,
stage reporting, durable upload, final pin). The craft rules (below + in the builder)
are load-bearing — do not drop them.

It runs on the **user's machine inside their Claude Code session** (the goose-video
local-worker model). The runtime contract — MCP tools, media proxies, durable URLs,
the credit gate — is the installed `goose-video` master skill; this recipe assumes it.

This is a **multi-scene, scene-orchestrated** format (not a single-call render). Paid
surfaces: ONE Seedance 2.0 i2v hypermotion clip + one ElevenLabs music bed; the PIL kinetic-typography cards, the dice/intercut/crop, and the mux are free.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "product-hypermotion"` (stored as `recipe.format`). Without one, `create_ad_project { brand_id, name, source_sample_id }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id> }` → `format` (`product-hypermotion`), `recipe` (the source's `config.json`: the full scene plan), `extracted_script`, `how_to`, `media_url` (watch it — this is a multi-scene format, so the shape matters). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run brand-research first. Needs the real product/brand assets the scenes reference + voice + a never-say list. |
| `angle` | optional | User steer (which products/scenes lead, the hook). |
| machine | yes | The builder's stack (see its SKILL) reachable through the master skill's proxies. |

## Composed Atoms

- [`create-product-hypermotion-video-from-refs`](../create-product-hypermotion-video-from-refs/SKILL.md) — the renderer (the sibling builder molecule):
  it owns the scene pipeline, the models, and the assembly. This skill never
  re-implements its phases.
- `watch` — watch the rendered MP4 for the output QC pass.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `format` (`product-hypermotion`),
   `recipe` (the source scene plan), `extracted_script`, `how_to`, `media_url`.
   **`/watch` the `media_url`** — a multi-scene format's shape isn't obvious from JSON.
3. Brand gate: `get_ad_brand { brand_id }`. If `research_status: "complete"` REUSE the
   pack; else run brand-research first.
4. **Machine preflight** — confirm the builder's stack is reachable. If not, tell the
   user the exact fix and STOP — do not open a render row that can only fail.

### Phase 1 — Derive the brand's scene plan
Copy the source `recipe` into a working `config.json` and swap the substance beat by
beat, keeping the format's shape + the craft rules below. Zero source-brand leakage.

### Phase 1.5 — Approval gate (in-session)
Render the cheapest first artifacts for review (per the builder — e.g. keyframes / a
scene plan / a silent cut), show the user, and mirror to the app:
`update_ad_project_script { project_id, script_drafts: { format: "product-hypermotion",
ingredients: [...] }, script: <the scene/beat outline> }`. Upload cheap previews as
`path` ingredients (NEVER `pending`); reserve `pending: true` ONLY for the final
master. **Do not fire the expensive per-scene generation until the user says go.**
Draft-only mode: STOP after the mirror — minimal credits.

### Phase 2 — Render (open the row FIRST, report stages)
1. `submit_render { project_id, kind: "full" }` (debits 1 credit at row creation —
   LAST, right before the paid generation) → keep `render_id`; `update_render_status
   { render_id, status: "running" }`.
2. Hand off to `create-product-hypermotion-video-from-refs` to run the scene pipeline + assembly. Narrate with
   `append_project_message` (never sit silent > 90s).
3. Fix loop: re-roll only the offending scene off its clean anchor; re-assemble.

### Phase 3 — QC + publish
1. **Review gate (MANDATORY — must PASS).** `/watch` the master against the builder's
   Quality Checks. Never `set_final_render` on a failed watch.
2. Publish: `get_upload_url { target: ADS_AGENT }` → PUT the master to
   `working/final.mp4` + a poster to `working/final-thumb.jpg` (always the org-default
   Ads agent). Verify via `get_download_url`.
3. `update_render_status { render_id, status: "complete", output_url, thumbnail_url }`
   where `output_url` is the durable render-file URL
   `/api/ads/projects/<project_id>/render-file?path=working/final.mp4` (never a raw CDN
   URL). Then `set_final_render { project_id, render_id }`.
4. Return the `app_url` + `brand_url` verbatim.

On a hard error set the render `failed` with a short `error_message` and stop — never
ship the source unchanged.

## Rules (format-specific — enforce these)

- ONE Seedance call, DICED into 5-6 segments — never fire per-segment calls (~$4.5 vs ~$22, and identity/camera/grade stay consistent).
- Use the 5-block Seedance prompt; the ABSOLUTE CONSTRAINTS block is MANDATORY — omitting it drifts the product geometry (a speaker morphed to a cowbell).
- Real logo PNG on the end card (base64-decode the brand SVG's embedded PNG) — a typeset wordmark reads as fake.
- Kinetic cards obey the constants: outline echo at 1.08x, hero stat in 3D extrusion in the accent color, and the end-card wordmark keeps continuous micro-motion after settle (a frozen 3s reads as a JPEG). Static font TTFs (variable renders as Regular in PIL).
- Intercut rhythm, not a deck: open on the intro card (not hypermotion), always alternate segment<->spec, shorten segments toward the CTA, end on the brand card; center-crop 1:1->9:16, cut on Seedance's natural beats.
- Music-led, VO-silent, 124 BPM bass (100 for sport/utility); mux as a SEPARATE pass with -map 0:v -map 1:a. Palette is voice-locked (industrial/sport/party/utility only).
- **Every paid surface is gated** — approve the cheap previews before the expensive
  per-scene generation; `submit_render` LAST.
- **Reuse the brand** when research is complete; never re-research.
- **`output_url` = the durable render-file URL**, never a CDN URL.
- Always end a successful run with `app_url` + `brand_url`.
