# Smoke Test

Given the 18s music (mp3 + beat grid), one per-shot still + one i2v dance clip per shot with ONE
recurring locked creator, the 7 narrative-beat text lines, and the brand end-card PNG,
`render-voiceless-ugc-dance-story` assembles the master: build the overlay PNGs, cut each clip to its
beat window, hard-cut on the beat, apply the time-gated overlays, close on the brand end card, mux
the music → 1080×1920 h264+aac (18.0s).

Pass when the assembly runs to a valid MP4 and:
- one shot per beat window, hard-cut on the beat (no crossfades); the ONE locked creator + wardrobe
  holds across every shot;
- the 7 text overlays are burned upper-third in the 88% safe area (bold white, no pill), popping
  on/off on the beat — and there are NO auto-captions (the overlays ARE the copy);
- the brand-accent green progress bar fills on the s06 proof overlay; the `Results vary.` disclaimer
  sits on the CTA overlay;
- the brand end card holds ~2.5s with the music settling and fading under it (afade tail — no abrupt
  cut, no silent tail);
- the music is the entire audio bed — no separate VO;
- the pipeline is naturally libass-free (the overlays are PNGs composited via
  `overlay=…:enable='between(t,st,en)'`, so no `subtitles`/`drawtext` filter is needed);
- **no paid call is made** — the music, creator, stills, and clips come from the paid capabilities
  (create-music-elevenlabs / create-image-gpt-image-fal / create-image-fal / create-video-fal); this
  assembly is $0 and a re-cut reuses the existing assets.
