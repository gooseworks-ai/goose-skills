---
name: review-finished-ad
description: Final QC gate for a rendered 9:16 video ad, run before it is published. One script checks what a machine can decide — exact 1080x1920 size, a hook that moves and speaks in the first second, no frozen stretches, no dead air, no black frames, the brand's real logo on the end card (never a favicon, never a redrawn or wrong logo), end-card colours near the brand palette — and builds one contact sheet (frames with the TikTok/Reels UI safe zones shaded, beside the logo, product images and a font specimen) for the checks that need eyes — font, product likeness, product consistency across scenes, safe zones. A declared silent-text profile covers silent, text-led formats such as kinetic text (no audio track needed, short blank beats between text beats allowed within fixed bounds). Exit 0 PASS / 2 FAIL / 3 ERROR. Use on every finished video master before pinning it.
status: superseded
superseded_by: check-layer@1.1.1
---

> **Superseded:** the video kit now does this with the check-layer part, version 1.1.1, in the parts folder of this repository. It runs the machine checks every finished video gets: it plays, length, size, sound level, captions, black and frozen frames and the end card. This atom stays, unchanged in behaviour, for skills outside the kit until they move; its scripts still run.

# review-finished-ad

The gate between a rendered master and the user. A finished ad has to look like
the brand's ad and play like an ad, not like a pile of clips. This skill checks
both, fixes are made by the caller, and the gate is re-run until it passes.

## Run it

Needs `ffmpeg` + `ffprobe` on PATH and `pip install --quiet numpy pillow`.

```bash
python3 scripts/review_finished_ad.py \
  --video working/final.mp4 \
  --json working/review/finished-ad.json \
  --sheet working/review/finished-ad-sheet.png \
  --logo working/brand/logo.png \
  --palette "#0b3d2e,#f4efe6" \
  --product-images working/brand/product-1.png,working/brand/product-2.png \
  --font working/brand/font.ttf --brand-name "Acme"
```

- `--logo` is the logo **file the video actually composites**: the kit's `logoUrl` /
  `logos[0]`, or the wordmark file the recipe's end card uses. PNG, JPEG or SVG (an SVG is
  rasterised with `cairosvg` or `rsvg-convert`). Never a generated logo.
- **No logo image in the video** (the brand name set as text in the brand font, because the
  kit only has a favicon or no logo): omit `--logo`, and judge the text wordmark on the sheet.
- `--endcard-s` is the end card's length (default 3.0). Set it to the real length: a longer
  silent or static end card would otherwise read as dead air or a freeze.
- `--logo-at 3.2` (repeatable) adds a timestamp where the logo also appears
  mid-video; the end card (last ~1.6s) is always checked.
- `--no-speech` for formats with no voiceover or dialogue (music-only), so
  silence is not judged.
- `--format-profile silent-text` for a **declared silent, text-led format** (kinetic text).
  Use it only when the recipe names it. It implies `--no-speech` and changes three checks
  (see "Silent-text profile" below); every other check stays the same.
- `--expect-size` defaults to `1080x1920`. Video ads are always 9:16.

**Exit 0 → PASS.** Still read the sheet (below) before publishing.
**Exit 2 → FAIL.** `failed` lists the checks; each `note` says what to fix.
**Exit 3 → ERROR.** The check could not run (missing file, no ffmpeg); fix and
re-run. Never publish blind.

## Machine checks

| Check | Fails when | Typical fix |
|---|---|---|
| `ratio` | output is not exactly 1080x1920 | scale + pad every clip to 1080x1920 BEFORE the concat |
| `hook` | no sound in the first 1.0s, or the opening frame is still for > 1.5s | start the VO/music at 0s; open on motion or a cut, not a held title |
| `pacing` | the picture is frozen for > 2.5s before the end card, or the audio runs past the last video frame by more than both `--max-freeze-s` and `--endcard-s` (> 0.5s warns; see below) | add motion (push-in, b-roll, a cut) or trim the hold; trim the audio or extend the picture |
| `dead_air` | silence > 1.0s mid-video (skipped with `--no-speech`) | tighten the VO timing or run the music bed under the gap |
| `black_frames` | a black stretch > 0.3s | fix the concat / transition |
| `logo_asset` | the logo file is favicon-sized (long side < 256px, or under 40,000 px²) | do not upscale it: ask for a real logo, or set the wordmark as text in the brand font (then drop `--logo`) |
| `logo` | the kit logo is not found on the end card (below the fail line for its mode) | composite the uploaded logo file onto the end card; never regenerate or retype it |
| `palette` | *(warn only)* no kit colour among the end card's main colours | use a kit colour for the end-card background or text |

### What counts as sound, motion and the end of the video

These rules apply to every profile:

- **Sound.** With speech expected (no `--no-speech`), a stretch that holds only isolated
  clicks or ticks counts as silence for `hook` and `dead_air`: nothing in it lasts 40ms or
  more, and there are fewer than 6 a second (denser ticking, like a hi-hat bed, is a rhythm
  and counts as sound). A tick is not speech or music, so a ticking intro before the VO, or a
  VO pause covered only by sparse taps, fails like silence. With `--no-speech` any sound counts,
  as before (sound-effect formats). In the silent-text profile a click-only track is "no
  meaningful audio": `dead_air` is not applicable and the sheet asks a person to listen
  (typewriter keys are fine, glitches are not). The clicks are still heard, so `hook` still
  needs them to start in the first 1.0s, like music. Every audio check reads ffmpeg's default
  audio track (the one flagged default, else the one with most channels): the track players
  play. The clicks are read on the same timeline as the silence check; if they cannot be read,
  the check falls back to silence alone.
- **Motion.** ffmpeg's freeze detector reads a 270px copy, so thin, low-contrast text
  changing (a script font on beige) can look frozen. A still run that could fail `hook` or
  `pacing` is re-read at 540px and split where the picture changes for real: a new state that
  holds 0.3s and never goes back (text beats), or continuous motion for 0.3s across at least
  15% of the frame (a pointer gliding). A change means pixels clearly moved across rows at
  least 2% of the width tall, inside 12px squares (at 1080px) whose average moved too: by more
  than 8 levels of brightness, or 16 in one colour. An encoder short of bits keeps sharpening a
  still frame by frame; that moves edges and colour fringes but not the averages, so a starved
  still stays frozen. Identical frames, a thin progress bar, a blinking caret, a pulsing icon,
  a one-frame flash or a small spinner stay frozen too. Strokes about 1px wide at 1080px are
  still below what it can see; judge those on the sheet. A still encoded with so few bits that
  it never stops refining can escape ffmpeg's freeze detector itself (as it always has): if
  the sheet's frames all look the same, treat the ad as frozen.
- **The end.** When the audio runs past the last video frame, the check judges what players
  show: the last frame held through the tail. `pacing`, `dead_air` and the end card keep the
  file's timeline (a frozen or silent ending fails as before), frames are grabbed from the
  picture, and `pacing` also reports the overrun: up to 0.5s is encoder padding, more warns
  (the end card holds longer), and more than both `--max-freeze-s` and `--endcard-s` fails.
  The JSON adds `video.picture_duration` and `pacing.data.picture_end_s` / `audio_overrun_s`.
  A file that cannot be seeked fast (MPEG-TS with one keyframe) is read once from the start.

### Silent-text profile

For a format that is silent by design and made of text beats on a solid colour. The
default profile wrongly fails it: "no audio track", dark text frames or dark beats between
text beats read as black frames, and a first beat held for reading reads as a still
opening. The profile replaces three checks. The blank-beat bounds are fixed (no option
widens them), and `--max-freeze-s` may not exceed 10s here (exit 3), the longest text beat:

| Check | Default profile | `--format-profile silent-text` |
|---|---|---|
| `hook` | sound in the first 1.0s, and an opening that moves | no audio track needed. The first beat must arrive with motion (a still first frame held > 1.5s fails), and the opening may then hold no longer than a planned beat: max(1.5s, `--max-freeze-s`). An audible track, or one of only clicks (typewriter keys), must start in the first 1.0s, counting a track muxed with a delay |
| `dead_air` | silence > 1.0s mid-video fails | not applicable with no audio, an inaudible track (peak below -45 dB) or a track of only clicks (the sheet asks a person to listen). An audible track (a supplied music bed) fails if it drops out > 1.0s or stops > 1.0s before the picture ends, CTA included (`--endcard-s` excuses nothing here, the CTA is a beat), even with `--no-speech` |
| `black_frames` | a dark stretch > 0.3s fails | judges **blank** frames (black, or one flat colour with no text): a blank beat between two text beats may last up to 1.0s; a blank opening or ending keeps the 0.3s limit; all blank beats together stay under 25% of the video; a fully blank video fails |

`pacing` is unchanged, so a frozen picture still fails. Set `--max-freeze-s` to the longest
planned text beat in seconds when one holds longer than 2.5s, never more (CTA excluded, it is
the `--endcard-s` window).
Missing text fails as blank frames on any solid background colour; on a busy or gradient
background, judge it on the sheet. The sheet adds one eye check: every text beat is
complete, spelled as approved and readable. Speech checks (review-ugc-render) do not apply.

`logo` is grayscale correlation with a fine size search, so the right logo scores
0.9+ at any size:

- **Transparent mark** (PNG/SVG wordmark or symbol): matched in either polarity, so a white
  version on a dark card counts. Pass ≥ 0.85, fail < 0.75. Another brand's wordmark scores
  about 0.6-0.7; a same-font near-copy about 0.8 (warn).
- **Opaque logo** (a JPEG, a mascot photo, a square app icon): matched as the whole image.
  Pass ≥ 0.85, fail < 0.70. A different mascot on a similar background scores about 0.5.

Between the two lines it is a `warn`: look at the sheet for a warped, cropped or redrawn
logo.

## Eye checks — read the sheet every time

`finished-ad-sheet.png` shows samples spread across the body plus useful shot midpoints
and the end card, with the
platform UI areas shaded red, and the brand references underneath. Open it and
confirm each line in the verdict's `judge_on_sheet`:

- **Safe zones:** no caption, CTA, price, logo or product name inside a red band
  (top 220px, bottom 400px, right 140px at 1080x1920).
- **Font:** on-screen text uses the brand font shown in the specimen.
- **Product likeness:** every product shot matches the reference product images
  (shape, label, colour). A stand-in, a catalogue image of another product, or a
  mascot is a fail.
- **Product consistency:** the product looks the same in every scene.
- **Logo unaltered:** not stretched, recoloured, cropped or redrawn.

Any of these failing is a FAIL, the same as a machine check.

Continuous formats need early, middle and late coverage even when there are no cuts.
A body of at least 1.5 seconds gets at least six time samples, within the existing
17-body-frame cap. Read the actual timestamps recorded in the result; inspect additional
frames when a fast event or small qualification needs a closer look.

## Fix loop

Fix only the failing window (re-composite the end card, regenerate one shot,
re-time one line), re-render, and re-run this script. Up to **2 repair rounds**.
If it still fails, do not present the video as finished: the caller reports it as
blocked with the failed checks, so the user sees a clear warning.

## Output

`--json` writes `{ verdict, failed[], format_profile, video{width,height,duration,has_audio,cuts,picture_duration?},
checks{<name>: {status, note, data}}, sheet, judge_on_sheet[] }`. Status is one of
`pass`, `fail`, `warn`, `not_applicable`.
