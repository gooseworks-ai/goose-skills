---
name: video-production-harness/review-video
description: Review the exact selected cut through actual moving picture and heard sound, compare it with the creative contract and write timestamped findings with honest coverage and current-file evidence.
---

# Human version

Review the exact cut at its current stage, record what a viewer receives and route each defect to the smallest useful repair. Complete audiovisual perception, content-derived duties and exact-file evidence remain explicit; technical cleanliness cannot approve a confused or broken video.

---

# Agent version

## Host contract

Follow [creative contract and review](references/creative-contract-and-review.md) for complete AV coverage, content-derived duties, failed-clip exclusion and exact-file evidence.

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation. Read [the editorial review guide](references/editorial-review.md) for source binding, stage decisions, note disposition, impact checks and saved edit history.

## Purpose

Independent QA pass on a video cut. Acts as a fresh-eyes reviewer — runs the full suite of specialized review responsibilities, aggregates their findings, and produces a structured review document with prioritized issues and proposed fixes (each fix routes to concept/script, production, sequence edit or local repair according to its cause).

Use the stage-specific questions in [the editorial review guide](references/editorial-review.md). Diagnose promise/payoff and sequence problems before dispatching repairs. Prepare authorized cheap alternatives before an unresolved taste decision.

This skill never edits the video. It only writes notes. The aggregate review-notes file is written in the contract that `auto-fix-from-review-notes` consumes, so the orchestrator can deterministically apply P0/P1 items in the NEEDS REVISION branch.

## Review suite (parallel dispatch)

Stage 8 combines supporting technical evidence, content review, claim verification and complete AV review. Responsibility names are not executable commands; use actual capable reviewers and preserve each result separately.

**Phase 7a — supporting measurements and verified content observations:**
- Run `python3 scripts/qc_evidence.py VIDEO.mp4 EVIDENCE_DIR` for the real probe, 2 fps frame set, decoded audio and loudness/tail diagnostics. Separately measure per-scene RMS with FFmpeg astats and compare cut timestamps against actual word timings; the helper does not claim to perform those comparisons.
- Frame `sample_center_s` labels are nominal review slots, not exact source times. Use the measured `source_pts_s` to identify the sampled bytes; resampling can duplicate a source frame. Verify caption boundaries, transitions and other timed claims with independent seeks and decoded frame timestamps in Phase 7d.
- **Visual hallucination check** (on-screen text against approved copy — **visual** hallucinations)
- **Transcript check** — transcribe actual final audio and compare accepted words/joins, including insertions and excess replacement phrases. Corroborate anomalies against heard audio; ASR may hallucinate in silence. A high aggregate match cannot clear babble, poor delivery/pronunciation or perceptual sync.
- **Identity and character check** (face strip against the locked anchor, plus wardrobe / accessories / hair across scenes)
- **Audio-visual alignment** (payoff lines land on payoff visuals)
- **Content-derived person/world duties**, including concept_format other when applicable:
  - **Cross-cut identity verdict** with the locked anchor as the baseline. Catches "different person in scene 7". Persist findings to `review_issues`.
  - **World consistency** — set / wardrobe / lighting / color-grade / props across cuts. Reads the `world_lock:` block from design-brief and `world_locks` from State 3.55.

Every check is defined under "Check rubrics" below. They are checks you run with real frames, audio and FFmpeg, not skills to fetch.

**Phase 7b — content (required applicable duties; optional taste questions):**
- **Concept landing** (intended vs received beats)
- **Pacing and rhythm** (cut-vs-beat alignment)
- **Brand fit**
- **Platform fit**
- **Creator shotcraft when applicable**, independent of the genre enum:
  - **UGC shotcraft** — inspect actual shot choices, proof/reading windows and joins against approved intent. Compare actual picture cuts and time-based direct-face share (including close-ups) with the current plan; count fractions and motion diagnostics stay distinct. Use explicit agreed recipe targets only, never universal cut/face quotas. Apply this rubric with actual timeline/media tools even when no separate reviewer package is installed.
- **All speech:** hear actual isolated takes and the entire final mix for words, pronunciation, delivery, joins, endings, timbre and unwanted sounds. Watch depicted speaking mouths with the exact driver/source alignment; missing listening/motion is incomplete, not delegated implicitly to a backend score.
- NOTE: the hook-strength and synthetic-persona checks ran earlier in State 7.5 (scroll-test gate). Re-run here only on revision passes or if first-stitch is bypassed.

**Required content gate (all formats).** APPROVED requires current exact-file
content_review with all applicable duties complete and no required unresolved defect.
Enable identity/world/product/action/voice/lip-sync/text/sound duties from actual
planned and observed content, not only concept_format. Use the calibrated rubric in
[libraries, look and rubric](references/libraries-look-and-rubric.md). No aggregate
score can clear wrong product/scale, missing demonstration, impossible action,
unusable speech, broken sync or unreadable essential copy. Missing AV capability
sets INCOMPLETE; an observed defect sets NEEDS REVISION.

Keep file validity, reproducibility, source alignment, perceptual performance and
owner choice distinct. Native clock checks do not prove generated phonemes. Record
current source/final hashes and reviewed intervals in quality_report.content_review.

**Phase 7c — aggregate:**
- Merge all applicable responsibility findings into review notes; record pass, needs_revision or incomplete per dimension with actual intervals, evidence and capability. Optional taste scores are separate and exist only where actual review supports them.

**Phase 7d — claim verification (deterministic, required):**
- Every visual claim MUST include a `timecode:` field. Re-extract the actual frame at that timestamp with FFmpeg, inspect it and neighboring frames, and confirm or reject the claim against those bytes.
- Each verified claim is tagged `claim:verified`. Unverified claims become `claim:unverified` and are filtered OUT of the aggregate (don't gate ship on hallucinated findings).
- Status APPROVED requires every required review responsibility to be complete and every aggregate P0/P1 to be verified and resolved. A missing or unreadable evidence set blocks approval; removing an unsupported claim does not complete its underlying check. Reviewers have a track record of false visual reports — v03 round 14 (captions "rendered" when frames showed none), v03 round 11 (EXAMPEL typo missed).

### Phase 7e — complete watch (required)

Watch the complete exact output at normal speed with sound, including all joins and ending. Hear isolated speech where available and the full mix; add source-resolution motion/mouth inspection around suspect ranges. Read the helper's timed frames as support, not continuous-watch or listening proof. Save output_sha256, creative_contract_revision, timeline_revision, source/performance IDs, reviewer capability and covered/gap ranges. Missing required perception remains incomplete. Review every final ratio/cutdown after its own crop/caption/mix changes.

## Inputs

- `<video_folder>` (required)
- `<video_path>` — explicit cut resolved from the host review selection or source note; record render/version ID and checksum. On a first cut use the newly registered candidate. Never fall back to a different master or thumbnails when a watched source is missing.
- `<stage>` — concept, rough, fine or final; record which decision this review can clear. Concept reviews cannot claim watched-cut evidence.
- `<review_idx>` — optional sequence number; if omitted, auto-increment based on existing files in `review-notes/`

## Workflow

1. Branch by stage. Concept review records supported/unsupported promise from current facts, with no claimed playback. For rough/fine/final resolve exact bytes and perform complete AV observation before comparing the intended story. Record received message, proof/payoff/action and uncertainties with timestamps; prior brief knowledge is context-aware, not a fabricated fresh viewer.
For concept-only review, record its supported/unsupported promise and decision, then continue at strengths/issues/status below; do not run cut-dependent Steps 3–7 or claim their verdicts.

2. Then read `<video_folder>/design_brief`, `<video_folder>/implementation_brief`, `<video_folder>/locked_script` and current brand evidence. Compare the received message with the intended story; save mismatches even if every technical check passes.
3. **Run every applicable Phase 7a responsibility** — save the measured or rubric evidence in a working check list. Every visual finding includes its timecode and actual frame path.
4. **Decide Phase 7b set** — by default run concept-landing + pacing-rhythm + brand-fit + platform-fit (hook-strength + synthetic-persona already ran in State 7.5). Apply the selected rubrics and collect their actual evidence.
5. **Run Phase 7d** — verify each claim against the actual frame and record verified, rejected or incomplete. Exclude rejected claims; block approval on incomplete required checks.
6. Perform the focused complete AV follow-up, using targeted frame/audio evidence for suspicious ranges. Capture:
   - Total runtime
   - Per-scene observations the atoms missed
   - Overall feel / coherence
7. Record each applicable content dimension from [libraries, look and rubric](references/libraries-look-and-rubric.md) as pass, needs_revision or incomplete. Optional observed taste scores may supplement these axes, without averaging away a blocker:
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
| Borderline or unclear identity | — | incomplete until motion/reference inspection resolves it |
| Verified identity drift in a scene | — | repair the affected source; preserve good unrelated material |
| Verified different person overall | — | needs_revision; use qualified identity repair |

**World consistency.** Compare full-frame scene views against the relevant continuing world and inspect complete motion/cuts: set, wardrobe, lighting/reflections, grade, props, product geometry and time. A midpoint grid is supplemental. Name exact breaks and distinguish planned locations/changes. Use content-derived status; a mean score cannot clear a disappearing fixture or missing review.

**Visual hallucination check.**
- Use overview frames plus complete moving-picture review and targeted source-resolution evidence at suspicious intervals; sampling density alone is not acceptance.
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
- Read the actual complete approved cue in its intended reading window and compare exact words, spelling and placement; OCR heuristics alone cannot approve missing essential copy.
- Mark unreadable/missing/mistimed essential cue content needs_revision and retain exact-frame/interval evidence.

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
- When the approved edit deliberately targets a musical beat, compare cuts with that cue and actual heard rhythm; a fixed 100 ms rule is diagnostic only, not universal acceptance.
- Diagnose holds from their information/action/reading/proof purpose. Deliberate calm can be valid; unintended dead air, resets and redundant shots need revision.

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
- Listen at 1.0× to every isolated take where available and the complete final mix. Missing audio perception remains incomplete, even when technical/transcript checks pass.
- Judge intelligibility (exact words, word endings, masking), phrasing, pace and intent, emphasis, and continuity (timbre, room tone, level, breaths).
- Check every join with the phrases on either side. Re-perform only the affected phrase.

## Quality Checks

- Review covered complete actual moving picture and sound, with supporting timed-frame evidence and explicit missing duties/ranges.
- Per-scene notes exist for every scene.
- Every issue has a diagnosis and explicit concept/script, production, sequence edit or local repair route; unresolved taste has alternatives and a decision owner.
- Original source identity, received message and stage-specific decision are recorded. A technically clean incoherent cut remains NEEDS REVISION.
- Scores describe predicted quality only; no audience-performance claim follows from them.
- Every blocking issue is verified against actual picture/audio evidence and exact time/range, or attributed user feedback. Unsupported findings do not become blocks, but their removal cannot clear an unperformed required duty.
- Status is set unambiguously (APPROVED, NEEDS REVISION or INCOMPLETE).
- Note file is saved under `review-notes/` with `<idx>-<timestamp>.md` naming.
- Brand-aesthetic violations are called out explicitly.

## Failure Modes

- Reviewer summarizes the design-brief instead of actually watching the file.
- Vague feedback ("the pacing feels off") with no actionable fix.
- Issues raised but no priority — operator can't tell what to fix first.
- Reviewer is too generous on P0 because the project has cost a lot already.
- Status is "APPROVED with minor changes" — there is no such status; pick one.
