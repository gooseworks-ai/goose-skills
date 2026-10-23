# Smoke Test

Given the clipped REAL podcast audio, one 2-tone editorial keyframe per beat, the audio word
timings, and the brand's real wordmark, `render-editorial-motion-podcast` assembles the
master: ffmpeg ken-burns each keyframe to its beat window, hard-concat on the beat, burn
frosted-subtle captions, composite the PIL end card, mux the real audio → 1080×1920 h264+aac
(~40s).

Pass when the assembly runs to a valid MP4 and:
- motion is DETERMINISTIC ffmpeg ken-burns only (NO generative i2v — it breaks the 2-tone look);
- each payoff visual starts within ~0.5s of its spoken line; beats hard-cut (no crossfades);
- the one look pack + strict 2-tone palette hold across all beats (no leaked color or text);
- captions are ON only mid-sentence; the end card is composited via PIL from the real wordmark
  (no AI-rendered brand text);
- the REAL podcast audio carries with no generated song and no VO;
- **no paid call is made** — the keyframes come from the paid capability (create-image-fal); this
  assembly is $0 and a re-cut reuses the existing audio/keyframes.
