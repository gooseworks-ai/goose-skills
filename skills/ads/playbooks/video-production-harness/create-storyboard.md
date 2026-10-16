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

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md). Use [Creator Grammar](references/creator-grammar.md) for the cut plan, pacing curve, payoff hold and captions.

## Purpose

Runs after `create-design-brief`; shown at the ingredient approval. Draft cheap labeled mockups from real supplied assets. Generated previews need approved preview spend. Use the binding's storyboard surface; no HTML renderer is assumed.

## Inputs

- `<video_folder>/design_brief` (required; the scene table)
- `<video_folder>/idea_brief`
- Brand assets and the hero photo when relevant

## Workflow

1. Read `design_brief` and its scene table. Copy hero and product assets into `<video_folder>/raw-materials/`.
2. Save one card per scene in approved order: aspect ratio, numeric timing, dominant action, spoken and on-screen copy, references, SFX and planned routing row. Include open decisions and visual hard rules. Reuse the current scene ids and timeline; never add a second timing authority.
   - Carry the viewer takeaway, the asset's job, framing and performance, and the reason for the next cut.
   - Show the selected image or range with its source binding unchanged (and analysis revision when present). Link the inspection evidence and why it beat the rejected candidates. Mark pending analysis and unavailable originals.
   - Keep usable production media apart from truth or style references and mockups. Respect user-locked sources; show conflicts in the review.
   - Mark claim-to-proof overlap, action completion, reading hold and speech window. Say whether timing is estimated or measured from the selected audio.
   - List entrance and exit handles, alternates and bridge shots only where a named edit risk needs them, and note continuity at each join.
   - Mark the one payoff-hold shot (`role: "payoff-hold"`) unless Creator Grammar's offer-stack override applies.
3. Use real hero, product and logo assets and the brand's typography and palette (check fonts are available). Mark pending generated ingredients; a mockup is never a finished preview.
4. Present through the host's supported review surface.
5. Verify: every scene appears in order, captions match, no broken asset paths.

**Timed proof.** For an uncertain sequence, build a cheap timed proof from the same cards and sources and review it at viewing size: does the picture support the words at that moment, does text hold long enough, does the action finish before the cut? A still grid cannot answer this. Skip it when the approved recipe and usable material already fix the timing. Label scratch audio unverified.

**Before assembly**, replace pending cards with the selected takes and recheck. Record defects by scene and range. Repair the smallest part, or drop an unneeded beat, before paid regeneration. A local timing change reconforms only the affected audio, captions and transitions; review that join, then the whole cut.

### Kit path: the `kit` block

Only when the design brief chose the kit path (`capabilities.md`). Save it in the same `video_change` custom draft as the storyboard and `render_estimate`:

```
kit: {
  seed:  { style_id, version },        // the nearest template's style
  style: { duration, aspects, scenes, timeline, layers,
           traits?, products?, cast?, answers?, footage?, assets? },
  plan:  { aspect, scenes, voice?, music?, cast?, answers?, footage?, product_ids? },
  timing: { duration_sec, scenes }     // what the plan was made for
}
```

- `seed`: the style `catalog_fetch` returned for the nearest template.
- `style`: the seed's execution fields. Change only the duration, the scenes and the timeline order, and only with published parts. `assets` may name only the seed's own fonts and frames. Catalogue fields always come from the seed.
- `plan`: the approved scenes, cast, voice and music, written exactly as a template video's plan takes them. It must match the reviewed draft, or the kit refuses it (`kit_invalid`):
  - one kit scene per storyboard scene, in the same order;
  - each scene's `line` is that scene's `text` (the spoken words), and its `on_screen` is its `caption`;
  - the same voice: `plan.voice` is the voice selected for `narrator`, and each cast member who speaks in a separate voice (voice first and lip-sync) has as `voice_id` the one selected for their cast key, their `character.voice_pair`. A native-speech cast member (`creator-h3`, one take speaking its own line) has no `voice_id`. Select no voice the kit won't use;
  - reused pictures are approved ingredients, by `asset_id`, and each one's `url` is that media file's own link. A saved character's photo must also be one of the ingredients.
  - `plan.aspect` is the draft's `aspect_ratio`, and one the seed's style makes.
- `timing`: `duration_sec` is the draft's `duration_target_sec`, and `scenes` lists each draft scene's `time`, in order. If the length or a scene time changes later, save the kit block again with the new timing.
- Add `asset_id` to each approved ingredient you reuse (cast still, scene still, footage), and point the plan's `*_asset_id` fields at those ids.
- Never edit frames, fonts or prompt files. Never send server-only fields (`image`, `image_locked`, `stills`, `fix`, `takes`).
- Price it like any render: send each scene's equivalent paid request (its routing row's fal model) with `estimate_only=1` and sum them into `render_estimate`; the kit charges the same rate. No redo allowance: the kit runs its own checks, so `render_estimate` carries no `reroll_allowance`.

After the save, read `video_read`. While `custom_review.readiness_blockers.ingredients` shows `kit_preparing`, read again in about a minute. `kit_invalid` lists plain problems: fix each one and save again. When neither shows, the owner approves the ingredients as usual. That approval is the video's yes. Call `video_make` and follow its `next_step`: run the make command it gives. The kit makes, checks and finishes the video, so send no custom render state or paid calls of your own; a `custom_video_on_kit` refusal means run the make command instead. If the owner stops the kit, the custom review comes back, and their next approval starts a new run.

### Pacing and shot-mix diagnostics

Count real picture cuts, not scene cards. A card may hold several shots; one continuous shot across two beats has no cut. Count boundaries inside the video (not time zero or the end); a graphic overlay is not a cut. Save `metrics.cuts_per_10s` in the scene contract:

```
cuts_per_10s = actual_picture_cut_count / total_runtime_seconds * 10
```

Five shots in 20 seconds have four cuts: **2.0 cuts/10s**. Also show each shot's length; an average can hide one rushed demo.

Keep each shot's `shot_type` (`face_direct`, `face_extreme_cu`, `profile`, `pov`, `over_shoulder`, `hands_only` or `broll`). Face share is time-based:

```
face_share_planned = direct_face_visible_seconds / total_runtime_seconds
```

Recompute older count-based values from the saved timeline before comparing.

Also save `metrics.setups` (distinct people, rooms, framings or actions from separately made takes; punch-ins and repeats of one take don't count), `metrics.hands_action_share` and the longest still-face stretch, each next to the reference's from its shot table. These diagnostics always run, even when every approval was given in advance.

Targets come from the brief and the inspected reference; record its id, timestamp range and limits in `pacing_basis`. Without one, label targets provisional or leave them null. There is no universal UGC floor or face quota. Never add cuts to hide artificial shots or rush a readable proof. Numbers locate defects; they never replace reviewing the whole sequence.

## Output

- `<video_folder>/storyboard`
- Copied raw-material assets the storyboard uses

## Quality checks

- Every scene from `design_brief` appears in order with timing.
- Selected ranges support the claim at the intended time; a metadata description is not enough.
- Holds and handles survive the real crop and cut; estimates stay labeled.
- 9:16 frames render vertical.
- Caption text and voice lines exactly match `design_brief`.
- No broken image paths.
- A legend states the world rules and pending decisions.

## Failure modes

Unfinished assets shown as final; mockups too abstract to read; drift from `design_brief`.
