# lipsync-veed 1.0.0

**Quality tier (custom videos, 16 Oct 2026).** The customer picks Standard or Best at script approval, and the kit passes it as `quality_tier` (`standard`, the default, or `best`). It sets this part's default resolution: 480p for Standard, 720p for Best. An explicit `resolution` still wins for the whole step. The kit has no per-shot upgrades: a custom video's one-shot upgrades go through the server's per-call check instead. 1.0.0 always defaulted to 720p.

Approved audio drives a face. Each spoken line's own audio is lipsynced onto its speaker's still with Veed
Fabric 1.0 on fal. From create-lipsync-veed-fal and the podcast skit's `gen_paid.py` clips and idle steps.

- **Scenes** (`scenes`, from `plan.scenes`): a scene with a non-empty `line` is lipsynced; a null or empty
  line is skipped and leaves no clip. `speaker` names a key in `faces`; it may be left out only when there
  is exactly one face. Other scene fields are ignored.
- **Audio** (`lines`, from the voice step's `lines`): `[{scene_id, audio}]`, matched to scenes by id (a
  scene without an id is `"<position>"`, as in voice-elevenlabs). Lines for unspoken scenes are ignored.
- **Faces** (`faces`, from cast-plate's `singles`): `[{key, image}]`, one neutral, closed-mouth,
  head-and-shoulders still per speaker.
- **Idle clips** (`idle_seconds`, default 0 = none): each face is also driven by that many seconds of
  silence (a bit-exact silent WAV). The mouth stays shut and the head and eyes keep moving: the "listening"
  clip a split screen loops under the other speaker.
- **Refused before anything is ordered**: a spoken scene whose speaker has no face, or that has no audio;
  two faces with one key; two lines for one scene; nothing to do; and line audio plus idle clips longer
  than `max_seconds`.
- **Paid pieces**, through the private line only: fal `veed/fabric-1.0` with
  `{image_url: face, audio_url: line audio, resolution}` (the tier's: `480p` for Standard, the default, `720p` for Best). One piece per
  spoken line, named `clip-<scene id>`, and one per face for idle, named `idle-<key>`, so a fix can reuse
  the lines it did not change. The model reply is `{video: {url}}`; the part reads `/json/video/url`.
- **Checked on return**: a clip with no picture, or one more than 0.5 s (or 20%) away from its audio's
  length, fails as `provider_failed`. Veed's usual few milliseconds short is fine: the cut step fits each
  clip to its span.
- **Price**: `max_seconds` (a plain number in the style). Fal bills per second of output, which is the
  audio's length. Cost basis: USD 0.15 per second, the 720p rate (480p is 0.08).
- **Outputs**: `clips [{id, video, seconds}]` by scene id, and `idle [{key, video, seconds}]` by face key
  (empty when `idle_seconds` is 0). Each clip carries Veed's audio track; `seconds` is the clip's measured
  length.

Source: `parts/lipsync-veed/src/part.mjs` and `src/manifest.mjs`.
