---
name: video-production-harness/polish
description: Final-mile polish pass on an approved cut. Reviews the master with sound (or measured evidence), runs the final measurements and proposes prioritized polish notes (loudness, VO intelligibility, captions, music/VO balance, end card, tail, hook, colour, brand fit). `polish` writes the proposal only; `polish-and-fix` also applies P0+P1 via auto-fix-from-review-notes.
---

# Human version

Finish the approved edit without changing its direction: fix objective problems in the mix, captions and ending once, then check the new export.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract, [creative contract and review](references/creative-contract-and-review.md) and [check severity](references/check-severity.md). Use [the editorial review guide](references/editorial-review.md) for source binding, note disposition and edit history.

## Purpose

After [review-video.md](review-video.md) approves the fine cut, polish fixes the small objective problems (loudness, caption overflow, end-card hold, music over voice, an abrupt tail) in one round, then stops. It is not a creative review and not a loop (that is [auto-refine.md](auto-refine.md)). Never run it while review-video says NEEDS REVISION.

## Inputs and modes

- `<video_folder>` (required).
- `<mode>`: `polish` (default) writes `polish-notes/<idx>-<ts>.md` and touches no video file. `polish-and-fix` (State 9) writes the proposal, then applies every P0 and P1 through [auto-fix-from-review-notes.md](auto-fix-from-review-notes.md). P2 items are listed, never applied automatically.
- `<target>`: default `<video_folder>/edits/master-final.mp4`.
- `<polish_idx>`: optional; otherwise auto-increment from `polish-notes/`.

## Polish axes

Each finding has one axis. Repairs resolve to real FFmpeg or host capabilities in `capabilities.md` and [edit-video.md](edit-video.md).

| Axis | Check | Repair |
|---|---|---|
| audio-loudness | Integrated LUFS within ±0.5 of target (default -14 social); true peak under -1 dBTP. | Two-pass `loudnorm=I=-14:TP=-1.5:LRA=11` |
| vo-intelligibility | Speech sits clearly above music and effects in every dialogue window; `scripts/qc_evidence.py` exits 0. A word score alone never approves delivery. | Measured per-line mix correction or re-perform the affected line |
| captions-overflow | Readable at destination size; over 2 lines of 38 characters is a prompt, reading time decides. | Split at phrase breaks; keep words and timing |
| captions-timing | Cue starts within ±100 ms of its word. | Snap to the first word |
| music-vo-balance | Masking or pumping in dialogue windows, measured; keep the approved audio plan. | Measured cue gain or sidechain |
| end-card | Copy readable at phone size for at least 1.5 s; logo and CTA contrast meet WCAG AA (4.5:1, 3:1 for large text); brand-quality design. | Declare an end-card freeze in the `assembly_timeline` (at most 3.0 s, at the end only) and re-assemble with `scripts/assemble.py`. A rebuilt card uses the approved design with deterministic logo and text. |
| final-tail | The ending matches the approved fade, hold or silence; no chopped speech or accidental gap. | Planned tail repair only |
| pacing-performance | Only the approved timing and performance. No retiming or speed change of speech. | Escalate to edit |
| hook-frames | First 3 s: frame 1 readable, subject clear, motion legible. | Escalate (re-roll scene 1 via `edit-clip`) |
| color-consistency | Continuity against the approved look; keep intended lighting changes. | Escalate |
| brand-fit | Palette, approved logo, no banned phrases (as in review-video). | Escalate |

**Speech integrity is `must_fix`.** Lost or changed script words, and cut first or last words, are never delivered. When you report complete, GooseWorks checks the final's spoken words against the script (0.90 or better) and measures silence, gaps and freezes, and returns graded findings; fix the `must_fix` ranges it names. Rule out recognizer errors before re-recording. Silent or text-led work checks the planned soundtrack and reading time instead.

## Workflow

### 1. Inventory
Read `implementation_brief` (CTA, tone), `design_brief` (palette, character), `brand-vars.yaml` (tagline, end-card config), `captions/captions.srt` and `audio/word-timestamps.json`. Probe the target's duration, streams and fps.

### 2. Measure
- Run `python3 scripts/qc_evidence.py <target> <video_folder>/polish-notes/<idx>/qc --timeline <receipt>` and save its evidence.json (without `--timeline` it can't check the length, and it treats sound as planned). It exits 1 only on a broken file; its other measurements come back as `findings` with a severity.
- Measure per-scene RMS with FFmpeg astats and compare cut times with word boundaries (the helper does not).
- Score the end-card frames for legibility, hold, margins, contrast and design.
- With speech, transcribe the master (when a route exists) and diff it line by line against `locked_script`. Confirm each miss by listening when you can before calling it `must_fix`; rule out recognizer errors on brand names. Save `polish-notes/<idx>/qc/whisper-test.md` with per-line results and mix corrections.

### 3. Review the master with sound
Review the whole master at normal speed with sound when your tools can, and record `listened`/`watched`. Otherwise record `measured`: it is valid when `scripts/qc_evidence.py` exits 0 (the file is not broken), and its findings are graded by severity. Frames alone are never the review. Give each axis findings with a timecode and a one-line root cause, or say it is clean. Check captions at destination size, including product visibility and reading time. A caption change starts from the clean picture and burns once, never over old captions.

### 4. Propose
Write `polish-notes/<idx>-<ts>.md` in the exact contract of auto-fix-from-review-notes.

- **P0 = must_fix**: never delivered (a misspelled caption or brand word, a cut-off first or last word, a wrong or missing logo).
- **P1 = ask**: should fix (loudness over 1 LUFS off, unreadable or overflowing captions, a hard-cut tail, music over the voice, a short end-card hold). These repairs are free, so polish-and-fix applies them in either review mode.
- **P2 = fine**: nice-to-have (subtle colour drift). Listed, never applied automatically.

In `polish` mode, stop here and report the notes path with P0/P1/P2 counts.

### 5. Apply (polish-and-fix)
1. Keep a labeled pre-polish candidate (`_archive/master-final-pre-polish-<ts>.mp4`) before changing any bytes.
2. Follow auto-fix-from-review-notes in dependency order. Stop on an unsupported P0 (`must_fix`) repair; an unsupported P1 or P2 repair is recorded and reported, and the run goes on.
3. Bring the outputs back into the cut:
   - normalized loudness or an added tail fade (`afade=t=out`, `fade=t=out`) on the master is the new master;
   - split or retimed cues are saved; the final burn stays in State 10 (from an uncaptioned candidate);
   - an end-card freeze or any picture change re-assembles through `edit-video` and `scripts/assemble.py`.
4. The result is `edits/master-polished.mp4`.

### 6. Re-check
Run `scripts/qc_evidence.py` on the polished master (it must exit 0), the end-card check and the transcript diff. Review the whole new master with sound (or measured) and confirm each note's intended effect, words and mouths, product, action and ending. A changed note is not a verified note. Check every derivative on its own. Write `polish-notes/<idx>-<ts>-applied.md` with before → after: LUFS, verified locked lines, caption overflow count, end-card score, last-100 ms tail RMS, and length (near zero except an end-card freeze).

**Hard stop:** if a spoken line is lost on the polished master (`must_fix`), re-apply the mix fix; if it still fails, keep the pre-polish master as the candidate and tell the customer in one line. Don't deliver the polished master.

### 7. Report and continue
Show before → after on the candidate surface: LUFS, verified spoken lines, perception and covered ranges, notes verified, caption overflow, end-card score, length, and the candidate path.

Then follow [promote.md](promote.md) to record the polished candidate and its lineage (never overwrite the selected master) and go to State 10 for the caption burn and final check. Each variant gets its own burn and check.

## Output

- `polish-notes/<idx>-<ts>.md` (always) and `polish-notes/<idx>/qc/` evidence.
- `polish-notes/<idx>-<ts>-applied.md`, `edits/master-polished.mp4` and the archived pre-polish master (polish-and-fix only).

## Quality checks and failure modes

- `polish` mode never writes to `edits/`.
- Every item parses in the auto-fix contract; fix and re-emit any item it marks `malformed`.
- Every P0 is applied or surfaced as failed, never skipped silently.
- If no metric improved, say the pass was a no-op.
- A failed P0 repair: keep the original master, report the failure, stop.
- A polished master worse on any metric (for example loudnorm pumping into clipping): keep the pre-polish master as the candidate and fix or escalate.
- Re-assembly drift in captions or audio: when only captions changed, re-burn once with `caption-burn` (superseded; agent-built path; the kit path uses captions-layer) instead of re-running edit-video.
- A second run should find almost nothing; if not, the first did not fix things or the review invents problems.
