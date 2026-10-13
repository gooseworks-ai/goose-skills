---
name: video-production-harness/create-storyboard
description: Produce a host-visible storyboard that previews every scene as a 9:16 frame with timing, captions, VO, SFX, and tool notes — before any expensive generation runs.
---

# Human version

**Summary.** Preview the actual story with inspected assets, exact words and useful
timing before production spend. The review shows why each shot fits, what is still
missing and whether the viewer has time to see the proof and read the text.

---

# Agent version

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
3. Save scene cards in approved order with aspect ratio, numeric timing, dominant action, spoken/on-screen copy, references, SFX and planned model/tool. Include unresolved decisions and visual hard rules. Reuse the current scene IDs and timeline/EDL; do not introduce a second timing authority.
   - Carry viewer takeaway, asset job, framing/performance and the reason for the next cut.
   - Show the actual selected image/range and the existing source binding unchanged,
     including analysis revision when present. Link the inspection evidence and reasons
     for selecting it over rejected candidates. Mark pending analysis and unavailable originals.
   - Separate usable production media from product truth/style references and mockups.
     Respect user-locked sources; conflicts remain visible in the existing review.
   - Mark claim-to-proof overlap, action completion, reading/recognition hold and
     speech window. State whether timing is estimated or measured from selected audio.
   - List needed entrance/exit handles, alternates and bridge shots only where a
     specific edit risk warrants them, and note world/product continuity at the join.
4. Use deterministic mockups for text/layout and actual hero/product/logo assets. Mark pending generated ingredients; do not call a mockup a finished preview.
5. Use the current brand typography/palette, checking font/renderer availability before choosing that approach.
6. Present through the host's supported review surface, never an assumed ad-hoc HTML page.
7. Verify: every scene from design-brief appears in order, captions match, no broken asset paths.

For uncertain sequences, build a cheap timed proof from these same scene cards and
inspected sources. Review the complete sequence at intended viewing size: does the
visual support the words at that moment, does text remain stable long enough, and
does the action complete before the cut? A still grid alone cannot answer these.
Do not require a new render when the timing is already established by the approved
recipe and usable material. Keep scratch/estimated audio explicitly unverified.

Before assembly, replace pending cards with actual selected takes and recheck the
same criteria. Record missing proof or continuity defects by scene/range. Repair the
smallest affected part or remove an unnecessary beat before paid regeneration. A
local timing change preserves unaffected approved sources and reconforms affected
audio/captions/transitions. Review that join and then the complete revised cut.

### Kit path: the `kit` block

Only when the design brief chose the kit path (`capabilities.md`). Save it in the same `video_change` custom draft as the storyboard and `render_estimate`:

```
kit: {
  seed:  { style_id, version },        // the nearest template's style
  style: { duration, aspects, scenes, timeline, layers,
           traits?, products?, cast?, answers?, footage?, assets? },
  plan:  { aspect, scenes, voice?, music?, cast?, answers?, footage?, product_ids? }
}
```

- `seed`: the style `catalog_fetch` returned for the nearest template.
- `style`: the seed's execution fields. Change only the duration, the scenes and the timeline order, and only with published parts. `assets` may name only the seed's own fonts and frames. Catalogue fields always come from the seed.
- `plan`: the approved scenes, cast, voice and music, written exactly as a template video's plan takes them.
- Add `asset_id` to each approved ingredient you reuse (cast still, scene still, footage), and point the plan's `*_asset_id` fields at those ids.
- Never edit frames, fonts or prompt files. Never send server-only fields (`image`, `image_locked`, `stills`, `fix`, `takes`).
- No redo allowance: the kit runs its own checks, so `render_estimate` carries no `reroll_allowance`.

After the save, read `video_read`. While `custom_review.readiness_blockers.ingredients` shows `kit_preparing`, read again in about a minute. `kit_invalid` lists plain problems: fix each one and save again. When neither shows, the owner approves the ingredients as usual. That approval is the video's yes. Call `video_make` and follow its `next_step`: run the make command it gives. The kit makes, checks and finishes the video, so send no custom render state or paid calls of your own; a `custom_video_on_kit` refusal means run the make command instead. If the owner stops the kit, the custom review comes back, and their next approval starts a new run.

### Step 7.5 — Transition layer (optional, opt-in)

If the project opts into the cinematic transition layer (default ON for music-video runs longer than 25s, default OFF otherwise):

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

### Step 7.65 — Pacing and shot-mix diagnostics

Measure the actual planned cuts, not the number of scene cards. A card may contain
several shots; a continuous shot across two beats contains no cut. Count boundaries
inside the cut, excluding time zero and the final end. Do not count a graphic overlay
as a picture cut. Write `metrics.cuts_per_10s` in the existing scene contract:

```
cuts_per_10s = actual_picture_cut_count / total_runtime_seconds * 10
```

For example, five contiguous shots in 20 seconds have four cuts: **2.0 cuts/10s**.
Also show individual shot lengths and the proof/readability holds; the average can
hide one rushed demonstration and one redundant hold.

Retain each scene/shot's `shot_type` (`face_direct`, `face_extreme_cu`, `profile`,
`pov`, `over_shoulder`, `hands_only` or `broll`). For a face-share diagnostic, measure
non-overlapping **visible direct-face seconds**, including direct-facing close-ups:

```
face_share_planned = direct_face_visible_seconds / total_runtime_seconds
```

Record the time-based definition with the metric. Older count-based values are not
comparable; recompute them from the saved timeline before a new comparison. Do not
use scene counts when one face shot holds much longer than the inserts.

Targets come from this brief and an inspected relevant reference, if one exists;
retain its ID, timestamp range and observed limitations in `pacing_basis`. Without
one, label the targets provisional or leave them null. The old single-reference
floors (4 cuts/10s, at most 40% face) are not universal UGC acceptance rules. A
founder explanation, product demo and reflective testimonial can need different
rhythms. Explain a deviation when it affects the story and preserve explicit user
direction; do not add cuts to conceal artificial shots or rush a readable proof.

The gate concerns supported proof, intelligibility, readable text, continuity and
the approved recipe. Numeric diagnostics help locate defects; they cannot certify
natural performance or substitute for viewing the complete sequence.

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
- Actual selected ranges support the intended claim at the intended time; a metadata description is insufficient.
- Reading/action holds and source handles survive the actual crop and cut. Estimates remain labelled until measured.
- Local changes retain unaffected source identities and approvals; changed joins and the full cut are reviewed.
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
