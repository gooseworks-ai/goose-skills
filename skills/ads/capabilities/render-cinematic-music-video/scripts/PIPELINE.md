# Pipeline — cinematic music-video

How `config.example.json` maps to the real production steps. This molecule ships a
**config + this map**, not a bundled runner: the worked example (Hype and Vice "Game Day
Girls") was produced by the run's own per-step scripts, which live in
`clients/hype-and-vice/ad-runs/run-01-game-day-girls/working/`. Reference those scripts
directly, or drive the whole run via `video-orchestrator-with-control-plane`.

The five steps run **in order** because each depends on the last: the anthem sets the
timeline, the timeline + look pack drive the keyframes, the keyframes seed the clips, the
song's word timings drive the captions, and assembly stitches all of it.

## Field → source-script map

| Config field | Source script (`…/run-01-game-day-girls/working/`) | Phase | Paid? |
|---|---|---|---|
| `song.prompt`, `song.structure[]`, `song.global_styles` | ElevenLabs `music_v1` call (music-gen atom) → `audio/music.mp3` + `audio/music_metadata.json` | 1 — Anthem | **PAID** |
| `song.outputs.metadata` → `captions.source` | `build_word_timestamps.py` (adapter: `music_metadata.words_timestamps` ms → Whisper-shape `words.json` s) | 1 — Anthem | free |
| `song.hook_line` / `hook_word` / `hook_target_sec` | derived from the returned word timings; drives the `stitch.py` `TIMELINE` snap | 1 — Anthem | free |
| `look_pack.style_opener` (`STYLE_OPENER`), `look_pack.negative_tail` (`NEG`), `continuity_anchor` (`HV_GARMENT`) | `gen_keyframes.py` (prepend/append per prompt) | 2 — Keyframes | **PAID** |
| `tableaux[].keyframe_prompt`, `keyframe_engine.model/resolution/aspect_ratio` | `gen_keyframes.py` `KEYFRAMES[]` → `higgsfield generate create gpt_image_2 --aspect_ratio 2:3 --resolution 2k` → `assets/keyframes/<id>.png` | 2 — Keyframes | **PAID** |
| `keyframe_engine.batch_size` (3) | `gen_keyframes.py` `ThreadPoolExecutor` (burst-credit reserve) | 2 — Keyframes | — |
| `clip_engine.motion_opener` (`MOTION_OPENER`) | `gen_clips.py` (prepend per motion hint) | 3 — Clips | **PAID** |
| `tableaux[].motion_hint`, `clip_engine.model/duration_sec` | `gen_clips.py` `MOTION[]` → `higgsfield generate create kling3_0 --start-image assets/keyframes/<id>.png --duration 5` → `assets/clips/<id>.mp4` | 3 — Clips | **PAID** |
| `tableaux[].t_start/t_end` | `stitch.py` `TIMELINE[]` — beat-locked windows snapped to the real lyric word-timestamps | 4 — Assembly | free |
| `width`/`height`/`fps` | `stitch.py` `normalize_segment` (`scale=1080:1920 increase` + `crop`, `fps=30`, `tpad clone` to the window) | 4 — Assembly | free |
| `song.outputs.audio`, `audio_mix.loudness_lufs`, `fade_in_sec`, `fade_out_sec` | `stitch.py` `mux_audio` (`atrim=0:28`, `afade` in/out, `loudnorm I=-14`) → `clips/master-no-captions.mp4` | 4 — Assembly | free |
| `captions.source/style_preset/placement/chunk_words/accent_words`, `song.lyrics_md` | `stitch.py` `burn_captions` → the `sync-captions-to-music` atom (`--style-preset music-video --placement low --chunk-size 4 --accent-words …`) → `finals/master-final.ass` → `finals/master-final.mp4` | 4 — Assembly | free |
| `end_card.*` | authored as the designed `T14` keyframe base (or a PIL/ffmpeg composite from the real wordmark); overlaid on `overlay_window_sec` | 4 — Assembly | free |
| whole master | `watch` (`/watch` the final master end-to-end) | 5 — QC | free |

## 1. Anthem → ElevenLabs `music_v1`  (config: `song`)  [PAID]

**Generate the anthem FIRST — it sets the timeline.** Feed `song.structure` (the
verse/pre-chorus/chorus/outro sections, each with `duration_ms`, per-section
`positive_local_styles`/`negative_local_styles`, and the exact `lines`) and `song.prompt`
(the 120-BPM indie-cinematic vibe) to ElevenLabs `music_v1`. The call returns:
- `audio/music.mp3` — the sung anthem (the narration; **no separate VO**).
- `audio/music_metadata.json` — the `composition_plan` echo **plus `words_timestamps`**
  (word-level start/end in **ms**).

Then run `build_word_timestamps.py` — it maps `music_metadata.words_timestamps` (ms) to a
Whisper-shape `audio/words.json` (seconds) that the captions atom consumes. Derive the
`stitch.py` `TIMELINE` — `(tableauId, tStart, tEnd)` per beat — by snapping each tableau
boundary to the lyric-phrase edges in the returned word timings. The hook line
(`song.hook_line` = "every day is game day") lands at ~14.4s, the chorus drop; the
`HOOK_HERO` tableau (T08, the split-screen brand-range frame) is timed to it. No artist names
in `song.prompt` (ElevenLabs ToS filter — describe the arrangement only).

## 2. Keyframes → Higgsfield `gpt_image_2`  (config: `tableaux[].keyframe_prompt`, `look_pack`, `keyframe_engine`)  [PAID]

`gen_keyframes.py` holds the scene list and, per tableau, builds the prompt as
`STYLE_OPENER + <tableau prompt> + NEG` — i.e. `look_pack.style_opener +
tableaux[i].keyframe_prompt + look_pack.negative_tail` — then calls `higgsfield generate
create gpt_image_2 --aspect_ratio 2:3 --resolution 2k --wait --json` (2:3 is the closest
supported ratio to 9:16). Parallel batches of ≤8 threads (the config caps `batch_size` at 3
for the Higgsfield burst-credit reserve). One PNG per beat → `assets/keyframes/<id>.png`.
Idempotent — skips beats whose PNG already exists and is >80KB. The single `look_pack` (the
`STYLE_OPENER` 35mm-film clause) is what makes N beats read as shot by one photographer, with
the `HV_GARMENT` continuity anchor present each frame. The 35mm look is HARDER than
paper-craft — budget 1–2 re-rolls per tableau. **Review all N before step 3.**

## 3. Clips → Higgsfield `kling3_0` i2v  (config: `tableaux[].motion_hint`, `clip_engine`)  [PAID]

`gen_clips.py` reads each keyframe + its `motion_hint`, builds the prompt as `MOTION_OPENER +
motion_hint` (`clip_engine.motion_opener + tableaux[i].motion_hint`), and calls `higgsfield
generate create kling3_0 --start-image assets/keyframes/<id>.png --duration 5 --wait --json`.
One ~5s clip per beat → `assets/clips/<id>.mp4`. Idempotent (skips existing >300KB mp4s).
Kling 3.0 (not Seedance) holds the film register and the real faces through the motion; the
`MOTION_OPENER` demands handheld micro-drift + film-grain hold and NEGATES smooth AI-camera
glide / CGI swoop.

## 4. Assembly + captions + end card → `stitch.py`  (config: `tableaux[].t_start/t_end`, `audio_mix`, `captions`, `end_card`)

`stitch.py` is the single assembler; it runs four sub-steps:
1. **`normalize_segment`** — per beat, cut the clip to its `TIMELINE` window (`t_start..t_end`),
   `scale=1080:1920:force_original_aspect_ratio=increase` + `crop=1080:1920`, `fps=30`,
   `setpts=PTS-STARTPTS`, and `tpad=stop_mode=clone` clone-pad to the exact window length
   (crf 18). Note the mirror-family gotcha: pair `tpad` with an explicit `-t` clamp so the
   segment is exactly the window (it is, via `-t {duration}`).
2. **`concat_segments`** — hard-concat the beat segments (`-f concat -c copy`) →
   `clips/master-silent.mp4` (video only, hard cuts on the beat).
3. **`mux_audio`** — `[1:a]atrim=0:28, afade in 0.15s, afade out at 27.4s d 0.6s,
   loudnorm I=-14:LRA=11:tp=-1.0` over the silent master → `clips/master-no-captions.mp4`.
4. **`burn_captions`** — call the `sync-captions-to-music` atom's `sync.py` with
   `--video clips/master-no-captions.mp4 --lyrics source/lyrics-locked.md --timestamps
   audio/words.json --placement low --chunk-size 4 --style-preset music-video --accent-words
   every,day,game,HER,Hype,Vice,girls,started,finish` → cinematic lower-third serif captions
   (rendered ASS uses a serif font, New York) burned → `finals/master-final.mp4`.

Captions come from the song's OWN `audio/words.json` (via `build_word_timestamps.py`), **not
Whisper** — Whisper on sung audio returns "🎵 Music Playing 🎵". The chorus hook line gets the
accent (bold-italic) treatment; the accent words are colored.

The **end card** for H&V was authored as the designed `T14` keyframe base (cream cursive
italic serif wordmark on a warm-dark background with the real garment). **Never AI-render the
lockup as free diffusion text** (LEARNINGS L4 — a prior end card rendered "therapits");
where a real wordmark asset exists, prefer a PIL/ffmpeg composite over the final window
(`end_card.overlay_window_sec` = 26.1–28.0).

Output → `finals/master-final.mp4` (1080×1920, 30fps, h264+aac, 28s). Inside a control-plane
run, `promote_master*.py`-style steps also register the render into `production/*.json` +
`history/versions.json` for the app.

Re-cuts (new caption chunking, swapped end card, re-timed windows) reuse the existing
keyframes/clips/anthem and cost **$0** — only steps 1–3 spend.
