---
name: remix-graphic-ad-from-reference
description: Recreate a static graphic ad (Pinterest pin, IG/FB feed image, poster) from a reference image, swapping in a new brand's product and new copy while keeping the reference's layout, composition, and visual energy. Two engines — HTML overlay (default; editable pixel-perfect text, free) and GPT Image 2 in edit-the-reference mode (only when a real photographic element is needed). The static-graphics counterpart to the video remix-ad skill; this is what the app calls when a user picks a reference ad and wants it for their own product.
---

# remix-graphic-ad-from-reference

## Purpose

Given **one reference ad image** + a **target product** + **new copy**, produce a finished static ad
that keeps the reference's *layout and composition* but swaps the product and words for the new brand.
This powers the app's "pick a Pinterest ad you like → get the same ad for your product" flow.

It does **not** invent layouts and it does **not** regenerate the whole scene from scratch. It reads
the reference, then uses the engine that reproduces it faithfully:

- **HTML overlay — the default.** The product is cut out and placed; the background is reproduced
 (CSS gradient/sky/solid or a sourced photo); all copy is crisp, correctly spelled, and **editable**
 (price/discount/headline are real text, not pixels). Deterministic, $0 gen, exact brand color/font.
- **GPT Image 2 (edit the reference) — only when a real photographic element is required** the overlay
 can't fake (a hand holding the product, a model, a lifestyle/in-use scene). It runs in **image-edit
 mode on the reference itself** to preserve the composition and only swap the product + text.


## Inputs

| Input | Required | Notes |
|---|---|---|
| `reference_image` | yes | The ad to recreate (local path or URL). One image. |
| `product` | yes | Target product: a clean product render/photo (PNG/webp). Pull the **real** brand asset; grounding/swapping on it is what keeps the label correct. **If the brand asset is a multi-product lineup, crop to the ONE relevant product first** — the remix grounds on a single clean product per `product_slot` (use `product_images_needed` from the slot map for how many distinct products the layout needs). |
| `copy_changes` | optional | If omitted, **the agent auto-writes it** from the brand pack mapped to the template's `slot_map` (see Phase 0.5). New headline, benefit callouts, social-proof line, discount/badge text. Keep the reference's *structure* (same zones), swap the words. |
| `brand` | recommended | Palette (hex), font, logo/wordmark, voice — usually from a `brand-research` pack. |
| `route_hint` | optional | Force an engine (`html` / `gpt_image_2`). Default: auto (prefers `html`). |
| `aspect` | optional | Inherit from the reference; map to the renderer canvas. Default 4:5 / 1080×1350. |
| `remix_spec` | optional | The precomputed spec from the template library (`slot_map` + `gen_prompt` + `remix_engine`). **If present, SKIP Phase 0 re-analysis** — the slots and prompt are already authored. This is the normal path when remixing a library template. |
| `remix_mode` | from template | `product` (swap a physical product) or `ui` (SaaS/app ad — swap the app screenshot/UI, NEVER insert a product). Tagged on the template. |
| `app_screenshot` | for `ui` mode | The brand's app/UI screenshot to drop into the device frame (used instead of `product` when `remix_mode:ui`). |

## Composed Atoms

- `goose-graphics` (`skills/design/composites/goose-graphics`) — renders the HTML-overlay path to PNG via the goose-graphics Playwright pipeline.
- `create-image-gpt-image-fal` (`skills/ads/capabilities/create-image-gpt-image-fal`) — GPT Image 2, run in **edit mode on the reference** for the photographic path.
- `create-product-images-higgsfield-product-photoshoot` — OPTIONAL: only when no clean product render exists and one must be generated first. Not bundled in goose-skills yet; if absent, require the caller to supply a clean product image.

## Workflow

### Phase 0 — Get the spec (use `remix_spec` if it exists; analyze only if it doesn't)
**If the template carries a `remix_spec` (every library template does), DO NOT re-analyze the image.**
Read it directly:
- `remix_spec.slot_map.text_slots` → the text fields to replace (each has `id`, `role`, and the
 reference's current text). Map the brand's `copy_changes` onto these slots by `id`/`role`.
- `remix_spec.slot_map.product_images_needed` + `product_slots` → how many brand product images to ask
 for and where each goes. Cut each out with `scripts/cutout_product.py`.
- `remix_spec.slot_map.logo_slots` / `decorations` → logo placement + arrows/badges to reproduce.
- `remix_spec.gen_prompt` → the ready, real-product-locked GPT prompt (fill its `{{placeholders}}`).
- `remix_spec.remix_engine` → the engine to use (skip Phase 1 routing).

**Only if there is no `remix_spec`** (a brand-new, un-tagged reference): view it at full res and write a
one-paragraph anatomy (background, product placement, every text zone, palette, font) — i.e. produce a
`remix_spec` on the fly. Prefer running the template through the triage tagger first so this is cached.

### Phase 0.5 — Author the copy (agent auto-writes; user can revise)
If `copy_changes` is supplied, use it. **Otherwise the agent writes it** — read the brand pack
(voice/tone, value-props, never-say) and map onto `remix_spec.slot_map.text_slots`: one on-brand line
per slot, matching each slot's `role` and keeping length close to the reference's current text so it
fits the layout. Respect never-say / no-competitor / no-unverifiable-claims. Write one line for **every text slot the reference has** (no more, no fewer) — these fill the `gen_prompt` `{{text_slots}}` block. **Add no text the reference doesn't have, drop none it does**; if an area has no text in the reference, add none. The output is an exact copy of the reference differing only in product, theme/colour, and the words.
**Versioning:** show the drafted copy; on user feedback, regenerate a **v2** (re-author the copy → re-render)
rather than editing pixels. Keep each version.

### Phase 1 — Route (see Decision Rules)
If `remix_spec.remix_engine` is set, use it. Else **default to GPT Image 2** (premium look); use HTML only for text-dense/exact-copy ads (infographics, data panels, high text-complexity). `route_hint` overrides.

### Phase 2A — HTML-overlay path (default)
1. Cut the product out to a transparent PNG with `scripts/cutout_product.py` (handles palette-transparency
 renders *and* white/solid backgrounds via edge flood-fill — preserves interior white logos).
2. Build one `index.html` from `assets/overlay-template.html`: reproduce the reference's background,
 place the cutout, lay the new copy in the same zones. Arrows = inline SVG; scalloped seals = inline JS
 (template has both). Use the brand font (Google Fonts) + palette.
3. Render via `create-goose-graphics` / the goose-graphics screenshot pipeline:
 `node <goose-graphics>/screenshot/screenshot.js --format <canvas> --input index.html --output render.png --font-delay 1500`.
 Map aspect→canvas: 1080×1080→`carousel`, 1080×1350→`poster`, 1080×1920→`story`. **2:3 (1080×1620) has NO goose-graphics preset** → render at `poster` (1080×1350, nearest) or a standalone 2:3 Playwright canvas; don't hand-edit the vendored renderer.

### Phase 2B — GPT Image 2 path (EDIT the reference, do not regenerate)
1. **Run GPT Image 2 in image-edit mode with the reference ad as the base + the product render** —
 prompt it to *keep the reference's layout, background, camera, lighting, and signature element exactly*
 and only **(a)** replace the product with the attached one (match its label/logo exactly) and
 **(b)** clear the original text.
 ⚠️ **Never generate grounded on the product alone** — that invents a generic new scene and discards
 the reference's composition.
2. **Text:** either let GPT render the new SHORT copy, **or** have it leave clean space and add copy via
 the HTML overlay. **Never stack an HTML text layer on output that already has baked text** — one source.
3. `--aspect_ratio 3:4` (or nearest), `--quality high --resolution 2k`. **If the model returns a small
 image (long edge < ~1080px), upscale to ≥2k before shipping** — AI-path baked text softens at low res
 (a known tradeoff vs the HTML path, which is natively 2×/crisp). GPT edit slug: `fal-ai/gpt-image-1/edit-image` (`image_urls[]`); it caps ~1536px long edge, so upscale to ≥2k via `fal-ai/esrgan`.
4. **Fidelity gate (3 checks, all must pass):** (a) signature element/layout preserved; (b) **EVERY instance
 of the source product is replaced and NO source/competitor brand name, logo, or label survives anywhere**
 in frame (diff full-res output vs reference — a partial swap that leaves a competitor bottle is a brand/
 compliance hazard); (c) output is full-res (long edge ≥ ~2000px) and baked text is sharp. If any fails:
 re-roll same engine on the original, fall back to HTML, or reject.

### Phase 3 — QC + deliver
Run Quality Checks. Save the master to `finals/`; keep HTML/cutout/prompt + a provenance note in
`working/`. If copy is wrong on a GPT output, switch that ad to the HTML path rather than re-rolling text.

## Decision Rules

| Reference looks like… | Route | Why |
|---|---|---|
| Product + flat/gradient/sky/solid bg + text + arrows/badges/stars (product straight-on or floating) | **HTML overlay** | Free, pixel-perfect editable copy, exact brand color/font. **This is most references.** |
| Hero is a **real photographic element** the overlay can't fake (hand holding product, model, lifestyle scene) | **GPT Image 2 (edit the reference)** | Needs real photography; editing the reference preserves the layout while swapping the product. |
| GPT drifts on the label or mangles copy | **GPT for the textless scene + HTML overlay for the text** (hybrid), or fall back to full HTML | Keep copy exact and editable. |

- **SaaS/app/software ad → `remix_mode: ui`.** There's no physical product — swap the **app screenshot/UI** into the device frame and rebrand; **NEVER insert a physical product** (doing so hallucinates an unrelated bottle/box). If no app screenshot, rebrand the existing UI (recolor/logo/copy). Use the UI `gen_prompt` on the template.
- **Default to GPT Image 2 (premium look).** It's deterministic and faithful; reach for GPT only on genuine photographic need.
- **Pixel-exact product required → HTML.** The GPT path *re-renders* the product (faithful match, not the original pixels); only HTML places the real product pixels. `real_product_lock` is best-effort on the AI engine.
- **GPT edits the reference, never regenerates from the product alone.**
- **Copy accuracy beats look.** If a price/discount/claim must be exact and GPT keeps getting it wrong, drop to HTML.
- **No fear / no competitor-bashing / no unverifiable claims**, even if the reference uses them. Re-skin the hook.
- **Bespoke cinematic / IP-bound references** (specific VFX device, celebrity, brand character) are not remixable — reject.

## Output

- `finals/<slug>_<WxH>.png` — the finished ad (2× device scale on the HTML path → e.g. 2160×2700).
- `working/index.html` + `working/<product>-cutout.png` (HTML path) — editable source for copy/price variants.
- `working/ai-gen/gpt-v1.png` + `working/ai-gen/PROVENANCE.md` (GPT path) — URL, model, prompt, credits.
- A one-line route + cost record.

## Quality Checks

**`Read` the real brand product asset next to the full-res generated output and compare them
directly** — most AI-path failures are product drift you can't catch without the side-by-side:

- **Product shape & size:** the same product at the right proportions and scale — not stretched,
  squashed, bent, oddly cropped, or resized out of proportion vs. the real asset.
- **Product colour:** colours match the real asset — body, cap, packaging, finish, AND any visible
  contents (pill/powder/liquid); no hue shift, wrong shade, or washed-out / oversaturated look. (See
  the "Product internals inherit the reference colour" failure mode.)
- **Text not garbled:** every word on the product label/packaging and in the ad copy is real,
  correctly spelled, and legible — not garbled, melted, doubled, or invented. Discount/price/claim ==
  the intended value.
- **Logo:** if any logo / wordmark appears in the frame, it must be the brand's CORRECT logo — right
  mark, right spelling, undistorted, correct colours. A wrong or mangled logo = fail.
- Layout matches the reference anatomy: same zones, reading order, energy. No colliding text; legible
  at thumbnail size. Brand palette + font applied (HTML) or visually consistent (GPT).
- View the **full-res** output, not a thumbnail — text errors hide at small sizes.

If any product / text / logo check fails, re-roll the same engine on the **original reference** with an
explicit prompt ("keep the product's exact shape, proportions and colours; render the label text and
logo exactly as in the attached product image; do not distort or restyle them"), or route text/logo-heavy
cards to the HTML path (crisp text + the real logo file placed directly). Don't ship a render whose
product is the wrong size or colour, has garbled text, or shows a wrong / distorted logo.

## Failure Modes

- **AI "changes everything" / drops the reference's signature element.** Cause: generating grounded on
 the product alone. Fix: GPT must **edit the reference**. If it still can't preserve the layout, use HTML
 or reject the reference.
- **Partial swap / residual competitor branding.** The AI replaced only one of several products and left a
 source/competitor bottle, dropper, logo, or label in frame — a brand/compliance hazard, not just a
 fidelity miss. The gen_prompt now says "replace EVERY instance, remove ALL source branding"; still
 verify it in the fidelity gate by diffing against the reference.
- **Product internals inherit the reference (wrong pill/powder/liquid colour).** GPT can keep the
  *reference* product's capsule/powder colour instead of the brand's. Fix: the gen_prompt says match the
  brand image's visible contents — so the brand product image must SHOW the real contents. If the brand's
  actual pill/powder/liquid colour isn't in the research pack or asset, **ASK the user — don't guess.**
- **Hand-held product → hallucinated hand.** Templates where a hand holds/grips the product hallucinate a malformed hand on GPT-edit (HTML can't render a hand either). Only replicable if a real product-in-hand photo is supplied; otherwise reject the template or pick a non-hand layout.
- **Stacking two text layers** (baked text + HTML overlay) = doubled/conflicting copy. Use ONE text source.
- **Bespoke/cinematic/IP references** aren't remixable by product+copy swap — reject, don't attempt.
- **AI bakes wrong copy/discount.** Don't re-roll more than once for text — switch to HTML.
- **Cutout eats the white logo.** Use edge flood-fill (the helper does this), never a global white→transparent threshold.
- **Product asset is the back of the pack / wrong SKU.** Verify the face before using it.

## Spend Reference

At ~$1 = 21 Higgsfield credits:
- HTML-overlay path: **$0 gen** (agent orchestration only) — the default.
- GPT Image 2 (3:4, 2k high): **~7 cr ≈ $0.33** per image — use only for genuine photographic need.
Research/setup dominates the agent cost for the first ad of a new brand; variants are far cheaper.

## Tests

See `tests/`. Smoke = route + render a known reference→product pair end-to-end and confirm a non-empty
PNG at the right dimensions with correct copy. Verifier: `skills/ads/capabilities/verify-product-image/`.

## Skill Location & Related

`skills/ads/composites/remix-graphic-ad-from-reference/` (goose-skills). Related:
`skills/ads/composites/brand-research` (brand context), `skills/ads/capabilities/create-image-gpt-image-fal`
(GPT Image 2 edit engine), `skills/ads/capabilities/verify-product-image` (QC), and
`skills/design/composites/goose-graphics` (HTML→PNG renderer). The video analog `remix-ad` lives in the
separate ads-video repo.
