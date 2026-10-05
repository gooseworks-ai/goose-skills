---
name: video-production-harness/create-storyboard
description: Produce a host-visible storyboard that previews every scene as a 9:16 frame with timing, captions, VO, SFX, and tool notes — before any expensive generation runs.
---

# create-storyboard

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

Produce a reviewable storyboard on the host surface that lets the operator inspect pacing, captions, hierarchy, and asset choices BEFORE committing to AI video credits. This is step 3 of the video-orchestrator pipeline. Runs after `create-design-brief`.

Draft cheap scene mockups using available deterministic composition and real supplied assets. Label unfinished mockups clearly. Generated ingredient previews require approved preview spend and must show actual image/audio assets.

Use the binding's storyboard surface and the available local composition tools; no HTML renderer is assumed.

## Inputs

- `<video_folder>/design_brief` (required, source of scene table)
- `<video_folder>/idea_brief` (for context)
- Brand asset references (e.g. the current brand evidence paths)
- Hero photo if relevant (e.g. `hero-photo.jpg`)

## Workflow

1. Read design_brief and pull the scene table.
2. Copy hero/mascot assets into `<video_folder>/raw-materials/` if not already there.
3. Save scene cards in approved order with aspect ratio, numeric timing, dominant action, spoken/on-screen copy, references, SFX and planned model/tool. Include unresolved decisions and visual hard rules.
4. Use deterministic mockups for text/layout and actual hero/product/logo assets. Mark pending generated ingredients; do not call a mockup a finished preview.
5. Use the current brand typography/palette, checking font/renderer availability before choosing that approach.
6. Present through the host's supported review surface, never an assumed ad-hoc HTML page.
7. Verify: every scene from design-brief appears in order, captions match, no broken asset paths.

### Step 7.5 — Transition layer (optional, opt-in)

If the project opts into the cinematic transition layer (default ON for `music-video-ad` runs longer than 25s, default OFF otherwise):

1. Plan each transition from the approved scene boundaries and mood; use the available host transition capability when selected. This emits `<video_folder>/transition_pairs.json` and appends a "Transitions" section to `design_brief`.
2. Render a **"Transitions"** section in `storyboard` immediately after the scene grid, with one row per pair showing:
   - From-scene → To-scene
   - Mode pill (`ai_interpolation`, `in_edit_whip_pan`, `hard_cut`, etc.)
   - Pivot keyframe slug + match element (if `pivot_keyframe.needed`)
   - Motion description
   - Estimated credits
3. Total credits estimate displayed at the bottom of the section so the operator sees the budget delta before approving.

The transitions section makes the storyboard the **single review surface** for the entire transition plan. No separate review document — the operator approves transitions inline with the scene plan.

If `transition_pairs.json` does not exist, skip step 7.5 entirely and let the orchestrator default to hard cuts on every boundary (existing behavior, backward compatible).

### Step 7.6 — Audio-span visualizer (podcast-clip projects only)

If `voiceovers/manifest.json` exists (i.e. the script-lock stage split a long-form clip via the selected binding's actual supported capability), render a horizontal **audio-span bar** beneath the scene grid. One bar per scene, width proportional to duration, labeled with `clip_start → clip_end` from the source. Color the last 200ms of each bar red if it lies within a word boundary (mid-word truncation risk).

This caught the example brand scene-07 "higher → stakes situations" truncation only at v3-review-time. Surfacing it visually in the storyboard catches it at gate 2 instead.

### Step 7.65 — UGC discipline metrics (UGC family only)

If `design_brief` `concept_format` is in `ugc-diary | testimonial | founder-led | before-after`, the storyboard MUST compute and display two metrics, persist them into `scene_contract`, and fail the gate if either misses target.

**A. cuts_per_10s (cut density).**

```
cuts_per_10s = number_of_scenes / total_runtime_seconds * 10
```

Display in the storyboard footer AND write to `scene_contract` top-level `metrics.cuts_per_10s`:

```
Cuts: 12 in 24s → 5.0 cuts/10s  (target ≥ 4.0 — the reference cut reference: 5.0)  ✅
```

If below target, render as **❌ BELOW UGC TARGET** and surface in the gate text. Operator override is recorded in implementation-brief decision log AND `approvals`.

**B. face_share_planned (direct-face ratio).**

Every scene card has a `shot_type:` field (persisted as `scene_contract[scenes][N].shot_type`):

- `face_direct` | `face_extreme_cu` | `profile` | `pov` | `over_shoulder` | `hands_only` | `broll`

```
face_share_planned = count(face_direct) / total_scenes
```

Display in the footer AND persist to `metrics.face_share_planned`:

```
Shot mix: face_direct 3 | face_cu 1 | pov 2 | over_shoulder 2 | hands 2 | broll 2
face_share_planned: 3/12 = 0.25  (target ≤ 0.40 — the reference cut reference: 0.25)  ✅
```

If above target, render as **❌ ABOVE UGC TARGET** and require operator override with reason. The fix is to re-storyboard direct-face scenes as POV / over-shoulder / hands alternates (the same VO beat from a different angle), not to extend runtime.

**Why these matter (v3 a prior production review diagnostic):** v3 scored 2.3 cuts/10s and 0.90 face_share. the reference cut scored 5.0 cuts/10s and 0.25 face_share. Fast cuts give the viewer's eye no time to find AI drift; low face_share minimizes the surface where AI fails most.

### Step 7.7 — B-roll % preview (podcast-clip projects only)

Compute the ratio of B-roll seconds to talking-head seconds from the scene plan and show it in the storyboard footer:

```
Tammer face: 10.7s (37%)  |  B-roll: 17.1s (59%)  |  End card: 1.1s (4%)
```

**Pacing target = 50–75% B-roll** (not a hard 70%). the example brand v5 settled at 59% because the "shitty grades" punchline needed a face. The operator overrides the target at the storyboard review gate; do not auto-reject any value in the 50–75% range.

## Output

- `<video_folder>/storyboard`
- Any copied raw-material assets needed by the HTML

## Quality Checks

- Every scene from design_brief appears in storyboard in order with timing.
- 9:16 frames render as vertical, not horizontal.
- Caption text in the storyboard exactly matches the design-brief on-screen text.
- VO fields exactly match the design-brief VO line.
- No broken `<img>` paths.
- Bottom legend documents the world rules and pending production decisions.
- Storyboard is visible and usable on the selected host surface.

## Failure Modes

- Storyboard pretends unfinished assets are final (use placeholder labels).
- 9:16 ratio is broken because frames inherit horizontal layout.
- CSS character mockups are so abstract they don't communicate the scene.
- Storyboard drifts from design-brief (single source of truth).
- **Variant re-use** — copying `storyboard` from a source project (`<source>/storyboard`) into a variant project leaves broken `clips-v2/...` paths pointing at the source's clips folder. Don't copy; either regenerate from `script.json` via the binding's actual keyframe review surface for keyframe review, or run the full storyboard skill against the variant's own design-brief.

## Variant runs

Reuse unchanged pacing/copy only when the binding verifies the source revision and ownership. Show new keyframes, anchors and actual clips in the variant's own review surface; preserve their own provenance and ingredient approval. Do not copy source-relative asset paths blindly. The re-rendered final always needs full QC.
