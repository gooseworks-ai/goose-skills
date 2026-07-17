---
name: render-3d-product-showcase
description: Assemble a premium 3D product-showcase ad from a config — four beat clips (an orbiting hero rotation, a macro push-in, a physics reveal, a typographic close) normalized to the brand-color canvas, hard-concatenated in order, closed on a deterministic Playwright brand end card, and mixed under one instrumental bed at loudnorm I=-16 (music-only, no VO). Ships the runnable build_endcard.py + build_masters.py; the rotation/macro clips are create-video-fal i2v seeded on a create-image-fal styled hero, the reveal is Veo3 i2v, and the bed is create-music-elevenlabs. Use for the 3d-product-showcase format.
status: active
---

# render-3d-product-showcase

Assemble a premium **3D product-showcase** ad from a config: one real product floats centered
on a clean seamless brand-color backdrop and sells itself across four beats — an orbiting hero
rotation, a macro push-in on the surface detail, a physics reveal (`exploded_view` /
`particle_disintegration` / `liquid_splash`, or `rotation_only`), then a typographic brand
close. This capability is the **FREE, deterministic assembly** that stitches the delivered
beats into the master; it spends nothing.

`scripts/config.example.json` is the worked example (DIBS Beauty "Desert Island Duo", ~15s
720×1280 9:16); `scripts/build_endcard.py` + `scripts/build_masters.py` are the runnable free
assembly; `scripts/PIPELINE.md` maps every config block to its source step; `scripts/README.md`
documents the assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are
separate capabilities: Beats 1 & 2 (hero rotation + macro push-in) are **`create-video-fal`
image-to-video seeded on a `create-image-fal` styled hero** — a nano-banana restyle of the
brand's REAL product photo onto the seamless studio set, so the product geometry is real and
never AI-invented; Beat 3 (the physics reveal) is a Veo3 image-to-video seeded on Beat 1's last
frame (also `create-video-fal`); the one instrumental bed is `create-music-elevenlabs`. **There
is no Higgsfield / Marketing Studio in this format** — everything paid runs through the
fal-proxy / elevenlabs-proxy so it bills the Ads agent.

Given those beats + the brand wordmark, this capability:

1. `build_endcard.py --bg beat1_last_frame.png --headline "…" --wordmark <wordmark> --out endcard.png`
   — the deterministic Beat-4 hyperframe (Playwright 1080×1920 → ffmpeg-scale to 720×1280).
2. `build_masters.py --config config.json --clips working/clips --endcard endcard.png --music music.mp3 --out master.mp4`
   — trims each beat to its window, normalizes to the brand canvas, hard-concats, mixes the bed.

Re-cuts reuse the existing beats and cost **$0**.

## Contract (the free assembly)

- **Music-only, no VO.** One ElevenLabs instrumental bed carries the film; nobody speaks. Do
  not add a spoken voiceover or a second bed.
- **Beat 1's last frame is the shared anchor.** Extract it (`ffmpeg -sseof -0.1 … -frames:v 1`)
  once — it seeds the Veo3 Beat 3 AND backs the Beat 4 end-card hyperframe, so the product +
  lighting carry across all four beats and the geometry never AI-drifts.
- **End card via Playwright from the real wordmark — never AI-render brand text.** The brand
  close is a deterministic hyperframe (Beat 1 last frame + scrim + Playfair headline + the real
  wordmark, recolored for contrast). `build_endcard.py` auto-picks a legible headline color from
  the bg luminance and renders 1080×1920 then scales to 720×1280. Playfair is loaded from Google
  Fonts; bundle the .ttf if determinism offline matters. If the resolvable Playwright wants an
  uninstalled browser build, export `PW_CHROME=<installed Chromium binary>` (shoot.js honours it).
- **Normalize each beat to the brand canvas, hard-concat.** Per beat: trim to the window, strip
  the i2v model's auto-audio (`-an`), scale + pad to 720×1280 with the brand `bg` pad color,
  24fps, yuv420p, crf 18 → concat demuxer. No dissolves.
- **FFmpeg mix, deterministic, FREE.** Mix one instrumental bed (`afade` in/out +
  `loudnorm I=-16 TP=-1.5 LRA=11`, apad + atrimmed to master duration) over the concatenated
  beats → a 720×1280 h264+aac master. No paid calls, no keys.
