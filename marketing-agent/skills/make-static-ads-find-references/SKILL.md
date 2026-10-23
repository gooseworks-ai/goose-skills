---
name: make-static-ads-find-references
description: >-
  Step of make-static-ads: picks a template for every ad after its visual idea is set, from the brand's own ads, the GooseWorks library or category leaders, and records what the chosen creativity level keeps from it. Run make-static-ads instead; not for direct use.
version: 0.7.2
---

# find-references

**Reads:** each board row's angle, message and visual idea; the chosen level (`../make-static-ads/references/levels.md`); `profile.md`. **Writes:** the Template column of `board.md` and a short template list under the board (source, link, what it keeps).

Every ad has a template. Without one the image model falls back on its own default layout, and every brand's ads end up looking the same.

## 1. Where to look (free first), in this order

1. **The brand's own ads** (its past and running statics, `../make-static-ads/references/research.md` §2). They already look like the brand, and at **close** their image can go to the image model.
2. **The GooseWorks template library:** `gooseworks:ads_template_read` `mode: "static_library"` with a query for the layout or device the visual idea needs. Open each candidate's detail and look at the image. Name a library source as such, never as a verified running ad.
3. **Category leaders and inventive brands from other categories** in the Meta Ad Library, in the host browser (routes in `research.md` §2): the first 20 or so statics of 2–3 advertisers.

Each set uses at least one template from outside the GooseWorks library (the brand's own ads, a leader, or another category's inventive brand). If none of those can be opened, say which you tried on the board.

Look at every candidate's image before choosing. Reject fixtures, placeholder brands, illegible layouts and templates whose text slots can't carry this ad's message.

## 2. Choose the template after the idea

Pick the template whose layout fits the visual idea: one big object needs a hero layout, a comparison a split, a list a stacked layout. Spread the set across different templates and advertisers; two ads on one template must differ in message and visual idea.

## 3. Record what this level keeps (`levels.md`)

| Level | Keep from the template | Template image to the image model |
|---|---|---|
| Close | Scene, layout and text slots; swap in this brand's product, words, colours | Only if the brand owns it; otherwise a detailed layout description |
| Balanced | Layout and text slots; the visual idea fills it | No; describe the layout |
| Bold | A device or a look only | No; words only |

Describe what you actually see in the template: block positions and rough sizes, background, product position and scale, each text slot's position, length and weight. Don't credit it with things you're adding.

## 4. Rights

Other brands' templates never go into `image_urls`, at any level. Keep none of their product, words, logo, people or signature look. A direct competitor's template gives layout only. If a buyer could mistake ours for theirs (side-by-side test, `research.md` §4), change it.

## 5. Showing them

Keep three looked-at candidates per ad: the chosen one and two alternates. All three go on the board as images (`../make-static-ads/references/handoff-format.md` §3), even after "your choice", so the marketer can swap before paying.
