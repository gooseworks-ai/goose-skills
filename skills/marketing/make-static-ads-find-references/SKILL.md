---
name: make-static-ads-find-references
description: >-
  Step of make-static-ads: picks a template for every ad in its chosen style, after its visual idea and style are set, from the brand's own ads, the GooseWorks library or category leaders, and records what the chosen creativity level keeps from it. Run make-static-ads instead; not for direct use.
version: 0.10.1
---

# find-references

**Reads:** each board row's angle, message, visual idea and style; the chosen level (`../make-static-ads/references/levels.md`); `profile.md`. **Writes:** the Template column of `board.md` and a short template list under the board (source, page link, the image's public https URL (a brand's own ad from a page or file goes through `gooseworks:media_upload` first), whether its image goes to the model at this level, and what it keeps).

Every ad has a template. Without one the image model falls back on its own default layout, and every brand's ads end up looking the same. A template is a finished ad with a layout: text slots, blocks, a background treatment. A plain product photo or lifestyle shot is not a template; it is a style reference at most.

## 1. Where to look (free first), in this order

1. **The brand's own ads** (its past and running statics, from `profile.md`). They already look like the brand (whether their image may go to the image model: `../make-static-ads/references/levels.md`).
2. **The GooseWorks template library:** `gooseworks:ads_template_read` `mode: "static_library"` with a query for the layout or device the visual idea needs. Open each candidate's detail and look at the image. Name a library source as such, never as a verified running ad.
3. **Category leaders and inventive brands from other categories** in the Meta Ad Library, in the host browser (routes in `../make-static-ads/references/brand-profile.md` §1): the first 20 or so statics of 2–3 advertisers.

Each set uses at least one template from outside the GooseWorks library (the brand's own ads, a leader, or another category's inventive brand). If none of those can be opened, say which you tried on the board.

Look at every candidate's image before choosing. Reject fixtures, placeholder brands, illegible layouts and templates whose text slots can't carry this ad's message.

## 2. Choose the template after the idea

Pick a template in the row's chosen style whose layout fits the visual idea: one big object needs a hero layout, a comparison a split, a list a stacked layout. Spread the set across different templates and advertisers; two ads on one template must differ in message and visual idea.

## 3. Record what this level keeps (`levels.md`)

What each level keeps, and whether the image goes to the model: the table in `levels.md`.

Describe what you actually see in the template: block positions and rough sizes, background, product position and scale, each text slot's position, length and weight. Don't credit it with things you're adding.

## 4. Rights

This section is the one home of template rights. What may go into `image_urls` (at close and balanced, `levels.md`): the brand's own ads and GooseWorks library templates (made for remixing). Ads of other brands found in an ad library never go in, at any level. From any template keep none of another brand's product, words, logo, people or signature look. A direct competitor's template gives layout only. If a buyer could mistake ours for theirs (cover both logos and look side by side), change the picture and the words. Borrow devices, craft and abstract layout only; a celebrity or expert in a template is a slot for the brand's own endorser with permission, never a generated lookalike.

## 5. Showing them

Keep three looked-at candidates per ad: the chosen one and two alternates in other styles (`../make-static-ads/references/levels.md`, Style), so the marketer can switch the look. The marketer must see all three as images before paying, even after "your choice": on a shell host make one sheet per ad with `../make-static-ads/scripts/template_sheet.py` (chosen first, each captioned with its letter, source and style) and show it to the marketer, not only to yourself: if the host has a send-file tool, send it (Claude Code desktop: `SendUserFile`, `display: "render"`); in a terminal, `open` it and give its full path; in an app that shows images, attach it. Viewing it with your own image reader does not count. With no shell, show the three images the same way, or their links when the host can't show images. The board says so (`../make-static-ads/references/handoff-format.md` §2).

**Done:** every ad has a chosen template and two looked-at alternates in other styles, each with its source and what the level keeps; at least one template comes from outside the library, or the board says what was tried.
