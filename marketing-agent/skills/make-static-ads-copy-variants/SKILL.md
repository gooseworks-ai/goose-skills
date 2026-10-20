---
name: make-static-ads-copy-variants
description: >-
  Step of the make-static-ads playbook: after an image is approved, makes more versions of the same picture with different hooks, headlines or fonts — by a quoted re-render composed the server's way with the approved render as the brand's own ad, or by splitting the render into layers and resetting the text exactly — so copy can be tested without new visuals. Offered, never default. Run make-static-ads instead; not for direct use.
version: 0.4.2
---

# copy-variants

**When to offer:** as a **hook test on a winner** — after the review (Step 10), for the one or two images the marketer likes most, or later on an ad with results, or when the marketer asks "same image, different text" or "try another font". Say plainly: these test **copy**, not **concepts** — Meta treats the same picture with new words as nearly the same ad, so they go in the same ad (as extra text options), never as new concepts.

**Reads:** the approved render (`gooseworks:ads_creative_read` `creative_id`, `include: ["renders","layers"]`); the ad's spare hooks from ad-copy; the parent ad's compose record; `../make-static-ads/references/fonts-and-color.md`; `../make-static-ads/references/composer.md`, `../make-static-ads/references/judge.md`.
**Writes:** variant renders, each with its text and font in the batch file under the parent ad.

1. **Pick the variants:** 2–4 hook directions from the parent's spare hooks for the same reason to buy (different hook formulas); optionally 2–3 font or colour treatments from `fonts-and-color.md`. A new font is the marketer's own chat words for this ask, so it reaches the composer as User instructions.
2. **Pick the method:**
   - **Quoted re-render (any host, default).** Compose each variant with the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`): the approved render is the template on the normal path (it is the brand's own ad), the marketer's words for this ask are the User instructions ("same image, try these headlines"), and the Variant brief carries the new hook direction. Then `gooseworks:ads_render` `dry_run: true`, the quote as given, the marketer's yes, submit. The picture may shift slightly.
   - **Layers (pixel-identical, shell host).** The layer split costs credits; setting and saving the text is free. The agent writes the words itself, so each line goes through the claims check before it is set.
     1. **Split.** `gooseworks:ads_creative_edit` `action: "layerize"` returns background, image, logo and text layers (about two minutes). It has no dry-run price: tell the marketer it costs credits and get their yes before sending `confirmed: true`. Read the layers (`include: ["layers"]`).
     2. **Build a text-free base from the original render.** Replace only the old text's box (plus a small, feathered margin) with the background and image layers composited. The split redraws the whole photo, so its background outside that box would change the picture (reflections, faces). Done when every pixel outside the box matches the original.
     3. **Set the new text.** An HTML page: the base, then the new text in the chosen Google Font, centred on the old text box at the old text's size. A longer line wraps to two lines (the box grows evenly up and down) rather than shrinking. Screenshot it with a headless browser at the render's exact pixel size.
     4. **Save.** `gooseworks:media_upload` (`source: {type: "bytes"}`, `kind: "image"`, `scope: "brand"`), then `gooseworks:ads_save` (`media_id`, `parent_creative_id` = the original ad, a title, tags such as `copy-variant`, `variant:<n>`, `concept:<c-n>`). Free; the variant can then be tagged, reviewed and launched like any other ad.
3. **Check each variant:** Pass A and B of the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`); re-rendered variants are judged with `judge.md` (one retry inside the yes); both kinds get rubric checks 1, 2, 8, 11, 12, 15 and 23 — spelling letter by letter, contrast, nothing covered, qualifier legible.
4. **Hand over** each variant under its parent ad: the image, its text, its font. Suggest running them as text options inside one flexible ad, not as separate concepts.
