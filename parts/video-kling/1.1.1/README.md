# video-kling 1.1.1

**Kling 2.5 Turbo is withdrawn in this version.** It is not in the model list, so it can no longer be ordered through 1.1.0. For creator B-roll use `video-h3max` stills mode (native audio muted, nobody speaks); for product-only motion use `video-seedance-2`. Version 1.0.0 still lists it; move styles off 1.0.0.

Moves stills with Kling image-to-video on fal: short silent clips, one paid piece per clip.

- **Models** (`model`, required):
  - `fal-ai/kling-video/v2.1/standard/image-to-video`: 5 or 10 s, `image_url`. List price USD 0.056 / s.
  - `fal-ai/kling-video/v3/standard/image-to-video`: 3 to 15 s, `start_image_url`, always sent `generate_audio: false`. USD 0.14 / s.
  - `duration` goes as a string ("5"), as fal's schema asks.
- **Modes**:
  - `scenes` (default when `scenes` is given): one clip per picked plan scene (`pick`, `skip_first`, `skip_last`). Its still is the `stills` entry with the scene's id (`step.<stills>.images`). A picked scene with no still refuses the step before anything is ordered.
  - `images`: one clip per still (`step.<stills>.images` or `.anchors`), id = the still's id. The prompt is filled for the plan scene with that id, if any.
- **Clip length**:
  - With `spans` (`step.<voice>.scenes` or `step.<song>.scenes`): each scene's time on screen, cut the way assemble 1.1.0 cuts it (a scene with no line shares the scene before it), plus 0.2 s, rounded up to a length the model makes and kept inside `min_s`..`max_s`. A scene longer than `max_s` gets the longest clip; assemble holds its last frame.
  - Without spans: `seconds` (default 5), rounded up to a length the model makes. A length the model cannot reach is refused.
- **Prompt**: the style's `template` (a `frames/*.prompt.json`, version 1): its `motion` text, or the `templates` key named by `use` (for example `hook`). Without a motion text the prompt is the scene's picture plus a steady-camera motion line. A placeholder the plan cannot fill refuses the step before anything is ordered. `negative_prompt` wins over the template's `negative`. Prompts are at most 2,500 characters.
- **Scene fields** `line`, `on_screen` and `picture` may be `null`.
- **`keep {seconds, anchor: start | end}`**: keeps only that much of every clip (re-encoded, no sound), for example the last 2.3 s of a 5 s reaction.
- **`fallback`**: `fail` (default) or `still`. With `still`, a clip the provider refuses (`provider_rejected`) becomes `{id, image, seconds}` with its still; a plain failure or timeout does so only on the step's last attempt, so the core's retry runs first.
- **Pieces**: `clip-<scene id>` (`kitPieceName`), so a fix remakes only the scenes it changes. Up to 4 clips are made at once.
- **Outputs**: `clips: [{id, video | image, seconds}]` for `assemble`, and `video` (the first clip's video, absent when it fell back to its still).
- **Cost**: `rates_usd` are fal's list prices per second (documentation; the line prices each piece from fal's live list).

Source: `parts/video-kling/src/part.mjs`, `src/manifest.mjs` and `parts/_lib/scene-clips.mjs`.
