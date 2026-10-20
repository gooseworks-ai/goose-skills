# Human version

- **What this is:** the step that turns a chosen reference ad plus the brand kit into the one finished prompt and ordered image list the image model gets. On the server this is the "composer": a model call that writes the prompt, followed by code that picks the images, numbers them and adds fixed lines.
- **Copied, not rewritten.** Every rule, line and image label below is the server's own text from gooseworks-app `origin/dev` (commit `42a3dec20`, read 2026-10-19). The agent plays the composer model and runs the code steps by hand. Places where the agent must work differently are marked **Agent adaptation**.
- **Sources (origin/dev):** `apps/api/src/services/ad-remix-pipeline.service.ts` — `composeCreativePrompt` 1994–2358, `buildComposeContext` 1292–1588, `selectReferenceImages` 394, `buildComposeReferenceAssets` 516, `selectTargetReferenceAssets` 605, `buildFinalImageManifest` 872, `reconcileUnavailableReferences` 970, `resolveReferencePlaceholders` 1034, `buildAttachmentManifest` 1086, `typographyLine` 1191, `withRatioAdaptation` 1236, `VARIANT_DIRECTIVES` 273, `promptWithItemAngle` 243, `processCreative` 3965 (image order 4385–4430, specimen 4707–4758, engine cap 4762). `services/ad-compose-output.ts` 3–60. `lib/brand-colors.ts` 327–583. `services/ad-remix-batches.service.ts` 649–752 (variant briefs), 2814–2876 (structure-only marker, colour plan).
- **Two paths.** Ads the brand owns are remixed from the reference image itself. Ads the brand does not own (curated library, competitor imports, community) go **structure-only**: the reference is reduced to an abstract blueprint and its pixels reach neither the composer nor the image model (`structure-blueprint.md`).
- **Colours are dealt per ad, in code.** Each ad in a batch gets a background / text / accent scheme from a fixed rotation so a batch never looks the same. `scripts/schemes.py` reproduces the server's maths exactly (checked against the TypeScript on 8 brand palettes).
- **The final call is `gooseworks:ads_render`** with the assembled prompt word for word. Then every render goes through the judge (`judge.md`), and fonts get a specimen image (`font-specimen.md`).
- **Gaps:** a few server inputs are invisible to an agent (uploaded font files, screenshot tiling, the composer's model and temperature, server-paid retries). Each is listed in §12 with what the agent does instead.

---

# Agent version

## 0. Notation and order of operations

- Fenced blocks are **verbatim server text**. `«...»` marks a value you substitute. Everything else (including `{{ref:ID}}`, `Image N`, quotes, dashes) is literal.
- "Include IF …" means the server adds that line only under that condition. Lines are joined with a single newline (`\n`) unless stated.
- Per ad ("creative"), run in this order. Do not skip or reorder.

| # | Step | Section |
|---|---|---|
| 1 | Read every input | §1 |
| 2 | Styling flags and normal vs structure-only | §2 |
| 3 | Colour scheme for this ad (once per batch) | §3 |
| 4 | Reference selection and the stable-ID inventory | §4 |
| 5 | Structure-only only: extract the blueprint | `structure-blueprint.md` |
| 6 | Build the composer input (instructions + context) | §5, §6 |
| 7 | Answer it as the composer: the six-field object | §7 |
| 8 | Gate the references, order the images, build the final prompt | §8 |
| 9 | Font specimen, if eligible | §9 + `font-specimen.md` |
| 10 | Engine cap, ratio adaptation | §10 |
| 11 | `gooseworks:ads_render` (dry run, quote, submit) | §11 |
| 12 | Judge and at most one retry | `judge.md` |

## 1. Inputs: every field the composer receives, and where an agent reads it

Read once per batch:

- `gooseworks:ads_template_read { template_id, brand_id }` → `result.template`.
- `gooseworks:brand_read { brand_id, sections: ["kit"], detail: "full" }` → `result.kit` (camelCase; this is the server's `BrandKit` object). The answer is large (~180 K characters on Graza); a shell host should save it and read fields with `jq`.
- `gooseworks:brand_read { brand_id, sections: ["learnings"], detail: "full" }` → `result.learnings` (rows `{id, kind, text, source, created_at}`, already ordered by confidence then newest).
- For the featured product: `gooseworks:brand_read { brand_id, sections: ["products"], product_ids: [«id»] }` → `result.products.items[0]` (snake_case).

| Server field (code name) | Agent reads it from | Used in |
|---|---|---|
| `template.title` | `ads_template_read` → `template.title` | `## Source template` |
| `template.description` | `template.description` | same |
| `template.layout_type` | `template.layout_type` | same; blueprint extraction |
| `template.style_tags` | `template.style_tags` | same |
| `template.mood_tags` | `template.mood_tags` | same |
| `template.text_complexity` | `template.text_complexity` (`low`/`medium`/`high`) | same; blueprint extraction |
| `template.remix_spec.prompt` | `template.remix_spec.prompt` (only when `remix_spec` is an object with a string `prompt`) | `## Template remix instructions` |
| `template.ratio` | `template.ratio` | ratio adaptation §10 |
| `template.source_kind` | `template.source_kind` | §2 decisions |
| `template.source_image_url` | `template.source_image_url` | the source image (view it; Image 1 on the normal path) |
| `template.remix_engine` | `template.remix_engine` | engine choice §11 |
| `kit.name` | `kit.name` | `## Brand` |
| `kit.description` | `kit.description` | "What they do" |
| `kit.audience` | `kit.audience` | "Audience" (single-product path only) |
| `kit.voice` | `kit.voice` | "Voice" |
| `kit.brandType` | `kit.brandType` | "Brand type" (single-product path only) |
| `kit.valueProps` | `kit.valueProps` | "Value props" (single-product path only) |
| `kit.proofPoints` | `kit.proofPoints` | "Proof points" (single-product path only) |
| `kit.websiteUrl` | `kit.websiteUrl` | "Website" (single-product path only) |
| `kit.messagingAngles` | `kit.messagingAngles` (`[{name, statement}]`, first 6) | "Messaging angles" |
| colour scheme | §3 (computed from `kit.primaryColor`, `kit.accentColor`, `kit.backgroundColor`, `kit.textColor`, `kit.palette`; gated by `kit.colorSchemesEnabled`) | Background / Text / Accent lines |
| `kit.primaryColor`, `kit.accentColor`, `kit.backgroundColor`, `kit.textColor`, `kit.paletteRead`, `kit.palette` | same names | palette lines when there is no scheme |
| `Typography:` line | `kit.typography` (`heading`, `body`, `accent`, `headingDescriptor`, `bodyDescriptor`, `accentDescriptor`, `source`) + `kit.fonts` (`heading`, `body`, `families`) | `typographyLine`, §6.3 |
| `kit.products` | `kit.products` (`name`, `adEligibility`, `aiCreativeNotes`) | "Products", per-product guidance, product-led gate |
| featured product | `products.items[0]`: `name`, `description`, `pricing`, `offers`, `notes`, `ai_creative_notes`, `size_reference_urls` | `## Featured product` |
| `kit.logoUrl` | `kit.logoUrl` | logo reference + logo lines |
| `kit.referenceImages` | `kit.referenceImages` (`[{url, productName, kind}]`; `kind` null = product photo) | §4 |
| `kit.docs` | `kit.docs` (`{name: text}`) | `## Brand research — «name»` |
| `kit.instructions` | `kit.instructions` | `## Brand instructions` |
| learnings block | `result.learnings` → §6.5 | learnings |
| User instructions (highest priority) | **the user's own chat words for this ad** (plus the per-ad angle line, §6.6). There is no second prompt. | `## User instructions` |
| variant directive | §6.7 (by the ad's variant index) | `## Variant directive` |
| `no_logo` | the user asked for no logo | logo lines |
| `product_name` | the product the user picked (exact kit name) | §4 |
| `reference_image_urls` | images the user attached, uploaded with `gooseworks:media_upload` (public https) | §4 user uploads |
| `apply_brand_colors`, `apply_brand_font` | the user's ask (default both true); overridden by §2 | colour / typography lines |

## 2. Decisions before composing

### 2.1 Styling flags (`effectiveStylingFlags`, 2528)

- `source_kind` is `competitor_scrape` or `curated` (or the template row is missing) → `applyBrandColors = true`, `applyBrandFont = true`, whatever the user asked.
- Any other `source_kind` (`upload`, `scraped_meta`, `community_source`, null) → the user's `apply_brand_colors` / `apply_brand_font` (default true each).

### 2.2 Normal vs structure-only (`readStructureOnlyIntent` 2551, `isStructureOnlySource` 2511, batches `resolveStructureOnlyAutoMarker` 2814)

The server stamps every non-grid batch with `{enabled: true, auto: true}`, then decides per template:

| `template.source_kind` | Path | What sees the source image |
|---|---|---|
| `competitor_scrape`, `community_source`, `curated` (any ad the brand does not own) | **structure-only** | Only the blueprint analyst. Not the composer, not the image model, not the judge. |
| anything else (`upload`, `scraped_meta`, null) | **normal** | Composer (to read the layout and set `source_media`), image model (Image 1), judge. |

Structure-only: run `structure-blueprint.md` first. It returns `«blueprint instruction»` (rendered text, already adjusted to this ad's assigned scheme) and `«structureMediaSlot»` (`none` / `screen` / `product`).

**Agent adaptation (isolation).** The server keeps the analyst and the composer apart. If the host can start a subagent, run the extraction there and pass back only the blueprint JSON. If not, after extracting, compose from the blueprint text alone and check the composed prompt carries no colour, typeface, prop, person detail or wording from the source that the blueprint does not state.

### 2.3 Logo (`processCreative` 4263, `LOGO_COMPOSITING_ENABLED = false` at 229)

Logo compositing is switched off on the server, so `logoCompositing = false` and `logoIsWordmark = false` always. Two states remain: `noLogo` (user asked for no logo) or not. `hasLogoRef = kit.logoUrl present AND NOT noLogo`.

## 3. Colour scheme per ad (`assignSchemesToBatch` 560, batches `resolveColorPlan` 2828)

Rule: derive 2–5 legible schemes from the kit, order them so neighbours differ most, then deal them in order across the batch's ads starting at a seeded offset. Every ad of the batch is numbered 0..n−1 in creation order (template order, then variant order).

- No plan (scheme = null) when `kit.colorSchemesEnabled === false` or fewer than 2 schemes derive. Null means the palette lines in §6.2.
- `applyBrandColors = false` does **not** remove the scheme. The colour lines switch to KEEP SOURCE, but the scheme is still used by the logo-lettering suffix (§5), the blueprint light/dark flip (`structure-blueprint.md` §6) and the judge's "Required color roles" line (`judge.md` §3). That is the server's behaviour; keep it.
- The server seeds with the batch UUID. **Agent adaptation:** use one stable string per batch (for example the batch file name) as the seed, and pass a running `start_offset` when several small batches belong to one campaign (the server does this for campaigns).
- **Chat host with no code execution:** do not hand-compute OKLCH. Use scheme = null for every ad. That is exactly the server's fail-open behaviour.

Run (Python 3, no packages). Output per ad: `background`, `ink`, `accent`, plus `on_accent` (= `readableInk(accent)`, used in the COLORS line) and `background_is_light` (used by the blueprint flip).

The script is `scripts/schemes.py` in this playbook, byte-for-byte as ported (its header names the server source and the usage line). Run: `python3 scripts/schemes.py '<kit-json>' <batch_seed> <n_ads> [start_offset]`.

## 4. Reference selection and the stable-ID inventory

### 4.1 Which brand images are candidates (`selectReferenceImages` 394, `applyCustomReferences` 450)

Let `all = kit.referenceImages`. Caps: `MAX_AUTO_REFERENCE_IMAGES = 3`, `MAX_ATTACHED_SIZE_REFS = 3`.

1. **No product picked (auto):** `refs` = the first 3 of `[every ref whose kind ≠ "own_ad", then every "own_ad" ref]` in kit order. `selected = null`.
2. **Product picked:** find `kit.products[]` whose trimmed name equals the pick, case-insensitive. If none (renamed), fall back to auto.
   - `refs` = the first 3 refs whose `productName` is **exactly** that product's name. Never another product's refs, never unlabelled refs.
   - If that gives none: the first 3 refs with `kind = "website_screenshot"` (software brands' real UI).
   - `selected` = that product: `name`, `description`, `pricing`, `offers`, `notes`, `aiCreativeNotes` (= `ai_creative_notes`), `hasImage = refs.length > 0`, `sizeReferenceUrls` = first 3 of `size_reference_urls`.
3. **User uploaded images** (`reference_image_urls`): the first 3 `http(s)` URLs **replace** `refs` entirely, each `{url, productName: selected?.name ?? null, kind: "user_upload"}`. If a product is selected, set `hasImage = true`.
4. Tall website screenshots: the server tiles them into square tiles and caps refs at 6 (`expandScreenshotRefs`, 478). **Agent adaptation:** the kit usually already holds the tiles (the server backfills them); use what the kit lists. If a screenshot is far taller than wide, leave it out rather than send it untiled.

### 4.2 The inventory with stable IDs (`buildComposeReferenceAssets` 516)

Build this list **in this order**. The order is reused for the final images.

1. IF `hasLogoRef`: `{id: "logo", url: kit.logoUrl, role: "logo"}`
2. For each size reference i = 1..: `{id: "size-reference-«i»", role: "size_reference", productName: selected.name}`
3. For each ref in `refs`, in order, with separate counters per role:
   - `kind = "own_ad"` → `own-ad-«n»`, role `own_ad`
   - `kind = "website_screenshot"` → `screenshot-«n»`, role `screenshot`
   - `kind = "user_upload"` → `user-upload-«n»`, role `user_upload`, `userIndex = n`
   - anything else (incl. `kind` null) → `product-«n»`, role `product`, `productName = ref.productName`

## 5. The composer instruction set (verbatim, with conditionals)

Build `composeInput` as these lines joined by `\n`, in this order. `structureOnly` = §2.2 path is structure-only AND a blueprint exists.

**Line 1**

IF structureOnly:
```text
You write prompts for an image-editing model (it receives ONLY the brand's own reference images — NO source ad).
```
ELSE:
```text
You write prompts for an image-editing model (it receives the source ad as an input image plus brand reference images).
```

**Line 2**

IF structureOnly:
```text
Write ONE prompt that builds the brand's ad to the FUNCTIONAL BLUEPRINT below, using the brand kit ALONE. The blueprint is an abstract layout derived from a competitor ad you must NOT reproduce — never copy its palette, typeface, photography, logo, mascot, wordmark, or wording; only follow its abstract structure.
```
then the line `«blueprint instruction»` (the rendered text from `structure-blueprint.md`).

ELSE:
```text
Write ONE prompt that recreates the source ad's LAYOUT and composition, restyled for the brand below.
```

**Always**
```text
Adapt the SUBJECT to what the brand actually sells (see 'What they do' / 'Products'). The source template's own product is a PLACEHOLDER ONLY: you MUST replace it with the brand's real product (or, when the brand has no physical product — e.g. software/services — an on-brand conceptual or lifestyle visual). NEVER keep the source template's product, packaging, or device shape and relabel it as the brand's; the source's original product must not survive into the output in any form. Do not invent an unrelated product.
```
```text
TARGET CONTRACT — source_media describes only the SOURCE slot. target_media describes the media the ADAPTED brand creative actually needs. Preserve the source's scene/action, framing, text/media arrangement, and signature device while changing the advertised subject. A source product slot may become target_media='screen' for software when a real screenshot is selected; a conceptual/graphic source stays target_media='none' and must not acquire a generic laptop or photo. Select only stable IDs from the reference manifest. Whenever the final prompt mentions a selected reference, write its exact {{ref:ID}} placeholder; never write or guess an image number.
```

IF structureOnly:
```text
SCENE — when the blueprint names a scene, stage the ad in it: the same setting class and the same kind of activity, adapted to what THIS brand's customer would be doing there. Do not substitute a scene of your own. If the brief names a moment or an audience, stage the scene there and with them. For a brand with no physical product, the conceptual visual FOLLOWS the scene; it never replaces it.
```

**Always**
```text
PHOTOREALISM (only when the ad shows a real person, human hands, or visible skin — otherwise SKIP this entire instruction and add none of it). Real ads of real people are shot on phones, not rendered. When the composition includes a person/hands/skin, write the prompt so the result looks like a real photograph, not a CGI render: specify candid phone-camera capture (e.g. 'shot on an iPhone, natural window light, candid, slight handheld feel'), realistic skin with natural texture and tone variation, and relaxed real-world posing. Because the image model has NO negative-prompt input, phrase what to AVOID directly in the prompt: avoid airbrushed / waxy / plastic / poreless skin, avoid studio-perfect or beauty-campaign lighting, and avoid oversaturated, glossy color (oversaturation reads as AI). Hands are the biggest tell — keep them simple and natural (relaxed, holding the product so fingers wrap a known shape, in a pocket, or partly out of frame) rather than spread, gesturing, or foregrounded; never let a hand show an implausible finger count or pose. Apply NONE of this to graphic-only, text-only, SaaS/UI, or product-only ads with no visible person or skin — those must stay unchanged.
```

IF any ref in §4.1 is a `user_upload`:
```text
THE USER UPLOADED THEIR OWN IMAGES for this ad (see the reference manifest: "User-provided image #K"). Their instructions may reference them by THEIR OWN numbering — "image 1", "#2", "the second image" — which counts ONLY their uploads, starting at 1; "template image" / "template_image" means the source ad template. In the prompt you write, translate every user-upload reference to its exact stable placeholder from the manifest (for example {{ref:user-upload-2}}), never to a guessed final image number. NEVER repeat the user's own numbering unresolved. Follow the role the user assigns each upload even when it differs from the default product-photo treatment.
```

**Colours** — exactly one of:

IF applyBrandColors AND scheme (§3):
```text
COLORS — RESTYLE TO BRAND, BY ROLE: the assigned scheme is authoritative. Preserve the source's RELATIVE contrast roles, split/multi-region arrangement, natural photographic scene, photo bleed, and texture, but map its background/field role to «scheme.background», its text role to «scheme.ink», and its accent role to «scheme.accent» (text ON an accent-filled button or pill is «scheme.on_accent»). If the source's absolute light/dark class conflicts with this assignment, invert the roles coherently instead of replacing the assigned scheme. Name those exact hex values in the prompt you write. NEVER preserve or reuse the source ad's own hex colours, and do NOT substitute the brand's primary colour for the assigned background. Text must read clearly against whatever it sits on.
```
IF applyBrandColors AND no scheme:
```text
COLORS — RESTYLE TO BRAND: be EXPLICIT in the prompt you write — name the exact hex colors from the brand context and recolor the ad's background and text to the brand palette.
```
IF NOT applyBrandColors:
```text
COLORS — KEEP SOURCE: the output MUST preserve the source ad's exact background color(s) and text colors — do NOT introduce brand colors; keep the source's color scheme.
```

**Typography** — IF applyBrandFont:
```text
TYPOGRAPHY — SURGICAL BRAND FONT (REPLACE, do not restyle): instruct the model to reproduce the source template's design faithfully (background, framing, layout, element placement), but RE-LETTER every piece of on-image text in the brand's font named on the context's 'Typography:' line, rendered in THAT font's OWN letterforms. The brand font fully REPLACES the template's lettering — from the template keep ONLY the text's placement, size, and color; discard the template's font shape, weight character, and any hand-lettered/script/decorative treatment. HARD RULE for the prompt you write: name the exact brand font and state the text is set in that font; do NOT describe the text as the template's font, and NEVER write the brand font as 'styled as' / 'in the style of' / 'made to look like' the template's lettering (that makes the model keep the template font). NEVER copy a font name out of the brand-research docs; the 'Typography:' line is the renderable one to use.
```
ELSE:
```text
TYPOGRAPHY — KEEP SOURCE: the output MUST preserve the source ad's exact typography — the same font family, weight, and case as the source image. Do NOT swap in a brand font.
```

**Always**
```text
Name the real product (when reference photos are attached, instruct the model to depict those products faithfully AND to preserve each product's true real-world proportions — its exact height-to-width ratio and silhouette from the photo — never stretched, elongated, or squashed).
```
```text
PRODUCT FIDELITY IS THE HARD INVARIANT. When product reference photo(s) are attached, tell the model the reference is the SINGLE SOURCE OF TRUTH for the featured product and to reproduce it faithfully — the exact silhouette, part count and arrangement, hardware (hinges, rivets, pivots, wheels, handles, folds), surface material and finish, and any on-product markings — changing ONLY the surrounding scene and staging. Forbid simplifying it, smoothing detail away, or substituting a generic same-category look-alike. If the product's exact form cannot be preserved inside the source's staging, keep the product faithful and adapt the staging — never distort the product to fit the layout.
```
```text
ON-PRODUCT TEXT MUST BE EXACT AND LEGIBLE. Any text, wordmark, logo, or lettering printed ON the product itself (a garment's chest/back print, a label, embossing, a bottle's front text) must be reproduced EXACTLY as on the reference — the same words, correctly spelled, sharp and readable, and in the correct left-to-right reading orientation. It must NOT be mirrored, reversed, backwards, warped into gibberish, smudged, or partially formed — even when the product is worn, tilted, curved, or seen at an angle. Instruct the model explicitly: keep on-product lettering crisp and forward-reading; if a print would be distorted by the pose or angle, favor an angle where it reads correctly rather than rendering garbled text.
```
```text
STAGING MUST FIT THE PRODUCT (scale + context). Sanity-check the source's composition against the brand's real product before reusing it. If the source stages its hero on a balance/seesaw, floating amid counter-weight props, held by tiny figures, or in a slot sized for a small object, the swapped-in product must still read at its TRUE real-world size — keep it the dominant, correctly-scaled subject and size any surrounding props realistically relative to it so it never looks miniature or toy-like. If the source's concept is nonsensical for this product (e.g. a food-plating layout for a metal tool), neutralize or drop the gimmick and stage the product plainly rather than forcing an incoherent scene. Prefer a coherent, on-context ad over a literal copy of an ill-fitting layout.
```

**Size** — IF the selected product has size references:
```text
SIZE IS SET BY THE SIZE-REFERENCE IMAGE(S) identified in the reference manifest, which show the real product at true scale beside people / hands / known objects. In the prompt you write, instruct the model to reproduce the product at EXACTLY that scale: the SAME size relative to the hands, people, and objects shown there (e.g. if a child sets it on the floor to use it, it is a floor-sized unit, NOT something held up in one hand). Do NOT describe the product as 'compact', 'handheld', 'mini', 'travel-size', or 'small', and do NOT infer its size from its name or category — the size reference OVERRIDES every such assumption. State the real scale explicitly and forbid shrinking it. Use the reference ONLY for scale — never copy its hands, people, objects, or background into the ad.
```
ELSE:
```text
ESTIMATE THE PRODUCT'S REAL-WORLD SIZE. Read the product's declared weight / amount / volume / count from the brand context (name, description, pricing, product details) and instruct the model to render it at a physically-plausible size relative to hands, surfaces, and props — a 60-count bottle, a 250ml can, and a travel sachet are visibly different sizes.
```

**Logo** — IF noLogo:
```text
Render NO logo anywhere in the image — no brand mark, wordmark, icon, or lettermark. The finished ad must contain no logo at all. Instruct the model NOT to invent, add, or imply a logo, and not to leave a placeholder for one.
```
ELSE (compositing is off, so this is the only other branch):
```text
If a logo reference image is attached, place the brand's real logo and reproduce it exactly, in its OWN colours, directly on the background with NO solid bar/plate/box behind it — never invent, redraw or RECOLOUR a logo.
```
… and IF a scheme exists, the same line continues (no newline) with:
```text
 If the brand name must be lettered because no usable logo reference is attached, set it in «scheme.ink» only — never the accent, the assigned background, or any palette colour — and keep the mark identical on every ad in the batch.
```
(The server's wordmark line applies only when the logo is composited, which is off, so it never appears.)

**Always**
```text
MIRROR the source ad's text density exactly: if the source has NO headline or body copy (product + scenery only), the output must add NONE — no headlines, no taglines, no extra logos or labels beyond what the source carries. Only when the source itself contains copy do you rewrite that same amount in the brand's voice — short and punchy. ALL visible text must be real words, correctly spelled, and legible — never lorem ipsum or garbled glyphs.
```
```text
SAFE MARGIN: keep the logo, wordmark and every line of text at least 5% of the canvas width inside all four edges — nothing may touch, hug, or run off an edge.
```
```text
COPY MUST READ AS ONE COHERENT MESSAGE. Read every headline, subhead, and line you write TOGETHER, top to bottom — they must combine into a single sensible, grammatical marketing message. Do NOT leave a stray, dangling, or grammatically-broken fragment (e.g. a lone connective word like 'As', 'Of', or 'The' floating on its own line), and do NOT stack unrelated word-fragments that don't form a real sentence or phrase. Prefer FEWER words that clearly say something over more words that don't parse. If a line can't be read as intentional copy, cut or rewrite it.
```
```text
Any text that belongs to the SOURCE template's own product, brand, photo, or production — rather than to the ad's reusable structure — must NOT be copied verbatim. This covers: watermarks and source/creator attribution or handles; draft, sample, or sequence labels; certification, compliance, regulatory, or origin marks; and the source product's specific feature, spec, measurement, claim, or packaging callouts. These describe a DIFFERENT product than the brand's, so in the prompt either REPLACE them with the brand's own equivalent messaging or DROP them entirely — never reproduce them. Carry over only the ad's structural copy (headline, CTA, brand name), rewritten for the brand.
```
```text
CLAIMS MUST BE GROUNDED. Any factual claim in the copy — a statistic, percentage or number, rating, review count, award, money-back/guarantee, clinical or scientific assertion, superlative (#1, best, leading, fastest, proven), or named integration/partner — may appear ONLY if it is present in the brand context above (Proof points / Value props / brand facts / product details). NEVER invent, round up, or embellish a number or claim, and never restate the source template's claim as the brand's. When the brand provides no verifiable proof, write benefit- or emotion-driven copy (what the customer feels/gets) instead of fabricating proof. This is the SAME standard the render judge enforces (claims_grounded) — satisfy it here so it never has to reject the image.
```
```text
LAYOUT & SIGNATURE MECHANIC IS A HARD INVARIANT. Identify the source ad's signature visual device — its distinctive creative mechanic (e.g. a billboard/poster mockup, benefit-callout arrows around the product, a phone/device hero, an incoming-call or lock-screen notification UI, a before/after or us-vs-them comparison table, a hand holding the product, a testimonial/quote card, a search-bar concept) together with its overall layout and hierarchy — and PRESERVE it. Restyle its colors, fonts, and copy and swap the product WITHIN this same mechanic and composition. Do NOT substitute a different layout, replace the signature device with a generic product-on-background or logo-on-color-field shot, or collapse a multi-element composition into a plain hero. The ONLY exception is the STAGING rule above: if the mechanic is genuinely nonsensical for this product, neutralize that ONE gimmick — never discard the whole composition. Preserve the source's hierarchy and overall design quality.
```
```text
SOURCE/TARGET MEDIA RULE: Set source_media from the SOURCE layout only, then set target_media from the brand subject you actually adapt into that SAME structural role. If source_media='none' (text/logo/shapes only, no image slot), target_media MUST remain 'none': add no photo, screenshot, product, device, or app window. If the adapted target needs software UI, select target_media='screen' and a REAL provided screenshot, then preserve the source's scene/action, framing, media position, and signature device while presenting that screenshot naturally in the adapted subject; do not default to a generic laptop hero. If target_media='product', select the brand's real product photo and reproduce it faithfully in the preserved structural role. If target_media='none', keep the result conceptual and select no product/screenshot reference. NEVER invent, redesign, or fabricate UI/dashboard content, and never introduce an on-screen UI or boxed image the source structure does not support.
```
```text
DEVICE SCREENS GO ON THE SCREEN ONLY. If the source shows a device (phone, tablet, laptop) from the BACK, closed, powered-off, or with a blank screen, KEEP that surface blank — never paint a display, app, website, or image onto the back, lid exterior, or edge of a device, and never turn an off/blank screen into an active one. Only a device shown screen-forward may carry on-screen content, and only a REAL provided screenshot. If no screenshot is provided for this brand, do NOT invent app or website UI — leave the screen blank/reflective or use a conceptual visual instead.
```

IF a product is selected AND it has no reference photo (`hasImage` false):
```text
The featured product "«selected.name»" has NO reference photo attached — write the prompt so the model renders it generically from its description, and explicitly forbid copying the appearance of any attached image's product.
```

IF productLed (`kit.products.length > 1` AND a product is selected; `kit.products` counts every product, hidden ones too):
```text
This brand sells MULTIPLE products, but the ad must feature ONLY the selected product in the '## Featured product' block. Make that product's fidelity to its attached reference photo(s) the TOP priority. Do NOT depict, name, or blend in any of the brand's other products; keep the rest of the brand presence to its colors, logo, and voice.
```

**Always — the output instruction (`COMPOSE_OUTPUT_INSTRUCTION`, ad-compose-output.ts 3)**
```text
Return a JSON object with all six fields: prompt (the complete image-generation instructions), title (a 2-4 word ad name), source_media ('none', 'screen', or 'product'; null only if the source media slot cannot be determined), target_media ('none', 'screen', or 'product'; the media the ADAPTED brand creative actually needs), adapted_subject (one short sentence describing the brand subject/action that replaces the source subject; null only when no subject adaptation is needed), and reference_ids (the stable IDs of the brand references the final prompt requires; use [] when none are required). Put the full prompt inside the prompt field, and include no prose outside the object.
```

Then an empty line, then the **context** (§6).

**Normal path only:** after the text, the server attaches the source image with the label `SOURCE AD (decide source_media from this image):`. The agent views `template.source_image_url` at that point. Structure-only: no image.

## 6. The context block (`buildComposeContext`, 1292)

Definitions: `adProducts` = `kit.products` without `adEligibility = "hidden"`. `productLed` as in §5. Lines with no value are omitted.

### 6.1 `## Source template` (omitted entirely when structure-only)

```text
## Source template
Title: «template.title»
Description: «template.description»
Layout: «template.layout_type»
Style: «template.style_tags joined ", "»
Mood: «template.mood_tags joined ", "»
Text density: «template.text_complexity» (mirror this — see text rule)

## Template remix instructions (authoritative — follow them)
«template.remix_spec.prompt»
```
(The blank line and the remix block appear only when `remix_spec.prompt` exists.)

### 6.2 `## Brand`

```text
## Brand
Name: «kit.name»
Brand name casing: write the name exactly as "«kit.name»" — preserve its capitalization, do not uppercase or title-case it.
What they do: «kit.description»
Audience: «kit.audience»                         ← omitted when productLed
Voice: «kit.voice»
Brand type: «kit.brandType»                      ← omitted when productLed
Value props: «kit.valueProps joined " | "»       ← omitted when productLed
Proof points: «kit.proofPoints joined " | "»     ← omitted when productLed
Website: «kit.websiteUrl»                        ← omitted when productLed
Messaging angles (available copy directions — lead with the one that best fits this ad): «first 6 of kit.messagingAngles as "name — statement", joined " | "»
```

Colour lines, exactly one group:

IF applyBrandColors AND scheme:
```text
Background: «scheme.background» — this is the authoritative field colour for the ad. Preserve natural photographic scenes, photo bleed, texture, and split/multi-region layouts; use the assigned colour in their graphic/background roles rather than flattening the whole scene into a solid field. Do not substitute the brand's primary color for it.
Text: «scheme.ink» — headline and body text.
Accent: «scheme.accent» — buttons and highlights only, never the dominant field.
Text must read clearly against whatever it sits on.
```
IF applyBrandColors AND no scheme (each line only when the value exists; the palette line only when it has more than one colour):
```text
Primary color: «kit.primaryColor»
Accent color: «kit.accentColor»
Brand background colour: «kit.backgroundColor»
Brand text colour: «kit.textColor»
How this brand uses colour: «kit.paletteRead»
Brand palette (an unordered set, not a ranking): «kit.palette joined ", "»
```
IF NOT applyBrandColors:
```text
Colors: KEEP the source ad's own background color(s) and text colors exactly as in the source image — do NOT recolor to a brand palette.
```

Typography line: IF applyBrandFont, the `Typography:` line from §6.3. ELSE:
```text
Typography: KEEP the source ad's own typography — the same font family, weight, and case as in the source image. Do NOT swap in a brand font.
```

IF no product is selected AND `adProducts` is not empty:
```text
Products: «first 4 adProducts names joined ", "»
```

Logo line: IF noLogo:
```text
Logo: render NO logo anywhere in the image — no brand mark, wordmark, icon, or lettermark. The finished ad must contain no logo at all. Do NOT invent, add, or imply a logo, and do not leave a placeholder for one.
```
ELSE IF `kit.logoUrl`:
```text
Logo: the brand's REAL logo is attached as a reference image — reproduce it exactly as given; never redesign, restyle, or invent a logo. Place it directly on the existing background; do NOT add a solid bar, plate, box, card, or panel behind the logo.
```
ELSE: no logo line.

### 6.3 The `Typography:` line (`typographyLine` 1191, `familyForRole` in ad-font-reference.service.ts 69)

```text
Typography: headings in «heading» («typo.headingDescriptor»), body in «body» («typo.bodyDescriptor»)«accentPart» — render text in this EXACT font family, in its own letterforms.
```
- `typo` = `kit.typography`. (If the kit has none, the server falls back to its curated font library, which an agent cannot see; see §12.)
- `heading` = `sanitize(familyForRole("heading"))`, falling back to `typo.heading`. `body` = `sanitize(familyForRole("body"))`, falling back to `typo.body`.
- `«accentPart»` = `, accent in «typo.accent»` plus ` («typo.accentDescriptor»)` when there is one; empty when `typo.accent` is empty.
- `familyForRole(role)` — `userChose = kit.typography.source === "user"`; `extracted = kit.fonts.heading ?? kit.fonts.families[0] ?? null`:
  - heading: userChose → `typo.heading ?? extracted`; else `extracted ?? typo.heading`.
  - body: userChose → `typo.body ?? kit.fonts.body`; else `kit.fonts.body ?? last of kit.fonts.families ?? typo.body`.
  - accent: userChose → `typo.accent ?? typo.heading ?? extracted`; else `extracted ?? typo.accent ?? typo.heading`.
- `sanitize(raw)`: take the text before the first comma, trimmed; null if empty or starts with `var(`; strip quotes; null if it is a generic family (`sans-serif`, `serif`, `monospace`, `cursive`, `fantasy`, `system-ui`, `ui-sans-serif`, `ui-serif`, `ui-monospace`, `ui-rounded`, `-apple-system`, `blinkmacsystemfont`, `math`, `emoji`, `inherit`, `initial`, `unset`); drop a leading `__`, a `_Fallback`, a trailing `_` + 4–8 hex digits, a trailing `-v2`/`_3` style suffix; turn `-`/`_` into spaces; title-case each word except all-caps words of 3 letters or fewer (`ITC` stays `ITC`).
- Example (Graza, staging): `kit.fonts.heading = "ITC Garamond Condensed"`, `kit.typography = {heading: "Bebas Neue", headingDescriptor: "tall condensed display sans", source: "mapped"}` → `Typography: headings in ITC Garamond Condensed (tall condensed display sans), body in ITC Garamond Condensed (tall condensed display sans) — render text in this EXACT font family, in its own letterforms.` The server pairs the extracted name with the stand-in's descriptor; keep it as is.

### 6.4 `## Featured product` (only when a product is selected)

```text
## Featured product (user-selected — the ad must feature THIS product, no other)
Name: «selected.name»
Description: «selected.description»
Price: «price»
Current offer: «selected.offers»
Product details:
«selected.notes, first 1200 characters»
Creative guidance for THIS product (written by the brand team — you MUST follow it when composing this ad; it tells you how to depict / position this specific product and what to avoid):
«selected.aiCreativeNotes, first 1200 characters»
```
- `«price»` = the pricing text trimmed; `Free` when it is "free" or every number in it is 0; line omitted when empty.

Then the size line. IF size references exist:
```text
Size: the attached size-reference image(s) show this product at its TRUE real-world scale beside people / hands / objects — reproduce that scale exactly (the same size relative to those people/hands/objects). Do NOT treat it as compact/handheld/mini or shrink it to fit a hand unless the reference shows that; the reference overrides any size guess. Use it ONLY for scale — never copy its hands, people, objects, or background.
```
ELSE:
```text
Size: estimate this product's real-world size from its declared weight / amount / volume / count (name, description, pricing, details above) and keep it at a physically-plausible scale relative to any hands, surfaces, and props.
```
Then IF `hasImage` is false:
```text
No reference photo is available for this product — do not claim photo fidelity; describe it from the name/description only, and never borrow another product's appearance.
```

### 6.5 Learnings block (`loadBrandLearningsBlock` 1960; `formatLearningsForCompose`, `formatAdjustmentForCompose`, `REASON_DIRECTIVES` in ad-brand-learning.service.ts 261, 591, 459)

Take the **first 8** rows of `result.learnings` (the server's `COMPOSE_INJECTION_LIMIT`). Group by `kind`; each row is `- «text»`; omit empty groups; omit the whole block when no group has rows:
```text
## What we've learned about this brand's ads (from feedback — apply these)
ALWAYS (non-negotiable):
- «must rows»
AVOID:
- «dont rows»
PREFER:
- «do rows»
Template guidance:
- «template_hint rows»
Notes:
- «insight rows»
```

Recurring-rejection block. The server recomputes it from reason chips; an agent reads it from the active learning with `source = "feedback_reasons"`, whose text has the form `Recurring ad-feedback failure modes over the last «N» days («M» flagged ads): «reason» ×«count», …`. For each reason listed, in that order, add its directive. Append after a blank line:
```text
## Recurring rejection reasons for this brand — fix these (from the user's own feedback)
- «directive per reason»
```
Directives (verbatim):
```text
wrong_product: PRODUCT ACCURACY (this brand keeps rejecting ads for the wrong product): the attached product reference photos are the ground truth. Reproduce that exact product — same shape, packaging, label, materials and proportions. Never substitute, restyle, relabel or invent a product. Stage it so more than one face/angle of the product reads clearly, so its real form is unambiguous.
brand_or_logo_wrong: LOGO ACCURACY (this brand keeps rejecting ads for a wrong or garbled logo): do NOT draw, letter or invent the logo or wordmark. The real logo is placed as a separate composited layer — leave a clean, flat, unobstructed area for it and render no other logo-like mark, badge, monogram or brand lettering anywhere in the image.
off_brand: BRAND FIDELITY (this brand keeps rejecting ads as off-brand): stay strictly inside the brand kit. Use ONLY the brand's palette — no invented accent colors, no off-palette gradients, no decorative colors outside the kit — plus the brand's typographic style and tone of voice. No generic stock-ad styling.
text_garbled: TEXT SAFETY (this brand keeps rejecting ads for garbled text): minimise text baked into the image. Any on-image copy must be a few short words in a simple, high-contrast weight. Leave clean flat space where the headline, subhead and CTA are composited on top as real type. Never render dense paragraphs, small print, or decorative lettering.
weak_copy: COPY (this brand keeps rejecting the copy as weak): write the headline and CTA in the brand's own voice with one concrete, specific benefit — never a generic slogan. Each variant must take a genuinely different angle rather than restating the same claim.
ai_or_distorted: REALISM (this brand keeps rejecting ads as AI-looking or distorted): the output must read as a real photograph, not a render. Avoid warped geometry, melted edges, duplicated or malformed hands and limbs, waxy poreless skin, and over-glossy CGI lighting. Prefer a simple, clean composition the model can render without artefacts.
too_busy: SIMPLICITY (this brand keeps rejecting ads as too busy): one focal point. Show the product, one short headline and at most one supporting element. No collage of badges, icons, stickers or callouts, no blocks of small text, and generous empty space around the subject.
```
(The `«reason»: ` prefix is the lookup key, not part of the line.)

### 6.6 User instructions (`promptWithItemAngle` 243)

`«user words»` = the user's chat request for this ad, trimmed. If this ad has its own messaging angle and the words do not already contain it (case-insensitive), append after a blank line:
```text
Messaging angle for THIS ad (lead the headline and visual with it): «angle»
```

### 6.7 Variant directive (`VARIANT_DIRECTIVES` 273, `variantForIndex` 350)

Ad variants of one template are numbered 0, 1, 2, … Variant 0 gets none. Variant k ≥ 1 gets entry `(k − 1) mod 3`; past one cycle the label gains `-2`, `-3`, … (label is for records; the directive text is the same).

```json
[
  {"label": "hook-question", "directive": "Variant: lead with a short provocative QUESTION as the headline hook instead of a statement."},
  {"label": "benefit-direct", "directive": "Variant: make the headline a direct, concrete BENEFIT claim (what the customer gets), not a tagline."},
  {"label": "social-proof", "directive": "Variant: frame the copy as SOCIAL PROOF (e.g. loved-by/typical-customer framing) while keeping the same layout."}
]
```

When the playbook sets an angle per ad instead, the server's brief form is (`variantForBrief`, batches 715):
```text
Variant brief: «angle directive»
Use this exact messaging direction for this variant: «message»
```
with angle directives (`VARIANT_BRIEF_ANGLE_COPY`, batches 649):
```json
{
  "auto": "Use a distinct, conversion-oriented message angle for this variant.",
  "hook-question": "Lead with a short provocative question as the headline hook instead of a statement.",
  "benefit": "Make the headline a direct, concrete benefit claim that makes the customer outcome obvious.",
  "problem": "Open with the customer pain point or tension, then position the product as the resolution.",
  "product-proof": "Lead with concrete product proof: a mechanism, feature, ingredient, demonstration, or measurable reason to believe.",
  "social-proof": "Frame the copy around trust, credibility, ratings, customer proof, or loved-by language.",
  "objection": "Address the strongest purchase objection directly, reducing perceived cost, effort, complexity, or risk.",
  "use-case": "Anchor the creative in one specific audience, moment, or job-to-be-done so the use case feels immediately relevant.",
  "comparison": "Contrast the product with the old way or a familiar alternative, making the differentiator concrete without inventing competitor claims.",
  "offer": "Make the offer, promo, bundle, price, or limited-time reason to act the primary message.",
  "aspiration": "Lead with the identity, lifestyle, transformation, or sense of belonging the customer wants to move toward.",
  "educational": "Teach one useful product fact, ingredient, feature, or use case in a clear visual way."
}
```

### 6.8 Assembly order of the context

```
[§6.1 source lines (none when structure-only)]
(blank)
IF productLed:  §6.4 featured, (blank), §6.2 brand
ELSE:           §6.2 brand, then (blank) + §6.4 featured if a product is selected
(blank)
## Available brand reference images (select by stable ID)
«reference manifest, §6.9»
IF no product selected and any adProduct has creative notes:
  (blank)
  ## Per-product creative guidance (brand-authored — follow the guidance for whichever product you feature)
  - «name»: «aiCreativeNotes, first 600 chars»        (at most 8 products)
IF NOT productLed: for each kit.docs entry: (blank), ## Brand research — «name», «text»
IF kit.instructions: (blank), ## Brand instructions (standing guidance from the brand kit — apply to every ad), «instructions»
IF learnings block: (blank), «§6.5»
IF user words: (blank), ## User instructions (highest priority), «§6.6»
IF variant directive: (blank), ## Variant directive, «directive»
```

### 6.9 The reference manifest the composer sees (`buildAttachmentManifest` 1086)

First line, normal path only:
```text
SOURCE TEMPLATE: visible to compose for source structure only; it is not a selectable brand reference.
```
Then one line per inventory item (§4.2), in order:
```text
[ID: logo] Brand logo. If the prompt explicitly refers to it, write {{ref:logo}}.
[ID: «id»] Size reference for «productName or "the selected product"» (SCALE ONLY). Select it only with a physical-product target; take no scene or appearance from it. Refer to it as {{ref:«id»}}.
[ID: «id»] Real product UI screenshot. Select it only when target_media='screen'; reproduce its interface faithfully. Refer to it as {{ref:«id»}}.
[ID: «id»] One of the brand's OWN past ads (a finished advertisement). Style cue only — it can NEVER satisfy target_media='product' or 'screen'. Select it only to echo the brand's look, and refer to it as {{ref:«id»}}.
[ID: «id»] User-provided image #«userIndex». Follow the user's assigned role; refer to it as {{ref:«id»}}.
[ID: «id»] Real product photo of «productName». Select it only when target_media='product'; reproduce it faithfully. Refer to it as {{ref:«id»}}.
```
(The product line drops ` of «productName»` when there is none.) Then, if the inventory is empty:
```text
NO brand reference assets are available. Return reference_ids=[] and do not claim a grounded product or UI reference.
```
else:
```text
In reference_ids, copy only IDs from this manifest. Whenever the prompt refers to one, use its exact {{ref:ID}} placeholder; never guess an image number.
```

## 7. Compose: what the agent produces

**Agent adaptation.** Write the assembled `composeInput` (§5 + §6) to a file, read it top to bottom, then answer it as the composer would: one JSON object, nothing else. The server's composer is a separate model call (`ADS_COMPOSE_MODEL`, Opus 4.8 in production, temperature where allowed 0.4). The agent writes its own answer here; it must follow the instructions as written and add no rules of its own.

Fields and their exact descriptions (`composeSchema`, ad-compose-output.ts 11):

| Field | Type | Server description (verbatim) |
|---|---|---|
| `prompt` | non-blank string | "The final image-generation prompt: restyle the attached source ad for the brand." |
| `title` | non-blank string | "A 2-4 word user-facing name for this ad (e.g. 'Gut Health Hero'). Never include the source template's original brand name." |
| `source_media` | `none` / `screen` / `product` / null | "Looking at the SOURCE ad image, what MEDIA slot does its layout have for imagery? 'none' = text + logo + abstract shapes only, NO place for any photo/screenshot/product (e.g. a quote card or text hero). 'screen' = it shows a device/app/dashboard surface (laptop, phone, browser, UI card) where a real product SCREENSHOT belongs. 'product' = it has a physical product / photo hero slot. Pick the single best fit from the SOURCE only — ignore what the brand sells. This preserves the source structure; target_media separately decides which brand references the adapted creative needs. Use null if the slot cannot be determined; this preserves references without guessing a classification." |
| `target_media` | `none` / `screen` / `product` / null | "The media the ADAPTED creative actually needs after replacing the source subject for this brand. Keep 'none' for conceptual/graphic layouts, use 'screen' only when real product UI should occupy the adapted subject, and use 'product' for a physical product/photo subject. This is intentionally separate from source_media: a physical-product source may adapt to a real software screenshot while keeping its structure." |
| `adapted_subject` | string / null | "One short sentence naming the brand-specific subject and action that replace the source subject while preserving the source scene, framing, arrangement, and visual device. Null only when no subject adaptation is needed." |
| `reference_ids` | string[] | "Stable IDs copied exactly from the available brand-reference manifest. Include only references the final prompt actually requires. Never invent an ID." |

After answering:
- Structure-only: `source_media` is replaced by `«structureMediaSlot»` from the blueprint (the composer cannot see the source).
- Normal path, source image could not be viewed: `source_media = null`.
- IDs are trimmed and lower-cased; duplicates removed.
- **Placeholder check.** Every `{{ref:ID}}` in `prompt` other than `{{ref:logo}}` must be in `reference_ids`. The server fails the whole ad here (`Compose prompt referenced unselected asset id(s)`). **Agent adaptation:** fix the object (add the ID or remove the placeholder) and re-check; never send a prompt that fails this.

## 8. From the composer's answer to the final prompt

### 8.1 Gate the references (`selectTargetReferenceAssets` 605)

`fits(role, media)`: `logo` always; `user_upload` never; `own_ad` never; `screen` → `screenshot`; `product` → `product` or `size_reference`; `none` → nothing.
`mandatory(asset)`: `logo`, or `user_upload` when the user gave instructions (they always do here).

- IF `target_media` is null: keep `mandatory ∪ {fits(role, source_media)}`; if `source_media` is also null keep everything.
- ELSE:
  1. Drop unknown IDs.
  2. Drop selected IDs whose role does not fit `target_media` (except `user_upload` and `own_ad`, which may be picked for any target).
  3. Backfill: if `target_media ≠ none`, the inventory has refs that fit (not logo, not upload), and none of them was selected → select **all** of them.
  4. If any `product` ref is selected, keep every `size_reference` too.
  5. Result = inventory items (in §4.2 order) that are mandatory, selected, or kept by step 4.

**Agent adaptation.** If a gated-out ID still has a placeholder in `prompt`, the server fails the ad when it resolves placeholders. Fix the composed prompt (remove that reference) before continuing.

### 8.2 Unavailable references (`reconcileUnavailableReferences` 970)

A selected reference whose URL cannot be fetched as an image is dropped, never fatal (`ads_render` also refuses an unfetchable image: `direct render image N could not be fetched as an image`). For each placeholder whose ID is not attached:
- `logo` not attached → state `intentionally_omitted` if noLogo, else `unavailable`.
- a dropped known ID → `unavailable`.

Replace each such placeholder in the body with `[unavailable «role with spaces» reference — omit it]` (e.g. `[unavailable logo reference — omit it]`), and put this block at the top of the body, then a blank line:
```text
REFERENCE AVAILABILITY OVERRIDE (HIGHEST PRIORITY):
- «instruction per role»
```
Instructions per role (verbatim):
```text
logo: The logo reference is unavailable and is not attached. Render no logo, wordmark, brand-name lettering, or substitute mark anywhere. Do not invent, approximate, or redraw one. This overrides every later logo instruction.
screenshot: A requested product screenshot is unavailable and is not attached. Do not invent or simulate software UI; use surviving references or a non-UI conceptual treatment.
product: A requested product photo is unavailable and is not attached. Do not invent packaging, labels, or product details; use surviving references or a non-literal composition.
size_reference: A requested size reference is unavailable and is not attached. Do not claim or depict exact scale from that missing image.
user_upload: A requested user-provided image is unavailable and is not attached. Do not invent its contents or imply that it is visible.
own_ad: A requested past-ad reference is unavailable and is not attached. Do not reproduce or invent that ad's visual details.
```
(For `logo` with noLogo the server writes the same `unavailable` instruction text.) Call the result `«promptBody»`.

### 8.3 Image order (`processCreative` 4385–4392)

```
slots = [ template ]  (normal path only — never in structure-only)
      + gated inventory items, in §4.2 order (logo, size refs, then brand refs)
image_urls = the URL of each slot, same order
```

### 8.4 The manifest (`buildFinalImageManifest` 872) — exact line per role

```text
Input images, in order:
Image «n»: the source ad template — recreate its layout and composition.
Image «n»: the brand's real logo — reproduce it exactly as given.
Image «n»: size reference (SCALE ONLY) — take only the product's true real-world scale from it; never copy its hands, people, objects, or background.
Image «n»: website screenshot of the brand's real product UI — reproduce the on-screen interface faithfully, presented on a screen, never as a physical product.
Image «n»: one of the brand's OWN past ads — a finished advertisement, not a product. Take only brand cues from it (palette, type, tone, how they shoot their work); never reproduce its layout, headline, or copy, and never treat it as a product photo.
Image «n»: user-provided image #«userIndex» («productName») — use it exactly as the instructions below direct; if no role is given, treat it as the real product photo and reproduce it faithfully.
Image «n»: FONT SPECIMEN (typography authority) — the ad's exact text copy pre-rendered in the brand's REAL typeface on a plain white card. Every piece of on-image text MUST use this exact typeface — copy its letterforms, proportions, and weight; do not substitute or default to another style. Its white background and gray captions are guides only, never render them.
Image «n»: real product photo of «productName» — reproduce it faithfully: same packaging, label, shape, and true proportions; never invent or alter it.
```
- One line per slot, in slot order, `n` from 1. Use the line for the slot's role.
- user_upload: ` #«userIndex»` only when known; ` («productName»)` only when set.
- product: ` of «productName»` only when set.

### 8.5 The final prompt (`buildFinalPromptResult` 1058, `resolveReferencePlaceholders` 1034)

```
«manifest»
(blank line)
«promptBody with every {{ref:ID}} replaced by "Image «position of the slot with that id»"»
```
- IDs match case-insensitively. A placeholder whose ID has no slot is a hard error on the server; §8.1–8.2 must have removed all of them.
- The template and the font specimen have no ID; the composer never refers to them by placeholder.

## 9. Font specimen (eligible ads only) — see `font-specimen.md`

Eligible when **all** hold: `applyBrandFont` is true; the engine reads specimens (every GPT Image engine, and `nano_banana_pro`); `image_urls.length < 6` (the smallest cap any fallback could hit). Then:

1. Run the copy-extraction step on the **full final prompt from §8.5** (manifest included) and render + upload the specimen.
2. If a specimen URL comes back: insert it at index `at = min(1, image_urls.length)` in both `slots` (role `font_reference`) and `image_urls`. Normal path: right after the template. Structure-only: after the first brand image (index 0 if there are no images).
3. **Rebuild** the final prompt from the slots (placeholders re-numbered for the new positions):
```
«manifest with the FONT SPECIMEN line»
(blank line)
«FONT_REFERENCE_PROMPT_LINE»
(blank line)
«promptBody, placeholders resolved»
```
4. No specimen → keep the §8.5 prompt; the `Typography:` name alone carries the font.

## 10. Engine cap, then one prompt per ratio

**Engine cap** (`imagesForEngine` 4762, `maxReferenceImagesFor`): GPT Image engines 16, `nano_banana_pro` 6, others no cap. If `image_urls` exceeds the cap: keep the first `cap` slots; every dropped slot with an ID becomes unavailable (§8.2); rebuild from `«promptBody»` (the server's rebuild here omits the font line; with a specimen attached the list is at most 6, so this only happens without one).

**Ratio adaptation** (`withRatioAdaptation` 1236). For each output ratio ≠ `template.ratio`, append to the final prompt:
```text


CANVAS ADAPTATION: the output canvas is «ratio» («orientation»), but the source ad's layout was composed for a «template.ratio» canvas. RECOMPOSE the layout for the «ratio» canvas — re-stack and re-stage the elements and extend the background to fill the space naturally. NEVER stretch, elongate, squash, or distort any element to fill the canvas. All text must keep natural glyph proportions (no stretched or condensed letterforms), and the product keeps its true real-world proportions.
```
(`«orientation»`: `9:16` → `vertical portrait`, `4:5` → `portrait`, `16:9` → `horizontal landscape`, anything else → `square`.) The ratio equal to `template.ratio` gets no block. The result per ratio is that render's **base prompt**; judge retries append to it (`judge.md`).

(Platform safe-zone blocks are added only for placement renders made by `resize`; server-composed and `ads_render` renders have none.)

## 11. The call: `gooseworks:ads_render`

`ads_render` sends `prompt` word for word and `image_urls` in the given order: no template, no kit images, no font sample, no prompt writer, no judge, no retry, no fallback.

One call per distinct base prompt. Because the CANVAS ADAPTATION block names the ratio, ratios share a call only when their prompt text is identical (in practice: the template's own ratio alone, and one call per other ratio).

```json
{
  "brand_id": "«brand_id»",
  "prompt": "«base prompt for this ratio, verbatim»",
  "image_urls": ["«slot 1 url»", "«slot 2 url»", "…"],
  "ratios": ["«ratio»"],
  "variants": 1,
  "engine": "«omit for the default GPT Image 2.5 Flare; else the template's remix_engine when it is another engine»",
  "quality": "«omit for the default (high with no engine; medium with an engine)»",
  "title": "«composer title»",
  "product_name": "«selected.name, label only»",
  "dry_run": true
}
```

- `variants: 1` always. Server variants are separate composes with different variant directives (§6.7); `ads_render` variants are re-rolls of one prompt. Compose each variant separately.
- Engine: the server uses the batch engine, else the template's `remix_engine` (a template's `gpt_image_2` means the default), else `gpt_image_2_5_flare`.
- Dry run first, show the credit quote, submit only on the user's yes to that total. Say that a judge retry (`judge.md`) costs the same again.
- Submit returns `{ job_id }`; poll `gooseworks:job_get { kind: "ads_batch" }` until `pending` is 0, then judge each image.
- **Content-policy block** (the server's cross-model fallback, `contentPolicyFallbackEngine` 216, at most once per render): a GPT engine blocked → re-render on `nano_banana_pro`; `nano_banana_pro` blocked → re-render on the default (omit `engine`). For `nano_banana_pro`, re-apply the cap of 6 (§10) and rebuild the prompt. Later retries stay on the fallback engine. Quote it first; it is a new paid call.

## 12. Server state an agent cannot see, and what it does instead

| Server behaviour | Why the agent cannot match it | Agent does instead |
|---|---|---|
| Composer is a separate model (Opus 4.8 prod, Sonnet 5 default, Sonnet 4.6 fallback) with retries | The agent is the composer | Answer the assembled input literally (§7) |
| Uploaded brand font files win in the specimen | No MCP read returns them | Google Fonts or metric clone only; otherwise no specimen (`font-specimen.md`) |
| `kit.typography` missing → curated font library | Library is server code | Use `kit.fonts` names; if both are empty, write no `Typography:` name and say so |
| Tall website screenshots tiled to squares before compose | Tiling is server code | Use kit tiles; leave out very tall untiled shots |
| Dead references pruned from the kit; logo retired | Writes are server-only | Treat as unavailable (§8.2); tell the user which image failed |
| Recurring-rejection directives recomputed live (10-min cache) | Only the stored summary row is readable | Parse the `feedback_reasons` learning (§6.5) |
| Colour plan seeded by the batch UUID, frozen on the batch | No batch exists before the call | Same rule, own stable seed (§3) |
| Structure-only analyst and composer are isolated | One agent sees both | Subagent, or the self-check in §2.2 |
| Community templates re-hosted before use | Server-only | Use `source_image_url` to view; community sources are structure-only anyway |
| Judge retries paid by GooseWorks | `ads_render` bills every call | Quote retries; ask before spending (`judge.md`) |
