# render-song-mv scripts — the FREE assembly

`render-song-mv` is the **deterministic, $0 assembly stage** of the song-driven
music-video format. The three paid stages (the sung song, the N keyframes, the N i2v
clips) are separate capabilities — `create-music-elevenlabs`, `create-image-fal`,
`create-video-fal`. This capability spends nothing: it takes the delivered song +
`words.json` + one clip per tableau and stitches the finished master. Re-cuts (new
caption chunking, a swapped end card, re-timed windows) reuse the existing song / keyframes
/ clips and cost **$0** — only the paid capabilities spend.

`config.example.json` is the worked example (Loóna "Fall In Love With Sleep Again", 28s
paper-craft 9:16). `PIPELINE.md` maps every config block to its source step. This README
documents the four FREE assembly pieces that `render-song-mv` owns.

## 1. Lyric-synced captions — from the song's OWN word timings (script-window, NOT Whisper)

Captions come from `audio/words.json` — the word-level timestamps the music model returns
**with** the song — never from Whisper. Whisper on a sung track returns "🎵 Music Playing 🎵",
so it cannot time captions to lyrics; the script-window approach reads the song's own words
instead. The builder hand-chunks ~3 words at natural lyric-phrase boundaries (`captions.chunk_words`),
times each caption event to its first/last word, and colors the `captions.accent_words` in
the warm-glow `accent_color` against the `base_color` (lower-third serif italic) → an ASS
subtitle file. The hero/hook chunk is timed so the payoff word (`song.hook_word`) lands on
the chorus drop; the outro line is intentionally left uncaptioned so it doesn't double-stack
with the end-card tagline.

## 2. Per-scene clip assembly to the song timeline

The song sets the timeline. Each tableau boundary in `timeline.json` was snapped to a
lyric-phrase edge in the returned word timings, so assembly cuts each per-tableau clip to
its lyric window and hard-concats the clips **on the beat** (one optional match-cut into the
hook-hero reveal). No dissolves. The N clips + their windows are a pure function of the song,
so the whole cut is deterministic and repeatable.

## 3. PIL end card — from the real app icon, no AI text

The brand lockup is composited with **PIL** from the brand's REAL asset (e.g. the app icon
pulled from the iTunes Search API): brand-color gradient + soft stars + the circular app
icon with a warm-glow halo + wordmark + tagline + CTA → a PNG overlaid on the final window
(`end_card.overlay_window_sec`). The brand text is **never** AI-rendered — a diffusion model
garbles a wordmark ("therapits"), so the lockup is drawn deterministically from the real
asset every time.

## 4. FFmpeg composite

FFmpeg stitches the whole master: cut each clip to its lyric window, hard-concat on the beat,
burn the caption ASS via libass, overlay the PIL end-card PNG on the final window, mux
`audio/music.mp3` (the sung track IS the bed — no separate VO), boost the climax beat
(`audio_mix.climax_boost_db`), and loudnorm to `audio_mix.loudness_lufs` (−14 LUFS). Output
is a 1080×1920 h264+aac master. Deterministic, no paid calls, no keys.
