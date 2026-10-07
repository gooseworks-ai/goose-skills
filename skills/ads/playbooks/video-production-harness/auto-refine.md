---
name: video-production-harness/auto-refine
description: Bounded watch → diff → fix → re-watch loop that drives a master cut to objective polish without operator round-trips. Wraps review-video + edit-clip + edit-video. Only fires on machine-checkable issues (continuity, color/grade, audio levels, VO integrity, runtime, brand assets, pacing) — escalates subjective creative calls (story arc, concept, emotional read) to the operator.
---

# Human version

Repair verified objective defects within the existing scope and iteration limit. Keep story decisions visible, preserve earlier cuts, and distinguish a changed file from a verified improvement.

---

# Agent version

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation. Read [the editorial review guide](references/editorial-review.md) for source binding, stage decisions, note disposition, impact checks and saved edit history.

## Purpose

Close the slow part of the video loop. The operator was spending 50%+ of their time watching → listing issues → approving fixes → re-watching for issues that are objectively checkable (character drift, scene-to-scene grade mismatch, VO clipping, breath SFX too loud, static stretches, missing brand assets, runtime drift). This skill takes those off their plate.

It does **not** make creative calls. "The video isn't telling a story" or "the mirage doesn't read as POV" still escalates to the operator. This skill only fires when the machine pass list (defined in `review-video.md`) flags a P0/P1 objective miss with a deterministic fix.

## When to use

- After `edit-video` produces the first master, before showing it to the operator. Auto-refine runs silently on objective issues, then surfaces the candidate, its stage diagnosis and any unresolved subjective questions for the operator's eye.
- When the operator says "polish this" / "tighten this up" without specifying issues — auto-refine knows what objective polish means.
- **Not** for "redo the third scene entirely" or "the concept isn't landing" — those are creative pivots; call `edit-clip` or restart at brainstorm.

## Inputs

- `<video_folder>` (required)
- `<video_path>` — default `<video_folder>/edits/master-final.mp4`
- `<max_iterations>` — default 3, hard cap 3
- `<budget_credits>` — optional local ceiling, capped by the current host-approved remaining budget; never a new grant (no default spend authorization)
- `<scope>` — `objective` (default; only machine-checkable issues), `objective+audio` (also runs the audio sub-loop on every pass), or `audio-only` (skip visual checks)

## The loop

```
┌─────────────────────────────────────────────────────────────────┐
│  iteration 1..N                                                 │
│                                                                  │
│  1. WATCH                                                        │
│     actual complete-video frames/audio review                                 │
│                                                                  │
│  2. CHECK                                                        │
│     review-video documented structured check list                                │
│     → returns structured JSON: {checks: [{id, severity, fix}]}  │
│                                                                  │
│  3. PARTITION                                                    │
│     objective_misses = checks where machine_check=true && !pass  │
│     subjective_misses = checks where machine_check=false && !pass│
│                                                                  │
│  4. DECIDE                                                       │
│     if no objective_misses:  EXIT objective-clean → diagnose open story    │
│     if iteration >= max:     EXIT (cap)   → report what's stuck  │
│     if budget exhausted:     EXIT (cost)  → report spend         │
│                                                                  │
│  5. PLAN                                                         │
│     pick the highest-severity objective_miss with a deterministic│
│     fix. Group adjacent fixes that share an asset (e.g. one      │
│     audio re-mix covers multiple level issues).                  │
│                                                                  │
│  6. EXECUTE                                                      │
│     dispatch to edit-clip or edit-video sub-phase. Log credits.  │
│                                                                  │
│  7. RE-RENDER                                                    │
│     edit-video re-stitches the master. Updates <video_path>.     │
│                                                                  │
│  8. ARCHIVE                                                      │
│     copy current master → edits/_iterations/master-iter-N.mp4    │
│                                                                  │
│  → loop                                                          │
└─────────────────────────────────────────────────────────────────┘
```

## What counts as a deterministic fix

Each pass-list check (defined in `review-video.md`) declares one of:

- `auto-fixable` — the check has an exact supported repair plan using `edit-clip.md` or `edit-video.md` (e.g. "VO peaks at -3 dB → run `edit-video` Phase 4 with `vo_gain=-6dB`"). Auto-refine executes it.
- `auto-fixable-with-budget` — same, but the fix burns AI credits (e.g. "scene 04 face cosine sim 0.62 against ref < 0.85 → re-roll motion with character ref multi-condition"). Auto-refine executes only with the current host approval tokens and both the host remaining budget and the stricter local ceiling. An agent-authored credit limit cannot authorize spending.
- `escalate` — the check failed but the fix needs human judgment (e.g. "story-grammar payoff missing"). Auto-refine surfaces it but does not act.

If a check is unclear about its disposition, treat as `escalate`. Better to ask than to burn credits on the wrong thing.

## Workflow

### Step 1 — Bootstrap iteration log

Create `<video_folder>/edits/_iterations/auto-refine-log.json` if missing:

```json
{
  "started": "<iso>",
  "max_iterations": 3,
  "budget_credits": "<current approved remaining budget or smaller local ceiling>",
  "credits_spent": 0,
  "iterations": []
}
```

### Step 2 — Iteration N

1. **Watch.** Run the packaged evidence helper on the actual video, read every extracted frame, listen to the full audio, and obtain the actual transcript when speech is present.
2. **Check.** Follow `review-video.md` and save its documented structured check list; no separate command or mode is assumed. Persist the result as `edits/_iterations/iter-N-checks.json`.
3. **Partition** into `objective_misses`, `subjective_misses`, `incomplete`, `passed` arrays. Missing required evidence is incomplete, never pass. Bind each finding/operation to its original cut and use the source/impact/disposition procedure in [the editorial review guide](references/editorial-review.md). Subjective diagnoses use the existing return route and cheap authorized alternatives; they are not silently repaired by this loop.
4. **Exit conditions:**
   - `incomplete != []` → exit incomplete-evidence; state the required missing watch/measurement capability. No quality pass is inferred.
   - `objective_misses == []` → exit objective-clean only; run the stage diagnosis and preserve unresolved story/creative findings. Do not promote or call the cut APPROVED while those findings or required watch evidence remain open.
   - `iteration >= max_iterations` → exit at cap, summarize what's still failing.
   - `credits_spent + projected_cost > budget_credits` → exit on budget, summarize.
   - **Convergence check:** if the same `check.id` failed in iteration N AND iteration N-1 with the same fix path attempted, exit and escalate — the fix isn't working, don't burn another cycle.
5. **Plan.** Sort objective_misses by `severity` (P0 > P1) then by `cost_credits` (cheap first). Group fixes that share a target asset:
   - All audio-level issues → one `edit-video` Phases 3–5 re-mix pass.
   - All clips needing color-match → one `edit-video` Phase 1 LUT pass.
   - Per-scene clip re-rolls → individual `edit-clip` calls, sequential not parallel (each touches state).
6. **Archive and execute.** Preserve the existing candidate before any mutation. Execute each resolved real repair, recheck host paid gates and budget for any submission, and log actual debits/reservations. Update `auto-refine-log.json` with the fix attempted.
7. **Re-render.** If any clip-level fix ran, call `edit-video` to stitch a fresh master. If only audio-level fixes ran, call `edit-video` Phases 3–5 only, followed by fresh QC. Use a new output path and preserve note-to-candidate lineage. Full rewatch verifies the intended effect; successful commands alone leave notes changed.
8. **Archive.** Copy `<video_path>` → `edits/_iterations/master-iter-N.mp4` so the operator can A/B across iterations.

### Step 3 — Final report

After the loop exits, write `<video_folder>/edits/_iterations/auto-refine-report.md`:

```markdown
# Auto-refine report — <project name>

- **Iterations:** N / <max>
- **Exit reason:** objective-clean | cap | budget | convergence | incomplete-evidence
- **Stage verdict / open diagnosis:** <separate from objective-clean>
- **Credits spent:** X / <budget>
- **Wall time:** Xs

## Pass list — final state

| Check | Severity | Status | Iterations to pass |
|---|---|---|---|
| character-continuity-scene-04 | P0 | ✅ passed | 1 |
| color-grade-scene-02-vs-04   | P1 | ✅ passed | 2 |
| vo-peak-clipping             | P0 | ✅ passed | 1 |
| static-stretch-scene-06      | P1 | ❌ FAILED | escalated (re-roll didn't resolve) |

## Subjective issues — operator review

These were not addressed because they need human judgment:

- Scene 02 mirage POV is ambiguous — does it read as hallucination?
- End-card tagline lands or feels stapled-on?
- ...

## What was actually changed

- Iteration 1: re-rolled scene 04 motion with multi-ref character lock (8 credits)
- Iteration 2: applied global LUT pass + lowered breath SFX -8dB (0 credits, ffmpeg only)
- Iteration 3: re-rendered approved VO at native provider speed (1 credit)

## Next step

→ Operator review pass on subjective issues above. Run `auto-refine` again with `--max_iterations 2` if you fix any subjective issue and want the objective checks re-verified.
```

Save a short summary on the host review surface with iterations and open subjective issues.

## Output

- A new labeled candidate master recorded through the binding; the selected final and source notes remain unchanged until selection.
- `<video_folder>/edits/_iterations/master-iter-N.mp4` — one per iteration for A/B.
- `<video_folder>/edits/_iterations/iter-N-checks.json` — pass-list result per iteration.
- `<video_folder>/edits/_iterations/auto-refine-log.json` — running log.
- `<video_folder>/edits/_iterations/auto-refine-report.md` — final report.
- `<video_folder>/storyboard` — the host review surface shows the saved run result and remaining issues.

## Quality checks

- The loop never exceeds `max_iterations` (hard cap 3 even if operator overrides).
- Every iteration archives its master before the next pass — operator can A/B compare.
- Every fix logs credits spent and the exact skill call made — full audit trail.
- Convergence guard fires: if the same check fails twice with the same fix attempted, the loop exits — no infinite retry.
- Subjective misses are surfaced in the report, never silently fixed.
- Final master plays cleanly and matches Design-tab runtime ± 0.5s.

## Failure modes

- **Loop runs forever on a stuck scene.** Convergence guard (same check + same fix twice) is mandatory. Iteration cap is the second line of defense.
- **Burns credits on a creative call disguised as objective.** If a check's disposition is unclear, treat as `escalate`. Never invent an `auto-fixable` mapping for a subjective issue.
- **Auto-refine changes an approved scene without authority.** Read the host's actual approval records. A newly found defect can invalidate dependent evidence, but does not itself grant creative or paid authorization. Preserve valid unrelated approvals and renew the affected gate when required.
- **No archive of pre-refine master.** Always copy `master-final.mp4` → `_iterations/master-iter-0.mp4` before the first fix, so the operator can revert.
- **Audio sub-loop drowns out an intentional creative choice** (e.g. "the breath is supposed to be loud here as the climax"). Respect any per-scene override flag in the Design-tab audio plan that says `auto-mix: skip`.
- **Skill calls itself recursively.** Auto-refine never calls auto-refine. The orchestrator calls auto-refine; auto-refine calls only review-video + edit-clip + edit-video.
