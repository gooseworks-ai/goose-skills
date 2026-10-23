---
name: make-static-ads-find-references
description: >-
  Step of make-static-ads: looks at strong ads from other brands and categories for devices, craft and layouts the concept board can use, and records what each one contributes. Run make-static-ads instead; not for direct use.
version: 0.6.0
---

# find-references

**Reads:** the starting points and draft ideas from the concept-grid step. **Writes:** the References column of `board.md` and a short reference list (source, link, what it contributed) under the board.

A reference widens what you can imagine. It does not decide the ad. The idea comes from the product and the customer (`../make-static-ads/references/ideas.md` §5).

## 1. Where to look (free first)

- **Category leaders and adjacent categories** in the Meta Ad Library, in the host browser: search the advertiser by name, open its page, look at the first 20 or so statics (the default order puts the ads they spend most on first). Routes: `../make-static-ads/references/research.md` §2.
- **Outside the category.** Many of the best devices come from a different product type (a drink ad's set design for a spice brand). Look at 2–3 brands known for inventive statics.
- **The GooseWorks library**: `gooseworks:ads_template_read` `mode: "static_library"` with a query for the device or look you need. Name a library or Pinterest source as such, never as a verified running ad.

Stop when you have devices for the ideas you need. Twenty well-looked-at ads beat a hundred listed ones. Write down which advertisers you looked at and how many ads; name a library that wouldn't load as not checked.

## 2. Name the contribution

For each reference you use, say what it gives, in one of three roles:

| Role | It gives | Example |
|---|---|---|
| **Device** | A relationship or trick: an object crosses a screen, a flat thing becomes physical | Oatside's carton coming out of a laptop |
| **Craft** | Treatment only: lighting, set, texture, typography | Oatly's directional light and simple sets |
| **Layout** | Where things sit, in the abstract | A big headline over one centred object |

A direct competitor's ad gives layout only. Describe what you actually see in the image; don't credit it with things you are adding.

## 3. Keep other brands out of the image

Other brands' ads never go into `image_urls`. Write the device or craft into the prompt in words (`../make-static-ads/references/prompts.md` §1). The finished ad keeps none of the reference's product, words, logo or people. If a buyer could mistake ours for theirs, change it.

## 4. Showing them

When the marketer wants to choose, show the references with the board. "Your choice" → name them in the References column instead.
