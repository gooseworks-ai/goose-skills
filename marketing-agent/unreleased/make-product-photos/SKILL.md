---
name: make-product-photos
description: >-
  Use when the marketer says: studio photos of my product without a shoot, product photos for my store page, packshots on white, lifestyle or on-model shots, photos for the new colourway, fresh product imagery for ads, photos for our launch page, our packaging changed — redo the photos, I have no photographer. Delivers store-ready product photos generated from the brand's real product photos: a shot list built from the page slots (hero, alt angle, scale, detail, in use, lifestyle, on-model), only real photos of this product as references, matched to the brand's photography, every shot checked against the real product for shape, parts, logo, text, colour, finish, scale and honest representation, with a keep / maybe / reject verdict and a page order. The human picks the keepers. Never uploads to a store, never shows a size, part, feature or result the product lacks. Not for ads with text, infographics or screenshots — make-static-ads; not for marketplace listing sets (not covered yet).
---

# make-product-photos

The engine composes, generates, judges and retries. This playbook is the e-commerce creative director around it: it decides which pictures the page needs, curates which real photos the engine sees, turns each shot into a precise prompt, holds every scene to what the product physically is, checks each output against the real product, and keeps the catalogue looking like one shoot.

## What you get

- A **shot list** from the surface (store page, ads, social, email, launch page), each shot with its slot, composition, light, scene and ratio — agreed before anything is made.
- A **house-style card** derived from the brand's existing photos (when they can be seen), confirmed once and saved.
- The **photo set** as the page it fills: each photo with its use, the engine's status and score, this playbook's verdict (keep / maybe / reject + named reason), and who checked it (by eye, or engine only with a checklist for you).
- "What we could not make and why", and the credits actually charged.

## Before you start

**Hard rules:**

1. **Honesty:** a scene may show only what the product physically is and does — its size, contents, finish, colour and how it is used — from the product record, the real photos and the human's confirmation. Never a result unless it is a signed-off claim (`../../skills/claims-gate/SKILL.md`), never a feature it lacks (`references/fit-and-honesty.md` §2 is the one list).
2. **References:** only real photos of this exact product, size and colour; never text graphics, other sizes, duplicates or earlier generated images.
3. **Money:** nothing generates before the marketer's yes to the engine's quotes, shown one by one exactly as given — never your own sum (`../../skills/spend-gate/SKILL.md`, branch A); the hero runs first; a re-shoot is quoted again.
4. **People:** any shot with a person or a body part (hands included) needs the human's own attestation; no real likeness; no children.
5. **Keepers:** only the human's picks are approved into the brand kit; nothing is uploaded to a store.
6. **Honest review** (`../../skills/honest-review/SKILL.md`) and **plain words**: never name a playbook, tool, id, model or vendor to the marketer.

**Setup:**

0. **Workspace:** every file (`brand/photo-style.md`, the `ads/batches/` request lines) uses the brand coworker scope (`scope: {type: "agent", agent_id: <coworker_agent_id from the brand_read list>}`); no coworker → the default workspace with every path prefixed `brands/<brand-slug>/`, and tell the human.
1. **Connection.** No `gooseworks:` tools (after one `gooseworks:tools_load` for a missing group: `brand`, `media`, `files`) → say only: "Connect GooseWorks first — I make your product photos through it."
2. `gooseworks:get_started` with `wants: "image"` and the marketer's words (there is no photos value); its answer settles setup and the brand only — a card → wait for the press, then Step 1 (this is product photography, not ads). `gooseworks:account_whoami` once: `features.product_photos` on, credits available.
3. **Two modes, decided now:**
   - **Can see images** (a shell host downloads the reference photos and outputs and views them): derive the style card, check outputs by eye.
   - **Cannot see images** (chat hosts get links, not pixels): no style card is derived — the marketer picks their best current hero as the anchor; outputs are compared field by field against the reference's automatic read (Step 7) and labelled "not checked by eye".
4. **Mode:** new product photos · new colourway · seasonal refresh (lifestyle only; the hero never changes) · imagery request from the ads side (`Product imagery needed: for make-product-photos · …` lines in `ads/batches/*.md` in the brand workspace; answer under each: `Product imagery ready: <photo links> · <YYYY-MM-DD>`) · packaging changed (retire and reshoot) · **pre-launch** with only a render (Step 1).

## Steps

### 1. Fit check — can the studio photograph this honestly?
Reads: `gooseworks:brand_read` lean (`sections: ["summary","kit","products","learnings"]`; `product_ids` for the full record incl. `description`, `notes`, `ai_creative_notes`, `listed_at`) — a lean read returns every `must` and `dont` (photo "Don't …" rules, the claims sign-off); the saved house-style card (`brand/photo-style.md`, Step 3); `kit.brandType`; the product's type. Load `references/fit-and-honesty.md` §1.
- Map to `apparel` / `beauty` / `cpg`; hard goods → `cpg` with the risk said; electronics, furniture, jewellery, eyewear → lifestyle only or a real shoot; food service, hospitality, real estate → decline.
- **Software, apps, services:** one line — "this makes photos of physical products; screenshots and mockups are made as ad graphics instead" — and ask once whether there is a physical item (device, packaging, merch).
- **Pre-launch, render only:** with the human's yes, create the product if missing (`gooseworks:brand_update` `products`) and add the render as a product photo (Step 2, "getting a new real image in"; tag it `render`; it becomes the kit hero only if the human chooses); the render itself is the honest studio hero, unaltered; generate lifestyle only, at the render's angle, no screens or app UI; label the set "pre-production, render-based" and tell the human to caption launch-page images as renderings; ask for CAD exports for other angles; keep it out of the ad kit unless the human chooses.

### 2. Curate the real photos — the biggest lever
Run `atoms/source-audit/ATOM.md`. Reads: the product's photos (`gooseworks:media_list` `scope: "product"`; `media_analyze` read; your own eyes in "can see" mode). Writes: the reference inventory.
- Sort every photo: **product-only, this size / colour** (usable) · **text graphic or claim overlay** (never a reference) · **other size, width or variant** · **duplicate** (same `content_revision` — it takes the most suspicious class of any copy) · **possibly generated** (an earlier GooseWorks output — match against `photos_read` outputs of every status by `media_asset_id` / `final_image_url` and the full kit's generated image URLs — or a generator filename such as `hf_…`, `pomelli-image`, `dalle`, `mj_`, `Gemini_Generated_Image`, `ChatGPT Image`, `firefly`, `leonardo`). `source.type: brand_catalog` only means "came from the store" — stores hold AI images too (staging: Braxley's newest colourways). When photos are unaudited, the product is newly listed, or no original filename is visible (re-hosted `product-N-M` copies), ask "were any of these made with an AI image tool?"
- **Getting a new real image in** (a missing angle, new packaging, a render, a colourway's photo), always on the human's yes: `atoms/source-audit/ATOM.md` §8. An upload becomes the product's hero in the brand kit only when the human says this photo should be the main image; new packaging → replace the product's photos and archive old approved outputs with **no** reason (Step 9).
- More than one size or format and no variants → ask "which size does this page sell?" first.
- Analysis `blocked_budget` or empty → "unaudited": ask the human what each photo shows.
- Rights: the catalogue photos are marked unverified — one line: "these are yours to use?"
- Dimensions: `notes`, `ai_creative_notes`, the label (OCR is a hint, not ground truth), or ask.
- Offer only the slots the usable photos support; for each missing one, name the unlock ("a phone photo of the back on a white sheet"; pre-launch: "export the back view from CAD") and a substitute (e.g. the hero in a second crop).

### 3. House style
Load `references/shot-list-and-surfaces.md` §3. **A saved card** (`brand/photo-style.md` in the brand workspace, or the brand document "Photo house style — <Brand> — <date>") → show it, ask "still right?", use it in both host types, and save the changed version if it changes. No saved card and "can see": derive the card from the brand's existing product photography and approved earlier outputs (`gooseworks:photos_read` `status: "approved"`), ask "match or deliberately upgrade?", confirm it once. "Cannot see": the marketer's chosen anchor hero plus the kit's aesthetic stand in; no card is saved. **References vs anchor:** only this product's best real product-only photos go in `reference_image_urls`. An approved generated hero is a style anchor only — describe its angle, light, crop and background in the prompt, never pass it as a reference (errors compound). Never a sibling product or colourway as either (colour bleed).

### 4. Propose the shot list — slots, not styles
Run `atoms/shot-list/ATOM.md` (`references/shot-list-and-surfaces.md` §1–2). Stack from the surface (for "the new colourway": read the products with `detail: "full"` in Step 1, sort by `listed_at`, confirm — on a near-tie, ask which); apply the brand's saved "Don't …" photo rules; honesty pass on every scene (Hard rule 1; skincare lifestyle shows the product, not a perfected face); host devices shown accurately (right model, neutral screen, no invented UI); colourways as variants **or** sibling products (find the new one by `listed_at` and confirm). Infographics and text over images are ad graphics, not this job. Ask only what the brain cannot settle; let the marketer edit.

### 5. Build the calls and quote — the spend gate
Per shot: one call — product, `variant_id` if any, `category`, `count` 1 or 2 (always set it; retries are shared per call), the shot row written into `prompt` (composition, light, background, copy space, what must not appear), up to six curated `reference_image_urls` (same-angle product-only first), `controls` only with keys the engine is known to honour, `quality` (offer medium for lifestyle). `gooseworks:photos_generate` `dry_run: true` for each; show each quote one by one exactly as given (no total of your own); people or hands → the human's attestation in plain words. Wait for the yes.

### 6. Hero first, then the rest
Submit the hero call alone. Read it back (`gooseworks:photos_read` `generation_id`): the `ratio`, `quality` and `overridden_controls` actually used, and run the fidelity check on the hero — a blocker, or controls the shot needed dropped, stops the run and goes to the human before the rest is spent. In "cannot see" mode, show the hero link with its three-item checklist and ask "carry on with the rest?" before submitting the other calls (same quotes, no new price). Poll `gooseworks:job_get` (`kind: "photo_generation"`) for a bounded time; still queued → "I'll check when you're back" and end the turn — never resubmit (it pays again). `workflow_error` with nothing charged is an infrastructure failure: offer a fresh quote; quality failures carry `final_defect_code` / `final_defect_message`.

### 7. Check every output against the real product
Run `atoms/fidelity-check/ATOM.md` (follows `../../skills/honest-review/SKILL.md`; rubric in `references/fidelity-rubric.md`) on every `passed` and `flagged` output — `final_image_url`, `quality_score`, `final_defect_*`, `media_asset_id`. Honesty first, then parts, logo and text (by eye; OCR is a hint), silhouette, colour, scale, hands, physics, background, finish, house style. "Cannot see": `gooseworks:media_analyze` on the output's `media_asset_id` and on the same-angle reference, and compare them **field by field** — part and item counts, the readable label text, colour words, which product is shown — flagging each mismatch specifically ("reference label reads 'DIVE DEEP'; output reads 'DIVE DEEEP'"); label the photo "not checked by eye" and give a checklist aimed at what the reads could not settle. A re-shoot is quoted again, with the engine's `suggested_control_change` offered.

### 8. Present the set and the keeper pick
Lay it out as the page: slot, photo, use, engine status and score, verdict and reason, who checked it; recommend the page order (next to the current live hero when one exists). Say "generated from your product photos". Report the credits GooseWorks charged per call (`credits_charged`), as it reports them.

### 9. Record the decision
- Keepers the human picks: `gooseworks:photos_update` `approve` — on their words only (approved photos flow into ad generation).
- Rejects: `archive` with **no** reason — the engine turns any reason into a brand-wide "dont" the ad and video engines read, so the agent never writes one. A durable product rule the human states in their own words ("Don't show Dive Deep with a pump top — it has a flip cap") goes through `../../skills/save-learning/SKILL.md` (text starting `[photos YYYY-MM-DD]`, one idea each, own superseded ones retired). Fine-but-unpicked photos are left alone.
- Old approved photos the human retires (packaging changed, product changed): `archive` with **no** reason.
- The confirmed style card: `brand/photo-style.md` saved as the brand document "Photo house style — <Brand> — <YYYY-MM-DD>" through `../../skills/save-to-brain/SKILL.md` (`versioned: supersede`). A rule the marketer states in their own words ("never a white background for this range") → `../../skills/save-learning/SKILL.md`, text starting `[photos YYYY-MM-DD]`.

## Approval gates

1. **Shot list** — agreed before any quote.
2. **Spend** — the yes to the engine's quotes; the hero first; every re-shoot quoted again.
3. **Attestation** — for any person or body part, the human's own confirmation each time.
4. **Keepers** — the human's pick before anything is approved into the brand kit. Putting photos live is the human's act in their own store admin.

## Output and write-back

The set in GooseWorks (approved keepers linked to the product, available to the ad and video engines); the presented page in chat; the style card as a brand document and any rule the human states, through save-learning, on the human's word.

## Done when

You would put the keepers on your store page today, unedited — and no photo this playbook marked "keep" fails your own fidelity look (zero false passes): right size, shape, parts, logo, text, colour, finish and scale, nothing implied that the product does not do.

## Out of scope

- Ad creative, infographics, dimension callouts, text over imagery, screenshots and device mockups — **make-static-ads**.
- Product video — **make-video-ads**. Social posts — **run-organic-social**.
- Uploading to a store, marketplace or feed — the human's own act. Marketplace listing image sets — optimize-listings (backlog).
- Retouching or background-removing real photos; colourway line-ups in one frame.
