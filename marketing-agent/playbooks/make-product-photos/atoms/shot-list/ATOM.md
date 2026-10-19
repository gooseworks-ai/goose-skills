---
name: shot-list
description: Internal step of make-product-photos. Turns the surface, the reference inventory and the house style into a slot-based shot list held to the honest-representation rule, then writes each shot as an engine call — a precise prompt, curated references, count, quality — ready for a dry-run quote.
---

# shot-list

**Reads:** the reference inventory (source-audit), the house-style card or the anchor hero, plain product facts, `references/shot-list-and-surfaces.md` §1–4, `references/fit-and-honesty.md` §2–3.
**Writes:** the shot-list table for the marketer; the call plan for the quote.

1. **Stack from the surface** (§1–2); drop slots the inventory cannot support, say why, offer a substitute.
2. **Per shot:** slot and job · style · composition (angle, framing, product % of frame, copy space and where) · light · scene and props · ratio · variant or sibling product · count.
3. **Honesty pass** against `fit-and-honesty.md` §2 — the one list; skincare lifestyle shows the product, not a perfected face; host devices accurate.
4. **People and hands** listed per shot — each needs the human's attestation; no real likeness; no children.
5. **Marketplace main image** → should be a real photograph; generated versions go to secondary slots.
6. **Write the call** per shot (§4): the row as `prompt` (including what must not appear), curated `reference_image_urls`, `count` 1 or 2, `quality`, `category`, known `controls` only.
7. **Present** the table (not the prompts), take edits, then dry-run each call and show the quotes as given.
