---
name: video-production-harness/create-design-brief
description: Turn an idea_brief into a design_brief and implementation_brief. Locks visual world rules, tool choices per scene, voice/music/SFX plan, and open decisions.
---

# Human version

**Summary.** Give every scene a clear job, usable proof and enough time to understand it.
Use the approved words, current product evidence and inspected assets to choose one
coherent visual approach. Save these choices in the existing briefs and scene plan so
production and later edits preserve them.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md).

After `brainstorm`, turn `idea_brief` into `design_brief` (how the video looks and sounds) and `implementation_brief` (the operator's checklist).

## Inputs

- `<video_folder>/idea_brief` (required), brand evidence, the reference video if any
- The writer's creative brief, angle and claim ledger
- The host's capability and format catalogs

## Workflow

1. Load `idea_brief`, the creative brief and brand evidence. Carry forward the exact product, buyer situation, mechanism, offer, CTA, user-locked copy and assets, and rejected phrases, with source pointers.
2. Set **visual world rules** as binary constraints ("no screens") from the approved brief/reference. Name capture, focus, light, texture and sound for each world. Phone realism applies only to a phone look; studio, cinematic, stylized and animated formats keep their own settings ([libraries, look and rubric](references/libraries-look-and-rubric.md)).
3. **Study the reference and plan from its cut list.** Study the whole reference, picture and sound. Run `scripts/reference_shots.py study REFERENCE.mp4 reference/`: the cut list, a full-resolution keyframe per shot, full-resolution frames at 4 fps or more, and a setup estimate. Look at the frames of every action beat and fill each row of `reference/shot-table.json`: people, action (a verb, or `none`), hand_on_product, camera and objects; correct the setup labels. Server scene descriptions are inputs, never the table. Without playback, record the study as `measured`, never a full watch.
   - **The scene skeleton is the cut list, not the script's beats.** Write the plan's per-shot table in `shot-plan.json`: per shot `shot`, `ref_shot` (one or a list), start/end, setup, people, action, hand_on_product, camera, objects, `segments`, `overlays` (each promised inset or overlay), `speaking_on_camera` (true only when the face on screen speaks that line; only these shots are lip-synced) and `callback_of`. A beat that spans N reference shots gets N shots. A reference action you can't copy (a claim, a competitor, an offer) gets a replacement visible action, never a face holding still.
   - Shot count and distinct setups stay within 30% of the reference. **Record every change in `changes_from_reference`** (`aspect`: people, action, sound, persona, hook, length, shots or camera; `from`, `to`, `reason`): fewer shots or setups as `shots`, an object substitution (a trash bin becoming a bowl) as `action` with the reference's object in `from`. It is shown first at the script approval.
   - Run `scripts/reference_shots.py compare reference/shot-table.json shot-plan.json` and save the counts line it prints for the script approval. A shortfall it reports is an `ask` finding ([check severity](references/check-severity.md)): add shots, or list the change; it never blocks. Without a reference, `catalog_fetch` (type `template`) the style the genre card names and reuse its scene count, pacing and shot list. Never run a template's renderer or unchanged style and call it custom.
4. For each scene: duration, visual, on-screen text, voice, music, SFX, viewer takeaway, asset job, framing, proof window and transition purpose. Choose assets with the rubric below; a beautiful image never stands in for a missing demonstration.
5. Write the **routing plan**: one line per scene, `scene N → <row> → <fal model id> @ <Standard setting> / <Best setting>` (plus `part@version` on the kit path), from [the shot-routing guide](references/shot-routing.md) and its genre card: one shot list, both choices ([quality tier](references/quality-tier.md)). After the script approval (State 2.5) the owner's `quality_tier` and `shot_overrides` pick one setting per shot; keep them in `shot-plan.json` too. **Choose each clip's resolution here, before any take:** switching it later re-rolls the take. A shot with no row is an open decision.
6. **Choose the path** (`capabilities.md`): the kit path when every scene's row maps to a published part and no new frames, fonts or prompt files are needed; otherwise agent-built. Save the choice and reason. On the kit path, `create-storyboard.md` writes the `kit` block.
7. **Mark the emphasis.** For speech, set `climax_line:` to the scene whose line should land hardest (direction, not a volume boost). For silent work, `climax_line: null` and name the visual payoff.
8. **Recurring person:** a `character:` block of verbatim strings (schema in `lock-character.md`). Its voice is chosen with it as one pair (State 2.6).
9. **Write `assets_manifest:`** (every reference and its path) for `preflight-audit`.
10. Resolve `speech_mode`, `soundtrack_modes` and timed sound cues with [speech and route qualification](references/speech-and-route-qualification.md). Sound follows the reference; silence only when the reference is silent or the owner asks. Use [libraries, look and rubric](references/libraries-look-and-rubric.md) and, for scale, [product scale and world](references/product-scale-and-world.md). Derive `required_features` from scene content, not genre.
11. List **open decisions** with options, and **risks and fallbacks**.
12. Write `design_brief`, then `implementation_brief`:
    - Folder layout, Phase 0 checks, a scene table with a parallelization note, audio (voice script as one block, music, SFX), assembly, captions, review, delivery, decision log, definition of done
    - **Cost estimate:** price every paid request exactly as it will go with `data_price_provider` (free and read-only; up to 20 requests per call, so batch the rest; returns each one's credits): its body plus, as top-level fields of the request, its `shot_scene` and `upgrade_*` fields ([quality tier](references/quality-tier.md)). A tiered fal call (GPT Image 2, Fabric, H3, Seedance) always says its `quality` or `resolution` (before the yes, a picture with no quality is priced as high); never guess a rate. For an entry it answers `price_unknown`, follow that entry's `next_step` before you total. Save `draft.shot_list` (`stills` and `shots`, fields in [quality tier](references/quality-tier.md)) with the script, so the server prices Standard and Best from the same shots; show both `approval_quote.tier_quotes` totals as given. Add `render_estimate.upgrade_allowance` `{total_credits}` inside the render total, alone (it replaces `reroll_allowance`): pictures only, about two medium → high upgrades, never one redo per scene. Over it, the owner gives a new yes. None on the preview or kit videos; price a kit video from each scene's routing-row fal model.

## Host fields

On the GooseWorks binding, save `draft.creative_contract` with `speech_mode`, `soundtrack_modes` (an empty list is valid), `required_features`, `reference_map`, `product_grounding`, `voice_plan` and `changes_from_reference`. `reference_map` rows: scene, reference beat, action, proof, sound. `product_grounding`: product id, source URLs, dimensions, scale reference URLs, permitted use, geometry. `voice_plan`: route, rationale, pronunciations, `speaking_rate_wps` with its source, and the **voice–character pair** (voice id, model, the character it speaks for, the matched gender, age, ethnicity, accent and energy); several-clip talking faces default to `exact_audio_lipsync`. With an on-screen person, the pair is filled at the ingredient step from `character.voice_pair`: until then `voice_plan` names the character and no voice id, and `draft.voices` stays empty. Read back `custom_review.creative_contract_revision`; never invent one. The host contract has no shot-plan field: keep `shot-plan.json` beside it with that revision and the same `changes_from_reference`.

## Required fields in design_brief

```yaml
speech_mode: native_dialogue # native_dialogue | audio_driven_lipsync | narration | singing | mixed | none
soundtrack_modes: [source_ambience, music] # source_ambience | music | sfx | intentional_silence
required_features: [speaking_face, product, scale]
# audio_strategy is legacy only; never infer speech or silence from it.
changes_from_reference:
  - {aspect: length, from: "28 s", to: "22 s", reason: "owner asked for a shorter cut"}
climax_line: scene-14  # null for silent work
character:             # omit for cartoon-only or product-only ads
  name: Marcus
  hair: "short messy black hair, flat top, no part, 2cm length"
  shirt: "DARK CHARCOAL t-shirt, color name 'charcoal', hex #3A3A3D"
  accessories: "no watch, no jewelry, no glasses"
assets_manifest:
  - {path: source/product-hero.jpg, role: hero, required: true}
  - {path: approved-logo.svg, role: brand, required: true}
concept_format: ugc-diary   # ugc-diary | testimonial | founder-led | before-after |
                            # narrator-explainer | motion-graphic | music-video | other
voiceover_strategy: real_voice   # real_voice | cloned_voice | synthetic_vo (needs saved approval)
world_lock:                  # continuing world, person or product
  set: "small lived-in bathroom, towels on the rail, products on the shelf, morning window light"
  wardrobe: "black ribbed tank top, no jewelry, hair down"
  lighting: "daylight from frame-left window, phone capture, deep focus, no bokeh"
  color_grade: "natural, no cinematic grade"
  time_of_day: morning       # morning | afternoon | evening | night
face_visibility_target: 0.30   # optional time share; null when no justified target
cut_density_target: 2.0        # optional cuts/10s for this run, never a universal floor
pacing_basis: "Reference ID + timestamp range, or provisional brief direction"
brand_reveal_strategy: composited_screenshot   # never AI-render a wordmark or UI text
end_card_style: narrative_resolution
```

## Editorial asset selection

Use the host's asset search and inspection flow. Keep its exact asset, analysis-revision and range ids and hand its source binding to the renderer unchanged.

Give each beat one asset job (**product recognition, feature demonstration, proof, use context, transition or CTA**) and compare candidates against it:

| Check | Inspect | Fails when |
|---|---|---|
| Product truth | Exact variant, label, shape, parts | Wrong variant or invented state |
| Claim support | The feature visible for the claim window | Metadata says "demo" but the feature is hidden |
| Framing | Target crop, focal point, text space | Crop removes the action or label |
| Motion and time | The whole range: entrance, action, exit | One good frame hides unusable motion |
| Continuity and permission | Props, hands, wardrobe, light; permitted use | Footage does not connect, or a style reference used as footage |

Open real images and play the intended excerpt. If playback is unavailable, sample the full range and record motion and audio as unverified. Record why the chosen candidate won, with evidence and trim. Metadata and similarity scores only shortlist. Never invent inspection or revision ids.

Match the literal action: a descending cap shows settling, not twisting. **When the needed motion is absent, narrow the claim** (stats, health, specs) to what is visible. This applies to claims only; never shrink the reference's creative mechanics (its people, action, demo, hook or length) to fit missing footage. Make the missing shot or list the exact capture needed. A label or arrow is not proof.

Pending analysis: inspect the original and mark it pending. An inaccessible original leaves the beat unresolved. Never swap user-locked media silently.

## Direction and timing

State one visual idea in a sentence ("follow the product from the shelf through the action to the result"). Each scene says what the viewer learns and why the cut is here; no motion or cuts just to meet a quota. Speech windows stay provisional until measured; then the feature stays visible while its claim is spoken, actions finish and text holds long enough to read. A crowded explanation is fixed by cutting words or beats, never by a global speed-up. Plan handles around each cut and only the bridge shots a known edit risk needs. Lock product, person and world details across adjacent scenes.

## Output

- `<video_folder>/design_brief`
- `<video_folder>/implementation_brief`

## Quality checks

- Speech and soundtrack are resolved separately; beats, product facts, scale and sound agree in one creative contract; `changes_from_reference` lists every change.
- Every `idea_brief` scene is in the table; world rules are binary; open decisions and fallbacks are explicit.
- The voice is from the approved catalog; the routing plan names real rows.
- `climax_line`, `assets_manifest`, `concept_format` and `required_features` are set; `character` and `world_lock` strings are verbatim.
- UGC-family formats (`ugc-diary | testimonial | founder-led | before-after`) also set `voiceover_strategy`, `world_lock`, `brand_reveal_strategy` and `end_card_style`; targets cite `pacing_basis`.
- Every essential proof has inspected evidence, an honest gap or a capture plan.
- `locked_script` wins over brief voice text.

## Failure modes

- A scene with no routing row.
- Skipping the Phase 0 style lock (the biggest cost risk).
