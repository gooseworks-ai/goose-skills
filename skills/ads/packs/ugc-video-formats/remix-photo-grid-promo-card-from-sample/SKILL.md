---
name: remix-photo-grid-promo-card-from-sample
description: Remix a published "photo-grid promo card" ad from the Goose Ads library for a new brand — keep the source's format (wordmark + big headline + a 2×3 grid of product/lifestyle/%-OFF/promo-code tiles + feature chips, staggered slide-in, then hold), swap in the brand's wordmark, product, offer, photos, and palette, get the built card approved in-session, then render locally via create-photo-grid-promo-card-video-from-refs (deterministic HTML→Playwright→ffmpeg + music) and publish the MP4 back to Gooseworks with live stage reporting. This is what the app's "Photo-grid promo card" format tab calls.
---

# remix-photo-grid-promo-card-from-sample

## Purpose

Given **one published photo-grid promo-card sample** (from the Goose Ads library) +
a **researched brand**, produce a finished vertical promo card for that brand. The
source sample defines the *shape* — a designed feed card (wordmark, big headline +
sub, a 2×3 grid mixing a product tile / lifestyle photos / a "% OFF" serif tile / a
dark promo-code tile, plus feature chips) that slides in on a staggered beat then
holds. This skill swaps the *substance*: the wordmark, product image, headline,
offer (% + code), lifestyle photos, and palette all become the brand's own.

This skill is **orchestration**: it derives + gets approval for the built card
(`config.json`), then hands rendering to
[`create-photo-grid-promo-card-video-from-refs`](../create-photo-grid-promo-card-video-from-refs/SKILL.md)
and handles all Gooseworks I/O (render rows, stage reporting, durable upload, final
pin). Craft rules (the tile types, the motion, the never-AI-render-text rule) live
in the builder molecule — do not duplicate them here.

It runs on the **user's machine inside their Claude Code session** (the goose-video
local-worker model). The runtime contract — MCP tools, media proxies, durable URLs,
the credit gate — is the installed `goose-video` master skill; this recipe assumes it.

Stack constraint (inherited from the builder): **deterministic HTML→Playwright→ffmpeg
card + one optional ElevenLabs music bed.** No generative video, no AI-rendered
text, no captions.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "photo-grid-promo-card"` (this string is stored as `recipe.format`). Without one, `create_ad_project { brand_id, name, source_sample_id }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id> }` → `format` (`photo-grid-promo-card`), `recipe` (the source's `config.json`: headline/tiles/chips/palette), `extracted_script` (the card copy), `how_to`, `media_url` (watch it if unclear). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run brand-research first. Needs: wordmark (SVG/PNG), a clean product image, the brand's OWN offer (% + code — never invent), 2–3 real lifestyle photos, palette. |
| `angle` | optional | User steer (which offer to lead, which flexes become chips). |
| machine | yes | Playwright chromium + `ffmpeg` + `ELEVENLABS_API_KEY` (music only) reachable through the master skill's proxies. |

## Composed Atoms

- [`create-photo-grid-promo-card-video-from-refs`](../create-photo-grid-promo-card-video-from-refs/SKILL.md)
  — the renderer: builds the card HTML from `config.json`, frame-steps it to a
  silent master, and (optionally) muxes a music bed. This skill never re-implements it.
- `watch` — watch the rendered MP4 for the output QC pass.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `format`
   (`photo-grid-promo-card`), `recipe` (source `config.json`), `extracted_script`,
   `how_to`, `media_url`. If unclear, `/watch` the `media_url`.
3. Brand gate: `get_ad_brand { brand_id }`. If `research_status: "complete"` REUSE
   the pack (wordmark + product + the brand's own offer + palette + never-say); else
   run brand-research first.
4. **Machine preflight** — confirm Playwright chromium + `ffmpeg` (+ `ELEVENLABS_API_KEY`
   if music) are reachable. If not, tell the user the exact fix and STOP — do not open
   a render row that can only fail. (The card render itself is free/deterministic.)

### Phase 1 — Derive the brand's card config
Copy the source `recipe` into a working `config.json` and swap the substance:
- **Wordmark** → the brand's real logo (SVG/PNG). Never AI-render it.
- **Headline / sub** → the brand's line, in its voice.
- **6 tiles** → the brand's real product image (`product` tile), 2–3 real lifestyle
  photos (`photo` tiles), and the brand's OWN offer on the `off` (% OFF) + `code`
  tiles. **Zero invented proof** — the % and promo code come from the brand pack.
- **Chips + palette** → the brand's feature flexes + brand colors.
Keep the format's shape: two-header block over a 2×3 grid + chips, staggered slide-in.

### Phase 1.5 — Approval gate (in-session)
Render the card for FREE first (`one_shot.py --no-music` builds the HTML + a silent
master). Show the user the built card (a still or the silent clip) + the copy/offer,
and ask them to approve or edit. Persist + mirror to the app so the Review panel
shows it: `update_ad_project_script { project_id, script_drafts: { format:
"photo-grid-promo-card", ingredients: [...] }, script: <headline + sub + offer +
chips> }`. Upload the built card still / silent preview as `path` ingredients (NEVER
`pending`); reserve `pending: true` ONLY for the final master. **Do not run the paid
music call until the user says go.** Draft-only mode: STOP after the mirror — $0.

### Phase 2 — Render (open the row FIRST, report stages)
1. `submit_render { project_id, kind: "full" }` (debits 1 credit at row creation —
   LAST, right before the render) → keep `render_id`; `update_render_status {
   render_id, status: "running" }`.
2. Hand off to `create-photo-grid-promo-card-video-from-refs`: run `one_shot.py` with
   the approved `config.json` (build card → frame-step render → music → mux). Narrate
   with `append_project_message` (never sit silent > 90s).
3. Fix loop: tune `config.json` (copy/tiles/palette/timing) and re-render — the render
   is free, so iterate freely before the (cheap) music step.

### Phase 3 — QC + publish
1. **Review gate (MANDATORY — must PASS).** `/watch` the master: wordmark, headline,
   "% OFF", and promo code are crisp; every photo tile fully fills its tile; the
   product tile reads; tiles slide in then hold; music (if any) starts at t=0. Never
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

- **Deterministic render = free.** Only the ElevenLabs music bed spends; iterate the
  card freely before it. `submit_render` LAST.
- **Never AI-render text; never invent the offer.** Wordmark/%/code/copy are DOM/SVG;
  the % and promo code are the brand's own approved figures. Reuse the brand when
  research is complete; never re-research.
- **Real product + real photos only** (inherited from the builder).
- **`output_url` = the durable render-file URL**, never a CDN URL.
- Always end a successful run with `app_url` + `brand_url`.
