# image-gpt-image-2 1.1.2

1.1.2 adds **borders** in scenes mode (below). 1.1.1 added optional scene tag and product reference checks in scenes mode. Existing inputs keep their behavior when the new checks are absent.

- `require_scene_tags: true` refuses missing, unknown, malformed or contradictory `by_tag` routing before generation. Structured `extra.shot` may replace a picture prefix; a written prefix must agree and include its colon.
- `require_product_refs: true` requires every product named in the picture or requested by the tag rule to have its current real photo in the actual GPT edit request. A wrong Look tag cannot hide a product scene, and reference-list truncation cannot drop the photo silently.
- `product_reference_evidence` binds the exact returned still hash to the current product photo hashes and the image hashes sent in that request. The locked style binds this producer output to a guarded motion step. This is request evidence, not a visual judgment or a cryptographic provider attestation.
- No new provider calls, rerolls or model fallback. A valid product still still costs one existing GPT request.

## Borders (1.1.2, scenes mode)

With `borders: "fix"` (the default), as image-nano-banana 1.2.3 (`parts/_lib/scene-stills.mjs`):

- Product photos lose their flat or transparent margins before they are sent, free, **except with
  `require_product_refs`**: its evidence names the exact photo in the request, so that photo is sent as it is.
- A still that comes back with a band (a flat strip of 2.5 % or more on a straight edge, neutral or matched on
  the opposite side) or a frame (a flat ring of 1.5 % or more on all four sides) is cropped when that keeps 90 %
  of it; else drawn once more as `redo-<scene id>` with full-bleed words added, then cropped when that keeps
  75 %; else the step fails: "The picture for scene N came back with a border; change the scene picture and try
  again." At most one extra still per scene.
- `product_reference_evidence` is bound to the still the step hands on (cropped or not) and to the request that
  drew it (its piece is the redo piece when the still was drawn again).
- `borders: "keep"` turns both off. Images, cast and shots mode are unchanged and refuse `borders`.
