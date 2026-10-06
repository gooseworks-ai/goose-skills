---
name: review-finished-ad
description: Final QC gate for a rendered 9:16 video ad, run before it is published. One script checks what a machine can decide — exact 1080x1920 size, a hook that moves and speaks in the first second, no frozen stretches, no dead air, no black frames, the brand's real logo on the end card (never a favicon, never a redrawn or wrong logo), end-card colours near the brand palette — and builds one contact sheet (frames with the TikTok/Reels UI safe zones shaded, beside the logo, product images and a font specimen) for the checks that need eyes — font, product likeness, product consistency across scenes, safe zones. Exit 0 PASS / 2 FAIL / 3 ERROR. Use on every finished video master before pinning it.
---

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
| `pacing` | the picture is frozen for > 2.5s before the end card | add motion (push-in, b-roll, a cut) or trim the hold |
| `dead_air` | silence > 1.0s mid-video (skipped with `--no-speech`) | tighten the VO timing or run the music bed under the gap |
| `black_frames` | a black stretch > 0.3s | fix the concat / transition |
| `logo_asset` | the logo file is favicon-sized (long side < 256px, or under 40,000 px²) | do not upscale it: ask for a real logo, or set the wordmark as text in the brand font (then drop `--logo`) |
| `logo` | the kit logo is not found on the end card (below the fail line for its mode) | composite the uploaded logo file onto the end card; never regenerate or retype it |
| `palette` | *(warn only)* no kit colour among the end card's main colours | use a kit colour for the end-card background or text |

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

`--json` writes `{ verdict, failed[], video{width,height,duration,has_audio,cuts},
checks{<name>: {status, note, data}}, sheet, judge_on_sheet[] }`. Status is one of
`pass`, `fail`, `warn`, `not_applicable`.
