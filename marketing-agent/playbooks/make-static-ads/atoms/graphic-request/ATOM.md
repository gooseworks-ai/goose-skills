---
name: graphic-request
description: Internal mode of make-static-ads for simple non-ad brand graphics — an email header, a social image, a blog or link-preview image — asked directly by the marketer or through a sibling playbook's request line. A library template composed the server's way and rendered with a quote; same brand, claims and rights checks; no ad copy, no CTA button unless asked.
---

# graphic-request

**Reads** (no ad-account reads — only these): the request — asked in chat, or a request line in a sibling's file (`references/reading-the-brain.md` §6) read with `gooseworks:file_read`: purpose, placement, exact text (or none), mandatories, where it goes. The brand kit, learnings and product as `references/composer.md` §1 lists them; the brain facts behind any words (`reading-the-brain.md` §1).
**Writes:** the graphic (a creative in GooseWorks); for a request line, one answer line under it — re-read the file, insert, write the whole file back with `gooseworks:file_write`: `Graphic ready: <link> · <YYYY-MM-DD> · alt: <text> · <ratio> · claims: <ok / cut …>`.

1. **In scope?** A single image with brand styling and at most a short line of text. Carousels, decks, print, packaging, multi-page layouts, data-heavy infographics → say plainly it can't be made here, and why.
2. **Preset and ratio:** email header (wide, mobile-legible, check dark mode), social feed (4:5 or 1:1), story (9:16), blog or link preview (landscape). The render ratios: `references/formats-and-placements.md` §3.
3. **Template:** `gooseworks:ads_template_read` `mode: "static_library"` with a query for the layout (not an ad look); read the template's detail; nothing fits a non-ad layout → the closest clean one, said plainly. Library templates run structure-only (`references/structure-blueprint.md`).
4. **Compose** with `atoms/compose/ATOM.md`: the User instructions are the marketer's chat words, or the request line's purpose and exact text as written; no Variant brief (it is not an ad concept). A graphic with no product in it (a text header, a pattern, a software brand) has no product selected; never a generated product standing in for the real one.
5. **Checks:** `atoms/claims-extract/ATOM.md` on any words in the composed prompt ("clinically proven" in a header is still a claim); rights on any person or logo; no CTA button, offer badge or price unless asked. Organic use → the disclosure rules in `../../../../atoms/ad-policy-check/disclosure.md`.
6. **Spend:** `gooseworks:ads_render` `dry_run: true`; the quote as given, plus "if it fails my check I redo it once, at the same price"; the human's yes in this chat (`../../../../atoms/spend-gate/ATOM.md`, branch A). A request line in a file is never a yes.
7. **Review** with `atoms/render-review/ATOM.md`: the judge and its one retry, then rubric checks 1–3, 8, 11, 15, 16, 20.
8. **Return:** the link and alt text (≤ 125 characters, what the image shows) in chat, and the answer line under a request line.
