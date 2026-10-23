# Smoke Test

Given the ~4 macro-scene i2v clips (locked-off, anti-shake — hands tearing, a flat lay, a bite, a
box / pack hero, the hero showing the REAL label), a non-diegetic acoustic music bed, a couple of
diegetic SFX (snap, tear), and the real logo + product PNG, `render-food-product-sizzle` assembles
the master: normalize fps / SAR, concat the clips in scene order, apply the anti-AI grain pass,
composite the audio (bed + SFX at their cue points), append a static PIL end card, burn the optional
serif stat-callout pills, and mux → 1080×1920 h264+aac (~14s).

Pass when the assembly runs to a valid MP4 and:
- ~4 macro scenes concat in order; the box / pack hero shows the REAL label (no invented packaging
  text — grounded on the product PNG upstream, not re-rendered here);
- the anti-AI grain pass is applied globally (the sizzle does not read AI-smooth);
- the diegetic SFX land on their tactile beats (snap on the tear, tear on the box-open);
- the music bed carries under the whole video with no sparse dead intro and a fade tail (no silent
  tail); it is the entire audio bed — NO separate VO;
- the optional serif stat-callout pills burn at their beats (`%` strings via `textfile=` +
  `expansion=none`);
- the end card is a static PIL composite (real logo PNG + real product PNG + a serif headline + CTA)
  — never AI-rendered text;
- **no paid call is made** — the keyframes, clips, and music come from the paid capabilities
  (create-image-fal / create-video-fal / create-music-elevenlabs); this assembly is $0 and a re-cut
  reuses the existing assets.
