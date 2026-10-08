---
name: render-absurdist-explainer
description: Assemble an absurdist animated-explainer video ad (~38s, 9:16) from per-scene i2v clips + their measured VO windows — retime each clip to its VO, re-encode every segment to identical 30fps/libx264/yuv420p so the concat demuxer never drops frames, concat, build a REAL-product PIL end card (never AI) with a slow Ken-Burns, mix VO (loudnorm I=-14) under music (loudnorm I=-26, volume 0.62, amix normalize=0), and burn libass captions last. FREE deterministic assembly (bash-free, Python + ffmpeg + PIL); the recipe supplies the clips, VO, music, product photo, palette, and caption table and gates the paid keyframe/clip/VO/music calls to their own capabilities. Use for the absurdist-explainer format.
status: active
---

# render-absurdist-explainer

The free, deterministic renderer for the **absurdist-explainer** video ad format — an
animated spot that explains one problem and how the product fixes it. The format is the
mechanics: show the problem in a funny, exaggerated cartoon way, teach the product's
ownable mechanism visually, show what the problem costs, bring the product in, land the
fix as the climax, pay it off, end on a real-product card. One narrator voice carries the
whole spot. *How* the story is told (problem → fix, how it works, a day in the life, the
product as hero, or a villain arc) is the user's choice, made upstream. This capability
is the **FREE assembly stage only**. All generative work (nano-banana keyframes, Seedance
i2v clips, ElevenLabs VO + music) happens upstream in the recipe and is handed to this
capability as files.

It ports the validated compose recipe from two reference runs (a cortisol/stress
supplement and a baby-eczema cream; both happened to use the villain arc). The recipe is
deterministic — iterate the cut for free, re-roll only the offending paid beat.

## Choices

The creative calls are made upstream by the recipe's `choices` and arrive here only as
files and config values. This renderer is story- and style-agnostic: it never assumes a
story shape, a cast, a look, a narrator or a music style.

- **`story_shape`** — how the story is told: problem → fix (no villain) / how it works /
  a day in the life / the product as hero / villain arc (the problem as a cartoon villain
  who schemes and loses). Reaches this capability as the per-scene `caption` text and the
  VO files. Asked of the user; the demo used the villain arc.
- **`cast`** — who the cartoon characters are (the customer, the product as a character,
  a mascot; a personified problem only on the villain arc). Reaches this capability only
  inside the clips. Asked of the user.
- **`narrator`** — who speaks the single VO track. Arrives as the `scenes[].vo` files.
  Asked of the user; the demo used the villain (villain arc only).
- **`visual_style`** — the art style of the i2v clips (`scenes[].clip`). Asked of the
  user; the demo used Pixar-style 3D. Nothing here depends on it.
- **`narrator_voice`** — the voice cast for the VO. Asked of the user; the demo used a
  characterful male villain voice.
- **`music`** — the bed at `music_bed`. Asked of the user; the demo used whimsical
  pizzicato + woodwinds + xylophone. The mix constants below apply to any style.

## What it does (the deterministic recipe)

1. **Per-scene retime.** Each i2v clip is retimed to its **measured** VO window
   (`scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1`,
   then `tpad=stop_mode=clone` if the VO is longer than the clip, else a trim). Each
   window is snapped to a whole number of frames first. `compose.py` and
   `make_captions.py` use the same rule, so video cuts, VO windows and caption cues share
   the same cut times and a caption never outlives its cut.
2. **Identical re-encode.** Every segment is re-encoded `libx264 -crf 18 -pix_fmt yuv420p
   -r 30` even if already correct — a framerate mismatch makes the concat demuxer silently
   drop frames.
3. **Concat** all scene segments + the end card via the concat demuxer (`-c copy`).
4. **Real-product end card.** `build_endcard.py` composites the REAL retail product photo
   over the brand palette (flat, or sampled from the photo's own edge pixel) with a typeset
   wordmark + claim rows + CTA pill in PIL `ImageDraw.text` — **never an AI cartoon bottle,
   never AI-rendered brand text**. `compose.py` Ken-Burnses it 1.00 -> 1.04 over the dwell.
   Text that would be hard to read on its background (a dark brand colour on a dark
   photo) is drawn in white or near-black instead, with a warning. If `end_card.vo` is
   set, that spoken line plays from the start of the end-card window, and the dwell is
   stretched to at least the line's duration + 0.5s.
5. **Mix.** VO bus `loudnorm I=-14 TP=-1.5`, music bus `loudnorm I=-26 TP=-3` then
   `volume=0.62`, `amix inputs=2 duration=first normalize=0`, so the music is ducked
   under the VO.
6. **Master pass.** The mix is measured, gained to -14 LUFS, limited, encoded to AAC and
   measured again. The pass repeats until the encoded audio is at -14.5..-13.5 LUFS with
   a true peak <= -1.5 dBFS. `compose.py` prints the measured loudness and peak.
7. **Captions last.** `make_captions.py` emits a libass `.ass` (one cue per scene, Arial 64
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
  concat -> Ken-Burns end card (voiced if `end_card.vo` is set) -> VO/music loudnorm mix
  -> master loudness pass -> burn captions -> master mp4.
- `scripts/config.example.json` — the shape of the `config` the recipe binds. Its values
  are a labelled worked example (the demo build: a villain-arc eczema story, placeholder
  brand).
  Captions, end-card copy and palette come from the user's brand and choices — never copy
  them as defaults.

## Inputs (all via `--config` + a runtime work dir — NO hardcoded paths)

`config.json` carries: `scenes[]` (each `{id, clip, target_sec, vo, caption, atempo?}`
where `target_sec` is the **measured** VO window), `end_card{product_image, image,
dwell_sec, zoom_to, wordmark, product_line, claims[], cta, background?, vo?}`, `brand_palette
{primary, primary_lite, accent, grey}`, `music_bed`, `music_volume` (default 0.62),
`atempo` (compose-stage VO speed-up, default off; the reference runs used 1.3 when the VO
read slow), `captions_ass`, and `caption_style`. See `config.example.json`.

- **`end_card.vo`** (optional) is the path to the end card's spoken line. It is laid at
  the start of the end-card window. The dwell becomes the larger of `dwell_sec` and the
  line's duration + 0.5s. Leave it out for a silent end card (music only).
  `end_card.atempo` overrides the global `atempo` for this line.
- **Paths** may be absolute, including Windows paths (`C:/...`), `captions_ass` too.
- **The config is read as UTF-8** (with or without a BOM). Save it as UTF-8 if any text
  has non-ASCII characters.
- **Fonts.** The end card uses DejaVu (Linux), Arial (macOS), or Arial / Segoe UI
  (Windows). If none is found it falls back to Pillow's built-in font at the right size.

## Craft rules (load-bearing — faithful to the source molecule)

- **The end card is the REAL product photo, composited — never an AI cartoon bottle.**
  Both reference runs shipped an AI bottle first and had to re-shoot with the real photo.
- **No AI-rendered brand text anywhere.** Wordmark, claims, CTA, motif — all PIL
  `ImageDraw.text`. AI draws the world + characters only.
- **Re-encode every segment to 30fps before concat**, even if already correct, or the
  concat demuxer silently drops frames.
- **`target_sec` is the MEASURED VO duration** (ffprobe each VO mp3), never a planned word
  count — VO drives the per-scene timing.
- **Mix constants are validated** - VO -14 LUFS, music -26 LUFS then `volume` 0.62 to 0.70
  (the two reference runs), `amix normalize=0`. Master target -14.5..-13.5 LUFS,
  true peak <= -1.5 dBFS. The master pass enforces this and prints what it measured.
- **Caption `start = scene_start + 0.08s`**, suppressed on the end card (its typeset copy
  carries the message — two text layers at one spot are both unreadable).

## Known gaps

- **Captions are one cue per scene.** The whole sentence is on screen from the start of
  the scene, before most of it has been spoken. Captions are not timed to the words.
  This is not fixed yet.

## Requires

`watch` (QC the final master - confirm every character's look holds, the single
narrator voice carries the whole spot, no AI brand text leaked into a cartoon
background, the end card is the real product, and duration is within 0.1s of the summed
windows plus the end-card dwell). The recipe gates the paid `create-image-fal` (keyframes), `create-video-fal`
(Seedance i2v), `create-vo-elevenlabs`, and `create-music-elevenlabs` calls to their own
capabilities — this capability itself makes NO paid calls.
