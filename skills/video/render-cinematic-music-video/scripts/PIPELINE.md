# Pipeline — cinematic music-video

How `config.example.json` maps to the real production steps. This molecule ships a
**config + this map**, not a bundled runner: the worked example (Sundrift "Roll
On") was produced by the run's own per-step scripts, which live in
that run's own `working/` folder. Reference those scripts
directly, or drive the whole run via `video-orchestrator-with-control-plane`.

The five steps run **in order** because each depends on the last: the anthem sets the
timeline, the timeline + look pack drive the keyframes, the keyframes seed the clips, the
song's word timings drive the captions, and assembly stitches all of it.

## Choices

The creative values in `config.example.json` are the demo's. On a real run they come from the
recipe's `choices`, asked of the user before any paid step:

- **song_style** — genre, mood, BPM and per-section arrangement → `song.prompt`, `song.bpm`,
  `song.global_styles`. The demo used a sunny 120-BPM indie surf-pop anthem.
- **vocalist** — who sings → the vocal clause of `song.prompt` / `song.global_styles`. The demo
  used a bright, warm female lead.
- **cast** — who is on screen → the people in `tableaux[].keyframe_prompt` / `motion_hint`. The
  demo used four young women roller skaters.
- **setting** — place + time of day → the place/light clause of `look_pack.style_opener`,
  `look_pack.palette_anchors`, and every `keyframe_prompt`. The demo used a seaside boardwalk
  town in late summer, golden hour.
- **story_arc** — the shape of the tableaux + lyrics → `tableaux[]` and `song.structure[].lines`.
  The demo used one summer day, morning → skate-bowl peak → twilight, with an origin-story wink.

The 35mm-film look (named stock, grain, light leaks, handheld), the anthem-first timeline, the
hook on the chorus drop and the real-asset end card are the format and stay fixed.

## Field → source-script map

| Config field | Source script (`…/<demo-run>/working/`) | Phase | Paid? |
|---|---|---|---|
| `song.prompt`, `song.structure[]`, `song.global_styles` | ElevenLabs `music_v1` call (music-gen atom) → `audio/music.mp3` + `audio/music_metadata.json` | 1 — Anthem | **PAID** |
| `song.outputs.metadata` → `captions.source` | `build_word_timestamps.py` (adapter: `music_metadata.words_timestamps` ms → Whisper-shape `words.json` s) | 1 — Anthem | free |
| `song.hook_line` / `hook_word` / `hook_target_sec` | derived from the returned word timings; drives the beat-window snap | 1 — Anthem | free |
| `look_pack.style_opener` (`STYLE_OPENER`), `look_pack.negative_tail` (`NEG`), `continuity_anchor` (`PRODUCT_ANCHOR`) | `gen_keyframes.py` (prepend/append per prompt) | 2 — Keyframes | **PAID** |
| `tableaux[].keyframe_prompt`, `keyframe_engine.model/resolution/aspect_ratio` | `gen_keyframes.py` `KEYFRAMES[]` → `higgsfield generate create gpt_image_2 --aspect_ratio 2:3 --resolution 2k` → `assets/keyframes/<id>.png` | 2 — Keyframes | **PAID** |
| `keyframe_engine.batch_size` (3) | `gen_keyframes.py` `ThreadPoolExecutor` (burst-credit reserve) | 2 — Keyframes | — |
| `clip_engine.motion_opener` (`MOTION_OPENER`) | `gen_clips.py` (prepend per motion hint) | 3 — Clips | **PAID** |
| `tableaux[].motion_hint`, `clip_engine.model/duration_sec` | `gen_clips.py` `MOTION[]` → `higgsfield generate create kling3_0 --start-image assets/keyframes/<id>.png --duration 5` → `assets/clips/<id>.mp4` | 3 — Clips | **PAID** |
| `tableaux[].t_start/t_end` | the beat-locked windows, snapped to the real lyric word-timestamps → the montage spec's cuts | 4 — Assembly | free |
| `width`/`height`/`fps` | `stitch-videos-ffmpeg` `montage.py assemble` (scales and crops each cut to 1080×1920, 30 fps, exact frame counts) | 4 — Assembly | free |
| `song.outputs.audio`, `audio_mix.loudness_lufs`, `fade_in_sec`, `fade_out_sec` | one ffmpeg mux (`atrim=0:28`, `afade` in/out, `loudnorm I=-14`) → `clips/master-no-captions.mp4` | 4 — Assembly | free |
| `captions.source/style_preset/placement/chunk_words/accent_words`, `song.lyrics_md` | `stitch-videos-ffmpeg` `montage.py captions` (`--words audio/words.json`, 4 words a cue, low on the frame, a serif font); the accent words as a second captions pass in their own colour → `finals/master-final.mp4` | 4 — Assembly | free |
| `end_card.*` | authored as the designed `T14` keyframe base (or a PIL/ffmpeg composite from the real wordmark); overlaid on `overlay_window_sec` | 4 — Assembly | free |
| whole master | `watch` (`/watch` the final master end-to-end) | 5 — QC | free |

## 1. Anthem → ElevenLabs `music_v1`  (config: `song`)  [PAID]

**Generate the anthem FIRST — it sets the timeline.** Feed `song.structure` (the
verse/pre-chorus/chorus/outro sections, each with `duration_ms`, per-section
`positive_local_styles`/`negative_local_styles`, and the exact `lines`) and `song.prompt`
(the vibe from `choices.song_style` + `choices.vocalist`; the demo: a 120-BPM indie surf-pop anthem) to ElevenLabs `music_v1`. The call returns:
- `audio/music.mp3` — the sung anthem (the narration; **no separate VO**).
- `audio/music_metadata.json` — the `composition_plan` echo **plus `words_timestamps`**
  (word-level start/end in **ms**).

Then run `build_word_timestamps.py` — it maps `music_metadata.words_timestamps` (ms) to a
Whisper-shape `audio/words.json` (seconds) that the captions step consumes. Derive the beat
windows — `(tableauId, tStart, tEnd)` per beat — by snapping each tableau
boundary to the lyric-phrase edges in the returned word timings. The hook line
(`song.hook_line`; demo: "roll on into the sun" at ~14.4s) lands on the chorus drop; the
`is_hook` tableau (demo: `HOOK_HERO` T08, a split-screen colorway-range frame) is timed to it. No artist names
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
the continuity anchor (the brand's real product; `PRODUCT_ANCHOR`, the skates, in the demo) present each frame. The 35mm look is HARDER than
paper-craft — budget 1–2 re-rolls per tableau. **Review all N before step 3.**

## 3. Clips → Higgsfield `kling3_0` i2v  (config: `tableaux[].motion_hint`, `clip_engine`)  [PAID]

`gen_clips.py` reads each keyframe + its `motion_hint`, builds the prompt as `MOTION_OPENER +
motion_hint` (`clip_engine.motion_opener + tableaux[i].motion_hint`), and calls `higgsfield
generate create kling3_0 --start-image assets/keyframes/<id>.png --duration 5 --wait --json`.
One ~5s clip per beat → `assets/clips/<id>.mp4`. Idempotent (skips existing >300KB mp4s).
Kling 3.0 (not Seedance) holds the film register and the real faces through the motion; the
`MOTION_OPENER` demands handheld micro-drift + film-grain hold and NEGATES smooth AI-camera
glide / CGI swoop.

## 4. Assembly + captions + end card  (config: `tableaux[].t_start/t_end`, `audio_mix`, `captions`, `end_card`)

This skill ships no assembler script. The demo run used its own `stitch.py`, which is not
shipped. Do the four steps with the `stitch-videos-ffmpeg` skill's free `montage.py`
(`../../stitch-videos-ffmpeg/SKILL.md`) and plain ffmpeg:
1. **Cut each beat to its window** — one montage cut per tableau, `t_start..t_end`, scaled
   and cropped to 1080×1920 at 30 fps. `montage.py assemble` gives each cut an exact frame
   count, so a short clip must cover its window (re-roll it, or hold its last frame with
   ffmpeg `tpad=stop_mode=clone` plus an explicit `-t` clamp before it goes in the spec).
2. **Hard-concat on the beat** — the same `assemble` step joins the cuts in order with hard
   cuts → `clips/master-silent.mp4` (video only).
3. **Mux the anthem** — one ffmpeg pass: `[1:a]atrim=0:28, afade in 0.15s, afade out at 27.4s
   d 0.6s, loudnorm I=-14:LRA=11:tp=-1.0` over the silent master →
   `clips/master-no-captions.mp4`. (`montage.py mix` is for a VO over a ducked bed; the anthem
   here is the only track.)
4. **Burn the captions** — `montage.py captions --video clips/master-no-captions.mp4 --words
   audio/words.json`, 4 words a cue (`per`), low on the frame (`y` about 0.85) in a serif font.
   `montage.py` draws each cue in one colour, so burn the accent words
   (`captions.accent_words`; demo: `sun,on,roll,done,Sundrift,wheels,run,crew,found,home`) and
   the hook line as a second `captions` pass from a cue file of just those words, in the accent
   colour → `finals/master-final.mp4`.

Captions come from the song's OWN `audio/words.json` (via `build_word_timestamps.py`), **not
Whisper** — Whisper on sung audio returns "🎵 Music Playing 🎵". The chorus hook line gets the
accent colour, as do the accent words.

The **end card** in the demo was authored as the designed `T14` keyframe base (ivory
hand-lettered script wordmark on a warm-dark background with the real skates). **Never AI-render the
lockup as free diffusion text** (LEARNINGS L4 — diffusion garbles a wordmark);
where a real wordmark asset exists, prefer a PIL/ffmpeg composite over the final window
(`end_card.overlay_window_sec` = 26.1–28.0).

Output → `finals/master-final.mp4` (1080×1920, 30fps, h264+aac, 28s). Inside a control-plane
run, `promote_master*.py`-style steps also register the render into `production/*.json` +
`history/versions.json` for the app.

Re-cuts (new caption chunking, swapped end card, re-timed windows) reuse the existing
keyframes/clips/anthem and spend nothing — only steps 1–3 spend.
