---
name: video-production-harness/create-design-brief
description: Turn an idea_brief into a design_brief and implementation_brief. Locks visual world rules, tool choices per scene, voice/music/SFX plan, and open decisions.
---

# create-design-brief

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

Convert a refined concept (`idea_brief`) into two production-ready specs:
- `design_brief` — the creative spec (what the video looks, sounds, feels like)
- `implementation_brief` — the operator's checklist (folder layout, exact tool calls, audio prompts, captions, decision log)

This is step 2 of the video-orchestrator pipeline. Runs after `brainstorm`.

## Inputs

- `<video_folder>/idea_brief` (required)
- the current brand evidence (or equivalent brand source-of-truth)
- Reference launch video if available
- Available skills inventory (`the actual host capability catalog`, `the actual supported format catalog`)

## Workflow

1. Load idea_brief and current brand visual evidence from the host.
2. Establish **visual world rules** — non-negotiables that constrain all scenes (e.g. "no screens", "felt mascot stays photographic", "end card snaps back to brand").
3. For each scene, fill in: duration, visual, on-screen text, VO, music cue, SFX list.
4. Write the **tool & skill plan** table — per scene, name the primary generation tool plus any supporting tools. Resolve each operation to the binding's current supported model/tool schema and priced unit. The following are creative preferences when supported, not assumed transport IDs or unconditional provider routes:
   - Cartoon scenes → supported Nano Banana 2 keyframes → supported Veo animation, except the editorial-illustration motion ban
   - Photorealistic character scenes → supported GPT Image 2 keyframes → supported Veo or Kling animation
   - UI/typography scenes → Hyperframes via an installed browser composition capability
   - Hero stills → FFmpeg Ken Burns / an installed browser composition capability
   - End cards → an installed animated end-card renderer or PIL composite
   - Voice → the managed selected-voice operation
   - Music → a supported music library/search capability
   - SFX → approved local SFX and FFmpeg mixing
   - Stitch → the packaged assembly helper or documented FFmpeg filters
   - Captions → the local ASS final-caption path
5. **Mark the climax line.** Identify the single VO line that should land hardest and add a `climax_line:` field referencing it by scene number. `edit-video` reads this to apply +20% per-clip volume on that line. There is exactly ONE climax — if you can't pick, the script needs revision before you can write a design-brief.
6. **For ads with a recurring human character**, write a structured `character:` block with verbatim descriptor strings (see `lock-character.md` for the schema). These strings get baked into every prompt — paraphrasing causes drift.
7. **Write the `assets_manifest:` block** listing every PNG/SVG/JPG/MP4 reference the pipeline will consume, with expected paths. `preflight-audit` reads this to validate before generation. Missing manifest = audit must scan `raw-materials/` recursively, which is less reliable.
8. Define voice (must be on `the host-approved voice catalog`), music cues, SFX rule, caption rule.
9. List **open creative decisions** with options — never silently lock.
10. List **risks and fallbacks** (what to do if a generation looks wrong).
11. Write `design_brief` with all of the above.
12. Write `implementation_brief` with:
    - Folder layout to create on start
    - Phase 0 pre-flight checks (state-0 audit, style locks, asset prep)
    - Phase 1 scene generation table (parallelizable)
    - Phase 2 audio production (VO script as one block, music queries, SFX shot list)
    - Phase 3 edit assembly steps
    - Phase 4 captions SRT
    - Phase 5 review pass
    - Phase 6 variants & delivery
    - Decision log checkboxes
    - Cost estimate
    - Definition of done

## Required fields in design_brief

```yaml
# Single source of truth for downstream skills
audio_strategy: vo-narrator   # one of: vo-narrator | song-as-script | hybrid | silent
# vo-narrator      → ElevenLabs VO over a music bed; lock-script runs on VO text;
#                    edit-video applies the canonical sidechain-duck mix.
# song-as-script   → original song carries the entire script (music-video format);
#                    lock-script runs on lyrics; edit-video skips ducking; captions
#                    sync to vocal onsets; use an available supported music-video capability through the binding.
# hybrid           → VO intro + sung hook (rare); lock-script splits the locked
#                    document into both lanes; edit-video ducks under VO only.
# silent           → no spoken audio; still approve the copy/beat/CTA plan.
#                    Captions come from the approved design/script plan.
climax_line: scene-14  # which VO line gets +20% boost in mix
character:             # OMIT entirely for cartoon-only / product-only ads
  name: Marcus
  age: 38
  hair: "short messy black hair, flat top, no part, 2cm length"
  facial_hair: "clean-shaven"
  shirt: "DARK CHARCOAL t-shirt, color name 'charcoal', hex #3A3A3D"
  build: "athletic, lean, 5'10\""
  ethnicity: "biracial Black/Latino"
  accessories: "no watch, no jewelry, no glasses"
assets_manifest:
  - path: source/product-hero.jpg
    role: hero
    required: true
  - path: approved-logo.svg
    role: brand
    required: true
  # ... every ref the pipeline reads

# UGC-MANDATORY fields (required when concept_format is in the UGC family)
concept_format: ugc-diary   # one of: ugc-diary | testimonial | founder-led | before-after |
                            #         narrator-explainer | motion-graphic | music-video | other
                            # UGC family = ugc-diary, testimonial, founder-led, before-after.
                            # Default to `other` for legacy projects; State 3.55 + UGC review atoms
                            # only fire when value is in the UGC family. Mirror this field into
                            # scene_contract through the selected host binding.

voiceover_strategy: real_voice   # one of: real_voice | cloned_voice | synthetic_vo
                                 # UGC family default = real_voice.
                                 # synthetic_vo requires an explicit host-persisted synthetic-voice approval and will be
                                 # flagged by review-video-vo-authenticity on every run.

world_lock:                  # REQUIRED for UGC family; OMIT for multi-location / non-UGC formats
  set: "small white-tiled bathroom with brass round mirror, single candle on wood shelf,
        white interior door, morning daylight from frame-left window"
  wardrobe: "black ribbed scoop-neck tank top, no jewelry, hair down, no makeup"
  lighting: "soft daylight from frame-left window, cool-warm balance neutral"
  color_grade: "warm-natural, slight magenta shadows, no teal/orange push"
  recurring_props:
    - "the approved product bottle on vanity"
    - "wood-handle hand mirror"
  time_of_day: morning       # one of: morning | afternoon | evening | night

face_visibility_target: 0.30   # ≤ 0.40 enforced for UGC family at storyboard gate (the reference cut ≈ 0.25)
cut_density_target: 5.0        # ≥ 4.0 enforced for UGC family at storyboard gate (the reference cut ≈ 5.0)
brand_reveal_strategy: composited_screenshot   # never AI-render brand wordmark or UI text
end_card_style: narrative_resolution           # not flat brand panel; defaults for UGC
```

## Output

- `<video_folder>/design_brief`
- `<video_folder>/implementation_brief`

## Quality Checks

- `audio_strategy` is set to exactly one of `vo-narrator | song-as-script | hybrid | silent`. Downstream skills branch on this field; a missing or invalid value blocks the phase.
- Every scene in idea_brief is reflected in the design-brief scene table.
- Visual world rules are stated as hard rules (e.g. "ZERO UI / keyboard / phone SFX").
- Voice is from `the host-approved voice catalog` (not invented).
- Tool plan references real skills under `the actual host capability catalog` or `the actual supported format catalog`.
- Implementation brief has a parallelization note (which scenes can run concurrently).
- Open decisions and fallbacks are explicit.
- `climax_line:` is set to exactly one scene (no zero, no two).
- `assets_manifest:` lists every asset the pipeline will consume.
- `character:` block uses verbatim strings (hair, shirt with hex, etc.) — paraphrasing causes drift.
- VO text matches what State 2.5 will lock; the design-brief is overwritten by locked_script if they diverge.
- `concept_format:` is set to exactly one of the enumerated values. Required for downstream UGC gating.
- If `concept_format` is in the UGC family (`ugc-diary | testimonial | founder-led | before-after`): `voiceover_strategy:`, `world_lock:`, `face_visibility_target:`, `cut_density_target:`, `brand_reveal_strategy:`, `end_card_style:` are ALL present and populated.
- `world_lock.set` / `wardrobe` / `lighting` / `color_grade` / `time_of_day` are verbatim strings (these get baked into every scene prompt — paraphrasing them creates the "bathroom → kitchen" failure pattern).

## Failure Modes

- Brief tells the operator "use AI to make a cool scene" without naming a model.
- Voice picked from training data instead of `the host-approved voice catalog`.
- World rules are aesthetic preferences instead of binary constraints.
- Implementation brief skips Phase 0 style-lock gate (most expensive cost risk).
