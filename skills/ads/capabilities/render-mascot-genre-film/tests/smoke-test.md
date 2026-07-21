# Smoke Test

Given the 2 atmospheric plates, the 2 locked mascot stills (a distant silhouette + a close reveal),
the Kling i2v reveal clip, the instrumental genre bed, and one whispered VO line,
`render-mascot-genre-film` assembles the master: render the HTML hyperframes (notification banners +
title + end card), synthesize the 4 ffmpeg SFX, grade + zoom each of the 8 beats, ease the banners
in, hard-cut concat, mix the 8-track audio (the music dropping to near-silence at the reveal),
loudnorm to −14 LUFS, and mux → 1080×1920 h264+aac (~22s).

Pass when the assembly runs to a valid MP4 and:
- 8 hard-cut beats with boundaries at `[3.0, 6.0, 9.0, 12.0, 13.6, 18.0, 20.0, 22.0]` (durations
  `[3.0, 3.0, 3.0, 3.0, 1.6, 4.4, 2.0, 2.0]`); the mascot holds 100% on-model through the reveal;
- all on-screen text is crisp HTML (banners + title + end card) composited as PNG overlays — **no
  AI-rendered text, no libass dependency**;
- the grade gradient reads cozy→sickly (warm neutral → teal-green); grain is subtle on the
  photographic beats and ZERO on the title/end cards;
- the instrumental bed is the only music, dropping to ~0.07 at the ~13.6s reveal and returning for
  the button, with an afade tail (no silent tail); the whispered VO line lands with its pitch/reverb
  mix treatment; the reveal sting hits the smash-cut; ~−14 LUFS;
- a sane file size (~25 MB, not 176 MB);
- **no paid call is made** — the mascot anchor, plates, i2v reveal, music, and VO come from the paid
  capabilities (`create-image-fal` / `create-video-fal` / `create-music-elevenlabs` /
  `create-vo-elevenlabs`); this assembly (HTML hyperframes + ffmpeg SFX synth + grade/zoom/overlay/
  concat/8-track mix/loudnorm/mux) is $0 and a re-cut reuses the existing stills / clip / audio.
