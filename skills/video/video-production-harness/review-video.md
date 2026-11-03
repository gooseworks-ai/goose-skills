---
name: video-production-harness/review-video
description: Review the exact selected cut with its real sound and moving picture (or measured evidence), compare it with the reference beat table and the creative contract, and write timestamped findings with honest perception and current-file evidence.
---

# Human version

Review one exact cut. Record what a viewer receives, compare it with the reference and the plan, and route each defect to the smallest repair. A clean cut that is confusing or unlike the reference does not pass.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md). Use [the editorial review guide](references/editorial-review.md) for source binding, stage questions, note disposition and edit history. The checks below are rubrics you run with real frames, audio and FFmpeg, not skills to fetch.

## Purpose

Writes notes only, never edits the video, in the contract [auto-fix-from-review-notes.md](auto-fix-from-review-notes.md) consumes. Diagnose promise, payoff and sequence problems before dispatching repairs.

## Honest perception

- Record `listened` / `watched` only when you, a person or an audio/video-capable model really heard and watched the cut at normal speed.
- Otherwise record `measured`: valid when `scripts/qc_evidence.py` exits 0 on the exact file and you inspected its frames at full resolution. Its measurements and the host's final check (after you mark the video complete) are findings graded by [check severity](references/check-severity.md); never send the final or its frames to a vision model yourself.
- Frames, a transcript, thumbnails or a storyboard are evidence, never a watch.
- A broken file is INCOMPLETE. An observed `must_fix` defect sets NEEDS REVISION whatever the measurements say.

## Inputs

- `<video_folder>` (required).
- `<video_path>`: the exact cut (host review selection or source note) with render/version id and checksum; on a first cut, the new candidate. Never another master or thumbnails.
- `<stage>`: concept, rough, fine or final. Record which decision this review can clear.
- `<review_idx>`: optional; otherwise auto-increment from `review-notes/`.

## Compare with the reference

The final review compares the cut with the reference beat table, beat by beat: **people, action, camera, sound, text and length**.

| Mismatch | Severity |
|---|---|
| People (who, how many, on camera or not) | ask |
| Action (what is done, shown or used) | ask |
| Sound type (speech, music, effects, silence) | ask |
| Camera grammar (phone handheld, selfie, static, cut style) | ask |
| Length outside ±25% of the reference, with no `length` entry in `changes_from_reference` | ask |
| Length outside ±25% of the planned length, when `length` is listed | ask |
| Text, or length drift inside ±25% | fine |

A change listed in the approved `changes_from_reference` (or the beat table's permitted change) is not a mismatch. When `length` is listed (an 85 s reference cut to a 26 s ad), record the planned length and judge the final against it, not the reference. A person or demo replaced by a card, dots or a still is an `ask` finding you recommend fixing. A mismatch is `must_fix` only when it is on the must_fix list.

## Review phases

**7a: measurements and verified observations**
- Run `python3 scripts/qc_evidence.py VIDEO.mp4 EVIDENCE_DIR` (add `--timeline`, `--words`, `--script`, `--reference`, `--reference-words`, `--reference-shots`, `--plan` when you have them). It gives the probe, 2 fps frames, audio, loudness, tail and graded final measurements (`findings`), and exits 1 only on a broken file.
- Measure per-scene RMS with FFmpeg astats and compare cut times with word timings; the helper does not. `source_pts_s` (not the nominal `sample_center_s`) identifies sampled bytes.
- Run the hallucination, transcript, identity, alignment and world checks. Content decides which duties apply, not the format label. Identity uses the locked anchor; world reads `world_lock:` and `world_locks` (State 3.55). Save findings to `review_issues`.
- Transcript: compare the final audio's words and joins with the accepted script. ASR can hallucinate in silence; confirm by listening when you can. A high match never clears babble, poor delivery or bad sync.

**7b: content**
- Concept landing, pacing, brand fit, platform fit, and creator shotcraft whenever there is a creator.
- Speech: the voice authenticity rubric on the isolated takes and the whole mix; watch speaking mouths against their driver.
- Hook strength and synthetic persona ran in State 7.5; re-run them only on revision passes.

**Required content duties (all formats).** APPROVED needs a current exact-file review with every applicable duty looked at and no open `must_fix`. Identity, world, product, action, voice, lip-sync, text and sound duties switch on from planned and observed content. Use [libraries, look and rubric](references/libraries-look-and-rubric.md). No score clears a `must_fix`. Record source and final hashes and reviewed intervals in `quality_report.content_review` when the host takes it.

**UGC checks** (when `concept_format` is UGC): identity 4 or 0, character drift or `continuity_break` is `must_fix`; world below 8.5 (or an axis below 6) and shotcraft gaps are `ask`; lost words or an opposite-gender voice are `must_fix`, other delivery problems `ask`. An open `must_fix` sets NEEDS REVISION. Save the verdict to `review_issues` and `project_state`.

**7c: aggregate.** Merge findings into the review notes: pass, needs_revision or incomplete per dimension, with intervals and evidence.

**7d: claim verification (required).** Every visual claim has a `timecode:`. Re-extract that frame with FFmpeg, inspect it and its neighbours, and tag the claim `claim:verified` or `claim:unverified`. Unverified claims leave the aggregate and are not findings; look again before you drop one.

**7e: complete review (required before APPROVED).** Run `scripts/qc_evidence.py` on the exact output. It must exit 0; grade its findings. Then review the whole cut against the reference beat table and the storyboard: every scene present and in order, with the approved product, text, captions, sound and ending. Watch and listen at normal speed when your tools can (`listened`/`watched`); otherwise `measured`. Save `output_sha256`, `creative_contract_revision`, `timeline_revision`, reviewer capability and covered and gap ranges. Review each ratio and cutdown on its own.

## Workflow

1. **Branch by stage.** Concept: read the brief and the real proof, answer the editorial guide's concept questions, record "no cut yet; no playback verdict claimed", then go to step 6. Otherwise resolve the exact candidate and keep its identity.
2. **Received message first.** Before reading the intended story, review the whole cut (with sound when you can, otherwise measured) and save what it says: offer, buyer, promise, proof, payoff, action and doubts, with timestamps. A reviewer who already knows the brief labels this context-aware.
3. Read `<video_folder>/design_brief`, `<video_folder>/implementation_brief`, `<video_folder>/locked_script` and brand evidence. Save every gap between received and intended message, even when technical checks pass.
4. Run 7a, 7b, the reference comparison and 7d. Every visual finding carries a timecode and a frame path.
5. Review the whole cut again, targeting suspicious ranges. Record each content dimension as pass, needs_revision or incomplete; optional scores never average away a `must_fix`.
6. List strengths, then issues by [check severity](references/check-severity.md) under the headings auto-fix reads: **P0 = must_fix** (inaudible VO, a failed hand count, a blank pack, warped anatomy); **P1 = ask** (a reference mismatch, clearly AI-looking); **P2 = fine** (polish).
7. Give each issue a concrete fix in the [auto-fix-from-review-notes.md](auto-fix-from-review-notes.md) contract: axis and title, timecode, issue, root cause and a `fix:` line (`<repair>; input=<path>; output=<path>; parameters=<values>`).

Re-rolls go through [edit-clip.md](edit-clip.md), only for `must_fix` or chosen `ask` items, paid as [check severity](references/check-severity.md) says. Never drop a scene.

8. Diagnose and route: concept or script back to its gate, missing proof to production, misordered material to edit, isolated defects to local repair. Give open taste calls alternatives and a decision owner.
9. Set the status:
   - **APPROVED**: no open `must_fix`, and every `ask` item settled (by the customer, or by you in `review_mode: auto`). A rough cut still needs fine review; a fine cut may go to State 9; captioned exports need a fresh final check.
   - **INCOMPLETE**: the file is broken (`scripts/qc_evidence.py` exits 1) or the source is missing; never call it approved.
   - **NEEDS REVISION**: an open `must_fix`, or an `ask` item chosen for a fix. Only when the diagnosis is local repair and every required item has an authorized deterministic fix line may the orchestrator call auto-fix directly instead of looping back to State 5/6.
10. Write `<video_folder>/review-notes/<idx>-<timestamp>.md`.

## Output document format

`# Review NN — <video name>`, then: cut reviewed (path, version id, checksum); stage; received message (before the brief, or labeled context-aware); perception (listened/watched or measured, covered ranges and gaps, qc_evidence exit code and findings, the host's final check for this output_sha256); reference match and severity; diagnosis and return route (cause, smallest revision, decision owner); reviewer, date; status. Then sections: Scores (optional), Strengths, P0 = must_fix (each in the fix form, plus **intended effect / acceptance**), P1 = ask (with the price of the fix), P2 = fine, Per-scene notes, Diff vs design brief and reference, Next pass requires.

## Structured check list

Also save JSON `{checks: [{id, severity, pass, machine_check, evidence, timecode, disposition, fix, cost_credits}]}` (severity `must_fix`, `ask` or `fine`) for [auto-refine.md](auto-refine.md). These are data fields, not a `pass-list-only` command. `machine_check` is true only for a real measurement. Disposition is `auto-fixable`, `auto-fixable-with-budget` or `escalate`. An unrun check is never a pass.

## Check rubrics

Run each with real frames, audio and FFmpeg. Save evidence with timecodes.

**Hand count (`must_fix`).** Count the hands in every shot where hands act, at 2 fps through the action: no more hands than the people in frame have, no hand without a body, no phone held by an unseen hand. Any failure is `must_fix`; re-roll that clip with `phone_counter` or `phone_observer` capture, never the same selfie prompt.

**Product pack (`must_fix`).** Every brand pack matches its real photo at 2×: printed front label, shape, colour and contents. A blank, unprinted, label-less, back-facing or sticker-flat pack, or a use step or product state unlike the brand's photos and directions, is `must_fix` ([product scale and world](references/product-scale-and-world.md)).

**Plan promises (`ask`).** List every inset or overlay the plan promises (shot-plan `overlays`, the contract's on-screen notes) with the timestamp where it shows in the render, from that shot's own frames. A missing one is `ask`, usually a free re-assembly: fix it.

**Lip-sync scope.** Lip-sync on a silent face is `ask`; a speaking shot without a qualified native or matched audio-driven performance is `must_fix`.

**Identity and character.** Per scene, crop the largest face at 25/50/75% and tile the crops after the locked anchor (about 512 px per cell). Judge bone structure, eyes, skin tone and proportions (styling and makeup are not drift). List wardrobe, accessory, hair-colour and held-object changes.

| Verdict | Score | Action |
|---|---|---|
| Same person in every cell | 10 | keep |
| Borderline, at most 1 cell off | 7 | keep |
| 2 or more cells off | 4 | `must_fix`: re-roll those keyframes with the anchor |
| A different person overall | 0 | `must_fix`: re-roll |

**World consistency** (needs `world_lock:`; skip for travel, multi-location and montage). Grid each scene's 50% frame. Score set, wardrobe, lighting, colour, props and time of day 0-10 (score = mean). Any axis below 6 is `ask`; 6-7.9 is `fine`. Name the scene pair of each break.

**Visual hallucination: objects and text.** For each scene's first, middle and last frame at full resolution, list every object in frame. Any object or person the plan, reference and a lived-in room don't explain (rubbish near food, a second product, an extra person) is a hallucination: `must_fix`, and so is every garbled, misspelled or unapproved string.

**Audio-visual alignment.** Each payoff keyword's visual is on screen inside that word's window; fail a missing keyword or two beats on one word.

**Caption render.** Grab a frame mid-cue (at least 0.05 s before its end) and compare words, spelling and placement with the approved cue; at least 60% of its 4+ letter words must appear. OCR alone never approves missing copy.

**Concept landing.** From the received-message pass, score hook, message, payoff and CTA 0-10 against the brief. Any beat below 8 gets a root cause: scene and asset.

**Pacing and rhythm.** Find cuts with `select='gt(scene,0.4)'` and the music beats. When cut to music, a cut over 100 ms off the beat is P1. A near-static scene over 4 s is drag unless it carries proof or reading time.

**Brand and platform fit.** Approved claims only, no banned phrases, the real logo, brand colours and type; 1080×1920 for 9:16, text and faces in the safe area, a first frame that reads without sound.

**UGC shotcraft.** Count picture cuts per 10 s and direct-face time share (close-ups count); compare only with targets the brief or recipe agreed, never a universal quota. Each action finishes, the feature shows while discussed, text holds long enough to read.

**Hook strength.** Watch the first 3 s muted, then with sound; score readability, subject clarity and motion (1-10). Below 7 is `ask`: re-roll scene 1, replace the opening line, or move the strongest 3 s first (free).

**Synthetic persona.** Watch as the brand's documented buyer (never invent one): would they scroll on, act, have objections answered? A hypothesis only.

**Voice authenticity** (every spoken format, real recordings included). Listen at 1.0× to every take and the mix when your tools can, and record `listened`; otherwise `measured`, from the final measurements and the transcript; grade what you find. Judge words and endings, pronunciation, pace, emphasis, joins, continuity (timbre, room tone, breaths) and fit with the on-screen character (gender, age, accent, energy); re-perform only the affected phrase.

## Quality checks and failure modes

- The whole cut was covered (listened and watched, or measured on an unbroken file) and compared with the reference beat table.
- Every `must_fix` issue is verified at an exact time, or is attributed user feedback. Scores predict quality only.
- Status is exactly APPROVED, NEEDS REVISION or INCOMPLETE; "approved with minor changes" does not exist.
- Failures: summarizing the brief instead of the file; calling frames plus a transcript a watch; vague feedback; going easy on a `must_fix` because the project cost a lot.
