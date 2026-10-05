# Human version

The same production steps run in every host. A host connects saved project state, human review and paid media access to this playbook. Local scripts assemble actual clips and collect evidence; an agent still reviews that evidence and the complete video.

---

# Agent version

## Binding and authority

Load the selected host binding first. `load`, `save`, `approve`, `submit`, `poll`, `upload` and `promote` below describe responsibilities, not tool names. Resolve them to real host tools and their current schemas. Never call a fabricated capability name. If no binding implements a required responsibility, save a blocker and stop before that operation.

The host owns authenticated human approvals, project ownership, revisions, operation fingerprints, available credit and reservations. A local artifact, quote, script status or agent-authored approval is never authority. Recheck host approval and spend before every paid call, including retries, auditions, transitions and repairs. Polling an already-known job does not authorize a new submission. An ambiguous timeout retains the job and outstanding authorization until reconciled.

The host may combine review surfaces while preserving decisions. Concept, design and script decisions belong to the script gate; storyboard, selected character/world/voice/end-card assets belong to the ingredient gate. Preview images and voice auditions need the approved preview budget. Paid video clips, including preview and transition videos, need ingredient approval. If the host exposes additional gates, honor them. Script changes invalidate dependent approvals; ingredient changes invalidate their gate. New scope, provider or spend beyond the approved bound requires renewed human approval.

## Artifact roles

Common steps use logical artifact roles. Resolve them through the binding; the names are not mandatory paths or storage schemas. Local `clips/`, `audio/`, `edits/`, `generated/` and caption files are temporary processing artifacts until the host records them.

| Role | Meaning |
| --- | --- |
| brand_context, brand_assets | Current evidence, asset catalog and customer constraints. |
| concepts, idea_brief | Candidate concepts, selected idea, audience and hook hypothesis. |
| design_brief, implementation_brief | Scene/tool/audio plan, hard rules, unresolved decisions and decision log. |
| script_drafts, locked_script, locked_lyrics | Timed exact copy, review evidence, climax and approved revision. |
| storyboard, scene_contract | Ordered stable scene/beat IDs, numeric seconds, framing, text, planned references and pacing metrics. |
| character_locks, world_locks, voice_auditions | Actual reviewable candidates, selected assets/settings and provenance. |
| asset_manifest, generation_jobs, spend | Every successful asset and job, input fingerprint, provider/model/settings and actual charges. |
| transitions, timeline, audio_plan, motion_overlays | Approved transition/motion/edit/mix plan. |
| project_state, approvals, feedback, review_passes | Trusted resume state, active blockers/gates and preserved human feedback. |
| review_issues, quality_reports | Timestamped verified findings, named checks, evidence and repair outcomes. |
| render_outputs, versions | Real candidate/final media, immutable lineage and selected final. |
| reproduction_recipe, learnings, improvement_proposals | Run-specific evidence and proposed improvements; never automatic edits to shared skills. |

Carry the same sourced creative brief through writer and production: the writer's documented preparation accepts `--brief`, and new custom/template shapes set `requires_creative_brief: true`. Brief/source revisions, locked copy, selected/rejected decisions and delivery intent remain linked in existing artifacts.

Read [specialist handoffs](references/specialist-handoff.md) before route selection and execution. Save exact package/version/hash, dependency checks, approved scene/script/assets/performance inputs and returned output identities in the existing capability plan; do not invent host fields or treat package instructions as runtime tools. For hook work use [hook compatibility](references/hook-compatibility.md) and the existing fetched replacement package only when available.

Use stable scene/beat IDs and numeric seconds in the working plan. The binding translates to its wire schema. Preserve every field and cross-reference required by that schema. Load saved state at the start of every turn; register successful assets/jobs as they arrive. Local caches can be lost and are never the only copy needed to resume.

## Implemented local capabilities

| Capability | Real implementation and limits |
| --- | --- |
| probe media and assemble conventional clips | Python 3, FFmpeg and FFprobe; `scripts/assemble.py PLAN.json OUTPUT.mp4`. Plan: aspect_ratio, ordered clips[{path,duration_s}], optional width/height/fps/voice_path/music_path/captions_ass. The helper normalizes H.264/AAC output, validates stream duration and rejects short inputs. A complete separate voice track replaces native clip audio; never duplicate dialogue. It is a conventional concat/mix helper, not a browser renderer, transition planner or automatic approval. |
| collect complete-video evidence | `python3 scripts/qc_evidence.py VIDEO.mp4 EVIDENCE_DIR`. It probes streams, extracts 2 fps frames and a PCM audio track, and records loudness and silence diagnostics. Read frames across the entire cut, play continuous full-speed motion and listen to the full audio, then obtain actual speech transcript/timings. Missing playback/listening leaves required review incomplete. Metrics and extracted files are evidence, not creative verdicts. |
| inspect a specific claimed defect | `ffmpeg -ss SECONDS -i VIDEO.mp4 -frames:v 1 FRAME.png`; read that actual frame. Verify motion over neighboring frames. A claim without timestamped evidence cannot become a blocking visual finding or an invented pass. |
| image/text/logo composition | Real approved asset + FFmpeg overlay/drawtext, or Python Pillow when installed. Check fonts and Pillow before choosing that route. Keep readable brand/UI text deterministic. |
| captions last | Author approved SRT/ASS cues, inspect libass via `ffmpeg -filters`, then use the assembly helper's captions_ass or FFmpeg `ass` filter after picture/mix polish. Rebuild the actual final evidence and variants afterward. If a managed caption service is selected, resolve it through the host and obtain its estimate/approval. |
| motion without paid video generation | FFmpeg zoompan/setpts/scale/crop/concat and declared transition filters. Editorial illustration uses this path. A browser/Remotion composition requires the actual installed renderer and its dependencies; do not claim that assembly.py renders HTML or JavaScript. |

Preflight runs the actual binaries/imports and a real media probe, not only executable-presence checks; a present FFmpeg can fail at startup from missing libraries. Use the helper only when it implements the approved plan. For custom sidechain, SFX buses, transition interleaving, audio branches or grading, use the detailed FFmpeg instructions in `edit-video.md`; create a filter script and probe/review the result. Missing required tooling blocks that route before spending.

## Host media and review capabilities

| Responsibility | Required concrete implementation |
| --- | --- |
| reference preparation | The host resolves an authorized public page/file, downloads and probes actual media, records readiness/failure and returns durable media. Watch frames and transcribe/listen before recording reference analysis. Failed/private references need an explicit human brief-only choice. |
| image/video generation | Use the host's current model catalog and managed submit/status/result transport. Underlying services may expose fal queue submit → status → result or Higgsfield job submit → status → output. Provider-specific request fields must come from real schemas; image refs and video start images have different roles. No private scripts or assumed MCP names are dependencies. |
| voice auditions | The host exposes approved voice catalog and managed ElevenLabs `/v1/text-to-speech/{voice_id}` or an equivalent supported service. Generate the actual locked beat text and preserve selected voice ID/settings. Native generated speech is reviewed with its clip; do not promise a separately auditioned native voice. |
| transcription and word timing | A host-managed Whisper-compatible transcription route or an installed local transcription engine must return actual transcript and word timestamps. Diff against locked lines, inspect omissions/substitutions and word-boundary cuts. If unavailable, stop at the intelligibility gate; a text-only guess is not transcription evidence. |
| OCR/identity/world/readability review | Read extracted frames and approved reference images using an actual image-capable reviewer; apply the exact rubrics in lock-character/review-video/polish. OCR or quantitative face/vision tools are optional evidence when installed. Do not invent a numeric similarity from a nonexistent embedding tool. Save qualitative evidence and rubric scores distinctly from measurements. Face exposure/cut targets come from the brief and reference; scores and simulated viewers never prove real audience performance. |
| preview choices and final delivery | Host-owned review surfaces show actual images/audio/video. The binding persists selections, feedback, budgets and final versions. Completion/pinning requires an uploaded owned video and all shared QC, even if backend minimum checks are narrower. |

Use [the editorial review guide](references/editorial-review.md) to bind rough/fine/final decisions to exact versions and original notes, refresh affected evidence and verify every delivered output. Store editable scene/timeline/audio/caption sources and scoped history for fresh-context resume.

All named review checks in the detailed steps are review responsibilities performed with these concrete frame/audio tools and their published rubrics; they are not unshipped commands. Parallel reviewers are optional. One reviewer can run the same complete checks sequentially. Every required check still runs.

Optional routes—Soul ID training, lipsync, generated music, AI transitions, browser compositions and specialist molecules—require an actual host capability, compatible approval and price bound. If unavailable, save the limitation and offer a supported revised plan for human approval. Never revive an unavailable fixed recipe renderer or silently omit a required production phase.

## Use stored original footage

When the customer asks to reuse footage, ask the host to search the current owned media and inspect actual frames plus timed transcript. An analysis description or thumbnail URL alone is not a visual review. Known user-selected trims remain usable when optional semantic analysis is unavailable; record that limitation instead of requesting a duplicate upload.

Freeze `{asset_id, analysis_revision, scene_id, start_ms, end_ms, audio_mode}` in each selected scene and ingredient. `analysis_revision` is the verified SHA-256 of original bytes, `scene_id` may be null for a known trim, bounds are integer milliseconds, and audio is `original` or `muted`. Attach the canonical original through the host, preserve the requested format and user locks, then obtain the usual script and ingredient approvals. Research links and competitor ads never grant production rights.

Before consumption and publication, the host rechecks current ownership, product/project scope, permission and revision. Download the verified original, trim that exact window at normal speed, and preserve the chosen audio. The portable assembler accepts `source_excerpt` beside a clip's path/duration, validates its SHA and range and returns the lineage. It refuses a separate voice track that would replace approved original audio. Only newly generated or replaced ingredients may consume the approved generation budget.
