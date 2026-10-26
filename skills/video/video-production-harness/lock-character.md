---
name: video-production-harness/lock-character
description: Lock each recurring person's look and world before any clip is made. Reuse accepted anchors, make only missing ones with the GPT Image 2 edit route, and inspect the real stills and moving identity rather than inventing drift percentages. Phase 0 (the anchor and its voice pair) runs in State 2.6 for every generated on-screen person who speaks; the rest is State 3.5.
---

# lock-character

Before writing any character prompt, read the avatar guide: `catalog_fetch` the skill `create-image-fal` (1.3.0 or newer) and open its references/avatar-generation.md file. Reuse accepted identity and its capture branch.

**The approved look controls casting:** read [libraries, look and rubric](references/libraries-look-and-rubric.md). For phone footage, use deep focus, natural skin and the phone light block; studio, cinematic and stylized briefs keep their approved setting, focus and light. Record departures from a supplied reference. Wardrobe and setting fit the activity; anatomy and identity must remain plausible. Distinctive marks only when the user asks.

**The host grades person stills.** On GooseWorks a still saved with `video_change custom.draft` is graded in `person_stills`; the save warns. Judge findings against the approved look. The host's `phone_capture` question applies only to phone-shot reference beats without an approved camera departure; studio light, deliberate shallow focus or a plain set is not a defect when the brief/reference calls for it. **fine:** keep it. **ask:** an unwanted artificial look or a departure from the approved style; show one plain reason and the re-make price, then let the owner choose. **must_fix:** broken anatomy, an impossible pose/object or garbled required text; redo only that still within approval and never deliver the defect. Reuse the same approved identity and style at the video's tier; helper defaults apply only when they match that style. A `not_checked` still is judged at the next save or approval; if still unchecked, inspect the full-size file yourself. Ingredient approval refuses a `must_fix`; an `ask` the owner keeps may be approved. Never smooth or blur a face to hide a defect.

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
   For a new casting choice, make **three actor options** and show one contact sheet; reuse valid candidates toward that count. An accepted or supplied actor needs no recast. This count is people, not `<n_angles>`: do not buy angle sets for unselected candidates. If the helper forces an incompatible phone look, use a supported grounded-image operation that preserves the approved format, rather than changing the brief. See [talking-actor production](references/talking-actor.md) for speaking scenes.
3. Save candidates to `<video_folder>/generated/character-lock/<characterId>/candidate-<NN>.png` with provenance in `character_locks`.
4. **Pair the voice with the person.** Phase 0 runs in State 2.6 for every generated on-screen person who speaks, so the still and its voice both exist at the ingredient gate; it stops at `candidates_ready`, and the anchor is picked in that gate, or first where the host has its own pick (Studio's Characters section, then its Voices section for that person's paired voice). Run make_character.py with `--voices <list>` and the person's `--ethnicity` and `--voice-accent`; it writes `character.voice_pair` and refuses without a list. The lists are the host's free ElevenLabs voice list (`GET /v1/voices`) and the shared voice library's searches for this person (`pair_voice.py --library-searches --gender ... --ethnicity ...` prints them; `GET /v1/shared-voices`), each reply saved whole under the `save_as` name it prints and passed with its own `--voices`; when nothing fits, `voice_pair.library_next_page` gives any next page to fetch before Voice Design. On GooseWorks they are `data_call_provider {provider: "elevenlabs", path: "/v1/voices", project_id}` and `data_call_provider {provider: "elevenlabs", path: "/v1/shared-voices", query, project_id}`; library voices speak without being added. A person never voiced separately, or speaking only in an unconditioned native H3 take, takes `--no-voice-pair`. A qualified voice-reference route retains the selected pair and audition. When `voice_pair.source` is still `voice_design` after the library, price `voice_pair.request`; like a still it runs under the script approval's preview budget (a new yes only when it would go over), then run it (on GooseWorks `data_post_provider` `/v1/text-to-voice/design`; the previews come back as project audio), play the previews beside the still, save the chosen one with `voice_pair.save`, and record the returned `voice_id` with `pair_voice.py --character ... --designed <voice_id>` so `character.voice_pair` names it for every audition and State 5. Only where the host cannot run Voice Design, `pair_voice.py --character ... --accept-nearest` takes the closest `nearest` voice, if the owner accepts it. **Never change the person (heritage, age or gender) to fit a voice list;** the voice follows the person. Never use a voice that is not in `voice_pair`. A rejected voice is replaced by `pair_voice.py --character ... --voices <list> --exclude <id>`, never by hand.
5. **Ingredient selection.** Show the three unresolved actor options in one contact sheet first. After the actor choice, show its playable paired voice candidates in the same ingredient review. Check hair, wardrobe, age, identity and the approved look.
   The owner chooses the actor first, then hears two or three suitable voices reading the same approved excerpt beside that actor. Voice pairing is a shortlist aid, not a final selection from labels; re-pair each candidate with the existing helper, retain the returned IDs and save the chosen pair. Keep these decisions inside the ingredient review and its preview budget; an explicit delegation may choose creatively but never approves spend. Reuse an already accepted pair and sample when still applicable.

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
- Every still matches the approved capture, focus, setting and style. Phone realism applies only to that look; required product detail and anatomy remain correct.
- No two-hand scene uses `phone_selfie`; every still passes the hand count in [review-video](review-video.md).

## Failure modes

- **Re-rolls that ignore the drift:** each re-roll prompt names the failing item from the last report.
- **Several characters:** run this skill once per character with separate output folders and merge the `character_locks` records in `create-clips`.
- **Anchor on one provider, scenes on another:** switching providers means regenerating every character scene against a fresh anchor.

## Relationship to other skills

Phases 1-3 run after `create-storyboard` and before `create-clips`, which reads `character_locks`; Phase 0 runs in State 2.6 for every generated on-screen person who speaks, before the storyboard. Pairs with State 3.55, the world lock: without it the same person lands in different worlds; `create-clips` sends the world references with the anchor on every keyframe.
