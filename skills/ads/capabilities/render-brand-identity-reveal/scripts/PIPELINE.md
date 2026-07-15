# PIPELINE — brand-identity-reveal free assembly

The free renderer is **documentation-grade**: `scene.html` is brand-specific (the shipped
reference is the Touchland instance), and the Python scripts drive Playwright + PIL + FFmpeg
around it. Adapt `scene.html` per brand; the scripts are generic.

## Working-dir layout (per project)

```
working/
  scene.html            # 11 poster modules; one active via `.on` class (toggle by OPACITY)
  assets/products/*     # the brand's real product / lifestyle stills
  assets/brand/*        # wordmark png, brand-icon svg
  bg/plate_sage_1.png   # PAID: create-image-fal environment plate (high-res, empty frame)
  bg/plate_final.png    # recrop.py output (camera distance)
  bg/corners.txt        # measure_frame.py output (the frame interior quad)
  art/art_std_01..11.png# render_art.py output (standalone posters, bare mode, 2x)
  frames_v2/frame_01..11.png  # composite.py output (posters warped into the lit frame)
  concat.txt            # ffmpeg concat list (frames + per-beat durations)
  music.mp3             # PAID: create-music-elevenlabs bed
```

## Steps (script → output)

1. **Plate [PAID]** — `create-image-fal` (flux-pro ultra, 9:16) → `bg/plate_sage_1.png`.
   `gen_plate.py` is the reference wrapper (loads FAL_KEY, prompt in `config.plate`). Pick a
   `wall_style` color that complements the brand's dominant hue so the posters pop.
2. **Camera** — `recrop.py <interior_width_frac> <top_frac>` → `bg/plate_final.png`. The plate
   is high-res, so cropping closer costs no quality. `0.72 0.13` = frame ~72% of width.
3. **Detect frame** — `measure_frame.py` → `bg/corners.txt` (bright + low-sat + near-neutral
   mask → largest component → 4 corners).
4. **Mockups** — author `scene.html` (11 modules from the brand's assets + approved copy), then
   `render_art.py` → `art/art_std_01..11.png` (Playwright bare mode: `body.bare` hides the CSS
   room and the frame fills the viewport; `device_scale_factor=2`).
5. **Composite** — `composite.py`: perspective-warp each poster into the quad, **multiply the
   plate's interior luma back onto it** (`shadow_strength`), glass sheen → `frames_v2/*`.
6. **Sequence** — write `concat.txt` (frames + `duration` lines per `config.beats[].seconds`,
   repeat the last frame line), then `build_video.sh concat.txt music.mp3 out.mp4 <total_s>`.

## Adapting `scene.html` per brand

- Keep the 11 module ids (`.a1`..`.a11`, `data-i`), the `#thand` icon symbol pattern, and the
  bare-mode CSS. Swap: product image paths, wordmark/icon, palette CSS vars, and the baked
  copy (approved only). Recreate the brand icon as an SVG `<mask>` if the only source has an
  occluding element.
- Beats are opaque full-bleed; **toggle with opacity, not display** (a per-state `display:flex`
  silently overrides a `display:none` toggle).

## Split (per adding-and-testing-a-video-format.md)

- **Paid** (already generic caps): `create-image-fal` (plate), `create-music-elevenlabs` (bed).
- **Free renderer** (`render-brand-identity-reveal`): `scene.html`, `render_art.py`,
  `recrop.py`, `measure_frame.py`, `composite.py`, `build_video.sh`. (`gen_plate.py` is a
  convenience wrapper around the paid `create-image-fal` step — not part of the free cap.)
