# Pipeline — cartoon music-video

How `config.example.json` maps to the real production steps. This molecule ships a
**config + this map**, not a bundled runner: the worked example (Coinbase "Bet on anything")
was produced by the video-orchestrator's per-state steps plus two per-project drivers that
live in `clients/coinbase/video-01-music-video-debut/scripts/` (`stitch.py`, `rebuild_captions.py`).
Reference those directly, or drive the whole run via `video-orchestrator-with-control-plane`.

The six steps run **in order** because each depends on the last: the song sets the timeline
(via its BAR GRID), the timeline drives the shot count, the locked character + look pack drive
the keyframes, the keyframes seed the clips, the song's word timings drive the captions, and
assembly stitches all of it with the logo bug + end card.

## Field → source-script map

| Config field | Phase | Source step / script (in the run) | Paid? |
|---|---|---|---|
| `song.source`, `song.prompt`, `song.structure`, `song.model` | 1 Song | ElevenLabs `music_v1` (or ingest the user mp3) | **PAID** (or user-supplied) |
| `song.outputs.word_timings` | 1 Song | native `music_v1` timestamps, OR Groq `whisper-large-v3` word-level on the supplied mp3 | ~$0.10 (Whisper) |
| `song.outputs.beats` / `.bars`, `song.bar_duration_s`, `song.time_signature` | 1 Song | `librosa.beat.beat_track` (assume 4/4) → `beats.json` + `bars.json` | free |
| `song.recommended_trim_end_s` | 1 Song | `audio/song-ingestion-notes.md` trim analysis | free |
| `character.descriptor`, `character.anchor`, `character.angles`, `character.method` | 2 Character | video-orchestrator `lock-character` → `nano_banana_2` anchor + 4 angles → `generated/character-lock/LOCKED.json` | **PAID** |
| `look_pack.style_descriptor`, `look_pack.negative_tail`, `look_pack.palette_anchors` | 3 Keyframes | threaded verbatim into every keyframe prompt | (defines cost) |
| `tableaux[].keyframe_prompt`, `tableaux[].uses_character`, `keyframe_engine` | 3 Keyframes | `nano_banana_2`, 9:16, one per bar (anchor ref on character shots) → `generated/keyframes/scene-NN.png` | **PAID** |
| `tableaux[].motion_hint`, `clip_engine` | 4 Clips | Seedance 2.0 i2v (Veo 3.1 Lite fallback) → `generated/animated/scene-NN.mp4` | **PAID** |
| `captions`, `tableaux[].caption`, `captions.accent_words` | 5 Captions | `scripts/rebuild_captions.py` (Whisper tokens re-spelled against the locked lyrics) → `captions/master-final.ass` | free |
| `logo_bug` | 5 Assembly | `scripts/stitch.py` `build_logo_bug()` (cairosvg → white PNG) | free |
| `end_card` | 5 Assembly | `scripts/stitch.py` `build_endcard()` (cairosvg white wordmark + PIL subhead on a solid card) | free |
| `tableaux[].t_start/t_end`, `audio_mix` | 5 Assembly | `scripts/stitch.py` (cut each clip to its bar window, hard-cut concat, mux song under the end card, afade) | free |

## 1. Song → ElevenLabs `music_v1` OR user-supplied  (config: `song`)  [PAID or ingest]

**Lock the song FIRST — it sets the timeline.** Either feed `song.structure` + `song.prompt`
to ElevenLabs `music_v1` (`source: generate`), or ingest a user-supplied mp3 (`source:
user_supplied`, the Coinbase path — the mp3 landed before the API call could fire). Get
word-level timestamps: native from `music_v1`, or Groq `whisper-large-v3` word-level for a
supplied track → `audio/word-timestamps.json`. Then `librosa.beat.beat_track` → `audio/beats.json`
+ `audio/bars.json` (4/4). **The BAR GRID sets the timeline** — one bar = one shot (default);
snap every `tableaux[].t_start/t_end` to the bar boundaries. The delivered track often shifts
tempo (brief said 124 BPM; the track landed at 73.83 BPM half-time). **Strip `[…]` section
markers from the lyric text before any music-gen call** — the model sings them literally
("CTA, two bars"). Trim the degraded outro (`recommended_trim_end_s` = 51.9).

## 2. Character → `nano_banana_2` anchor + angles  (config: `character`)  [PAID]

`lock-character` fires one `nano_banana_2` anchor with the verbatim `character.descriptor` at
9:16, then 4 parallel angle calls off the approved anchor (3q-left, 3q-right, action medium,
climax hero — the climax angle doubles as the S15 keyframe). Drift-check hair / wardrobe /
brand-color / applique / skin tone → `LOCKED.json`. Drift < 5% → `method: anchor-ref`; drift
> 15% → escalate to Higgsfield Soul ID (~$15). The locked anchor job is threaded as the media
ref into every character-bearing keyframe.

## 3. Keyframes → `nano_banana_2`  (config: `tableaux[].keyframe_prompt`, `look_pack`, `keyframe_engine`)  [PAID]

Per tableau, build the prompt as `look_pack.style_descriptor` + (if `uses_character`)
`character.descriptor` + `tableaux[i].keyframe_prompt` + `look_pack.negative_tail`, and call
`nano_banana_2` at 9:16. Character shots pass the locked anchor as `media[role=image]` (pass
BOTH the anchor AND the prior keyframe for room continuity — e.g. S04 off S02). Style-only
shots (`uses_character: false` — S03, S05, S06) pass no character ref. Parallel batches of 3
(Higgsfield burst-credit reserve). One PNG per bar → `generated/keyframes/scene-NN.png`. The
"NO RULERS, NO PENCILS, NO HANDS, NO HUMAN-SCALE REFERENCE OBJECTS" negative is load-bearing —
without it the model reads "miniature" by adding a scale-reference prop. Review all N before step 4.

## 4. Clips → Seedance 2.0 i2v  (config: `tableaux[].motion_hint`, `clip_engine`)  [PAID]

Per keyframe, build the prompt as `clip_engine.motion_opener` + `tableaux[i].motion_hint` and
call `seedance_2_0` image-to-video, `--duration 4`, 9:16, off the clean keyframe → `generated/animated/scene-NN.mp4`.
**Lead with the CHARACTER VERB, not the camera move** — camera-led openers ("slow push-in…")
read static; this was the single biggest v1→v4 quality jump. Auto-fall back to `veo3_1_lite`
when Seedance returns `ip_detected` (Oscar-trophy shapes) or `nsfw` ("intimate"/"leans toward"
false positives — S03, S05). Pre-flight the prompt strategy on scenes 1/mid/climax before
firing all N. Batches of 3.

## 5. Captions → `scripts/rebuild_captions.py`  (config: `captions`)

Reads the song's `word-timestamps.json` and **re-spells the timed tokens against the locked
lyrics** (`align_to_lyrics`) — Whisper mishears shouted accents ("BETS" → "Hearts", "WIN" →
"Went"); never edit the lyrics to match Whisper. Feed a `lyrics-plain.md` (lyric text only, no
bar-grid table) so the parser doesn't ingest 700+ markdown-table "words". It chunks ~4–5 words per
cue, times each event, and renders VEED-whisper style — clean white **bold sans** in the **BOTTOM
third** (Alignment 2, `margin_v` above the bottom-left logo bug, NO pill, 6px outline, ≥0.9s on
screen) — and STOPS captions at `caption_end_s` (= body end = 51.9) so the end card breathes →
`captions/master-final.ass`. Never mid-frame (Alignment 5) — it covers the character (fixed 2026-07).
NOTE: if the host ffmpeg lacks libass (no `subtitles`/`ass` filter), render the cues as timed PIL
PNG overlays composited with ffmpeg `overlay=…:enable='between(t,st,en)'` instead — same bottom
placement, no libass dependency.
The repeated "you called it" ×3 hook had a Whisper gap — hand-patch the chorus repetitions.

## 6. Logo bug + end card + assembly → `scripts/stitch.py`  (config: `logo_bug`, `end_card`, `audio_mix`)

- `build_logo_bug()`: cairosvg renders the brand wordmark SVG → recolor to white via PIL →
  the persistent bottom-left bug (`width_px` 220, `margin_px` 56), burned over the 16 body bars,
  **suppressed on the end card**. **Never AI-render brand text.**
- `build_endcard()`: cairosvg white wordmark (`wordmark_scale` 0.62) + PIL subhead on a solid
  `end_card.background` (#0052FF) card → a silent 3.0s end-card mp4. macOS New York Semibold
  lacks the em-dash glyph (U+2014) — the subhead uses a middle dot ` · `.
- Assembly (`stitch.py`): cut each body clip to its bar window from `bars.json`, **hard-cut**
  concat on the bar (the shipped v4 used hard cuts — the tested v5 0.3s xfade read less punchy),
  burn the logo bug + the caption ASS, append the end card holding 3.0s, mux the song OVER the
  whole video including the end card with a 0.5s `afade` at the tail (`audio_over_end_card` — no
  silent tail), loudnorm to −14 LUFS → `edits/master-final.mp4` (1080×1920, 30fps, h264+aac, ~54.9s).

Re-cuts (new caption chunking, swapped end card, re-timed windows, logo-bug toggle) reuse the
existing keyframes/clips/song and cost **$0** — only steps 1–4 spend.
