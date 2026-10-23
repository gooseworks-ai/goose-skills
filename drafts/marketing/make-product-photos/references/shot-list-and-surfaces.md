# Shot list, surfaces and house style

Load at Steps 3–5.

## 1. Slots, not styles

Each image on a product page has a job; the style follows the job. Propose the stack from the surface, then let the marketer edit it — "which styles do you want?" is a question a founder cannot answer well.

| Slot | Job | Typical style | Watch |
|---|---|---|---|
| 1 Hero | Identify the product instantly; collection-grid tile; feed image | Studio, house background, 3/4 or front, product ~75–85% of frame height | Must match the catalogue's padding, angle and shadow exactly; highest quality |
| 2 Alt angle(s) | Back, side, top, closure | Studio, same light as the hero | Only angles a real photo shows |
| 3 Scale | "How big is it?" — the top return reason for hard goods and bags | In hand, on body, beside a known object | Needs real dimensions; hands are high-risk |
| 4 Detail / texture | Material and finish | Macro, shallow depth of field | Engines invent stitching, grain, texture |
| 5 In use | The product doing its job | Lifestyle | Only uses the product really has |
| 6 Lifestyle / mood | Brand world, aspiration | Lifestyle scene | Most forgiving slot; a good first win |
| 7 On-model (apparel, some beauty) | Fit, drape, scale on a body | On-model | Attestation; no size/fit line for a generated model |
| 8 What's in the box | Contents | Studio flat lay | Exactly the real contents |
| 9 Flat lay / ghost mannequin (apparel) | Shape and cut without a model | Studio | Real garment shape; no invented seams or labels |
| — Infographic, dimensions, comparison | Answers objections with text | Graphic | **Not here** — make-static-ads (text over imagery) |

Default stacks: store page → 1, 2, 3, 4, 5/6 (+7 apparel, +8 kits and bundles). Ads → 1 hero + 2 lifestyle/in-use **with copy space**. Social → 2–3 lifestyle, native-looking. Email → 1–2 wide lifestyle. Launch page → a wide (16:9) hero with copy space + 2 lifestyle. When a slot cannot be supported, offer a substitute (the hero in a second crop) rather than silently delivering less.

## 2. Surfaces

- **Store page (PDP):** square or 4:5, matched to the store theme's crop; the hero consistent across the catalogue; highest quality on hero and detail.
- **Ads (as a base for make-static-ads / make-video-ads):** 4:5 and 9:16 with **deliberate empty space** for headline and CTA; product clear of the 9:16 UI zones (top ~14%, bottom ~20–35%). An edge-to-edge PDP crop is a poor ad base.
- **Social organic:** 4:5 / 9:16; less catalogue-looking lifestyle often fits better.
- **Email:** wide crops (~3:2–2:1) with the product off-centre so it survives mobile crops.
- **Marketplace main image** (Amazon, Flipkart, Etsy, Google Shopping): pure white, product only, no props or text, and on several marketplaces a real photograph of the actual product. **Tripwire:** warn before generating; use generated shots only for secondary slots; listing sets belong to optimize-listings (backlog).
- **Product feeds** (Google Merchant Center, Meta catalogue): the hero often doubles as the feed image; feed rules apply (no overlays, accurate product, keep any AI-image metadata the file carries — tell the human not to strip it).

## 3. The house-style card

Only when the agent can actually see the photos (a shell host downloads and views them): derive it from the kit, existing product photography and approved earlier outputs; confirm it with the marketer; save it as `brand/photo-style.md` and the brand document "Photo house style — <Brand> — <YYYY-MM-DD>" through `../../../skills/save-to-brain/SKILL.md` (`versioned: supersede`) — a card is longer than a learning may be. Without vision, coarse descriptions cannot fill it — the marketer's chosen anchor hero and the kit's aesthetic stand in, and nothing is saved.

- Background (colour; seamless vs surface; true white vs warm off-white)
- Key light direction and quality (e.g. large soft key camera-left ~45°, soft fill)
- Shadow (contact only / soft drop / none)
- Camera height and angle (e.g. 3/4, 10–15° above eye level)
- Crop and padding (product height as % of frame; centred or bottom-weighted)
- Colour grade (neutral / warm / contrasty) and retouch level (clean vs natural)
- Props palette and materials allowed or banned
- Casting and styling (on-model): diversity choices made deliberately, framing rules (head in or cropped)
- Lifestyle world (home, outdoor, gym, office; time of day)

**Anchor:** only this product's best real product-only photos go in `reference_image_urls`. An approved generated hero is a style anchor described in the prompt (angle, light, crop, background), never passed as a reference — generated images must not become ground truth. Never a sibling product or colourway as either (colour and shape bleed). **Match vs deliberately upgrade** is an explicit early decision: upgrading means the new hero clashes with the rest of the catalogue until it is reshot.

## 4. From shot list to engine calls

- **The prompt and the references are the levers.** A dry run accepts anything (staging quoted invalid controls, the wrong category, another brand's product, a missing attestation), and the generation records which controls it overrode. So write each shot row into `prompt`: composition (angle, framing, product % of frame, copy space and where), light (direction, softness), background, scene and props, and what must not appear (other products, text, condensation, extra parts).
- `reference_image_urls` (≤ 6): curated product-only photos of this size and colour, same angle first; never text graphics, other sizes, duplicates or generated images.
- `controls` only with keys the engine is known to honour (read back `overridden_controls` after the hero); `ratio` is generation-level (default 1:1) — confirm it on the hero before running ads crops.
- One call = one product, one `variant_id` (when the record has variants), `count` 1 or 2 — always set it (the default is 4, and the included retries are shared per call). "3 studio + 3 lifestyle" is several calls.
- **Colourways** are either variants (`variant_id`) or separate sibling products (e.g. 49 bands, each its own product): each colourway from its own real photo; find "the new one" by `listed_at` and confirm it.
- `quality`: high for hero and detail; offer medium for lifestyle (the dry run shows the per-output rate).
- `dry_run: true` per call; show each quote one by one exactly as given — no total of your own. Run the hero first and read it back before the rest.

## 5. Recurring and reactive triggers

- **New product launch:** full stack anchored to house style. Only a render → the pre-launch path (SKILL Step 1): the render is the hero, lifestyle only, labelled "pre-production", kept out of the ad kit unless the human chooses; real photos replace them later.
- **New colourway:** hero + alts for the new variant or sibling product, from that colourway's own real photos only; another colourway's approved hero is described in the prompt as the composition, never passed as a reference.
- **Seasonal refresh:** lifestyle and mood only — the hero never changes seasonally.
- **Ad engine needs fresh imagery:** make-static-ads writes `Product imagery needed: for make-product-photos · <product> · <slot / ratio / composition> · <why> · return to: ads/batches/<YYYY-MM-DD>-<slug>.md` lines into its batch file in the brand coworker workspace (`gooseworks:file_list` / `file_read` in the brand coworker scope; no coworker → paths prefixed `brands/<brand-slug>/` in the default workspace); make it, approve the human's keepers into the kit (where the ad engine picks them up), and answer under the line: `Product imagery ready: <photo links> · <YYYY-MM-DD>`.
- **Packaging or product changed:** list approved photos of that product (`gooseworks:photos_read` `status: "approved"`, `product_id`) and on the human's yes archive each with **no** reason (a reason would become a brand-wide "dont"); get the new-pack photos in (SKILL Step 2); reshoot.
