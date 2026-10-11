# video-veo-3 1.0.0

Moves stills with Google Veo 3 / 3.1 image-to-video on fal: short silent clips, one paid piece per clip.

- **Models** (`model`, required). All four make **4, 6 or 8 s** clips, sent as `"4s"`, `"6s"`, `"8s"`, and take `image_url`:
  - `fal-ai/veo3.1/image-to-video`: the choice for people (skin and fabric hold). List price USD 0.40 / s.
  - `fal-ai/veo3.1/fast/image-to-video`: USD 0.15 / s.
  - `fal-ai/veo3/image-to-video`: USD 0.40 / s.
  - `fal-ai/veo3/fast/image-to-video`: USD 0.15 / s.
- **Always silent**: every request sends `generate_audio: false` (fal's default is true). The input accepts only `false`.
- **`resolution`**: `720p` or `1080p` (default `1080p`). 4k is not offered. **`aspect_ratio`**: `auto`, `9:16` or `16:9`; left to the model (auto) when not given. Veo crops a still that is neither 9:16 nor 16:9.
- **Modes**:
  - `scenes` (default when `scenes` is given): one clip per picked plan scene (`pick`, `skip_first`, `skip_last`). Its still is the `stills` entry with the scene's id (`step.<stills>.images`). A picked scene with no still refuses the step before anything is ordered.
  - `images`: one clip per still (`step.<stills>.images` or `.anchors`), id = the still's id. The prompt is filled for the plan scene with that id, if any.
- **Clip length**:
  - With `spans` (`step.<voice>.scenes` or `step.<song>.scenes`): each scene's time on screen, cut the way assemble 1.1.0 cuts it (a scene with no line shares the scene before it), plus 0.2 s, rounded up to 4, 6 or 8 s and kept inside `min_s`..`max_s`. A scene longer than `max_s` gets the longest clip; assemble holds its last frame. Short cuts still cost a whole 4 s clip.
  - Without spans: `seconds` (default 4), rounded up to 4, 6 or 8 s. A length Veo cannot reach is refused.
  - **`max_total_s`**: a price guard. The step is refused, before anything is ordered, when its clips together come to more seconds than this.
- **Prompt**: the style's `template` (a `frames/*.prompt.json`, version 1): its `motion` text (per `by_tag` rule too), or the `templates` key named by `use`. Without a motion text the prompt is the scene's picture plus a verb-led handheld line. A placeholder the plan cannot fill, or a phrase in the template's `banned` list, refuses the step before anything is ordered. `negative_prompt` wins over the template's `negative`.
- **Still-shot words** (`static_words`, default `refuse`): Veo often answers a prompt worded as a still shot with no video (about a third of clips in the wardrobe-stitch run). A filled prompt with *remain(s), stay(s), rests, unchanged, steady, holds, subtle, slow, gentle, smooth* (and their -ly forms), *static* or *motionless* refuses the step before anything is ordered. Write one action verb instead ("she brushes her hair back", "the camera drifts in a small arc"). `allow` turns the check off.
- **`seed`**: each clip gets `seed + its scene's index`, so neighbouring scenes never share a seed (two cuts from one still then still differ). Without it the model picks.
- **Scene fields** `line`, `on_screen` and `picture` may be `null`.
- **`keep {seconds, anchor: start | end}`**: keeps only that much of every clip (re-encoded, no sound).
- **`fallback`**: `fail` (default) or `still`. With `still`, a clip the provider refuses (`provider_rejected`) becomes `{id, image, seconds}` with its still; a plain failure or timeout does so only on the step's last attempt, so the core's retry runs first.
- **Pieces**: `clip-<scene id>` (`kitPieceName`), so a fix remakes only the scenes it changes. Up to 4 clips are made at once.
- **Outputs**: `clips: [{id, video | image, seconds}]` for `assemble`, and `video` (the first clip's video, absent when it fell back to its still).
- **Cost**: `rates_usd` are fal's list prices per second (documentation; the line prices each piece from fal's live list). At 0.40 USD / s, 18 scenes of 4 s cost about USD 28.80 and 30 scenes about USD 48; the fast models cost USD 0.15 / s.

Source: `parts/video-veo-3/src/part.mjs`, `src/manifest.mjs` and `parts/_lib/scene-clips.mjs`.
