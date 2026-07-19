# Pipeline — food-product sizzle

How `config.example.json` maps to the real production steps. This ships a **config + this map**, not
a bundled runner: the worked example (Lineage Provisions "Beef Sticks Sizzle") was produced by
per-project scripts (`gen_keyframes` / `.hf_S0*.json`, `gen_clips_hf.sh`, `gen_music_v2.py`,
`make_sfx.sh`, `make_end_card.py`, `build_master_v2.sh`). Drive the whole run via a control-plane
video orchestrator, or reference those steps directly.

The five steps run **in order** because each depends on the last: the photographic keyframes seed
the i2v clips, the clips set the body length, the music bed + SFX are cut to the master, the PIL
end card composites from the real logo + product PNG, and assembly stitches all of it with the
grain pass + audio composite + optional callouts.

## Field → source-step map

| Config field | Phase | Source step / script | Paid? |
|---|---|---|---|
| `look_pack.style_descriptor`, `look_pack.negative_tail`, `look_pack.palette_anchors` | 1 Keyframes | threaded verbatim into every keyframe prompt | (defines cost) |
| `scenes[].keyframe_prompt`, `scenes[].uses_product_ref`, `keyframe_engine` | 1 Keyframes | `create-image-fal` macro stills, 9:16 (box hero grounds on the real product PNG) | **PAID** |
| `scenes[].motion_hint`, `clip_engine` | 2 Clips | `create-video-fal` i2v, locked-off anti-shake, 3–4s | **PAID** |
| `music.prompt`, `music.request_length_ms`, `music.model` | 3 Music | ElevenLabs Music ~22s acoustic bluegrass | **PAID** |
| `music.trim_intro_sec`, `music.target_length_sec`, `music.fade_in_sec`/`.fade_out_sec`, `music.loudnorm_i` | 3 Music | trim the 2.5s sparse intro, loudnorm, fades | free |
| `sfx.cues` | 3 SFX | ffmpeg lavfi `anoisesrc` → `snap.wav` / `tear.wav` at cue points | free |
| `end_card` | 4 End card | PIL — bg + real logo PNG + real product PNG + serif headline / CTA | free |
| `stat_callouts` | 4 Assembly | ffmpeg `drawtext` serif pill callouts at beats | free |
| `grain_pass`, `scenes[].t_start/t_end`, `audio_mix` | 4 Assembly | ffmpeg `filter_complex` concat + grain + audio composite + end card | free |

## 1. Keyframes → `create-image-fal`  (config: `scenes[].keyframe_prompt`, `look_pack`, `keyframe_engine`)  [PAID]

Per scene, build the prompt as `look_pack.style_descriptor` + `scenes[i].keyframe_prompt` +
`look_pack.negative_tail`, at 9:16. The box / pack hero (`uses_product_ref: true`) passes the REAL
product PNG as `media[role=image]` with "reproduce the box label EXACTLY, invent no text". Texture-only
shots (tear, flat-lay, bite) pass no product ref. The "NO studio polish, NO bokeh, NO invented label
text" negative is load-bearing. Review all before step 2.

## 2. Clips → `create-video-fal` i2v  (config: `scenes[].motion_hint`, `clip_engine`)  [PAID]

Per keyframe, build the prompt as `scenes[i].motion_hint` + `clip_engine.anti_shake_tail` and call
image-to-video off the clean keyframe, 9:16, at the scene's duration (3–4s). **Locked-off,
anti-shake** — every prompt ends with "Camera is locked off, tripod-stable. NO shake, NO wobble.
Slow, deliberate motion only." Submit **sequentially** (burst-credit reserve). The motion IS the
tactile beat: the tear parts the fibers, a gentle push-in on the flat lay, a clean jaw-line bite,
a hand lifting one stick straight out of the box.

## 3. Music + SFX → ElevenLabs Music + ffmpeg lavfi  (config: `music`, `sfx`)  [PAID music]

ElevenLabs Music requests ~22s of upbeat acoustic bluegrass (banjo + guitar + light brush
percussion, NO vocals, no artist names). Then **trim the ~2.5s sparse intro** (`atrim=start=2.5`),
`loudnorm`, and fade in / out to the master length. `make_sfx.sh` synthesizes two diegetic hits with
ffmpeg lavfi `anoisesrc` — a crisp ~120ms `snap.wav` (white noise, fast envelope) at the fiber-tear
cue (~1.5s) and a ~180ms `tear.wav` (pink noise) at the box-open cue (~11s). Time each to its beat.

## 4. End card + assembly → `make_end_card.py` + `build_master_v2.sh`  (config: `end_card`, `stat_callouts`, `grain_pass`, `audio_mix`)

- `make_end_card.py`: composes the STATIC end card entirely in PIL (NO AI) — the ivory (or
  brand-color) bg + the real logo PNG (upper third, ~62% width) + the real product PNG (centered,
  soft shadow) + a serif heritage headline + a smaller CTA line. **Never AI-render the lockup.**
  On macOS pick a serif with the middle-dot glyph (use ` · `).
- Assembly (`build_master_v2.sh`): normalize fps / SAR, concat the ~4 body clips, apply the anti-AI
  grain pass GLOBALLY (`eq=contrast=1.06:saturation=0.93,hqdn3d=1.5:1.5:3:3,noise=alls=8:allf=t+u`),
  composite the audio (music bed + `snap.wav` + `tear.wav` at their cue points, loudnorm), append
  the static end card holding ~3s WITH the music under it (fade the tail — no silent tail), and burn
  the OPTIONAL serif stat-callout pills at their beats → `edits/master-final.mp4` (1080×1920, 24fps,
  h264 + aac, ~14s). **Write `%` strings to a textfile and use `textfile=` + `expansion=none`** —
  ffmpeg `drawtext` reads a raw `%` as a strftime spec.

Re-cuts (new callout timing, swapped end card, re-timed SFX cues, grain-pass toggle) reuse the
existing keyframes / clips / music and cost **$0** — only steps 1–3 spend.
