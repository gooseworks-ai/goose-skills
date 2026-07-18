# Pipeline — VO-anchored motion-graphic listicle

How `config.example.json` maps to the real production steps. This molecule ships a
**config + this map**, not a bundled runner: the worked example (Everself "doctor-educator"
listicle) was produced by per-project drivers that live in
`clients/everself-hb/working/doctor-christopher-avatar/` (`voice/render_listicle_v2.py`,
`working/render_hf.py`, `working/build_pexels_beats.py`, `working/grade_brolls_v4.py`,
`working/build_master_v4.py`). Reference those directly, or drive the whole run via
`video-orchestrator-with-control-plane`.

The steps run **in order** because each depends on the last: the VO sets the timeline (its
word-level timestamps), the word times anchor every beat reveal, the beats + B-roll seed the
render, the render + concat build the silent master, and assembly mixes the VO under the music
bed + burns the window-masked captions.

## Field → source-script map

| Config field | Phase | Source step / script (in the run) | Paid? |
|---|---|---|---|
| `voice.mode`, `voice.voice_id`, `voice.model`, `voice.atempo`, `voice.script_ref` | 1 VO | ElevenLabs clone/cast (`eleven_v3`) + ffmpeg `atempo` -> `voice/vo-render.mp3` | **PAID** |
| `voice.outputs.word_timings` | 2 Transcribe | Groq `whisper-large-v3` word-level on the rendered VO -> `working/whisper/words-flat.json` | ~$0.10 |
| `design.*`, `beats[].hero_numeral/headline/body/callout/accent` | 3 Beats | author N hyperframes (HTML + Web Animations `window.renderAt(t)`) in ONE design system -> `working/hyperframes-v4/beat-NN.html` + `_shared.css` + `_shared.js` | free |
| `beats[].anchor_word`, `beats[].anchor_t` | 3 Beats | reveals anchored to word times in `words-flat.json` | free |
| `render_engine`, `fps` | 5 Render | `working/render_hf.py` (Playwright frame-by-frame `renderAt(t)` -> ffmpeg encode; ALL beats share fps 25) | free |
| `broll[].query`, `broll[].brand_clip`, `broll[].t_start/t_end`, `broll[].graded` | 4 B-roll | `working/build_pexels_beats.py` (download/trim) + `working/grade_brolls_v4.py` (color-grade to palette) | media-proxy (stock) |
| `captions`, `captions.mask`, `captions.chunk_words`, `captions.gap_close_s`, `captions.ass_format_has_name_field` | 5 Captions | Whisper words -> ASS, kept only inside B-roll windows, 2-word chunks, close on >0.4s gaps (`Name`-field header) | free |
| `music`, `music.bed_volume`, `audio_mix` | 5 Assembly | ElevenLabs Music bed (~0.18 vol) mixed under the VO | **PAID** (music bed) |
| assembly | 5 Assembly | `working/build_master_v4.py` (concat beats + B-roll, mix VO+music, composite silent video + audio + burn window-masked captions -> `finals/everself-v4-master.mp4`) | free |
| `headshot` | — | kept for a FUTURE lipsync variant; UNUSED in the shipped master | — |

## 1. VO -> ElevenLabs clone/cast  (config: `voice`)  [PAID]

**Lock the VO FIRST — it sets the timeline.** `voice/render_listicle_v2.py` narrates the listicle
script with ElevenLabs `eleven_v3` — either a **cloned** voice (train from a short reference sample
of the expert, then narrate) or a **cast** `voice_id` — then `atempo` to the target pace (v3's speed
param is weak; use ffmpeg `atempo` for real time-stretch) -> `voice/vo-render.mp3`. The delivered VO
and its word-level timings, NOT the plan, set the timeline.

## 2. Transcribe -> Whisper word timings  (config: `voice.outputs.word_timings`)  [~$0.10]

Groq `whisper-large-v3` word-level on the RENDERED VO -> `working/whisper/words-flat.json` (a flat
list of `{word, start, end}`). Every beat reveal in step 3 anchors to a word time here. Whisper is
the right tool for SPOKEN VO word-level; script-window timing is only for SUNG audio (not this format).

## 3. Beats -> hyperframe authoring  (config: `design`, `beats[]`)

One HTML hyperframe per beat in ONE design system: `working/hyperframes-v4/beat-NN.html`, each
exposing `window.renderAt(t)` driven by the Web Animations API so a renderer can seek any frame.
Shared `working/hyperframes-v4/_shared.css` holds the design tokens (palette, type, alternating
`background_tiles`, decorative SVG `accents`, the glass-pill callout) and `_shared.js` holds
`initRenderer` + `revealWords` + easing. Reveals fire at each beat's `anchor_word`/`anchor_t` from
`words-flat.json`. Alternate the background tile per beat for rhythm; keep numerals / body type /
accents / pills CONSISTENT so N beats read as one designed reel. This is deterministic web motion
graphics — NOT i2v.

## 4. B-roll windows -> download/trim + color-grade  (config: `broll[]`)  [media-proxy stock]

For each `broll[]` window, `working/build_pexels_beats.py` downloads/trims the stock clip (or ingests
a brand/procedure clip) and `working/grade_brolls_v4.py` color-grades it to the palette. Render B-roll
at fps 25 to match the beats. These are the ONLY windows where captions burn — on the motion-graphic
beats the on-screen type IS the caption.

## 5. Render + captions + assembly  (config: `render_engine`, `captions`, `music`, `audio_mix`)

- **Render (`render_hf.py`):** for each beat, Playwright loads the hyperframe, calls
  `window.renderAt(t)` per frame, screenshots it, and ffmpeg encodes -> a silent mp4 per beat. **ALL
  beats MUST share fps 25** — a mismatched-fps beat stutters at the concat seam.
- **Captions:** built from `words-flat.json`, kept **ONLY inside the B-roll windows**, 2-word chunks,
  closing a cue on any >0.4s word gap. The ASS `Format:` header MUST include a `Name` field — without
  it the leading-comma bug eats the first field and captions silently drop.
- **Assembly (`build_master_v4.py`):** concat all beats + B-roll windows (ffmpeg demuxer) ->
  `master-silent.mp4`, mix the VO (full) under a LOW ElevenLabs Music bed (~0.18 vol), composite the
  silent video + the mixed audio + burn the window-masked captions, loudnorm to -14 LUFS ->
  `finals/everself-v4-master.mp4` (1080×1920, 25fps, h264 crf18 + aac 192k, ~66s).

Re-cuts (new caption chunking, re-timed beats, swapped B-roll, a different music bed level) reuse the
existing VO / beats / B-roll and cost **$0** — only the VO clone/narration and the music bed spend.
