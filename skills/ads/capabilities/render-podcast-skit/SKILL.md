---
name: render-podcast-skit
description: Assemble a two-host fake-podcast skit ad from a config — per-line lipsync clips hard-concatenated in script order, scaled/padded to 1080×1920, WHITE bottom-center captions (up to 5 words per cue, broken on sentence punctuation, word-wrapped to stay in-frame, held at least 0.9s) built from each line's OWN ElevenLabs char-level timestamps (offset by cumulative clip start, never Whisper), and closed on a Playwright/PIL brand end card composited from the real wordmark — never AI-rendered text. This is the FREE deterministic assembly stage (concat + white captions + end card + crf28 encode); the per-line VOs, photoreal gpt-image-2 base stills, expression variants, and lipsync clips come from create-vo-elevenlabs / create-image-gpt-image-fal / create-video-fal. Use for the podcast-skit format.
status: active
---

# render-podcast-skit

Assemble a **two-host fake-podcast skit** ad from a config: a skeptic and a believer at an
absurd themed podcast desk do a snappy back-and-forth about the product (the set is
deliberately unrelated — that is the joke). Each line is its own lipsync clip so the edit can
cut on the dialogue beat (~1.8s avg); this capability is the **FREE, deterministic assembly**
that concatenates those clips, renders the WHITE captions, and appends the brand end card.

`scripts/config.example.json` is the worked example (Ladder run-02 "Laundromat 2am", ~49s
1080×1920 9:16, ~22 lines); `scripts/PIPELINE.md` maps every config block to its source step
and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are
separate capabilities: one ElevenLabs **with-timestamps** VO per line (one voice per host) via
`create-vo-elevenlabs`; two photoreal base stills at the themed desk plus ~10 expression variants
(mouths NEUTRAL/CLOSED, **gpt-image-2 quality=high**, not nano-banana) via
`create-image-gpt-image-fal`; and one lipsync clip per (still, VO) pair via `create-video-fal`.
Given the per-line clips + their VO timestamps + the brand wordmark SVG, `render-podcast-skit`
walks the scenes in script order, builds the global caption timeline, renders the WHITE captions,
hard-concats the clips, auto-appends the end card, and final-encodes crf28 → the master. Re-cuts
reuse the existing VOs / stills / clips and cost **$0**.

## Contract (the free assembly)

- **Dialogue-carried, no music bed by default.** The per-line VO is the audio; a podcast skit
  needs no music (an optional low ambience is a taste call, off by default).
- **One line = one scene = one hard cut, in script order.** Hard-concat the per-line clips in
  order (scale/pad to 1080×1920, re-encode) — no dissolves.
- **Captions from the VO's OWN char-level timestamps, not Whisper (script-window).** Build a
  global `words.json` by offsetting each line's char-level word timings by the cumulative clip
  start, group into **≤5-word cues broken on sentence-final punctuation**, and render **WHITE
  `#FFFFFF`** bottom-center captions (black outline), **word-wrapped to stay in-frame** and held
  **≥0.9s** — PIL PNG overlays when the host ffmpeg lacks libass (common), else ASS. (Yellow 3-word
  karaoke was the old style, rejected in testing.) Whisper on the rendered clips mistimes; the VO
  timestamps are ground truth.
- **End card via Playwright/PIL from the real wordmark — never AI-render brand text.** The
  lockup is a deterministic HTML → PNG → 2.5s mp4 from the brand's real wordmark SVG (black bg,
  brand wordmark, CTA pill, URL), auto-appended after the last line. A diffusion model garbles
  a wordmark.
- **FFmpeg composite, deterministic, FREE.** Concat the clips, overlay the WHITE caption PNGs (or
  burn ASS via libass), append the end-card mp4, and **final-encode `-preset slow -crf 28` + aac
  96k** → a 1080×1920 h264+aac master (~6MB for ~28s; the old `-crf 20` produced ~16MB). No paid
  calls, no keys.
