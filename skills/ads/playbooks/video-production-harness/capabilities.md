# Human version

The same production steps run in every host. A host connects saved project state, human review and paid media access to this playbook. Local scripts assemble real clips and collect evidence; an agent still reviews that evidence and the whole video.

---

# Agent version

## Binding and authority

Follow [creative contract and review](references/creative-contract-and-review.md) for content duties, review coverage, clip eligibility and exact-file evidence.

The host binding is the entry skill that loaded this package (for GooseWorks: make-custom-video); load it first. `load`, `save`, `approve`, `submit`, `poll`, `upload` and `promote` are responsibilities, not tool names: resolve them to real host tools. If none implements a required one, save a blocker and stop.

The host owns approvals, ownership, revisions, fingerprints, credit and reservations; a local file, quote or agent-written approval is never authority. Recheck approval and spend before every paid call, including retries and repairs. Polling a known job never authorizes a new submission; an ambiguous timeout keeps the job until reconciled.

Concept, design and script decisions go in the script approval; storyboard and the selected character, world, voice and end-card assets go in the ingredient approval. Previews and voice auditions need the approved preview budget; paid video clips need the ingredient approval. A change invalidates the approvals that depend on it; new scope, provider or spend needs renewed approval.

## Two production paths

Every scene is made on one of two paths. "Agent-built path" and "kit path" in any file mean exactly this:

- **Agent-built path (every other video).** You make each scene by calling catalog skills through the host: `create-image-fal`, `create-video-fal`, `create-vo-elevenlabs`, `create-music-elevenlabs`, `create-kinetic-typography`, `goose-graphics` and `caption-burn`. The cut is assembled only with `scripts/assemble.py`. Pick each scene's model from the **fal model id** column of [the shot-routing guide](references/shot-routing.md).
- **Kit path.** Take it when every scene's routing row maps to a part in the nearest template's timeline or another published part (the guide's **Kit part@version** column), and the video needs no new frames, fonts or prompt files. `create-design-brief.md` step 4 makes the choice; `create-storyboard.md` writes the `kit` block into the ingredients draft. Once the owner approves the ingredients, the host's video kit makes, checks and finishes every scene (check-layer 1.8.0 gets `expect.reference_words` and `expect.final_words` for the speech-rate check, `expect.reference_setups` (the reference's `measured_setups` from `scripts/reference_shots.py study`) and `expect.approved_callbacks` (for each shot-plan row with `callback_of`, the earlier segment id its intent names)): run the make command from `video_make`'s `next_step` and skip the clip, edit, polish and delivery states. Never edit a template's frames, fonts or prompt files, and never run a template's unchanged style and call it custom.

Backticked kebab-case skill names in these files, such as `create-image-fal`, are catalog skills: fetch each with `catalog_fetch` (type skill) when a step needs it. Option and mode values, kit part ids and file names are not skills.

## Artifact roles

The binding maps these roles to storage. Local `clips/`, `audio/`, `edits/` and `generated/` files are temporary; the run is unfinished while any file the final build reads exists only on this computer.

| Role | Meaning |
| --- | --- |
| brand_context, brand_assets | Evidence, asset catalog, constraints. |
| concepts, idea_brief | Concepts, selected idea, audience, hook. |
| design_brief, implementation_brief | Scene/tool/audio plan, rules, decision log. |
| script_drafts, locked_script, locked_lyrics | Timed exact copy and approved revision. |
| storyboard, scene_contract | Scene IDs, seconds, framing, text, references. |
| character_locks, world_locks, voice_auditions | Candidates, selections, provenance. |
| asset_manifest, generation_jobs, spend | Assets, jobs, fingerprints, models, charges. |
| transitions, timeline, audio_plan, motion_overlays | Approved edit and mix plan. |
| project_state, approvals, feedback, review_passes | Resume state, blockers, human feedback. |
| review_mode | The customer's choice: `ask` (default) or `auto` ("just make it"), with their words. Set through the host when it stores it ([check severity](references/check-severity.md)). |
| review_issues, quality_reports | Findings with severity (`must_fix`, `ask`, `fine`), the price to fix, status (open, fixed, kept), checks, evidence, repairs. |
| render_outputs, versions | Candidate/final media and lineage. |
| reproduction_recipe, learnings, improvement_proposals | Run evidence and proposals, never automatic skill edits. |

The same sourced creative brief goes to the writer and to production: the writer's preparation accepts `--brief`, and new custom or template shapes set `requires_creative_brief: true`.

Read [specialist handoffs](references/specialist-handoff.md) before choosing and running a route; save package/version/hash, dependency checks, approved inputs and returned outputs in the capability plan. For hook work use [hook compatibility](references/hook-compatibility.md).

Use stable scene IDs and numeric seconds. Load saved state every turn and register assets and jobs as they arrive.

## Implemented local capabilities

| Capability | Real implementation and limits |
| --- | --- |
| probe and assemble source-linked media | Python 3, FFmpeg and FFprobe; `scripts/assemble.py PLAN.json OUTPUT.mp4`. A custom video's plan carries `assembly_timeline` (`gooseworks-assembly-timeline/1`); read [speech and route qualification](references/speech-and-route-qualification.md) and [recipe format](references/recipe-format.md). The checker keeps speaking picture and audio on one clock and refuses gaps, unplanned silence, uneven stretch, zoom over 1.5×, long pauses and freezes (3.0 s only for an end card hold). Without a timeline it refuses unless the plan says `"production_kind": "template"`. |
| measure speaking rate | `python3 scripts/reference_rate.py WORDS.json [...] [--target-s S] [--against REFERENCE_WORDS.json]`: words per second from whisper.cpp, ElevenLabs alignment or `{words}` JSON; `script_words` for a target; exit 1 when the voice is more than 10% slower than the reference. |
| collect complete-video evidence and final measurements | `python3 scripts/qc_evidence.py VIDEO.mp4 EVIDENCE_DIR [--timeline RECEIPT] [--words WORDS] [--script SCRIPT] [--reference REFERENCE.mp4] [--reference-words REFERENCE_WORDS.json] [--reference-shots SHOT_TABLE.json] [--plan SHOT_PLAN.json]`. It probes streams, extracts 2 fps frames and a PCM audio track, and writes `final_measure` (`gooseworks-final-measure/1`, implemented in `scripts/final_measure.py`, whose THRESHOLDS list every check and limit): silence, tone-only sound, speech gaps, planned pauses and freezes, frozen picture, repeated shots, distinct setups more than 30% under the reference (`setup_count_vs_reference`), first/last words, silence over a speaking face and speech more than 15% slower than the reference. Silence and still picture are allowed in the first 1.5 s and the last 3.0 s. Each failed check is a finding with its severity (`findings`, from `SEVERITY` in `scripts/final_measure_parts.py`). **It exits 1 only for a broken file** (`broken`): it can't be played, its length is more than 1 s off the timeline's `duration_ms`, or it has no sound when sound is planned. Always pass `--timeline` for a final: without it the length is not checked and sound is treated as planned. Fix `must_fix` findings, settle `ask` ones by [check severity](references/check-severity.md), keep `fine` ones. Then listen to and watch the whole cut against the storyboard when your tools can; otherwise record `measured`. Measurements are evidence, not creative verdicts. |
| final file check | On complete, GooseWorks checks the final: a playable H.264/AAC MP4, the approved ratio and length (over 0.5 s off is a warning), the same final measurements, a frame check of the whole video, and spoken words matching the script at 0.90 or better. Only a broken file is refused; everything else comes back as findings with a severity. Mark the video complete and read that check; never send the final or its frames to a vision model yourself. Act on each finding by [check severity](references/check-severity.md); if it is still checking, wait a minute and read it again. |
| pack and prove the rebuild | `scripts/pack_recipe.py` writes `recipe/source.json` (never uploads); `scripts/check_recipe.py` rebuilds it from host-fetched files and prints `identical` (SHA-256), `matches` (PSNR ≥ 40 dB average, worst frame 30 dB, length within 0.05 s, audio difference ≤ -60 dB) or `failed`. Commands and fields: `references/recipe-format.md`. |
| inspect a claimed defect | `ffmpeg -ss SECONDS -i VIDEO.mp4 -frames:v 1 FRAME.png`, plus neighbours. No timestamped evidence, no blocking finding. |
| image/text/logo composition | The real asset with FFmpeg overlay/drawtext or Pillow; brand and UI text stay deterministic. |
| captions last | Fetch `caption-burn` (superseded; agent-built path; the kit path uses captions-layer): it renders approved word cues with Pillow and FFmpeg overlay, no libass needed (check `ffmpeg -filters` before using ASS). Captions go after picture and mix polish; then rebuild the final evidence. |
| motion without paid video | FFmpeg zoompan/setpts/scale/crop and declared transitions; editorial illustration uses this path. `scripts/assemble.py` does not render HTML or JavaScript. |

Preflight runs the real binaries and a media probe; missing tooling blocks that route before spending. For sidechain, SFX buses or grading, follow `edit-video.md`.

## Host media and review capabilities

| Responsibility | Required concrete implementation |
| --- | --- |
| reference preparation | Study the host's durable reference picture and sound in full; record `listened`/`watched` only when you did, else `measured`, with covered ranges. |
| image/video generation | The host's model catalog and managed fal queue submit → status → result. Request fields come from real schemas; image refs and video start images have different roles. No private scripts or assumed MCP names. |
| voice auditions | The host's approved voice catalog and managed ElevenLabs `/v1/text-to-speech/{voice_id}` or an equivalent. Audition the locked beat text and keep the selected voice ID and settings. An on-screen person's voice ID is `character.voice_pair`, paired from the host's free ElevenLabs voice list (`GET /v1/voices`) and the shared library's searches for that person (`GET /v1/shared-voices`); without a list, the pairing blocks. When no listed voice fits, ElevenLabs Voice Design makes one from the character's descriptors (on GooseWorks through `data_post_provider`, priced and approved like any paid call). The person never changes to fit a voice. Native generated speech is reviewed with its clip. |
| transcription and word timing | A Whisper-compatible route returns timed words; diff them against the locked lines and pass them to `qc_evidence.py --words` (the reference's go to `--reference-words`). Without one, GooseWorks transcribes the final on complete. ASR alone cannot judge voice quality. |
| OCR, identity, world and readability | An image-capable reviewer applies the rubrics in lock-character, review-video and polish. Never invent a numeric similarity. |
| preview choices and delivery | The script and ingredient approvals hold media, selections and authorization. Store the owner's choice apart from exact-output content status; a final or preview label cannot waive missing quality evidence. |

Use [the editorial review guide](references/editorial-review.md) to bind decisions to exact versions and verify every delivered output. Named review checks are responsibilities done with these tools, not commands; every check runs.

Optional routes (lipsync, generated music, AI transitions, browser compositions, specialist molecules) need a real host capability, approval and price bound. If unavailable, save the limitation and offer a supported revised plan at the next approval. Never revive an unavailable renderer or skip a required phase.

## Use stored original footage

To reuse footage, search the host's owned media and inspect real frames plus the timed transcript; a thumbnail is not a review. Known user-selected trims stay usable without semantic analysis.

Freeze `{asset_id, analysis_revision, scene_id, start_ms, end_ms, audio_mode}` in each selected scene and ingredient: `analysis_revision` is the SHA-256 of the original bytes, `scene_id` may be null for a known trim, bounds are integer milliseconds, audio is `original` or `muted`. Attach the original through the host, keep the requested format and user locks, then take the usual two approvals. Research links and competitor ads never grant production rights.

Before use and publication the host rechecks ownership, scope, permission and revision. Trim the verified original at normal speed and keep the chosen audio. The assembler accepts `source_excerpt` beside a clip, validates its SHA and range, records it in the receipt's `source_excerpts`, and refuses a separate voice track over approved original audio. Only new or replaced ingredients use the generation budget.

## Controlled source and renderer releases

The custom route uses creator-h3 1.8.0, voice-elevenlabs 1.3.0 and html-frames 1.3.1 on a kit with source review, assembly-timeline and exact-final review support (minimum kit 1.0.1). Keep the locked versions; they add review and source-clock guards, not provider quality. An older renderer is no evidence that the new stitching rules ran.
