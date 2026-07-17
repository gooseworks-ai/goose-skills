---
name: render-3d-product-showcase
description: Assemble a premium 3D product-showcase ad from a config — four beat clips (a 360 hero rotation, a macro push-in, a physics reveal, a typographic close) normalized to the brand-color canvas, hard-concatenated in order, closed on a deterministic Playwright/PIL brand end card, and mixed under one instrumental bed at loudnorm I=-16 (music-only, no VO). This is the FREE deterministic assembly stage (last-frame extract, end-card hyperframe, normalize, concat, music mix); the rotation/macro clips come from Marketing Studio, the reveal from Veo3 i2v, and the bed from create-music-elevenlabs. Use for the 3d-product-showcase format.
status: active
---

# render-3d-product-showcase

Assemble a premium **3D product-showcase** ad from a config: one real product floats centered
on a clean seamless brand-color backdrop and sells itself across four beats — a 360 hero
rotation, a macro push-in on the surface detail, a physics reveal (`exploded_view` /
`particle_disintegration` / `liquid_splash`, or `rotation_only`), then a typographic brand
close. This capability is the **FREE, deterministic assembly** that stitches the delivered
beats into the master; it spends nothing.

`scripts/config.example.json` is the worked example (DIBS Beauty "Desert Island Duo", ~14s
720×1280 9:16); `scripts/PIPELINE.md` maps every config block to its source step and
`scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are
separate capabilities: Beats 1 & 2 (hero rotation + macro push-in) come from Higgsfield
Marketing Studio `product_showcase` Hyper Motion off the imported PDP product (real label,
never AI-invented) via `create-video-fal`; Beat 3 (the physics reveal) is a Veo3
image-to-video seeded on Beat 1's last frame (`create-video-fal`); the one instrumental bed
is `create-music-elevenlabs` (`force_instrumental` true). Given those beats + the brand
wordmark, `render-3d-product-showcase` extracts Beat 1's last frame, builds the Playwright
end-card hyperframe, normalizes each beat to the brand canvas, hard-concats, mixes the bed,
and muxes → the master. Re-cuts reuse the existing beats and cost **$0**.

## Contract (the free assembly)

- **Music-only, no VO.** One ElevenLabs instrumental bed carries the film; nobody speaks. Do
  not add a spoken voiceover or a second bed.
- **Beat 1's last frame is the shared anchor.** Extract it (`ffmpeg -sseof -0.1 … -frames:v 1`)
  once — it seeds the Veo3 Beat 3 AND backs the Beat 4 end-card hyperframe, so the product +
  lighting carry across all four beats and the label is never AI-invented.
- **End card via Playwright/PIL from the real wordmark — never AI-render brand text.** The
  brand close is a deterministic hyperframe (Beat 1 last frame + scrim + Playfair headline
  spring-rise + the real wordmark fade-in); a diffusion model garbles a wordmark. Render at
  1080×1920 then ffmpeg-scale to 720×1280 (matching the viewport to the output clips the edge).
- **Normalize each beat to the brand canvas, hard-concat.** Per beat: strip the MS auto-audio
  (`-an`), scale + pad to 720×1280 with the brand `bg` pad color, 24fps, yuv420p, crf 18 →
  concat demuxer. No dissolves.
- **FFmpeg mix, deterministic, FREE.** Mix one instrumental bed (`afade` in/out +
  `loudnorm I=-16 TP=-1.5 LRA=11`, atrimmed to master duration) over the concatenated beats →
  a 720×1280 h264+aac master. No paid calls, no keys.
