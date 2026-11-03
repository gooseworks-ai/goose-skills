# Human version

The H3 route uses the existing prompt and finishing contracts. It is opt-in, keeps request/take records, and recovers completed results without another generation. Real H3 quality remains unverified.

---

# Agent version

## Opt-in H3 Max generation

Current production recipes explicitly pass `--model minimax/h3-max/reference-to-video --resolution 1080P` to `single_gen.py`, or store those exact fields under `generation` in the brand config. Existing configs without those settings keep their historical endpoint; this is not a global provider replacement.

The H3 adapter preserves the raw scaffold prompt, lint, camera/grammar flags, brand, seed, scene coupling and `<take>.json` required by finishing. It translates image tags only in the provider request, uses numeric duration, supported uppercase resolution and disabled expansion, and sends `reference_image_urls`. Native audio is kept without a `generate_audio` request field. Narrow/wide product references are padded to the official range without cropping. H3 image, voice and motion quality remain unverified.

```bash
python scripts/single_gen.py --brand <slug> --model minimax/h3-max/reference-to-video --resolution 1080P
# Only after the normal generation review:
python scripts/single_gen.py --brand <slug> --model minimax/h3-max/reference-to-video --resolution 1080P --yes
# After a polling interruption, same config/seed/model/run, no new order:
python scripts/single_gen.py --brand <slug> --model minimax/h3-max/reference-to-video --resolution 1080P \
  --recover-request-id <saved-id>
```

The request ID is written before polling. Recovery verifies the saved input digest and ID, then writes the same finishing manifest. Rejections stop; an existing request cannot be ordered again through this entry point. Use the current recipe/quote for cost; the dry run reports output-only estimates before reference surcharges. Do not transfer earlier provider prices or measured quality to H3.



A completed result URL and provider settings are written before download. Download uses a `.part` file and only renames it after a successful transfer. Recovery reuses the saved URL if generation already completed, including after repeated download failures; it never uploads or places a new order.
