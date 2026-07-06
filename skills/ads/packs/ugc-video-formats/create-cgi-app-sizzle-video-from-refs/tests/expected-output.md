# Expected Output

## Artifacts
- `master-final.mp4` — 1080×1920, ≈22.6s, **H.264** (+ aac music). 6 feature beats + a PIL
  brand end card, concatenated then sped **1.15x** with an anti-AI grain pass.
- `keyframes/scene-NN-plate.png` — the nano_banana_2 CGI plates (blank-glow floating phone +
  placeholder burst-out shapes, anchored on beat 1).
- `keyframes/scene-NN-composite.png` — the PIL composites (real App Store screenshot on the bezel).
- `keyframes/scene-06-burst-climax.png` — the climax plate with real portrait tiles baked in.
- `keyframes/end-card.png` — the deterministic PIL end card (smoky-black + amaranth bar + wordmark + tagline).
- `clips/*.mp4` — the per-beat Kling float clips and/or Ken-Burns fallback push-ins.
- `voiceovers/*.mp3` — the 6 measured Eryn cues. `audio/` — music bed + ducked master mix.
- A poster still (the climax hero frame).

## Visual shape (per beat)
- A gold-trimmed phone floats center-frame in a smoky-black studio (`#0A0A0A`) with amaranth
  (`#E32652`) rim-light from upper-left and warm bokeh.
- Real App Store UI is composited onto the phone screen; the beat's burst-out elements
  (portraits / cards / tile+pills / orbiting devices / glass icons) pop out in 3D and settle.
- Hard cut to the next feature. The phone and its screen stay locked; the studio is identical across beats.

## Climax + close + audio
- Beat 6: all prior floating elements collapse back into the screen on "…One app.";
  amaranth rim intensifies, bokeh thickens (VO +2dB).
- PIL brand end card — amaranth bar + wordmark + "Learn from the best." tagline — ~3s static, captions suppressed.
- Single Eryn spec-sheet VO locked to the measured audio; premium-tech instrumental bed, ducked under VO;
  restrained white-sans line-by-line captions (no karaoke pills).

## Non-goals
- No talking head, no lipsync, no recurring humans.
- **No AI-rendered UI or faces** — every screen + instructor face is the real App Store screenshot (PIL).
- No AI-rendered wordmark — PIL composite. No invented app claims.
- No dissolves; no camera move within a beat; no phone/screen animation.
