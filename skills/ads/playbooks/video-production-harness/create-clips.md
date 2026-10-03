---
name: video-production-harness/create-clips
description: Generate every scene clip per the implementation brief — orchestrates Higgsfield image+video, FFmpeg, PIL, and ElevenLabs — and saves actual clip assets/evidence for review. Step 4 of the pipeline.
---

# create-clips

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

Execute the implementation brief end-to-end at the **clip level**: produce one MP4 per scene plus per-scene voiceover MP3s, and register the actual clips on the host review surface so the operator can review the actual generated assets in the same layout as the storyboard.

Does NOT do final stitching, music, SFX, or burned-in captions — that's `edit-video`.

Uses these production responsibilities when the actual route is available. The labels are descriptive; discover an installed supported skill or use the concrete local/host tools in `capabilities.md`. They are not undeclared required executables:
- `create-motion-graphics-hyperframes` — **canonical B-roll renderer.** HTML + Web Animations + Playwright timeline-scrub. Lock the style pack first (check the host format catalog); each pack encodes palette + type + motion vocab + grain so all B-roll cards in a project read as a family. Choose a supported style pack from the current brand brief; no private style pack is assumed available.
- `create-end-card-pil` — lightweight 5-second native-9:16 end card from a logo + tagline + reference-image gradient sampling. No Node, no Playwright. Use when the end card is a static composition with one scale-in. Use `create-end-card-hyperframes` instead when the end card needs motion-graphic chrome.
- `create-voiceover-elevenlabs` — when a VO must be generated (synthetic narrator path)
- `split-audio-by-words` — when VO is sourced from a long-form clip (podcast-clip path). Snaps per-scene cuts to word boundaries so no scene ends mid-word.
- `create-lipsync-veed-fal` — per-scene lipsync against a locked character anchor when the project uses 3D/illustration characters. **Run lipsync per scene in parallel** — wall-clock for a 7-scene clip drops from 1hr (sequential) to ~10min (parallel).
- `stitch-videos-ffmpeg` (only if a scene needs intra-scene concat)
- `mux-broll-with-voice` — pair silent B-roll videos with their voice audio for clean concat-copy in the next stage
- Actual host-managed image/video generation and job polling (`the host image-generation operation`, `the host video-generation operation`, `the host job-status operation`)

**B-roll copy rule** (locked in from the example brand v3→v4 LEARNINGS): the text on every B-roll card must mirror the audio playing under it. Cute synonyms ("HOOPS" for "basketball", "GAME ON" for "when the game starts") create cognitive dissonance and reduce comprehension. Pull the literal key phrases from locked_script and use them verbatim where possible.

## Inputs

- `<video_folder>/design_brief` (visual spec)
- `<video_folder>/implementation_brief` (operator checklist; required)
- `<video_folder>/locked_script` (canonical VO; required — must exist from State 2.5)
- `<video_folder>/generated/character-lock/character_locks` (required IF the ad has a human character; produced by State 3.5)
- `the host-approved voice catalog` (approved ElevenLabs voices)
- a host-supported, approved voice-generation capability

## Prompt-constraint redundancy (META-pattern)

When a generation must enforce a **hard project-level rule** — not a soft preference but a locked invariant the operator can't accept being violated — repeat the constraint **three different ways in different positions of the prompt**. Single-occurrence constraints get ~50% compliance across Veo, Seedance, and Nano Banana. Triple-positioned constraints get ~95%.

The three positions are:
1. **Positive framing rule** near the top of the prompt (sets the camera/scene up-front)
2. **Negation** in the middle of the prompt (explicit "do not show X")
3. **Crop / scope rule** at the end (boundary condition)

This is a META-pattern about constraint compliance — it works regardless of *what* the constraint is. Examples of constraints that benefit from triple-positioning:

| Constraint | (1) Positive framing | (2) Negation | (3) Crop / scope |
|---|---|---|---|
| no face | "Camera stays at knee level" | "NO face or head visible" | "Camera never tilts up past the chest line" |
| no logo | "Frame the product front-on, no packaging" | "NO brand names, NO product text" | "Crop excludes any printed labels" |
| color lock | "Subject wears a single deep-red garment (#B81F26)" | "NO orange, NO pink, NO maroon" | "All other garments in frame are neutral gray" |
| single subject | "One person in the frame, alone in the scene" | "NO other people, NO bystanders, NO crowd" | "Background is a deserted street" |
| time of day | "Late afternoon golden-hour, sun low and warm" | "NOT daytime overhead light, NOT night" | "Long warm shadows across the frame" |

If the constraint is *soft* (a preference, a hint, something the operator would accept being broken occasionally), one positioning is fine. Save triple-positioning for the load-bearing rules. See available model behavior guidance for the underlying model behavior this addresses.

## Hard rules (memorized from v03 LEARNINGS — break these and the cascade returns)

- **Never ask an image model to render specific brand or UI text.** Nano Banana garbles "EXAMPLE" → "EXAMPEL"; specific Slack-style UI strings come out as gibberish. All branded text is added in post via PIL or FFmpeg overlay.
- **Kling 3.0 minimum duration is 3 seconds.** Pre-trim to your target in post (1–2s scenes).
- **Image references and video start images use different schemas.** Resolve each receiving model's actual field names and accepted asset representation through the binding. Higgsfield role examples apply only to a verified direct Higgsfield route; managed FAL uses its own discovered schema.
- **`.avif` references are rejected by the Anthropic API.** State 0 preflight should have caught this; double-check at Phase 0.
- **Local file paths sometimes can't pass directly to the actual model's reference-value field.** Fallback: upload via the host's actual upload/confirmation operations first, then use the returned media ID.
- **Dark / heavy-vignette keyframes silently fail in Veo Lite.** Generate on neutral background; apply vignette/color in post via FFmpeg.
- **ElevenLabs concurrent limit is ~3 on team plans.** Gate VO gen at 3 in parallel; verify each MP3 is > 5 KB (small files = error JSON).
- **Fallback to FAL on detected Higgsfield failure.** A Higgsfield call counts as failed (and triggers the fallback router) when ANY of:
  1. The real submit operation raises an exception (network, auth, server error).
  2. `the host job-status operation` returns `status: "failed"` after polling.
  3. The real status/result operation returns success but the output URL 404s on download.
  4. Downloaded file is < 1 KB (error JSON) for images or < 10 KB for videos.
  5. Higgsfield returns explicit credit-limit / insufficient_credits error.
  6. Job exceeds 10-min timeout (configurable; veo3/seedance can take longer — extend to 15 min for those).

  When any of these fire AND `<provider_override>` is `auto` (default): reconcile the known job and resolve a supported, approved-budget fallback through the host. Rate-limit (429) is NOT failure — back off and retry the same provider.

## Workflow

### Phase 0 — Pre-flight
1. Read implementation_brief and `locked_script`.
2. Re-run `video-production-harness/preflight-audit` (new assets may have landed since State 0).
3. Create folder layout per the brief: `clips/`, `audio/`, `generated/style-tests/`, `generated/keyframes/`, `raw-materials/`.
4. Copy hero assets (e.g. `hero-photo.jpg`) into `raw-materials/`.
5. **If `character_locks` exists** (ad has a human character): skip the cartoon style-anchor step. The anchor portrait already serves that role. Read `character_locks` and resolve `method` (`anchor-ref` or `soul-id`) — this drives the actual model's reference inputs payload for every scene with the character.
6. **If `world_locks` exists** (UGC family — produced by State 3.55): read `set_refs[]`, `wardrobe`, `lighting`, `color_grade`, `recurring_props`, `time_of_day`. Every character scene keyframe MUST pass BOTH the locked anchor (identity) AND the most-relevant `world-N.png` (set + lighting + grade) as actual image references in supported schema fields, and BOTH refs MUST appear in the saved scene reference list. The verbatim `wardrobe` + `lighting` + `color_grade` + `time_of_day` strings get baked into every prompt. Missing `world_locks` on a UGC project is a P0 — hard-fail and surface "State 3.55 (world lock) was not run; without it scenes will drift across aesthetic universes."
7. **If `character_locks` is absent** (cartoon-only / product-only ad): generate **one style-anchor image** through an actually supported approved image model (Nano Banana 2 is a preference when available). Save to `generated/style-tests/style-anchor.png`. **Style lock gate** — inspect; if the style is wrong, iterate before committing video credits.

### Phase 1 — Keyframes
1. For each scene:
   - **Scenes with the locked character** — generate the keyframe with the locked anchor (or soul_id) as a confirmed reference in that model's actual supported image-reference field. Prompt template threads the verbatim `<character_descriptors>` block from `design_brief` plus the scene-specific action.
   - **Scenes without the character** — use the cartoon style anchor as a style ref (mapped to the actual supported image-reference field), or no ref for non-cartoon scenes.
2. Use the approved aspect ratio (normally 9:16) and supported resolution. Prefer Nano Banana 2 for cartoon and GPT Image 2 for photorealistic work when the binding actually supports those models; resolve real model IDs and request schemas before submitting.
3. **Never put brand or UI text in the prompt.** "Phone screen shows Slack" → render a neutral screen; the Slack UI is composited in post. "Box labeled Example Brand" → render an unlabeled box; the wordmark goes on in post via PIL.
4. **Provider routing.** Default path is `the host image-generation operation` for each keyframe (run in parallel — Higgsfield supports concurrent jobs). On detected failure per the 6 failure-detection rules in "Hard rules", invoke the fallback router:
Resolve this operation through the selected host binding and the real implementation in `capabilities.md`. Preserve its approved inputs, provenance and cost; stop if the capability is unavailable.

   If `<provider_override>=fal`, skip the Higgsfield call and invoke the host managed FAL operation. If `<provider_override>=higgsfield`, no fallback — fail loud.
5. Poll the real returned request through the binding's status/result operations. In a verified direct Higgsfield route this may be job_status; managed FAL uses its documented submit/status/result contract. Save the confirmed image to `generated/keyframes/scene-NN.png`.
6. Spot-check 2–3 keyframes via the Read tool before animating. For character scenes, also run a quick consistency diff against the anchor (one-frame compare) — if drift is > 15% on a scene, re-roll the keyframe BEFORE burning the video credit.
7. **Inherit gateway for downstream calls in the same scene.** Read the keyframe's `<output>.meta.json` to determine `gateway`. The animation in Phase 2 should use the same provider for that scene to avoid cross-provider drift, unless the operator explicitly overrides.

### Phase 2 — Animate clips
1. **Provider routing.** Use the host's supported video-generation operation and current approved scene plan. Veo 3.1 Lite is a preference when available; alternatives such as Veo, Kling, Seedance or Grok require real catalog model IDs, schemas and priced units. Resolve the approved ratio/duration and starting-image input from the actual confirmed keyframe/result, never an assumed job ID. Use a tight motion-only prompt. On detected failure per the 6 failure-detection rules, invoke the fallback router:
Resolve this operation through the selected host binding and the real implementation in `capabilities.md`. Preserve its approved inputs, provenance and cost; stop if the capability is unavailable.

   If the requested family has no supported equivalent in the binding, record `fallback_unavailable` and surface the limitation; do not invent an alternative catalog entry.
2. Poll the actual returned request through the selected binding's documented status/result operations, then save the confirmed output to `clips/scene-NN.mp4`.
3. **Failure recovery:** the first 6-criterion detection triggers fallback to FAL. If FAL also fails on the same scene, that's a hard surface to the operator — the prompt is likely the issue, not the gateway. Don't silently retry; investigate the prompt or the keyframe (dark/vignette plates often fail in Veo regardless of provider).
4. **Concurrency note:** ElevenLabs limits to ~3 concurrent requests on team plans — gate audio gen accordingly. Higgsfield is more permissive; FAL has per-account RPS limits — also keep concurrent FAL jobs at 2-3.

### Phase 3 — Static / non-AI scenes
- **Hero hold (felt mascot push-in):** FFmpeg zoompan over the hero photo for the scene's duration.
- **End card:** approved deterministic Pillow/FFmpeg composition (background + photo + headline + URL) → FFmpeg loop to MP4. Motion chrome requires an actual installed browser renderer and its dependencies.

### Phase 4 — Voiceover

1. Read exact locked_script/locked_lyrics and the host-selected audition for every speaker role. Never select a new voice or regenerate a valid selected per-beat audition silently.
2. Reuse its actual audio files and preserve voice ID, settings, beat IDs and script revision. If full-production rendering is necessary, use those exact settings/text through the managed voice capability under the approved budget.
3. Source audio is split at actual word boundaries using the transcript; inspect cuts for partial phonemes. Native generated dialogue stays on its clip; never double it with a separate narration track.
4. Check valid decoded audio, duration and exact line agreement. A small/error response is a failure. Concurrency follows the actual provider contract; known 429/concurrency failures back off rather than duplicate jobs.
5. If music is generated, follow the actual provider schema and approved music/lyrics plan. Unsupported artist-name or composition parameters must be resolved before spending.

### Phase 5 — Register reviewable clips

Register every scene clip, voice file, keyframe, model/settings/input fingerprint, job ID and named pass/fail checks in the binding. Update the host's actual clip review surface. Each scene must have visual-artifact, brand, product, voice/script and duration/ratio evidence before assembly. Failed candidates remain visible; do not assemble them as passing.

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
- If `character_locks` exists, every character-scene keyframe used the locked anchor or soul_id.
- Style anchor (cartoon ads) OR character anchor (human ads) was reviewed before animation.
- No brand/UI text in any image prompt; branded text is all PIL/FFmpeg overlay.
- Failures are classified, reconciled and repaired only when useful within approval/budget; ambiguous timeouts never force a duplicate paid retry.
- All clips match the approved ratio/duration and decode successfully. All required audio decodes and matches the locked lines; a size heuristic alone cannot prove validity.
- The host clip review surface plays actual clips and matching audio without inventing a review UI.
- Preserve the approved storyboard and its revision.
- Every generated artifact has a `<output>.meta.json` recording its `gateway` (`higgsfield` or `fal`) and model. Any fallback fires are logged in `<video_folder>/.fallback-events.jsonl` with operation, primary model, FAL model, reason, and outcome.

## Failure Modes

- Skipping Phase 0 style-lock / character-lock and burning credits on bad style.
- Ignoring `character_locks` — generates new "from scratch" character keyframes that drift, defeating State 3.5.
- Asking Nano Banana to render specific brand text — produces EXAMPEL-class typos. Always overlay branded text in post.
- Generating videos in parallel that all reference the same source plate, causing identical motion.
- VO returns 593-byte error JSON because of concurrency limit, and operator misses it.
- Dark/vignette keyframes silently fail in Veo Lite (regenerate on neutral background, vignette in post).
- Voice picked outside `the host-approved voice catalog`.
- VO rendered from `design_brief` instead of locked_script — silently re-introduces an unlocked script. Hard fail if they diverge.
- **Both Higgsfield AND FAL failing on the same scene** — the prompt or keyframe is likely the issue, not the gateway. Don't loop the fallback. Surface to the operator with both error contexts; investigate the prompt before any further attempt.
- **Mid-pipeline provider swap on a character** — if scene 3's keyframe came from Higgsfield and scene 4's came from FAL, character drift will show. Always inherit `gateway` from the anchor's `.meta.json` for character-scene calls; only swap providers if the operator explicitly chooses.
