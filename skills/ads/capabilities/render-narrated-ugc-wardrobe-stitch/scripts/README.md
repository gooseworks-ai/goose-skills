# render-narrated-ugc-wardrobe-stitch scripts — the FREE assembly

`render-narrated-ugc-wardrobe-stitch` is the **deterministic, $0 assembly stage** of the
narrated-UGC "stitch reply" format. The paid stages (the spoken VO, the creator lock, the ~5
wardrobe edits + 3 world wides, the ~30 per-cut start-frames, the ~30 Veo/Seedance i2v clips) are
separate capabilities — `create-vo-elevenlabs`, `create-image-gpt-image-fal`, `create-image-fal`,
`create-video-fal`. This capability spends nothing — it takes the VO + `vo-final.words.json` +
one clip per cut + a Playwright landing-page PNG + the brand end-card PNG and stitches the
finished master. Re-cuts (new caption timing, re-timed windows, an end-card swap) reuse the
existing VO / start-frames / clips and cost **$0**.

`config.example.json` is one worked example (Bioma "Do NOT buy Bioma Probiotics", 1080×1920; the
original run's master was ~37 s).
Its creator, voice, hook angle, worlds and music bed are the demo's answers to the recipe's
`choices` — never copy them as defaults.
`PIPELINE.md` maps every config block to its source step. This README documents the FREE assembly.

## 0. Run it — the shared `montage.py` helper

This package ships no scripts of its own. The assembly runs on `montage.py` from the shared
`stitch-videos-ffmpeg` atom. This package lists that atom in `requires_skills`, so it installs
alongside: after `gooseworks fetch render-narrated-ugc-wardrobe-stitch` the helper is at
`/tmp/gooseworks-scripts/stitch-videos-ffmpeg/scripts/montage.py`. It needs python3 and ffmpeg
(plus Pillow for captions when the ffmpeg has no libass: `python3 -m pip install pillow`). The full
spec format is in `stitch-videos-ffmpeg/SKILL.md`.

```bash
M=/tmp/gooseworks-scripts/stitch-videos-ffmpeg/scripts/montage.py
python3 $M edl --spec montage.json --out edits/edl.json     # checks every clip and window, lists all problems
python3 $M run --spec montage.json --out edits/master-final.mp4 --workdir edits/work
```

Write `montage.json` from `config.json` like this:

| config.json | montage.json |
|---|---|
| `width`, `height`, `fps` | `output.width`, `output.height`, `output.fps` |
| `vo.outputs.word_timings` | `words` (cut grid) and `captions.words` (captions) |
| `edl.timeline_sample[]` (a sample; the full ~30-cut grid is the run's `edl.json`) — one entry per cut | `clips[]` in order: `file` = that cut's clip, `label` = its role, `word_range: [first, last]` = the words it covers |
| `landing_page.render_png` scroll cuts | `clips[]` stills with `duration` and `pan` (zoom/pan across the PNG) |
| `end_card.brand_png`, `end_card.hold_sec` | the last `clips[]` entry: the PNG with `duration` |
| `captions.respell_tokens`, `captions.accent_color` | `captions.respell`, `captions.style.color` (`position: center` = `style.y: 0.5`) |
| `audio_mix.vo`, `audio_mix.music` | `audio.vo`, `audio.music` (leave `music` out when the user chose no music) |
| `audio_mix.music_drop_s`, `audio_mix.loudness_lufs` | `audio.music_start`, `audio.target_lufs` |
| `audio_mix.music_gain_db` (-20 in the demo) | no direct field: the bed is set by loudness instead, `audio.music_lufs` (default -24 LUFS between VO lines, then ducked 20:1). Raise or lower it to taste. |

```json
{
  "output": {"width": 1080, "height": 1920, "fps": 30},
  "words": "audio/vo-final.words.json",
  "clips": [
    {"file": "clips/scene-01.mp4", "label": "hook", "word_range": [0, 0]},
    {"file": "clips/scene-02.mp4", "label": "hook", "word_range": [1, 4]},
    {"file": "clips/scene-11.mp4", "label": "payoff-hold", "word_range": [40, 45]},
    {"file": "assets/overlays/landing-page.png", "label": "landing-page", "word_range": [96, 101],
     "pan": {"from": {"zoom": 1.0}, "to": {"x": 0.5, "y": 0.62, "zoom": 1.8}}},
    {"file": "../../brand-assets/end-card.png", "label": "end-card", "duration": 2.0}
  ],
  "captions": {"words": "audio/vo-final.words.json", "per": 1,
               "respell": {"symbiotic": "synbiotic"}, "style": {"color": "#FFE800", "y": 0.5}},
  "audio": {"vo": "audio/vo-final.mp3", "music": "audio/music/bed.mp3", "music_start": 14.21}
}
```

Notes:

- **Words file:** use `vo-final.words.json` exactly as the transcriber wrote it. Whisper's nested
  `segments[].words[]` (goose-studio's `transcribe-audio-fal`), a flat `[{text|word, start, end}]`
  list, `{words: [...]}` and fal's `{chunks: [...]}` all work.
- **Keep `audio.vo_start` at 0.** `word_range` cuts and word captions are timed on the words file's
  clock; `vo_start` moves only the VO audio, not the cuts or captions.
- **Length:** the master is as long as the VO (to its last word) plus the end card. `word_range`
  keeps the VO's pauses, so a VO with natural pauses runs longer than the demo's ~37 s (a VO whose
  last word ends at 39.9 s gives a ~41.9 s master with a 2 s card). Tighten the VO itself (tempo,
  pauses) before cutting if the length matters.
- The word indexes above are illustrative and the middle cuts are left out. In a real spec the
ranges run on with no gaps (the `edl` step warns about any gap); take them from your own
`vo-final.words.json`.

## 1. Build the EDL from the VO's word boundaries

The VO is Whisper word-aligned (`vo-final.words.json`). The EDL is ~30 role-tagged cuts in
`montage.json`, one `clips[]` entry per cut, each covering a `word_range` of the VO. `montage.py`
turns each range into a window that starts on its first word and ends where the next cut's first
word starts, so every hard cut lands on the narration cadence and the cuts tile the VO with no gaps.
It writes the resolved windows and frame counts to `edl.json`. Roles (`hook`, `feature`,
`reaction-insert`, `payoff-hold`, `b-roll-insert`, `landing-page`) go in `label`. The payoff line
gets a HELD `payoff-hold` beat (~3× mean shot length). Choosing which words each cut covers is the
creative call; the helper only makes the windows exact.

## 2. Trim-to-EDL + hard-concat via `filter_complex concat`

`montage.py` trims each body clip to its EDL window and hard-concats **on the VO cadence** with
`filter_complex concat` — **never the `-f concat` demuxer**, which drops the audio when a
drawtext/scale step shaves a clip a few ms below its window. Every cut gets an exact frame count, so
the body is exactly as long as the EDL. No dissolves. The payoff clip is timed so the payoff line
lands on the held reveal beat. An i2v clip shorter than its window by more than 0.1 s is an error
(re-roll it or shorten the window).

## 3. Product B-roll — landing-page scroll is zoompan, not i2v

Capsule macro, unboxing, and a landing-page scroll break up the talking-head cuts the way a real
stitch reply does. The landing-page scroll is FFmpeg **zoompan** over a Playwright-rendered PNG (the
Bioma run rendered `landing-page.png` at 2160×3840 and zoomed wide → best-value card → order button)
— it is **not** an i2v clip, because i2v hallucinates the UI. In `montage.json` each scroll cut is a
still with a `pan` (window centre `x`/`y` and `zoom`, from → to). The capsule/unboxing composites
come from the paid start-frame stage grounded on the real product hero.

## 4. Word-by-word captions — from the VO word timings, re-spelled against the locked script

The demo burned VEED's karaoke-pop preset (bold yellow, every word, throughout). `montage.py` burns a
simpler free version from `vo-final.words.json` with `captions.words` and `per: 1`: one word at a
time, each held until the next, in one colour (`captions.style.color`, e.g. `#FFE800`) with a dark
outline. It does not highlight the active word inside a phrase, and `captions.base_color` is not
used. For VEED's exact look, burn the captions in VEED instead. Re-spell brand tokens Whisper mishears against the locked script with
`captions.respell` (Bioma demo: "synbiotic" over "symbiotic"; kept "I'ma" verbatim) — never edit the
script to match Whisper. Captions stop with the last word, so they are suppressed over the end card.
The helper draws captions with Pillow when it is installed and with libass otherwise, so the host
ffmpeg does not need libass.

## 5. VO + music mix + end card + composite

- **Audio:** the VO IS the narration bed (the whole ad is cut to it). `montage.py` mixes the VO
  over the optional bed described by `audio_mix.music_brief` (leave `audio.music` out when the user
  chose no music). The bed is sidechain-ducked UNDER the VO (20:1) so the VO stays clearly on top,
  and it can drop in on the payoff beat (`audio.music_start`).
- **End card:** append the brand's real end-card PNG (~2s) on the tail as the last `clips[]` still.
  The brand text is **never** AI-rendered — a diffusion model garbles a wordmark.
- **Composite:** `montage.py run` trims each cut to its window, builds the landing-page zoompan
  cuts, `filter_complex concat`s all ~30 cuts, burns the captions, mixes the VO + bed, and
  masters to -14 LUFS → a 1080×1920 h264 + aac master (as long as the VO plus the end card) plus
  `manifest.json`. Deterministic,
  no paid calls, no keys.
