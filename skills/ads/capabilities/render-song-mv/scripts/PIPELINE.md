# Pipeline — song-driven music-video

How `config.example.json` maps to the real production steps. This molecule ships a
**config + this map**, not a bundled runner: the worked example (Loóna "Fall In Love With
Sleep Again") was produced by the control-plane orchestrator, whose per-step scripts live
in `clients/loona/ad-runs/run-01-run1/working/`. Reference those scripts directly, or drive
the whole run via `video-orchestrator-with-control-plane`.

The five steps run **in order** because each depends on the last: the song sets the
timeline, the timeline + look pack drive the keyframes, the keyframes seed the clips, the
song's word timings drive the captions, and assembly stitches all of it.

## 1. Song → ElevenLabs `music_v1`  (config: `song`)  [PAID]

**Generate the song FIRST — it sets the timeline.** Feed `song.structure` (the
intro/verse/pre-chorus/chorus/outro sections, each with `duration_ms` + exact `lines`) and
`song.prompt` (the vibe) to ElevenLabs `music_v1`. The call returns:
- `audio/music.mp3` — the sung track (the narration; **no separate VO**).
- `audio/music_metadata.json` — the `composition_plan` echo **plus `words_timestamps`**
  (word-level start/end in ms).
- `audio/words.json` — the word timings normalized to seconds (used by captions).

Then derive `working/timeline.json` — `[tableauId, tStart, tEnd]` per beat — by snapping
each tableau boundary to the lyric-phrase edges in the returned word timings. The hook
word (`song.hook_word` = "fall") lands at ~15.24s, the chorus drop; the HOOK_HERO tableau
(T08) is timed to it. No artist names in `song.prompt` (ElevenLabs ToS filter).

## 2. Keyframes → Higgsfield `gpt_image_2`  (config: `tableaux[].keyframe_prompt`, `look_pack`, `keyframe_engine`)  [PAID]

`working/render_keyframes.py` reads the scene list and, per tableau, builds the prompt as
`look_pack.style_opener + tableaux[i].keyframe_prompt + look_pack.negative_tail`, then calls
`higgsfield generate create gpt_image_2 --aspect_ratio 9:16 --resolution 2k --wait --json`.
Parallel batches of 3 (Higgsfield burst-credit reserve). One PNG per beat → `keyframes/<id>/v1.png`
(2k 9:16 ≈ 1520×2688). Idempotent — skips beats that already have a keyframe. The single
`look_pack` is what makes N beats read as one film; review all N before step 3.

## 3. Clips → Higgsfield `kling3_0` i2v  (config: `tableaux[].motion_hint`, `clip_engine`)  [PAID]

`working/render_clips.py` reads each keyframe + its `motion_hint`, builds the prompt as
`clip_engine.motion_opener + motion_hint`, and calls
`higgsfield generate create kling3_0 --start-image keyframes/<id>/v1.png --duration 5 --wait --json`.
One ~5s clip per beat → `clips/<id>/v1.mp4`. Batches of 3; stops cleanly on
`not_enough_credits`. Kling 3.0 (not Seedance) holds the paper-craft register and the
character-face discipline through the motion.

## 4. Captions → `build_captions_v2.py`  (config: `captions`)

`working/build_captions_v2.py` reads `audio/words.json` (the song's OWN word timings — **not
Whisper**; Whisper on sung audio returns "🎵 Music Playing 🎵"). It hand-chunks ~3 words at
lyric-phrase boundaries, times each caption event to its first/last word, and colors
`captions.accent_words` in the warm-glow `accent_color` (#FFD89C) against the cream
`base_color` (#F5EDE0), lower-third Georgia italic → `finals/master-final-v2.ass`. The final
outro "with sleep again" is intentionally left uncaptioned so it doesn't double-stack with
the end-card tagline overlay.

## 5. End card + assembly → `build_end_card.py` + `promote_master*.py`  (config: `end_card`, `audio_mix`)

- `working/build_end_card.py` composites the brand lockup via **PIL** from the REAL brand
  asset (`brand-assets/app-icon-1024.jpg`, pulled from the iTunes Search API): brand-purple
  gradient + soft stars + circular app icon with a warm-glow halo + "Loóna" wordmark
  (Georgia Bold) + tagline (Georgia Italic) + App Store CTA → `working/end-card.png`.
  **Never AI-render brand text** (LEARNINGS L4 — a prior end card rendered "therapits").
- Assembly (`working/promote_master.py` → `_v2` → `_v3`, the version chain): cut each clip
  to its lyric window from `timeline.json`, hard-concat on the beat (one match-cut into T08),
  burn the caption ASS via libass, overlay the PIL end card on the final window
  (`end_card.overlay_window_sec` = 26.24–28.0), mux `audio/music.mp3`, boost the climax beat
  (`audio_mix.climax_boost_db` on T08), and loudnorm to `audio_mix.loudness_lufs` (−14 LUFS).
  Output → `renders/master-v3.mp4` (1080×1920, 30fps, h264+aac, 28s). The `promote_master*.py`
  scripts also register the render into `production/asset-manifest.json`,
  `production/render-outputs.json`, and `history/versions.json` for the control-plane app.

Re-cuts (new caption chunking, swapped end card, re-timed windows) reuse the existing
keyframes/clips/song and cost **$0** — only steps 1–3 spend.
