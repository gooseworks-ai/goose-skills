# image-gpt-image-2 1.3.1

**1.3.0 reads the quality tier.** The customer picks Standard or Best at script approval, and the kit passes it as `quality_tier` (`standard`, the default, or `best`). It sets this part's default GPT Image 2 quality: `medium` for Standard, `high` for Best. An explicit `quality` still wins for the whole step. The kit has no per-shot upgrades: a custom video's one-shot upgrades go through the server's per-call check instead. 1.2.0 always defaulted to `high`. Everything else is as in 1.2.0:

## 1.2.0

**1.2.0 changes the default cast anchor** (used when the style's template has no `anchor` text). It now follows the server's dialogue creator recipe: a candid vertical iPhone front-camera frame of the person, chest-up, in a real lived-in, slightly cluttered room, everything sharp (deep focus, no bokeh), natural room light, real skin with small imperfections, and no retouching, skin smoothing, beauty filter or cinematic grade. 1.1.x drew the person "in front of a plain light wall, soft even daylight". A style's own `anchor` text still wins. Everything else is as in 1.1.2:


1.1.2 adds **borders** in scenes mode (below). 1.1.1 added optional scene tag and product reference checks in scenes mode. Existing inputs keep their behavior when the new checks are absent.

- `require_scene_tags: true` refuses missing, unknown, malformed or contradictory `by_tag` routing before generation. Structured `extra.shot` may replace a picture prefix; a written prefix must agree and include its colon.
- `require_product_refs: true` requires every product named in the picture or requested by the tag rule to have its current real photo in the actual GPT edit request. A wrong Look tag cannot hide a product scene, and reference-list truncation cannot drop the photo silently.
- `product_reference_evidence` binds the exact returned still hash to the current product photo hashes and the image hashes sent in that request. The locked style binds this producer output to a guarded motion step. This is request evidence, not a visual judgment or a cryptographic provider attestation.
- No new provider calls, rerolls or model fallback. A valid product still still costs one existing GPT request.

## Borders (1.1.2, scenes mode)

With `borders: "fix"` (the default), as image-nano-banana 1.2.3 (`parts/_lib/scene-stills.mjs`):

- Product photos lose their flat or transparent margins before they are sent, free, **except with
  `require_product_refs`**: its evidence names the exact photo in the request, so that photo is sent as it is.
- A still that comes back with a band (a flat strip of 2.5 % or more on a straight edge, matched on the
  opposite side, or alone in pure white or black) or a frame (a flat ring of 1.5 % or more on all four sides) is
  cropped to the largest box of its own shape and scaled back to its size when that keeps 75 % of it; else a
  letterbox or frame fails the step: "The picture for scene N came back with a border; change the scene picture
  and try again." A lone strip that cannot be cropped is kept with a warning. Never a second paid still.
- `product_reference_evidence` is bound to the still the step hands on (cropped or not) and to the request that
  drew it.
- `borders: "keep"` turns both off. Images, cast and shots mode are unchanged and refuse `borders`.
