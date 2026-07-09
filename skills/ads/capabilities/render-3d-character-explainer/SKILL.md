---
name: render-3d-character-explainer
description: Assemble a glossy 3D-character animated-explainer video ad (~77s, 9:16) built on an "N types of X" listicle spine — a recurring human protagonist plus a locked cast of N persona characters, one per list item. Given the per-scene i2v clips + a per-scene target-duration table + a narration track, it trims each clip to its scene window, re-encodes every segment to identical 1080x1920/30fps/libx264/yuv420p (decrease+pad, never crop) so the concat demuxer never drops frames, concats, and muxes audio — in RESTYLE mode the source ad's VO+music mix is reused verbatim, in ORIGINAL mode fresh per-scene VO (loudnorm I=-14) is mixed under an optional music bed (loudnorm I=-26). A static-still fallback loops a scene's keyframe when its clip is missing/failed, so the master always assembles; libass captions are burned last. FREE deterministic assembly (Python + ffmpeg, no bash, no paid calls); the recipe supplies the clips, keyframes, VO or source audio, and caption table and gates the paid cast-anchor/keyframe/Kling-i2v/VO/music calls to their own capabilities. Use for the 3d-character-explainer listicle format.
status: active
---

# render-3d-character-explainer

The free, deterministic renderer for the **3d-character-explainer** video ad format — the
glossy Pixar-style 3D spot built on an **"N types of X" listicle** spine, where a recurring
human protagonist plus a locked cast of **N persona characters (one per list item)** carry a
hook → "deeper story" → cast-reveal → one beat per list item → kicker → product test →
relieved payoff. This capability is the **FREE assembly stage only**. All generative work
(Nano-Banana cast anchors + per-scene keyframes, Kling-V3 i2v clips, ElevenLabs VO + music,
or a source ad's audio reused verbatim) happens upstream in the recipe and is handed to this
capability as files.

It ports the validated compose recipe from the Bristle "Six Types" restyle run
(`_render_full.sh` — per-scene trim → normalize 1080×1920/fps30 → concat -c copy → mux the
source audio, with a static-still fallback on any failed clip). The assembly is
deterministic — iterate the cut for free, re-roll only the offending paid beat.

## Two modes

- **Restyle mode** (`audio_mode: "restyle"`, the reference run) — re-tell a finished source
  ad, beat for beat, as 3D character comedy. The source ad's **audio mix (VO + music bed) is
  reused VERBATIM** (`source_audio`), and the per-scene `target_sec` table is inherited from
  the source's scene timing. No new VO or music is rendered. The trims must sum to the source
  audio length.
- **Original mode** (`audio_mode: "original"`) — the ad authors its own narration. Each scene
  carries a measured VO cue (`scenes[].vo`, `target_sec` = the ffprobe'd VO duration) which is
  concatenated into a VO track (loudnorm I=-14) and optionally mixed under a `music_bed`
  (loudnorm I=-26 then `volume`, `amix normalize=0`).

## What it does (the deterministic recipe)

1. **Per-scene retime.** Each i2v clip is trimmed to its scene `target_sec` and normalized to
   identical dims/fps/SAR
   (`scale=W:H:force_original_aspect_ratio=decrease,pad=W:H:(ow-iw)/2:(oh-ih)/2:color=<pad>,fps=30,setsar=1`).
   A clip **shorter** than its window is extended with `tpad=stop_mode=clone`; a longer one is
   `-t` trimmed. Decrease+pad (never crop) preserves the full 9:16 keyframe framing.
2. **Static-still fallback.** For any scene whose `clip` is missing or failed to render, the
   scene's `keyframe` PNG is looped (`-loop 1`) for `target_sec`, so the master always
   assembles. Fallback scenes are printed at the end.
3. **Identical re-encode + concat.** Every segment is re-encoded `libx264 -crf 18 -pix_fmt
   yuv420p -r 30` even if already correct — a dims/framerate mismatch makes the concat demuxer
   silently drop frames — then concatenated via the concat demuxer (`-c copy`).
4. **Audio.** Restyle: `source_audio` muxed verbatim (`-map 0:v -map 1:a`), clamped to the
   video length. Original: per-scene VO track (optional `atempo`, `apad`, `-t` clamp) → loudnorm
   → optionally mixed under the music bed.
5. **Captions last.** `make_captions.py` emits a libass `.ass` (one cue per scene, `start =
   scene_start + 0.08s`, suppressed on any scene with no caption — e.g. a product/end-card beat
   carrying its own typeset copy). `compose.py` burns it as the final filter so captions sit on
   top. Word-level energy-pop captions (Whisper on the narration) are the recipe's upstream
   option — produce that `.ass` externally and point `captions_ass` at it; compose burns
   whatever `.ass` it's handed.

## Scripts (free — Python + ffmpeg, no bash, no paid calls)

- `scripts/make_captions.py` — emits the per-scene libass `.ass` from the SAME scene table
  compose reads, so caption windows stay in lockstep with the cut. Run before `compose.py`
  (or leave `captions_ass` unset / pointing at nothing to skip captions).
- `scripts/compose.py` — the assembler: per-scene trim + identical 1080×1920/30fps re-encode
  (static-still fallback on missing clips) → concat → audio (restyle verbatim / original
  mix) → burn captions → master mp4.
- `scripts/config.example.json` — the shape of the `config` the recipe binds (the
  brand-neutralised "Six Types" restyle values as a worked reference).

## Inputs (all via `--config` + a runtime work dir — NO hardcoded paths)

`config.json` carries: `audio_mode` (`restyle` | `original`), `scenes[]` (each `{id, clip,
keyframe, target_sec, caption?, vo?, atempo?}` where `target_sec` is the source-inherited
window in restyle mode or the **measured** VO window in original mode, and `keyframe` is the
static-still fallback source), `source_audio` (restyle), `music_bed` + `music_volume` +
`atempo` (original), `width`/`height` (default 1080×1920), `pad_color` (letterbox colour),
`captions_ass`, and `caption_style`. See `config.example.json`.

## Craft rules (load-bearing — faithful to the source molecule + reference run)

- **Restyle inherits the source timing.** A restyle reuses the source ad's exact audio, scene
  order, and per-beat durations verbatim; only an original-mode remix authors its own VO +
  timing table. Merge any sub-1.5s flash scene into a neighbour upstream to avoid a dead
  micro-cut (the reference folded scene 7 into scene 8).
- **Normalize decrease+pad, never crop** — the listicle's cast-reveal + per-persona framing
  must not lose edges; letterbox-pad to the canvas colour instead. Re-encode every segment to
  30fps before concat, even if already correct, or the concat demuxer silently drops frames.
- **Static-still fallback is mandatory** — Kling can 403 mid-run (a billing wall after a burst
  of successes, not a rate limit). Any failed clip loops its keyframe so the master still
  assembles; re-roll only the missing beat and recompose (free).
- **`generate_audio` was false upstream** — Kling would otherwise invent its own dialog track;
  the real narration is muxed here separately. (This is the recipe's upstream call, not this
  capability.)
- **No AI-rendered brand text** — the product-beat keyframe shows a BLANK-label box; the real
  wordmark/end-card copy is composited upstream, never AI-drawn. Suppress captions on any
  product/end-card beat (its typeset copy carries the message — two text layers at one spot are
  both unreadable).
- **Caption `start = scene_start + 0.08s`** (avoids the caption flashing a frame before a cut).

## Requires

`watch` (QC the final master — the human protagonist reads as the SAME person every scene
(wardrobe/hair/lighting held), each persona is on-model, the cast-reveal lineup matches the N
list items, the product beat shows the REAL box, narration lands beat-for-beat, and duration is
within ±0.1s of the summed windows). The recipe gates the paid `create-image-fal` (cast
anchors + keyframes), `create-video-fal` (Kling-V3 i2v), `create-vo-elevenlabs`, and
`create-music-elevenlabs` calls to their own capabilities — this capability itself makes NO
paid calls.
