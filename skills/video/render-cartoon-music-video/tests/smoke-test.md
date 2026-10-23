# Smoke Test

Given the sung song (mp3 + bar grid + word timings), one animated/craft keyframe + one i2v clip
per bar with ONE recurring locked character, and the persistent logo bug,
`render-cartoon-music-video` assembles the master: cut each clip to its bar, hard-cut on the
bar, burn big-serif captions, overlay the logo bug, close on a solid-brand-color end card, mux
the song → 1080×1920 h264+aac (~55s).

Pass when the assembly runs to a valid MP4 and:
- one shot per bar, hard-cut on the bar (no crossfades); the ONE locked character holds across
  every tableau;
- captions are big-serif re-spelled against the locked lyrics (no pill), the logo bug persists;
- the end card is a solid brand-color card, song carrying under it with an afade tail (no silent tail);
- the sung song is the entire script — no separate VO;
- **no paid call is made** — the song, keyframes, and clips come from the paid capabilities
  (create-music-elevenlabs / create-image-fal / create-video-fal); this assembly is $0 and a
  re-cut reuses the existing assets.
