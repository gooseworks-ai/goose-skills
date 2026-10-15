# Human version

Review the exact cut the viewer saw, decide what stops the message from landing, and make the smallest useful change. Keep the accepted cut, candidates and original notes separate. A change is done only when its effect and the whole new output are checked.

[[composes::review-video]] and [[composes::auto-fix-from-review-notes]] use the same evidence and history.

---

# Agent version

## Bind the review first

Read the binding's feedback, render_outputs, versions, project_state and manifest. For each note record its ID, verbatim text, the render/version it was given on, the time, the source checksum and the scene. Keep the accepted version and the candidate as separate references. A note stays on its original render; never use newest-file order or a mutable master alias. If an old note has only a path, keep those bytes. If the source cannot be identified, record a blocker. Re-check the checksum before executing. Extra detail goes in dated notes, never invented fields.

## Stage sets the question

- **Concept:** does the promise fit this buyer, product and truthful proof? A plan review is not a watched-video verdict.
- **Rough cut:** what does a fresh viewer understand, does each beat follow, does the payoff answer the hook?
- **Fine cut:** are performance, transitions, proof, pace, reading time and sound doing their jobs? Repair the smallest affected piece.
- **Final export:** does this exact file work at delivery size, with captions, mix and ending? Each derivative gets its own review.

First take the cut in end to end, before reading the intended story. Listen and watch the exact file when your tools can and record `listened`/`watched` only when that really happened; otherwise record `measured` from the final measurements. Save a short **received-message** note: what is offered, to whom, the hook's promise, visible proof, payoff and action, with uncertain moments by time. Then compare it with the brief. If you already know the brief, call it a context-aware first impression.

Follow [creative contract and review](creative-contract-and-review.md) for the evidence record. `../scripts/qc_evidence.py` must exit 0 on the exact file; missing evidence leaves the check incomplete. GooseWorks re-checks sound and spoken words when you report complete (see [capabilities](../capabilities.md)). Silent work confirms the planned soundtrack and reading time. File checks are not content approval.

## Diagnose before dispatch

Merge duplicates, keeping their IDs. For each critical finding record the observation, time, evidence, intended effect, cause, smallest route and acceptance condition.

| Cause | Route | Example |
| --- | --- | --- |
| Unsupported promise | Concept/script | Hook promises automation, body shows export: narrow the hook. |
| Missing proof or unusable performance | `create-clips` / `edit-clip` | Get the shot that shows the feature long enough to recognize. |
| Right material, wrong order | `edit-video` | Move the explanation before the payoff; no regeneration. |
| Local defect | Local repair | Move one caption, re-mix one line, extend one CTA. |

A clean file cannot clear an incoherent story, and a caption defect never triggers a new concept. Scores are hypotheses, not ad performance. For taste notes, offer up to two cheap alternatives inside the approved direction and explain the tradeoff. Conflicting notes go to the decision owner; never blend opposite directions. A changed direction or paid scope goes back through the existing approval.

## Note states

| State | Record |
| --- | --- |
| Open | Note and exact reviewed source. |
| Accepted | Intended effect, acceptance condition, scope; original wording kept. |
| Rejected / deferred | Owner, reason, consequence. A required blocker stays blocking unless disproved or removed by an authorized scope decision. |
| Changed | Operation, input/output identities, before/after evidence. Changed bytes are not verified. |
| Verified | Review of the new candidate meets the acceptance condition, with full-output regression checks. Otherwise reopen. |

Keep a note-to-revision table: note → source time → effect → route → candidate → verified status. `applied` never means resolved.

## Impact and invalidation

List affected sources and dependents before executing. A branch from an older version that drops later good changes stays a candidate until reconciled.

| Change | Recheck |
| --- | --- |
| Spoken line | Script approval if copy changes; take, word timings, hold, captions, mix, later offsets. |
| Scene duration | Later cue offsets, transitions, music, captions, CTA, total length. |
| Shot or crop | Product truth and scale, full action, continuity, overlay space. |
| Caption only | Fresh burn from clean picture; adjacent cues, safe areas. |
| Mix only | Stems, full-output levels, word integrity, ending. |

Keep unrelated decisions; drop stale approvals for changed content; keep original bytes.

## Each delivered file is its own final check

Keep one quality-report row per file: version/checksum, ratio, duration, language, viewing size, perception (`listened`/`watched` or `measured`), captions, mix and ending, proof/CTA, verdict, blockers. A passing master does not clear a crop, cutdown, translation or caption revision. At destination size check: no collisions or duplicate overlays, product scale and support, visible proof, readable CTA time, captions synced to actual speech, the whole ending including the last consonant, and measured levels for masking and gaps.

## Editable handoff

At checkpoints and wrap, update the manifest: brief, approved script, chosen and rejected takes with reasons, sources and excerpts, editable timeline, stems and settings, caption source, accepted version, notes, evidence, approvals and blockers. A flattened MP4 is not a handoff. Inputs are stored as host files, code and settings in the recipe file. Pack with `../scripts/pack_recipe.py` and prove it in an empty folder with `../scripts/check_recipe.py`. A rebuild reuses stored paid outputs.

Save the user's exact wording and scope; a one-project request stays project taste until the owner makes it a brand rule. Keep preferences, predictions and measured results separate; without real campaign data record "audience results unavailable".

Resume from saved state alone: the accepted version, its sources, one target scene and its note. If a source or permission is missing, name it; never guess from chat.
