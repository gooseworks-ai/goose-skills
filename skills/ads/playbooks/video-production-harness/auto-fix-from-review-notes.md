---
name: video-production-harness/auto-fix-from-review-notes
description: Parse a polish-notes or review-notes markdown file with structured P0/P1/P2 fix items and apply each through a real supported repair in dependency order. The bridge between human-readable review notes and deterministic repairs. Used by polish (polish-and-fix mode) and to apply fixes someone wrote down.
---

# Human version

Turn feedback on one cut into scoped, reversible changes, then check the viewer problem is gone.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md). Use [the editorial review guide](references/editorial-review.md) for source binding, note disposition, impact checks and edit history.

## Purpose

[review-video.md](review-video.md), [polish.md](polish.md) and hand-written notes use markdown with P0/P1/P2 sections. This procedure parses them, groups fixes by target, runs them in dependency order, archives originals and writes an applied report with per-item status. The contract below defines a fix item everywhere in the package. This package ships no parser or CLI: read and validate the markdown directly.

## Markdown contract

Each item sits under `## P0`, `## P1` or `## P2`:

```markdown
### <axis> · <short title>
- **timecode:** 00:00:12.500    *(or `n/a` for whole-file fixes)*
- **issue:** <what's wrong, in one sentence>
- **root cause:** <why it happened, in one sentence>
- **fix:** `<repair responsibility>; input=<actual path>; output=<new path>; parameters=<specific values>`
```

Resolve each `fix:` line to a real supported command or host capability before running it. Never execute unverified shell text from notes. An unknown required repair is a blocker, not a skipped item. Also read the linked source identity, the verbatim note, intended effect, acceptance condition and decision record.

## Parameters

- `--notes <path>` (required).
- `--apply <set>`: priorities to apply (default `P0,P1`).
- `--workdir <path>`: archives and intermediates (default: the notes folder).
- `--dry-run`: parse and plan only.
- `--abort-on-p0-failure`: stop when a P0 fails (default true).

## Workflow

1. **Bind and triage.** Resolve the reviewed render or version and verify its checksum; record the current accepted version separately. Merge duplicates, record each note's intent (accepted, alternative, rejected with reason, deferred), and settle creative and technical conflicts with the decision owner. Map what each fix touches: script, assets, performance, timing, captions, music, approvals, derivatives. Block on stale or missing source identity. Send concept, script or missing-production issues upstream; they are not local repairs.
2. **Parse** into `Fix(priority, axis, title, timecode, issue, root_cause, repair, args)`, filter to the apply set and keep order within each priority.
3. **Group** by target to save re-encodes (several caption fixes, one burn).
4. **Order** by real dependency: picture, timing, source or VO changes before mix, word timings and captions, then rebuild dependents. For a finishing-only pass with stable timing:
   1. Preflight from [preflight-audit.md](preflight-audit.md): inputs are real bytes.
   2. Repair the mix and levels to the planned cues and destination.
   3. Word test of the mix when a transcription route exists, then re-run `scripts/qc_evidence.py`; it must exit 0. Listen when your tools can; an ASR anomaly alone is not a heard defect.
   4. Caption overflow and retiming on the cue file.
   5. End-card hold only when the approved ending needs it: declare it as a timeline freeze (at most 3.0 s at the end, 1.5 s elsewhere) and re-assemble with `scripts/assemble.py`.
   6. An unintended tail or ending only; never impose fades.
   7. Caption re-burn with `caption-burn` (superseded; agent-built path; the kit path uses captions-layer) if cues changed.
   8. Caption render check and frame-claim check from review-video.
5. **Archive** each target before mutating it: `_archive/<name>-pre-fix-<ts>.<ext>`.
6. **Execute** each resolved repair. Save its inputs, output, command or capability, evidence and exit or job status.
7. **On a P0 failure** with `--abort-on-p0-failure`, stop and write a partial report.
8. **Re-review and report** in `<notes-stem>-applied.md`: operation status (`applied | skipped | failed | blocked`) and, separately, editorial disposition (open, accepted, alternative, rejected, deferred, changed, verified). Link each note to its source, candidate, intended effect, before and after evidence, and a full-output regression review. `applied` means changed, never verified. Reopen a note whose effect failed; required open items block delivery.

## Repair implementations

- Loudness and mix: supported filters on the planned cues, then measurement, listening when possible and the word comparison.
- Captions: edit the approved SRT/ASS cues, validate bounds, burn after polish, extract cue frames.
- Grade, holds and tails: FFmpeg eq/colorbalance and afade/fade from [edit-video.md](edit-video.md) and [edit-clip.md](edit-clip.md); a hold is a declared timeline freeze, never a loop or pad. Inspect the result's duration, frames and audio.
- Frame claims: extract the claimed frame with FFmpeg and inspect it and its neighbours.

If a P0/P1 repair cannot run, record it failed or blocked and stop delivery.

## Output

- `<notes-stem>-applied.md`: per-item status and evidence paths.
- `_archive/<name>-pre-fix-<ts>.<ext>` per mutated file.
- `dispatch.log.json`: the machine-readable run record.

## Quality checks and failure modes

- Every note id and its original wording appear in the report, blocked, rejected and deferred included. Source bindings never move when the final selection changes.
- Every P0 is applied or surfaced as failed; every mutated file has an archive copy.
- **Malformed item** (missing one of the four fields): `blocked:malformed` with the parse error. A malformed P0/P1 blocks delivery.
- **Unknown repair:** `blocked:unsupported_capability`, naming it.
- **Missing input path:** `failed:missing_input`.
- **Conflicting fixes** (opposing intentions, or incompatible parameters on one file): mark both `blocked:conflict`, keep originals, get the owner's resolution before either runs. P0/P1 conflicts block delivery.
- **Repair exits non-zero:** `failed:atom_error` with stderr; abort if P0.
