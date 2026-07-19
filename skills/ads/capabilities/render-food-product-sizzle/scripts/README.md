# render-food-product-sizzle scripts — the FREE assembly

`render-food-product-sizzle` is the **deterministic, $0 assembly stage** of the food-product sizzle
format. The paid stages (the ~4 photographic macro keyframes, the ~4 locked-off i2v clips, the
non-diegetic music bed) are separate capabilities — `create-image-fal`, `create-video-fal`,
`create-music-elevenlabs`. This capability spends nothing: it takes the ~4 clips + the music bed +
the diegetic SFX + the real logo PNG + the real product PNG and stitches the finished master.
Re-cuts (new callout timing, a swapped end card, re-timed SFX cues, a grain-pass toggle) reuse the
existing keyframes / clips / music and cost **$0**.

`config.example.json` is the worked example (Lineage Provisions "Beef Sticks Sizzle", ~14s
1080×1920). `PIPELINE.md` maps every config block to its source step. This README documents the FREE
assembly pieces that `render-food-product-sizzle` owns.

## 1. Static end card — PIL from the real logo + product PNG, no AI text

The end card is composed **entirely in PIL** (NO AI): the ivory (or brand-color) bg + the real logo
PNG (upper third, ~62% width) + the real product PNG (centered, with a soft shadow) + a serif
heritage headline + a smaller CTA line. The brand text is **never** AI-rendered — a diffusion model
garbles a wordmark and the packaging. On macOS pick a serif with the em-dash / middle-dot glyph
(use ` · `). It holds ~3s after the body with the music still playing under it.

## 2. Diegetic SFX — ffmpeg lavfi, on the tactile beats

Two short diegetic hits are synthesized with ffmpeg lavfi `anoisesrc` (NO AI): a crisp ~120ms snap
(white noise, fast envelope, highpass / lowpass, `acompressor`) on the fiber tear, and a ~180ms tear
(pink noise, low-end roll) on the box-open. They mix in at their **measured cue points** (~1.5s and
~11s in the demo), not round numbers — a couple of hits, not a wall of sound.

## 3. Music bed — no vocals, no sparse intro

The supplied / generated acoustic-bluegrass bed (no vocals — no VO to duck under) opens sparse; the
upstream step trims the ~2.5s intro so it kicks in from frame 0. The assembly `loudnorm`s it and
fades it in / out to the master length, playing it UNDER the end card with a fade tail (no silent
tail).

## 4. FFmpeg composite

FFmpeg stitches the master: normalize fps / SAR across the ~4 body clips, concat them in scene order,
apply the anti-AI grain pass GLOBALLY (`eq=contrast=1.06:saturation=0.93,hqdn3d=1.5:1.5:3:3,noise=alls=8:allf=t+u`
— load-bearing for the tactile / photographic read), composite the audio (music bed + `snap.wav` +
`tear.wav` at their cues), append the PIL end card, burn the OPTIONAL serif stat-callout pills at
their beats, mux with a fade tail, and `loudnorm`. Output is a 1080×1920 h264 + aac master (~14s).
Deterministic, no paid calls, no keys.

**`%` in a callout** — ffmpeg `drawtext` reads a raw `%` as a strftime spec; write the callout string
to a textfile and use `textfile=` + `expansion=none` (see the source `build_master_v2.sh` `c1.txt` /
`c5.txt`).

**No libass needed** — the sizzle body carries no burned captions (it is wordless); the stat-callout
pills are `drawtext` / `drawbox` overlays, not subtitle events.
