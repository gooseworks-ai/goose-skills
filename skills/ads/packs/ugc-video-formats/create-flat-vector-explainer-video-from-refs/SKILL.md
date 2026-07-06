---
name: create-flat-vector-explainer-video-from-refs
description: >-
  Produce a single vertical "flat-vector product-routine explainer" ad (≈30s,
  9:16) — a flat-illustration creator-character walks through a countable N-step
  product routine, one step per beat, with a large corner numeral, a labelled
  chip + tagline, and the step's real product photo. Every character scene is a
  Kling i2v render off a text-stripped clean plate (subtle motion, style-
  preserving negative — the 2D look must survive), and ALL words/numerals/chips/
  CTA are composited as an animated Remotion DOM overlay ON TOP of the moving
  footage — never baked into the keyframe (i2v warps baked text). Slate/grid/CTA
  beats are Remotion text (no i2v); the final "N products" lockup is a PIL
  composite of the real product photos (not AI — AI duplicates SKUs). Full-
  sentence ElevenLabs eleven_v3 VO drives word-by-word burned captions over a
  VO-forward music bed. It's a scene-orchestrated, character-locked format —
  many scripted beats stitched into a ~50s master, then re-cut to 30s from the
  animated master. Use when a brand wants a premium, countable "here's the whole
  routine in N products" explainer with a consistent illustrated host. NOT for a
  talking-head UGC video, NOT for a single-product handheld demo, and NOT for a
  SaaS-UI mockup explainer (this is the consumer-physical variant — character
  vignettes, not dashboard panels).
status: active
---

# create-flat-vector-explainer-video-from-refs

## Purpose

Recreate the **flat-vector product-routine explainer**: one illustrated creator-
character walks through a countable N-step routine (collagen → serum → eye cream →
hair), one step per beat, each beat carrying a large corner numeral, a labelled chip
+ one-line tagline, and the step's **real product photo**. It reads as a premium DTC
brand explainer (Spotify/Anchor flat-vector lineage), not as UGC. The canonical worked
example is Spoiled Child's "The Perfect Morning Routine = 4 Products" (`demo/`).

The reusable IP is **two hard-won separations**:

1. **Motion layer ≠ text layer.** Animate a **text-stripped clean plate** with Kling
   i2v (subtle motion, style-preserving negative), then composite every chip / numeral /
   tagline / slate / CTA as an **animated Remotion DOM overlay** on top. Baking text
   into the still before you animate it lets i2v warp the type and you lose the ability
   to retime/restyle it — this is the format's whole credibility.
2. **Real assets ≠ AI assets.** The per-step product photo and the closing "N products"
   grid are **real product webps composited with PIL** (AI duplicates SKUs in a grid).
   Only the character vignettes and stylized backgrounds are generative.

Plus the assembly discipline: full-sentence eleven_v3 VO → word-by-word burned captions
→ VO-forward music bed → a ~50s animated silent master, then **re-cut to 30s from the
animated master** (never from an earlier static intermediate).

**Why Kling (not Seedance/Veo) for the character beats:** Kling 2.5-turbo/pro at
`cfg_scale=0.5` with a style-preserving negative holds the flat-vector 2D look at LOW
motion. Push motion harder (or use a photoreal-leaning engine) and it drifts toward a
3D render. TEST one scene before batching.

**Why this is scene-orchestrated (not a single call):** ~10–14 beats, a character lock,
per-scene keyframes + clean plates, per-scene i2v, a Remotion composition, PIL grid, VO
+ music mix, captions, and a 30s re-cut. It's a multi-step pipeline, not one remix call.

Use this when the brand has:
- A **countable routine** — "here's the whole thing in N products/steps" (not a
  capability list). One ownable, countable point.
- A **consumer-physical** product line (creams, serums, drinks, packaged goods) shown
  by a character using each one — NOT a SaaS product (that's the UI-mockup variant).
- Real product photos whose art must stay exact (the per-step callout + closing grid).

## Inputs

Required (one `config.json` — copy `config.example.json`, the Spoiled Child example):
- **Concept** — the single countable point + motif phrase ("THE PERFECT ROUTINE = 4
  PRODUCTS", "N is enough."), hook line, CTA.
- **Character lock** — `character.anchor_prompt`: a flat-vector description (hair, build,
  wardrobe, skin tone). If the brand's existing character is photoreal, **re-render a
  fresh flat-vector anchor** — never pass the photoreal still as a chained `medias` ref
  (it flattens every gen to a photoreal portrait). Use it only as a written descriptor.
- **Scenes** — the ordered beat table: each `{n, kind, duration_sec, keyframe_prompt,
  motion, overlay, vo}`. `kind` ∈ `character` (Kling i2v) | `slate`/`grid`/`cta`
  (Remotion text, no i2v).
- **Product grid** — `product_grid.images`: the real product webps for the closing "N
  products" 2×2 PIL lockup (also the per-step callout photos).
- **VO voice** + **music prompt** + **caption style** + dims/duration.

Optional (defaults in `config.example.json`):
- **Kling params** — `cfg_scale` (0.5), `duration` (5s), style-preserving negative.
- **VO settings** — eleven_v3, with-timestamps, stability/similarity/style/speed.
- **Cut-downs** — `cutdowns`: v1 (full story, VO sped ~1.25×) and/or v2 (hook-led montage).
- **fps** (30), **dims** (1080×1920).

Real product photos are git-LFS in the brand folder — **fetch + checkout first**
(pointers are ~131-byte stubs).

## Engine (scripts/)

This molecule is **documentation-grade**: `config.example.json` captures the full recipe,
and `scripts/PIPELINE.md` maps each config field to the real, runnable script in the
source project (`clients/spoiled-child/video-11-routine-broken/working/`). The pipeline
is not re-implemented here as a standalone 14-scene Remotion app — the source project is
the executable reference.

| Config field → | Source script (in the worked-example project) | Does |
|---|---|---|
| `character.anchor_prompt`, `scenes[].keyframe_prompt` | `working/gen_keyframes.py` | **PAID (nano-banana).** Flat-vector character anchor + per-scene keyframe variants (one pose each). |
| (clean plates) | `working/clean_plate.py` | **PAID (nano-banana edit).** Strip baked chips/numerals/taglines from character keyframes → clean plates for i2v. |
| `scenes[].motion`, `kling` | `working/kling_i2v.py` | **PAID (Kling 2.5-turbo/pro i2v).** Animate each clean plate — subtle motion, style-preserving negative, cfg 0.5. TEST one first. |
| `scenes[].overlay` | `working/remotion/` | Remotion DOM: chips / numerals / taglines / slate / CTA composited on the moving footage → animated silent master. Free/deterministic. |
| `product_grid` | `working/scripts/build_scene08.py` | PIL composite of the N real product webps on the brand ground (preserve each aspect). Free. |
| `vo`, `voice` | `working/scripts/render_vo.py` | **PAID (ElevenLabs eleven_v3, with-timestamps).** Per-scene full-sentence VO + char-level timestamps. |
| `music` | `working/gen_music.py` | **PAID (ElevenLabs music).** Lo-fi pop bed, VO-forward loudnorm. |
| `captions` | `working/scripts/build_captions.py` | Word-by-word burned captions from the VO char-timestamps (libass). Free. |
| (assembly 50s) | `working/build_master.py` | Mux silent master + ducked/loudnorm mix, burn captions LAST → `finals/master-final.mp4`. Free. |
| `cutdowns` | `working/build_30s.py` | Slice the 30s cut(s) from the ANIMATED master; trim-don't-freeze; slow ≤1.6× for long beats; re-burn scaled captions. Free. |

Requires `fal_client`, `Pillow`, Node + Remotion, `ffmpeg`, `requests`; keys
`FAL_API_KEY` + `ELEVENLABS_API_KEY` from `gtm-goose/.env`. `fal_client` reads `FAL_KEY`
— alias `os.environ["FAL_KEY"] = os.environ["FAL_API_KEY"]`.

## Workflow

### Phase 0 — Intake (concept + real assets first)
Lock the **one countable point** (gate 1) before any keyframes — "the routine is just N
products," not a capability list. Match the visual grammar to the category: a consumer-
physical product = **character-uses-product vignettes**, NOT SaaS-UI mockups. Derive the
checklist: N steps + their real product photos, the character vibe, the motif phrase +
CTA, music mood. LFS-fetch the real product webps. Write full-sentence VO (see Decision
Rules). Write `config.json` and confirm the brief.

### Phase 1 — Character lock + keyframes [PAID — GATE]
`gen_keyframes.py`: re-render a **fresh flat-vector anchor** (never chain a photoreal
ref) + per-scene keyframe variants. **Review the anchor + keyframes** — confirm the
character is consistent (hair, wardrobe, skin) across every character scene before
spending on motion.

### Phase 2 — Clean plates [PAID — GATE]
`clean_plate.py`: strip ALL baked text (chips, numerals, taglines, badges) from the
character keyframes → clean plates. Text-free scenes (hook, signoff) skip this. Verify
the woman/pose/product/style survived the strip.

### Phase 3 — Kling i2v [PAID — largest spend, GATE]
`kling_i2v.py`. **Wait for approval before firing.** TEST one character scene first to
confirm the flat-vector style holds (no photoreal drift). Then batch the character
scenes only (slate/grid/CTA scenes get no i2v). `/watch` each — subtle, localized motion
(blink, spoon lift), no style drift, no baked-text warp.

### Phase 4 — Remotion overlay + PIL grid
Build the Remotion composition (`remotion/`) importing each Kling clip as the moving base
and compositing chips / numerals / taglines / slate / CTA as animated DOM. PIL-composite
the closing "N products" grid from the real webps (`build_scene08.py`). Render the
**animated silent master** — everything downstream slices from this.

### Phase 5 — Audio + captions + master
`render_vo.py` (eleven_v3, with-timestamps) → `gen_music.py` → mix (duck music under VO,
`loudnorm I=-15`, VO-forward) → `build_master.py` muxes + burns word-by-word captions
**last**. Suppress captions on slate/grid/CTA scenes (they carry their own on-screen text
— two text layers collide). Output the ~50s `finals/master-final.mp4`.

### Phase 6 — 30s cut-down [free — the deliverable]
`build_30s.py`: slice each beat's region OUT of the **animated silent master** (never an
earlier static intermediate). Trim short beats; gently slow long beats (setpts ≤1.6×) so
motion stretches instead of freezing. Re-burn scaled captions. This produces
`finals/master-final-30s-v1.mp4` — the shipped 30s deliverable.

### Phase 7 — Frame-diff proof + /watch (mandatory before ship)
Frame-diff a character scene (`motion_probe.py` + visual `blend=difference` heatmap):
localized face/hand glow = real motion; whole-outline glow = a static pan (the stale-
source trap). Then `/watch` the final: real motion, correct duration, caption sync,
correct numerals/labels, no AI text leak. Fix `config.json` / re-roll, re-assemble, re-
watch.

## Decision Rules

- **One countable point, not a capability list.** The explainer owns "the routine is just
  N products." Diffuse "does it all" claims get rejected — lock the number at gate 1.
- **Match grammar to category.** Consumer-physical product → character-uses-product
  vignettes. SaaS → UI mockups (the OTHER variant). Never narrate a beauty product with a
  dashboard/mouse-click scene.
- **Re-render a flat-vector anchor; never chain a photoreal ref.** A photoreal brand
  character passed as `medias` flattens every gen to a photoreal portrait. Use it as a
  written descriptor only.
- **Text is an overlay, never baked.** Strip to a clean plate → i2v → composite text as
  Remotion DOM. Real DOM = crisp glyphs + exact brand color. Baked text warps under i2v.
- **Kling at LOW motion for the 2D look.** cfg 0.5 + style-preserving negative + subtle
  per-scene prompts. TEST one scene before batching. Aggressive motion → photoreal drift.
- **PIL real photos for any multi-SKU grid.** AI duplicates products in a grid; PIL of
  the real webps is exact. Preserve each product's aspect ratio — never stretch.
- **Full-sentence VO, correct concept label.** Write lines one human would actually say
  ("Two — a vitamin-C serum for that morning glow…"), not keyword fragments. Label the
  spot by its true scope (if step 4 is hair, it's a "morning routine," not "skincare").
- **Cut down from the ANIMATED master.** The source of truth for any 30s edit is the
  final animated silent master/clips — never an earlier static intermediate. Frame-diff to
  prove localized motion. Trim short beats; slow long beats ≤1.6×; never freeze a frame.

## Output

- `finals/master-final-30s-v1.mp4` — 1080×1920, ~30s, h264 (+ aac stereo). N-step routine
  + slate + PIL grid + CTA, word-by-word captions, VO-forward music. (The ~50s
  `master-final.mp4` is the full-story master it's cut from.)
- A poster still (a character-with-product frame).
- `working/` — character anchor + keyframes + clean plates, Kling clips, Remotion project,
  PIL grid, VO + music, `silent-master.mp4` (kept for re-cuts).

## Quality Checks

- Canvas 1080×1920, 30fps, h264; 30s cut ≈ target (±0.3s); aac audio present.
- The character is **consistent** across every character scene (hair, wardrobe, skin).
- Character scenes show **localized real motion** (blink/hand/spoon), not a static pan —
  frame-diff proven, not just visually assumed.
- Every chip / numeral / tagline is **crisp DOM type** (not smeared AI text) and reads
  correctly; captions are word-by-word burned and don't collide with on-screen slate text.
- The closing grid shows **N distinct real products** (no AI dupes), correct aspect.
- VO is full-sentence, VO-forward over the music bed (~-15 LUFS); no AI text leak in the
  i2v footage.

## Failure Modes

- **i2v drifts to photoreal / 3D** → lower motion, keep cfg 0.5 + the style-preserving
  negative (`photorealistic, 3D render, realistic skin, style change, gradient shading`);
  TEST one scene before batching.
- **Baked text warps under i2v** → you skipped the clean-plate step; strip text
  (`clean_plate.py`) and composite it as Remotion DOM instead.
- **Character drifts between scenes** → re-render all keyframes from the ONE locked
  flat-vector anchor; never chain a photoreal ref.
- **Grid has duplicate products** → don't fight the AI; PIL-composite the real webps
  (`build_scene08.py`), preserve each aspect, archive the AI grid.
- **30s cut shows frozen characters** → you sliced a stale static intermediate; re-point
  the cut at `silent-master.mp4` (the animated master); frame-diff to confirm localized
  motion (whole-outline glow = pan-only = wrong source).
- **Captions collide with slate text** → suppress captions on slate/grid/CTA scenes; keep
  captions bottom-third, on-screen chips top/center.
- **VO rejected as keyword-y / wrong category** → rewrite as full sentences; relabel the
  concept by its true scope.
- **FAL 403 / "exhausted balance"** with funds → stale ambient `FAL_KEY`; `export
  FAL_KEY="$FAL_API_KEY"` and re-run.

## Related

- The remix twin — `remix-flat-vector-explainer-from-sample` — is what the app's format tab calls; it swaps
  the brand into this builder's `config.json` and publishes back through the
  goose-video runtime. Format link: `recipe.format: "flat-vector-explainer"`.
