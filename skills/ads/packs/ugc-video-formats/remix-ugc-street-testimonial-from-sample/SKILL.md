---
name: remix-ugc-street-testimonial-from-sample
description: Remix a published Single-subject street testimonial (yap) UGC video ad from the Goose Ads library for a new brand — keep the source's format, energy, and beat/monologue shape, swap in the brand's product, avatar archetype, and dialogue, get the reference stills + Seedance prompt approved in-session, then render ONE Seedance 2.0 reference-to-video call via create-ugc-street-testimonial-video-from-refs and publish the MP4 back to Gooseworks with live stage reporting. This is what the app's "Single-subject street testimonial (yap)" UGC format tab calls.
---

# remix-ugc-street-testimonial-from-sample

## Purpose

Given **one published Single-subject street testimonial (yap) UGC sample** (from the Goose Ads library) + a **researched brand**,
produce a finished vertical UGC video for that brand. The source sample defines the *shape* —
format family (monologue (one continuous take, no internal cuts)), energy, dialogue cadence, and reference archetype — and this skill swaps
the *substance*: the avatar becomes a brand-appropriate creator, the product becomes the brand's
real SKU (or a testimonial with no product), and the dialogue is rewritten in the brand's voice.

This skill is **orchestration**: it derives + gets approval for the reference stills and the
Seedance prompt, then hands rendering to
[`create-ugc-street-testimonial-video-from-refs`](../create-ugc-street-testimonial-video-from-refs/SKILL.md) and handles all Gooseworks I/O (render rows, stage reporting,
durable upload, final pin). Creative craft rules (the four-block Seedance prompt recipe, the
surgical single-beat fix loop, the no-contact-physics rule) live in the builder molecule — do not
duplicate or override them here.

It runs on the **user's machine inside their Claude Code session** (the goose-video local-worker
model). The runtime contract — MCP tools, the FAL/ElevenLabs media proxies, durable URLs, the
credit gate — is the installed `goose-video` master skill; this recipe assumes it.

Stack constraint (inherited from the builder): **GPT-image-2 + Seedance 2.0 reference-to-video
only.** No captions. ~35–45 words / 15s.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "ugc-street-testimonial"`. The paste-prompt carries it. Without one, `create_ad_project { brand_id, name, source_sample_id, format_key: "ugc-street-testimonial" }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id> }` → `format` (`ugc-street-testimonial`), `remix_spec` (avatar/voice/world archetype + skills), `extracted_script` (the source dialogue), `how_to`, `media_url` (watch it if the shape is unclear). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run the brand-research recipe first. Needs: voice/tone, product imagery (for the `@ImageN` product ref), a never-say list, CTA/offer. |
| `angle` | optional | User steer ("sell the free trial", "make it skeptical-friend"). Folded into the dialogue. |
| machine | yes | `ffmpeg` + `FAL_KEY` reachable through the master skill's proxies (preflight below). |

## Composed Atoms

- [`create-ugc-street-testimonial-video-from-refs`](../create-ugc-street-testimonial-video-from-refs/SKILL.md) — the renderer (sibling builder molecule): normalizes refs
  (GPT-image-2), authors the four-block Seedance prompt, renders ONE Seedance 2.0 call, runs the
  review + surgical fix loop. This skill never re-implements its phases.
- [`create-video-seedance-2-fal`](../create-video-seedance-2-fal/SKILL.md) — the Seedance render engine the builder drives.
- `create-image-gpt-image-fal` — reference normalization (fetch it separately; it is a shared ads
  capability, not bundled in this pack).
- `watch` — watch the rendered MP4 (frames + transcript) for the output QC pass.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `format` (`ugc-street-testimonial`), `remix_spec`,
   `extracted_script`, `how_to`, `media_url`. If the shape is unclear, `/watch` the `media_url`.
3. Brand gate: `get_ad_brand { brand_id }`. If `research_status: "complete"` **REUSE the pack —
   do NOT re-research** (read voice/never-say + `brand-assets/manifest.json` for product imagery).
   If not complete, run the master skill's brand-research workflow first.
4. **Machine preflight** — confirm `ffmpeg` and the FAL proxy are reachable (the render is one paid
   Seedance call routed through the master skill's `fal-proxy`). If not, tell the user the exact fix
   and STOP — do not open a render row that can only fail.

### Phase 1 — Derive the brand's references + Seedance prompt
Map the source onto the brand, keeping the format's shape and swapping the substance:
- **Avatar** → a brand-appropriate creator archetype (from `remix_spec` avatar as the starting
  point; re-cast for the brand's audience). Normalize to a neutral-background, empty-handed portrait
  via GPT-image-2 (filter-safe phrasing — see the builder's Failure Modes).
- **Product** → Optional — testimonial by default; SaaS served by the testimonial path. Pull the real product image from `brand-assets/manifest.json`; a
  text-only product invites Seedance to invent geometry. For a testimonial with no product, omit
  the product ref entirely — never fake on-screen UI.
- **Dialogue** → rewrite `extracted_script` in the brand's voice, honoring the word budget
  (~35–45 words / 15s). Zero source-brand leakage (no source product, name, or code may survive).
- **Prompt** → author the four-block Seedance prompt via the builder's Phase 2 recipe. Format delta:
  ONE continuous single-subject street testimonial take. Public-sidewalk backdrop; one speaker to camera, no interviewer.

Lock the `@ImageN` reference order.

### Phase 1.5 — Approval gate (in-session)
Show the user the drafted dialogue + the normalized reference stills + the Seedance prompt, and ask
them to approve or edit. Persist + mirror to the app so the Review panel shows it:
`update_ad_project_script { project_id, script_drafts: { format: "ugc-street-testimonial", ingredients: [...] },
script: <the readable dialogue + beat/monologue outline> }`.
**Ingredients for the in-app review** — an ingredient with a `path` shows a **real thumbnail**; one
with `pending: true` shows a grey placeholder. The reference stills are free, local GPT-image-2
renders, so upload them as `path` ingredients (NEVER `pending`):
- each normalized `@ImageN` still (`container: "image"`, label "Avatar ref" / "Product ref" / "Env ref"),
- the audio treatment note (Seedance generates dialogue natively — no separate voice ingredient).
For each: `get_upload_url` → PUT to `working/review/<name>`, then list it. Reserve `pending: true`
ONLY for the rendered master (the one paid Seedance call). **Do not render until the user says go** —
it is a paid call.

**Draft-only mode (free review):** if the user says "draft only" / "just the refs", STOP after the
mirror — no render row, zero credits. Tell them the draft is visible on the project page.

### Phase 2 — Render (open the row FIRST, report stages)
1. `submit_render { project_id, kind: "full" }` (debits 1 credit at row creation — do this LAST,
   right before the paid Seedance call) → keep `render_id`; `update_render_status { render_id,
   status: "running" }`.
2. Hand off to `create-ugc-street-testimonial-video-from-refs` Phase 3: ONE `create-video-seedance-2-fal` call — refs in locked order, the approved
   prompt, `--duration` (default 15), `--resolution`, `--aspect-ratio 9:16`, audio ON. Narrate the
   queue with `append_project_message` (never sit silent > 90s).
3. Builder Phase 4–5: run the review loop; on a flagged beat use the builder's surgical
   `--no-generate-audio` fix + `stitch_replacement.py` (monologue formats have no beats — re-roll
   the take only if identity itself drifts).

### Phase 3 — QC + publish
1. **Review gate (MANDATORY — must PASS before you publish).** First `/watch` the master:
   dialogue matches the script on front-cam beats, identity + product hold, no contact-physics
   mush, duration within ~20% of the source. Then run the deterministic audio-vs-script gate —
   it catches a Seedance-**mis-voiced word** in the generated audio (e.g. approved "vetted"
   spoken as "witted") that an eyeball `/watch` slips through:
   ```bash
   python3 ../review-ugc-render/scripts/review_render.py \
     --video working/final.mp4 --script-file working/approved-script.txt \
     --json working/review-verdict.json
   ```
   Write the approved **verbatim spoken lines** (no beat notes) to `working/approved-script.txt`
   at approval time (Phase 1.5), before the paid render. Gate outcome: **exit 0 → proceed to
   step 2; exit 2 → do NOT publish — re-roll a new seed (audio defect) / fix, then re-run;
   exit 3 → fix the transcription env (`OPENAI_API_KEY`, optional `OPENAI_BASE_URL` proxy) and
   re-run.** Never `set_final_render` on a non-zero gate. See the `review-ugc-render` skill.
2. Publish: `get_upload_url { target: ADS_AGENT }` → PUT the master to `working/final.mp4` +
   a poster to `working/final-thumb.jpg` (always target the org-default Ads agent). Verify servable
   via `get_download_url`.
3. `update_render_status { render_id, status: "complete", output_url, thumbnail_url }` where
   `output_url` is the durable render-file URL `/api/ads/projects/<project_id>/render-file?path=working/final.mp4`
   (never a raw CDN URL). Then `set_final_render { project_id, render_id }`.
4. Return the `app_url` + `brand_url` verbatim.

On a hard error (auth/quota/model/NSFW-reject/timeout) set the render `failed` with a short
`error_message` and stop — never ship the source unchanged.

## Rules

- **One Seedance call = one short take.** Default 15s; honor a user duration in `{4..15}`.
- **Every paid call is gated** — paste the refs + prompt and wait for go; `submit_render` LAST.
- **Reuse the brand** when research is complete; never re-research.
- **No captions, no contact physics, no faked on-screen UI** (inherited from the builder).
- **`output_url` = the durable render-file URL**, never a CDN URL.
- Always end a successful run with `app_url` + `brand_url`.
