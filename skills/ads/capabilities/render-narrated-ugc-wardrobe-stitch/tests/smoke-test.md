# Smoke Test

Given the spoken VO (mp3 + Whisper word timings), a ~30-cut role-tagged EDL built from those word
boundaries, one i2v clip per cut (ONE recurring locked creator across ~5 wardrobes in ~3 worlds,
plus product B-roll), a Playwright landing-page PNG, and the brand end-card PNG,
`render-narrated-ugc-wardrobe-stitch` assembles the master: trim each clip to its EDL window,
hard-concat on the VO cadence via `filter_complex concat`, burn karaoke-pop captions, mix the VO
over the ducked bed, close on the brand end-card PNG → 1080×1920 h264+aac (~37s).

Use any creator / worlds / hook / music (the recipe's `choices`) — the test must not depend on the
Bioma demo's blonde woman, bedroom / kitchen / bathroom, or "Do not buy" hook.

Pass when the assembly runs to a valid MP4 and:
- one shot per EDL cut, hard-cut on the VO cadence via `filter_complex concat` (no crossfades, no
  demuxer — the demuxer drops audio on a duration mismatch); the ONE locked creator holds across
  all ~5 wardrobes;
- the payoff line lands on the held `payoff-hold` beat;
- captions are karaoke-pop on every word, throughout, re-spelled against the locked script
  (any brand token Whisper mishears), suppressed over the end card;
- the product B-roll reads — product macro, unboxing, and a landing-page scroll rendered as FFmpeg
  zoompan over the Playwright PNG (not i2v);
- the VO plays clearly on top of the sidechain-ducked bed from `audio_mix.music_brief` (−20dB, 20:1),
  or alone when the user chose no music — VO not buried;
- the end card is the brand's real PNG (never AI-rendered text), song/VO carrying to the tail with
  no silent tail;
- **no paid call is made** — the VO, creator, start-frames, and clips come from the paid
  capabilities (create-vo-elevenlabs / create-image-gpt-image-fal / create-image-fal /
  create-video-fal); this assembly is $0 and a re-cut reuses the existing assets.

Free check of the assembler itself (no keys, no paid assets): the shared helper installs with this
package, and its fixture test cuts synthetic clips through the same EDL → concat → captions → ducked
mix path and checks length, format, caption frames and ducking:

```bash
python3 -m pytest -q /tmp/gooseworks-scripts/stitch-videos-ffmpeg/tests   # needs ffmpeg + pytest (+ pillow)
```
