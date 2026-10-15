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
- Otherwise record `measured`. A measured review is APPROVED only when `scripts/qc_evidence.py` exits 0 on the exact file, the host's `final_measure` passes (or is not applicable), and `scripts/frame_judge.py --kind final` wrote a passing `frame_judge.json`, all for the same `output_sha256` (`qc_evidence.py --frame-judge` reports `measured_review_may_approve`). Otherwise it is INCOMPLETE.
- Frames, a transcript, thumbnails or a storyboard are evidence, never a watch.
- Neither real perception nor passing measurements: INCOMPLETE. An observed defect sets NEEDS REVISION whatever the measurements say.

## Inputs

- `<video_folder>` (required).
- `<video_path>`: the exact cut (host review selection or source note) with render/version id and checksum; on a first cut, the new candidate. Never another master or thumbnails.
- `<stage>`: concept, rough, fine or final. Record which decision this review can clear.
- `<review_idx>`: optional; otherwise auto-increment from `review-notes/`.

## Compare with the reference

The final review compares the cut with the reference beat table, beat by beat: **people, action, camera, sound, text and length**.

| Mismatch | Severity |
|---|---|
| People (who, how many, on camera or not) | P0 |
| Action (what is done, shown or used) | P0 |
| Sound type (speech, music, effects, silence) | P0 |
| Camera grammar (phone handheld, selfie, static, cut style) | P0 |
| Length outside ±25% of the reference, with no `length` entry in `changes_from_reference` | P0 |
| Length outside ±25% of the planned length, when `length` is listed | P0 |
| Text, or length drift inside ±25% | P1 |

A change listed in the approved `changes_from_reference` (or the beat table's permitted change) is not a mismatch. When `length` is listed (an 85 s reference cut to a 26 s ad), record the planned length and judge the final against it, not the reference. A person or demo replaced by a card, dots or a still is always P0: a card cannot replace a person or a demonstration.

## Review phases

**7a: measurements and verified observations**
- Run `python3 scripts/qc_evidence.py VIDEO.mp4 EVIDENCE_DIR` (add `--timeline`, `--words`, `--script`, `--reference`, `--reference-words`, `--reference-shots`, `--plan` when you have them). It gives the probe, 2 fps frames, decoded audio, loudness, tail and the final measurements, and exits 1 on any failed measurement.
- Measure per-scene RMS with FFmpeg astats and compare cut times with word timings; the helper does not. `source_pts_s` (not the nominal `sample_center_s`) identifies sampled bytes.
- Run the hallucination, transcript, identity, alignment and world checks. Content decides which duties apply, not the format label. Identity uses the locked anchor; world reads `world_lock:` and `world_locks` (State 3.55). Save findings to `review_issues`.
- Transcript: compare the final audio's words and joins with the accepted script. ASR can hallucinate in silence; confirm by listening when you can. A high match never clears babble, poor delivery or bad sync.

**7b: content**
- Concept landing, pacing, brand fit, platform fit, and creator shotcraft whenever there is a creator.
- Speech: the voice authenticity rubric on the isolated takes and the whole mix; watch speaking mouths against their driver.
- Hook strength and synthetic persona ran in State 7.5; re-run them only on revision passes.

**Required content gate (all formats).** APPROVED needs a current exact-file `content_review` with every applicable duty complete and no required open defect. Identity, world, product, action, voice, lip-sync, text and sound duties switch on from planned and observed content. Use [libraries, look and rubric](references/libraries-look-and-rubric.md). No score clears a wrong product or scale, a missing demonstration, an impossible action, unusable speech, broken sync or unreadable essential copy. Record source and final hashes and reviewed intervals in `quality_report.content_review`.

**UGC gate** (overrides 7c when `concept_format` is UGC). APPROVED needs all of:
- character drift count 0;
- identity verdict 10 or 7 (keep), never 4 or 0; `continuity_break` false;
- world consistency ≥ 8.5 with no axis below 6;
- shotcraft with complete timed evidence and no open proof, readability, action, continuity or agreed-recipe defect;
- speech checks on the isolated takes complete with no required open defect, `real_voice` included.

Any one failing sets NEEDS REVISION. Save the verdict to `review_issues` and `project_state`.

**7c: aggregate.** Merge findings into the review notes: pass, needs_revision or incomplete per dimension, with intervals and evidence.

**7d: claim verification (required).** Every visual claim has a `timecode:`. Re-extract that frame with FFmpeg, inspect it and its neighbours, and tag the claim `claim:verified` or `claim:unverified`. Unverified claims leave the aggregate, but removing one does not complete its check; missing evidence blocks approval.

**7e: complete review (required before APPROVED).** Run `scripts/qc_evidence.py` on the exact output. It must exit 0; fix every failed range first. Then review the whole cut against the reference beat table and the storyboard: every scene present and in order, with the approved product, text, captions, sound and ending. Watch and listen at normal speed when your tools can (`listened`/`watched`); otherwise `measured`. Save `output_sha256`, `creative_contract_revision`, `timeline_revision`, reviewer capability and covered and gap ranges. Review each ratio and cutdown on its own.

## Workflow

1. **Branch by stage.** Concept: read the brief and the real proof, answer the editorial guide's concept questions, record "no cut yet; no playback verdict claimed", then go to step 6. Otherwise resolve the exact candidate and keep its identity.
2. **Received message first.** Before reading the intended story, review the whole cut (with sound when you can, otherwise measured) and save what it says: offer, buyer, promise, proof, payoff, action and doubts, with timestamps. A reviewer who already knows the brief labels this context-aware.
3. Read `<video_folder>/design_brief`, `<video_folder>/implementation_brief`, `<video_folder>/locked_script` and brand evidence. Save every gap between received and intended message, even when technical checks pass.
4. Run 7a, 7b, the reference comparison and 7d. Every visual finding carries a timecode and a frame path.
5. Review the whole cut again, targeting suspicious ranges. Record each content dimension as pass, needs_revision or incomplete; optional scores never average away a blocker.
6. List strengths, then issues by severity: **P0** ship-stopper (inaudible VO, broken hero shot, a failed hand count, a blank brand pack, a reference mismatch above); **P1** clearly degrades the cut; **P2** polish.
7. Give each issue a concrete fix in the [auto-fix-from-review-notes.md](auto-fix-from-review-notes.md) contract: axis and title, timecode, issue, root cause and a `fix:` line (`<repair>; input=<path>; output=<path>; parameters=<values>`).

Re-rolls go through [edit-clip.md](edit-clip.md) with paid authorization.

8. Diagnose and route: concept or script back to its gate, missing proof to production, misordered material to edit, isolated defects to local repair. Give open taste calls alternatives and a decision owner.
9. Set the status:
   - **APPROVED**: this stage is cleared. A rough cut still needs fine review; a fine cut may go to State 9; captioned exports need a fresh final check.
   - **INCOMPLETE**: real perception or passing final measurements, the source, or required evidence is missing. Save what was checked and what is missing; never turn an absence into approval.
   - **NEEDS REVISION**: list the P0/P1 items to fix first. Only when the diagnosis is local repair and every required item has an authorized deterministic fix line may the orchestrator call auto-fix directly instead of looping back to State 5/6.
10. Write `<video_folder>/review-notes/<idx>-<timestamp>.md`.

## Output document format

`# Review NN — <video name>`, then: cut reviewed (path, version id, checksum); stage; received message (before the brief, or labeled context-aware); perception (listened/watched or measured, covered ranges and gaps, qc_evidence exit code, final_measure and frame_judge results for this output_sha256); reference match and severity; diagnosis and return route (cause, smallest revision, decision owner); reviewer, date; status. Then sections: Scores (optional), Strengths, P0 (each in the fix form, plus **intended effect / acceptance**), P1, P2, Per-scene notes, Diff vs design brief and reference, Next pass requires.

## Structured check list

Also save JSON `{checks: [{id, severity, pass, machine_check, evidence, timecode, disposition, fix, cost_credits}]}` for [auto-refine.md](auto-refine.md). These are data fields, not a `pass-list-only` command. `machine_check` is true only for a real measurement. Disposition is `auto-fixable`, `auto-fixable-with-budget` or `escalate`. Missing required evidence blocks approval.

## Check rubrics

Run each with real frames, audio and FFmpeg. Save evidence with timecodes.

**Hand count (P0).** Count the hands in every shot where hands act, at 2 fps through the action: no more hands than the people in frame have, no hand without a body, no phone held by an unseen hand. Any failure is P0; re-roll that clip with `phone_counter` or `phone_observer` capture, never the same selfie prompt.

**Product pack (P0).** Every brand pack in frame matches its real photo at 2×: printed front label, shape, colour and contents. A blank, unprinted, label-less, back-facing or sticker-flat pack, or a use step or product state unlike the brand's photos and directions, is P0 ([product scale and world](references/product-scale-and-world.md)).

**Plan promises (P0).** List every inset or overlay the plan promises (shot-plan `overlays`, the contract's on-screen notes) with the timestamp where it shows in the render; `scripts/frame_judge.py` reports each as seen or missing. A promised inset that isn't in the render is P0.

**Lip-sync scope.** A lip-synced clip on a shot not marked `speaking_on_camera` is P1; a speaking shot without lip-sync is P0.

**Identity and character.** Per scene, crop the largest face at 25/50/75% and tile the crops after the locked anchor (about 512 px per cell). Judge bone structure, eyes, skin tone and proportions (styling and makeup are not drift). List wardrobe, accessory, hair-colour and held-object changes.

| Verdict | Score | Action |
|---|---|---|
| Same person in every cell | 10 | keep |
| Borderline, at most 1 cell off | 7 | keep |
| 2 or more cells off | 4 | re-roll those keyframes with the anchor |
| A different person overall | 0 | re-roll |

**World consistency** (needs `world_lock:`; skip for travel, multi-location and montage). Grid each scene's 50% frame. Score set, wardrobe, lighting, colour, props and time of day 0-10 (score = mean). Any axis below 6 is P0; 6-7.9 is P1. Name the scene pair of each break.

**Visual hallucination: objects and text.** For each scene's first, middle and last frame at full resolution, list every object in frame (`scripts/frame_judge.py` saves them). Fail an unplanned object that changes the meaning (rubbish, peels or a bin near food or the product, a second product, a wrong container) and every garbled, misspelled or unapproved string.

**Audio-visual alignment.** Each payoff keyword's visual is on screen inside that word's window; fail a missing keyword or two beats on one word.

**Caption render.** Grab a frame mid-cue (at least 0.05 s before its end) and compare words, spelling and placement with the approved cue; at least 60% of its 4+ letter words must appear. OCR alone never approves missing copy.

**Concept landing.** From the received-message pass, score hook, message, payoff and CTA 0-10 against the brief. Any beat below 8 gets a root cause: scene and asset.

**Pacing and rhythm.** Find cuts with `select='gt(scene,0.4)'` and the music beats. When cut to music, a cut over 100 ms off the beat is P1. A near-static scene over 4 s is drag unless it carries proof or reading time.

**Brand and platform fit.** Approved claims only, no banned phrases, the real logo, brand colours and type; 1080×1920 for 9:16, text and faces in the safe area, a first frame that reads without sound.

**UGC shotcraft.** Count picture cuts per 10 s and direct-face time share (close-ups count); compare only with targets the brief or recipe agreed, never a universal quota. Each action finishes, the feature shows while discussed, text holds long enough to read.

**Hook strength.** Watch the first 3 s muted, then with sound; score readability, subject clarity and motion (1-10). Below 7: re-roll scene 1, replace the opening line, or move the strongest 3 s first.

**Synthetic persona.** Watch as the brand's documented buyer (never invent one): would they scroll on, act, have objections answered? A hypothesis only.

**Voice authenticity** (every spoken format, real recordings included). Listen at 1.0× to every take and the mix when your tools can, and record `listened`; otherwise `measured`, where the final measurements must pass and an observed defect still blocks. Judge words and endings, pronunciation, pace, emphasis, joins, continuity (timbre, room tone, breaths) and fit with the on-screen character (gender, age, accent, energy); re-perform only the affected phrase.

## Quality checks and failure modes

- The whole cut was covered (listened and watched, or measured with passing final measurements) and compared with the reference beat table.
- Every blocking issue is verified at an exact time, or is attributed user feedback. Scores predict quality only.
- Status is exactly APPROVED, NEEDS REVISION or INCOMPLETE; "approved with minor changes" does not exist.
- Failures: summarizing the brief instead of the file; calling frames plus a transcript a watch; vague feedback; going easy on a P0 because the project cost a lot.
