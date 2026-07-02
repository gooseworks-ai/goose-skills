# Verifier — remix-chatgpt-ad-from-sample

Shared logic: `skills/verifiers/video/` (playable + caption-safe checks).

## Automated
- **Playable video:** `working/final.mp4` exists, non-empty, `ffprobe` decodes it, duration within
  ±20% of the source sample's. (Silent by default — do **not** require an audio stream; a missing
  audio track is expected unless the optional subliminal SFX pass was used.)
- **Thumbnail:** `working/final-thumb.jpg` exists, non-empty, decodes.
- **Dimensions:** master is `750×1624` (recorded; tagged/exported 9:16) — no plain/iphone-frame
  variant axis applies.
- **Render row contract:** terminal status `complete`; `output_url` + `thumbnail_url` both match
  `^/api/ads/projects/.+/render-file\?path=working/`; `duration_sec` within 0.5s of ffprobe;
  last `stage` = `export`.
- **Conversation parity:** `working/conversation.json` has the same beat as the source (one
  `user-text` → one `loading-dot` → one streamed `assistant`), `stream: true` on the assistant
  message, and the brand's CTA code present in the assistant `text`.

## Manual (watch the output)
- No source-brand word, product, or code anywhere in the question or the response.
- Keyboard up while typing → slides down on the send-tap beat (one beat: bubble pop + keyboard-down
  + header right-cluster swap); exactly one gray loading dot (~500ms); response streams
  word-by-word with auto-scroll.
- The brand surfaces inside the streamed answer as the natural recommendation — there is **no end
  card** (the answer carries the brand load).
- Track is silent (no Apple chime, no bed) unless the optional subliminal SFX pass was used.
- The conversation would pass as a real ChatGPT screen recording — no marketing register, no
  OpenAI spiral above any assistant title.
