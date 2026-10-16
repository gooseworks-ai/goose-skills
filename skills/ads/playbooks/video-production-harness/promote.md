---
name: video-production-harness/promote
description: Record a labeled candidate master or select a checked final through the host's version transaction, preserving every prior version with its label, reason, checksum and lineage. Supports rollback.
---

# Human version

Keep accepted versions and experiments distinct. Select or restore an exact checked candidate through the host, keeping its notes, sources and earlier versions.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract. Use [the editorial review guide](references/editorial-review.md) for source binding and edit history.

## Purpose

The binding supplies paths and the selection transaction; there is no `promote` command. Per-scene assets use [edit-clip.md](edit-clip.md); this step owns project-level lineage.

Use it for each new candidate, final selection, rollback or labeled experiment.

## Inputs

- `<video_folder>`.
- `<candidate_path>`: for example `edits/master-final-v5.mp4`, or `_archive/master-final-v4.mp4` when reverting.
- `<version_label>`: unique in the project (for example `v5-xfade`, `v4-restored`).
- `<reason>`: one line.

## Workflow

1. Load the manifest, feedback and current selection. Resolve candidate and accepted ids explicitly; never infer the final from the newest file. A note on an older render stays bound to it. Check that the source lineage and editable timeline, stems and captions are recoverable.
2. Create the labeled candidate through the binding, probe its real bytes and compute its checksum. Refuse empty, temporary or unsupported files.
3. Keep the prior version, its provenance, review evidence and selection. Never overwrite prior bytes or lineage.
4. Register the candidate asset, render and version with ids, duration, checksum, source and change summary. Validate every cross-reference.
5. A candidate may be reviewed before delivery; it is not a delivered final. Selecting a final needs the current script and ingredient approvals, a complete final check on this exact export and checksum, owned confirmed media and completion evidence. A parent master's check never clears a changed ratio, duration, language or caption burn. **Open review notes, and changed but unverified notes, block selection.**
6. Select or demote through the host's real transaction. If it is unavailable, record the candidate and the blocker; never imitate it with a local copy.
7. A rollback records the exact earlier version id, checksum, sources and reason, and never deletes the superseded version.

## Quality checks and failure modes

- Real playable bytes were probed; the checksum matches the selected artifact; every reference resolves to the same project and organization.
- Prior bytes, note bindings and the candidate-versus-accepted distinction survive selection and rollback.
- Missing or empty candidate: fail before recording success.
- Label collision: use a fresh id; never overwrite history.
- Provider hotlink or unconfirmed upload: keep it as a candidate only.
- Stale approval: save the blocker and return to the affected owner gate.
- A host's minimum check never replaces the full final check.
