# render-cinematic-music-video scripts — the FREE assembly

`render-cinematic-music-video` is the **deterministic, $0 assembly stage** of the cinematic
music-video format. The paid stages (the sung anthem, the N film-look keyframes, the N Kling i2v
clips) are separate capabilities — `create-music-elevenlabs`, `create-image-fal`,
`create-video-fal`. This capability spends nothing: it takes the delivered anthem + `words.json`
+ one clip per beat + the brand end-card asset and stitches the finished master. Re-cuts (new
caption chunking, a swapped end card, re-timed windows) reuse the existing anthem / keyframes /
clips and cost **$0**.

`config.example.json` is the worked example (Hype and Vice "Game Day Girls", ~28s 1080×1920).
`PIPELINE.md` maps every config block to its source step. This README documents the FREE assembly
pieces that `render-cinematic-music-video` owns.

## 1. Lower-third captions — from the anthem's OWN word timings (NOT Whisper)

Captions come from `audio/words.json` — derived from the music model's `words_timestamps` (ms →
s) — never from Whisper (Whisper on sung audio returns "🎵 Music Playing 🎵"). The builder chunks
~4 words at lyric boundaries, times each event, and burns cinematic lower-third serif captions
(`--placement low`, serif font) via the captions atom, with the chorus hook line accent-treated
(bold-italic). The hero/hook chunk is timed so the load-bearing line lands on the chorus drop.

## 2. Per-beat clip assembly to the anthem timeline

The anthem sets the timeline. Each tableau boundary was snapped to a lyric-phrase edge in the
returned word timings, so assembly cuts each per-beat clip to its lyric window
(`scale=1080:1920 increase` + `crop`, `fps=30`, `tpad clone` to the window — pair `tpad` with an
explicit `-t` clamp) and hard-concats the clips **on the beat** (one optional match-cut into the
hero reveal). No dissolves. The single look pack + continuity anchor make N beats read as shot by
one photographer.

## 3. End card — from the real brand asset, no AI text

The brand lockup is composited (PIL/ffmpeg) from the brand's REAL asset, or authored as a
designed keyframe base, overlaid on the final window. The brand text is **never** AI-rendered as
free diffusion text — a diffusion model garbles a wordmark ("therapits").

## 4. FFmpeg composite

FFmpeg stitches the master: cut each clip to its lyric window, hard-concat on the beat →
`master-silent.mp4`; mux the anthem (`atrim`, `afade` in 0.15s / out 0.6s + `loudnorm I=-14`) →
`master-no-captions.mp4`; burn the cinematic lower-third caption ASS via the captions atom →
`master-final.mp4`. The sung anthem IS the bed — no separate VO. Output is a 1080×1920 h264 + aac
master. Deterministic, no paid calls, no keys.
