---
name: compose-creator-layer
description: Composite a generated creator track into a product layer, per beat — in the creator's zone on split beats (either side of a seam), full frame on creator beats, hidden on product beats — with the creator's voice as the audio (loudness -14 LUFS) and an optional ducked music bed, or a music-only or silent master for voiceless formats. Free, local ffmpeg. Pairs with footage-cutlist (the layer) and create-creator-takes-h3 (the creator). Use for split-screen (with an optional zoom and brand-colour seam bar), screen-insert and any creator-over-product format.
status: active
---

# compose-creator-layer

## Run

```bash
python compose.py --layer layer.mp4 --beats cutlist.aligned.json --creator creator.mp4 \
    --out reel.mp4 [--music bed.mp3 --music-db -20] [--head 0.30] \
    [--zoom 1.15] [--divider '#RRGGBB' --divider-px 4]
```

- `--layer`: `footage-cutlist` `cut.py` output rendered from the **same** cut list as
  `--beats` (re-render it after `align_beats.py`). `--draft` layers are refused.
- `--creator`: `create-creator-takes-h3` `join_takes.py` output, reel time from 0.
- `--audio creator|music|none`: the voice (+ ducked `--music`), the `--music` bed alone
  (voiceless paid ads), or a silent master (organic posts: the track is added in-platform
  at upload, which is licensed for organic use only).
- The creator track may be shorter than the reel (a 2.3s reaction hook): it only shows
  during its own `creator` beats.
- `--head`: where the crop sits vertically when the creator is scaled to cover an area
  (0 keeps the top, 0.5 centres). 0.30 keeps the head in the upper third.

## Split screen

The split-screen creator look (product on top, the creator talking below) is this atom with
split beats; it replaces render-split-screen-creator.

- **The product zone** comes from the layer: in the footage-cutlist cut list set the `seam`
  (even, about 52% of the height for product on top) and `creator_side: "bottom"`, fit each 16:9
  product clip by `width`, and set `bg: "blur"` so the margins are a darkened blur of the same
  clip, never black bars. Window each clip to the moment that proves its line; never loop a
  short clip.
- **The creator zone:** `--zoom 1.15` to `1.2` with `--head` pushes a webcam-distance take in to
  head and shoulders. Tune it by eye against the reference; a re-run is free. Zoom cannot rescue
  a take shot too close, so the creator still should be a candid medium shot (chest up, real
  room), not a plain-background headshot.
- **The seam:** `--divider '#RRGGBB'` draws a brand-colour bar centred on the seam (default 4 px,
  even) on split beats only.
- **Audio:** the creator's voice is the whole bed; leave out `--music` for this look.

## Rules

1. **Crop from the take's real size**, never a hard-coded height. A hard-coded 1080 once
   cropped the top half of an upscaled take and blew it up.
2. **No grade.** Chasing a saturation or warmth reading was tried twice and both looked
   wrong. The take goes in as generated.
3. **The voice leads.** A music bed is ducked under the voice (sidechain); the mix is
   normalised to -14 LUFS.
4. **Captions come after this** (`caption-burn`, transcribed from this output).
