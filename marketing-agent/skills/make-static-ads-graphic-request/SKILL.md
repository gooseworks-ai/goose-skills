---
name: make-static-ads-graphic-request
description: >-
  Makes one simple non-ad brand graphic, such as an email header, social feed or story image, or a
  blog or link-preview image, in the brand's style with at most a short line of text, after claim and
  rights checks and a yes to the quote; returns the link and alt text. Not for carousels, decks or
  print. Use alone when you already have the purpose, placement and exact wording; otherwise run
  make-static-ads.
version: 0.1.0
---

# graphic-request

**Reads** (no ad-account reads — only these): the request — asked in chat, or a request line in a sibling's file (`../make-static-ads/references/reading-the-brain.md` §6) read with `gooseworks:file_read`: purpose, placement, exact text (or none), mandatories, where it goes. Brand kit via `gooseworks:brand_read` lean (`summary`, `kit`, `products`) and the claims marker (the `claims-gate` skill, `../claims-gate/SKILL.md`).
**Writes:** the graphic (a creative in GooseWorks); for a request line, one answer line under it — re-read the file, insert, write the whole file back with `gooseworks:file_write`: `Graphic ready: <link> · <YYYY-MM-DD> · alt: <text> · <ratio> · claims: <ok / cut …>`.

1. **In scope?** A single image with brand styling and at most a short line of text. Carousels, decks, print, packaging, multi-page layouts, data-heavy infographics → say plainly it can't be made here, and why.
2. **Preset:** email header (wide, mobile-legible, check dark mode), social feed (4:5 or 1:1), story (9:16), blog or link preview (landscape). The engine's ratios: `../make-static-ads/references/formats-and-placements.md` §3; set them on the source item.
3. **Source:** `gooseworks:ads_template_read` `mode: "static_library"` with a query for the layout (not an ad look); read the template's detail; nothing fits a non-ad layout → the closest clean one, said plainly. A graphic with no product in it (a text header, a pattern, a software brand) → `allow_without_product_image: true` on the source item, labelled "product not shown"; never a generated product standing in for the real one.
4. **Checks:** `claims-extract` + the claims gate on any words in the image ("clinically proven" in a header is still a claim); rights on any person or logo; no CTA button, offer badge or price unless asked. Organic use → the disclosure rules in `../ad-policy-check/disclosure.md` (in the `ad-policy-check` skill).
5. **Spend:** `gooseworks:ads_generate` `dry_run: true`; the quote as given; the human's yes in this chat (the `spend-gate` skill (`../spend-gate/SKILL.md`), branch A). A request line in a file is never a yes.
6. **Review** with `render-review` checks 1–3, 8, 11, 15, 16, 20.
7. **Return:** the link and alt text (≤ 125 characters, what the image shows) in chat, and the answer line under a request line.
