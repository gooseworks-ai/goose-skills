# render-voiceless-ugc-dance-story scripts — the FREE assembly

`render-voiceless-ugc-dance-story` is the **deterministic, $0 assembly stage** of the voiceless UGC
dance-story format. The paid stages (the 18s music, the creator lock, the N per-shot stills, the N
Seedance i2v dance clips) are separate capabilities — `create-music-elevenlabs`,
`create-image-gpt-image-fal`, `create-image-fal`, `create-video-fal`. This capability spends nothing:
it takes the music + `beat-grid.json` + one clip per shot + the narrative-beat text + the brand
end-card PNG and stitches the finished master. Re-cuts (new overlay windows, re-timed segments, a
swapped end card) reuse the existing music / stills / clips and cost **$0**.

`config.example.json` is the worked example (Bioma "dance story", 18s 1080×1920). `PIPELINE.md` maps
every config block to its source step. This README documents the FREE assembly pieces that
`render-voiceless-ugc-dance-story` owns.

## 1. Overlays — the ad copy, as Playwright PNGs (NOT captions)

The message lives in **7 burned text overlays**, not a voiceover and **not auto-captions**. Playwright
+ Chromium renders each narrative-beat line as a transparent 1080×1920 PNG from HTML — bold white
(font-weight 800, **~104px**, 84px on the two long mechanism/proof lines), a soft dark `text-shadow`
stack for legibility over any plate, **upper-third** placement (`padding: 300px 110px 0`) within the
**88% safe area**, one line per beat. The proof overlay carries a **brand-accent green progress bar**
(`#00a66f`, 78%); the CTA overlay carries the **`Results vary.` disclaimer** (always-on compliance).
`omit_background: true`. Do **not** burn auto-captions — they collide with the overlays. Font note:
the source spec said Lexend, the real render used **Plus Jakarta Sans** — either bold geometric sans
works.

## 2. Cut-to-beat + hard-concat on the beat

The music's BEAT GRID (librosa beat-track, 4/4) sets the timeline — the DOWNBEATS set the segment
durations. Assembly segment-normalizes each dance clip
(`scale=…:force_original_aspect_ratio=increase,crop,setsar=1,fps=30`, `-an`), trims it to its
beat-snapped window (`-ss src_in -t (t_end - t_start)`), and concat-demuxes **hard on the beat** — no
crossfades. The fast cut (~8 micro-shots + a 2.5s end card = 18s) is the format; the drop @~2.0–2.2s
lands on the Turn (the second overlay).

## 3. Time-gated overlays + brand end card — no AI text

- **Overlays:** each PNG is applied as a time-gated overlay
  (`overlay=0:0:enable='between(t,st,en)'` from `overlay_windows`) — a **HARD POP** on/off on the
  beat, never a dissolve.
- **End card:** the brand end-card PNG is looped into a ~2.5s segment and concatenated onto the tail,
  holding WITH the music still playing under it.

The brand text is **never** AI-rendered — the end card is a supplied PNG (a diffusion model garbles a
wordmark).

## 4. FFmpeg composite

FFmpeg stitches the master in 5 stages: segment-normalize each clip to its beat window,
concat-demux the segments + end card, apply the time-gated overlays, mux the music OVER the whole
video with `atrim=0:18,afade=t=out:st=17.2:d=0.8,aresample=44100` (a 0.8s fade so the end card
breathes — no abrupt cut), and encode libx264 crf18 + AAC 192k → a 1080×1920 h264 + aac master.
**This format is naturally libass-free:** the overlays are already PIL/HTML PNGs composited via
`overlay=…:enable`, so no `subtitles`/`ass`/`drawtext` filter is needed — many ffmpeg builds (e.g.
Homebrew) lack libass, and this pipeline never touches it. Deterministic, no paid calls, no keys.

## 5. QC per scene before publish (the two content failure modes)

The assembly is faithful, but the upstream still/i2v can slip two defects that a sparse-still watch
misses in an 18s master:

- **Creator / wardrobe drift** — the face, hair, or outfit changes partway through (lives in the
  STILL; regenerate the drifted shot's still, don't re-cut). Keep the anchor the PRIMARY ref and the
  wardrobe hard-lock in every still prompt.
- **Distorted hands / garbled product label** — realistic-finger distortion, or a warped/garbled
  bottle LABEL on the payoff/CTA shots (s04/s08). Add the hand/label negative; hold the product shots
  nearly still (`src_in` low) so the label stays clean.

Extract a **2 fps** contact sheet across the whole master + a per-shot **FACE** crop and **HAND**
crop (across each clip's full duration); audit ALL shots to find the true drift boundary; then
re-extract frames from the **served** bytes (`get_download_url`), not the local file, after publish.
(voiceless-ugc-dance-story, Bioma run-01.)
