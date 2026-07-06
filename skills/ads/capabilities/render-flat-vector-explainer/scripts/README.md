# render-flat-vector-explainer — free assembly how-to

This capability is **documentation-grade**: the flat-vector-explainer molecule is a
documented recipe, not a runnable end-to-end app. There are no standalone scripts here to
`--config` and fire. Instead this folder ships:

- **`config.example.json`** — the full config schema (the Spoiled Child "Perfect Morning
  Routine = 4 Products" worked example). Copy to `config.json` and edit.
- **`PIPELINE.md`** — the field-by-field map from every `config.json` key to the real,
  runnable source script that produced the worked example (in the source project's
  `working/`), and which phase / paid-or-free it is.
- **this README** — the FREE assembly steps the agent runs by hand with ffmpeg + Remotion +
  PIL after the paid gen steps have produced the character clips, VO, and music.

The paid generative steps (keyframes, clean plates, Kling i2v, VO, music) are **separate
capabilities** the recipe orchestrates and gates — see the recipe. Everything below is
free, deterministic, $0.

## The two separations that make this format work

1. **Motion layer != text layer.** i2v only ever animates a **text-stripped clean plate**.
   ALL words/numerals/chips/taglines/slate/CTA are composited on top as an **animated
   Remotion DOM overlay** — never baked into the keyframe. Baked text warps under i2v and
   you lose the ability to retime/restyle it.
2. **Real assets != AI assets.** The per-step product photo and the closing "N products"
   grid are the **real product webps composited with PIL**. AI duplicates SKUs in a grid.
   Only the character vignettes + backgrounds are generative.

## Free assembly steps

Run these after the paid steps have delivered the per-scene Kling clips (character beats),
the VO (with char-level timestamps), and the music bed.

### 1. Remotion overlay -> animated silent master (character-locked)

Build a Remotion composition that imports each Kling clip as the moving base and
composites the scene's `overlay` (numeral, chip, tagline, slate headline, CTA pill,
wordmark, url) as **animated DOM on top**. Keep the **motion layer and text layer
strictly separate** — the Kling footage is the only moving base; text is DOM.

- `kind: character` scenes -> Kling clip base + DOM overlay.
- `kind: slate` / `grid` / `cta` scenes -> Remotion text only, **no i2v** (a solid brand
  `ground` color + the headline / grid / CTA).
- Use the brand palette + display font from the config for crisp glyphs at the exact brand
  color. Real DOM type = crisp; never let i2v render the type.

Render the composition to `working/silent-master.mp4` — the **animated** master.
Everything downstream slices from this, never from an earlier static intermediate.

### 2. PIL real-product grid

Composite the closing "N products" lockup from `product_grid.images` (the real product
webps) onto `product_grid.ground` in the configured `layout` (e.g. 2x2). **Preserve each
product's aspect ratio — never stretch, never AI-generate the grid** (AI dupes SKUs). The
same real webps are also the per-step callout photos in the character beats. Product webps
are git-LFS in the brand folder — fetch + checkout first (pointers are ~131-byte stubs).

### 3. Caption burn (word-synced)

Build word-by-word burned captions from the eleven_v3 with-timestamps **char-level
timings** (libass; Klap is the hosted equivalent). Style per `captions.style` (e.g. Inter
56 white + 4px outline, bottom-third MarginV 360). **Suppress captions on the
slate/grid/CTA scenes** (`captions.suppress_on_scenes`) — those carry their own on-screen
text and two text layers collide. Burn captions **LAST**, after the audio mux.

### 4. Audio mix + 50s master

Place each scene's VO line at its scene start; duck the music under the VO with
`sidechaincompress`; `loudnorm I=-15` VO-forward (music `loudnorm I=-25 + volume 0.5`,
final `alimiter limit=0.89`, ~-15 LUFS / -1 dBTP). Mux the silent master + mixed audio,
then burn captions last -> `finals/master-final.mp4` (~50s full-story master).

### 5. 50s -> 30s cut (from the ANIMATED master)

Slice each beat's region OUT of `working/silent-master.mp4` — the **animated** master,
**never** an earlier static Ken-Burns / segs round (the mtime is the tell; a finished audio
mix can hide frozen characters). Trim short beats (never freeze a frame); gently slow long
beats (`setpts`, clamp <=1.6x) so motion stretches instead of holding. Re-burn scaled
captions offset to the new scene starts; keep suppression on the slate/grid/CTA scenes.
Output `finals/master-final-30s-v1.mp4` — the shipped 30s deliverable.

Optional v2 cutdown: hook-led montage (hook -> slate -> grid pulled forward -> rapid
4-product montage of number + product only -> CTA), >=4 cuts / 10s.

## QC before ship (mandatory)

- **Frame-diff a character scene** (blend=difference heatmap): **localized** face/hand
  glow = real motion; whole-outline glow = a static pan = you sliced the wrong (static)
  source — re-point the cut at `silent-master.mp4`.
- `/watch` the final: real localized motion, correct duration (~30s ±0.3s), caption sync,
  correct numerals/labels, no AI text leak in the i2v footage, N distinct real products in
  the grid (no AI dupes), VO-forward mix (~-15 LUFS).
- Canvas 1080x1920, 30fps, h264, aac present.

## Requires

Node + Remotion, `Pillow` (PIL), `ffmpeg` with libass. All free — the paid keys
(`FAL_API_KEY`, `ELEVENLABS_API_KEY`) belong to the separate paid capabilities, which
route through the GooseWorks proxies so the calls bill the Ads agent.
