---
name: render-brand-identity-reveal
description: Render a 'brand identity reveal' video from a config — a single poster frame in a real, softly-lit space (real wall, soft-focus plant in the corner, dappled leaf shadow, illuminated poster) whose artwork HARD-CUTS through ~10 on-brand poster mockups (hero product, IG post, hanging banners, sticker sheet, logo lockup, poster, two lifestyle stills, packaging, big icon) then holds on a brand end card. The environment plate is one create-image-fal generation; the mockups are real-DOM HTML frame-stepped via Playwright, perspective-composited into the detected frame quad with the plate's real leaf-shadow multiplied back onto each poster (reads as behind glass), sequenced by FFmpeg. Deterministic assembly, FREE (the plate comes from create-image-fal, the bed from create-music-elevenlabs), music bed only and approved brand copy only. Use for the brand-identity-reveal format.
status: active
---

# render-brand-identity-reveal

Render the 'brand identity reveal' format from a config. The signature is a single fixed
poster frame in a REAL, softly-lit space (the illuminated poster-frame look of a
boutique/cinema): a real wall, a real soft-focus plant in the lower-left corner, dappled
leaf shadow. The artwork INSIDE the frame HARD-CUTS (no crossfade) through 11 beats — 10
on-brand poster mockups + a brand END CARD held ~3s. Music bed only, NO voiceover; copy is
baked into each mockup, never overlaid as captions.

This capability is the **FREE** assembly only. The paid parts are separate generic
capabilities the recipe names — `create-image-fal` (the one-shot environment plate) and
`create-music-elevenlabs` (the bed). Never re-implement them here.

## Three layers

1. **Environment plate** (PAID, `create-image-fal`, flux-pro ultra, 9:16) — an *empty* lit
   poster frame in a real space, high-res so the camera can be pushed closer by cropping.
   Pick a wall color that makes the brand's poster colors POP (complement of the dominant hue).
2. **Mockups** (FREE) — real-DOM HTML/CSS (`scene.html`), one poster per beat, built from the
   brand's real assets + approved copy, frame-stepped via Playwright (`render_art.py`, bare
   mode, device_scale_factor 2).
3. **Composite** (FREE) — `measure_frame.py` detects the blank poster interior quad;
   `composite.py` perspective-warps each poster into it AND multiplies the plate's real
   leaf-shadow/light back onto the poster (so it reads as behind glass) + a glass sheen;
   `build_video.sh` sequences the frames with the music bed.

## Inputs

- `config.json` — copy `scripts/config.example.json` and edit (canvas, plate prompt +
  wall_style, camera crop, per-beat durations, end-card copy). Schema + per-file working-dir
  layout are documented in `scripts/PIPELINE.md`.
- The brand's REAL product/packaging/lifestyle stills, wordmark, and icon (recreate the icon
  as an SVG `<mask>` if the only source has an occluding element). Approved copy only.

## Workflow (free assembly)

```bash
CAP=skills/ads/capabilities/render-brand-identity-reveal
RUN=<project>/working    # holds scene.html + assets/ + the create-image-fal plate in bg/

python3 $CAP/scripts/recrop.py 0.72 0.13      # camera distance (bigger frac = bigger frame)
python3 $CAP/scripts/measure_frame.py         # detect the blank poster interior quad
python3 $CAP/scripts/render_art.py            # render each poster standalone (Playwright, dsf 2)
python3 $CAP/scripts/composite.py             # warp into frame + shadow multiply + sheen
bash    $CAP/scripts/build_video.sh $RUN/concat.txt $RUN/music.mp3 out.mp4 13.05 1.0
```

Then `watch` the master (music-only, every poster legible, shadow falls across the art, end
card holds). See `scripts/PIPELINE.md` for adapting `scene.html` per brand.

## Rules

- Approved brand copy ONLY — never invent claims, customers, results, or testimonials.
- Toggle beats with OPACITY, not `display` (a per-state `display:flex` silently overrides a
  `display:none` toggle and paints one state over all others).
- Camera distance = re-crop the high-res plate (`recrop.py`), don't regenerate.
- The realism trick = MULTIPLY the plate's real shadow/light back onto each composited poster.
- Music bed only, no VO. Close on the brand end card.

## Failure Modes

- Every rendered frame identical → a per-beat `display:` rule beat the visibility toggle; use
  opacity.
- Playwright `evaluate(fn, arg)` didn't switch state in a loop → bake the beat index into the
  JS string and return the applied state to assert it.
- Composited poster looks pasted-on → you skipped the shadow multiply (shadow_strength ~0.85).
- Studio product won't cut out (white cap == seamless bg) → present as a photo-tile, don't
  corner-flood-fill.
- Playwright missing under node → use the python playwright + cached chromium.
