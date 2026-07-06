---
name: remix-flat-vector-explainer-from-sample
description: Remix a published "flat-vector illustrated product-routine explainer" ad from the Goose Ads library for a new brand — keep the source's format (a character-locked, scene-orchestrated ~30s flat-vector explainer: a fresh flat-vector creator anchor demonstrates a product routine across numbered beats, with animated text/numeral/product-grid overlays and burned captions over VO + music), swap in the brand's products/assets/copy, get the drafted scenes approved in-session, then render locally via create-flat-vector-explainer-video-from-refs and publish the MP4 back to Gooseworks with live stage reporting. This is what the app's "flat-vector illustrated product-routine explainer" format tab calls.
---

# remix-flat-vector-explainer-from-sample

## Purpose

Given **one published flat-vector illustrated product-routine explainer sample** (from the Goose Ads library) + a **researched
brand**, produce a finished vertical ad for that brand. The source sample defines the
*shape* — a character-locked, scene-orchestrated ~30s flat-vector explainer: a fresh flat-vector creator anchor demonstrates a product routine across numbered beats, with animated text/numeral/product-grid overlays and burned captions over VO + music — and this skill swaps the *substance* into the brand's products,
assets, voice, and offer.

This skill is **orchestration**: it derives + gets approval for the scene plan (the
`config.json`), then hands rendering to
[`create-flat-vector-explainer-video-from-refs`](../create-flat-vector-explainer-video-from-refs/SKILL.md) and handles all Gooseworks I/O (render rows,
stage reporting, durable upload, final pin). The craft rules (below + in the builder)
are load-bearing — do not drop them.

It runs on the **user's machine inside their Claude Code session** (the goose-video
local-worker model). The runtime contract — MCP tools, media proxies, durable URLs,
the credit gate — is the installed `goose-video` master skill; this recipe assumes it.

This is a **multi-scene, scene-orchestrated** format (not a single-call render). Paid
surfaces: Kling i2v per character scene + ElevenLabs eleven_v3 VO + a music bed; the Remotion text overlays, real-product grid, captions, and cut-down assembly are free/deterministic.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "flat-vector-explainer"` (stored as `recipe.format`). Without one, `create_ad_project { brand_id, name, source_sample_id }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id> }` → `format` (`flat-vector-explainer`), `recipe` (the source's `config.json`: the full scene plan), `extracted_script`, `how_to`, `media_url` (watch it — this is a multi-scene format, so the shape matters). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run brand-research first. Needs the real product/brand assets the scenes reference + voice + a never-say list. |
| `angle` | optional | User steer (which products/scenes lead, the hook). |
| machine | yes | The builder's stack (see its SKILL) reachable through the master skill's proxies. |

## Composed Atoms

- [`create-flat-vector-explainer-video-from-refs`](../create-flat-vector-explainer-video-from-refs/SKILL.md) — the renderer (the sibling builder molecule):
  it owns the scene pipeline, the models, and the assembly. This skill never
  re-implements its phases.
- `watch` — watch the rendered MP4 for the output QC pass.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `format` (`flat-vector-explainer`),
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
`update_ad_project_script { project_id, script_drafts: { format: "flat-vector-explainer",
ingredients: [...] }, script: <the scene/beat outline> }`. Upload cheap previews as
`path` ingredients (NEVER `pending`); reserve `pending: true` ONLY for the final
master. **Do not fire the expensive per-scene generation until the user says go.**
Draft-only mode: STOP after the mirror — minimal credits.

### Phase 2 — Render (open the row FIRST, report stages)
1. `submit_render { project_id, kind: "full" }` (debits 1 credit at row creation —
   LAST, right before the paid generation) → keep `render_id`; `update_render_status
   { render_id, status: "running" }`.
2. Hand off to `create-flat-vector-explainer-video-from-refs` to run the scene pipeline + assembly. Narrate with
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

- Keep the MOTION layer and the TEXT layer separate — strip text to a clean plate, Kling-i2v it, and composite ALL copy as animated Remotion DOM on top (baked text warps under i2v).
- Real product photos only for the per-step shots and the closing grid — AI duplicates SKUs.
- Render a FRESH flat-vector character anchor; never chain the brand's photoreal character as a ref.
- Only character scenes get i2v; slate/grid/CTA beats are Remotion text.
- Cut-downs slice from the ANIMATED silent-master, never a static intermediate.
- **Every paid surface is gated** — approve the cheap previews before the expensive
  per-scene generation; `submit_render` LAST.
- **Reuse the brand** when research is complete; never re-research.
- **`output_url` = the durable render-file URL**, never a CDN URL.
- Always end a successful run with `app_url` + `brand_url`.
