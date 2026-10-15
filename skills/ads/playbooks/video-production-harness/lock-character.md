---
name: video-production-harness/lock-character
description: Lock each recurring person's look and world before any clip is made. Reuse accepted anchors, make only missing ones with the GPT Image 2 edit route, and inspect the real stills and moving identity rather than inventing drift percentages. Step 3.5 of the pipeline.
---

# lock-character

Before writing any character prompt, read the avatar guide: `catalog_fetch` the skill `create-image-fal` and open its references/avatar-generation.md file. Reuse accepted identity and its capture branch.

**Realism default (every real person):** phone capture (`phone_selfie` or `phone_counter`), deep focus, no bokeh, a lived-in, slightly cluttered real room (never a plain wall or a white void), natural skin with pores and slight asymmetry, and "no retouching, no skin smoothing, no beauty filter, no cinematic grade". Studio light or shallow focus only when the approved style comes from a studio-shot reference; list that in `changes_from_reference` as `camera` if it differs. Wardrobe and setting fit the activity. Distinctive marks only when the user asks.

## Host contract

Follow [creative contract and review](references/creative-contract-and-review.md) and read `capabilities.md` plus the selected host binding first. Anchor choices go into the existing ingredient review.

## Purpose

In the v03 Ironman run, the protagonist was re-rendered 3 full times (~70 credits) because hair, shirt colour and facial hair drifted between scenes. Every generation was prompt-driven, with no hard reference lock. Reuse a selected accepted anchor, or prepare only the missing appearance choices, then derive every angle from that one identity and inspect it before dependent production.

## When to use

- **State 3.5** of the orchestrator: after storyboard approval, before `create-clips` Phase 1.
- Any ad with a recurring human character. Skip cartoon or object-only ads.
- Re-run if the operator changes the protagonist after the script is approved.

## Inputs

- `<video_folder>` (required) and `<character_name>` (from `brand-vars.yaml`).
- `<character_descriptors>`: a structured block from the design brief. Every field goes **verbatim** into every prompt.
  ```yaml
  character:
    name: Marcus
    age: 38
    hair: "short messy black hair, flat top, no part, 2cm length"
    facial_hair: "clean-shaven"
    shirt: "DARK CHARCOAL t-shirt, color name 'charcoal', hex #3A3A3D"  # name AND hex
    build: "athletic, lean, 5'10\""
    ethnicity: "biracial Black/Latino"
    accessories: "no watch, no jewelry, no glasses"
  ```
- `<n_angles>`: default 6 (front, 3/4-left, 3/4-right, profile-left, profile-right, slight-up).

## Model route

Real people use **`image-gpt-image-2` edit** (`openai/gpt-image-2/edit`), per the cast anchor row in [shot routing](references/shot-routing.md). The anchor text follows the server's dialogue character recipe, not "plain light wall". Nano Banana is for cartoons only and never draws a real person or product. Resolve upload fields, reference ordering, model ids and sizes through the binding's current schema before each call. A failed call is reconciled before rerouting; a silent model-family switch cannot inherit the earlier ingredient selection.

## Workflow

### Phase 0: Anchor portrait

1. Reuse the selected creator avatar builder, capture branch and accepted identity when available. Otherwise write ONE prompt from `<character_descriptors>`, every field verbatim, plus the realism default above.
2. Generate only missing anchor candidates. The anchor's `.meta.json` records the `gateway`; every later character call inherits it.
3. Save candidates to `<video_folder>/generated/character-lock/<characterId>/candidate-<NN>.png` with provenance in `character_locks`.
4. **Ingredient selection.** Show unresolved anchor choices with their descriptors in the existing ingredient review:

   ```
   Anchor portrait — <character_name>
   Descriptors used (verbatim): hair, shirt (#3A3A3D), facial_hair, build
   Check: [ ] hair shape and colour  [ ] shirt brightness (the #1 drift source)
          [ ] facial hair  [ ] age  [ ] real skin, phone capture, deep focus, lived-in room
   Approve or regenerate with an adjusted prompt?
   ```

### Phase 1: Angle set

1. For each angle, generate a keyframe with the **approved anchor in the model's image-reference field** (not a video start-image field):
   ```
   <character_descriptors VERBATIM block>
   <angle-specific description>
   Reference photo: anchor-portrait.png — match exactly: hair shape, shirt color (#3A3A3D), facial features, age.
   ```
2. Use the anchor's `gateway` for every angle. Mixing providers drifts skin tone, light and feature softness.
3. Run 2-3 in parallel at most. Save to `<video_folder>/generated/character-lock/angle-<name>.png`.

### Phase 2: Consistency before animation

Compare the selected anchor and every needed angle at useful resolution: crop the face, enlarge 2× and inspect. Record observed changes in face, eyes and skin, wardrobe, accessories, held object and world. Use pass, needs_revision or incomplete. Do not invent percentage drift or embedding similarity from a visual impression; only a real quantitative tool may fill a number, with its method recorded.

### Phase 3: Retain or repair

Keep accepted anchors and angles. Repair only the affected views within the existing retry and budget scope, then inspect again before animation. Repeated failure suspends that configuration instead of forcing another batch. A new anchor or image family needs the affected ingredient decision. Moving identity, gaze, expression and product handling still need full clip review.

## Output

- `generated/character-lock/anchor-portrait.png`, `angle-<name>.png`, `anchor-grid.png`
- `<video_folder>/generated/character-lock/consistency-report.md`: per-view status and observed changes
- `character_locks`: the contract `create-clips` reads (`method: anchor-ref`)

## Quality checks

- The selected anchor and its ingredient approval are recorded.
- Every angle was derived from the approved anchor, not regenerated from scratch.
- The consistency check ran before any animation.
- Verbatim descriptor strings appear in every prompt.
- Every still shows phone capture, deep focus, no bokeh, a lived-in room and unretouched skin, unless the reference is studio-shot.

## Failure modes

- **Re-rolls that ignore the drift:** each re-roll prompt names the failing item from the last report.
- **Cartoon or non-human ads:** skip this state.
- **Several characters:** run this skill once per character with separate output folders and merge the `character_locks` records in `create-clips`.
- **Anchor on one provider, scenes on another:** this drifts the look. Inherit the anchor's `gateway`; switching providers means regenerating every character scene against a fresh anchor.

## Relationship to other skills

- Runs after `create-storyboard` and before `create-clips`, which reads `character_locks` for each scene's reference inputs.
- Pairs with **State 3.55, world lock** (`orchestrator.md`) for UGC formats. Identity alone is not enough: an unlocked set, wardrobe and light give "the same woman in three different worlds". The world lock makes 3 wide reference shots of the empty set; `create-clips` sends them with the anchor on every scene keyframe.
