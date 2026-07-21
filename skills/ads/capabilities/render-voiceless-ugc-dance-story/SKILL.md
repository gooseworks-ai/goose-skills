---
name: render-voiceless-ugc-dance-story
description: Assemble a voiceless UGC-style dance-story ad from a config — music plus movement plus burned TEXT OVERLAYS are the whole ad (NO voiceover, NO auto-captions) while N per-shot i2v dance clips (one recurring locked creator, one look pack) are each cut to their beat-snapped window from a librosa beat grid and hard-concatenated on the beat, 7 Playwright text-overlay PNGs (bold white, upper-third, 88% safe area, hard-pop on the beat, a brand-accent progress bar plus a Results-vary disclaimer) applied as time-gated overlays, and closed on a brand end-card PNG with the music settling and fading under it — never AI-rendered text. This is the FREE deterministic assembly stage (build overlays plus cut-to-beat plus hard concat plus time-gated overlays plus music mux plus end card); the music, creator, stills, and clips come from create-music-elevenlabs / create-image-gpt-image-fal / create-image-fal / create-video-fal. Use for the voiceless-ugc-dance-story format.
status: active
---

# render-voiceless-ugc-dance-story

Assemble a **voiceless UGC dance-story** ad from a config: a fast-cut vertical spot where a single
recurring generated creator dances through a transformation arc while **burned text overlays are the
whole ad copy** — music + movement + text, **no voiceover and no auto-captions**. Each shot is cut to
the music's beat grid, then a brand end card. This capability is the **FREE, deterministic assembly**
— build the overlays, cut-to-beat, hard-concat, apply the time-gated overlays, and append the brand
end card with the music under it.

`scripts/config.example.json` is the worked example (Bioma "dance story", 18s 1080×1920 9:16, 8 dance
shots + a 2.5s end card); `scripts/PIPELINE.md` maps every config block to its source step and
`scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are separate
capabilities: the 18s music (`create-music-elevenlabs`) beat-tracked with librosa so the DOWNBEATS
set the segment durations; one locked recurring creator (`create-image-gpt-image-fal` anchor) + one
per-shot still per shot in one look pack (`create-image-fal`, Nano Banana Pro image-edit); and one
Seedance i2v dance clip per shot (`create-video-fal`, `generate_audio` off). Given the music +
`beat-grid.json` + one clip per shot + the narrative-beat text + the brand end-card PNG,
`render-voiceless-ugc-dance-story` builds the overlay PNGs, cuts each clip to its beat window,
hard-concats on the beat, applies the time-gated overlays, appends the end card, and muxes the music
under it → the master. Re-cuts reuse the existing music / stills / clips and cost **$0**.

## Contract (the free assembly)

- **The overlays ARE the ad copy — no VO, no auto-captions.** The generated music is the full bed
  (no VO to duck under); the 7 burned text overlays carry the whole message. Never add a voiceover,
  a second bed, or YouTube auto-captions — auto-captions collide with the overlays.
- **Plan the timeline AROUND the delivered music's BEAT GRID.** Beat-track the music with librosa
  (assume 4/4); the DOWNBEATS set the segment durations. Snap every shot window to the beat grid —
  never trim the music to a pre-planned cut. Re-extract if the music changes.
- **Overlays — Playwright + Chromium PNGs, upper-third, hard-pop on the beat.** Render each
  narrative-beat line as a transparent 1080×1920 PNG — bold white (font-weight 800, ~104px, 84px on
  long lines), a soft dark `text-shadow` stack for legibility over any plate, **upper-third**
  placement within the **88% safe area**, one line per beat. Apply each as a time-gated overlay
  (`overlay=0:0:enable='between(t,st,en)'`) — a **HARD POP** on/off on the beat, never a dissolve. A
  **brand-accent progress bar** fills on the proof overlay; the **`Results vary.` disclaimer** sits
  on the CTA overlay (always-on compliance). NO background pill.
- **Land the drop on the Turn.** The soft intro (0–2s) stays minimal so the visual doesn't fight the
  anticipation; the drop @~2.0–2.2s syncs to the Turn beat — the second overlay pops there.
- **Cut-to-beat + hard-concat.** Segment-normalize each clip to its beat-snapped window
  (`scale=…:force_original_aspect_ratio=increase,crop,setsar=1,fps=30`, `-an`), then
  concat-demux hard on the beat — no crossfades. The fast cut (~8 micro-shots + end card) is the
  format.
- **End card from a brand PNG — never AI-render brand text.** Append the brand end-card PNG as a
  ~2.5s segment holding WITH the music still playing under it (afade-out over the tail — no abrupt
  cut, no silent tail). A diffusion model garbles a wordmark, so the end card is a supplied PNG.
- **FFmpeg composite, deterministic, FREE.** 5 stages — segment-normalize → concat-demux →
  time-gated overlays → music mux (`atrim=0:D,afade=t=out:st=D-0.8:d=0.8,aresample=44100`) → encode
  libx264 crf18 + AAC 192k → a 1080×1920 h264+aac master. No paid calls, no keys.
- **This format is naturally libass-free.** The overlays are already PIL/HTML PNGs composited via
  `overlay=0:0:enable='between(t,st,en)'`, so no `subtitles`/`ass`/`drawtext` filter is needed — many
  ffmpeg builds (e.g. Homebrew) lack libass, and this pipeline never depends on it. If you ever add a
  text-burn path, keep it a timed PIL PNG overlay at the same upper-third placement, not an ASS burn.
- **QC PER SCENE, never just the master — the two failure modes are content, not assembly.** The
  upstream still/i2v steps can (a) drift the creator or **change the wardrobe** partway through and
  (b) **distort hands** or **garble the product LABEL** on the payoff/CTA shots. Both hide at
  thumbnail size. Extract a **2 fps** contact sheet + a per-shot **FACE** crop and **HAND** crop
  (across each clip's full duration), confirm the ONE creator + wardrobe holds and there are no
  distorted/extra fingers or garbled bottle labels, and re-check the **served** bytes after publish.
  A drifted shot means regenerating that shot's **STILL** (not re-cutting) — see the recipe STEP 3/6.
