# Smoke Test

Given the spoken expert VO (mp3 + `words-flat.json` word timings), N authored web-animated hyperframe
beats in ONE design system, periodic color-graded B-roll windows, a low music bed, and the brand
wordmark SVG, `render-vo-anchored-motion-listicle` assembles the master: render each beat
frame-by-frame via Playwright (all beats fps 25), concat the beats + B-roll, burn window-masked
captions, mix the VO under the low music bed, composite → 1080×1920 h264 crf18 + aac 192k (~66s).

Pass when the assembly runs to a valid MP4 and:
- every beat reveal is anchored to the VO's word-level timestamps; the ONE design system holds across
  every beat (tiles alternate; numerals / body / accents / pills consistent);
- all beats and B-roll windows share fps 25 (no concat-seam stutter);
- captions appear ONLY inside the B-roll windows (2-word chunks, no dropped cues — the ASS `Format:`
  header carries a `Name` field), never over the motion-graphic beats;
- the VO carries the listicle under a low music bed (~0.18); the CTA / end beat shows the real
  wordmark (never AI-rendered text);
- there is NO lipsync / talking head in the master (the still headshot is a future-variant input, not
  used here);
- **no paid call is made** — the VO, the music bed, and the stock B-roll come from the paid/metered
  capabilities (create-vo-elevenlabs / create-music-elevenlabs / media-proxy); this assembly is $0 and
  a re-cut reuses the existing VO / beats / B-roll.
