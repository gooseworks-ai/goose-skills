---
name: video-production-harness/orchestrator
description: Host-independent runner for the complete shared video production pipeline. Sequences preflight → brainstorm → design → script-lock → storyboard → character-lock → clips → edit → review → polish → deliver. Honors the two owner gates, writes structured project state, and produces one checked ad ready to ship.
---

# Human version

Run one saved production sequence from a sourced brief to a checked final. This page is the index: the state table, the rules that apply in every state, and links to one file per group of states.

---

# Agent version

**Reading rule.** Read one file per call. If the output says it was truncated, re-read that file in parts before acting.

**The non-negotiables in `SKILL.md` apply in every state.** Read them before State 0.

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles the binding resolves. Follow [creative contract and review](references/creative-contract-and-review.md) for content duties, review coverage, clip eligibility and exact-file evidence. Required tools, the owner's approval and budget must exist before each operation.

**Approvals.** There are two owner gates, both in the agent's chat: the **script** (State 2.5) and the **ingredients** (State 3). Concept, voice, anchor, world and look choices are shown inside those two. Agent checks, polish and final review add no other approval step.

## Saved production contract

`capabilities.md` defines the artifact roles; the binding maps them to real storage. Load saved state, choices, outstanding jobs, approvals, feedback and spend before working. A local file's existence is not proof of an approval or a finished generation.

After every state:

1. Save the true state, status, active candidate, blockers and latest activity.
2. Save the concept, script and scene plan before showing a review.
3. Register every image, video, audio, caption and evidence file as it lands, with a stable id and provenance.
4. Record each provider submission, job id, input fingerprint, output and charge. Retrieve outstanding jobs before any retry.
5. Save render outputs and immutable version lineage; never overwrite the previous master.
6. Validate the binding's schemas and cross-references before a gate, a handoff and delivery.

Consume saved, timestamped feedback on the exact version it was given on. Follow [the editorial review guide](references/editorial-review.md): changed is not verified, notes stay with their source version, and only affected approvals are refreshed. The last write of every turn records the state and the remaining blocker or gate.

## Progress and resume

- **Report progress.** While making the video, report `running` with a short `progress_note` (for example "clip 3 of 6"; `progress_percent` 0-100 is optional) after every paid piece and at least every 15 minutes. GooseWorks calls a run quiet after 20 minutes with no report and stops it after 120. A report with no note doesn't count; a new paid booking does.
- **Log paid requests.** Append each paid request to `working/paid-requests.jsonl`: its endpoint and exact body (plus any input-digest header).
- **Resume.** On restart, re-send each logged request unchanged. The same request gets the same booking, which returns the saved result with no new charge. Don't edit the draft or re-approve mid-run: that changes the booking and pays again.

## When to use

- A new ad from a brief (`<input>` = concept paragraph, optional reference).
- Resuming an in-flight ad (`<input>` = `<video_folder>`).
- Iterating after review notes (`<input>` = `<video_folder>` plus its review-notes file).

For one step only (for example "regenerate scene 5"), call that step file directly.

## Inputs

- `<input>`: a concept paragraph, or an existing `<video_folder>` to resume.
- `<video_folder>`: a temporary processing folder chosen by the host; durable state stays in the project.
- `<auto>`: allows ordinary execution inside approved scope only. It never bypasses the approved budget. The customer's `review_mode: auto` ("just make it") lets one yes to the full total cover the ingredient gate ([check severity](references/check-severity.md)); any new total still needs a new yes.

## State machine

The run advances from State 0 to State 11. At each state, check the saved result, the current input fingerprint and the applicable approval. Reuse a valid result; an obsolete artifact never clears a gate.

| State | Read | Saved result |
| --- | --- | --- |
| 0, 0.1 | [states: setup and script](states/setup-and-script.md); preflight-audit.md | Tooling and media PASS; brand context; reference studied. |
| 1 | same; brainstorm.md | Concept and audience/hook decision. |
| 2 | same; create-design-brief.md | Creative contract, scene routing and open decisions. |
| 2.5 | same; lock-script.md | Script from write-video-ad-script; **script gate**. |
| 2.6 | same; create-clips.md; lock-character.md Phase 0 | An on-screen voiced person's still and `character.voice_pair` first, then voice auditions and the selected voice. |
| 3 | [states: storyboard and clips](states/storyboard-and-clips.md); create-storyboard.md | Timed scene plan; **ingredient gate** (kit path: then run the kit's make command). |
| 3.4 | same | Generative video, FFmpeg motion or browser composition. |
| 3.5, 3.55 | same; lock-character.md | Locked anchors (reusing State 2.6's anchor) and world references. |
| 4.5 | same | Optional representative preview inside approved budget. |
| 5, 6 | same; create-clips.md; edit-clip.md | Inspected clips; targeted repairs. |
| 7 | [states: edit to delivery](states/edit-to-delivery.md); edit-video.md; promote.md | Labeled candidate, mix and version lineage. |
| 7.5 | same; review-video.md | Opening and hook decision. |
| 8, 8.5 | same; review-video.md; auto-fix-from-review-notes.md | Full review against the reference; bounded repairs. |
| 9 | same; polish.md | Objective fixes and a refreshed final check. |
| 10 | same; promote.md | Captions last, final check on the exact bytes, delivery. |
| 11 | same; wrap-session.md | Recipe, learnings and improvement proposals. |

## Specialist formats

A named format (UGC, music video, podcast, explainer, motion graphics, product video) supplies prompts and phase implementations inside this sequence; it never bypasses the gates, state, billing or review. Read [specialist handoffs](references/specialist-handoff.md) and check the host's real format capabilities first. If a required route is missing, stop before spending and offer a supported alternative at the existing gate.

## Cost tracking

Record and reserve every paid operation through the host: project, state, provider and model, quantity, price bound, job id, input fingerprint, actual charge and output. Before each owner gate, show a one-line `cost_preview`:

> **cost_preview:** spent **21.45** so far (`elevenlabs 0.20`, `fal 21.25`). Approving this gate books an estimated **+8.50** for CREATE_CLIPS + EDIT_VIDEO.

Use the host's current pricing; old rate tables never authorize spend.

## Decision policies

- **Never regenerate an approved artifact.** Check for existing results before calling a step.
- **Use the review note's `edit_type`** for edit-clip. "Scene 5 looks weird" needs specifics before a re-roll.
- **Voices come from the host-approved catalog,** or are a Voice Design voice made for this character and approved at the ingredient gate. An on-screen person's separate voice is `character.voice_pair`, chosen with the person, never in the script draft (unconditioned native H3 has no pair and is accepted with its first take; a qualified voice-reference take retains the approved pair/audition and is compared with it); a change re-runs pair_voice.py (create-creator-takes-h3) with `--exclude`. Search the shared voice library before Voice Design, and never change the person to fit a voice. Never reuse another brand's or character's voice by default. Any other voice blocks State 5.
- **Locks hold.** `character_locks` is the lock for every regeneration; `locked_script` is the only VO source. Changing VO text re-runs State 2.5.
- **Quality warns, never blocks.** Grade every finding by [check severity](references/check-severity.md): `must_fix` is redone and never delivered, `ask` goes to the customer with the price of the fix (in `review_mode: auto` you decide it), `fine` is kept. Only money, consent, safety and broken data stop the run.
- **Preflight blocks only on hard findings** (broken media, missing authentication or capability, unresolved brief variables). A revised plan may drop a blocked dependency only with the owner's approval.
- **Redo only must_fix, never drop a scene.** A redo is paid from the approved total when it fits; otherwise get a new yes to its price first.
- **Review loop by severity:** loop only while a `must_fix` is open; each `ask` item is settled once; `fine` items end the loop. After 3 rounds with a `must_fix` still open, show the customer the best version with the finding and the price of another redo.
- **Verify visual claims.** Phase 7d frame checks are required before APPROVED.
- **Scene keyframe text uses overlays.** Compose wordmarks, taglines, URLs and CTAs with PIL or FFmpeg and real brand assets. Actual static ads shown as product output use the supported workflow in [specialist handoffs](references/specialist-handoff.md); inspect their full-size copy and logos.
- **Editorial illustration uses FFmpeg motion only.** With `motion_strategy: ffmpeg_motion`, no paid generative video is called.
- **Hard cuts between AI stills.** Crossfades expose drift between separately generated frames.
- **Provider fallback.** fal is primary through the binding's managed submit and poll. On a detected failure, reconcile the failed job and the budget, then resolve a supported fallback row from [shot routing](references/shot-routing.md). A fallback is never assumed free; a missing one surfaces `fallback_unavailable` for the operator.
- **Content-derived duties.** Real people, worlds, products, actions and speech switch their checks on, whatever the format label. The storyboard reports `cuts_per_10s` and `face_share_planned` against reference-derived targets, with no universal quota. Once an anchor is approved on a provider, its later calls keep that `gateway`.

## Quality checks

- Every state either ran or was skipped with a logged reason.
- Every artifact exists for the states that ran; no step ran twice for the same input.
- The decision log in `implementation_brief` records the real choices.
- `preflight_status` is `PASS` for all current inputs and required capabilities.

## Failure modes

- Skipping an owner gate because it "obviously" passes: the owner never sees the script or ingredients.
- A stuck scene looping forever: enforce the 3-round cap, then let the customer choose another paid redo or keep the flagged take.
- State stuck at CREATE_CLIPS because edit-video failed silently: surface every step error before advancing.
- Script edited in `design_brief` after lock: diff `locked_script` against the brief's VO at every transition; a mismatch re-runs State 2.5.
