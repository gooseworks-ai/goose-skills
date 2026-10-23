---
name: make-static-ads-ad-copy
description: >-
  Step of make-static-ads: writes the on-image headline and support line for each board row, then the primary texts, headline, description and CTA around the image, from usable facts and customer words. Run make-static-ads instead; not for direct use.
version: 0.7.0
---

# ad-copy

**Reads:** each `board.md` row (with its level and template), `profile.md` (how the brand writes), customer words, the claims on file, brand voice and rules. **Writes:** final on-image copy into the board; the surrounding copy into the batch file.

## 1. On-image copy

- **Format first.** The on-image text fills the slots its source sets (`../make-static-ads/references/levels.md`): the template's text slots at close and balanced, the brand's own ad style at bold. Match slot count, length, case and voice. Never fall back on "headline on top, explaining line at the bottom".
- **Headline:** names the relationship in the picture, in words this brand would use ("Mum has notes."). Not the feature, not the effect. Up to about eight words, two lines on a phone.
- Write 3 candidates per ad. Keep the one that makes the picture land fastest; say in one line what the runner-up loses. Keep the spares for copy variants later.
- **Other slots** (support line, label, button): only if the source has them. A factual line must be a usable fact worded as recorded (`../make-static-ads/references/claims-and-policy.md` §2). A fact with no slot goes in the primary text.
- **Footer:** brand name, and a short tagline only if the brand has one.

## 2. Copy around the image

- **Primary text A (short):** the hook, one supported fact, the CTA.
- **Primary text B (story):** the moment in the picture, told in two to four sentences, then the product's part in it. Don't restate features at length.
- **Headline, description, CTA, destination.** CTA fits awareness ("Learn more" cold, "Shop now" warm); the destination keeps the ad's promise. Offers only if live and confirmed in this run.

## 3. Checks

Brand voice and banned words. Customer words may describe the problem; the benefit must be a usable fact. A generated person is never a customer or endorser. Real reviews keep their wording and attribution, and need permission to appear as a testimonial.

A deliberately textless ad has no headline; don't invent one to fill the row.
