# Fidelity rubric — checking outputs against the real product

Load at Step 7. The engine's judge checks silhouette, materials, logo and colourway; this check is worth something only if it is **independent and more specific**. The engine's `passed` is necessary, not sufficient; `flagged` is shown to the human with its reason.

**What each output gives you** (`photos_read` `generation_id`): `status`, `final_image_url`, `thumbnail_url`, `quality_score`, `final_defect_code` / `final_defect_message`, `suggested_control_change`, `credits_charged`, `media_asset_id`, `attempts[]`; the generation carries `ratio`, `quality`, `overridden_controls`.

## 1. Checks, in order (stop at the first blocker)

| # | Check | How to look | Severity |
|---|---|---|---|
| F12 | **Honesty** | The `fit-and-honesty.md` §2 list: implied features, contents, results, size, food styling, invented marks | Blocker regardless of beauty |
| F2 | **Parts** | Count caps, lids, loops, straps, buttons, zips, pockets, laces, handles, pump heads — nothing added, missing or duplicated | Blocker |
| F3 | **Logo** | Right mark, place and size; crisp; not mirrored or re-lettered | Blocker |
| F4 | **Label and printed text** | Read every legible string by eye against the real label photo; OCR is a hint (staging read the same label as "51.4 ML" and "61.4 ML"). Text-shaped blur is OK only where the real text is also tiny | Blocker |
| F1 | **Silhouette and proportions** | Outline and key ratios (lid:body, strap length, collar, heel height) vs the same-angle real photo | Blocker |
| F5 | **Colour** | Same colourway under the scene's light; hero compared under neutral light; no bleed between variants | Blocker for hero/alts; major for lifestyle |
| F7 | **Scale** | Size vs hands, bodies, furniture, pockets plausible for the real dimensions (ask for them if the record has none) | Blocker for scale / in-use |
| F9 | **Hands, bodies, faces** | Finger count, joints, nails, grip pressure, skin–product boundary, eyes, teeth, jewellery merging | Blocker if visible |
| F8 | **Physics** | One light direction; shadows away from it; contact (no floating unless styled); reflections match the scene | Major |
| F10 | **Background** | Stray or duplicate products, ghost text, another brand's logo, warped lines, banding. A host device the product fits (a watch for a band) is allowed when shown accurately | Major; blocker if an unrelated brand appears |
| F6 | **Material and finish** | Matte vs gloss, metal type, weave and knit, transparency | Major (honesty if it implies a better material) |
| F11 | **AI look** | Plastic sheen, waxy skin, bokeh cutting through objects (airbrushed skin beside a skincare product is F12 `misleading`) | Taste; major if the house style is natural |
| F13 | **House style** | Background, light side, shadow, angle, crop and padding, grade, retouch, casting vs the style card; grid test against 3–4 existing heroes | Major for hero/alts; minor for mood |

## 2. Named reject reasons

Use exactly one of: `wrong_shape` · `extra_or_missing_part` · `logo_wrong` · `text_garbled` · `colour_off` · `finish_wrong` · `scale_wrong` · `physics` · `hands_or_body` · `background_artefact` · `ai_look` · `misleading` · `off_style` — plus a specific note ("text_garbled: back label at small sizes"). Use them in the verdict you show the human. Archive with no `reason` — the engine would turn it into a brand-wide "dont". A durable rule the human states goes through the shared save-learning atom.

## 3. When you can see images

Output and the same-angle real photo side by side; zoom on the logo, the label and any hands. Record which checks you did by eye.

## 4. When you cannot

Follow `../../../skills/honest-review/SKILL.md` §1–3.
- Run `gooseworks:media_analyze` (`action: "read"`) on the output's `media_asset_id` **and** on the same-angle reference photo — both free.
- Compare the two reads **field by field** and report each mismatch specifically:

| Field | From the reads | A mismatch looks like |
|---|---|---|
| Part and item count | lids, loops, straps, caps, items in a set named in the description | reference "white cap", output "two caps" |
| Label and printed text | `visible_text` | "DIVE DEEP" vs "DIVE DEEEP"; a mark the label does not carry |
| Colour words | the description's colour terms | "green bottle" vs "mint bottle" |
| Product identity and size | product type, size text (e.g. "51.4 ML") | a different product, or the mini instead of the full size |
| Extra things in frame | other products, other logos, people, hands | a second brand's logo; hands with no attestation |

- OCR misreads (staging read one label as both "51.4 ML" and "61.4 ML"): a text mismatch is "please check", not proof.
- Label the photo **"not checked by eye"** — never present the engine's pass as your own check — and give the human a three-item checklist aimed at what the reads could not settle (finish, scale, physics, the exact logo shape).

## 5. Calibrate first

Run the rubric once on one of the brand's real **product-only** photos (not an infographic or a lifestyle composite). If you would reject it, you are too strict (or reading the wrong reference).

## 6. Keeper vs reject — the water-bottle example

*32 oz matte powder-coat insulated bottle, colourway "Sage", laser-etched logo, chug lid with a carry loop, does not sweat.*

- **Hero keeper:** outline matches the real photo (lid ≈ 1/6 of body height); Sage reads as the same muted green under neutral light; broad soft highlight, no mirror reflections; logo correct, crisp, right size and place; one loop on the correct side; one contact shadow consistent with a left key; clean house background.
- **Hero reject:** a generic taller cap (`wrong_shape`); chrome highlights on a matte bottle (`finish_wrong`); warped logo letters (`logo_wrong`); mint or olive instead of Sage (`colour_off`); two loops (`extra_or_missing_part`); shadow falling toward the light (`physics`).
- **Scale keeper:** bottle-to-hand ratio plausible for a 27 cm bottle; five fingers; a real grip.
- **In-use reject:** condensation beads on the insulated bottle (`misleading` — an honesty fail, not taste); a second brand's logo on the backpack (`background_artefact`).
