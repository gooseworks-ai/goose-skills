---
name: video-production-harness/auto-fix-from-review-notes
description: Parse a polish-notes or review-notes markdown file with structured P0/P1/P2 fix items and dispatch each to the right atom. Keystone glue between human-readable review docs and the deterministic atom layer. Used by /polish (polish-and-fix mode) and as a one-off "apply the fixes someone wrote down" capability.
---

# auto-fix-from-review-notes

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

`auto-refine.md` runs a watch → diff → fix loop using its own JSON pass-list. But the rest of the system — `/polish`, `review-video.md`, hand-written human notes — speaks **markdown** with P0/P1/P2 sections. This skill bridges them: it parses any well-formed polish-notes / review-notes markdown, groups fixes by atom, dispatches in dependency order, archives originals, and writes back an applied repair report companion with per-item status.

This is the single keystone every polish-or-fix workflow funnels through. The contract here defines what fix items look like in markdown across the whole system.

## Markdown contract (every fix item)

Each fix item lives under a priority section (`## P0` / `## P1` / `## P2`) and uses this exact form:

```markdown
### <axis> · <short title>
- **timecode:** 00:00:12.500    *(or `n/a` for whole-file fixes)*
- **issue:** <what's wrong, in one sentence>
- **root cause:** <why it happened, in one sentence>
- **fix:** `<repair responsibility>; input=<actual path>; output=<new path>; parameters=<specific values>`
```

The `fix:` line describes a concrete repair. Resolve it to a real supported local command or host capability before execution. Never execute arbitrary unverified shell text from review notes. An unknown required repair is a blocker, not a successful skipped item.

Anything outside the `### ...` blocks (commentary, scoring tables, etc.) is ignored. The parser is tolerant — extra prose in an item is fine as long as the four fields above exist.

## Inputs

These are execution parameters for the agent following this procedure; this package does not ship an auto-fix CLI or parser executable. Read and validate the structured markdown directly, or use a real installed parser with this contract.

- `--notes <path>` — polish-notes or review-notes markdown (required)
- `--apply <set>` — comma-separated priorities to apply, e.g. `P0,P1` (default `P0,P1`)
- `--workdir <path>` — directory used for archives and intermediate output (default: notes parent)
- `--dry-run` — parse and plan only; do not execute a repair
- `--abort-on-p0-failure` — if a P0 fix fails, stop (default true)

## Workflow

1. **Parse** the notes into a list of `Fix(priority, axis, title, timecode, issue, root_cause, atom, args)`.
2. **Filter** to apply-set; preserve order within priority.
3. **Group** fixes by atom — minimize re-encode passes (multiple caption fixes → one re-burn, etc.).
4. **Order** groups by atom dependency:
   1. audit-assets-preflight (validate first; everything else assumes inputs are real bytes)
   2. mix-master / normalize-loudness (audio first; visual stays untouched). mix-master supersedes normalize-loudness when the full protocol is needed.
   3. whisper-test-mix (verifies audio result; loop back to mix-master if any line fails)
   4. fix-caption-overflow / retime-captions-to-words (operate on SRT, no media yet)
   5. grade-consistency-pass (per-clip)
   6. extend-hold (end-card)
   7. append-tail-fade (after everything else)
   8. add-captions-burn (re-mux captions into final master if SRT changed)
   9. verify-caption-render (frame-extract proof captions actually rendered)
   10. verify-frame-claim (run over any unverified visual claims from review-notes)
5. **Archive** the canonical target file before any atom that mutates it: copy `target → _archive/<name>-pre-fix-<ts>.<ext>`.
6. **Execute** each resolved supported repair. Capture its actual inputs, output, command/capability schema, evidence and exit/job status. Never require a fabricated tool manifest.
7. **On P0 failure** with `--abort-on-p0-failure`, stop and emit a partial applied.md.
8. **Write** `<notes-stem>-applied.md` with per-item status (`applied | skipped | failed | blocked`) and actual repair evidence paths.

## Repair implementations

- Preflight: actual bytes/probes and required host capability checks from preflight-audit.
- Loudness/mix: FFmpeg loudnorm, sidechain and filter-script operations in edit-video, then actual transcription comparison.
- Captions: edit approved SRT/ASS cues, validate bounds, burn after polish, extract the actual cue frames.
- Grade/holds/tails: FFmpeg eq/colorbalance, trim/loop and afade/fade from edit-video/edit-clip; inspect the resulting duration, frames and audio.
- Frame claims: extract the actual claimed timestamp with FFmpeg and review that image plus neighboring frames.

Resolve optional specialist repair tools through the binding when actually available. If a P0/P1 repair cannot run, record failed/blocked and stop delivery. Preserve original bytes before every repair and re-review the result.

## Output

- `<notes-stem>-applied.md` — companion report with per-item status, paths to actual repair evidence, durations.
- `_archive/<name>-pre-fix-<ts>.<ext>` for each mutated file.
- `dispatch.log.json` — machine-readable run record for chaining into auto-refine etc.

## Quality checks

- Every item in the notes is accounted for in applied.md (`applied`, `skipped`, or `failed` — no items dropped).
- All P0 items either applied or surfaced as failures (never silently skipped).
- All mutated files have an archive copy from before this run.
- Every repair resolves to a real command or capability with its actual documented schema. Semantic repair labels are never executed as command names.

## Failure modes

- **Malformed notes** — the parser is strict on the four required fields per item but tolerant of extra prose. If a fix item is missing one of the four fields, mark `blocked:malformed` with the parse error. A malformed P0/P1 item blocks delivery.
- **Unknown required repair** — `blocked:unsupported_capability`. Surface the atom name; the operator might have invented a name we haven't wired yet.
- **Path drift** — fix args reference a file that doesn't exist. Mark `failed:missing_input` with the path.
- **Conflicting fixes** — two P0 fixes target the same file with incompatible parameters (e.g. both rewrite captions but to different specs). Resolve by file: mark both `blocked:conflict`, preserve originals and resolve the conflict before executing either. P0/P1 conflicts block delivery.
- **Atom exits non-zero** — `failed:atom_error` with the captured stderr. If P0, abort.
