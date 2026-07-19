# Smoke Test

Given the SEPARATE narration VO (mp3 + `.words.json`), ~7 Seedance scene clips (one per product
step + a hook + a payoff, one locked creator across all), ~5 white-bg product cutouts with
PDP-verified taglines, a music bed, and a flat-lay end-card still, `render-glassy-matte-grwm`
assembles the master — re-cut each clip to its VO word-start window, hard-concat on the cut,
Playwright-render + composite the ~5 product cards on the product-name beats, mix the VO over the
ducked music, burn clean-white captions, close on the flat-lay end card → 1080×1920 h264+aac
(~32s).

Pass when the assembly runs to a valid MP4 and:
- ~12 scene segments, each hard-cut on its "step N" word-start (no crossfades); the ONE locked
  creator + vanity hold across every scene;
- ~5 product cards, each animating in on its product-NAME word-start (~1s after the scene cut) with
  the RIGHT white-bg cutout + a PDP-verified tagline; every PNG overlay used `-loop 1 -t <dur>`;
- captions are clean-white 3-words/cue (no pill, no shadow); the flat-lay end card holds ~4s on the
  final window;
- the SEPARATE VO clearly leads the ducked music bed at loudnorm I=-14 — no VO baked into the
  clips, no music on top of the VO;
- **no paid call is made** — the VO, scene clips, product cutouts, and music come from the paid
  capabilities (create-music-elevenlabs / create-video-fal / create-image-gpt-image-fal); this
  assembly is $0 and a re-cut reuses the existing assets.
