# Verifier — remix-imessage-ad-from-sample

Shared logic: `skills/verifiers/video/` (playable + caption-safe checks).

## Automated
- **Playable video:** `working/final.mp4` exists, non-empty, `ffprobe` decodes it, has an audio
  stream, duration within ±20% of the source sample's.
- **Thumbnail:** `working/final-thumb.jpg` exists, non-empty, decodes.
- **Render row contract:** terminal status `complete`; `output_url` + `thumbnail_url` both match
  `^/api/ads/projects/.+/render-file\?path=working/`; `duration_sec` within 0.5s of ffprobe;
  last `stage` = `export`.
- **Thread parity:** `working/thread.json` bubble count within ±1 of the source's, sender
  sequence identical, `end_card.code` equals the brand's CTA code.

## Manual (watch the output)
- No source-brand word, product, or code anywhere (bubbles, attachment, end card).
- SFX lands on every send/receive; composer typing visible before driven sends.
- End card wordmark is the brand's real asset, not styled text.
- The conversation would pass as a real screenshot — no marketing register.
