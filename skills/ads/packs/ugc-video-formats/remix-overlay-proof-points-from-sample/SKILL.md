---
name: remix-overlay-proof-points-from-sample
description: Remix a published "perfect-score + proof-points" UGC product ad from the Goose Ads library for a new brand — keep the source's format (one handheld product shot + a white score header + an orange sub + a diagonal cascade of 3–4 green-check proof pills), swap in the brand's product, score claim, and proof copy, get the keyframe still + pill copy approved in-session, then render locally via create-overlay-proof-points-video-from-refs (nano-banana keyframe → Kling i2v → PIL/FFmpeg overlays → music) and publish the MP4 back to Gooseworks with live stage reporting. This is what the app's "Perfect-score + proof-points" format tab calls.
---

# remix-overlay-proof-points-from-sample

## Purpose

Given **one published perfect-score + proof-points UGC sample** (from the Goose Ads
library) + a **researched brand**, produce a finished vertical ad for that brand.
The source sample defines the *shape* — the comparison-tool-reviewer format: one
handheld product shot, a persistent white "we got a perfect 10/10 score" header, an
orange "but here's also why you'll love us" sub, and a diagonal L→R→L→R cascade of
3–4 green-✅ proof pills. This skill swaps the *substance*: the product becomes the
brand's real SKU, the score + proof copy become the brand's own approved claims, and
the setting/creator is re-cast for the brand's audience.

This skill is **orchestration**: it derives + gets approval for the keyframe still
and the pill copy (`config.json`), then hands rendering to
[`create-overlay-proof-points-video-from-refs`](../create-overlay-proof-points-video-from-refs/SKILL.md)
and handles all Gooseworks I/O (render rows, stage reporting, durable upload, final
pin). Creative craft rules (the pill-rendering rules, the cascade layout, the
handheld-i2v negatives) live in the builder molecule — do not duplicate them here.

It runs on the **user's machine inside their Claude Code session** (the goose-video
local-worker model). The runtime contract — MCP tools, the FAL/ElevenLabs media
proxies, durable URLs, the credit gate — is the installed `goose-video` master
skill; this recipe assumes it.

Stack constraint (inherited from the builder): **nano-banana keyframe + Kling i2v +
PIL/FFmpeg overlays + ElevenLabs music.** No Seedance, no dialogue, no captions. Two
paid model calls (keyframe + i2v) + one music call.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "overlay-proof-points"`. The paste-prompt carries it. Without one, `create_ad_project { brand_id, name, source_sample_id, format_key: "overlay-proof-points" }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id> }` → `format` (`overlay-proof-points`), `recipe` (the source's `config.json`: score/subhead/proof copy + layout), `extracted_script` (the pill copy, one claim per line), `how_to`, `media_url` (watch it if the shape is unclear). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run the brand-research recipe first. Needs: a clean one-hand product image, the brand's OWN score/proof claims (never invent), voice, a never-say list. |
| `angle` | optional | User steer ("lead with the clinical score", "flex the taste"). Folded into which proof points lead. |
| machine | yes | `ffmpeg` + `FAL_KEY` + `ELEVENLABS_API_KEY` reachable through the master skill's proxies (preflight below). |

## Composed Atoms

- [`create-overlay-proof-points-video-from-refs`](../create-overlay-proof-points-video-from-refs/SKILL.md)
  — the renderer (sibling builder): fetches Twemoji icons, renders the keyframe +
  i2v base clip, builds the pill overlays, composites the cascade, muxes music. This
  skill never re-implements its phases.
- `watch` — watch the rendered MP4 (frames + audio) for the output QC pass.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `format`
   (`overlay-proof-points`), `recipe` (source `config.json`), `extracted_script`
   (pill copy), `how_to`, `media_url`. If the shape is unclear, `/watch` the `media_url`.
3. Brand gate: `get_ad_brand { brand_id }`. If `research_status: "complete"` **REUSE
   the pack** (read the product image + the brand's own score/proof claims + never-say);
   if not complete, run the master skill's brand-research workflow first.
4. **Machine preflight** — confirm `ffmpeg`, the FAL proxy, and `ELEVENLABS_API_KEY`
   are reachable (the render is two paid FAL calls + one music call routed through
   the master skill's proxies). If not, tell the user the exact fix and STOP — do not
   open a render row that can only fail.

### Phase 1 — Derive the brand's keyframe + pill copy
Copy the source `recipe` into a working `config.json` and swap the substance:
- **Product** → the brand's real one-hand SKU. Set `config.product_ref` to the
  brand's product image; write the keyframe `prompt` to preserve the brand's label
  EXACTLY (wordmark, key label lines) and place it in a brand-appropriate setting.
- **Score claim / subhead / proof points** → rewrite in the brand's voice using the
  brand's OWN approved figures. **Zero invented proof** — a "10/10 score" or a
  clinical/dose claim must come from the brand pack, not the source sample and not an
  assumption. Zero source-brand leakage (no source product, score, or copy survives).
- **Layout** → keep the format's shape: two persistent headers + a 3–4 pill diagonal
  cascade with staggered reveals. Adjust `reveal_times` only to fit the beat.

### Phase 1.5 — Approval gate (in-session)
Render the keyframe still and the overlay pills for FREE first
(`one_shot.py --no-paid` builds the pills; the keyframe is the one cheap paid call
you may front-load, or show a design preview off a placeholder clip). Show the user
the drafted score/subhead/proof copy + the keyframe still + the pill layout, and ask
them to approve or edit. Persist + mirror to the app so the Review panel shows it:
`update_ad_project_script { project_id, script_drafts: { format: "overlay-proof-points",
ingredients: [...] }, script: <the readable score + subhead + proof-point list> }`.

**Ingredients for the in-app review** — an ingredient with a `path` shows a **real
thumbnail**; one with `pending: true` shows a grey placeholder. Upload as `path`
ingredients (NEVER `pending`):
- the keyframe still (`container: "image"`, label "Keyframe"),
- each rendered overlay pill or a composited preview still (`container: "image"`,
  label "Score header" / "Proof pills"),
- the pill copy as the readable `script`.
For each: `get_upload_url` → PUT to `working/review/<name>`, then list it. Reserve
`pending: true` ONLY for the rendered master. **Do not fire the i2v + music render
until the user says go** — those are the paid calls.

**Draft-only mode (free review):** if the user says "draft only" / "just the refs",
STOP after the mirror — no render row, zero credits.

### Phase 2 — Render (open the row FIRST, report stages)
1. `submit_render { project_id, kind: "full" }` (debits 1 credit at row creation — do
   this LAST, right before the paid render) → keep `render_id`; `update_render_status
   { render_id, status: "running" }`.
2. Hand off to `create-overlay-proof-points-video-from-refs`: run `one_shot.py`
   (keyframe + Kling i2v + overlays + music + composite) with the approved
   `config.json`. Narrate the queue with `append_project_message` (never sit silent
   > 90s).
3. If the label drifts or a beat reads wrong, use the builder's Phase 4 fix (re-roll
   the i2v seed off the clean keyframe / adjust `config.json` copy + re-compose) — do
   NOT re-fire the keyframe unless identity itself drifts.

### Phase 3 — QC + publish
1. **Review gate (MANDATORY — must PASS before you publish).** `/watch` the master:
   the label is intact and unmorphed through the handheld motion; both header pills
   persist; all 3–4 ✅ pills are fully on-frame and reveal in the L→R cascade; no AI
   smear on the hand/label; duration within ~20% of the source. Never `set_final_render`
   on a failed watch.
2. Publish: `get_upload_url { target: ADS_AGENT }` → PUT the master to
   `working/final.mp4` + a poster to `working/final-thumb.jpg` (always target the
   org-default Ads agent). Verify servable via `get_download_url`.
3. `update_render_status { render_id, status: "complete", output_url, thumbnail_url }`
   where `output_url` is the durable render-file URL
   `/api/ads/projects/<project_id>/render-file?path=working/final.mp4` (never a raw
   CDN URL). Then `set_final_render { project_id, render_id }`.
4. Return the `app_url` + `brand_url` verbatim.

On a hard error (auth/quota/model/NSFW-reject/timeout) set the render `failed` with a
short `error_message` and stop — never ship the source unchanged.

## Rules

- **Two paid model calls = keyframe + i2v.** Plus one music call. Everything else
  (overlays, composite) is free and deterministic.
- **Every paid call is gated** — paste the keyframe still + pill copy and wait for go;
  `submit_render` LAST.
- **Never invent proof.** The score and every ✅ claim is the brand's own, approved
  figure. Reuse the brand when research is complete; never re-research.
- **Never AI-render the pill text; no dialogue, no captions, no contact physics**
  (inherited from the builder).
- **`output_url` = the durable render-file URL**, never a CDN URL.
- Always end a successful run with `app_url` + `brand_url`.
