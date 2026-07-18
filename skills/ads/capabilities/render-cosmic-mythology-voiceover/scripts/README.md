# render-cosmic-mythology-voiceover scripts — the FREE assembly

`render-cosmic-mythology-voiceover` is the **deterministic, $0 assembly stage** of the
cosmic-mythology-voiceover format. The paid stages (the spoken VO, the N cosmic hero stills) are
separate capabilities — `create-vo-elevenlabs`, `create-image-fal`. This capability spends nothing
(the caption burn has a free local Whisper + ffmpeg fallback): it takes the atempo VO + the stills
+ the per-cut weight array + the hook line and stitches the finished master. Re-cuts (re-weighted
windows, new hook timing, caption chunking, zoom params) reuse the existing VO / stills and cost
**$0**.

`config.example.json` is the worked example (WishAstro "Saturn isn't your villain", ~31s
1080×1920). `PIPELINE.md` maps every config block to its source step. This README documents the
FREE assembly pieces that `render-cosmic-mythology-voiceover` owns.

## 1. Weighted beat-sync sequencing

The delivered VO duration sets the timeline. For each cut in `sequence.cuts[]`, the cut duration is
`cut_dur = VO_dur × weight / Σweights` — so heavier weights **hold longer** on the emotional beats
(the open, the reframe, the "he builds you" close) and the lighter setup cuts run shorter. Every
cut stays proportional to the whole VO; never trim the VO to a pre-planned grid. Stills are
reusable — the sequence repeats a few across the ~10–12 cuts.

## 2. Ken-Burns render per still

Each cut renders through the ken-burns-clip atom (`render.py`): scale 2×, center crop, and a
`zoompan` to the configured `zoom_end` (~1.10). Apply `zoom_out` on the flagged cuts. The FIRST cut
gets a `fade_in` (~0.4s) up from black and the LAST cut a `fade_out` (~0.6s); the body cuts
hard-join.

## 3. Concat + VO composite + hook overlay

- **Concat:** ffmpeg-concat the N Ken-Burns clips (`-c copy`) → the background.
- **VO composite:** one ffmpeg pass composites the atempo VO under the picture (libx264 `crf 18` +
  aac 192k). The spoken VO IS the bed — no separate VO and no music bed by default.
- **Hook overlay:** the ONE reframe line is burned via ffmpeg `drawtext` with an alpha-fade window
  (fade in ~0.5s, hold, fade out ~0.6s) over the **open** only — never a persistent caption, never
  in-world text on a still.

## 4. Caption burn

VEED/Whisper subtitle burn tracks the spoken VO in the **bottom** third, white `#FFFFFF`, on the
draft. If the host ffmpeg lacks libass (no `subtitles`/`ass` filter), render the cues as timed PIL
PNG overlays composited with ffmpeg `overlay=…:enable='between(t,st,en)'` instead — same bottom
placement, no libass dependency. A local Whisper + ffmpeg burn is the **free** fallback to the VEED
tier. The stills carry no in-world text — the reel's only text is the hook + these captions.

## 5. FFmpeg composite

FFmpeg stitches the master: weighted-sequence the cuts, Ken-Burns-render each still, concat, burn
the VO composite + the hook alpha-fade + the caption track → a 1080×1920 h264 + aac master (~31s).
Deterministic, no paid calls, no keys (the local caption fallback is free).
