# Verifier — create-imessage-video-ad

## Automated checks

Use `skills/verifiers/video/` for video assertions and `skills/verifiers/audio/` for
audio/loudness assertions. Apply the following at the master MP4 level.

1. `edits/master-final.mp4` exists and ffprobe parses it without warnings.
2. Master resolution is 720×1280 source (and exported variants are 1080×1920 and 720×720).
3. Master duration is in the 17–25 second range.
4. Audio stream is present, stereo or mono, AAC, peak at or below 0dBFS and within
   -1.0dB of 0dBFS at its loudest moment (i.e. the master is properly normalized).
5. `master-chat.sfx.json` exists and every cue references a timeline event whose
   `kind` is NOT `typing-pop` (no SFX on typing indicators — see SKILL #2).
6. `threads/full-thread.json` parses and matches the schema in `atoms/messaging/render-ios-lockscreen` (or the equivalent).
7. Only ONE cut boundary detected inside the master (chat → end-card crossfade); the
   chat portion is one continuous recording, verified by scene-detection ffmpeg filter.
8. CTA code text (e.g. `FREEPACK`) appears at least once inside the chat segment with
   the link-detector underline style applied.
