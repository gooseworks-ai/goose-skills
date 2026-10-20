# make-product-photos — test by hand

## Setup

1. Connect GooseWorks **staging**.
2. Link: `ln -s "$PWD/marketing-agent/unreleased/make-product-photos" ~/.claude/skills/make-product-photos`
3. Each output costs credits (60 at high quality on staging). Keep paid tests to 2–4 outputs.

## Test 1 — core category (beauty / apparel)

Brand with real product photos on file (staging: Personal Day moisturiser, or a Braxley Bands watch band). Say: **"I need three studio shots and two lifestyle shots of the moisturiser for the store page."**

It should:
1. Check fit (beauty → core); sort the real photos (on staging: one full-size bottle, one 15 mL mini, two claim graphics) and ask **which size the page sells**; use only product-only photos of that size; say which shots they support.
2. Shell host: derive the house-style card and ask once — match or deliberately upgrade? Chat host: ask you to pick the best current hero as the anchor; no card is invented.
3. Propose a slot-based shot list (hero, alt, detail, lifestyle…) — not "which styles?" — honest scenes only; let you edit it.
4. Write each shot into the prompt, set count 1–2, dry-run every call, show each quote one by one exactly as given (no total of its own), wait for your yes; then run the **hero alone first** and check the ratio and controls it actually used.
5. Check every output against the real photos (honesty first), say who checked what, and present the set as the page it fills with keep / maybe / reject + named reason.
6. Approve only your picks; archive only named rejects; save the style card.

**Passes if:** you would put the keepers on the store page unedited, and **no photo it marked "keep" fails your own fidelity look** (zero false passes): right shape, parts, logo, label text, colour, finish, scale; nothing implied the product doesn't do.
**Telltale failure:** a "keep" where the logo, label text, colour or shape drifted; a back view invented from a front-only photo.

## Test 2 — edge category (hard good)

"Three studio and three lifestyle shots of the water bottle." → maps to `cpg` and states the risk; refuses condensation on an insulated bottle; offers only angles the photos show; turns "3 + 3" into legal calls, each quote shown one by one as given.

## Test 3 — software brand (negative test)

Gooseworks (staging): "Product photos for our homepage." → one plain line that screenshots and mockups are made as ad graphics instead, one question whether there is a physical item (device, packaging, merch); no generation, no internal playbook named.

## Test 4 — on-model

Apparel: "On-model shots of the tee." → asks the human to confirm the attestation in plain words; no real likeness; no size/fit line drafted.

## Test 4b — colourway as sibling product

Braxley Bands: "photos for the new colourway". → finds the newest product by `listed_at` and confirms it (Retro and Strength were listed 13 s apart — it asks which); flags `hf_…` files as possibly generated and asks; gets a real photo in if none is usable (shell: upload as an angle image, not the hero; chat: link or GooseWorks library); uses only that band's own real photos (never a sibling colour as a reference); on-wrist shots show an accurate, neutral watch; asks attestation for hands.

## Test 4c — pre-launch, render only

"Studio and lifestyle photos for the launch page of our smart bottle — we only have a CAD render." → with your yes creates the product and registers the render; the render is the hero, unaltered; lifestyle only, no app screens; labelled pre-production; asks for CAD exports for other angles.

## Test 5 — packaging change

"Our label changed — redo the photos." → lists the approved photos of that product, on your yes archives them with no reason (no false brand rule), gets the new-pack photos in and replaces the product's photo list on your yes, then reshoots.

---

## Staging run — 2026-10-16 (stopped before the first paid call)

Brand Personal Day, product Dive Deep Mevalonic Moisturizer (beauty → core fit).

| Step | Call | What came back |
|---|---|---|
| Entitlement | `account_whoami` | `features.product_photos: true`, 4,165 credits |
| Product | `brand_read` `product_ids` | 4 image URLs, no variants, no dimensions, price 16.00 |
| Real photos | `media_list` `scope: "product"` | 4 `product_photo` assets (2000×2000), rights `unverified`, allowed uses reference + generation input |
| Audit | `media_analyze` on the front photo | "Green cylindrical bottle with a white cap labelled PERSONAL DAY"; visible text "Dermatologist Developed Made for Acne-Prone Skin … DIVE DEEP MEVALONIC MOISTURIZER Mevalonic Acid Zinc Hyaluronate Azelaic Acid Squalane 51.4 ML 1.8 FL. OZ." — the size the product record lacks, and the exact label text to check outputs against |
| Prior outputs | `photos_read` (Braxley Bands) | None yet |
| **Quote (stop)** | `photos_generate` `dry_run: true`, `category: "beauty"`, `count: 2`, hero prompt + front photo as reference | **2 outputs × 60 credits = 120 credits, 4 retries included** |

**What the playbook would show next:** the hero shot (×2) in the shot list with its slot, light and background from the style card, the other slots priced the same way, each quote shown one by one as given, "Go ahead with these quotes?" — **stopped; no generation call was made.**

Note for the full test: the label carries "Dermatologist Developed" and "Made for Acne-Prone Skin" — label text an output must reproduce exactly (F4), and claims make-static-ads may not lift off the label without approval.

**Round 2 adversarial run (same day, read-only + free quotes) added:** dry run validates nothing (invalid controls, wrong category, missing attestation, another brand's product, the software product all quoted); the real output shape (`quality_score`, `final_defect_*`, `suggested_control_change`, `credits_charged`, `media_asset_id`; generation `ratio`, `overridden_controls`); the only real staging generation never started and failed after ~36 h; Braxley analysis `blocked_budget`; the same label OCR'd as 51.4 and 61.4 mL. All folded into Hard rules and Steps 1–9.

## Round 2 fix pass (2026-10-16) — re-check by hand

- Chat host: each output is compared with the reference's automatic read on named fields (counts, label text, colour words, product and size) and every mismatch is named; quotes are shown one by one, never added up by the agent.
- The house-style card is saved as a brand document and reused next run ("still right?").
- An imagery request from the ads side gets a `Product imagery ready:` answer under it.
- Nothing internal (playbook or tool names) is said to you.
