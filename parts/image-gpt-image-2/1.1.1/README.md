# image-gpt-image-2 1.1.1

Adds optional scene tag and product reference checks in scenes mode. Existing inputs keep their behavior when the new checks are absent.

- `require_scene_tags: true` refuses missing, unknown, malformed or contradictory `by_tag` routing before generation. Structured `extra.shot` may replace a picture prefix; a written prefix must agree and include its colon.
- `require_product_refs: true` requires every product named in the picture or requested by the tag rule to have its current real photo in the actual GPT edit request. A wrong Look tag cannot hide a product scene, and reference-list truncation cannot drop the photo silently.
- `product_reference_evidence` binds the exact returned still hash to the current product photo hashes and the image hashes sent in that request. The locked style binds this producer output to a guarded motion step. This is request evidence, not a visual judgment or a cryptographic provider attestation.
- No new provider calls, rerolls or model fallback. A valid product still still costs one existing GPT request.
