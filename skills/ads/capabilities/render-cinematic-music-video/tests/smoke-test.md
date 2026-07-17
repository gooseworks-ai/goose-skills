# Smoke Test

Given the generated anthem (mp3 + word timestamps), one 35mm-look keyframe + one i2v clip per
tableau, and the anthem's word timings, `render-cinematic-music-video` assembles the master:
cut each clip to its beat window, hard-cut on the beat, build cinematic lower-third captions,
mux the anthem → 1080×1920 h264+aac (~28s).

Pass when the assembly runs to a valid MP4 and:
- clips are cut to their beat windows and hard-cut on the beat (bar the hero match-cut);
- the one 35mm-film look pack holds across all N tableaux (a 3-act arc, live-action register);
- captions are cinematic serif lower-thirds synced to the anthem's own word timings;
- the sung anthem carries with no separate VO, loudnormed to −14 LUFS;
- **no paid call is made** — the anthem, keyframes, and clips come from the paid capabilities
  (create-music-elevenlabs / create-image-gpt-image-fal / create-video-fal); this assembly is $0
  and a re-cut reuses the existing assets.
