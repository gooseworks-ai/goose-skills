---
name: video-production-harness/auto-refine
description: Bounded check → fix → re-check loop (at most 3 iterations) that repairs only machine-checkable defects in a candidate cut, using review-video's structured check list, edit-clip and edit-video. Subjective and story calls are escalated, never repaired by the loop.
---

# Human version

Repair verified objective defects inside the approved scope and budget, at most three times. A changed file is not a verified improvement.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md). Use [the editorial review guide](references/editorial-review.md) for source binding, impact and disposition.

## Purpose and scope

The loop fixes objective misses from the structured check list in [review-video.md](review-video.md): character drift, grade mismatch, clipping, static stretches, missing brand assets, runtime drift. It makes no creative calls. A story, concept or emotional problem is escalated with its return route. An objective-clean exit never approves the cut; review-video still decides the stage.

## Inputs

- `<video_folder>` (required); `<video_path>` (default `<video_folder>/edits/master-final.mp4`).
- `<max_iterations>`: default 3, hard cap 3.
- `<budget_credits>`: an optional ceiling inside the host-approved remaining budget, never a new grant.

## Dispositions

Each check in the list declares one:

- `auto-fixable`: an exact supported repair through [edit-clip.md](edit-clip.md) or [edit-video.md](edit-video.md), with no paid generation (for example a VO peak fixed by an edit-video mix gain).
- `auto-fixable-with-budget`: the same, but it spends credits (for example a re-roll with the locked anchor). Run it only with the host's current approval and within both the host's remaining budget and the local ceiling.
- `escalate`: needs human judgment. Report it; do not act.

An unclear disposition is `escalate`.

## Loop

1. **Start.** Archive the input as `edits/_iterations/master-iter-0.mp4` and create `edits/_iterations/auto-refine-log.json` (`started`, `max_iterations`, `budget_credits`, `credits_spent`, `iterations`).
2. **Check.** Run `scripts/qc_evidence.py` on the candidate (fix any failed measurement first), review the whole cut with sound when your tools can (`listened`/`watched`, else `measured`), and save review-video's check list as `edits/_iterations/iter-N-checks.json`.
3. **Partition** into objective misses (`machine_check` true and failed), subjective misses, incomplete and passed. Missing required evidence is incomplete, never a pass. Bind each finding to its original cut.
4. **Exit** when any holds:
   - incomplete is not empty: name the missing capability; no pass is inferred;
   - no objective misses: exit objective-clean, run the stage diagnosis and keep open story findings (do not promote or call it APPROVED while they or required evidence remain open);
   - the iteration cap is reached;
   - `credits_spent` plus the projected cost exceeds the budget;
   - the same check failed in this and the previous iteration with the same fix (convergence): escalate.
5. **Plan.** Sort by severity (P0 before P1), then by cost. Group fixes on one asset: all level issues in one edit-video mix pass, all colour matches in one grade pass. Per-scene re-rolls run one at a time through edit-clip.
6. **Execute.** Recheck paid authorization and budget before any submission; log debits and each repair in the log.
7. **Rebuild.** Re-assemble a new labeled candidate with `scripts/assemble.py` from the same `assembly_timeline`, refresh timings, captions, sound and evidence, then re-check the whole new output for the intended effects, not just command success.
8. **Archive** the new candidate as `edits/_iterations/master-iter-N.mp4` and loop.

## Report

Write `<video_folder>/edits/_iterations/auto-refine-report.md`: iterations, exit reason (objective-clean, cap, budget, convergence or incomplete-evidence), the separate stage verdict, credits against budget, each check's severity and status, subjective issues left for the owner, and each iteration's change and cost. Save a summary on the host review surface.

## Output

- A new labeled candidate recorded through the binding; the selected final and source notes stay unchanged until selection ([promote.md](promote.md)).
- `<video_folder>/edits/_iterations/`: masters, check lists, log, report.

## Quality checks and failure modes

- Never more than 3 iterations; each archives its candidate and logs credits and the exact call.
- The convergence guard is mandatory: the same check failing twice with the same fix ends the loop.
- Subjective misses are reported, never fixed silently; never invent an `auto-fixable` mapping for one.
- A new defect can invalidate dependent evidence but never grants creative or paid authority; keep unrelated approvals and renew only the affected one.
- The final candidate's runtime matches the plan within 0.5 s.
- It never calls itself; it calls only review-video, edit-clip and edit-video.
