---
name: video-production-harness/edit-clip
description: Re-generate or modify a single scene clip — keyframe swap, motion re-roll, post-effects, comp swap, or VO re-render — without disturbing the rest of the video.
---

# Human version

Revise one scene from the exact reviewed version while preserving good work. Record timing and approval consequences and review the replacement in context.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md). Read [the editorial review guide](references/editorial-review.md) for source binding, note disposition, impact checks and edit history.

## Purpose

Fix one scene after `create-clips` (wrong pose, weak motion, off-tone voice) without re-running the pipeline. Write a labeled scene candidate and update `clip_review` through the binding. Keep the original bytes and provenance; the accepted cut and the note's source keep their identities.

## Inputs

- `<video_folder>` and `<scene_index>` (e.g. `5` or `09`)
- `<edit_type>`, one of:
  - `regenerate-keyframe`: new image, revised prompt
  - `re-roll-motion`: same keyframe, new motion prompt
  - `swap-keyframe-and-animate`: new image and new motion
  - `add-post-effect`: an FFmpeg pass (vignette, grade, crop, overlay)
  - `re-render-vo`: different line delivery or voice settings
  - `replace-clip`: a user-provided MP4
- The new prompt or asset the edit needs

## Workflow

### Common prep
1. Read `design_brief`, the saved sources and the note on its exact reviewed version. Resolve the stable scene id, retained takes and intended viewer effect. Never pick a scene from the latest master by filename.
2. Archive the current asset to `<video_folder>/_archive/scene-NN_<timestamp>.mp4` (or `.mp3`) before overwriting.
3. Read the scene's `<output>.meta.json` for its `gateway` and routing row. **Re-roll on the same routing row and gateway** to avoid drift; switch only when the operator says so, and log it.
4. Record the impact row from the editorial review guide. A changed line, delivery or pause can move picture holds, word timings, captions, transitions, music, CTA, approvals and derivatives. Keep unaffected media. A matching duration does not prove dependent timings still hold.

### Per edit type

**regenerate-keyframe**
1. Write a prompt that fixes the issue ("less dark", "red shirt clearer", "wider"). Keep the style descriptor block and the verbatim `<character_descriptors>`.
2. Submit on the scene's row in [the shot-routing guide](references/shot-routing.md). On a detected failure, reconcile the job and use only a supported fallback row inside the approved budget (same rules as `create-clips`).
3. Save `generated/keyframes/scene-NN.png`, then animate it as in re-roll-motion.

**re-roll-motion**
1. Use the existing keyframe as the start image.
2. Write a motion prompt stressing the action that did not land.
3. Submit on the same routing row and model; save `clips/scene-NN.mp4`.
4. Run the clip check as in `create-clips` (one redo at most).

**swap-keyframe-and-animate**: regenerate-keyframe, then re-roll-motion on the new image.

**add-post-effect**
- Vignette: `ffmpeg -i in.mp4 -vf "vignette=PI/4" out.mp4`.
- **No retiming.** Never speed up, slow down or extend a clip to fit a slot (no `speed_overrides`, no tpad or loop holds; only the timeline's declared end-card freeze). Speaking picture and its driver stay on one clock. A clip of the wrong length is re-rolled or re-performed.
- Crop or reframe keeps the aspect ratio and the identity, product, action and proof over the whole interval. Never zoom past 1.5× over the fit. On a source below the output's resolution (lip-sync's 720p) the crop multiplies with that upscale: crop in at most 1.1×. Never widen a face or hide wrong geometry or packaging.
- Overlays (logo, product photo, screenshot) use FFmpeg overlay of the real asset.

**re-render-vo**
1. Reuse the selected voice and settings. A new voice (still paired with its character) or a changed spoken line needs renewed script or ingredient approval first.
2. Change settings only when the repair needs it. Validate fields and ranges against the real model schema.
3. Submit the locked line through the host's managed voice capability. A verified direct ElevenLabs route may use `/v1/text-to-speech/{voice_id}`; a managed host never bypasses its billed operation with direct credentials.
4. Save the decoded file's identity and measured timing. Listen to pronunciation, delivery, joins and endings; if you cannot listen, record `measured` with transcript evidence. Measure its pace as create-clips Phase 4 says. When the driver changes, regenerate the lip-synced picture for that line.

**replace-clip**
1. Copy the user's MP4 to `clips/scene-NN.mp4`.
2. If ratio or codec differ: `ffmpeg -i in.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -pix_fmt yuv420p clips/scene-NN.mp4`.

### Update preview
Save the new asset, job, provenance and clip check through the binding. Show the changed media on the host review surface and invalidate only affected approvals. Compare the scene with its neighbours in the new master, then review the whole output. Link "changed" and "verified" separately to the original note; a successful render does not resolve feedback by itself.

## Output

- Updated `<video_folder>/clips/scene-NN.mp4` and/or `audio/vo-scene-NN.mp3`
- The previous version under `<video_folder>/_archive/`
- Updated `clip_review` card copy when needed

## Quality checks

- The new clip matches the approved ratio and target duration ± 0.5 s, or an approved timeline change.
- The person and style match neighbouring scenes.
- Voice audio decodes, uses the selected voice and matches the locked line.
- The host review surface shows the replacement and the preserved prior version.
- The new `.meta.json` `gateway` matches the original, or the switch is logged.

## Failure modes

- A new keyframe drifts from the established person; compare with earlier scenes.
- Veo keeps failing on dark plates: fix the keyframe, then escalate to another routing row (Seedance 2.0 for product-only motion, H3 stills mode for creator B-roll) instead of retrying the same prompt.
- ElevenLabs concurrency errors: one voice re-render at a time.
