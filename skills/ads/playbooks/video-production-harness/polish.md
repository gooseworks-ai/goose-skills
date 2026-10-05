---
name: video-production-harness/polish
description: Final-mile polish pass on a finished video. Watches the cut, runs deterministic QC, proposes polish-notes with prioritized fixes across the full polish axes (loudness, captions, music/VO balance, end-card, tail, hook, color, brand fit). Two modes — `polish` writes the proposal only; `polish-and-fix` also applies P0+P1 via auto-fix-from-review-notes.
---

# /polish

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

After `edit-video` produces `edits/master-final.mp4` and `review-video` says APPROVED, there's still a final mile: integrated loudness off-target, a few captions overflowing, end-card hold too short, music sitting on top of VO in one scene, hard cut at the end. These show up on every ad. /polish exists to handle them deterministically — one round of polishing touches, then it stops.

It is **not** a creative review skill (that's `review-video.md`). It is not an iterative loop (that's `auto-refine.md`). It is specifically the deterministic post-approval polish pass.

## When to use

- Right after `review-video` returns APPROVED.
- Right after `auto-refine` exits clean.
- Any time the operator says "polish this" / "tighten this up" without specifying issues.

Do **not** use if `review-video` is still NEEDS REVISION — fix creative issues first.

## Inputs

- `<video_folder>` (required) — the ad-run directory
- `<mode>` — `polish` (default; propose only) or `polish-and-fix` (propose + apply P0+P1)
- `<target>` — path to mp4 (default `<video_folder>/edits/master-final.mp4`)
- `<polish_idx>` — optional sequence number; if omitted, auto-increment based on existing files in `polish-notes/`

## Modes

- `polish`: read-only. Writes a `polish-notes/<idx>-<ts>.md` proposal and stops. No mp4 changes.
- `polish-and-fix`: writes the proposal, then calls `auto-fix-from-review-notes` to apply every P0 and P1 item. P2 items are listed but never applied automatically. Archives `master-final.mp4` before any mutation.

This contract is hard. /polish in `polish` mode MUST NOT touch any video file.

## The polish axes

Each axis maps to a repair or review responsibility. The labels below are not shipped executables; resolve them to the real implementations in `capabilities.md` and `edit-video.md`. The watch-pass is structured around these axes; every finding in polish-notes is tagged with one.

| Axis | What we check | Atom(s) used |
|---|---|---|
| audio-loudness | Integrated LUFS within ±0.5 of platform target (default -14 social). True-peak under -1 dBTP. | `normalize-loudness` |
| **vo-intelligibility** | Whisper transcribes every locked VO line correctly (zero substitutions/omissions). | actual transcript comparison → measured per-line FFmpeg mix correction |
| captions-overflow | Any cue with line > 38 chars, > 2 lines, or sub-0.6 s + >6 words. | `fix-caption-overflow` |
| captions-timing | Cue starts within ±100 ms of the matching word in word-timestamps. | `retime-captions-to-words` |
| music-vo-balance | Music RMS at least 6 dB below VO RMS in every dialogue scene. | `mix-master` (sidechain + boost) |
| end-card | Composite readability score ≥ 7. Hold ≥ 1.2 s. Logo/CTA contrast meets the agreed legibility target; text meets WCAG AA (4.5:1 ordinary text, 3:1 large text) when applicable. Brand-quality design (not generic gradient). | `score-readability`, then `extend-hold`; if regen needed, follow the approved brand design and deterministic logo/text composition. Use an installed supported browser renderer for motion chrome; use Pillow or FFmpeg for static compositions. New paid visual assets require the appropriate renewed gate. |
| final-tail | Last frame fades to black; last 100 ms RMS < -30 dB. Music must NOT end before video. | `append-tail-fade` |
| pacing-speedup | Podcast-clip-derived projects: master is sped 1.25–1.35× (default 1.30× — sweet spot for conversational male VO ~120Hz; ≥1.45× chipmunks). Speed locks at lock-script; this stage only verifies it was applied. | `speedup-master` (in `edit-video`); verify only here |
| hook-frames | First 3 s: frame-1 readable, subject clear, motion legible. (Diagnostic only — fix means re-rolling scene 1 via `edit-clip`.) | none (escalate) |
| color-consistency | Y-channel variance across clips ≤ 50% of initial. | `grade-consistency-pass` |
| brand-fit | Palette match, approved logo usage, no banned phrases. (Defers to `review-video-for-brand-fit`.) | none (escalate) |

**vo-intelligibility is a ship gate.** If Whisper can't transcribe a locked VO line, neither can a real viewer. This is the final check before `master-polished.mp4` can swap into `master-final.mp4`. Surfaced from v03 LEARNINGS as the only objective "is the mix actually good?" test.

## Workflow

### Step 1 — Inventory
Read these files from `<video_folder>`:
- `implementation_brief` (CTA, tone)
- `design_brief` (palette, character)
- `brand-vars.yaml` (tagline, end-card config)
- `captions/captions.srt` (existing captions)
- `audio/word-timestamps.json` (whisper output — required for captions-timing)

Locate `<target>` (default `edits/master-final.mp4`). Probe duration, audio streams, fps.

### Step 2 — Deterministic pre-flight
Run `python3 scripts/qc_evidence.py VIDEO.mp4 EVIDENCE_DIR` and inspect the evidence:
- Read the helper's real 2 fps frame set, probe, decoded audio and loudness/tail diagnostics.
- Extract additional actual frames at every cut; measure per-scene RMS with FFmpeg astats.
- Compare cut timestamps to actual word boundaries; the helper does not perform that comparison.
- Write the resulting review evidence, including the helper's evidence.json, into the dated polish QC directory.

Inspect the actual end-card frames and score legibility, hold, safe margins, logo contrast and brand design with the table above. Save the rubric score and recommendations; distinguish visual judgments from measured contrast values.

Run the actual transcription capability against the full master and perform the intelligibility comparison:
- Transcribes actual audio through an available host-managed transcription route or installed local engine. If neither is available, stop at this gate.
- Diffs the transcript against `locked_script`, line-by-line.
- Any meaningful locked-line substitution or omission = P0 finding tagged `axis: vo-intelligibility`.
- Output: `<video_folder>/polish-notes/<idx>/qc/whisper-test.md` with per-line pass/fail and specific per-line mix correction, with actual target level and timing.

### Step 3 — Watch pass
Read all extracted frames and listen to the entire decoded audio using the actual tools in `capabilities.md`. Apply this prompt template:

> You are reviewing a finished social-ad cut for a final polish pass. The creative is already approved — focus only on technical/objective polish. For each of these axes, list every issue you can identify with a timecode and one-sentence root-cause:
>
> 1. Audio loudness — does it feel too quiet, too loud, or inconsistent across scenes?
> 2. Captions — do any wrap to 3+ lines? Do any feel slightly mistimed against the VO?
> 3. Music vs VO — is the music too loud relative to the voice in any scene?
> 4. End-card — does the tagline/logo hold long enough? Is it legible against the background?
> 5. Final tail — does the video hard-cut or fade naturally?
> 6. Hook (0–3 s) — is frame-1 readable? Is the subject clear?
> 7. Color/grade — do any scenes look noticeably brighter, darker, or differently-colored than others?
> 8. Brand fit — any obvious unbranded elements, banned text, or logo errors?
>
> Be specific and pessimistic. If nothing is wrong on an axis, say so explicitly.

### Step 4 — Propose
Aggregate the deterministic pre-flight findings + watch-pass findings into `polish-notes/<idx>-<ts>.md`. **Use the exact markdown contract from `auto-fix-from-review-notes.md`** so it can be auto-applied. Each item has:

```markdown
### <axis> · <short title>
- **timecode:** 00:00:12.500
- **issue:** ...
- **root cause:** ...
- **fix:** `<repair responsibility>; input=<actual path>; output=<new path>; parameters=<specific values>`
```

Priorities:
- **P0** — must fix before delivery (loudness > 1 LUFS off; captions unreadable; hard cut tail)
- **P1** — should fix (mild caption overflow; slight music/VO imbalance; short end-card hold)
- **P2** — nice-to-have (subtle color drift; tweakable hold duration)

### Step 5 — Mode branch
- `polish`: stop here. Present the polish-notes path to the operator with a one-line summary of P0/P1/P2 counts.
- `polish-and-fix`: continue.

### Step 6 — Apply (polish-and-fix only)
1. Preserve a labeled immutable pre-polish candidate before changing any bytes.
2. Follow `auto-fix-from-review-notes.md` to resolve and execute supported repairs in dependency order. It is a procedure, not a packaged command. Preserve inputs, provenance and cost; stop on unsupported P0/P1 repairs.

3. Apply the atom outputs back into the cut. The dispatcher operates on individual files — /polish stitches the results together:
   - If `normalize-loudness` ran on the master → its output IS the new master.
   - If `fix-caption-overflow` / `retime-captions-to-words` ran → save corrected caption cues; final burn remains State 10. If reviewing a previously captioned delivered version, create a fresh uncaptioned candidate before reapplying final captions.
   - If `extend-hold` ran on the end-card clip → re-stitch with `edit-video` (Phases 1+2 only) to produce a fresh master.
   - If `grade-consistency-pass` ran on clips/ → re-stitch via `edit-video` (Phases 1+2 only).
   - If `append-tail-fade` ran → its output IS the new polished master.
4. Final result is `edits/master-polished.mp4`.

### Step 7 — Re-verify
Re-run the packaged evidence helper, actual end-card readability review, and actual transcript/mix comparison against the polished master. Write `polish-notes/<idx>-<ts>-applied.md` (extends the dispatcher's report) with before/after deltas:
- LUFS before → after
- **Whisper-test pass count before → after** (must be 100% after; if not, polish is NOT complete)
- Caption overflow count before → after
- End-card composite score before → after
- Final-tail last-100ms-RMS before → after
- Length delta (should be near zero except for end-card hold extensions)

**Hard gate:** if the actual transcript/mix comparison finds any failing line on the polished master, do NOT advance to Step 8. Re-apply the mix fix or escalate.

### Step 8 — Human gate
Print a summary to the operator:
```
Polish complete:
  LUFS:               -24.3 → -13.9 (target -14)
  Whisper-test:       8/13 passing → 13/13 passing  ✅ ship gate
  Caption overflow:   4 → 0
  End-card score:     4.25/10 → 8.0/10
  Length:             30.0s → 30.6s (+0.6s end-card hold)
Preview at: edits/master-polished.mp4
Approve (swap master)? [y/N]
```

On approval:
- Read `promote.md` and record the approved polished candidate/version through the binding; never overwrite the selected master directly.
- Proceed to the final caption burn and fresh actual final QC before delivery; export variants from those final bytes.

On rejection: leave `master-polished.mp4` in place for operator inspection; do not swap.

## Output

- `polish-notes/<idx>-<ts>.md` — proposal (always)
- `polish-notes/<idx>-<ts>-applied.md` — dispatcher report (polish-and-fix only)
- `edits/master-polished.mp4` — polished cut (polish-and-fix only)
- `_archive/master-final-pre-polish-<ts>.mp4` — pre-polish original
- `polish-notes/<idx>/qc/` — pre-flight artifacts (frames, qc_report.md)

## Quality checks

- `polish` mode never writes to `edits/`. Verify post-run.
- Every polish-notes item is in the markdown contract that `auto-fix-from-review-notes` can parse. If the dispatcher reports any `malformed`, /polish must fix its own output and re-emit.
- In `polish-and-fix`, every P0 either applied or surfaced as failed (never silently skipped).
- Pre-polish master archived before any mutation.
- Re-verification shows at least one metric improved; if no metric improved, the polish was a no-op and the operator should be told that.

## Failure modes

- **Watch pass returns generic feedback** — re-run with stricter prompt emphasizing "specific timecode required for every finding."
- **Dispatcher fails on a P0 atom** — /polish surfaces the failure, leaves the original master intact, does not advance to Step 8.
- **The polished master is actually worse on a metric** — e.g. loudnorm pumped a scene into clipping. Flag this in the applied.md, do NOT auto-swap; require human confirmation.
- **Re-stitch via `edit-video` introduces drift** — captions or audio shift. Mitigation: prefer single-pass `add-captions-burn` re-mux over a full `edit-video` re-run when only captions changed.
- **Idempotence:** running /polish twice should produce a second polish-notes file with near-empty proposal. If the second pass produces an equally heavy proposal, the first pass either didn't actually fix things or the proposer is hallucinating.

## Relationship to other skills

- `review-video.md` decides APPROVED vs NEEDS REVISION. /polish runs after APPROVED.
- `auto-refine.md` is a creative-and-objective iteration loop. /polish is a single deterministic polish round. They don't overlap — auto-refine handles the road from "first cut" to "good cut"; /polish handles "good cut" to "ready to ship."
- `auto-fix-from-review-notes.md` is the dispatcher this skill calls in `polish-and-fix` mode.
