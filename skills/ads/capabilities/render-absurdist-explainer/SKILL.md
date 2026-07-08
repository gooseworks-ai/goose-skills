---
name: render-absurdist-explainer
description: Assemble an absurdist animated-explainer video ad (~38s, 9:16) from per-scene i2v clips + their measured VO windows — retime each clip to its VO, re-encode every segment to identical 30fps/libx264/yuv420p so the concat demuxer never drops frames, concat, build a REAL-product PIL end card (never AI) with a slow Ken-Burns, mix VO (loudnorm I=-14) under music (loudnorm I=-26, volume 0.62, amix normalize=0), and burn libass captions last. FREE deterministic assembly (bash-free, Python + ffmpeg + PIL); the recipe supplies the clips, VO, music, product photo, palette, and caption table and gates the paid keyframe/clip/VO/music calls to their own capabilities. Use for the absurdist-explainer format.
status: active
---

# render-absurdist-explainer

The free, deterministic renderer for the **absurdist-explainer** video ad format — the
bright Pixar/Disney 3D spot where a personified villain (the problem) narrates the whole
ad in one voice, teaches the product's ownable mechanism through cartoon biology, lists
the damage, then watches its own scheme collapse when the product arrives. This
capability is the **FREE assembly stage only**. All generative work (nano-banana
keyframes, Seedance i2v clips, ElevenLabs VO + music) happens upstream in the recipe and
is handed to this capability as files.

It ports the validated compose recipe from two reference runs (HUM "Big Chill" cortisol
absurdism and Soteri "Eczema, the pH villain"). The recipe is deterministic — iterate the
cut for free, re-roll only the offending paid beat.

## What it does (the deterministic recipe)

1. **Per-scene retime.** Each i2v clip is retimed to its **measured** VO window
   (`scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1`,
   then `tpad=stop_mode=clone` if the VO is longer than the clip, else `-t` trim).
2. **Identical re-encode.** Every segment is re-encoded `libx264 -crf 18 -pix_fmt yuv420p
   -r 30` even if already correct — a framerate mismatch makes the concat demuxer silently
   drop frames.
3. **Concat** all scene segments + the end card via the concat demuxer (`-c copy`).
4. **Real-product end card.** `build_endcard.py` composites the REAL retail product photo
   over the brand palette (flat, or sampled from the photo's own edge pixel) with a typeset
   wordmark + claim rows + CTA pill in PIL `ImageDraw.text` — **never an AI cartoon bottle,
   never AI-rendered brand text**. `compose.py` Ken-Burnses it 1.00 → 1.04 over the dwell.
5. **Mix.** VO bus `loudnorm I=-14 TP=-1.5`, music bus `loudnorm I=-26 TP=-3` then
   `volume=0.62`, `amix inputs=2 duration=first normalize=0` → master lands at
   -14.5..-13.5 LUFS with the music ducked under the VO.
6. **Captions last.** `make_captions.py` emits a libass `.ass` (one cue per scene, Arial 64
   white / 6px outline / MarginV=330, `start = scene_start + 0.08s`, suppressed on the end
   card). `compose.py` burns it as the final filter so captions sit on top.

## Scripts (free — Python + ffmpeg + PIL, no bash, no paid calls)

- `scripts/build_endcard.py` — PIL composite of the real product photo + typeset brand
  layer (wordmark / product line / claim rows / accent CTA pill). Reads the same
  `config.json`. Run this FIRST so `end_card.image` exists before `compose.py`.
- `scripts/make_captions.py` — emits the per-scene libass `.ass` from the SAME scene table
  compose reads, so caption windows stay in lockstep with the cut. Run before `compose.py`
  (or point `config.captions_ass` at nothing to skip captions).
- `scripts/compose.py` — the assembler: per-scene retime + identical 30fps re-encode →
  concat → Ken-Burns end card → VO/music loudnorm mix → burn captions → master mp4.
- `scripts/config.example.json` — the shape of the `config` the recipe binds (the
  brand-neutralised Soteri values as a worked reference).

## Inputs (all via `--config` + a runtime work dir — NO hardcoded paths)

`config.json` carries: `scenes[]` (each `{id, clip, target_sec, vo, caption, atempo?}`
where `target_sec` is the **measured** VO window), `end_card{product_image, image,
dwell_sec, zoom_to, wordmark, product_line, claims[], cta, background?}`, `brand_palette
{primary, primary_lite, accent, grey}`, `music_bed`, `music_volume` (default 0.62),
`atempo` (compose-stage VO speed-up, default off; the reference runs used 1.3 when the VO
read slow), `captions_ass`, and `caption_style`. See `config.example.json`.

## Craft rules (load-bearing — faithful to the source molecule)

- **The end card is the REAL product photo, composited — never an AI cartoon bottle.**
  Both reference runs shipped an AI bottle first and had to re-shoot with the real photo.
- **No AI-rendered brand text anywhere.** Wordmark, claims, CTA, motif — all PIL
  `ImageDraw.text`. AI draws the world + characters only.
- **Re-encode every segment to 30fps before concat**, even if already correct, or the
  concat demuxer silently drops frames.
- **`target_sec` is the MEASURED VO duration** (ffprobe each VO mp3), never a planned word
  count — VO drives the per-scene timing.
- **Mix constants are validated** — VO -14 LUFS, music -26 LUFS then `volume≈0.62` (Soteri)
  to `0.70` (Big Chill), `amix normalize=0`. Master target -14.5..-13.5 LUFS,
  true-peak ≤ -1.5 dBFS.
- **Caption `start = scene_start + 0.08s`**, suppressed on the end card (its typeset copy
  carries the message — two text layers at one spot are both unreadable).

## Requires

`watch` (QC the final master — confirm the villain silhouette holds, the single voice
carries the whole spot, the motif lands ≥3×, no AI brand text leaked into a cartoon
background, the end card is the real product, and duration is within ±0.1s of the summed
windows). The recipe gates the paid `create-image-fal` (keyframes), `create-video-fal`
(Seedance i2v), `create-vo-elevenlabs`, and `create-music-elevenlabs` calls to their own
capabilities — this capability itself makes NO paid calls.
