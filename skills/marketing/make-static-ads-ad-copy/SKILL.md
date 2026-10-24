---
name: make-static-ads-ad-copy
description: >-
  Step of make-static-ads: writes the text for each slot the ad's template sets, then the primary texts, headline, description and CTA around the image, from usable facts and customer words. Run make-static-ads instead; not for direct use.
version: 0.9.0
---

# ad-copy

**Reads:** each `board.md` row (with its level and template), `profile.md` (how the brand writes), customer words, the claims on file, brand voice and rules. **Writes:** final on-image copy into the board; the surrounding copy into the batch file.

## 1. On-image copy

- **Format first.** The on-image text fills the slots its source sets (`../make-static-ads/references/levels.md`): the template's text slots at close and balanced, the brand's own ad style at bold. Match slot count, length, case and voice.
- **Headline:** names the relationship in the picture, in words this brand would use ("Mum has notes."). Not the feature, not the effect. Up to about eight words, two lines on a phone.
- Write 3 candidates per ad, from different formulas: a situation call-out, a contrarian opinion with proof, a specific number, the buyer's own question answered with a usable fact, customer words (attributed), old worry vs now, a founder line, an instruction. Keep the one that makes the picture land fastest; say in one line what the runner-up loses. Keep the spares for copy variants. Never a question about the viewer's personal traits (Meta).
- **Other slots** (support line, list items, label, button): only if the source has them, in short words. A factual line must be a usable fact worded as recorded (`../make-static-ads/references/claims-and-policy.md` §2). A fact with no slot goes in the primary text.
- **No footer brand name:** the brand name is never drawn as text; the placed logo carries the brand. A tagline only when the template has a slot for it and the brand has one.

## 2. Copy around the image

- **Primary text A (short):** the hook, one supported fact, the CTA.
- **Primary text B (story):** the moment in the picture, told in two to four sentences, then the product's part in it. Don't restate features at length.
- **Link headline** (the platform's headline field, not the on-image headline), **description, CTA, destination.** CTA fits awareness ("Learn more" cold, "Shop now" warm); the destination keeps the ad's promise. Offers and prices only as `../make-static-ads/references/claims-and-policy.md` §2 says.

## 3. Checks

Brand voice and banned words. Customer words: `../make-static-ads/references/claims-and-policy.md`, Four doors, 1. A generated person is never a customer or endorser. Real reviews keep their wording and attribution, and need permission to appear as a testimonial.

A deliberately textless ad has no headline; don't invent one to fill the row.

**Done:** every slot has its final words and a runner-up note; primary texts A and B, link headline, description, CTA and destination are written; rubric checks 12 (no repeat of the image text), 17 (CTA fits stage) and 18 (hook is tension) pass on the copy.
