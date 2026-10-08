---
name: video-production-harness/orchestrator
description: Host-independent runner for the complete shared video production pipeline. Sequences preflight → brainstorm → design → script-lock → storyboard → character-lock → clips → review → edit-clip / edit-video → scroll-test → review → polish → deliver. Honors human gates, writes structured JSON project state, and produces a single ad folder ready to ship.
---

# Human version

Run one saved production sequence from sourced brief to checked output. Carry approved decisions into specialists, review the actual story and performance, preserve versions, and resume valid media without generating it again.

---

# Agent version

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

The single entry point for producing a video ad with this pipeline. Calls the other skills in order, manages human-gate pauses, handles review loops, and stops when the operator explicitly approves.

This skill does not implement creative or technical work itself — every meaningful action is delegated to the detailed sibling production step files. The orchestrator's only job is **sequencing, gating, looping, and keeping the host-owned saved project state current**.

## Saved production contract

`capabilities.md` defines the logical artifact roles. The selected binding maps those roles to the host's real storage and schemas. Load saved project state, active choices, outstanding jobs, approvals, feedback and spend before doing work. A local file's existence or modification time is not proof of a current approval or completed generation.

After every state:

1. Save the true current state, status, active candidate/version, blockers and latest activity.
2. Save the concept/script/scene plan before presenting the host's review surface.
3. Register every successful image, video, audio, caption and evidence artifact immediately with stable IDs and provenance.
4. Record provider submissions, returned job IDs, input fingerprints, response/output and actual charges. Retrieve outstanding jobs before considering any retry.
5. Save render outputs and immutable version lineage; do not overwrite the previous master.
6. Validate the selected binding's schemas and cross-references before a human gate, handoff and delivery.

Consume saved timestamped feedback and review passes on the exact watched version. Follow [the editorial review guide](references/editorial-review.md): changed is distinct from verified, source notes never move with final selection, and affected approvals/evidence are refreshed while valid unrelated decisions remain. Resolve comments only after their intended effect and the full output are verified; keep their history. The final write of every turn records current state and the remaining blocker/gate.

## When to use

- Producing a new ad from scratch (`<input> = <fresh concept paragraph>`)
- Resuming an in-flight ad (`<input> = <video_folder>`)
- Iterating after review notes (`<input> = <video_folder> + <review-notes/NN.md>`)
- **Producing a stylistic variant of a finished ad** (`<input> = <source_ad_folder> + <style_refs>`) — keeps VO/script/scene-table identical, swaps visual medium only. For skit ads, an actually supported specialist may supply the look/prompts inside this sequence; for any other variant, run the orchestrator directly with the entry-path skip rules in "Variant runs" below.

If the user just wants one specific step (e.g. "regenerate scene 5"), call that step's skill directly. Use this orchestrator only for full or near-full runs.

## Inputs

- `<input>` — either a concept paragraph (cold start) or a path to an existing `<video_folder>` (resume) or `<source_ad_folder>` (variant restyle)
- `<video_folder>` — temporary processing directory chosen by the host; durable state stays in the project.
- `<auto>` — permits ordinary execution inside already-approved scope only. It never bypasses a human gate or approved budget.
- `<provider_override>` (default `auto`) — `auto` | `higgsfield` | `fal`. Controls which gen provider is used for image/video calls. See "Provider fallback policy" below.
- `<variant_of>` (optional) — path to a source ad folder to restyle. When set, the orchestrator enters **variant mode** (see below) — most states are short-circuited because they're inherited from the source.
- `<style_refs>` (required iff `<variant_of>` is set) — list of reference images defining the new medium (felt, claymation, anime, etc.).

## State machine

The orchestrator advances from State 0 through State 11, including the conditional sub-states listed below. At each state, check the saved result, current input fingerprint and applicable approval. Reuse a valid result; an obsolete artifact never clears a gate. The table below is authoritative, including conditional sub-states.


| State | Detailed source | Saved result / decision |
| --- | --- | --- |
| 0, 0.1 | preflight-audit.md; brand bootstrap below | Tooling/media PASS; current brand context or explicit limitation. |
| 1 | brainstorm.md | Candidate concept and audience/hook decision. |
| 2 | create-design-brief.md | Visual/audio/tool plan and open decisions. |
| 2.5 | lock-script.md | Two-track script review, exact copy/climax and script gate. |
| 2.6 | Voice audition below; create-clips.md | Actual auditions and human-selected voice/settings. |
| 3 | create-storyboard.md | Timed scene plan, visual-variety/UGC metrics and ingredient gate. |
| 3.4 | Motion classifier below | Generative video, FFmpeg motion or installed browser composition. |
| 3.5, 3.55 | lock-character.md; world lock below | Approved anchors/world, consistency evidence and locked references. |
| 4.5 | Preview below | Optional approved-budget subset with a human decision before full generation. |
| 5, 5.8 | create-clips.md; transition layer below | Inspected clips and approved transition execution. |
| 6 | edit-clip.md | Targeted repairs, preserved priors and refreshed QC. |
| 7 | edit-video.md; promote.md | Labeled candidate, mix and version lineage; no unchecked final pin. |
| 7.5 | Scroll test below; review-video.md | First-stitch hook/viewer decision. |
| 8, 8.5 | review-video.md; auto-fix-from-review-notes.md | Full evidence-based review, bounded repairs and re-watch. |
| 9 | polish.md | Objective fixes, transcript/mix gate and before/after review. |
| 10 | Delivery below; promote.md | Captions last, actual final re-QC, variants and explicit delivery decision. |
| 11 | wrap-session.md | Recipe, retrospective, spend and reviewable improvement proposals. |



## Specialist format integration

This sequence remains the entry point when a customer names a format such as UGC, music video, podcast, explainer, motion graphics, product video or a style restyle. A specialist format supplies prompts, lookpacks and supported phase implementations; it never bypasses the shared gates, state, billing or review.

Read [specialist handoffs](references/specialist-handoff.md), resolve the sourced creative brief and exact scene/script/asset revisions, and save each route in the existing capability plan. Check the host's actual format capabilities first. No specialist is assumed installed. If available, delegate within the corresponding state and translate every output into the host's concept/script/scene/asset/job/version roles. If a required route is missing, stop that route before spending and present a concrete supported revised approach for approval; a local skill name alone is not execution readiness.

- UGC discipline applies from design through review; persist shotcraft and pacing metrics.
- Song/music formats preserve locked lyrics, audio strategy and beat timing; they still need script/ingredient gates and final intelligibility review.
- Source-podcast formats preserve word-boundary cuts and source transcript provenance.
- Motion graphics require an installed renderer; register outputs as manual/local assets.
- Every generated binary is registered as it lands, with its scene/character/world/voice association. Review uses the host's visible surfaces. Never run a legacy one-shot driver that loses saved state or review gates.

## Variant runs

When `<variant_of>` is set, the orchestrator runs in **variant mode**: the source ad's brainstorming, design brief, script lock, and storyboard are all inherited, so most early states short-circuit. The variant only re-does the visual layer.

| State | Cold-start | Variant run (`<variant_of>` set) |
|---|---|---|
| 0 · Preflight | Run | Run (validate `<source_ad_folder>` + `<style_refs>` exist) |
| 1 · Brainstorm | Run, **HUMAN GATE** | **Skip** — inherited from source |
| 2 · Design brief | Run | **Skip** — inherited |
| 2.5 · Script lock | Run, **HUMAN GATE** | **Reuse only when unchanged and host-verified** — inherit exact approved copy and selected owned voice audio |
| 3 · Storyboard | Run, **HUMAN GATE** | **Reuse the unchanged timing plan** — new visual ingredients still require current approval |
| 3.5 · Character lock | Run, **HUMAN GATE** | **Run in Mode B** (style-ref + source anchor) — see `lock-character.md` |
| 5 · Create clips | Run | Run (re-roll every distinct still from new anchor) |
| 6 · Edit clip loop | If review notes | If keyframe-consistency notes come back |
| 7 · Edit video | Run | Run (stitch + end card from source) |
| 7.5 · Scroll test | Run, gate | Run on the new first stitch — a restyle can change hook readability and perceived motion |
| 8 · Review | Run, gate | Run again on all newly rendered pixels/audio; never inherit visual QC. |
| 9 · Polish | Run | Run (whisper-test mix is style-agnostic) |
| 10 · Deliver | Run, **HUMAN GATE** | Run, **HUMAN GATE** |

Inherited unchanged copy can retain its script approval only when the host verifies the exact content and ownership. New anchors/ingredients, generation scope and spend require current approval. Re-rendered media always gets full review, polish/caption checks and a delivery decision.

For podcast-style skit ads, use an actual available specialist through the binding while preserving this entire sequence and its gates.

## Workflow

### State 0 — Pre-flight audit
1. Reuse a <24h PASS audit only when tooling, host authentication and every input fingerprint remain current.
2. Otherwise call `preflight-audit.md`.
3. **Hard fail on any P0 finding.** Resolve broken media, unsupported formats, missing authentication/capabilities and unresolved brief variables before generation. No local override bypasses a required gate.
4. P1 warnings are logged in state file but don't block.

### State 0.1 — Brand bootstrap

1. Load brand_context and brand_assets through the host, not an assumed directory layout. Confirm identity, product/offer, audience, claims/evidence, visual identity and existing creative grammar.
2. If context is missing, show one combined choice: research now using an actual available research capability; accept supplied facts/assets; explicitly continue with the stated limitations; or defer. Do not invent missing claims or silently treat an empty template as research.
3. Research that costs credits also needs an estimate and host authorization. Preserve sources, actual media and dates. Store the human's decision so a resumed run does not ask again without a changed input.
4. Reload current brand context at design, storyboard, world-lock and end-card stages. Select real assets by labeled provenance rather than filename guessing.
5. When a reference was requested, wait for the host's actual prepared media. Inspect frames across it and listen/transcribe its audio before recording reference_analysis: hook, scene order, shot/pacing grammar, voice, music, captions and CTA. Preserve creative mechanisms while replacing brand/product/claims with current evidence. A failed/private reference needs a real human brief-only choice; never invent an analysis or reuse the reference as the produced final.

### State 1 — Brainstorm
1. **Variant mode:** skip entirely. Write a short `<video_folder>/idea_brief` noting "Variant of `<source>` — see `<source>/idea_brief` for the originating concept" and the `<style_notes>`. Advance to State 2.
2. If `<video_folder>/idea_brief` exists AND `concepts` exists with at least one concept conforming to the schema in `brainstorm.md`, skip to State 2.
3. Otherwise call `brainstorm.md` with the user's concept. The skill writes BOTH `idea_brief` AND `concepts`. After it returns, verify the saved concepts exist, parse and satisfy every required field in the selected binding's actual schema. Save the full concept prose plus current title, format, hook, logline, evidence and risks on the human review surface. A working markdown mirror alone does not satisfy host review registration.
4. **HUMAN GATE:** show the concept through the host review surface and save the pending gate. Wait for the host to record an authentic human decision on this exact concept and script scope. Capture any line-level edits; re-read each concept's `markdown` first, since the operator may have edited it in the tab.
5. **Concept-fit audit.** Before approving the gate, explicitly answer: *who is this selling, to whom?* If the answer isn't "[brand] to [their actual customer]," flag for re-framing here, not later. A prior review caught "Therapy is rat park" at this stage — that tagline would have sold therapy *to clients*, not the reference cut to therapists. Cheap to pivot now; expensive after rendering. If unclear, ask the user via the host human-decision surface.

### State 2 — Design brief
1. **Variant mode:** skip entirely. The source's `design_brief` is inherited; you can copy it into `<video_folder>/` for traceability but don't re-derive it.
2. If both `design_brief` and `implementation_brief` exist, skip to State 2.5.
3. Call `create-design-brief.md`. The brief must include `audio_strategy:` (one of `vo-narrator | song-as-script | hybrid | silent`), `climax_line:` (set in State 2.5) and `assets_manifest:` (consumed by State 0 re-audit).
4. Once `audio_strategy` is set, downstream states branch off it: `lock-script` chooses VO vs lyrics output, `edit-video` chooses mix protocol, the storyboard player chooses VO vs song embed. Validate the field before advancing.
5. No gate by default — design-brief is mechanical from idea-brief. If `<auto>` is false and significant creative decisions surfaced (e.g. style choice, voice options), pause for the user to weigh in on the open-decisions section.

### State 2.5 — Script lock
1. **Variant mode:** reuse exact source script and selected audio only when the current host-approved revisions/fingerprints remain valid. Run [hook compatibility](references/hook-compatibility.md) for the proposed visual/action/audio change; a new promise returns to script/body/coverage planning instead of inheriting approval.
2. Reuse the locked_script only if its content/revision still matches the host-approved script. Continue to voice audition before storyboard when applicable.
3. Before writing, carry the sourced creative brief into the actual write-video-ad-script preparation command with `--brief working/script/creative-brief.json`; use its documented fields and set `shape.requires_creative_brief: true` for new custom/template work. The writer/critic receive the same angle-context; missing brief fails strict review. Preserve source/rejection/locked-copy evidence. Then call `lock-script.md` with `<concept_type>` inferred from idea-brief (default `transformation` if idea-brief mentions before/after, comeback, journey, ramp-up).
4. **HUMAN GATE.** The arc review runs on text only — cheap. The gate exists because every script change AFTER this state forces VO re-renders. Capture the climax-line mark and any line-level edits.
5. After approval, `locked_script` is the single source of truth — all downstream skills read VO text from this file, NOT from `design_brief`.

### State 2.6 — Voice/performance selection

1. Read approved audio strategy and delivery intent. Silent work needs no voice audition; song/native dialogue uses its selected route's actual performance review rather than an invented narrator ID. A restyle reuses the exact approved performance when copy/settings/timing are unchanged.
2. If the voice or delivery is unresolved, select representative uncertain material: pronunciation, conversational transition, intentional pause/emphasis and longest constrained line. Prepare only the alternatives that answer that uncertainty; do not regenerate every beat for every candidate by default. Paid auditions require the existing preview budget.
3. Register playable auditions, exact covered lines/beat IDs, voice/settings, script revision and provenance. Listen to the actual isolated audio; text, waveform, duration and transcript alone cannot establish performance quality. Surface the existing human selection gate with remaining uncertainty; never present an unplayed audition as chosen.
4. Reuse approved audition/performance audio where it covers the production line. Render only missing/changed lines with selected settings after the appropriate gate. Native first-take video still needs ingredient approval; listen before chaining later takes. Do not force a faster read or louder climax.
5. Recheck actual isolated performance for every speech scene and the full mixed output in States 5/8/10, including native or real recorded speech. On resume, restore selected IDs/files; missing selection blocks only the route that needs it.

### State 3 — Storyboard
1. **Variant mode:** reuse unchanged numeric timing and scene IDs, then inspect the new visuals' recognition/reading time, proof, continuity and crop. New ingredients still need their current gate; inherited timing is not evidence that a new treatment lands.
2. Reuse a saved storyboard only when it matches the current approved script and scene plan.
3. Call `create-storyboard.md`. Storyboard reads VO from `locked_script` so caption bubbles match the locked script.
4. **HUMAN GATE:** show the saved storyboard on the host review surface and confirm pacing/visual direction before final clip credits. Any generated preview still needs the script-approved preview budget. This is the cheapest place to catch a wrong concept.
5. **Coverage and pace.** Use the brief/reference-derived targets and actual picture cuts/direct-face time from `create-storyboard.md`. Every beat needs a viewer purpose and enough action/reading/proof time. A long hold or low cut count is a diagnosis prompt, not a universal failure; do not add arbitrary cuts to meet a quota.

### State 3.4 — Motion strategy classifier
1. **Reads** `design_brief` `visual_style:` field (and the storyboard's aesthetic notes if explicit).
2. **Decides** `motion_strategy` and writes it into `project_state`:
   - `generative_video` — photoreal, real performance, products-in-use, cinematic. Routes State 5 to Seedance/Veo3/Kling per `provider_override`.
   - `ffmpeg_motion` — editorial illustration, 2D, halftone, paper-and-ink, New Yorker / Niemann / Steinberg / spot-illustration. Routes State 5 to FFmpeg zoompan over each approved still + hard-cut concat. **Seedance/Veo3/Kling MUST NOT be called for these aesthetics** — they hallucinate photoreal middle states. Specifically: Seedance produced a photoreal human hand mid-clip on a "pen draws on" prompt, and added cartoon-cloud middle states on a rats-decline crossfade. Cost in a prior review: ~$1.62 burned before retiring the path.
   - `hybrid_remotion` — kinetic typography, motion graphics, data viz, infographics. Routes State 5 to Remotion comps (existing `motion-graphics` molecules).
3. **No human gate required** if `visual_style` is unambiguous. If the brief is ambiguous (e.g. lists multiple styles), surface a choice via `the host human-decision surface`.
4. **Downstream effect:** State 5 (create-clips) and State 5.8 (transition layer) both read `motion_strategy`. `ffmpeg_motion` skips the entire generative-video pipeline and uses FFmpeg zoompan over each approved still for per-still motion + hard-cut concat (NO crossfades — they expose AI-generated keyframe drift; LEARNINGS L2).
5. **Hint:** editorial-illustration trigger terms above determine this route even if no optional model-notes document is installed. If any apply to the design-brief or prompts, record `ffmpeg_motion`.

### State 3.5 — Character lock
1. If ad has no recurring human character (cartoon-only, product-only), continue to State 3.55 when applicable, then the preview gate and State 5.
2. If `<video_folder>/generated/character-lock/character_locks` exists, continue to State 3.55 when applicable, then the preview gate and State 5.
3. **Variant mode:** call `lock-character.md` in **Mode B** — pass `<style_refs>` AND the source anchor portrait paths (as the actual supported image-reference fields). The new anchor inherits the source's wardrobe/set/framing but renders in the new medium. See `lock-character.md` for the Mode B flow.
4. Otherwise (cold-start, Mode A) call `lock-character.md` with `<character_descriptors>` from `design_brief`.
5. **HUMAN GATE on anchor portrait.** The anchor is the single approval that locks every subsequent keyframe. Drift > 15% escalates to Soul ID training; surface the recommendation, let operator choose.
6. After lock, `character_locks` is the contract `create-clips` reads for per-scene the actual model's reference inputs refs.
7. **Chained-ref discipline.** `character_locks` MUST also include a `chain_strategy` field: `"anchor-only"` (every downstream call passes only the anchor as ref) or `"all-locked-frames-as-refs"` (every downstream call passes the anchor AND every previously-approved locked keyframe). The latter is mandatory for series where consistency across N frames matters (e.g. 4-panel decline arcs, ping-pong loops, before/after parallels). Resolve the actual reference-image fields from the supported model schema. Pass the approved anchor and all applicable previously approved locked frames, then record their IDs/input fingerprint. A prior review lost ~6 iteration cycles to cage geometry drift before this discipline was applied.

### State 3.55 — World lock (UGC family)

1. Run for ugc-diary, testimonial, founder-led and before-after unless the approved plan explicitly needs multiple locations. Preserve that exception in the decision log.
2. Read the required world_lock set, wardrobe, lighting, color_grade, recurring_props and time_of_day. Missing constraints block this phase; character identity alone cannot hold the world consistent.
3. Generate three actual empty-set references per world through the approved preview image capability: establishing wide, character-reference corner and prop area. Use the set description verbatim and exclude people from the set references.
4. Register each candidate image, stable world ID/index and provenance. Save selection pending, then STOP for the human choice on the ingredient surface.
5. On resume, load the selected world and current ingredient decision from the host. Save all approved set references and exact wardrobe/lighting/grade/prop/time strings. Replaced worlds invalidate the ingredient approval.
6. Every subsequent character keyframe threads both the selected identity anchor and matching world references. Bake the descriptors verbatim into the prompt and record those references in the scene plan. Preserve approved provider inheritance.

### State 4.5 — Preview gate (opt-in, recommended for multi-scene AI ads)
1. **When to use.** If the project will generate ≥ 6 AI scene clips OR ≥ 4 AI transition clips, run a preview gate before committing to the full burn. Multi-scene AI pipelines have category-of-problem risks (transition style not landing, framing rule misinterpreted, color drift across generations) that the storyboard can't visualize. A 3-4 scene preview catches these for ~$2 instead of burning $8-12 on a misfire.
2. **Skip when.** Short projects (≤ 3 scenes), variant restyles inheriting an approved style, or projects where every scene is hyperframe/ffmpeg (no AI gens).
3. **Subset selection.** Pick scenes that exercise the highest-risk dimensions:
   - At least one scene with the main character / framing rule
   - At least one transition pair (if transitions exists)
   - At least one scene that's stylistically different from the others (e.g. a climax beat that uses a different grade)
   - Typically scenes 01 + 02 + 03 + 04 for a 9-scene urban ad; pick differently if your scene table has more stylistic variance later
4. **Generate at lite tier.** Choose a supported lower-cost model from the host catalog when it can test the approved risk. Paid preview clips/transitions still require ingredient approval and an explicit reservation. The preview is for style validation, not final quality.
5. **Stitch + preview.** Use `edit-video` in preview mode to assemble the subset with placeholder music (first N seconds of the locked song). Output: `edits/preview-NN-scenes.mp4`.
6. **HUMAN GATE.** Show the operator the preview. Approval criteria:
   - Transitions land as intended (camera motion / morph / hard cut as designed)
   - Framing rule is respected (no face if locked, knee-down if locked, etc.)
   - Wardrobe / character consistency holds across cuts
   - Color grade is in the right direction (will harmonize in State 7's final pass)
   - Music/visual sync feels right at the climax beat (if the subset spans it)
7. **Iterate cheaply.** If the preview reveals a category-level issue (e.g. transitions don't read as camera motion, wardrobe morphs are too literal), re-prompt and re-roll within the preview's small scope. Only proceed to State 5 full burn once the preview is approved.
8. **Cost discipline.** A failed preview cost ~$2; a failed full burn costs $8-12. Aim for 1 preview iteration max before full burn.

### State 5 — Create clips
1. Reuse clips only when all scene IDs, exact inputs, approvals, job results and passing clip evidence match the current plan.
2. Re-run `preflight-audit` as a sub-step (new assets may have landed since State 0).
3. Verify the selected specialist package/input handoff and free dependency preflight, then call `create-clips.md`. It reads `character_locks` if it exists and threads the locked anchor/soul_id into every keyframe.
4. Phase 0 of create-clips remains for style-anchor on cartoon scenes; for human characters it's a no-op (the lock-character anchor already covers it).

### State 5.8 — Transition layer (opt-in)
1. **Opt-in detection.** If `<video_folder>/transition_pairs.json` does NOT exist, skip this state entirely. State 7 (edit-video) will hard-cut all scene boundaries as before. This preserves backwards compatibility with existing projects.
2. **Read the plan.** transitions was emitted by the approved transition plan during State 3 (storyboard) — that's where the operator approved each transition mode + cost estimate. This state is execution only, no new design decisions.
3. **Process each pair:**
   1. For pairs with `mode == "ai_interpolation"` and `pivot_keyframe.needed == true`: call the supported managed transition-keyframe operation. Output: PNG under `generated/keyframes/transition-<from>-<to>-<slug>.png`. character_locks gets a `transition_keyframes.{slug}` entry.
   2. For pairs with `mode == "ai_interpolation"`: call the supported managed transition-video operation. Output: MP4 under `clips/transition-<from>-<to>.mp4` (or split into `…-push-in.mp4` + `…-pull-out.mp4` for split-clip pairs). character_locks gets a `transition_clips.{key}` entry.
   3. For pairs with `mode == "in_edit_*"`: no-op here — State 7 edit-video applies the FFmpeg filter at stitch time.
   4. For pairs with `mode == "hard_cut"`: no-op everywhere; default behavior.
4. **Content-policy rejection fallback** may use a supported alternative transition model, with its actual starting-image field. It must still obey the underlying provider policy; do not bypass a prohibited-content decision. Resolve the alternative through the actual host catalog and approved budget; log it. Provider/anchor changes require approval.
5. **State file update:** set `transition_layer_status: complete` (or `skipped` if no transitions). Record per-pair `provider_events` for fallbacks.
6. **No human gate.** The plan was approved at State 3; this is mechanical execution. If a clip looks wrong, the operator catches it at the State 7.5 scroll-test or State 8 review and loops back via `edit-clip`.

Quote each actual transition operation from current host pricing before approving it; do not reuse another run's cost as authorization.

### State 6 — Edit clip (loop)
1. Look at the latest review-notes file (if any) for P0/P1 issues mapped to scenes.
2. For each scene that needs a re-roll, call `edit-clip.md` with the prescribed `edit_type`.
3. Run sequential, not parallel — each edit-clip touches state and may invalidate the next.
4. If no review notes exist yet, **skip to State 7** (first edit pass uses the raw clips).

### State 7 — Edit video

1. Read `edit-video.md` and assemble a labeled candidate from current passing clips. Use the packaged assembly helper only when it implements the plan; otherwise use the documented real FFmpeg filters.
2. For narration/hybrid, reuse human-selected performance settings/assets and mix according to the approved sound plan with measured cue gains/ducking only where needed. Song-as-script and silent take their explicit audio branches. Missing selected voice blocks narration; it does not block a genuinely silent plan.
3. Preserve intended emphasis/timing, intentional grade and SFX restrictions and revisions such as music-level/cue changes. Measure actual output instead of treating gain constants as proof.
4. Read `promote.md` to register the candidate, asset and immutable version lineage through the binding. Preserve earlier versions. The candidate is visible for review; successful completion/pinning waits for all current gates and final QC.
5. Validate the binding's actual render/asset/version relationships and save the true state. The binding supplies the review/pick transaction; never simulate it with a local master copy.

### State 7.5 — Opening and compatibility review

1. Run on the first stitch and every changed opening, including visual-only restyles and revised image/action/audio/text. It may share the same saved review as State 8, but cannot be skipped because the old script passed.
2. Follow [hook compatibility](references/hook-compatibility.md): save baseline promise/proof/payoff and classify same-promise isolated opening versus changed-promise recut before any new media spend. Fetch and preflight the existing hook renderer if that route is requested; an unavailable package blocks it before calls.
3. Review the actual opening muted and with sound at normal speed, then its connection to the full body/ending. Save the received message before consulting intended direction where possible. Hook-strength and simulated-viewer scores are diagnostic hypotheses, not measured performance or automatic ship thresholds.
4. Route unsupported promise to concept/script, missing proof to production, sequence problems to edit and local defects to repair. Prepare authorized cheap alternatives before unresolved taste escalation. Preserve exact source and compare complete labeled candidates; never auto-select the highest score.
5. Advance only when the applicable questions and evidence are complete; missing playback/listening remains INCOMPLETE. Keep the existing bounded repair/spend limits.

### State 8 — Review (full parallel suite)
1. Call `review-video.md` against the explicitly selected candidate ID/checksum, with rough or fine stage recorded. First save actual received message, then compare with the sourced brief. The stage questions can share the existing review surface; no additional approval meeting is required. Run every applicable documented review responsibility; parallel execution is optional:
   - **Phase 7a (deterministic, parallel):** the packaged technical-evidence tool + `review-video-hallucination-check` + `review-video-character-consistency` + `check-audio-visual-alignment` (validates payoff lines land on payoff visuals via Whisper word-timestamps + beat table — catches the "dead rats arrived 2s early" class of bug from LEARNINGS L3). **For `concept_format: ugc-diary | testimonial | founder-led | before-after`, also dispatch:** `review-video-identity-drift` (cross-cut identity check — catches "different person in scene 7" from a prior review v3 diagnostic) AND `review-video-world-consistency` (set + wardrobe + lighting drift across cuts — catches "bathroom → kitchen → living room" failure). Findings on both are persisted into `review_issues`.
   - **Phase 7b (creative, parallel; user toggles which):** `review-video-concept-landing` + `review-video-pacing-rhythm` + `review-video-for-brand-fit` + `review-video-for-platform-fit` (hook-strength + synthetic-persona already ran in State 7.5). **For UGC concept formats, also dispatch:** `review-video-ugc-shotcraft` (actual cuts, time-based face exposure and temporal review against approved intent). The speech-performance responsibility applies to **all spoken formats**, including `real_voice`: listen to isolated takes and the actual mix, joins and ending for pronunciation, timing, delivery and defects. Use the fetched voice-performance reviewer when available or the documented listening rubric with real media tools; the responsibility name is not an assumed installed command.
   - **Phase 7c (aggregate):** merge all reports into a single `review-notes/<idx>-<timestamp>.md` with P0/P1/P2 sections in the contract that `auto-fix-from-review-notes` consumes.
   - **Phase 7d (claim verification):** for every visual claim in 7a/7b output, re-extract the frame at the claimed timecode and verify. Reports unverified claims as `claim:unverified`. Don't trust sub-agent visual assertions without frame-extraction proof.
   - **Phase 7e — Complete-cut watch and audio.** Mandatory before APPROVED. Run `python3 scripts/qc_evidence.py master.mp4 evidence-review-N`, read the full frame evidence, play the complete cut continuously at normal speed and listen to all actual audio. Obtain transcript/word evidence for speech; missing review capability leaves INCOMPLETE, never a pass. Single-frame spot-checks (Phase 7d) miss timing drift, redundant beats, caption-visual collisions, and visual-variety problems. Use this on every iteration to catch cross-frame inconsistency, narrative regression, end-card/caption overlap and wasted hook time.
2. Branch on the review status:
   - **APPROVED** → a rough-cut decision advances to fine-cut questions on the same review surface; after fine-cut execution and evidence pass, continue to State 9. It never clears the later exact-export final gate.
   - **NEEDS REVISION** → follow the diagnosis: State 1/2.5 for concept/script, State 3/5 for missing coverage/performance, State 7 for sequence or State 6/local repair for defects. Use `auto-fix-from-review-notes.md` only for authorized deterministic local repairs. Rewatch the new candidate against original acceptance conditions.
   - **INCOMPLETE** → save available evidence and the missing review/tool/source capability; do not advance, spend on speculative fixes or call the output approved.
3. **Loop guard:** maximum 3 review iterations. If still NEEDS REVISION after 3 passes, escalate to the user.

### State 9 — Polish
1. Call `polish.md` in `polish-and-fix` mode.
2. It will:
   - Read the implementation-brief / brand-vars / captions / word-timestamps
   - Run the packaged technical-evidence tool, `score-readability`, and `whisper-test-mix` pre-flight
   - Watch the master and propose polish-notes across 9 axes (loudness, captions overflow/timing, music/VO balance, end-card, tail, hook, color, brand fit, **vo-intelligibility**)
   - Apply every P0/P1 via `auto-fix-from-review-notes`
   - Produce `edits/master-polished.mp4` + `polish-notes/<idx>-<ts>-applied.md`
3. **Speech integrity and listening are ship gates.** Investigate transcript mismatches against actual audio and pronunciation intent; a recognizer error is not a heard defect, and transcription success is not performance/mix approval. Silent work uses visible reading-time checks.
4. **HUMAN GATE:** show before/after deltas and original note outcomes. On approval, register the exact polished candidate through `promote.md`; retain source/selection history and continue to State 10 final export review.
5. If polish proposes only P2 items (cosmetic), the operator can skip-fix; the master proceeds to delivery unchanged.

### State 10 — Deliver

1. Burn approved captions on the polished picture/mix as the final visual post-production step. Choose the real host caption capability (caption-burn uses Pillow and FFmpeg overlay without libass), or the packaged local ASS path with verified libass/font support. Missing libass blocks only the ASS route; fetch the available caption specialist before declaring captions unavailable. The style comes from the current brand brief; no private house preset or stale price table is assumed.
2. Check caption spelling, word timing, safe areas, suppressed cues on text-heavy scenes, and end-card/offer/logo collisions. Reposition or omit the overlapping approved cue explicitly.
3. Extract each cue start+0.3s and transition frame, then watch the whole actual captioned cut with audio/transcript comparison. Probe final duration, dimensions, streams and codec. All shared QC and current clip coverage must pass.
4. Build each required ratio/cutdown/language from editable sources, adapt its own caption layout/timing and burn once. Run separate final review at destination size on each actual output/checksum, including full ending, proof/CTA and complete playback/listening. Parent-master QC does not clear a derivative. Register real owned uploads and immutable evidence through the binding.
5. Show the playable captioned master and variants for the explicit host delivery decision. Read `promote.md` for successful final completion/selection; backend minimum checks never replace this suite.
6. Publishing to external channels needs explicit authorization through an available publishing capability. Saving a project final does not authorize ad-account posting.

### State 11 — Wrap session
1. Keep the existing production manifest/editable sources and decision history current at every checkpoint, not only delivery. Preserve selected/rejected choices, exact notes, scoped preferences and measured results separately. After DELIVER is approved, call `wrap-session.md`. Runs three sub-steps with a gate on each:
   - **A · reproduction_recipe** — process-focused recipe that a future agent can use to recreate this *kind* of video for a slightly different concept or brand. Reads `project_state`, `implementation_brief`, `design_brief`, `storyboard`, cost tracker, audio artifacts, and the folder layout.
   - **B · learnings** — failure-driven retrospective. One entry per iteration cycle that changed the master, plus tool/API quirks. TL;DR (exactly 3 lessons) up top.
   - **C · `improvement_proposals`** — concrete diffs to atoms / molecules / orchestrator skills based on LEARNINGS. Read-only against `shared skills` — never auto-edits.
2. Skip when `<status>=abandoned` would normally apply (failed runs still produce LEARNINGS + skill-update-proposals, but no HOW_TO).
3. The skill-update proposals are the seed for an out-of-band manual skill-tree edit. Operator picks which to apply.
4. After approval, this state is complete — the orchestrator does not advance further.

## Output

- A populated host project and temporary processing directory, with registered actual media, review evidence and provenance.
- An updated decision log in `implementation_brief` (the orchestrator should write its own decisions into the `## Decision log` section as it proceeds).
- A status file `<video_folder>/project_state`:

```json
{
  "current_state": "REVIEW",
  "completed_states": ["PREFLIGHT", "BRAINSTORM", "DESIGN_BRIEF", "SCRIPT_LOCK", "STORYBOARD", "CHARACTER_LOCK", "CREATE_CLIPS", "TRANSITION_LAYER", "EDIT_VIDEO", "SCROLL_TEST"],
  "review_iterations": 1,
  "last_human_gate": "STORYBOARD",
  "blockers": [],
  "preflight_status": "PASS",
  "character_lock_method": "anchor-ref",
  "transition_layer_status": "complete",
  "provider_override": "auto",
  "provider_events": [
    {"state": "CREATE_CLIPS", "scene": "07", "primary": "higgsfield", "primary_model": "veo3_1_lite", "fallback_used": true, "fal_model": "fal-ai/veo3/fast/image-to-video", "reason": "job_status=failed: dark plate rejected", "ts": "..."},
    {"state": "TRANSITION_LAYER", "pair": "scene_03b->scene_03c", "primary": "higgsfield", "primary_model": "seedance_1_5", "fallback_used": true, "fallback_model": "kling2_6", "reason": "nsfw false-positive on red-glow city ref", "ts": "..."}
  ]
}
```

`transition_layer_status` values: `skipped` (no transition_pairs.json), `pending` (State 5.8 not yet run), `in_progress`, `complete`.

## Cost tracking and gate previews

Every paid operation must be recorded and reserved by the host with project, state, provider/model, quantity, price bound, job ID, input fingerprint, actual charge and output provenance. The orchestrator then renders a one-line `cost_preview` BEFORE every human gate:

> **cost_preview:** spent **$21.45** so far (`elevenlabs $0.20`, `higgsfield $21.25`). Approving this gate triggers an estimated **+$8.50** for CAPTION_SYNC + EDIT_VIDEO.

Use the host's actual pricing/credit schema and current supported model catalog; old reference rate tables cannot authorize spend. Operators want to know the running cost before approving; this is a near-free way to surface it.

## Model behavior reference

When writing or reviewing prompts in any state, consult actual model capability/schema documentation supplied by the host. It documents cross-cutting gotchas about how Veo, Seedance, and Nano Banana actually behave (back-loaded interpolation, vocabulary-driven rendering modes, multi-clip color drift, constraint-redundancy compliance rates, etc.). These are descriptions, not creative rules — knowing them helps you prompt for whatever look you want.

## Decision-making policies

- **Cost discipline.** Never re-generate something that already exists and is marked APPROVED in a review note. Always check for existing artifacts before calling a skill.
- **Skill selection.** When edit-clip is needed, use the explicit `edit_type` from the review note rather than guessing. If the review just says "scene 5 looks weird," push back and ask for specifics before re-rolling.
- **Voice picks.** Always pull from `the host-approved voice catalog`. If the design-brief calls for a voice not on the list, surface that as a blocker before State 5.
- **Style locks.** Once `lock-character` produces `character_locks`, treat that as the lock for all subsequent regenerations in this video. Any re-roll must thread the anchor/soul_id.
- **Script locks.** Once `locked_script` exists, downstream skills read VO from it. Any change to VO text invalidates `locked_script` and forces re-running State 2.5 — no silent edits.
- **Pre-flight is non-negotiable.** P0 audit failures block the pipeline. A revised supported plan may remove a blocked dependency only through current human approval; broken inputs and required capabilities cannot be bypassed by a local flag.
- **Review loop bounds.** 3 iterations max before escalating. Don't quietly burn credits chasing tiny issues.
- **Human gates are real.** Never auto-advance past BRAINSTORM, SCRIPT-LOCK, STORYBOARD, CHARACTER-ANCHOR, POLISH, or DELIVER gates without explicit user OK, even if `<auto>` is true.
- **Trust but verify on visual claims.** Phase 7d frame-extraction verification is mandatory before APPROVED can be set. Sub-agents have a track record of false-positive visual reports.
- **Brand text rendering.** Never let an AI image model render readable brand text (wordmark, tagline, URL, CTA copy). Compose text-bearing layers via PIL / ffmpeg `drawtext` / After Effects. AI text rendering is unreliable even for short well-known strings — a prior review got "therapits" instead of "therapists" from Nano Banana on the first end-card attempt. Image gen for *visual* elements (background, mascot, illustration); deterministic compositing for *text* elements.
- **Brand asset library first.** Before generating any brand-anchored visual (logo, wordmark, end card, mascot), look up the canonical asset through brand_assets. Don't ask Nano Banana to "draw the example brand wordmark" — the real one already exists in the host brand asset library. Generating fake brand assets is forbidden when a real one is on disk.
- **Editorial illustration → ffmpeg motion only.** If `motion_strategy: ffmpeg_motion` is set by State 3.4, Seedance/Veo3/Kling MUST NOT be invoked. The orchestrator refuses paid generative-video calls on the `ffmpeg_motion` route. A `hybrid_remotion` plan may use only its explicitly approved generative segments; it never overrides the editorial-illustration ban. These models hallucinate photoreal middle states that break editorial-illustration aesthetics.
- **No crossfades between AI-generated stills.** Use hard cuts. Crossfades expose geometric drift across independently-generated keyframes (different bar counts, dropper positions, cage shapes). Hard cuts read as "next panel"; crossfades read as "the cage is morphing weirdly."
- **Provider fallback.** The selected binding declares available primary/fallback providers. A fallback is never assumed available or free. Logic:
  - `<provider_override>=auto` (default): try the host's supported selected provider first; on detected failure (see `create-clips.md` failure-detection rules), resolve a supported fallback through the host after reconciling the failed job and approval/budget.
  - `<provider_override>=higgsfield`: Higgsfield only; no fallback (fail loud).
  - `<provider_override>=fal`: skip Higgsfield, go straight to FAL through the binding's managed submit/poll transport.
  - Grok video may lack a supported host fallback; a missing mapping surfaces `fallback_unavailable` and the operator decides whether to retry, reroute, or skip the scene.
  - Soul ID training is Higgsfield-only — no fallback. If it fails, the operator either fixes Higgsfield credits or accepts anchor-ref drift.
- **UGC discipline (a prior production review v3 diagnostic).** When `concept_format` is `ugc-diary | testimonial | founder-led | before-after`:
  - `world_lock:` block is REQUIRED in design-brief; State 3.55 (world lock) runs.
  - `voiceover_strategy:` is REQUIRED and defaults to `real_voice`. `synthetic_vo` requires an explicit host-persisted synthetic-voice approval and is flagged at every gate.
  - Storyboard MUST compute and surface `cuts_per_10s` and `face_share_planned`; compare those measurements with the brief/reference-derived targets and explain any mismatch; actual picture cuts and all direct-face exposure count. No universal cut or face-share quota replaces the viewer-purpose judgment.
  - Hard cuts only between AI-generated stills; crossfades reserved for non-AI compositions (LEARNINGS L2 extension).
  - Brand text is never AI-rendered; always composite the real wordmark/screenshot via PIL.
  - End-card style defaults to `narrative_resolution` (talent walks out / closes laptop / picks up phone), not flat brand panel.
  - Phase 7a/7b review includes UGC identity/world/shotcraft and the all-speech performance responsibility: `review-video-identity-drift`, `review-video-world-consistency`, `review-video-ugc-shotcraft`, `review-video-vo-authenticity`. Apply the current evidence and completion requirements in `review-video.md`: shotcraft must satisfy approved intent and any explicit agreed recipe requirements using actual temporal evidence; no legacy composite score or universal cut/face quota decides approval. A voice review record validates declarations, not heard quality. Required unresolved defects or unavailable review remain blocking. Findings are persisted into `review_issues`.
  - Within a single video, once an anchor (character or style) is approved on a specific provider, all subsequent regenerations for that anchor's downstream calls inherit the same `gateway` from `.meta.json` (no mid-pipeline provider swap on the same character).

## Quality Checks

- All listed states and applicable sub-states either ran or were explicitly skipped (with reason logged in state file).
- Every artifact in the folder convention exists for the states that ran.
- Review iterations ≤ 3 before escalation.
- No skill was called twice in the same state for the same input (idempotency check).
- The decision log in `implementation_brief` has been updated with actual choices made.
- `preflight_status` is `PASS` for all current inputs and required capabilities.
- If `character_lock_method` is `soul-id`, every keyframe in `create-clips` threaded the soul_id.

## Failure Modes

- Orchestrator silently re-runs `create-clips`, burning credits — guard with artifact-existence check.
- Skipping a human gate because it "obviously" passes — operator never sees the storyboard, ships a wrong-concept video.
- Loop runs forever on a stuck scene because each iteration re-introduces the same issue — enforce 3-iteration cap.
- State file stays "CREATE_CLIPS" forever because edit-video failed silently — surface every skill error before advancing state.
- Orchestrator decides on its own to skip storyboard for a "simple" video — never; the cheap gate is always worth running.
- Script silently edited in `design_brief` after lock — invalidates `locked_script`. Quality check: diff lockedmd vs design-brief VO every state transition; if they diverge, force re-running State 2.5.
- Character keyframes regenerated without threading `character_locks` — drift returns. Guard: `create-clips` must read `character_locks` for every scene with the character.
