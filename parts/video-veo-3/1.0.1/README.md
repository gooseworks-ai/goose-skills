# video-veo-3 1.0.1

Adds optional strict scene routing and product start-frame checks. Existing inputs keep their behavior when the new checks are absent; the provider remains Veo image-to-video.

- `require_scene_tags: true` checks each picked scene’s `by_tag` route before any clip is ordered.
- `require_product_refs: true` requires `product_reference_evidence` from the guarded GPT still step for product scenes. The evidence must match the scene, current real product photos and exact start-frame hash, and must show those photos in the preceding actual edit request. Missing, changed or misbound evidence stops the whole step.
- Veo receives only its supported `image_url` field. Product fidelity comes from the verified source request of that frame; no unsupported reference-list field or provider change is added.
- Evidence proves the reference chain within the locked recipe, not the appearance of the generated product. Visual review remains required.
