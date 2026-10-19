---
name: source-audit
description: Internal step of make-product-photos. Sorts the brand's real product photos into usable references and everything else (text graphics, other sizes, duplicates, generated images), settles which size and colour the page sells, and names what is missing — so the engine only ever sees this exact product.
---

# source-audit

**Reads:** the product record (`gooseworks:brand_read` `product_ids`: `image_urls`, `variants`, `description`, `notes`, `ai_creative_notes`, `size_reference_urls`), the product's media (`gooseworks:media_list` `scope: "product"`, `scope_id` = product id), `gooseworks:media_analyze` `action: "read"` per asset, and — in "can see" mode — the images themselves.
**Writes:** the reference inventory (used by shot-list and fidelity-check).

1. **Sort every photo** into exactly one class:
   - **usable** — product only, this size / width / colour, readable enough;
   - **text graphic** — claim or ingredient overlays, infographics ("97% of test subjects agree…") — never a reference;
   - **other size / width / variant** — a mini, a slim band, another colour;
   - **duplicate** — same `content_revision` as another; the set takes the most suspicious class of any of its copies;
   - **possibly generated** — an earlier GooseWorks output (match `photos_read` outputs of every status by `media_asset_id` / `final_image_url`, and the kit's generated image URLs), or a generator filename (`hf_…`, `pomelli-image`, `dalle`, `mj_` / `midjourney`, `Gemini_Generated_Image`, `ChatGPT Image`, `firefly`, `leonardo`). `source.type: brand_catalog` only means it came from the store — stores carry AI images too.
2. **Size and format:** more than one size or format and no variants → ask "which size does this page sell?" and keep only that size's photos.
3. **What each usable photo shows:** angle (front / back / side / top / detail / in-hand), colour, parts, label text (by eye; `media_analyze` OCR is a hint — staging read one label as both "51.4 ML" and "61.4 ML"), background and props.
4. **Unaudited:** analysis `blocked_budget` or empty and no vision → ask the human what each photo shows.
5. **Current, real and yours:** "Is this still exactly what ships?" (packaging, label, formula, colour); "were any of these made with an AI image tool?" (always when unaudited, newly listed, or no original filename is visible); "these photos are yours to use?" (rights are marked unverified). Analysis `queued` / `processing` / `deferred` → read again later; `failed` → `action: "retry"` (free).
6. **Dimensions** from `notes`, `ai_creative_notes`, the label or the human — needed for scale and in-use shots.
7. **Output:** a table — photo · class · angle · colour · readable text · usable for (slots); then "missing": each unsupported slot, the photo that would unlock it (pre-launch: "export the back view from CAD") and how to get it in (step 8), and a substitute.

8. **Getting a new real image in** (only on the human's yes): shell host — `gooseworks:media_upload` scope `product`, `scope_id` = the product id, `kind: "image"`, `tags` naming the angle (`back`, `side`, `detail`; `render` for a render), **no `product_name`** (source `file` then `gooseworks:media_confirm`, or `workspace`; `bytes` only for a small file); chat host — the same with source `fetch` from a public https link, or the human adds it to the product's photos in the GooseWorks library; then re-run `media_list`. `kind: "reference"` + `product_name` makes an upload **the product's hero in the brand kit** — use it only when the human says this photo should be the main image (a new-packaging front, a new colourway's first real photo, a launch render they want in the ad kit). A product not yet in GooseWorks: `brand_update` `products` with `import_url` (`import_kind: "product_url"`), then `job_get` `kind: "product_import"`. New packaging: with the human's yes, replace the product's photos (`image_urls` + `replace_image_urls: true`) and archive the old approved outputs with **no** reason (Step 9); otherwise check every output's pack against the new photo.

Never offer a back, side or detail shot that no usable photo shows — the engine cannot be faithful to an angle it was never shown.
