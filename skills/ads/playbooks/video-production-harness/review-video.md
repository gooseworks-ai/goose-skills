---
name: video-production-harness/review-video
description: Watch the latest cut with complete-video frame and audio review, evaluate it against the design-brief, and write a dated review-notes/[idx]-[timestamp].md with strengths, issues, and concrete fixes.
---

# review-video

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

Independent QA pass on a video cut. Acts as a fresh-eyes reviewer — runs the full suite of specialized review responsibilities, aggregates their findings, and produces a structured review document with prioritized issues and proposed fixes (each fix maps to `edit-clip`, `edit-video`, or one of the polish atoms).

This skill never edits the video. It only writes notes. The aggregate review-notes file is written in the contract that `auto-fix-from-review-notes` consumes, so the orchestrator can deterministically apply P0/P1 items in the NEEDS REVISION branch.

## Review suite (parallel dispatch)

Stage 8 has five phases. The names below identify review responsibilities, not executable commands. Run them sequentially or with available independent reviewers; preserve every check and its evidence. Phase 7d prevents unsupported visual claims, and Phase 7e requires a complete watch.

**Phase 7a — deterministic (run in parallel):**
- Run `python3 scripts/qc_evidence.py VIDEO.mp4 EVIDENCE_DIR` for the real probe, 2 fps frame set, decoded audio and loudness/tail diagnostics. Separately measure per-scene RMS with FFmpeg astats and compare cut timestamps against actual word timings; the helper does not claim to perform those comparisons.
- `review-video-hallucination-check` (OCR + brand allowlist — **visual** hallucinations)
- `review-video-transcript-integrity` (Whisper vs locked_script — **audio** hallucinations: silent-tail invented words, mid-word truncations at scene splits, dropped/substituted script lines). Required whenever speech is present; use the actual host quote or installed local engine.
- `review-video-character-consistency` (face-grid drift — wardrobe / accessories / hair across scenes)
- **UGC family only** (`concept_format ∈ {ugc-diary, testimonial, founder-led, before-after}`):
  - `review-video-identity-drift` — cross-cut identity check using the locked anchor as the baseline. Catches "different person in scene 7" — the failure mode that `character-consistency` is too forgiving of. Persist findings to `review_issues`.
  - `review-video-world-consistency` — set / wardrobe / lighting / color-grade / props consistency across cuts. Reads the `world_lock:` block from design-brief and `world_locks` from State 3.55.

**Phase 7b — creative (user toggles which to run; parallel):**
- `review-video-concept-landing` (intended vs received beats)
- `review-video-pacing-rhythm` (cut-vs-beat alignment)
- `review-video-for-brand-fit` (existing)
- `review-video-for-platform-fit` (existing)
- **UGC family only**:
  - `review-video-ugc-shotcraft` — cut density (cuts/10s) + face-share + intra-shot motion. Storyboard-level decisions that hide AI tells; reads `metrics.cuts_per_10s` and `metrics.face_share_planned` from `scene_contract` and compares to delivered cut.
  - `review-video-vo-authenticity` — synthetic-VO tell detection (breath sounds, pause variance, pitch jitter). Skipped if `voiceover_strategy: real_voice`.
- NOTE: `review-video-hook-strength` and `review-video-synthetic-persona` ran earlier in State 7.5 (scroll-test gate). Re-run here only on revision passes or if first-stitch is bypassed.

**UGC gate (overrides Phase 7c status when `concept_format` is in the UGC family):** APPROVED requires ALL of:
- `character-consistency` drift count == 0
- `identity-drift` same_person_score ≥ 9 AND continuity_break == false
- `world-consistency` score ≥ 8.5 AND no axis < 6
- `ugc-shotcraft` composite ≥ 7
- `vo-authenticity` verdict != synthetic (skipped if voiceover_strategy == real_voice)

Any one of these failing sets status to NEEDS REVISION regardless of other axes. This is a prior review v3 lesson: the standard 6-axis rubric scored that cut as shippable; the UGC-specific atoms would have blocked it. The aggregated gate verdict is persisted into `review_issues` and reflected in `project_state`.

**Phase 7c — aggregate:**
- Merge every atom's findings into a single `review-notes/<idx>-<ts>.md` using the markdown contract defined in `auto-fix-from-review-notes.md`. Score each axis (existing 6-axis rubric below) using per-atom outputs as evidence. Status: APPROVED or NEEDS REVISION (after Phase 7d gates).

**Phase 7d — claim verification (deterministic, required):**
- Every visual claim MUST include a `timecode:` field. Re-extract the actual frame at that timestamp with FFmpeg, inspect it and neighboring frames, and confirm or reject the claim against those bytes.
- Each verified claim is tagged `claim:verified`. Unverified claims become `claim:unverified` and are filtered OUT of the aggregate (don't gate ship on hallucinated findings).
- Status APPROVED requires every required review responsibility to be complete and every aggregate P0/P1 to be verified and resolved. A missing or unreadable evidence set blocks approval; removing an unsupported claim does not complete its underlying check. Reviewers have a track record of false visual reports — v03 round 14 (captions "rendered" when frames showed none), v03 round 11 (EXAMPEL typo missed).

### Phase 7e — complete watch (required)

Read the entire 2 fps frame sequence and listen to the complete actual audio; also obtain and compare the actual transcript for speech. Use a real player when available to check continuous motion, timing and perceived mix. Save observations for every scene and the first-to-last playback duration. A storyboard, clip thumbnails, metadata, or only a few frames cannot clear this gate.

## Inputs

- `<video_folder>` (required)
- `<video_path>` — path to the cut to review (default: `<video_folder>/edits/master-final.mp4`, falls back to `master-no-captions.mp4`, then `clip_review` if no master exists yet)
- `<review_idx>` — optional sequence number; if omitted, auto-increment based on existing files in `review-notes/`

## Workflow

1. Read `<video_folder>/design_brief`, `<video_folder>/implementation_brief`, and `<video_folder>/locked_script` to load the spec.
2. Read the current brand evidence (or equivalent) for brand rules.
3. **Run every applicable Phase 7a responsibility** — save the measured or rubric evidence in a working check list. Every visual finding includes its timecode and actual frame path.
4. **Decide Phase 7b set** — by default run concept-landing + pacing-rhythm + brand-fit + platform-fit (hook-strength + synthetic-persona already ran in State 7.5). Apply the selected rubrics and collect their actual evidence.
5. **Run Phase 7d** — verify each claim against the actual frame and record verified, rejected or incomplete. Exclude rejected claims; block approval on incomplete required checks.
6. Use complete-video frame and audio review to actually watch the video file (this is the reviewer's own first-pass watch — keep it focused on whatever the atoms didn't cover). Capture:
   - Total runtime
   - Per-scene observations the atoms missed
   - Overall feel / coherence
6. Score the cut on these axes (0–10 each, with one-sentence justification), pulling evidence from each atom's output:
   - **Hook strength** (does it stop the scroll in 2s?)
   - **Story clarity** (could a muted viewer follow the arc?)
   - **Brand fit** (does it match current brand visual rules?)
   - **Comedic / emotional landing** (do the punchlines land?)
   - **Technical polish** (cuts, sync, levels, captions)
   - **Platform fit** (9:16 safe area, opening frame, length)
5. List **strengths** (what to keep / lean into).
6. List **issues** ranked by severity:
   - **P0 blocker** — ship-stopper (e.g. VO inaudible, hero shot broken, screen leakage in a no-screens ad)
   - **P1 should fix** — meaningfully degrades the cut
   - **P2 nice-to-have** — polish
7. For each issue, propose a concrete fix in the markdown contract `auto-fix-from-review-notes` consumes:

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

8. Determine **next-pass status**:
   - **APPROVED** — review gate cleared → orchestrator advances to State 9 (Polish), then captions and final delivery QC.
   - **NEEDS REVISION** — list which P0/P1 issues must be addressed before next review. If every NEEDS REVISION item has a deterministic fix line (no `edit-clip`), the orchestrator may shortcut by calling `auto-fix-from-review-notes` directly instead of looping back to State 5/6.
9. Write `<video_folder>/review-notes/<idx>-<timestamp>.md` (e.g. a dated review record). Format below.

## Output document format

```markdown
# Review NN — <video name>

- **Cut reviewed:** <path>
- **Runtime:** <s>
- **Reviewer:** Claude (review-video skill)
- **Date:** <ISO timestamp>
- **Status:** APPROVED | NEEDS REVISION

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

## Issues

### P0 — blockers
- **<scene/area>**: <issue>. **Fix:** <skill call>.

### P1 — should fix
- ...

### P2 — nice to have
- ...

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

## Quality Checks

- Review actually used the complete-video evidence/watch capability (not just the storyboard).
- Per-scene notes exist for every scene.
- Every issue has a concrete fix mapped to `edit-clip` or `edit-video`.
- Every P0/P1 issue has `claim:verified` status from Phase 7d. Unverified claims are not eligible to gate status.
- Status is set unambiguously (APPROVED or NEEDS REVISION).
- Note file is saved under `review-notes/` with `<idx>-<timestamp>.md` naming.
- Brand-aesthetic violations are called out explicitly.

## Failure Modes

- Reviewer summarizes the design-brief instead of actually watching the file.
- Vague feedback ("the pacing feels off") with no actionable fix.
- Issues raised but no priority — operator can't tell what to fix first.
- Reviewer is too generous on P0 because the project has cost a lot already.
- Status is "APPROVED with minor changes" — there is no such status; pick one.
