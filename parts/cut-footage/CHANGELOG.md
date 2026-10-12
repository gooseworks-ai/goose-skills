# cut-footage

## 1.2.0

- `mode: "split"` (the default with a `layout`): the talking track with each scene's footage window, or its image pushed in by `layout.photo_zoom`, in one zone and the creator cover-cropped (`head`, `zoom`) into the other, via `_lib/panels.mjs`; a scene with neither shows the creator full frame. `layout {side, seam, bg: auto | blur | #hex, head, zoom, divider, divider_px, photo_zoom}`. Split beats tile to the next scene's start. The output timeline's `safe_zones[captions]` is the creator zone.
- `grid {layout: "2x2", still_zoom}` (inserts): a scene tagged `extra.shot: "grid"` plays its four footage entries as a 2x2 grid; clips at 1x or slowed to fill, pictures pushed in; cells join the reuse and order checks.
- `push_in {min_hold_s, amount}` (inserts, split): a slow push-in on every full-frame creator stretch of at least `min_hold_s`.
- `first_scene_look: blur | card | none` (inserts, split) with `card_color`: the hook treatment on the first scene.
- `screen` declares screen-look's keys and ranges in the schema, so a bad style constant is refused when the style is checked, not at run time.
- scenes mode: a beat that dissolves into the next reads only its planned window and holds its last frame through the fade, so no recording past `end_ms` shows.
- `footage` may be an empty list (split and scenes can run without it); band mode refuses an empty list in plain words.
- Without any of these, inserts render as 1.1.0 and the other modes are unchanged. Inserts (and grid inserts) carry 1.1.0's take-join rule, including the early start: an insert starting up to 1 s after a join starts 0.15 s before it.

## 1.1.0

- `mode: "scenes"`: one full-frame beat per plan scene. A scene plays its footage window (matched by `scene_id`), else (scene 1 only) the `lead` clip, else its image footage or image held still. Windows are sped to fit `scene_seconds` within `min_speed` to `max_speed` (0.5x to 2x by default); `transition.dissolve_frames` dissolves between beats with the total length kept. Outputs `timeline` with the plan's scene ids and `windows`.
- `mode: "inserts"`: full-frame inserts over a talking track at its scenes' times, its sound kept. `joins` (a creator step's takes): every take join must sit under an insert; an insert ending up to 1 s before one is stretched to end 0.15 s after it; else an insert starting up to 1 s after one (a timeline retimed from heard words) starts 0.15 s before it, never before 0 s or into the previous insert, its window slowed inside the speed band or reaching earlier in the recording; else the plan is refused before any work.
- `look: "screen"`: the filmed-screen look from `_lib/screen-look.mjs` (rotation, keystone, fill, fit, drift, bezel, room). Footage entries take `crop`, `mask` boxes (blurred in the source) and their own `fit`.
- `footage` takes up to 20 entries, and image files for `kind: "image"` (critic #15). Windows must move forward through a recording and never reuse a part of it (`order`).
- Every final encode caps its bitrate at 16 Mb/s, and a finished file over 180 MB fails as `output_invalid` before upload (§4.12).
- Without `scenes` the part runs `band` mode, the 1.0.2 behaviour.

## 1.0.2

- `audio: true` keeps the footage's sound in step above 2x: atempo steps are chained so their product is the speed (1.0.1 capped it at 2x, so 4x footage played its sound at half speed). The sound is named stereo for the AAC encode.
- A streaming WebM or Matroska clip with no container length is measured from its streams or packets instead of being refused; one ffprobe reports as cut off or damaged is refused, never measured short.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version: a sped window of plan footage laid into a band, for logo-equation-card.
