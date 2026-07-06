---
name: remix-value-prop-from-sample
description: Remix a published "value-prop ad (sequential benefit claims over per-SKU visuals)" ad from the Goose Ads library for a new brand — keep the source's format (a ~17s value-prop ad: 3-5 short noun-phrase benefit claims revealed sequentially over per-SKU product visuals (the hero rotates per claim), sound-off legible, over a quiet instrumental bed), swap in the brand's products/assets/copy, get the drafted scenes approved in-session, then render locally via create-value-prop-video-from-refs and publish the MP4 back to Gooseworks with live stage reporting. This is what the app's "value-prop ad (sequential benefit claims over per-SKU visuals)" format tab calls.
---

# remix-value-prop-from-sample

## Purpose

Given **one published value-prop ad (sequential benefit claims over per-SKU visuals) sample** (from the Goose Ads library) + a **researched
brand**, produce a finished vertical ad for that brand. The source sample defines the
*shape* — a ~17s value-prop ad: 3-5 short noun-phrase benefit claims revealed sequentially over per-SKU product visuals (the hero rotates per claim), sound-off legible, over a quiet instrumental bed — and this skill swaps the *substance* into the brand's products,
assets, voice, and offer.

This skill is **orchestration**: it derives + gets approval for the scene plan (the
`config.json`), then hands rendering to
[`create-value-prop-video-from-refs`](../create-value-prop-video-from-refs/SKILL.md) and handles all Gooseworks I/O (render rows,
stage reporting, durable upload, final pin). The craft rules (below + in the builder)
are load-bearing — do not drop them.

It runs on the **user's machine inside their Claude Code session** (the goose-video
local-worker model). The runtime contract — MCP tools, media proxies, durable URLs,
the credit gate — is the installed `goose-video` master skill; this recipe assumes it.

This is a **multi-scene, scene-orchestrated** format (not a single-call render). Paid
surfaces: just the ElevenLabs music bed (or silent) — the per-SKU visuals, text overlays, and assembly are free/deterministic PIL + ffmpeg.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "value-prop"` (stored as `recipe.format`). Without one, `create_ad_project { brand_id, name, source_sample_id }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id> }` → `format` (`value-prop`), `recipe` (the source's `config.json`: the full scene plan), `extracted_script`, `how_to`, `media_url` (watch it — this is a multi-scene format, so the shape matters). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run brand-research first. Needs the real product/brand assets the scenes reference + voice + a never-say list. |
| `angle` | optional | User steer (which products/scenes lead, the hook). |
| machine | yes | The builder's stack (see its SKILL) reachable through the master skill's proxies. |

## Composed Atoms

- [`create-value-prop-video-from-refs`](../create-value-prop-video-from-refs/SKILL.md) — the renderer (the sibling builder molecule):
  it owns the scene pipeline, the models, and the assembly. This skill never
  re-implements its phases.
- `watch` — watch the rendered MP4 for the output QC pass.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `format` (`value-prop`),
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
`update_ad_project_script { project_id, script_drafts: { format: "value-prop",
ingredients: [...] }, script: <the scene/beat outline> }`. Upload cheap previews as
`path` ingredients (NEVER `pending`); reserve `pending: true` ONLY for the final
master. **Do not fire the expensive per-scene generation until the user says go.**
Draft-only mode: STOP after the mirror — minimal credits.

### Phase 2 — Render (open the row FIRST, report stages)
1. `submit_render { project_id, kind: "full" }` (debits 1 credit at row creation —
   LAST, right before the paid generation) → keep `render_id`; `update_render_status
   { render_id, status: "running" }`.
2. Hand off to `create-value-prop-video-from-refs` to run the scene pipeline + assembly. Narrate with
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

- Claims are noun phrases, <=4 words, 3-5 of them — compress aggressively but never drop meaning; never <3, never >5.
- One per-SKU visual per claim, hero ROTATES (never one flat variety-pack image as every canvas); needs >=3 clean cutout PNGs.
- Sound-off legibility is the bar — the headline stays ink on white; the per-SKU color lives only on the 4px accent rule, not the headline (light headlines on white = low contrast).
- Uniform pacing, hard cuts: hook ~3.0s, props 2.0-2.5s each (uniform), end card ~2.0s → ~17s total; no acceleration, no dissolves, no human-face focus.
- Music is a quiet instrumental bed at -14 dB or silent; always mux a track (anullsrc if silent) with explicit -map, mean volume -25..-34 dB, bitrate >=100 kbps.
- Deterministic animation only — every beat is a pure function of beat-local time (initRenderer(dur, renderFn)); never CSS keyframes / setTimeout. End card uses the brand's real wordmark.
- **Every paid surface is gated** — approve the cheap previews before the expensive
  per-scene generation; `submit_render` LAST.
- **Reuse the brand** when research is complete; never re-research.
- **`output_url` = the durable render-file URL**, never a CDN URL.
- Always end a successful run with `app_url` + `brand_url`.
