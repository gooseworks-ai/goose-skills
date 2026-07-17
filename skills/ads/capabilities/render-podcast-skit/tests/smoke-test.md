# Smoke Test

Given the per-line lipsync clips (one per script line), the character stills, the karaoke
timing from the VO's char-level timestamps, and the brand's real wordmark,
`render-podcast-skit` assembles the master: concat the line clips in script order, burn the
karaoke captions, composite the end card, mux → 1080×1920 h264+aac.

Pass when the assembly runs to a valid MP4 and:
- the dialogue lines play in script order with the two hosts alternating;
- captions are the yellow karaoke build offset by each clip's cumulative start (tracking the
  spoken word), not Whisper-derived;
- speakers' mouths are closed when not speaking (carried from the source clips);
- the end card is composited from the real brand wordmark (no AI-rendered brand text);
- **no paid call is made** — the VO, stills, and lipsync clips come from the paid capabilities
  (create-vo-elevenlabs / create-image-fal); this assembly is $0 and a re-cut reuses the
  existing assets.
