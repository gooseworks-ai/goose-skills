---
name: video-production-harness/create-clips
description: Generate every scene clip per the implementation brief — orchestrates fal image and video, FFmpeg, PIL and ElevenLabs — and saves actual clip assets/evidence for review. Step 4 of the pipeline.
---

# Human version

Make only the missing approved scene material, using the exact brief, assets, script and performance choices. Check specialist inputs and returned media before assembly, preserve valid work on resume, and listen to real speech rather than inferring its quality.

---

# Agent version

## Host contract

Follow [creative contract and review](references/creative-contract-and-review.md) for current content-derived duties, complete AV coverage, clip eligibility and exact-file evidence. Read its linked sound, scale and look procedures when applicable. Preserve the two existing owner gates; no extra automatic review meeting.


Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

Execute the implementation brief end-to-end at the **clip level**: produce one MP4 per scene plus per-scene voiceover MP3s, and register the actual clips on the host review surface so the operator can review the actual generated assets in the same layout as the storyboard.

Does NOT do final stitching, music, SFX, or burned-in captions — that's `edit-video`.

Uses these production responsibilities when the actual route is available. The labels are descriptive; discover an installed supported skill or use the concrete local/host tools in `capabilities.md`. They are not undeclared required executables:
- `create-kinetic-typography` for kinetic type B-roll and `goose-graphics` for designed stills and cards. Lock one style per project so all B-roll cards read as a family.
- End card: `goose-graphics` makes the card still; `stitch-videos-ffmpeg` holds it for the planned seconds.
- `create-vo-elevenlabs` (superseded; agent-built path only) — when a VO must be generated (synthetic narrator path)
- Long-form source voice (podcast-clip path): cut at word boundaries from the transcript's word timings with `ffmpeg -ss <start> -to <end>` so no scene ends mid-word.
- Lip-sync: resolve a qualified supported audio-driven route, lock the exact driver and review a representative take before batching. No automatic Veed close-up fallback or unsupported time-saving promise.
- `stitch-videos-ffmpeg` (only if a scene needs intra-scene concat)
- Continue the same accepted speech under B-roll through the source-linked timeline; resolve native/narrated speech and source ambience before choosing streams.
- Actual host-managed image/video generation and job polling (`the host image-generation operation`, `the host video-generation operation`, `the host job-status operation`)

**B-roll copy rule** (learned on an earlier brand run): the text on every B-roll card must mirror the audio playing under it. Cute synonyms ("HOOPS" for "basketball", "GAME ON" for "when the game starts") create cognitive dissonance and reduce comprehension. Pull literal key phrases from locked_script where they serve the approved design; preserve explicit user-approved on-screen wording and pronunciation-versus-spelling distinctions. Do not add duplicate copy over an already readable product/UI layer.

## Specialist handoff and route checks

Read [specialist handoffs](references/specialist-handoff.md). For UGC/native creator, product/demo footage and motion graphics, fetch the actual selected package and dependencies; record version/hash, input/source/script/beat revisions and expected outputs in the existing capability plan. Validate its free imports/probes/dry run before any paid call. A named specialist or a PNG-returning graphics package is not proof of video capability. No unrecorded machine path may be required.

Load the existing jobs and approved media first. Match exact input fingerprints and probe bytes before honoring a helper's existing-file skip. Reuse valid selected takes, voice auditions, footage windows and keyframes; regenerate only changed or missing work. Returned output must resolve to the planned scene and selected source/version, with actual duration, provenance and review evidence.

## Inputs

- The sourced creative-brief revision/pointer used by the writer, approved product/variant and locked copy
- `<video_folder>/design_brief` (visual spec)
- `<video_folder>/implementation_brief` (operator checklist; required)
- `<video_folder>/locked_script` (canonical VO; required — must exist from State 2.5)
- `<video_folder>/generated/character-lock/character_locks` (required IF the ad has a human character; produced by State 3.5)
- `the host-approved voice catalog` (approved ElevenLabs voices)
- a host-supported, approved voice-generation capability

## Prompt-constraint redundancy (META-pattern)

State hard project constraints clearly in relevant prompt positions and bind actual identity/product/scale references. Repetition can guide generation, but no supported benchmark establishes a 50% versus 95% success rate. Verify every actual output; prompt wording cannot clear a defect.

The three positions are:
1. **Positive framing rule** near the top of the prompt (sets the camera/scene up-front)
2. **Negation** in the middle of the prompt (explicit "do not show X")
3. **Crop / scope rule** at the end (boundary condition)

Complementary prompt constraints are examples, without a portable compliance guarantee:

| Constraint | (1) Positive framing | (2) Negation | (3) Crop / scope |
|---|---|---|---|
| no face | "Camera stays at knee level" | "NO face or head visible" | "Camera never tilts up past the chest line" |
| no logo | "Frame the product front-on, no packaging" | "NO brand names, NO product text" | "Crop excludes any printed labels" |
| color lock | "Subject wears a single deep-red garment (#B81F26)" | "NO orange, NO pink, NO maroon" | "All other garments in frame are neutral gray" |
| single subject | "One person in the frame, alone in the scene" | "NO other people, NO bystanders, NO crowd" | "Background is a deserted street" |
| time of day | "Late afternoon golden-hour, sun low and warm" | "NOT daytime overhead light, NOT night" | "Long warm shadows across the frame" |

If the constraint is *soft* (a preference, a hint, something the operator would accept being broken occasionally), one positioning is fine. Save triple-positioning for the load-bearing rules. See available model behavior guidance for the underlying model behavior this addresses.

## Hard rules (learned on earlier runs — break these and the cascade returns)

- **Never ask an image model to render specific brand or UI text.** Nano Banana garbles "EXAMPLE" → "EXAMPEL"; specific Slack-style UI strings come out as gibberish. All branded text is added in post via PIL or FFmpeg overlay.
- **Kling 3.0 minimum duration is 3 seconds.** Pre-trim to your target in post (1–2s scenes).
- **Image references and video start images use different schemas.** Resolve each receiving model's actual field names and accepted asset representation through the binding. Managed fal uses its own discovered schema; an optional direct Higgsfield route (only if the host has it) uses its own role fields.
- **`.avif` references are rejected by the Anthropic API.** State 0 preflight should have caught this; double-check at Phase 0.
- **Local file paths sometimes can't pass directly to the actual model's reference-value field.** Fallback: upload via the host's actual upload/confirmation operations first, then use the returned media ID.
- **Dark / heavy-vignette keyframes silently fail in Veo Lite.** Generate on neutral background; apply vignette/color in post via FFmpeg.
- **Provider limits vary.** Read the actual account/model concurrency contract, reconcile existing jobs and probe every audio response. File size alone cannot distinguish a valid short take from an error.
- **fal is the default; use Higgsfield only if the host has it and the brief needs Soul ID.** A generation call counts as failed (and triggers the fallback router) when ANY of:
  1. The real submit operation raises an exception (network, auth, server error).
  2. `the host job-status operation` returns `status: "failed"` after polling.
  3. The real status/result operation returns success but the output URL 404s on download.
  4. Downloaded file is < 1 KB (error JSON) for images or < 10 KB for videos.
  5. The provider returns an explicit credit-limit / insufficient_credits error.
  6. Job exceeds 10-min timeout (configurable; veo3/seedance can take longer — extend to 15 min for those).

  When any of these fire AND `<provider_override>` is `fal` (default): reconcile the known job and resolve a supported, approved-budget fallback model through the host. Rate-limit (429) is NOT failure — back off and retry the same provider.

## Workflow

### Phase 0 — Pre-flight
1. Read sourced creative brief, implementation_brief, `locked_script`, scene/timing IDs, source/asset selections and performance intent. Validate the selected specialist handoff, required runtime/dependencies and existing approved jobs/results before generation.
2. Re-run `video-production-harness/preflight-audit` (new assets may have landed since State 0).
3. Create folder layout per the brief: `clips/`, `audio/`, `generated/style-tests/`, `generated/keyframes/`, `raw-materials/`.
4. Copy hero assets (e.g. `hero-photo.jpg`) into `raw-materials/`.
5. **If `character_locks` exists** (ad has a human character): skip the cartoon style-anchor step. The anchor portrait already serves that role. Read `character_locks` and resolve `method` (`anchor-ref`, or `soul-id`: optional, only if the host has Higgsfield) — this drives the actual model's reference inputs payload for every scene with the character.
6. For relevant continuing worlds/person/product scenes, read selected world/product/scale references and exact wardrobe/light/grade/prop/time intent. Send required identity and world/scale references through supported fields and save their actual attached manifest. Apply this even for concept_format other; intentional locations are separately planned. Missing critical reference binding leaves the scene unresolved before spend.
7. **If `character_locks` is absent**, reuse approved product footage/stills or selected style references. Only when a planned generated cartoon/style route needs a missing style anchor, generate **one style-anchor image** through an actually supported approved image model (Nano Banana 2 is a preference when available). Save to `generated/style-tests/style-anchor.png`. **Style lock gate** — inspect; if the style is wrong, iterate before committing video credits.

### Route dispatch after preflight

Execute only the route assigned to each scene in the approved capability plan. Resolve missing tools/dependencies before any paid operation. If route/input/output mapping is ambiguous, save the blocker before creating assets.

| Approved scene route | Execute | Skip |
| --- | --- | --- |
| Reuse owned product/demo footage | Fetched footage-cutlist survey/inspection, approved source windows and cut render; then Phase 5 validation. | New style anchor, keyframe generation and generative animation. |
| Native-speaking creator | Fetched creator package's actual plan/approved native-take procedure; review selected first-take performance before remaining takes, then Phase 5. | Generic still-to-video replacement and separate TTS over native dialogue. |
| Deterministic graphic/still motion | Actual local composition/FFmpeg or installed browser/motion renderer, then Phase 5. | Generative image/video unless separately assigned and approved as a missing input. |
| Generic approved image-to-video | Phase 1 only for missing/unapproved required keyframes, Phase 2 for missing/invalid animation, then Phase 5. | Regeneration of any valid selected keyframe or clip. |

Phase 3 handles planned static/local elements; Phase 4 supplies separate audio only where the audio plan requires it. All routes share source/return validation and final performance/mix review. Presence of a human/product alone does not authorize creating a new anchor. Each successful return carries the existing handoff's scene/beat and source revision into Phase 5.

### Phase 1 — Keyframes

Run only for scenes assigned generic image-to-video or an explicitly approved generated-still input. Reuse valid selected keyframes.
1. For each scene:
   - **Scenes with the locked character** — generate the keyframe with the locked anchor (or the optional soul_id, only if the host has Higgsfield) as a confirmed reference in that model's actual supported image-reference field. Prompt template threads the verbatim `<character_descriptors>` block from `design_brief` plus the scene-specific action.
   - **Scenes without the character** — use the cartoon style anchor as a style ref (mapped to the actual supported image-reference field), or no ref for non-cartoon scenes.
2. Use the approved aspect ratio (normally 9:16) and supported resolution. Use the scene's row in `references/shot-routing.md`; resolve real model IDs and request schemas before submitting.
3. **Never put brand or UI text in the prompt.** "Phone screen shows Slack" → render a neutral screen; the Slack UI is composited in post. "Box labeled Example Brand" → render an unlabeled box; the wordmark goes on in post via PIL.
4. **Provider routing.** Default path is `the host image-generation operation` for each keyframe (run in parallel; fal supports concurrent jobs). On detected failure per the 6 failure-detection rules in "Hard rules", invoke the fallback router:
Resolve this operation through the selected host binding and the real implementation in `capabilities.md`. Preserve its approved inputs, provenance and cost; stop if the capability is unavailable.

   fal is the default managed route. If `<provider_override>=higgsfield` (optional; only if the host has it), no fallback — fail loud.
5. Poll the real returned request through the binding's status/result operations. Managed fal uses its documented submit/status/result contract (an optional direct Higgsfield route, only if the host has it, uses job_status). Save the confirmed image to `generated/keyframes/scene-NN.png`.
6. Inspect every selected keyframe before animating: exact variant/geometry, sourced scale, support/contact, feature visibility, crop/text space and continuity. Follow [product scale and world](references/product-scale-and-world.md); verify actual attachments after caps/filtering. Compare people to accepted anchors/worlds without invented drift percentages. Repair within current approval/budget before animation.
7. **Inherit gateway for downstream calls in the same scene.** Read the keyframe's `<output>.meta.json` to determine `gateway`. The animation in Phase 2 should use the same provider for that scene to avoid cross-provider drift, unless the operator explicitly overrides.

### Phase 2 — Animate clips

Run only for missing/invalid generative animation explicitly assigned by the capability plan. Native specialist clips, retrieved footage and deterministic motion bypass this phase.
1. **Provider routing.** Use the host's supported video-generation operation and current approved scene plan. Use the scene's row in `references/shot-routing.md` with its real catalog model ID, schema and priced unit. Resolve the approved ratio/duration and starting-image input from the actual confirmed keyframe/result, never an assumed job ID. Use a tight motion-only prompt. On detected failure per the 6 failure-detection rules, invoke the fallback router:
Resolve this operation through the selected host binding and the real implementation in `capabilities.md`. Preserve its approved inputs, provenance and cost; stop if the capability is unavailable.

   If the requested family has no supported equivalent in the binding, record `fallback_unavailable` and surface the limitation; do not invent an alternative catalog entry.
2. Poll the actual returned request through the selected binding's documented status/result operations, then save the confirmed output to `clips/scene-NN.mp4`.
3. **Clip check.** Register/confirm the actual clip and submit the current host clip_check with its scene/output identity. Read its completed result; pending is not passed. A rejected candidate may receive only the existing permitted redo within approved budget, then a fresh check. If it fails, exclude both candidates from passing assembly and save the gap; continue independent work, never a second redo. Without automated clip checks, perform the complete manual content duties in [creative contract and review](references/creative-contract-and-review.md). Missing perception stays incomplete.
4. **Failure recovery:** classify provider, input, source/model, edit and capability defects. Reconcile existing jobs first. Use only qualified supported repairs within current authorization; no automatic model-family substitution or unsupported assumption that the prompt caused failure.
5. **Concurrency note:** ElevenLabs limits to ~3 concurrent requests on team plans — gate audio gen accordingly. fal has per-account RPS limits — keep concurrent fal jobs at 2-3.

### Phase 3 — Static / non-AI scenes
- **Hero hold (felt mascot push-in):** FFmpeg zoompan over the hero photo for the scene's duration.
- **End card:** approved deterministic Pillow/FFmpeg composition (background + photo + headline + URL) → FFmpeg loop to MP4. Motion chrome requires an actual installed browser renderer and its dependencies.

### Phase 4 — Voiceover

Apply only to resolved narration/audio-driver/song/source-speech routes. No-speech scenes skip voice but retain planned soundtrack; native scenes reuse checked clip audio. Follow [speech and route qualification](references/speech-and-route-qualification.md), including supported delivery/pronunciation and first-take acceptance. Speech review applies wherever speech exists.

1. Read exact locked_script/locked_lyrics and the host-selected audition for every speaker role. Never select a new voice or regenerate a valid selected per-beat audition silently.
2. Reuse its actual audio files and preserve voice ID, settings, beat IDs and script revision. If full-production rendering is necessary, use those exact settings/text through the managed voice capability under the approved budget.
3. Source audio is split at actual word boundaries using the transcript; inspect cuts for partial phonemes. Native generated dialogue stays on its clip; never double it with a separate narration track.
4. Listen to each actual isolated take/line at normal speed for pronunciation, conversational rhythm, phrase stress, pause intent, endings and defects; later listen again inside the actual full mix. Compare transcript/word timings as supporting evidence. Record unavailable listening as incomplete; do not force faster delivery, global pause removal or louder climax. Check valid decoded audio, duration and exact line agreement. A small/error response is a failure. Concurrency follows the actual provider contract; known 429/concurrency failures back off rather than duplicate jobs.
5. If music is generated, follow the actual provider schema and approved music/lyrics plan. Unsupported artist-name or composition parameters must be resolved before spending.

### Phase 5 — Register reviewable clips

Review actual returned media against the handoff and content-derived duties: exact scene/contract/source revision, line/assets, full action/proof, product geometry/scale/support, measured duration, face/voice/perceptual sync and adjacent continuity. A provider URL or process success is insufficient. Register all sources/jobs and exact pass/needs_change/incomplete evidence. Failed candidates remain visible and excluded from passing assembly.

## Output

- `<video_folder>/clips/scene-{01..NN}.mp4`
- `<video_folder>/audio/vo-scene-{01..NN}.mp3`
- `<video_folder>/audio/voice-choice.md`
- `<video_folder>/generated/keyframes/scene-{01..NN}.png`
- `<video_folder>/generated/style-tests/style-anchor.png`
- `<video_folder>/clip_review`

## Quality Checks

- Every planned scene has its actual checked clip and the audio mode specified by the brief. Separate narration files exist only for scenes that require them; native dialogue is not silently duplicated.
- VO text in every scene MP3 matches locked_script (no drift from design-brief edits).
- If `character_locks` exists, every character-scene keyframe used the locked anchor (or the optional soul_id, only if the host has Higgsfield).
- Style anchor (cartoon ads) OR character anchor (human ads) was reviewed before animation.
- No brand/UI text in any image prompt; branded text is all PIL/FFmpeg overlay.
- Failures are classified, reconciled and repaired only when useful within approval/budget; ambiguous timeouts never force a duplicate paid retry.
- All clips match the approved ratio/duration and decode successfully. All required audio decodes and matches the locked lines; a size heuristic alone cannot prove validity.
- The host clip review surface plays actual clips and matching audio without inventing a review UI.
- Preserve the approved storyboard and its revision.
- Every generated artifact has a `<output>.meta.json` recording its `gateway` (`fal`, or optional `higgsfield` only if the host has it) and model. Any fallback fires are logged in `<video_folder>/.fallback-events.jsonl` with operation, primary model, FAL model, reason, and outcome.

## Failure Modes

- Skipping Phase 0 style-lock / character-lock and burning credits on bad style.
- Ignoring `character_locks` — generates new "from scratch" character keyframes that drift, defeating State 3.5.
- Asking Nano Banana to render specific brand text — produces EXAMPEL-class typos. Always overlay branded text in post.
- Generating videos in parallel that all reference the same source plate, causing identical motion.
- VO returns 593-byte error JSON because of concurrency limit, and operator misses it.
- Dark/vignette keyframes silently fail in Veo Lite (regenerate on neutral background, vignette in post).
- Voice picked outside `the host-approved voice catalog`.
- VO rendered from `design_brief` instead of locked_script — silently re-introduces an unlocked script. Hard fail if they diverge.
- **Both the primary and the fallback model failing on the same scene** — the prompt or keyframe is likely the issue, not the gateway. Don't loop the fallback. Surface to the operator with both error contexts; investigate the prompt before any further attempt.
- **Mid-pipeline provider swap on a character** — if scene 3's keyframe came from one provider and scene 4's from another, character drift will show. Always inherit `gateway` from the anchor's `.meta.json` for character-scene calls; only swap providers if the operator explicitly chooses.

## Use stored original footage

When the customer asks to reuse footage, ask the host to search the current owned media and inspect actual frames plus timed transcript. An analysis description or thumbnail URL alone is not a visual review. Known user-selected trims remain usable when optional semantic analysis is unavailable; record that limitation instead of requesting a duplicate upload.

Freeze `{asset_id, analysis_revision, scene_id, start_ms, end_ms, audio_mode}` in each selected scene and ingredient. `analysis_revision` is the verified SHA-256 of original bytes, `scene_id` may be null for a known trim, bounds are integer milliseconds, and audio is `original` or `muted`. Attach the canonical original through the host, preserve the requested format and user locks, then obtain the usual script and ingredient approvals. Research links and competitor ads never grant production rights.

Before consumption and publication, the host rechecks current ownership, product/project scope, permission and revision. Download the verified original, trim that exact window at normal speed, and preserve the chosen audio. The portable assembler accepts `source_excerpt` beside a clip's path/duration, validates its SHA and range and returns the lineage. It refuses a separate voice track that would replace approved original audio. Only newly generated or replaced ingredients may consume the approved generation budget.
