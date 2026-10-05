# Human version

Review the exact cut the viewer saw, decide what prevents the message from landing, and make the smallest useful change. Keep the accepted cut, every candidate and the original notes separate. A change is complete only after its intended effect and the whole new output have been checked.

This guide adds editorial decisions to existing project records. It does not add a feedback API, approval gate or memory service. [[composes::review-video]] and [[composes::auto-fix-from-review-notes]] use the same evidence and history.

---

# Agent version

## Bind the review before interpreting it

Read the binding's existing feedback, render_outputs, versions, project_state and production manifest. Identify the note ID, verbatim text, original render/version ID, time or range, source file/checksum and referenced beat/scene. Keep the current accepted version and new candidate as separate references. A note stays on its original render when the selected final changes; never substitute newest-file order or a mutable master alias.

If an old note has only a path, resolve and preserve those bytes before editing. If the reviewed source cannot be identified, record that blocker; do not guess. Re-check the source checksum just before execution. Existing host fields remain authoritative. Additional editorial detail belongs in its supported project artifacts/dated review notes with links to those IDs, never invented wire fields.

## Stage determines the decision

These are internal purposes, not new approval meetings. Use the host's current review surface and authentic gates.

| Stage | Question from actual material | Exit or return |
| --- | --- | --- |
| Concept | Does this promise fit this buyer/product and available truthful proof? | Keep the direction or return to concept/script before production. A plan review is not a watched-video verdict. |
| Rough cut | What does a fresh viewer understand, why does each beat follow, and does the payoff answer the hook? | Advance the story or return to script, missing coverage or sequence edit. Temporary sound/text remains explicitly unfinished. |
| Fine cut | Are performances, transitions, proof, pace, reading time and sound doing their intended jobs? | Preserve good material; repair the smallest affected shot, timing, mix or overlay. |
| Final export | Does this exact file work at its delivery size, including captions, mix, ending and format? | Deliver only after all required checks and current approval; each derivative gets its own review. |

For a cut review, first play it end to end at normal speed without reading its intended story. Save a short **received-message** observation: what is offered, whom it appears to help, the hook's promise, visible proof, payoff and action. Record uncertainty and surprise at specific times. Then read the brief and compare intended versus received message. If the reviewer already knows the brief, label this a context-aware first impression; do not manufacture an independent viewer. A new independent reviewer can supply a fresh-viewer observation when available.

Listen to the full actual audio and review continuous motion plus the complete extracted frames. Record source identity, playback start/end, duration covered, audio route and gaps. Frames, transcript and metadata alone cannot establish full-speed playback or listening. If a required capability is unavailable, save useful partial evidence and leave that check incomplete. For silent work, confirm the intended silence and use visible copy/reading time; a nonexistent VO transcript is not required.

## Diagnose before dispatch

Consolidate duplicates without losing their IDs or original wording. For each critical finding record observation, time/range, evidence, intended viewer effect, cause, smallest sufficient route and acceptance condition. Verify claimed images against exact timestamp/neighboring frames and claimed audio against the actual segment.

| Cause | First route | Example and acceptance |
| --- | --- | --- |
| Unsupported promise or wrong buyer proposition | Concept/script | A hook promises automation but the body only shows export. Narrow the hook to the demonstrated ability or plan supported proof; do not decorate the mismatch. |
| Missing proof/action or unusable performance | Production (`create-clips`/`edit-clip`) | Obtain the feature-revealing shot or approved delivery; the feature must be visible long enough to recognize. |
| Correct material, wrong order or timing | Sequence edit (`edit-video`) | Move explanation before payoff and allow its reading window; no unrelated shot regeneration. |
| Sound story, local defect | Local repair | Reposition one colliding caption, re-mix one masked line or extend one CTA; preserve approved copy and unrelated scenes. |

Technical cleanliness cannot clear an incoherent story. A local caption defect must not trigger a new concept. Review scores and simulated audience reactions are hypotheses about quality, never measured ad performance.

Before escalating subjective taste, prepare up to two cheap alternatives already inside the approved direction (text sketch, timeline or local preview) and explain their tradeoff. “More premium” might mean fewer overlays and more product recognition time, or restrained typography and quieter transitions; it is not a license for new assets/claims. “Calmer” and “more urgent” on the same moment conflict even if their commands touch different files. Link both notes, identify the authorized decision owner and record the chosen intent/reason before applying either. No mixing opposing directions to appear compliant. A changed creative direction or paid scope still uses the existing approval gate.

## Note disposition and verification

Keep these distinctions in the existing issue/feedback record or its linked applied report. They are editorial meanings, not a new mandatory enum or API schema.

| State | Required record |
| --- | --- |
| Open | Original note and exact reviewed source are retained. |
| Accepted / alternative fix | Intended effect, acceptance condition, scope and why this operation fits; preserve original wording even if the remedy differs. |
| Rejected with reason / deferred | Decision owner, reason, and remaining consequence. A required blocker stays blocking unless its premise was disproved or an authorized scope decision removed it. |
| Changed | Actual operation, input/output identities, affected elements and before/after evidence. Successful execution proves only that bytes changed. |
| Verified | Rewatch evidence on the new candidate satisfies the original acceptance condition, with full-output regression checks complete. Otherwise reopen the note. |

Use a note-to-revision table in the existing applied report: note ID → source render/time → accepted effect → route → candidate → changed evidence → verified evidence/status. Record skipped/failed/blocked operations separately. Never translate `applied` automatically into “resolved.”

## Impact and invalidation

Before execution, list affected source artifacts and dependents. Compare the note's reviewed source with the accepted cut; if branching from an older version omits later good changes, state exactly which, and keep it a candidate until reconciliation/selection.

| Change | Rebuild and recheck | Preserve |
| --- | --- | --- |
| Spoken line or delivery | Exact script approval when copy changes; affected voice take, measured word timings, scene hold, captions, mix and downstream time offsets; affected ingredient/final approvals. | Unchanged takes, identity locks and scenes. |
| Inserted pause or changed scene duration | Only affected picture/audio edits; subsequent cue offsets, transitions, music/SFX, captions, CTA, total duration and derivatives. | Unaffected source media; earlier unchanged cue windows. |
| Shot or crop | Feature/variant truth, continuity, product visibility, overlay safe space; affected ingredient and final evidence. | Approved script/audio when timing is unchanged. |
| Caption-only repair | Caption source and fresh burn from clean picture; adjacent cues, duplicates, hierarchy, product visibility, safe areas. | Source picture, speech and accepted wording unless authorized. |
| Mix-only repair | Affected stems/cues, full-output levels, listening, word integrity, ending; each derivative that uses it. | Picture/timeline and matching captions when time is unchanged. |

Do not globally invalidate unrelated valid decisions. Do not keep stale approval/evidence for changed content. Rebuild from editable sources, preserve original bytes, and label resulting candidates. Compare both the local effect and the whole cut before final selection.

## Each delivered output is its own final gate

Maintain a row in the existing quality report for each actual file: version/asset/checksum, ratio/duration/language, source revision, dimensions/viewing size, playback/listening coverage, captions/text, mix/ending, proof/CTA, verdict and blockers. A passing parent master does not clear a crop, cutdown, translated version or caption revision.

Check at the destination's normal viewing size: no caption/UI/logo collisions or duplicate overlays, correct product/feature still visible, readable contrast and hierarchy, sufficient time to recognize proof and read CTA. Captions use the approved wording synchronized to actual speech, including pronunciations and intentionally corrected spelling. Silent text uses its own reading windows. Review the full ending, including the final spoken consonant and intended silence/fade/loop. Measure actual output peaks/levels and listen for masking, pumping and discontinuity; transcription success is supporting evidence only.

## Editable handoff and next-run retrieval

At checkpoints, final selection and wrap, update links in the existing manifest and decision history: brief, approved script revision, selected and rejected hooks/takes with reasons, source assets and excerpts, editable timeline/composition, voice/music/SFX stems and settings, caption source, exact accepted version, candidates, notes, review evidence, approvals and unresolved blockers. Include real reproduction commands/capability inputs and dependencies needed to change a scene. Saved paths must resolve; a flattened MP4 alone is not an editable handoff.

Save exact user wording with attribution and scope. A one-project request for a whisper is project taste until the authorized owner makes it a standing brand delivery rule. Retrieve applicable rejections, pronunciations and performance intent before the next brief; do not silently promote a preference into a fact about audiences.

Keep human preferences, model/quality predictions and measured performance separate. Measured outcomes require the actual variant, audience, placement, objective and observation window. If absent, record “audience results unavailable.” Approval and quality scores are not campaign results.

Resume check: using only saved project state, resolve the accepted version and its editable sources; identify one target scene, original note and required rechecks; make a local candidate while retaining unrelated source checksums. Record restoration/rollback selection explicitly. If source/permission is missing, name it and preserve the project; do not regenerate unrelated material or guess from chat.
