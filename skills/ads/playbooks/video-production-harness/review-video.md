---
name: video-production-harness/review-video
description: Watch the explicitly selected cut with complete-video frame and audio review, evaluate it against the design-brief, and write a dated review-notes/[idx]-[timestamp].md with strengths, issues, and concrete fixes.
---

# Human version

Review the exact cut at its current stage, record what a viewer receives, and route each problem to the smallest useful revision. Required frame evidence remains explicit, and GooseWorks checks the final's sound and words when you report complete; technical cleanliness alone cannot approve a confused story.

---

# Agent version

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation. Read [the editorial review guide](references/editorial-review.md) for source binding, stage decisions, note disposition, impact checks and saved edit history.

## Purpose

Independent QA pass on a video cut. Acts as a fresh-eyes reviewer — runs the full suite of specialized review responsibilities, aggregates their findings, and produces a structured review document with prioritized issues and proposed fixes (each fix routes to concept/script, production, sequence edit or local repair according to its cause).

Use the stage-specific questions in [the editorial review guide](references/editorial-review.md). Diagnose promise/payoff and sequence problems before dispatching repairs. Prepare authorized cheap alternatives before an unresolved taste decision.

This skill never edits the video. It only writes notes. The aggregate review-notes file is written in the contract that `auto-fix-from-review-notes` consumes, so the orchestrator can deterministically apply P0/P1 items in the NEEDS REVISION branch.

## Review suite (parallel dispatch)

Stage 8 has five phases. The names below identify review responsibilities, not executable commands. Run them sequentially or with available independent reviewers; preserve every check and its evidence. Phase 7d prevents unsupported visual claims, and Phase 7e requires reading every frame.

**Phase 7a — deterministic (run in parallel):**
- Run `python3 scripts/qc_evidence.py VIDEO.mp4 EVIDENCE_DIR` for the real probe, 2 fps frame set, decoded audio and loudness/tail diagnostics. Separately measure per-scene RMS with FFmpeg astats and compare cut timestamps against actual word timings; the helper does not claim to perform those comparisons.
- Frame `sample_center_s` labels are nominal review slots, not exact source times. Use the measured `source_pts_s` to identify the sampled bytes; resampling can duplicate a source frame. Verify caption boundaries, transitions and other timed claims with independent seeks and decoded frame timestamps in Phase 7d.
- **Visual hallucination check** (on-screen text against approved copy — **visual** hallucinations)
- **Transcript check** — transcribe the final with `media_analyze` (free) and compare to the locked script; every line must be heard. Catches **audio** hallucinations: invented words in a silent tail, words cut at scene splits, dropped or swapped lines. Required whenever speech is present.
- **Identity and character check** (face strip against the locked anchor, plus wardrobe / accessories / hair across scenes)
- **Audio-visual alignment** (payoff lines land on payoff visuals)
- **UGC family only** (`concept_format ∈ {ugc-diary, testimonial, founder-led, before-after}`):
  - **Cross-cut identity verdict** with the locked anchor as the baseline. Catches "different person in scene 7". Persist findings to `review_issues`.
  - **World consistency** — set / wardrobe / lighting / color-grade / props across cuts. Reads the `world_lock:` block from design-brief and `world_locks` from State 3.55.

Every check is defined under "Check rubrics" below. They are checks you run with real frames, audio and FFmpeg, not skills to fetch.

**Phase 7b — creative (user toggles which to run; parallel):**
- **Concept landing** (intended vs received beats)
- **Pacing and rhythm** (cut-vs-beat alignment)
- **Brand fit**
- **Platform fit**
- **UGC family only**:
  - **UGC shotcraft** — inspect actual shot choices, proof/reading windows and joins against approved intent. Compare actual picture cuts and time-based direct-face share (including close-ups) with the current plan; count fractions and motion diagnostics stay distinct. Use explicit agreed recipe targets only, never universal cut/face quotas. Apply this rubric with actual timeline/media tools even when no separate reviewer package is installed.
- **All spoken formats, including real recorded/native speech:** perform the speech-performance responsibility on actual isolated takes before assembly (pronunciation, rhythm, pauses/emphasis, joins and final consonants). Use the actual fetched voice-performance reviewer when available, or the documented listening rubric with real tools; no named tool is assumed installed. For the final mix, GooseWorks checks sound and spoken words when you report complete (the final file check in `capabilities.md`).
- NOTE: the hook-strength and synthetic-persona checks ran earlier in State 7.5 (scroll-test gate). Re-run here only on revision passes or if first-stitch is bypassed.

**UGC gate (overrides Phase 7c status when `concept_format` is in the UGC family):** APPROVED requires ALL of:
- Character drift count == 0
- Identity verdict 10 or 7 = keep; 4 or 0 = re-roll. `continuity_break` must be false
- World-consistency score ≥ 8.5 AND no axis < 6
- Shotcraft review has complete temporal evidence and no unresolved proof, readability, action/continuity or agreed-recipe defect. An optional score, cut density or face share cannot approve or reject the cut by itself; preserve deliberate calm and current authorized exceptions.
- Speech-performance checks on the isolated takes are complete with no required unresolved defect, including real_voice; synthetic-tell rubric applies where relevant and does not replace this gate.

Any one of these failing sets status to NEEDS REVISION regardless of other axes. This is a prior review v3 lesson: the standard 6-axis rubric scored that cut as shippable; the UGC-specific checks would have blocked it. The aggregated gate verdict is persisted into `review_issues` and reflected in `project_state`.

**Phase 7c — aggregate:**
- Merge every atom's findings into a single `review-notes/<idx>-<ts>.md` using the markdown contract defined in `auto-fix-from-review-notes.md`. Score each axis (existing 6-axis rubric below) using per-atom outputs as evidence. Status: APPROVED, NEEDS REVISION or INCOMPLETE (after Phase 7d gates).

**Phase 7d — claim verification (deterministic, required):**
- Every visual claim MUST include a `timecode:` field. Re-extract the actual frame at that timestamp with FFmpeg, inspect it and neighboring frames, and confirm or reject the claim against those bytes.
- Each verified claim is tagged `claim:verified`. Unverified claims become `claim:unverified` and are filtered OUT of the aggregate (don't gate ship on hallucinated findings).
- Status APPROVED requires every required review responsibility to be complete and every aggregate P0/P1 to be verified and resolved. A missing or unreadable evidence set blocks approval; removing an unsupported claim does not complete its underlying check. Reviewers have a track record of false visual reports — v03 round 14 (captions "rendered" when frames showed none), v03 round 11 (EXAMPEL typo missed).

### Phase 7e — complete watch (required)

Read the entire 2 fps frame sequence from `scripts/qc_evidence.py` and check it against the storyboard: every scene present and in order, with the approved product, text, captions and ending. Save observations for every scene and the measured duration. GooseWorks checks sound and spoken words when you report complete (the final file check in `capabilities.md`); if complete is refused, fix the reasons it gives. A storyboard, clip thumbnails, metadata, or only a few frames cannot clear this gate.

## Inputs

- `<video_folder>` (required)
- `<video_path>` — explicit cut resolved from the host review selection or source note; record render/version ID and checksum. On a first cut use the newly registered candidate. Never fall back to a different master or thumbnails when a watched source is missing.
- `<stage>` — concept, rough, fine or final; record which decision this review can clear. Concept reviews cannot claim watched-cut evidence.
- `<review_idx>` — optional sequence number; if omitted, auto-increment based on existing files in `review-notes/`

## Workflow

1. Branch by stage. For **concept**, read the sourced brief and available truthful proof, answer the Concept questions in the editorial guide and record “no cut yet; no received-message/playback verdict claimed”; skip cut-dependent checks until actual media exists. For **rough/fine/final**, resolve the exact candidate and preserve its source identity. Before loading its intended story, read the complete frame sequence and save the received-message observation: offer, buyer, promise, proof, payoff, action and uncertainties with timestamps. A reviewer who already knows the brief labels this context-aware; no invented fresh-viewer testimony.
For concept-only review, record its supported/unsupported promise and decision, then continue at strengths/issues/status below; do not run cut-dependent Steps 3–7 or claim their verdicts.

2. Then read `<video_folder>/design_brief`, `<video_folder>/implementation_brief`, `<video_folder>/locked_script` and current brand evidence. Compare the received message with the intended story; save mismatches even if every technical check passes.
3. **Run every applicable Phase 7a responsibility** — save the measured or rubric evidence in a working check list. Every visual finding includes its timecode and actual frame path.
4. **Decide Phase 7b set** — by default run concept-landing + pacing-rhythm + brand-fit + platform-fit (hook-strength + synthetic-persona already ran in State 7.5). Apply the selected rubrics and collect their actual evidence.
5. **Run Phase 7d** — verify each claim against the actual frame and record verified, rejected or incomplete. Exclude rejected claims; block approval on incomplete required checks.
6. Read the complete frame sequence again (this is the focused follow-up to the initial received-message pass). Capture:
   - Total runtime
   - Per-scene observations the atoms missed
   - Overall feel / coherence
7. Score the cut on these axes (0–10 each, with one-sentence justification), pulling evidence from each atom's output:
   - **Hook strength** (does it stop the scroll in 2s?)
   - **Story clarity** (could a muted viewer follow the arc?)
   - **Brand fit** (does it match current brand visual rules?)
   - **Comedic / emotional landing** (do the punchlines land?)
   - **Technical polish** (cuts, sync, levels, captions)
   - **Platform fit** (9:16 safe area, opening frame, length)
8. List **strengths** (what to keep / lean into).
9. List **issues** ranked by severity:
   - **P0 blocker** — ship-stopper (e.g. VO inaudible, hero shot broken, screen leakage in a no-screens ad)
   - **P1 should fix** — meaningfully degrades the cut
   - **P2 nice-to-have** — polish
10. For each issue, propose a concrete fix in the markdown contract `auto-fix-from-review-notes` consumes:

```markdown
### <axis> · <short title>
- **timecode:** 00:00:12.500
- **issue:** <one sentence>
- **root cause:** <one sentence>
- **fix:** `<repair responsibility>; input=<actual path>; output=<new path>; parameters=<specific values>`
```

Examples of `fix:` lines:
- `re-roll scene 5 motion; preserve its locked refs; simplify its approved motion prompt` — creative repair through `edit-clip.md`, with renewed paid authorization as needed.
- `normalize loudness; input=edits/master-final.mp4; output=edits/master-normalized.mp4; target=-14 LUFS, true_peak=-1 dBTP` — resolve to actual FFmpeg loudnorm measurement and encoding.
- `repair caption overflow; input=captions/captions.srt; output=captions/captions-fixed.srt; maximum=2 lines of 38 characters` — edit cues, verify real timings, burn only after polish.
- `extend end-card hold; input=clips/scene-16-endcard.mp4; output=clips/scene-16-endcard-extended.mp4; added_hold=0.6 seconds` — resolve to a real FFmpeg last-frame hold and re-stitch.

11. Consolidate critical findings into a diagnosis, acceptance conditions and smallest sufficient return route. Concept/script repairs return to their current gate; missing proof goes to production; correct-but-misordered material to edit; isolated defects to local repair. Save cheap alternatives and the decision owner for unresolved taste/conflicts.
12. Determine **next-pass status**:
   - **APPROVED** — this stage's questions and required evidence are cleared; advance to the next applicable stage. An approved rough cut still needs fine/final review. Fine review may advance to State 9 polish; the actual captioned exports need fresh final QC.
   - **INCOMPLETE** — required frames, source or evidence is unavailable; save what was checked and the missing capability. Do not convert absence into approval or a speculative repair.
   - **NEEDS REVISION** — list which P0/P1 issues must be addressed before next review. Only if the diagnosis is local repair and every required NEEDS REVISION item has an authorized deterministic fix line, the orchestrator may shortcut by calling `auto-fix-from-review-notes` directly instead of looping back to State 5/6.
13. Write `<video_folder>/review-notes/<idx>-<timestamp>.md` (e.g. a dated review record). Format below.

## Output document format

```markdown
# Review NN — <video name>

- **Cut reviewed:** <path, immutable render/version ID, checksum>
- **Stage:** concept | rough | fine | final
- **Received message:** <recorded before loading the brief, or labeled context-aware>
- **Coverage:** <frames read, gaps, transcript where available>
- **Diagnosis / return route:** <cause, smallest sufficient revision and decision owner>
- **Runtime:** <s>
- **Reviewer:** <actual reviewer and context-aware/independent status>
- **Date:** <ISO timestamp>
- **Status:** APPROVED | NEEDS REVISION | INCOMPLETE

## Scores

| Axis | Score | Note |
|---|---|---|
| Hook strength | x/10 | ... |
| Story clarity | x/10 | ... |
| Brand fit | x/10 | ... |
| Comedic landing | x/10 | ... |
| Technical polish | x/10 | ... |
| Platform fit | x/10 | ... |

## Strengths
- ...

## P0

### <axis> · <short title>
- **timecode:** <actual source timestamp or range>
- **issue:** <observed viewer problem, linked note ID and evidence>
- **root cause:** <diagnosis>
- **fix:** `<real repair responsibility>; input=<source>; output=<candidate>; parameters=<values>`
- **intended effect / acceptance:** <what the rewatch must demonstrate>

## P1

<same item form, or none>

## P2

<same item form, or none>

## Per-scene notes
- Scene 1: ...
- Scene 2: ...
- ...

## Diff vs design-brief
- Scene N: <how the cut deviates from the spec>

## Next pass requires
- <list of P0/P1 fixes that must be applied before the next review>
```

## Structured check list

For auto-refine, also save JSON `{checks: [{id, severity, pass, machine_check, evidence, timecode, disposition, fix, cost_credits}]}`. These are data fields, not a `pass-list-only` executable or mode. `machine_check` is true only for a real measurement/comparison; subjective rubric scores remain false. Disposition is `auto-fixable`, `auto-fixable-with-budget`, or `escalate`. Unknown required evidence is incomplete and blocks approval.

## Check rubrics

Run each with real frames, audio and FFmpeg. Save the evidence with timecodes.

**Identity and character check.** For each scene, crop the largest face from frames at 25/50/75% and tile the crops after the locked anchor (about 512 px per cell). Judge bone structure, eye shape and colour, skin tone and proportions; hair styling and makeup are not identity drift. Also list wardrobe, accessory, hair-colour and held-object changes between scenes.

| Verdict | Score | Action |
|---|---|---|
| Same person in every cell | 10 | keep |
| Borderline, at most 1 cell off | 7 | keep |
| 2 or more cells off | 4 | re-roll those keyframes with the anchor as reference |
| A different person overall | 0 | re-roll |

**World consistency** (needs a `world_lock:` block; skip for travel, multi-location and montage). Take the 50% frame of each scene, full frame, in a grid 3 wide. Score 0-10 for set, wardrobe, lighting, colour grade, recurring props and time of day. Score = mean of the six axes. Any axis < 6 = P0; any axis 6-7.9 = P1; 8+ passes. Name the scene pair where each break happens. Ignore intended micro-changes.

**Visual hallucination check.**
- Sample at least 2 fps plus the last frame of every scene.
- Read every on-screen string and compare it with the approved copy and brand words.
- Fail: garbled text, a misspelled brand or product word, a script the brand doesn't use.
- Review: plausible incidental text (street signs, UI).
- Pass only when every readable string is approved or explained.

**Audio-visual alignment.**
- Find each payoff beat's keyword in the word-level transcript.
- The matching visual must be on screen inside that word's window.
- Fail if a keyword is missing, two beats match the same word, or a window falls outside the video.

**Caption render check.**
- For each cue, grab a frame mid-cue (no later than 0.05 s before it ends).
- Read the frame; at least 60% of the cue's words of 4+ letters must appear.
- Fail any cue below that and keep its frame as evidence.

**Frame-claim check** (Phase 7d).
- Extract the frame: `ffmpeg -ss <t> -i <video> -frames:v 1 frame.jpg`.
- Text present or absent: read the frame and confirm.
- Visual claim: look at that frame and its neighbours yourself before keeping the claim.

**Concept landing.**
- Watch once before reading the brief. Write down hook, message, payoff, CTA and a one-line takeaway.
- Score each beat 0-10 against the brief: 10 restates it; 7-9 lands with drift; 4-6 half lands; 0-3 missed.
- Any beat below 8 gets a root cause: the scene and the asset (voice, caption or visual).

**Pacing and rhythm.**
- Find cuts with `select='gt(scene,0.4)'` and find the music beats.
- When the edit is cut to music, a cut more than 100 ms off the nearest beat is a P1.
- A scene over 4 s with almost no motion is drag. A calm hold that carries proof or reading time is not a defect.

**Brand fit.**
- Claims, captions, on-screen text and CTA match the approved claims and brand rules; no banned phrases.
- The real logo and wordmark only, never AI-rendered.
- Colours and type match the brand kit.

**Platform fit.**
- Aspect and size match the destination (1080×1920 for 9:16) and the length fits the placement.
- Text and faces sit inside the safe area; nothing collides with platform UI.
- The first frame reads without sound.

**UGC shotcraft.**
- Count real picture cuts (cuts per 10 s) and direct-face time share (union of face intervals over the full runtime; close-ups count).
- Compare only with targets the brief or recipe agreed. There is no universal quota.
- Each shot's action finishes, the feature is visible while discussed, new text holds long enough to read, and each cut moves the story.

**Hook strength.**
- Watch the first 3 s muted, then with sound.
- Muted: would you keep watching? Score frame-1 readability, subject clarity and motion legibility (1-10).
- With sound: does the audio hook on its own, and do sound and picture agree?
- Below 7 on either pass: re-roll scene 1 motion, replace the opening line, or move the strongest 3 s to the front.

**Synthetic persona.**
- Watch in the voice of the brand's documented buyer persona; confirm it with the operator and never invent one.
- Answer: keep scrolling at 3 s? Where does attention drop? Would they share or act? Which objections does the ad answer?
- The result is a hypothesis, not a measured outcome.

**Voice authenticity** (all spoken formats, including real recorded voice).
- Listen at 1.0× to the isolated takes. GooseWorks checks the final's words when you report complete.
- Judge intelligibility (exact words, word endings, masking), phrasing, pace and intent, emphasis, and continuity (timbre, room tone, level, breaths).
- Check every join with the phrases on either side. Re-perform only the affected phrase.

## Quality Checks

- Review read the complete frame evidence (not just the storyboard).
- Per-scene notes exist for every scene.
- Every issue has a diagnosis and explicit concept/script, production, sequence edit or local repair route; unresolved taste has alternatives and a decision owner.
- Original source identity, received message and stage-specific decision are recorded. A technically clean incoherent cut remains NEEDS REVISION.
- Scores describe predicted quality only; no audience-performance claim follows from them.
- Every P0/P1 issue has `claim:verified` status from Phase 7d. Unverified claims are not eligible to gate status.
- Status is set unambiguously (APPROVED, NEEDS REVISION or INCOMPLETE).
- Note file is saved under `review-notes/` with `<idx>-<timestamp>.md` naming.
- Brand-aesthetic violations are called out explicitly.

## Failure Modes

- Reviewer summarizes the design-brief instead of actually watching the file.
- Vague feedback ("the pacing feels off") with no actionable fix.
- Issues raised but no priority — operator can't tell what to fix first.
- Reviewer is too generous on P0 because the project has cost a lot already.
- Status is "APPROVED with minor changes" — there is no such status; pick one.
