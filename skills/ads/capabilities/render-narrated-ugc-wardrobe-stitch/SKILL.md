---
name: render-narrated-ugc-wardrobe-stitch
description: Assemble a narrated-UGC "stitch reply" ad from a config — a single spoken VO carries a verbatim testimonial while ~30 per-cut i2v clips (one creator across ~5 wardrobes in ~3 worlds, plus product B-roll) are each trimmed to their EDL window built from the VO's Whisper word boundaries and hard-concatenated via filter_complex concat (never the demuxer, which drops audio on a duration mismatch), the VO mixed over an optional sidechain-ducked instrumental bed (−20dB, 20 to 1) so the VO stays on top, karaoke-pop captions burned on every word throughout (VEED Whisper preset, re-spelled against the locked script), a landing-page scroll rendered as FFmpeg zoompan over a Playwright PNG (not i2v), and closed on the brand's real end-card PNG — never AI-rendered text. This is the FREE deterministic assembly stage (trim-to-EDL + filter_complex concat + VO and music mix + karaoke captions + landing-page zoompan + end-card append), run with the shared stitch-videos-ffmpeg montage.py helper that installs with this package; the VO, creator, start-frames, and clips come from create-vo-elevenlabs / create-image-gpt-image-fal / create-image-fal / create-video-fal. Use for the narrated-ugc-wardrobe-stitch format.
status: active
version: "1.0.1"
updated: 2026-10-06
---

# render-narrated-ugc-wardrobe-stitch

Assemble a **narrated-UGC "stitch reply"** ad from a config: a fast-cut vertical testimonial
where a single spoken VO carries a verbatim ~13-sentence testimonial over ONE creator
across ~5 wardrobe changes in ~3 micro-worlds, interspersed with product B-roll (e.g. product macro,
unboxing, a landing-page scroll), ~30 hard cuts on the VO cadence, closing on a brand end card.
This capability is the **FREE, deterministic assembly** — trim-to-EDL, hard-concat, the VO+music
mix, the karaoke-pop caption burn, the landing-page zoompan, and the end-card append.

`scripts/config.example.json` is one worked example (Bioma "Do NOT buy Bioma Probiotics", ~37s
1080×1920 9:16, ~30 body cuts + a ~2s end card) — its creator, voice, hook, worlds and music are
that demo's answers, not defaults; `scripts/PIPELINE.md` maps every config block to
its source step and `scripts/README.md` documents the free assembly.

## Choices

The creative calls are made upstream by the user (the recipe's `choices`) and arrive in the config;
this assembly never picks them.

- **creator** — who is on camera → `character.descriptor` / `character.name`. The demo used a
  28-year-old blonde woman.
- **voice** — the narration voice → `vo.voice_id` / `vo.settings`. The demo used an excited voice
  matched to its creator.
- **hook_angle** — the testimonial's hook → `vo.hook_line` / `vo.script_md` / `vo.payoff_line`. The
  demo used a "Do not buy <brand>" reversal.
- **worlds** — the 3 places → `worlds.briefs`. The demo used bedroom / kitchen / bathroom.
- **music** — the bed under the VO, or none → `audio_mix.music_brief`. With "no music", skip the bed
  and mix the VO alone.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are
separate capabilities — the spoken VO (`create-vo-elevenlabs`) Whisper-aligned so the WORD
BOUNDARIES set the cut grid; one locked creator (`create-image-gpt-image-fal` anchor + ~5 wardrobe
edits chained off the anchor) + 3 world wides + per-cut start-frames (`create-image-fal` product
composites); and one Veo/Seedance i2v clip per cut (`create-video-fal`). Given the VO +
`vo-final.words.json` + `edl.json` + one clip per cut + a Playwright landing-page PNG + the brand
end-card PNG, `render-narrated-ugc-wardrobe-stitch` trims each clip to its EDL window, hard-concats
on the VO cadence, mixes the VO over the ducked bed, burns the karaoke-pop captions, appends the
end card → the master. Re-cuts reuse the existing VO / start-frames / clips and cost **$0**.

**The assembly runs on a shared helper.** `montage.py` lives in the shared `stitch-videos-ffmpeg`
atom, which this package lists in `requires_skills`, so it installs alongside. After
`gooseworks fetch render-narrated-ugc-wardrobe-stitch` it is at
`/tmp/gooseworks-scripts/stitch-videos-ffmpeg/scripts/montage.py`. Write a `montage.json` from the
config (field mapping in `scripts/README.md`), then:

```bash
M=/tmp/gooseworks-scripts/stitch-videos-ffmpeg/scripts/montage.py
python3 $M edl --spec montage.json --out edits/edl.json            # check every clip + window first
python3 $M run --spec montage.json --out edits/master-final.mp4 --workdir edits/work
```

`run` builds the EDL from the VO word boundaries (`word_range`), trims and hard-cuts every clip
with the `filter_complex` concat filter, renders the landing-page scroll as a zoom/pan over the PNG,
holds the end-card PNG, burns the word-by-word captions (with `respell`), mixes the VO over the
ducked bed, and masters to -14 LUFS. It writes `edits/work/manifest.json`. This package ships no
scripts of its own.

## Contract (the free assembly)

- **The spoken VO carries the narrative — lock it FIRST.** The VO IS the narration bed; the whole
  ad is cut to it. Never plan the cut grid before the VO is locked and Whisper-aligned.
- **Build the EDL from the VO's Whisper word boundaries.** ~30 role-tagged cuts (`hook`, `feature`,
  `reaction-insert`, `payoff-hold`, `b-roll-insert`, `landing-page`); snap every cut window to the
  word boundaries. The payoff line gets a HELD `payoff-hold` beat (~3× mean shot length).
- **Hard cuts via `filter_complex concat`, not the demuxer.** Trim each clip to its EDL window and
  hard-concat with `filter_complex concat` — the `-f concat` demuxer drops the audio when a
  drawtext/scale step shaves a clip a few ms below its window. No dissolves.
- **Karaoke-pop captions on every word, throughout.** From the VO's `vo-final.words.json` (VEED
  Whisper preset, bold yellow), on every word; re-spell brand tokens Whisper mishears against the
  locked script (Bioma demo: "synbiotic" over "symbiotic"; kept "I'ma" verbatim) — never edit the script to
  match Whisper. Captions are suppressed over the end card. If VEED mis-captions a brand token,
  hand-patch that sentence with local ASS karaoke.
- **Product B-roll breaks up the talking head.** Product macro (Bioma: capsules), unboxing, and a landing-page
  scroll are interspersed with the creator cuts. The landing-page scroll is FFmpeg **zoompan** over
  a Playwright-rendered PNG — **not** an i2v clip (i2v hallucinates the UI).
- **VO over a ducked bed.** Mix the optional instrumental bed sidechain-ducked UNDER the VO
  (−20dB, 20:1) so the VO stays clearly on top; the bed can drop in on the payoff beat.
- **End card via the brand's real PNG — never AI-render brand text.** Append the brand's real
  end-card PNG (~2s) on the tail, captions suppressed. A diffusion model garbles a wordmark.
- **FFmpeg composite, deterministic, FREE.** Trim-to-EDL, `filter_complex concat`, VO+music mix,
  caption burn, landing-page zoompan, end-card append, `loudnorm I=-14` → a 1080×1920 h264+aac
  master (~37s). No paid calls, no keys.
