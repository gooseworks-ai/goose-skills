# Smoke Test

Given the per-line lipsync clips (one per script line), the character stills, the caption
timing from the VO's char-level timestamps, and the brand's real wordmark,
`render-podcast-skit` assembles the master: concat the line clips in script order, render the
WHITE captions, composite the end card, final-encode crf28 → 1080×1920 h264+aac.

Pass when the assembly runs to a valid MP4 and:
- the dialogue lines play in script order with the two hosts alternating;
- captions are WHITE, ≤5 words per cue (broken on sentence punctuation), word-wrapped to stay
  in-frame, held ≥0.9s, offset by each clip's cumulative start (tracking the spoken word), not
  Whisper-derived;
- speakers' mouths are closed when not speaking (carried from the source clips);
- the end card is composited from the real brand wordmark (no AI-rendered brand text);
- **no paid call is made** — the VO, stills, and lipsync clips come from the paid capabilities
  (create-vo-elevenlabs / create-image-gpt-image-fal / create-video-fal); this assembly is $0 and a
  re-cut reuses the existing assets.
