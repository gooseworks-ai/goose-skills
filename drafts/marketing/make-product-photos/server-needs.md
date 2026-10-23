# make-product-photos — server needs

Checked against staging, 2026-10-16 (rounds 1–2). Each: the need · the step · what the playbook does meanwhile.

## High

1. **Dry run that validates.** `photos_generate` `dry_run` quoted invalid `controls`, `category: "apparel"` on a moisturiser, a human model with no attestation, another brand's product with a fake `variant_id`, and the Gooseworks software product. Refusals can only appear on the paid submit, after the yes. *Step 5.* Meanwhile: the playbook validates fit itself, writes the shot into `prompt`, runs the hero alone first. Ask: validate, refuse mismatches, and echo the resolved controls and ratio; publish the `controls` vocabulary.
2. **Reference control.** Unknown whether `reference_image_urls` replaces or adds to the product's own `image_urls`. Product photo sets are polluted (claim graphics, a 15 mL mini, duplicates, a possibly generated image). *Step 2.* Meanwhile: curated references only. Ask: a "use only these references" switch.
3. **Retire or archive without teaching a "dont".** Every `archive` reason becomes a brand-wide "dont" learning; packaging changes and engine glitches are not brand rules. *Step 9.* Meanwhile: reasons only for durable product-specific "Don't …" rules; glitches archived without one; unpicked photos left alone. Ask: a `retire` action and a glitch archive with no learning.
4. **Provenance filter.** Approved outputs are linked to the product, so the next run's `media_list scope: product` treats generated images as real photos. *Step 2.* Meanwhile: source-audit matches assets against earlier outputs (`photos_read`, kit generated URLs) and asks the human. Ask: a provenance filter on `media_list` (real vs generated).
5. **Hard-goods and device categories.** `category` is `apparel | beauty | cpg`. Meanwhile: hard goods → `cpg` with the risk said; electronics, furniture, jewellery, eyewear lifestyle-only or a real shoot.

6a. **Store-imported images are not provenance-checked.** `source.type: brand_catalog` covers AI-generated images in the brand's own store (staging: Braxley's newest colourways have `hf_…` Higgsfield exports; Blackout has a `pomelli-image` and its byte-identical copy). *Step 2.* Meanwhile: filename patterns, duplicate-class rule, and asking the human. Ask: C2PA / AI-metadata detection on import.

6b. **`product_name` on an upload makes it the product's hero.** Adding a back or side angle as a reference image would replace the kit hero. Meanwhile: angles uploaded as `kind: "image"` with no `product_name`; the hero only on the human's say-so. Ask: an "add as alternate angle" option.

## Medium

6. **Analysis availability.** Braxley's assets return `semantic_state: "blocked_budget"` (undocumented) with null description and text. *Steps 2, 7.* Meanwhile: "unaudited" → ask the human. Ask: on-demand analysis; document the state.
7. **Targeted compare-to-reference checking** for hosts that cannot see images (`media_analyze` takes no question). Meanwhile: the output's and the reference's automatic reads compared field by field (counts, label text, colour words, product and size); "not checked by eye" + a targeted checklist.
8. **OCR reliability.** The same label read "51.4 ML" and "61.4 ML". Meanwhile: OCR is a hint; exact text checked by eye or by the human.
9. **The attestation text** is not exposed; the playbook paraphrases it. Ask: expose it.
10. **Ratio per call.** `ratio` is generation-level (default 1:1); the key that sets it is undocumented. Meanwhile: confirm on the hero; one call per ratio where it matters.
11. **Generation that never starts.** The only real staging generation sat with `started_at: null` and failed ~36 h later (`workflow_error`, nothing charged). Meanwhile: bounded polling, hand back, never resubmit. Ask: a timeout and a clear "not started" state.
12. **A multi-call quote.** One total across several calls (the server forbids the agent's own sum). Meanwhile: each quote shown one by one as given, no total.

## Low

13. **AI-provenance metadata** on outputs (IPTC / C2PA) for feed and marketplace rules; and what `published_at` on outputs means (approve must not publish anywhere). Meanwhile: tell the human to keep metadata; confirm nothing is published.
14. **Colourway line-ups** in one frame are not possible. Out of scope.
15. **Variant vs sibling products.** Braxley's 49 colourways are separate products with `variants: []`. Meanwhile: treat sibling products as colourways; find the new one by `listed_at`.
