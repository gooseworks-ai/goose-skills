---
name: video-production-harness/promote
description: Promote a candidate master (e.g. master-final-v5.mp4) into the active slot (master-final.mp4), archiving the prior master under _archive/ with a version label and reason. Preserves prior versions and supports the host rollback transaction.
---

# promote

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

Record a labeled candidate or select a checked final through the host's real version transaction. Preserve prior bytes, checksum, provenance, review evidence and the reason for every version. The binding supplies storage paths and selection commands; this file does not define a `promote` executable.

## When to use

- A candidate is produced after assembly/polish/captions.
- A human chooses a validated final or rolls back to a prior version.
- An experiment needs its own labeled candidate while preserving the selected version.

Per-scene assets use `edit-clip.md`; this step owns project-level final lineage.

## Inputs

- `<video_folder>` — the ad's working directory.
- `<candidate_path>` — relative or absolute path to the candidate MP4 (e.g. `edits/master-final-v5.mp4` or `_archive/master-final-v4.mp4` when reverting).
- `<version_label>` — short label written into `meta.json` (e.g. `v5-xfade`, `v4-restored`). Must be unique within the project.
- `<reason>` — one-line free-text rationale ("operator preference over v5", "first stitch after caption pass", etc.).

## Workflow

1. Resolve save/upload/promote through the selected binding. Create a labeled candidate, probe its real bytes and compute a checksum. Refuse empty, temporary or unsupported video files.
2. Preserve the prior version, asset/provenance, review evidence and selection before recording a replacement. Never overwrite prior bytes or lineage.
3. Register the owned candidate asset, render output and version with IDs, duration, checksum, source and change summary. Validate all cross-references.
4. A candidate can appear for review before delivery; it is not a successful delivered final. New final selection requires the exact current human approvals, complete shared QC, owned confirmed media and immutable completion evidence.
5. Use the host's actual final selection transaction to select/demote versions. If this edge is unavailable, record the candidate and blocker; do not imitate it with a local copy.
6. A rollback chooses an existing validated version while preserving lineage; it never deletes the superseded version. If new approval revisions require a fresh completion record, honor that host contract.

## Output

A registered labeled candidate or selected final, owned media/provenance, preserved prior versions and a true saved state. The binding supplies the actual paths/IDs/transaction.

## Quality Checks

- Real playable bytes and valid video/audio streams were probed.
- The candidate checksum matches the uploaded/selected artifact.
- Prior bytes and immutable version lineage are preserved.
- Final selection has complete current approvals and shared clip/final evidence; a backend minimum check never replaces the production suite.
- Every reference resolves to the same project and organization through the binding.

## Failure Modes

- Missing/empty candidate: fail before recording success.
- Archive/version label collision: use a fresh ID and checksum; never overwrite history.
- Provider hotlink or unconfirmed upload: preserve as a candidate only, not a selected owned final.
- A stale approval or revision: save the blocker and return to the affected human gate.
- Re-selecting the current final: idempotent no-op, preserving history.
