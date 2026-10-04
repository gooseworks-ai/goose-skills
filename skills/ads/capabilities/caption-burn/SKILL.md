---
name: caption-burn
description: Burned-in captions for a finished vertical video, three kinds. transcribe.py gets word timings from the video's own audio through the GooseWorks proxy (fal Whisper, bills the Ads agent, cents); captions.py burns one to three words at a time with Pillow + ffmpeg (no libass needed), either pinned to a split-screen seam (plate 25% above / 75% below) or at a fixed height, in a plate, outline or one-word serif style, with an optional red hook card; plates.py burns per-beat caption blocks (black, one union silhouette, placed in the emptiest band) for formats with no voice. The last caption (the CTA) holds to the final frame. Use as the last step of any video ad.
status: active
---

# caption-burn

Captions timed to what is actually said in the finished video, not to the script's
estimate.

## Run

```bash
python transcribe.py --media reel.mp4 --out reel.words.json          # paid, cents
python captions.py --video reel.mp4 --beats cutlist.aligned.json \
    --words reel.words.json --out final.mp4 [--style plate|outline] [--highlight Brand]
```

`--beats` supplies the lines (`vo`), their timing and, for split layouts, `seam`, `size`
and each beat's `state`. Any file with `beats: [{start, end, vo}]` works.

## Placement and style

- `--anchor seam` (the default when the beats have a seam): on `split` beats the plate is
  pinned to the seam, **positioned by the plate, not the text**: 25% of the plate above the
  line, 75% below. Full-frame beats use `--full-y`.
- `--anchor fixed --y 0.62`: every caption's plate centred at that fraction of the height.
- `plate` (default): white bold on a dark grey rounded plate, 1–2 words, cap ~0.019 H.
- `outline`: white bold with a dark outline, no plate, 1–3 words, cap ~0.034 H.
- `--highlight WORD` colours that word yellow (the CTA keyword). Repeatable.

- `serif-word`: ONE word at a time, heavy serif (Georgia Bold), white with a black outline,
  on a fixed baseline at 0.77 H (the screen-insert look). The highlight word is quoted.
- `--card "LINE ONE|LINE TWO" --card-until 4.7`: a white rounded hook card with two lines
  of heavy red capitals near the top, for the opening seconds. ~14 characters a line.

## Captions for a format with no voice (plates.py)

```bash
python plates.py --video walk.mp4 --beats cutlist.json --out captioned.mp4 [--logo logo.png]
```

Each beat's `caption` (a string or list of lines) shows for the whole beat on ONE black
block (square rectangles unioned, then rounded as a single silhouette: rounding each line
leaves seams), lines left-aligned, the block centred on its widest line. It goes in the
emptiest band of that beat's frame unless the beat pins `cap_y`. `logo: true` on a beat
hangs the logo tile under the block. Write lines a person would type: the same short
"fragment. fragment." shape three times reads as AI-written. No emoji twice.

## Rules

1. **Transcribe the FINISHED audio.** Joining takes and aligning lines shifts timing;
   only the final video's audio gives correct cues.
2. **The last caption holds to the last frame.** It is the call to action.
3. **A word Whisper writes differently** ("200" for "two hundred") is interpolated between
   its neighbours rather than dropped or stretched over the whole line.
4. **Without `--words` timing is estimated** from syllables. Use that to judge placement,
   never to ship.
5. **Fonts:** a bold sans is found on macOS, Linux or Windows; if none is present, Roboto
   Bold is fetched once into `~/.cache/gooseworks/fonts`. `--font` or `GW_CAPTION_FONT`
   overrides.

## Footprint before composition

The bundled footprint helper uses this renderer's cue grouping, selected font, stroke, plate padding and anchor. Export it from the approved beat list and pass it to the footage-cutlist preview. The JSON includes every group and the union of its rendered bounds per beat. Use the same style, anchor, font and fixed-position settings for the final burn; regenerate after alignment or copy changes. Caption coverage must leave claim qualifications readable. Inspect final captioned frames as well as this planned coverage.

Pass the same highlight terms to footprint and burn, including serif-word quotes. Preview rejects a changed cut list until its footprint is rebuilt. An explicitly supplied missing font fails in both commands.
