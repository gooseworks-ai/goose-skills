# cut-footage 1.0.1

Lays a window of the brand's own footage into a band of a video. Free. From render-logo-equation-card's
compose (the b-roll under the card) and footage-cutlist's render.

- **Footage**: `footage[0]` from the plan, its clip as a file (`file`, or `video`), the window `start_ms` to `end_ms` (default the
  whole clip). Never generated footage: the style asks for the brand's own.
- **Speed**: `fill` (default) plays the window so it fills the video exactly; a speed outside `min_speed` to
  `max_speed` is refused with a plain message (logo-equation-card: 3x to 8x, a timelapse, never real time). A
  number plays at that speed and refuses a window too short for the video.
- **Fit**: `cover` (default) fills the band; `width` fits by width, black above and below.
- **Picture**: the video everywhere outside the band; the footage only inside it.
- **Sound**: the video's own sound is kept; `audio: true` uses the footage's instead (sped up to at most 2x).
- **Outputs**: `video`, `seconds`, `speed`.
- **From the plan**: each `plan.footage` entry carries its clip as `file` (a file the kit downloads and checks).

Source: `parts/cut-footage/src/part.mjs` and `src/manifest.mjs`.
