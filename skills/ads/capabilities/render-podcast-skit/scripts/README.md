# render-podcast-skit scripts — the FREE assembly

`render-podcast-skit` is the **deterministic, $0 assembly stage** of the fake-podcast skit
format. The paid stages — the per-line ElevenLabs with-timestamps VOs, the two base stills, the
~10 expression variants, and the per-line lipsync clips — are separate capabilities
(`create-vo-elevenlabs`, `create-image-fal`, `create-video-fal`). This capability spends nothing:
it takes the per-line clips + their VO timestamps + the brand wordmark and stitches the finished
master. Re-cuts (new caption chunking, a re-timed slice, a swapped end card) reuse the existing
clips and cost **$0**.

`config.example.json` is the worked example (Ladder run-02 "Laundromat 2am", ~49s 1080×1920).
`PIPELINE.md` maps every config block to its source step. This README documents the FREE
assembly pieces that `render-podcast-skit` owns.

## 1. Karaoke captions — from the VO's OWN char-level timestamps (script-window, NOT Whisper)

Captions come from each line's ElevenLabs with-timestamps response — the char-level word timings
returned **with** the VO — never from Whisper (Whisper on the rendered clips mistimes). The
assembler walks the scenes in script order and builds a **global `words.json`**: each word's time
is its local char-level time **+ the cumulative clip start** (the sum of the preceding clips'
durations). It emits a yellow (`#FFEB3B`) karaoke ASS with a 3-word phrase cap, bottom-center.

## 2. Per-line clip assembly, hard-concat in script order

One line = one scene = one clip. The clips are hard-concatenated in script order (scale/pad to
1080×1920, re-encode `libx264 -preset veryfast -crf 20`), so the edit cuts on the dialogue beat.
No dissolves. Anchoring every still on one base upstream keeps the set pixel-identical across all
~22 cuts, so the many cuts read as one continuous podcast.

## 3. End card — Playwright/PIL from the real wordmark, no AI text

The brand lockup is composited via **Playwright** from the brand's REAL wordmark SVG: black
background + the brand wordmark + a CTA pill + the URL → an HTML file → a screenshot to a
1080×1920 PNG → a **2.5s** silent mp4. The brand text is **never** AI-rendered — a diffusion
model garbles a wordmark.

## 4. FFmpeg composite

FFmpeg stitches the master: concat the per-line clips (scale/pad 1080×1920, re-encode), burn the
karaoke ASS via libass, and auto-append the 2.5s end-card mp4. The VOs carry the audio (no music
bed by default). Output is a 1080×1920 h264 + aac master. Deterministic, no paid calls, no keys.
