# cut-footage 1.2.0

Cuts the brand's own footage into a video. Free. From footage-cutlist's render (`cut.py`, `filmed.py`) and
compose-creator-layer's split and render-logo-equation-card's compose. Four modes; the default is `split` with a
`layout`, else `band` without `scenes`, which behaves as 1.0.2.

- **band** (1.0.2): `footage[0]` from the plan, the window `start_ms` to `end_ms` (default the whole clip), laid into
  `band` of `video`. `speed: "fill"` (default) plays the window so it fills the video, refused outside `min_speed` to
  `max_speed` (defaults 1x to 8x); a number plays at that speed. `fit` is `cover` (default) or `width`. The video's own
  sound is kept; `audio: true` uses the footage's, sped by the same factor.
- **scenes**: one full-frame beat per plan scene (`width` x `height` at `fps`, default 1080x1920 at 30). A scene plays
  its footage window (matched by `scene_id`, one per scene), else, for the first scene only, the `lead` clip at its own
  length, else its image footage (`kind: "image"`) or `image`, held for `still_seconds`. A window's beat length is its
  own length clamped to `scene_seconds {min, max}`, and the speed that fits it must stay inside `min_speed` to
  `max_speed` (defaults 0.5x to 2x). `transition {dissolve_frames}` dissolves between beats; each beat but the last
  plays that much longer, so the total holds. The cut is silent. Outputs `timeline` (the plan's scene ids at their real
  times) and `windows`.
- **inserts**: `video` is a talking track with its `timeline`. Each scene with a footage entry or an image becomes a
  full-frame insert at that scene's time; the track's sound runs under it. `joins` (a creator step's `takes`): every
  take start after the first must sit under an insert; an insert that ends up to 1 s before a join is stretched to end
  0.15 s after it. Else an insert that starts up to 1 s after a join (a timeline retimed from heard words often moves a
  new take's scene past its join) starts 0.15 s before it, never before 0 s or into the previous insert; its window
  plays slower inside the speed band, or reaches earlier in the recording when that would be too slow (still forward
  only). A join no insert reaches is refused before any work. The timeline is passed through, with `windows`.
  **Grid**: with `grid {layout: "2x2", still_zoom}`, a scene tagged `extra.shot: "grid"` plays its four
  footage entries (that `scene_id`, plan order) as a 2x2 grid: each cell cover-cropped after its `crop` and `mask`; a
  clip from its window start at 1x, or slowed to fill the beat (not below `min_speed`); a picture pushed in by
  `still_zoom` (default 0.04). Grid cells are always plain. Without `grid`, one entry per scene as in 1.1.0.
- **split**: `video` and `timeline` are the talking track. `layout {side, seam, bg, head, zoom, divider, divider_px,
  photo_zoom}` (parts/_lib/panels.mjs): `side` is the creator's zone (`bottom`, the default, puts footage above the
  seam); `seam` is the row the zones meet on, in pixels (`768`) or as a ratio (default `0.4`). Per scene: a footage
  window shows in the footage zone with the creator's same seconds cover-cropped into the creator zone (`head` 0.30,
  `zoom` 1-2); a scene `image` does the same, pushed in by `photo_zoom` (default 0.06, at most 0.15); a scene with
  neither shows the creator full frame. Footage fits `width` by default (the whole picture on `bg`: `auto` = its corner
  colour, `blur`, or `#RRGGBB`); `cover` fills the zone. A split beat runs from its scene's start (0 for the first) to
  the next scene's start, so no creator frame flashes between beats. `divider` draws a bar on the seam during split
  beats. The timeline is passed through with `safe_zones[captions]` set to the creator zone, so captions stay off the
  footage and the seam.
- **Creator looks** (inserts, split): `push_in {min_hold_s, amount}` zooms slowly from 1x to 1 + `amount` (default
  0.05) across every full-frame creator stretch of at least `min_hold_s` (default 3) seconds.
  `first_scene_look` (a declared choice answer): `blur` blurs and darkens the creator under the first scene, fading out
  over its last 0.3 s; `card` covers the first scene with `card_color` (default `#111111`), so the creator is heard,
  not seen; `none` leaves it.
- **Look** (scenes, inserts, split): `plain` fits the footage (`cover`, `width` or `height`); `screen` frames it as a screen
  filmed by a phone (`screen {rot, alternate_rot, keystone, fill, fit, drift, bezel, room, moire, vignette, grain}`,
  parts/_lib/screen-look.mjs). `alternate_rot` turns odd footage beats the other way. A footage entry's `crop` picks
  the source region and its `mask` boxes are blurred in the source first; its `fit` wins over the step's.
- **Refused, in plain words**: a window outside the speed limits or its clip, two beats on the same part of a recording,
  a beat that goes back in its recording (`order: "forward"`, the default; image footage is never checked), a scene with
  no source (scenes), a footage entry naming a scene not in the plan or a second entry for one scene, overlapping
  inserts, a take join no insert covers, a grid scene without exactly four entries, a grid cell too short to fill its
  beat, two grid cells on the same seconds, a seam outside the frame or making an odd panel, and inputs the chosen mode
  does not use.
- **Size**: every final encode caps its bitrate at 16 Mb/s, and a finished file over 180 MB fails as `output_invalid`
  before upload.

Source: `parts/cut-footage/src/part.mjs`, `src/plan.mjs` and `src/manifest.mjs`.
