---
name: make-static-ads-copy-variants
description: >-
  Step of the make-static-ads playbook: after an image is approved, makes more versions of the same picture with different hooks, headlines or fonts by a quoted re-render with the approved render attached as the brand's own image, so copy can be tested without new visuals. Offered, never default. Run make-static-ads instead; not for direct use.
version: 0.9.1
---

# copy-variants

**When to offer:** as a **hook test on a winner** — after the review (Step 8), for the one or two images the marketer likes most, or later on an ad with results, or when the marketer asks "same image, different text" or "try another font". Say plainly: these test **copy**, not **concepts** — Meta treats the same picture with new words as nearly the same ad, so they go in the same ad (as extra text options), never as new concepts.

No new board: the parent ad's row is the basis, linked in the batch file. Every new line goes through the claims check before its quote.

**Reads:** the approved render (`gooseworks:ads_creative_read` `creative_id`, `include: ["renders"]`); the ad's spare hooks from the `make-static-ads-ad-copy` skill; the parent ad's board row and prompt; `../make-static-ads/references/fonts-and-color.md`; `../make-static-ads/references/prompts.md`.
**Writes:** variant renders, each with its text and font in the batch file under the parent ad.

1. **Pick the variants:** 2–4 hook directions from the parent's spare hooks for the same reason to buy (different hook formulas); optionally 2–3 font treatments from `fonts-and-color.md`, in the brand's colours. A new font goes into the prompt's typography line.
2. **Write each variant's prompt** with the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`). Images in order: the product photo first, then the parent's raw render without the logo ("Image 2 is our approved ad: keep its scene exactly; change only the words in <slot> to …"). Then `gooseworks:ads_render` `dry_run: true`, the quote as given, the marketer's yes, submit. The picture may shift slightly. The layer split (`ads_creative_layerize`) is not used: it returns no price before it charges.
3. **Check each variant:** Pass A and B of the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`); then the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`): the logo placed again, the judge with rubric checks 2, 8, 11, 15 and 23, you with 1 and 12 (its step 3), one retry inside the yes.
4. **Hand over** each variant under its parent ad: the image, its text, its font. Suggest running them as text options inside one flexible ad, not as separate concepts.

**Done:** each variant is rendered, judged and filed under its parent with its text and font.
