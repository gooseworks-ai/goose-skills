# render-cartoon-music-video scripts — the FREE assembly

`render-cartoon-music-video` is the **deterministic, $0 assembly stage** of the cartoon
music-video format. The paid stages (the sung song, the character lock, the N per-bar keyframes,
the N Seedance i2v clips) are separate capabilities — `create-music-elevenlabs`,
`create-image-fal`, `create-video-fal`. This capability spends nothing: it takes the song +
`word-timestamps.json` + `bars.json` + one clip per bar + the brand wordmark SVG and stitches the
finished master. Re-cuts (new caption chunking, a swapped end card, re-timed windows, a logo-bug
toggle) reuse the existing song / keyframes / clips and cost **$0**.

`config.example.json` is the worked example (Coinbase "Bet on anything", ~55s 1080×1920).
`PIPELINE.md` maps every config block to its source step. This README documents the FREE assembly
pieces that `render-cartoon-music-video` owns.

## 1. Captions — from the song's word timings, re-spelled against the locked lyrics

Captions come from the song's `word-timestamps.json` **re-spelled against the locked lyrics**
(`align_to_lyrics`) — Whisper mishears shouted accents ("BETS" → "Hearts", "WIN" → "Went"), so
the timed tokens are re-spelled against the locked lyric file (never edit the lyrics to match
Whisper). Feed a `lyrics-plain.md` (lyric text only, no bar-grid table) so the parser doesn't
ingest hundreds of markdown-table "words". It chunks ~4–5 words per cue and renders VEED-whisper
style — clean white **bold sans** in the **BOTTOM third** (Alignment 2, `margin_v` above the
bottom-left logo bug so they don't collide, NO pill, 6px outline), ≥0.9s on screen — and STOPS
captions at the end-card boundary so the brand frame breathes. Do **not** place captions mid-frame
(Alignment 5) — it covers the character (fixed 2026-07). Matches the `ugc-walk-and-talk` recipe's
`add-captions-veed-fal --preset whisper --position bottom` treatment.

## 2. Cut-to-bar + hard-concat on the bar

The song's BAR GRID (librosa beat-track, 4/4) sets the timeline — one bar = one shot (default).
Assembly cuts each body clip to its bar window from `bars.json` and hard-concats **on the bar**
(the shipped cut used hard cuts — a tested 0.3s xfade read less punchy). No dissolves. The climax
clip is timed so the payoff line lands on the drop.

## 3. Logo bug + end card — cairosvg + PIL from the real wordmark, no AI text

- **Logo bug:** cairosvg renders the brand wordmark SVG → recolored white via PIL → the
  persistent bottom-left bug burned over the body bars, **suppressed on the end card**.
- **End card:** cairosvg white wordmark + PIL subhead on a solid brand-color card → a silent ~3s
  end-card mp4. On macOS pick a font with the em-dash / middle-dot glyph (use ` · `).

The brand text is **never** AI-rendered — a diffusion model garbles a wordmark.

## 4. FFmpeg composite

FFmpeg stitches the master: cut each body clip to its bar window, hard-concat on the bar, burn the
logo bug (bottom-left) + the caption ASS via libass, append the end card holding ~3s, mux the song
OVER the whole video including the end card with a 0.5s `afade` at the tail (no silent tail), and
`loudnorm I=-14`. The sung song IS the bed — no separate VO. Output is a 1080×1920 h264 + aac
master. Deterministic, no paid calls, no keys.
