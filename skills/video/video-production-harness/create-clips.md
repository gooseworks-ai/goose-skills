---
name: video-production-harness/create-clips
description: Generate every scene clip per the implementation brief — orchestrates fal image and video, FFmpeg, PIL and ElevenLabs — and saves actual clip assets/evidence for review. Step 4 of the pipeline.
---

# Human version

Make only the missing approved scene material, using the exact brief, assets, script and performance choices. Check specialist inputs and returned media before assembly, preserve valid work on resume, and listen to real speech rather than inferring its quality.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md).

## Purpose

Make one MP4 per scene, plus voice files where the audio plan needs them, and register the real clips on the host review surface. Stitching, music, SFX and captions belong to `edit-video`. A custom video is assembled only there, with `scripts/assemble.py` and an `assembly_timeline`. Never join clips with any other stitcher. A scene that needs several pieces gets several timeline segments.

**Routing.** Make every scene on its row in [the shot-routing guide](references/shot-routing.md) and the genre card it names. Resolve the row's real model id, schema and priced unit through the binding. A shot with no row is an open decision, not a free model choice. Kling 2.5 Turbo is withdrawn and never routed. Nano Banana is for cartoon style anchors and cartoon keyframes only; real people and real products use the `image-gpt-image-2` edit route.

**Tools by shot** (an installed supported skill, or the concrete tools in `capabilities.md`):
- Kinetic type: `create-kinetic-typography`. Designed stills and cards: `goose-graphics`, one style per project.
- End card: its routing row. The timeline holds it as a declared end-card freeze (at most 3.0 s, at the end).
- Synthetic narrator (agent-built path): `create-vo-elevenlabs` (superseded; kept for this path).
- Long-form source voice: cut at transcript word boundaries with `ffmpeg -ss <start> -to <end>`.
- Lip-sync onto a still: `create-video-fal` with `veed/fabric-1.0`, only on shots marked `speaking_on_camera`, once per final line. Review one take, then the rest in parallel.

**B-roll copy rule.** Card text mirrors the audio under it, in literal phrases from `locked_script` ("HOOPS" for "basketball" hurts comprehension). Keep owner-approved wording. No copy over an already readable product or UI layer.

## Specialist handoff and reuse

Read [specialist handoffs](references/specialist-handoff.md). Fetch the selected package and dependencies; record its version, input revisions and expected outputs in the capability plan; run its free probes or dry run before any paid call. A package that returns PNGs is not proof of video capability.

Load existing jobs and approved media first. Match input fingerprints and probe bytes before trusting a "file exists" skip. Reuse valid takes, auditions, footage windows and keyframes; regenerate only changed or missing work. Every output maps to its scene and source version, with measured duration and provenance.

## Inputs

- The writer's sourced creative brief revision, the approved product or variant and the locked copy
- `<video_folder>/design_brief` and `<video_folder>/implementation_brief`
- `<video_folder>/locked_script` (required; the only voice source, from State 2.5)
- `<video_folder>/generated/character-lock/character_locks` (required when a person recurs; from State 3.5)
- The host-approved voice catalog and an approved voice-generation capability

## Prompt constraints

Bind the real identity, product and scale references. State each load-bearing constraint three times: positive framing at the top ("Camera stays at knee level"), a negation in the middle ("NO face visible"), a crop rule at the end ("Camera never tilts above the chest"). Soft preferences need one. Repetition guarantees nothing; inspect every output. Use the approved look; phone footage uses the **light and realism block** ([libraries, look and rubric](references/libraries-look-and-rubric.md)), B-roll included.

## Hard rules

- **Scene keyframes: no typed brand or UI text.** Actual static-ad outputs follow [specialist handoffs](references/specialist-handoff.md). "Unlabeled" is for non-brand objects only (neutral screens, props); add their text in post. The advertised product keeps its real label: a pack held or used on screen is made on the edit route with the real product photo as reference image 1, front label facing the camera, and each use state from a real brand photo ([product scale and world](references/product-scale-and-world.md)). Never ask for a blank, unprinted, unlabelled or back-facing pack; one on screen is `must_fix`.
- **Resolve each model's real reference and start-image fields** through the binding. Upload local files through the host first and use the returned media id. `.avif` references are rejected.
- **Dark or vignetted keyframes fail in Veo.** Use a neutral background; grade in post.
- **fal is the default gateway.** A generation counts as failed, and triggers the fallback router, when: the submit raises; the job status is `failed`; the output URL 404s; a download under 1 KB (image) or 10 KB (video); a credit-limit error; or the job passes 10 minutes (15 for Veo and Seedance).

  On a failure, reconcile the known job and resolve a supported fallback row from shot routing inside the approved budget. If none exists, record `fallback_unavailable` and surface it. A 429 is not a failure: back off and retry the same provider.

## Workflow

### Phase 0 — Preflight
1. Read the creative brief, `implementation_brief`, `locked_script`, scene ids, asset selections and performance intent. Validate the handoff, dependencies and existing jobs.
2. Re-run [preflight-audit.md](preflight-audit.md); new assets may have landed.
3. Create `clips/`, `audio/`, `generated/style-tests/`, `generated/keyframes/` and `raw-materials/`; copy hero assets into `raw-materials/`.
4. **If `character_locks` exists**, skip the style anchor: the locked anchor fills that role. Read its `method` (`anchor-ref`); it drives the reference inputs for every scene with the person.
5. For continuing worlds, people and products, send the selected world, product and scale references (plus exact wardrobe, light, props and time of day) and save the attached manifest. A missing critical reference leaves the scene unresolved before spend.
6. **If `character_locks` is absent**, reuse approved product footage, stills or style references. Only when a planned cartoon route needs a missing style anchor, make one with Nano Banana (cartoons only) and save `generated/style-tests/style-anchor.png`. Inspect it; fix the style before any video credits.

### Route dispatch

Run only the route the capability plan assigns each scene. If a route or its inputs are ambiguous, save the blocker before making assets.

| Approved route | Run | Skip |
| --- | --- | --- |
| Owned product or demo footage | Footage survey, approved source windows and the cut; then Phase 5 | Style anchor, keyframes, generative animation |
| Native-speaking creator | The creator package's approved native-take procedure; review the first take before the rest; then Phase 5 | Still-to-video replacement; separate TTS over native dialogue |
| Deterministic graphic or still motion | Local composition, FFmpeg or an installed browser renderer; then Phase 5 | Generative image or video unless separately approved |
| Generic image-to-video | Phase 1 for missing keyframes, Phase 2 for missing animation, then Phase 5 | Regenerating any valid selected keyframe or clip |

A person or product in a scene does not by itself authorize a new anchor.

### Phase 1 — Keyframes

Only for scenes routed to image-to-video or an approved generated still. Reuse valid keyframes.
1. **Scenes with the locked person:** send the locked anchor as a confirmed reference in the model's real image-reference field. The prompt carries the verbatim `<character_descriptors>` from `design_brief` plus the scene action.
2. **Scenes without the person:** cartoon scenes use the style anchor as a style reference; photoreal product scenes send the real product photo as reference image 1 on the edit route (a held pack: front label to camera) and describe the action and set, not the product.
3. Use the approved aspect ratio (normally 9:16) and the scene's routing row. Submit through the host's image-generation operation (keyframes may run in parallel), poll the returned request and save `generated/keyframes/scene-NN.png`. On a failure, use the fallback router above.
4. Inspect every keyframe at full resolution before animating: exact variant and geometry, sourced scale, contact, crop, text space and continuity ([product scale and world](references/product-scale-and-world.md)). Compare people to accepted anchors without invented drift percentages. A keyframe with a `must_fix` is made again before animation ([quality tier](references/quality-tier.md)).
5. **Keep the gateway.** Read the keyframe's `<output>.meta.json`; animate that scene on the same provider unless the operator overrides.

### Phase 2 — Animate clips

Only for missing or invalid generative animation the plan assigns.
1. Submit through the host's video-generation operation on the scene's routing row, at its routing line's resolution (switching re-rolls the take). Take ratio, duration and start image from the confirmed keyframe. Use a short motion-only prompt.
2. Poll the returned request and save `clips/scene-NN.mp4`.
3. **Clip check, graded.** Upload and confirm each clip, then send `video_change` custom `clip_check` `{scene, url}` with its `output_url`. About a minute later read `video_read` `clip_checks` (pending is not passed; unchecked means look yourself). Grade each finding by [check severity](references/check-severity.md), not by `suggest_kill` alone. **must_fix:** redo that clip; price it first, make it from the approved total when it fits, otherwise after a yes to its price ([quality tier](references/quality-tier.md) has the call). **Never drop the scene:** if a redo still has a `must_fix`, keep the best take, flagged, and let the customer choose another paid redo or keep it. **ask:** keep it and offer the redo price (in `review_mode: auto`, decide). **fine:** keep it. A refused redo: read its fix. Record each check and severity in the manifest. Without host clip checks, do the manual duties in [creative contract and review](references/creative-contract-and-review.md).
4. **Failures.** Reconcile jobs first. If the fallback also fails on the same scene, the prompt or keyframe is the likely cause: surface both errors to the operator. Never loop retries.
5. **Concurrency.** About 3 ElevenLabs requests at once; 2-3 concurrent fal jobs.

### Phase 3 — Static scenes
- **End card:** the end-card row, or a Pillow or FFmpeg composition (background, photo, headline, URL).
- **Still motion:** FFmpeg zoompan over an approved still for the scene's planned length.

### Phase 4 — Voice

Only for narration, audio-driver, song or source-speech routes. No-speech scenes keep their planned soundtrack; native scenes keep their checked clip audio. Follow [speech and route qualification](references/speech-and-route-qualification.md). Exact supplied audio uses `exact_audio_lipsync`; qualified native speech follows [talking-actor production](references/talking-actor.md), retaining its own sound.

1. Read the exact `locked_script` or `locked_lyrics` and each speaker's selected audition. Never pick a new voice or silently regenerate a valid audition.
2. Reuse the audition audio, voice id and settings; a full render uses those exact settings and text, inside budget, on `eleven_v4`.
3. **Measure the pace before anything uses the voice.** Run `scripts/reference_rate.py <each line's provider timestamps JSON> --against <reference words JSON>`. Exit 1 means more than 10% slower than the reference: follow its `fix`. Regenerate on `eleven_v4` (tighter words if needed), or apply that tempo, at most 1.25× (kit path: pass `pace.target_wps`, the reference's rate; agent-built: `create-vo-elevenlabs --target-wps`), and divide the timestamps by it. Do it before lip-sync and picture timing, never on the edit; then measure and listen again.
4. Split source audio at real word boundaries and check cuts for partial sounds. Native dialogue stays on its clip; never double it with narration.
5. Listen to every isolated line at normal speed (pronunciation, rhythm, stress, pauses, endings), and again in the full mix. When you cannot listen, record the review as `measured`, not `listened`, and use transcript and word timings as the evidence. Check that audio decodes, its duration and that the words match the line. A tiny or error response fails. Back off on 429s instead of duplicating jobs.
6. Music uses `music-elevenlabs@1.1.0` with `music_v2_5` requested explicitly, per the approved music plan. Resolve unsupported artist-name or composition fields before spending.

### Phase 5 — Register reviewable clips

Review each clip against its handoff: revision, line, assets, full action and proof, product geometry and scale, duration, face and voice sync, continuity. **Count the hands (`must_fix`):** no more hands than the people in frame have, no hand without a body, no phone held by an unseen hand ([review-video](review-video.md)). Use the host's clip check and your own full-resolution frames, never your own vision-model calls. A provider URL is not a pass. Register every source and job with its graded findings; every candidate stays visible.

## Output

- `<video_folder>/clips/scene-{01..NN}.mp4`
- `<video_folder>/audio/vo-scene-{01..NN}.mp3`
- `<video_folder>/audio/voice-choice.md`
- `<video_folder>/generated/keyframes/scene-{01..NN}.png`
- `<video_folder>/generated/style-tests/style-anchor.png` (cartoon ads only)
- `<video_folder>/clip_review`

## Quality checks

- Every planned scene has a checked clip in the brief's audio mode; native dialogue is never doubled.
- Every voice file decodes and matches `locked_script` (hard fail if `design_brief` differs).
- Person keyframes used the locked anchor; the style or person anchor was reviewed before animation.
- Use scene overlays or the static-ad workflow.
- Every generated clip has a clip check; an open `must_fix` reaches the final only when the customer keeps it; no scene is dropped.
- Clips match the approved ratio and duration and decode.
- An ambiguous timeout never forces a duplicate paid retry.
- Every generated artifact has a `<output>.meta.json` with `gateway` and model; fallbacks go in `<video_folder>/.fallback-events.jsonl` (operation, primary model, fallback model, reason, outcome).

## Failure modes

- Spending before the style or person lock.
- Several clips from one source plate with identical motion.
- A 593-byte error JSON accepted as voice audio.
- Switching provider mid-character: inherit `gateway` from the anchor's `.meta.json`.

## Use stored original footage

Follow the stored-footage contract in `capabilities.md`: inspect real frames plus the timed transcript, freeze each selection, and trim the verified original at normal speed with its chosen audio through `source_excerpt`. Only new or replaced ingredients use the generation budget.
