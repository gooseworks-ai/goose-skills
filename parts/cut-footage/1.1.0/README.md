# cut-footage 1.1.0

Cuts the brand's own footage into a video. Free. From footage-cutlist's render (`cut.py`, `filmed.py`) and
render-logo-equation-card's compose. Three modes; the default without `scenes` is `band`, which behaves as 1.0.2.

- **band** (1.0.2): `footage[0]` from the plan, the window `start_ms` to `end_ms` (default the whole clip), laid into
  `band` of `video`. `speed: "fill"` (default) plays the window so it fills the video, refused outside `min_speed` to
  `max_speed` (defaults 1x to 8x); a number plays at that speed. `fit` is `cover` (default) or `width`. The video's own
  sound is kept; `audio: true` uses the footage's, sped by the same factor.
- **scenes**: one full-frame beat per plan scene (`width` x `height` at `fps`, default 1080x1920 at 30). A scene plays
  its footage entry (matched by `scene_id`, one per scene), else its `image` (or image footage, `kind: "image"`) held
  for `still_seconds`, else, for the first scene only, the `lead` clip at its own length. A window's beat length is its
  own length clamped to `scene_seconds {min, max}`, and the speed that fits it must stay inside `min_speed` to
  `max_speed` (defaults 0.5x to 2x). `transition {dissolve_frames}` dissolves between beats; each beat but the last
  plays that much longer, so the total holds. The cut is silent. Outputs `timeline` (the plan's scene ids at their real
  times) and `windows`.
- **inserts**: `video` is a talking track with its `timeline`. Each scene with a footage entry or an image becomes a
  full-frame insert at that scene's time; the track's sound runs under it. `joins` (a creator step's `takes`): every
  take start after the first must sit under an insert; an insert that ends up to 1 s before a join is stretched to end
  0.15 s after it, and a join no insert reaches is refused before any work. The timeline is passed through, with
  `windows`.
- **Look** (scenes, inserts): `plain` fits the footage (`cover`, `width` or `height`); `screen` frames it as a screen
  filmed by a phone (`screen {rot, alternate_rot, keystone, fill, fit, drift, bezel, room, moire, vignette, grain}`,
  parts/_lib/screen-look.mjs). `alternate_rot` turns odd footage beats the other way. A footage entry's `crop` picks
  the source region and its `mask` boxes are blurred in the source first; its `fit` wins over the step's.
- **Refused, in plain words**: a window outside the speed limits or its clip, two beats on the same part of a recording,
  a beat that goes back in its recording (`order: "forward"`, the default; image footage is never checked), a scene with
  no source (scenes), a footage entry naming a scene not in the plan or a second entry for one scene, overlapping
  inserts, a take join no insert covers, and inputs the chosen mode does not use.
- **Size**: every final encode caps its bitrate at 16 Mb/s; a video that could pass 180 MB is refused before the work,
  and a finished file over 180 MB fails as `output_invalid` before upload.

Source: `parts/cut-footage/src/part.mjs`, `src/plan.mjs` and `src/manifest.mjs`.
