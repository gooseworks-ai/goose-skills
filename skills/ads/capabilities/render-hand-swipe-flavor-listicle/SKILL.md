---
name: render-hand-swipe-flavor-listicle
description: Render a 'hand-swipe flavor listicle' video from a config — the brand's REAL product cutouts each float on a flat flavor-matched color field under a persistent title and slide RIGHT-TO-LEFT one to the next like a phone-feed scroll, while a green-screen hand clip (back of hand toward camera, index finger up) is trimmed to its clean finger-up window, looped once per flavor, keyed with a green-dominance alpha key, scaled down and anchored at the bottom, with an optional end card and an optional instrumental music bed — deterministic PIL plus FFmpeg assembly, FREE (the hand clip comes from create-video-fal and the bed from create-music-elevenlabs), so labels stay pixel-crisp. Use for the hand-swipe-flavor-listicle format.
status: active
---

# render-hand-swipe-flavor-listicle

Render the **hand-swipe-flavor-listicle** format from a config: a short vertical
(1080×1920, 30fps, ~7.5s) "N flavors of <Brand>" listicle. Each flavor is a card — a flat,
saturated color field + a persistent title + the brand's REAL product cutout with a soft
contact shadow. Cards change by sliding **right-to-left** (a phone-feed scroll), while a
real-looking hand sweeps at the bottom of the frame. Music-only, no VO.

This capability is the **FREE, deterministic assembly** ($0, no keys). It never generates
or edits the product — the cutouts are composited as-is, so labels stay crisp. It needs
four kinds of input, gathered first (see **Getting the inputs**): product cutouts, a title
TTF, a green-screen hand clip, and (optionally) a music bed.

## Run

```bash
S=/tmp/gooseworks-scripts/render-hand-swipe-flavor-listicle/scripts   # after `gooseworks fetch render-hand-swipe-flavor-listicle`
python3 $S/build_hand_swipe_listicle.py config.json                 # writes config "output"
python3 $S/build_hand_swipe_listicle.py config.json --out final.mp4 # override the output
python3 $S/build_hand_swipe_listicle.py config.json --stills cards/ # one PNG per card, no video
python3 $S/build_hand_swipe_listicle.py config.json --work work/    # keep the intermediates in work/
```

Relative paths in `config.json` resolve against the config file's own folder.
Render `--stills` first: it is instant and shows the title, colors and cutouts before the full render.

**Prereqs:** `python3` with Pillow, and `ffmpeg` + `ffprobe` on PATH. Nothing else.

## Getting the inputs

| Input | Free route | Paid route (gated: confirm with the user first) |
|---|---|---|
| Product cutouts | The brand's transparent PNGs (PDP/press kit). | A brand-site photo is usually NOT a cutout. Remove its background with `create-image-fal`, model `fal-ai/birefnet/v2` (see below). |
| Title TTF | Download a TTF matching `choices.title_style` (table below). | — |
| Hand clip | The bundled clip (one woman's hand): `curl -fL -o hand-swipe-greenscreen.mp4 https://d2m0qbg34x1ii2.cloudfront.net/ads/samples/455dc125-e41c-46dc-9fa6-9ae125e9b6bf/media-hand-swipe-greenscreen.mp4` (also in the recipe's `config.hand.bundled_clip_url`). | A new clip via `create-video-fal` (see **Making the hand clip**). |
| Music bed | None (`"music": null`, a silent cut). | `create-music-elevenlabs` (see **Making the music bed**). |

**Cutouts.** The renderer warns when an image has no transparent pixels: it would render as
a white box with a rectangular shadow. Fix it before rendering, never by AI-regenerating the
product. The cutout route is `create-image-fal` with model `fal-ai/birefnet/v2` (paid, gated),
payload `{"image_url": "<public url of the product photo>"}`, the same route `render-vignette`
uses. **Known gap:** birefnet returns `image`, not `images[]`, and `create-image-fal`'s
`gen_image.py` currently reads only `images[]`, so check that capability's notes before
relying on it. If no cutout route works, ask the user for transparent PNGs.

**Title font.** Always pass `title_font`. Without it the renderer falls back to whatever the
machine has (Brush Script on macOS, DejaVu Sans Bold on Linux), so the same config renders a
different title style on different machines. Free TTFs from Google Fonts, one per `title_style`:

| `choices.title_style` | Download |
|---|---|
| cursive / script | `curl -fL -o fonts/title.ttf https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf` |
| bold condensed sans | `curl -fL -o fonts/title.ttf https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf` |
| elegant serif | `curl -fL -o fonts/title.ttf https://github.com/google/fonts/raw/main/ofl/dmserifdisplay/DMSerifDisplay-Regular.ttf` |
| hand-drawn marker | `curl -fL -o fonts/title.ttf https://github.com/google/fonts/raw/main/apache/permanentmarker/PermanentMarker-Regular.ttf` |
| the brand's own display font | The brand's TTF/OTF file if you have it; otherwise the closest row above. |

The title is auto-shrunk (with a warning) until it fits 88% of the frame width, and the
underline follows the drawn text, so long brand names never clip on the edges.

## Config

`scripts/config.example.json` is the worked example (Lucky Energy "5 Flavors of Lucky").
Copy its structure, never its creative values.

| Field | What it is |
|---|---|
| `title` | The persistent header line (required). |
| `title_font` | A TTF in the style from `choices.title_style` (see **Title font**). Missing → a warned, machine-dependent fallback. |
| `title_size`, `title_y`, `title_color`, `title_underline` | Title layout (defaults 118, 200, white, true). `title_size` is a maximum: a too-wide title is shrunk to fit. |
| `flavors[]` | `{ "bg": "#hex", "can": "cutout.png" }` per flavor, in play order (required, ≥2). `image` is accepted as an alias for `can`. Cutouts must be transparent PNGs. |
| `can_height`, `can_center_y` | Product size + vertical center (defaults 950, 940). |
| `slide.frames` | Frames per slide (default 12). `slide.direction` is fixed: always right-to-left (any other value is ignored with a warning). |
| `hand_clip` | The green-screen hand swipe mp4 (required to render). |
| `hand` | `trim_start`, `trim_end` (the clean finger-up window, default 0–1s, must lie inside the clip), `speed`, `scale` (default 0.45), `green_margin` (default 1.12). |
| `end_card`, `end_card_hold_frames` | Optional PNG at the frame size (1080×1920) that slides in after the last flavor; hold (default 60 frames). Another aspect ratio is stretched, with a warning. |
| `music` | `{ "path", "trim_intro_sec", "volume" }` or a plain path string, or `null` for a silent cut. `path` is the `create-music-elevenlabs` output file. `volume` is a gain after loudness normalization (1.0 = the demo level, -18 LUFS). |
| `output` | Output mp4 (default `hand-swipe-listicle.mp4` next to the config). |

**Hard errors (exit 1):** an unfilled `<input:…>` / `<brand:…>` placeholder in a required
field; a missing file; a `music` object whose `path` is empty or a placeholder (set
`"music": null` if the cut is meant to be silent); a `hand.trim_start` at or past the clip's end.

**Timing.** Each flavor lasts one hand-loop (the trimmed clip length). With 5 flavors, a
1s trim, a 12-frame end-card slide and a 60-frame end-card hold, the cut is ~7.4s.

**Music length.** The bed must cover `trim_intro_sec` + the cut. If it is too short, the
renderer trims less of the intro (with a warning) so the music still runs to the end and
fades out there. If the file is shorter than the whole cut, the tail is silent (warned).

## Choices

The recipe asks the user these before any paid step; the renderer only draws what the config says.

- `flavor_lineup` — which SKUs and in what order → `flavors[]`. The demo used 5 energy-drink flavors, strongest last.
- `title_style` — the header style → `title_font` (download per the table), `title_size`. The demo used a cursive script.
- `hand` — whose hand → `hand_clip`: the bundled clip (free) or a new `create-video-fal` clip (paid). The demo used a woman's hand.
- `music` — the bed's feel → the `create-music-elevenlabs` prompt, then `music.path`. The demo used an upbeat, punchy energy underscore.

## Making the hand clip (paid, gated — not this capability)

Only when `choices.hand` asks for a different hand than the bundled clip, or no bundled-clip
URL is available. Fill `{hand}` from `choices.hand` (e.g. "a man's hand with a silver watch").
Write the payload to a file so apostrophes in the description don't break the shell:

```bash
cat > hand-payload.json <<'JSON'
{
  "prompt": "Close-up of {hand}, the BACK of the hand facing the camera, index finger extended pointing up. The hand swipes smoothly from RIGHT to LEFT across the frame like scrolling to the next photo on a phone. One clean horizontal swipe, the index finger stays extended (do not curl it). Solid flat bright green screen background, even flat lighting, fixed camera, no zoom, no camera shake.",
  "negative_prompt": "curled finger, closed fist, vertical motion, static, frozen, morphing, deformed fingers, extra fingers, text, watermark, changing background",
  "duration": "5",
  "aspect_ratio": "9:16"
}
JSON
python3 /tmp/gooseworks-scripts/create-video-fal/scripts/gen_video.py \
  --model fal-ai/kling-video/v2.5-turbo/pro/text-to-video \
  --payload @hand-payload.json --out hand-swipe-greenscreen.mp4
```

Then look at the first ~1s (e.g. `--stills`-style frame grabs with ffmpeg, or `watch`) and set
`hand.trim_start` / `hand.trim_end` to the clean finger-up window. Set `hand_clip` to the file.

## Making the music bed (paid, gated — not this capability)

Generate it long enough to cover the intro trim plus the cut, plus 1s of slack: at least
`(trim_intro_sec + target_duration_sec + 1)` seconds, i.e. about 11s for the default 2.5s
trim and a 7.5s cut. Keep `--trim-intro 0` there; this renderer does the trim.

```bash
python3 /tmp/gooseworks-scripts/create-music-elevenlabs/scripts/gen_music.py \
  --prompt '<from choices.music; instrumental only, no vocals, no artist names>' \
  --length-ms 11000 --duration 11 --out music-bed.m4a
```

Then set `music.path` to `music-bed.m4a`.

## Craft rules (baked into the renderer)

- **Never AI-regenerate the product.** Image-to-video hallucinates the can and garbles the
  label. Only the hand is generative; the products are real cutouts.
- **Green-dominance key, not colorkey/chromakey.** Alpha is 0 only where
  `g > green_margin × max(r, b)`. It is brightness-invariant, so it survives a muddy,
  uneven AI green. Kept pixels are despilled (green clamped to `max(r, b)`), so green spill
  on skin turns neutral instead of see-through. Raise `green_margin` if skin goes
  see-through; lower it if green fringe remains.
- **Back of hand toward camera, finger UP.** A nails-forward hand reads as the wrong hand.
- **Trim to the finger-UP window.** These clips curl the finger periodically.
- **Scale the hand down and anchor it at the bottom** so the fingertip reaches ~35% up (the
  can base) and never covers the product.
- **Flavors change by sliding RIGHT-TO-LEFT**, never a vertical flick or a top-drop.
- The hand is scaled to the frame width with its aspect kept, so a non-9:16 clip is not stretched.

## Output

A `WxH` (default 1080×1920) H.264 mp4, with AAC audio when `music` is set (fade in/out +
loudnorm, padded to the full length). The last line names the length and `music`/`silent`;
read the WARNING lines above it. Then review the FULL mp4 with `watch`: the hand is opaque in
every frame with no green fringe, the finger stays up, the title fits the frame, labels are
crisp and readable, the slide is right-to-left, and the music runs to the end.
