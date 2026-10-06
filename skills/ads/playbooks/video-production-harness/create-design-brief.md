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
- The writer's sourced creative brief, selected angle, claim ledger and applicable history
- Reference launch video if available
- Available skills inventory (`the actual host capability catalog`, `the actual supported format catalog`)

## Workflow

1. Load idea_brief, the writer's current sourced creative brief and brand visual evidence
   from the host. Carry exact product/variant, buyer situation, mechanism, offer, CTA,
   user-locked copy/assets, rejected phrases and delivery intent forward. Preserve the
   source pointers/revisions; do not replace them with a catalogue description.
2. Establish **visual world rules** — non-negotiables that constrain all scenes (e.g. "no screens", "felt mascot stays photographic", "end card snaps back to brand").
3. For each scene, fill in: duration, visual, on-screen text, VO, music cue, SFX list.
   Add its viewer takeaway, asset job, action/framing/performance, proof window and
   transition purpose using the existing scene rows. Select assets using the rubric
   below before describing them as usable. A beautiful image cannot stand in for a
   missing demonstration.
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
5. **Mark the intended emphasis.** For spoken work, identify the line that should land
   hardest and add `climax_line:` referencing its scene. This is performance direction,
   not an automatic volume increase. For silent work use `climax_line: null` and name
   the visual payoff in its scene row. The final mix is judged by listening.
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
climax_line: scene-14  # intended emphasis; null for silent. No automatic gain rule.
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

face_visibility_target: 0.30   # optional run target, time share; use null when no justified target
cut_density_target: 2.0        # optional cuts/10s for this run, never a universal UGC floor
pacing_basis: "Observed reference ID + timestamp range, or provisional brief direction"
brand_reveal_strategy: composited_screenshot   # never AI-render brand wordmark or UI text
end_card_style: narrative_resolution           # not flat brand panel; defaults for UGC
```

## Editorial asset selection

Use the existing host asset search/inspection/selection flow. Keep its exact asset,
scene, analysis-revision and source-range identifiers; consume its approved source
binding unchanged when handing off to the renderer. These are editorial annotations
on the existing scene plan, **not a new media schema or search service**. When a host
cannot bind an inspected original to production, record that integration limitation;
a local preview does not prove the renderer used the selection.

For each beat, assign one primary asset job: **product recognition, feature
demonstration, proof, use context, transition or CTA**. Compare plausible candidates
against the same job:

| Check | What to inspect | When it cannot pass |
|---|---|---|
| Product truth | Exact product/variant, label, shape and visible parts | Wrong variant or invented product state |
| Claim support | Feature/action visible for the intended claim window | Metadata says “demo” but the feature is hidden |
| Framing | Actual target crop/resolution, focal point and safe text space | Crop removes the action, label or needed context |
| Motion and time | Inspect the complete selected range, entrance, action and exit | A single good frame hides unusable movement or too-short proof |
| Story continuity | Prop state, screen direction, hands, wardrobe, light and adjacent shot | Attractive lifestyle footage does not connect to the demonstrated use |
| Use permission | User lock and permitted production use | Style/truth reference is being treated as usable source footage |

Open actual images and play the intended video excerpt through the supported media
inspection surface. If playback is unavailable, use an adequately sampled full range
and record that motion/audio remain unverified; sampled frames cannot certify them.
Record the selected candidate's reason plus material rejections beside the beat,
with inspection evidence and crop/trim choice. Metadata and similarity scores only
shortlist; a misleading result loses to the actual media. Do not attach invented
inspection or analysis revision IDs.

Match the literal action, not just the right object: a descending cap shows settling,
not twisting, and a static bottle in a pocket shows placement, not a sliding action.
Narrow the words to what is visible when the needed motion is absent. Apply the same
rule to mockups and test fixtures; a label or direction arrow does not supply proof.

If analysis is pending, inspect an accessible original and retain its existing ID
and source version; mark analysis pending. If the original is inaccessible, the beat
stays unresolved. Preserve user-locked media and surface a concrete conflict instead
of swapping it silently. When nothing fits, narrow the claim, revise the beat with a
supported action, or list the exact missing capture for the existing approval round.

## Direction, timing and coverage

State one visual idea in an ordinary sentence: for example, “follow the same product
from the shelf through the action to the finished result.” Each scene then specifies
what the viewer learns, what changes in the picture and why this cut belongs here.
Framing and camera movement must reveal that information; do not add motion or cuts
merely to meet a quota. Read observed references for mechanics and their limits,
never for permission to copy claims or invent social performance.

Use the current scene contract or EDL, not another timeline. Keep the writer's
estimated speech windows provisional until measured performance exists. Then map
actual words/actions to scene time: the feature must remain visible as its claim is
spoken, actions need time to finish, and new text needs a stable reading hold at the
intended viewing size. A silent route budgets recognition and reading, not speech.
Preserve intentional rests; neither global speed-up nor unrelated extra cuts fixes
a crowded explanation.

Plan usable entrances/exits and handles around each selected cut, plus only the
alternate or bridge/proof shots needed to cover a known edit risk. Name the amount
and reason per shot; verify the source has those handles. Lock product/character/
world details across adjacent scenes. Before full assembly, inspect actual takes
against their beat job and reject missing proof, false product detail, inconsistent
action or artificial performance. Remove redundant beats before requesting rerolls.
Reuse approved material for a local timing change; identify only the dependent
speech, captions, transitions and mix that need reconforming.

Use a cheap timed mockup only when sequencing, text readability or action/speech
overlap is uncertain. Label estimates, unfinished ingredients and unheard voice.
It uses the same scene IDs and approved assets, then returns to the existing
pre-production review surface; it does not grant generation permission.

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
- `climax_line:` identifies intended spoken emphasis, or is null for silent work.
- `assets_manifest:` lists every asset the pipeline will consume.
- `character:` block uses verbatim strings (hair, shirt with hex, etc.) — paraphrasing causes drift.
- VO text matches what State 2.5 will lock; the design-brief is overwritten by locked_script if they diverge.
- `concept_format:` is set to exactly one of the enumerated values. Required for downstream UGC gating.
- If `concept_format` is in the UGC family (`ugc-diary | testimonial | founder-led | before-after`): `voiceover_strategy:`, `world_lock:`, `brand_reveal_strategy:`, `end_card_style:` are present. Optional face/cut targets cite `pacing_basis`; null means no justified target, not a failed gate.
- Every essential proof has inspected source evidence, an honest gap or an approved capture plan; references alone do not count as produced proof.
- The scene plan carries purpose, source identity, proof/action/readability timing and necessary edit coverage.
- `world_lock.set` / `wardrobe` / `lighting` / `color_grade` / `time_of_day` are verbatim strings (these get baked into every scene prompt — paraphrasing them creates the "bathroom → kitchen" failure pattern).

## Failure Modes

- Brief tells the operator "use AI to make a cool scene" without naming a model.
- Voice picked from training data instead of `the host-approved voice catalog`.
- World rules are aesthetic preferences instead of binary constraints.
- Implementation brief skips Phase 0 style-lock gate (most expensive cost risk).
