---
name: video-production-harness/edit-clip
description: Re-generate or modify a single scene clip — keyframe swap, motion re-roll, post-effects, comp swap, or VO re-render — without disturbing the rest of the video.
---

# Human version

Revise one scene from the exact reviewed version while preserving good work. Record timing and approval consequences and review the replacement in context.

---

# Agent version

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation. Read [the editorial review guide](references/editorial-review.md) for source binding, stage decisions, note disposition, impact checks and saved edit history.

## Purpose

Targeted iteration on a single scene. Use after `create-clips` when a clip didn't land — wrong character pose, weak motion, missing comp, off-tone VO — and the operator wants to fix that one clip without re-running the full pipeline.

Writes a labeled scene candidate and updates `clip_review` through the binding. Canonical aliases may change only after preserving the original bytes/provenance; the accepted cut and note source keep their immutable identities.

## Inputs

- `<video_folder>` (required)
- `<scene_index>` (e.g. `5` or `09`)
- `<edit_type>` — one of:
  - `regenerate-keyframe` — new `nano_banana_2` image with revised prompt
  - `re-roll-motion` — same keyframe, new `veo3_1_lite` animation prompt
  - `swap-keyframe-and-animate` — new image AND new motion
  - `add-post-effect` — FFmpeg pass (vignette, color grade, slow-mo, speed-up, crop, sticker comp)
  - `comp-felt-mascot` — overlay the photographic mascot on top of a cartoon plate
  - `re-render-vo` — different VO line, voice settings, or whisper variant
  - `replace-clip` — drop in a user-provided MP4 (bypass AI gen)
- New prompt or asset path as needed for the edit type

## Workflow

### Common prep
1. Read `design_brief`, saved production sources and the note on its exact reviewed version. Resolve the stable scene ID, retained takes and intended viewer effect before editing. Do not select a scene from the latest master by filename.
2. Snapshot the current asset(s) to `<video_folder>/_archive/scene-NN_<timestamp>.mp4` (and/or `.mp3`) before overwriting. Never blow away the old version.
3. **Read the scene's `<output>.meta.json`** (alongside the existing clip/keyframe) to determine the original `gateway` (`higgsfield` or `fal`). Re-rolls default to the SAME provider as the original to avoid cross-provider drift mid-scene. Only switch providers if the operator explicitly passes a different `<provider_override>` for this edit.

Before execution, record the impact row from [the editorial review guide](references/editorial-review.md): changed line/delivery/pause can affect picture holds, word timings, later captions, transitions, music/SFX, CTA, approvals and derivatives. Preserve unaffected media and valid decisions. A duration match is not evidence that all dependent timings remain correct.

### Per edit type

**regenerate-keyframe**
1. Compose a new prompt that addresses the issue (e.g. "less dark", "Tom's red shirt clearer", "wider framing"). Keep the cartoon style descriptor block.
2. Route through the same provider as the original (read original `meta.json`):
   - `gateway: "higgsfield"` → call `the host image-generation operation` with `nano_banana_2` (or `gpt_image_2` for photoreal). On detected failure, reconcile the job and use only an explicitly supported approved-budget fallback (same rules as `create-clips`).
   - `gateway: "fal"` → resolve the supported managed image edit/generation operation through the binding.
3. Save → `generated/keyframes/scene-NN.png`. Then animate with the existing motion prompt (using the same provider — see re-roll-motion below).

**re-roll-motion**
1. Use the existing keyframe as the actual model's starting-image field.
2. Compose a new motion prompt — emphasize the action that didn't land.
3. Route through the same provider as the original:
   - `gateway: "higgsfield"` → call `the host video-generation operation` with the original model (`veo3_1_lite` etc.). On detected failure, reconcile the job and use only an explicitly supported approved-budget fallback.
   - `gateway: "fal"` → resolve the supported managed video operation through the binding.
4. Download → `clips/scene-NN.mp4`.

**swap-keyframe-and-animate**
1. Run regenerate-keyframe, then re-roll-motion against the new image.

**add-post-effect**
- Vignette: `ffmpeg -i in.mp4 -vf "vignette=PI/4" out.mp4`
- Speed up by 1.25x: `ffmpeg -i in.mp4 -filter:v "setpts=PTS/1.25" -an out.mp4` (if VO is added later)
- Slow down by 0.75x: `setpts=PTS/0.75`
- Crop / reframe: `crop=W:H:X:Y` then `scale=1080:1920`
- Sticker comp: see `comp-felt-mascot` below

**comp-felt-mascot**
1. Background-remove the mascot photo (via Higgsfield image edit, rembg, or a manual cutout). Save to `generated/<mascot>-cutout.png`.
2. Use FFmpeg overlay: `ffmpeg -i scene-NN.mp4 -i mascot-cutout.png -filter_complex "[1:v]scale=W:H[m];[0:v][m]overlay=X:Y" out.mp4` — position `X:Y` on the cartoon plate's empty area.
3. Optionally add a faint cartoon outline halo around the mascot if integration reads as "broken video" instead of "intentional joke".

**re-render-vo**
1. Reuse the human-selected voice/settings. A new voice or changed spoken line requires renewed script/ingredient approval before rendering.
2. Preserve the chosen settings unless the repair explicitly needs an approved change. For a supported ElevenLabs model, historical whisper settings (stability 0.40, style 0.55) and sustained settings (0.55, 0.20) are starting points, not substitutes for the selected audition. Validate fields/ranges against the real model schema.
3. Submit the actual locked line through the host-selected managed voice capability. A verified direct ElevenLabs route may use `/v1/text-to-speech/{voice_id}`; a managed host must use its own approved/billed submit operation and cannot bypass it with direct credentials.
4. Save the actual decoded audio, probe duration and compare transcript/line integrity. A size heuristic alone cannot establish a valid voice asset.

**replace-clip**
1. Copy the user-provided MP4 to `clips/scene-NN.mp4`.
2. If aspect ratio or codec doesn't match, re-encode: `ffmpeg -i in.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -pix_fmt yuv420p clips/scene-NN.mp4`.

### Update preview
Save the replacement asset/job/provenance and fresh named clip checks through the binding. Expose actual changed media on the host review surface and invalidate affected approvals. Preserve unchanged approved assets. Compare the changed scene with its neighbors in the actual new master, then rewatch the whole output. Link changed and verified states separately to the original note and its acceptance condition; a successful clip render cannot resolve feedback by itself.

## Output

- Updated `<video_folder>/clips/scene-NN.mp4` and/or `audio/vo-scene-NN.mp3`
- Archived previous version under `<video_folder>/_archive/`
- Updated card copy in `clip_review` if description changed

## Quality Checks

- Old version is in `_archive/` (never destructive).
- New clip matches the approved ratio and target duration ± 0.5s, or an explicitly approved timeline change.
- Style is consistent with neighbors — Tom in scene 5 should still look like Tom in scene 1.
- VO audio decodes, matches the selected voice/settings and agrees with the locked line; an error response never passes as audio.
- The actual host clip review surface shows the replacement and preserved prior version.
- New `.meta.json` `gateway` field matches the original (or, if intentionally swapped, the swap is recorded in the decision log).

## Failure Modes

- Operator overwrites the old clip without archiving (no rollback).
- New keyframe drifts from established character design — verify against earlier scenes.
- Veo Lite keeps failing on dark plates — escalate to a different model (Kling 3.0, Seedance 2.0) instead of retrying the same prompt. The fallback router will also switch to FAL Veo on detected failure, but a dark-plate keyframe will fail there too — fix the keyframe first.
- Re-roll silently switched providers — produces drift relative to the scene's neighbors. Always read the original `.meta.json` `gateway` before re-rolling and stay on the same provider unless explicitly switching.
- ElevenLabs returns concurrency error — only run one VO re-render at a time.
