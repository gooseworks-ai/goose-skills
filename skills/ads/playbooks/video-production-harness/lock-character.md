---
name: video-production-harness/lock-character
description: Lock each recurring person's look and world before any clip is made. Reuse accepted anchors, make only missing ones with the GPT Image 2 edit route, and inspect the real stills and moving identity rather than inventing drift percentages. Phase 0 (the anchor and its voice pair) runs in State 2.6 for every generated on-screen person who speaks; the rest is State 3.5.
---

# lock-character

Before writing any character prompt, read the avatar guide: `catalog_fetch` the skill `create-image-fal` (1.3.0 or newer) and open its references/avatar-generation.md file. Reuse accepted identity and its capture branch.

**Realism default (every real person):** phone capture, deep focus, no bokeh, a lived-in, slightly cluttered real room (never a plain wall or a white void), natural skin with pores and slight asymmetry, and "no retouching, no skin smoothing, no beauty filter, no cinematic grade", plus the light and realism block ([libraries, look and rubric](references/libraries-look-and-rubric.md)). Studio light or shallow focus only when the approved style comes from a studio-shot reference; list that in `changes_from_reference` as `camera` if it differs. Wardrobe and setting fit the activity. Distinctive marks only when the user asks.

**Capture follows the hands.** Set capture per scene. When the action uses both hands (applying, smoothing, pressing, holding a product with both hands), capture is `phone_counter` (a propped phone or a mirror) or `phone_observer`, never `phone_selfie`: the model adds a third hand to hold the phone. On the creator-h3 route it is `phone_counter` ([shot routing](references/shot-routing.md)). A person who acts without talking to the lens (B-roll, a montage) is made with make_character.py `--action "<task>"` or `--capture phone_observer`, never the talking-head defaults (`--shot talking`).

## Host contract

Follow [creative contract and review](references/creative-contract-and-review.md) and read `capabilities.md` plus the selected host binding first. Anchor choices go into the existing ingredient review.

## Purpose and use

Prompt-only people drift (hair, shirt colour, facial hair) and cost full re-renders. Reuse a selected accepted anchor, or prepare only the missing appearance choices, then derive every angle from that one identity and inspect it before dependent production. State 3.5, for any recurring human character (skip cartoon or object-only ads); re-run if the protagonist changes. Phase 0 runs earlier, in State 2.6 before the storyboard, for every generated on-screen person who speaks; Phases 1-3 then run here, from the anchor picked at the ingredient gate.

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
2. Generate only missing anchor candidates. A generated person's candidate is made by create-creator-takes-h3's make_character.py (the creator avatar builder), one run per candidate in its own folder, so each still and its `character.json` (with `voice_pair`) stay together. A candidate made another way (an edit from a reference) gets its pair from a free `make_character.py --dry-run` with the same person and `--voices`, which writes `character.json` and generates nothing; point its `image` at that candidate. Never generate a second still just to pair the voice. The anchor's `.meta.json` records the `gateway`; every later character call inherits it.
3. Save candidates to `<video_folder>/generated/character-lock/<characterId>/candidate-<NN>.png` with provenance in `character_locks`.
4. **Pair the voice with the person.** Phase 0 runs in State 2.6 for every generated on-screen person who speaks, so the still and its voice both exist at the ingredient gate; it stops at `candidates_ready`, and the anchor is picked in that gate, or first where the host has its own pick (Studio's Characters section, then its Voices section for that person's paired voice). Run make_character.py with `--voices <list>` and the person's `--ethnicity` and `--voice-accent`; it writes `character.voice_pair` and refuses without a list. The list is the host's free ElevenLabs voice list (`GET /v1/voices`), saved whole as the file; on GooseWorks that is `data_call_provider {provider: "elevenlabs", path: "/v1/voices", project_id}`. A person who is never voiced separately, or speaks only in a native H3 take, takes `--no-voice-pair`. When `voice_pair.source` is `voice_design` and the host cannot run Voice Design, run `pair_voice.py --character ... --accept-nearest`, which takes the closest `nearest` voice as the pair; never use a voice that is not in `voice_pair`. A rejected voice is replaced by `pair_voice.py --character ... --voices <list> --exclude <id>`, never by hand.
5. **Ingredient selection.** Show unresolved anchor choices with their descriptors, each beside a short audition of its paired voice (State 2.6), in the existing ingredient review. Check hair shape and colour, shirt brightness (the main drift source), facial hair, age and the realism default.

### Phase 1: Angle set

1. For each angle, generate a keyframe with the **approved anchor in the model's image-reference field** (not a video start-image field). The prompt is the verbatim descriptor block, the angle, and "match the reference photo exactly: hair shape, shirt colour, facial features, age".
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
- No two-hand scene uses `phone_selfie`; every still passes the hand count in [review-video](review-video.md).

## Failure modes

- **Re-rolls that ignore the drift:** each re-roll prompt names the failing item from the last report.
- **Several characters:** run this skill once per character with separate output folders and merge the `character_locks` records in `create-clips`.
- **Anchor on one provider, scenes on another:** switching providers means regenerating every character scene against a fresh anchor.

## Relationship to other skills

Phases 1-3 run after `create-storyboard` and before `create-clips`, which reads `character_locks`; Phase 0 runs in State 2.6 for every generated on-screen person who speaks, before the storyboard. Pairs with State 3.55, the world lock: without it the same person lands in different worlds; `create-clips` sends the world references with the anchor on every keyframe.
