---
name: make-static-ads-graphic-request
description: >-
  Makes one simple non-ad brand graphic, such as an email header, social feed or story image, or a
  blog or link-preview image, in the brand's style with at most a short line of text, after claim and
  rights checks and a yes to the quote; returns the link and alt text. Not for carousels, decks or
  print. Use alone when you already have the purpose, placement and exact wording; otherwise run
  make-static-ads.
version: 0.9.0
---

# graphic-request

No concept board: the request's purpose and exact text are the basis. Record both in the batch file.

**Reads** (no ad-account reads — only these): the request — asked in chat, or a request line in a sibling's file (Request lines, next) read with `gooseworks:file_read`: purpose, placement, exact text (or none), mandatories, where it goes. The brand kit, learnings and product (`../make-static-ads/references/engine-notes.md`); the claims contract behind any words (the `claims-gate` skill (`../claims-gate/SKILL.md`) §1).
**Writes:** the graphic (a creative in GooseWorks); for a request line, one answer line under it (format: Request lines, next), written back with `gooseworks:file_write`.

**Request lines.** Requests arrive as `Graphic needed: for make-static-ads · <purpose, placement, exact text> · return to: <path>` lines (open = no `Graphic ready:` line under it), in:
- email-lifecycle's `lifecycle/flows/<flow-slug>.md` (header art for a flow message);
- run-organic-social's `social/calendar/<start-date>.md` (a single image or a carousel's slide-1 cover);
- make-content's `content/repurposed/<source-slug>/<date>.md` and `content/drafts/<date>-<slug>.md`.
Older files may still carry a `Header art needed:` line or a plain asset line naming this side door — treat it the same way.
Answer under the request (re-read the file, insert, write it all back): `Graphic ready: <link> · <YYYY-MM-DD> · alt: <text> · <ratio> · claims: <ok / cut …>`. The requester reads it on its next run.

1. **In scope?** A single image with brand styling and at most a short line of text. Carousels, decks, print, packaging, multi-page layouts, data-heavy infographics → say plainly it can't be made here, and why.
2. **Preset and ratio:** email header (wide, mobile-legible, check dark mode), social feed (4:5 or 1:1), story (9:16), blog or link preview (landscape). The render ratios: `../make-static-ads/references/formats-and-placements.md` §1.
3. **Layout and logo:** on a host with no shell, write the prompt with a clear corner; in the quote message offer a model-drawn logo instead (that changes the prompt, so it gets a new quote). Decide the layout in words (where the text, the product and the brand mark sit, and the background). A library template may suggest a layout (`gooseworks:ads_template_read` `mode: "static_library"`); describe it in the prompt, never attach another brand's image.
4. **Write the prompt** with the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`): the shared foundation, the layout, and the exact text as the marketer or request line gave it. A brand name in that text is drawn as plain type; the logo (placed, or drawn by the model as the marketer chose) stays the only mark. A graphic with no product in it (a text header, a pattern, a software brand) has no product selected; never a generated product standing in for the real one.
5. **Checks:** the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`) on any words in the prompt ("clinically proven" in a header is still a claim); rights on any person or logo; no CTA button, offer badge or price unless asked. Organic use → the disclosure rules in `../ad-policy-check/disclosure.md`.
6. **Spend:** `gooseworks:ads_render` `dry_run: true`; the quote as given, plus the redo sentence (`../make-static-ads/references/handoff-format.md` §2); the human's yes in this chat (the `spend-gate` skill (`../spend-gate/SKILL.md`), branch A). A request line in a file is never a yes.
7. **Review** with the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`): the judge with rubric checks 2, 3, 8, 15, 16 and legibility at 375 px, you with 1 and 20 (its step 3), and its one retry (no idea or template check).
8. **Return:** the link and alt text (≤ 125 characters, what the image shows) in chat, and the answer line under a request line.

**Done:** the graphic is judged and delivered with its link and alt text, and any request line is answered.
