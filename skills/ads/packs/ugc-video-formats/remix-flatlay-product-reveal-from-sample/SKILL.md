---
name: remix-flatlay-product-reveal-from-sample
description: Remix a published "flat-lay product reveal" ad from the Goose Ads library for a new brand — keep the source's format (top-down tabletop, hands cup + hold + lift each flat product, hard-cut between beats, greeting-card insert + HTML end card + music), swap in the brand's products, tabletop dressing, and end card, get the flat covers + beats approved in-session, then render locally via create-flatlay-product-reveal-video-from-refs (flat-cover transform → Veo 3.1 i2v per beat → deterministic assembly) and publish the MP4 back to Gooseworks with live stage reporting. This is what the app's "Flat-lay product reveal" format tab calls.
---

# remix-flatlay-product-reveal-from-sample

## Purpose

Given **one published flat-lay-product-reveal sample** (from the Goose Ads library) +
a **researched brand**, produce a finished vertical reveal for that brand. The source
sample defines the *shape* — a top-down tabletop listicle where, beat by beat, a flat
product is cupped, held readable, and lifted away, hard-cutting between beats, closing
on an optional greeting-card insert + a brand end card over music. This skill swaps
the *substance*: the products, their real cover/label art, the tabletop dressing, the
end card, and the music become the brand's own.

This skill is **orchestration**: it derives + gets approval for the flat covers and
the Veo beats, then hands rendering to
[`create-flatlay-product-reveal-video-from-refs`](../create-flatlay-product-reveal-video-from-refs/SKILL.md)
and handles all Gooseworks I/O (render rows, stage reporting, durable upload, final
pin). Craft rules (the flat-cover transform, the Veo hands-cup-and-lift prompt, the
hard-cut assembly, the preserve-the-cover rule) live in the builder molecule — do not
duplicate them here.

It runs on the **user's machine inside their Claude Code session** (the goose-video
local-worker model). The runtime contract — MCP tools, media proxies, durable URLs,
the credit gate — is the installed `goose-video` master skill; this recipe assumes it.

Stack constraint (inherited from the builder): **flat-cover image-edit + Veo 3.1
image-to-video per beat + deterministic FFmpeg assembly + one ElevenLabs music bed.**
Two paid model calls per beat. No talking head, no captions.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "flatlay-product-reveal"` (stored as `recipe.format`). Without one, `create_ad_project { brand_id, name, source_sample_id }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id> }` → `format` (`flatlay-product-reveal`), `recipe` (the source's `config.json`: beats/prompts/tabletop/end-card/music), `extracted_script`, `how_to`, `media_url` (watch it if unclear). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run brand-research first. Needs: 3–5 flat, cover-forward products (real cover art), a tabletop-dressing direction, the brand's end-card HTML/template, a music mood. |
| `angle` | optional | User steer (which products, the order, whether to include the greeting-card insert). |
| machine | yes | `fal_client` (`FAL_KEY`) + Playwright chromium + `ffmpeg` + `ELEVENLABS_API_KEY` reachable through the master skill's proxies. |

## Composed Atoms

- [`create-flatlay-product-reveal-video-from-refs`](../create-flatlay-product-reveal-video-from-refs/SKILL.md)
  — the renderer: flat-cover transform → start-frame composite → Veo i2v per beat →
  insert/end-card/music → hard-cut master. This skill never re-implements its phases.
- `watch` — watch the rendered MP4 for the output QC pass.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `format`
   (`flatlay-product-reveal`), `recipe` (source `config.json`), `extracted_script`,
   `how_to`, `media_url`. If unclear, `/watch` the `media_url`.
3. Brand gate: `get_ad_brand { brand_id }`. If `research_status: "complete"` REUSE the
   pack (products + cover art + end-card template + never-say); else run brand-research first.
4. **Machine preflight** — confirm the FAL proxy (Veo), Playwright chromium, `ffmpeg`,
   and `ELEVENLABS_API_KEY` are reachable (the render is 2 paid FAL calls per beat +
   music). If not, tell the user the exact fix and STOP — do not open a render row that
   can only fail.

### Phase 1 — Derive the brand's config + flat covers
Copy the source `recipe` into a working `config.json` and swap the substance:
- **Beats** → the brand's 3–5 flat products with their real cover/label art
  (`cover_ref` each). Keep the flat-cover transform + Veo prompts (which hard-preserve
  art/text/names/logo).
- **Tabletop plate** → a brand-appropriate dressed surface (`tabletop_bg`).
- **Insert card / end card / music** → the brand's greeting theme, its own end-card
  HTML, and a fitting music mood.
Then run `gen_flat_covers` + `build_start_frames` — the flat covers are the first
approval artifact.

### Phase 1.5 — Approval gate (in-session)
Show the user the flat covers + the start frames (+ the drafted config) and ask them
to approve or edit — **before the paid Veo beats**. Persist + mirror to the app:
`update_ad_project_script { project_id, script_drafts: { format:
"flatlay-product-reveal", ingredients: [...] }, script: <the beat list + product
labels> }`. Upload the flat covers + start frames as `path` ingredients (they're cheap
local renders — NEVER `pending`); reserve `pending: true` ONLY for the rendered
master. **Do not fire the Veo beats until the user says go** (the largest spend).
Draft-only mode: STOP after the mirror — no beats, minimal credits.

### Phase 2 — Render (open the row FIRST, report stages)
1. `submit_render { project_id, kind: "full" }` (debits 1 credit at row creation — LAST,
   right before the paid Veo beats) → keep `render_id`; `update_render_status {
   render_id, status: "running" }`.
2. Hand off to `create-flatlay-product-reveal-video-from-refs`: `gen_beats` (Veo per
   beat) → optional insert → end card → music → `build_master`. Narrate with
   `append_project_message` (never sit silent > 90s).
3. Fix loop: re-roll only the offending beat off its clean start frame; re-assemble
   with `one_shot.py --assemble-only` (free) — don't re-fire good beats.

### Phase 3 — QC + publish
1. **Review gate (MANDATORY — must PASS).** `/watch` the master: every cover reads
   crisp and identical through its beat (no smear/redesign); hands cup + lift, camera
   locked top-down; hard cuts; insert + end card land; music at t=0. Never
   `set_final_render` on a failed watch.
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

## Rules

- **Two paid model calls per beat = flat cover + Veo i2v.** Plus optional insert gen +
  one music call. The assembly is free — iterate the cut with `--assemble-only`.
- **Every paid call is gated** — approve the flat covers/start frames before the Veo
  beats; `submit_render` LAST.
- **Preserve every cover exactly; never invent product copy.** Reuse the brand when
  research is complete; never re-research.
- **Veo (not Seedance) per beat; hard cuts; locked top-down camera** (inherited from
  the builder).
- **`output_url` = the durable render-file URL**, never a CDN URL.
- Always end a successful run with `app_url` + `brand_url`.
