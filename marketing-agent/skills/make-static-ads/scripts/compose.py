#!/usr/bin/env python3
"""The mechanical half of GooseWorks' ad composer, for one ad.

Port of gooseworks-app `apps/api/src/services/ad-remix-pipeline.service.ts` (origin/dev, commit 42a3dec20, the
commit `../references/composer.md` cites): `buildComposeContext`, the `composeInput` assembly in
`composeCreativePrompt`, `selectReferenceImages`, `applyCustomReferences`, `buildComposeReferenceAssets`,
`buildAttachmentManifest`, `typographyLine`, `selectTargetReferenceAssets`, `reconcileUnavailableReferences`,
`resolveReferencePlaceholders`, `buildFinalImageManifest`, `buildFinalPromptResult`, the specimen insertion and engine
cap in `processCreative`, and `withRatioAdaptation`. Server strings are copied verbatim; `test_compose.py` checks every
fenced block of composer.md §5, §6, §8 and §10 against this script's output.

The agent still answers the composer itself (composer.md §7). This script only does the assembly before and after.

Usage:
    python3 compose.py input <ad.json>                  # prints the composer input (composer.md §5 + §6)
    python3 compose.py final <ad.json> <answer.json>    # prints the final prompt per ratio (§8, §9, §10, §11)

Python 3 standard library only. Imports `readable_ink` from `schemes.py` in this folder.

ad.json (one ad). Keys the server reads, by composer.md section. Missing optional keys take the default shown.
    brand_id               str    GooseWorks brand id, copied into the ads_render arguments.
    kit                    obj    `brand_read {sections:["kit"], detail:"full"}` -> result.kit, as returned (camelCase).
                                  Read: name, description, audience, voice, brandType, valueProps, proofPoints,
                                  websiteUrl, messagingAngles, primaryColor, accentColor, backgroundColor, textColor,
                                  paletteRead, palette, typography, fonts, products, logoUrl, referenceImages, docs,
                                  instructions. Other fields are ignored.
    learnings              list   `brand_read {sections:["learnings"]}` -> result.learnings, in the order returned
                                  (rows {kind, text, source}). Default []. §6.5.
    template               obj    `ads_template_read` -> result.template: title, description, layout_type, style_tags,
                                  mood_tags, text_complexity, remix_spec, ratio, source_kind, source_image_url,
                                  remix_engine. Two playbook keys:
                                    brand_owned         bool  default: false for competitor_scrape / community_source /
                                                              curated, else true. false = structure-only (departure 5).
                                    source_image_viewed bool  default true. false = the agent could not view the source
                                                              image, so source_media is null (§7).
    structure              obj    Structure-only ads only (structure-blueprint.md):
                                    blueprint_instruction str   the rendered blueprint text, verbatim.
                                    media_slot            str   the blueprint's media_slot (screen / none / anything
                                                                else counts as product).
                                    reduced_mechanic      bool  departure 2 applied (recorded only; the agent reduces
                                                                the blueprint text itself).
    product_name           str    the product the marketer picked (exact kit name), or null for auto references. §4.1.
    product                obj    `brand_read {sections:["products"], product_ids:[id]}` -> result.products.items[0]
                                  (snake_case: name, description, pricing, offers, notes, ai_creative_notes,
                                  size_reference_urls). Its fields win over the kit's product entry. Optional.
    user_uploads           list   public https URLs of images the marketer attached (uploaded with media_upload). §4.1.
    no_logo                bool   default false. The marketer asked for no logo.
    apply_brand_colors     bool   default true. Forced true for competitor_scrape / curated (§2.1).
    scheme                 obj    this ad's colour scheme from schemes.py (background, ink, accent; on_accent is
                                  recomputed), or a fresh palette as the assigned scheme, or null. §3.
    font                   str    "brand" (default) | "template" (KEEP SOURCE; forced to brand for competitor_scrape /
                                  curated) | "pairing" (departure 3) | "none" (departure 4).
#   brand_font_unavailable  optional bool: the brand font has no Google Fonts match or metric clone, so a
#                           pairing stands in for it (departure 3 without the system-face warning).
    font_pairing           obj    font = "pairing" only: heading, heading_descriptor, body, body_descriptor, and
                                  optional accent, accent_descriptor (from fonts-and-color.md).
    proof_points           list   departure 1: the featured product's usable facts. Added as "Proof points:" on the
                                  product-led path, where the server leaves proof out.
    user_instructions      str    the marketer's own chat words for this ad, unchanged. §6.6.
    messaging_angle        str    the per-ad angle line of §6.6. The playbook leaves it out (default null).
    variant                obj    {"brief": {"angle": <VARIANT_BRIEF_ANGLE_COPY key>, "message": str}} (the playbook's
                                  form) or {"index": k} (VARIANT_DIRECTIVES). Default none. §6.7.
    ratios                 list   output ratios, e.g. ["1:1", "4:5"]. §10.
    engine                 str    batch engine override; default null (template engine, else gpt_image_2_5_flare).
    font_specimen_url      str    the uploaded specimen (font-specimen.md), once made. Default null. §9.
    unavailable_reference_ids list  inventory ids whose URL could not be fetched as an image. Default []. §8.2.
    content_policy_recompose  str   departure 6: what was removed after a refused render (recorded only).

answer.json: the composer's six-field object (composer.md §7): prompt, title, source_media, target_media,
adapted_subject, reference_ids.
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schemes import readable_ink  # noqa: E402  (same folder; byte-for-byte port of lib/brand-colors.ts)


class ComposeError(Exception):
    """An input the server would reject, or a step the server would fail."""


# ---------------------------------------------------------------------------------------------------------------------
# Server text, verbatim (composer.md §5, §6, §8, §10; font-specimen.md §6).
# ---------------------------------------------------------------------------------------------------------------------

L1_STRUCTURE = "You write prompts for an image-editing model (it receives ONLY the brand's own reference images — NO source ad)."
L1_NORMAL = "You write prompts for an image-editing model (it receives the source ad as an input image plus brand reference images)."
L2_STRUCTURE = "Write ONE prompt that builds the brand's ad to the FUNCTIONAL BLUEPRINT below, using the brand kit ALONE. The blueprint is an abstract layout derived from a competitor ad you must NOT reproduce — never copy its palette, typeface, photography, logo, mascot, wordmark, or wording; only follow its abstract structure."
L2_NORMAL = "Write ONE prompt that recreates the source ad's LAYOUT and composition, restyled for the brand below."
ADAPT_SUBJECT = "Adapt the SUBJECT to what the brand actually sells (see 'What they do' / 'Products'). The source template's own product is a PLACEHOLDER ONLY: you MUST replace it with the brand's real product (or, when the brand has no physical product — e.g. software/services — an on-brand conceptual or lifestyle visual). NEVER keep the source template's product, packaging, or device shape and relabel it as the brand's; the source's original product must not survive into the output in any form. Do not invent an unrelated product."
TARGET_CONTRACT = "TARGET CONTRACT — source_media describes only the SOURCE slot. target_media describes the media the ADAPTED brand creative actually needs. Preserve the source's scene/action, framing, text/media arrangement, and signature device while changing the advertised subject. A source product slot may become target_media='screen' for software when a real screenshot is selected; a conceptual/graphic source stays target_media='none' and must not acquire a generic laptop or photo. Select only stable IDs from the reference manifest. Whenever the final prompt mentions a selected reference, write its exact {{ref:ID}} placeholder; never write or guess an image number."
SCENE = "SCENE — when the blueprint names a scene, stage the ad in it: the same setting class and the same kind of activity, adapted to what THIS brand's customer would be doing there. Do not substitute a scene of your own. If the brief names a moment or an audience, stage the scene there and with them. For a brand with no physical product, the conceptual visual FOLLOWS the scene; it never replaces it."
PHOTOREALISM = "PHOTOREALISM (only when the ad shows a real person, human hands, or visible skin — otherwise SKIP this entire instruction and add none of it). Real ads of real people are shot on phones, not rendered. When the composition includes a person/hands/skin, write the prompt so the result looks like a real photograph, not a CGI render: specify candid phone-camera capture (e.g. 'shot on an iPhone, natural window light, candid, slight handheld feel'), realistic skin with natural texture and tone variation, and relaxed real-world posing. Because the image model has NO negative-prompt input, phrase what to AVOID directly in the prompt: avoid airbrushed / waxy / plastic / poreless skin, avoid studio-perfect or beauty-campaign lighting, and avoid oversaturated, glossy color (oversaturation reads as AI). Hands are the biggest tell — keep them simple and natural (relaxed, holding the product so fingers wrap a known shape, in a pocket, or partly out of frame) rather than spread, gesturing, or foregrounded; never let a hand show an implausible finger count or pose. Apply NONE of this to graphic-only, text-only, SaaS/UI, or product-only ads with no visible person or skin — those must stay unchanged."
USER_UPLOADS = 'THE USER UPLOADED THEIR OWN IMAGES for this ad (see the reference manifest: "User-provided image #K"). Their instructions may reference them by THEIR OWN numbering — "image 1", "#2", "the second image" — which counts ONLY their uploads, starting at 1; "template image" / "template_image" means the source ad template. In the prompt you write, translate every user-upload reference to its exact stable placeholder from the manifest (for example {{ref:user-upload-2}}), never to a guessed final image number. NEVER repeat the user\'s own numbering unresolved. Follow the role the user assigns each upload even when it differs from the default product-photo treatment.'
COLORS_BY_ROLE = "COLORS — RESTYLE TO BRAND, BY ROLE: the assigned scheme is authoritative. Preserve the source's RELATIVE contrast roles, split/multi-region arrangement, natural photographic scene, photo bleed, and texture, but map its background/field role to {background}, its text role to {ink}, and its accent role to {accent} (text ON an accent-filled button or pill is {on_accent}). If the source's absolute light/dark class conflicts with this assignment, invert the roles coherently instead of replacing the assigned scheme. Name those exact hex values in the prompt you write. NEVER preserve or reuse the source ad's own hex colours, and do NOT substitute the brand's primary colour for the assigned background. Text must read clearly against whatever it sits on."
COLORS_RESTYLE = "COLORS — RESTYLE TO BRAND: be EXPLICIT in the prompt you write — name the exact hex colors from the brand context and recolor the ad's background and text to the brand palette."
COLORS_KEEP = "COLORS — KEEP SOURCE: the output MUST preserve the source ad's exact background color(s) and text colors — do NOT introduce brand colors; keep the source's color scheme."
TYPO_SURGICAL = "TYPOGRAPHY — SURGICAL BRAND FONT (REPLACE, do not restyle): instruct the model to reproduce the source template's design faithfully (background, framing, layout, element placement), but RE-LETTER every piece of on-image text in the brand's font named on the context's 'Typography:' line, rendered in THAT font's OWN letterforms. The brand font fully REPLACES the template's lettering — from the template keep ONLY the text's placement, size, and color; discard the template's font shape, weight character, and any hand-lettered/script/decorative treatment. HARD RULE for the prompt you write: name the exact brand font and state the text is set in that font; do NOT describe the text as the template's font, and NEVER write the brand font as 'styled as' / 'in the style of' / 'made to look like' the template's lettering (that makes the model keep the template font). NEVER copy a font name out of the brand-research docs; the 'Typography:' line is the renderable one to use."
TYPO_KEEP = "TYPOGRAPHY — KEEP SOURCE: the output MUST preserve the source ad's exact typography — the same font family, weight, and case as the source image. Do NOT swap in a brand font."
NAME_PRODUCT = "Name the real product (when reference photos are attached, instruct the model to depict those products faithfully AND to preserve each product's true real-world proportions — its exact height-to-width ratio and silhouette from the photo — never stretched, elongated, or squashed)."
PRODUCT_FIDELITY = "PRODUCT FIDELITY IS THE HARD INVARIANT. When product reference photo(s) are attached, tell the model the reference is the SINGLE SOURCE OF TRUTH for the featured product and to reproduce it faithfully — the exact silhouette, part count and arrangement, hardware (hinges, rivets, pivots, wheels, handles, folds), surface material and finish, and any on-product markings — changing ONLY the surrounding scene and staging. Forbid simplifying it, smoothing detail away, or substituting a generic same-category look-alike. If the product's exact form cannot be preserved inside the source's staging, keep the product faithful and adapt the staging — never distort the product to fit the layout."
ON_PRODUCT_TEXT = "ON-PRODUCT TEXT MUST BE EXACT AND LEGIBLE. Any text, wordmark, logo, or lettering printed ON the product itself (a garment's chest/back print, a label, embossing, a bottle's front text) must be reproduced EXACTLY as on the reference — the same words, correctly spelled, sharp and readable, and in the correct left-to-right reading orientation. It must NOT be mirrored, reversed, backwards, warped into gibberish, smudged, or partially formed — even when the product is worn, tilted, curved, or seen at an angle. Instruct the model explicitly: keep on-product lettering crisp and forward-reading; if a print would be distorted by the pose or angle, favor an angle where it reads correctly rather than rendering garbled text."
STAGING = "STAGING MUST FIT THE PRODUCT (scale + context). Sanity-check the source's composition against the brand's real product before reusing it. If the source stages its hero on a balance/seesaw, floating amid counter-weight props, held by tiny figures, or in a slot sized for a small object, the swapped-in product must still read at its TRUE real-world size — keep it the dominant, correctly-scaled subject and size any surrounding props realistically relative to it so it never looks miniature or toy-like. If the source's concept is nonsensical for this product (e.g. a food-plating layout for a metal tool), neutralize or drop the gimmick and stage the product plainly rather than forcing an incoherent scene. Prefer a coherent, on-context ad over a literal copy of an ill-fitting layout."
SIZE_REFS = "SIZE IS SET BY THE SIZE-REFERENCE IMAGE(S) identified in the reference manifest, which show the real product at true scale beside people / hands / known objects. In the prompt you write, instruct the model to reproduce the product at EXACTLY that scale: the SAME size relative to the hands, people, and objects shown there (e.g. if a child sets it on the floor to use it, it is a floor-sized unit, NOT something held up in one hand). Do NOT describe the product as 'compact', 'handheld', 'mini', 'travel-size', or 'small', and do NOT infer its size from its name or category — the size reference OVERRIDES every such assumption. State the real scale explicitly and forbid shrinking it. Use the reference ONLY for scale — never copy its hands, people, objects, or background into the ad."
SIZE_ESTIMATE = "ESTIMATE THE PRODUCT'S REAL-WORLD SIZE. Read the product's declared weight / amount / volume / count from the brand context (name, description, pricing, product details) and instruct the model to render it at a physically-plausible size relative to hands, surfaces, and props — a 60-count bottle, a 250ml can, and a travel sachet are visibly different sizes."
NO_LOGO = "Render NO logo anywhere in the image — no brand mark, wordmark, icon, or lettermark. The finished ad must contain no logo at all. Instruct the model NOT to invent, add, or imply a logo, and not to leave a placeholder for one."
LOGO_ATTACHED = "If a logo reference image is attached, place the brand's real logo and reproduce it exactly, in its OWN colours, directly on the background with NO solid bar/plate/box behind it — never invent, redraw or RECOLOUR a logo."
LOGO_LETTERING = " If the brand name must be lettered because no usable logo reference is attached, set it in {ink} only — never the accent, the assigned background, or any palette colour — and keep the mark identical on every ad in the batch."
TEXT_DENSITY = "MIRROR the source ad's text density exactly: if the source has NO headline or body copy (product + scenery only), the output must add NONE — no headlines, no taglines, no extra logos or labels beyond what the source carries. Only when the source itself contains copy do you rewrite that same amount in the brand's voice — short and punchy. ALL visible text must be real words, correctly spelled, and legible — never lorem ipsum or garbled glyphs."
SAFE_MARGIN = "SAFE MARGIN: keep the logo, wordmark and every line of text at least 5% of the canvas width inside all four edges — nothing may touch, hug, or run off an edge."
COHERENT_COPY = "COPY MUST READ AS ONE COHERENT MESSAGE. Read every headline, subhead, and line you write TOGETHER, top to bottom — they must combine into a single sensible, grammatical marketing message. Do NOT leave a stray, dangling, or grammatically-broken fragment (e.g. a lone connective word like 'As', 'Of', or 'The' floating on its own line), and do NOT stack unrelated word-fragments that don't form a real sentence or phrase. Prefer FEWER words that clearly say something over more words that don't parse. If a line can't be read as intentional copy, cut or rewrite it."
SOURCE_TEXT = "Any text that belongs to the SOURCE template's own product, brand, photo, or production — rather than to the ad's reusable structure — must NOT be copied verbatim. This covers: watermarks and source/creator attribution or handles; draft, sample, or sequence labels; certification, compliance, regulatory, or origin marks; and the source product's specific feature, spec, measurement, claim, or packaging callouts. These describe a DIFFERENT product than the brand's, so in the prompt either REPLACE them with the brand's own equivalent messaging or DROP them entirely — never reproduce them. Carry over only the ad's structural copy (headline, CTA, brand name), rewritten for the brand."
CLAIMS = "CLAIMS MUST BE GROUNDED. Any factual claim in the copy — a statistic, percentage or number, rating, review count, award, money-back/guarantee, clinical or scientific assertion, superlative (#1, best, leading, fastest, proven), or named integration/partner — may appear ONLY if it is present in the brand context above (Proof points / Value props / brand facts / product details). NEVER invent, round up, or embellish a number or claim, and never restate the source template's claim as the brand's. When the brand provides no verifiable proof, write benefit- or emotion-driven copy (what the customer feels/gets) instead of fabricating proof. This is the SAME standard the render judge enforces (claims_grounded) — satisfy it here so it never has to reject the image."
SIGNATURE = "LAYOUT & SIGNATURE MECHANIC IS A HARD INVARIANT. Identify the source ad's signature visual device — its distinctive creative mechanic (e.g. a billboard/poster mockup, benefit-callout arrows around the product, a phone/device hero, an incoming-call or lock-screen notification UI, a before/after or us-vs-them comparison table, a hand holding the product, a testimonial/quote card, a search-bar concept) together with its overall layout and hierarchy — and PRESERVE it. Restyle its colors, fonts, and copy and swap the product WITHIN this same mechanic and composition. Do NOT substitute a different layout, replace the signature device with a generic product-on-background or logo-on-color-field shot, or collapse a multi-element composition into a plain hero. The ONLY exception is the STAGING rule above: if the mechanic is genuinely nonsensical for this product, neutralize that ONE gimmick — never discard the whole composition. Preserve the source's hierarchy and overall design quality."
MEDIA_RULE = (
    "SOURCE/TARGET MEDIA RULE: Set source_media from the SOURCE layout only, then set target_media from the brand subject you actually adapt into that SAME structural role. "
    "If source_media='none' (text/logo/shapes only, no image slot), target_media MUST remain 'none': add no photo, screenshot, product, device, or app window. "
    "If the adapted target needs software UI, select target_media='screen' and a REAL provided screenshot, then preserve the source's scene/action, framing, media position, and signature device while presenting that screenshot naturally in the adapted subject; do not default to a generic laptop hero. "
    "If target_media='product', select the brand's real product photo and reproduce it faithfully in the preserved structural role. "
    "If target_media='none', keep the result conceptual and select no product/screenshot reference. NEVER invent, redesign, or fabricate UI/dashboard content, and never introduce an on-screen UI or boxed image the source structure does not support."
)
DEVICE_SCREENS = "DEVICE SCREENS GO ON THE SCREEN ONLY. If the source shows a device (phone, tablet, laptop) from the BACK, closed, powered-off, or with a blank screen, KEEP that surface blank — never paint a display, app, website, or image onto the back, lid exterior, or edge of a device, and never turn an off/blank screen into an active one. Only a device shown screen-forward may carry on-screen content, and only a REAL provided screenshot. If no screenshot is provided for this brand, do NOT invent app or website UI — leave the screen blank/reflective or use a conceptual visual instead."
NO_PHOTO_PRODUCT = 'The featured product "{name}" has NO reference photo attached — write the prompt so the model renders it generically from its description, and explicitly forbid copying the appearance of any attached image\'s product.'
PRODUCT_LED = "This brand sells MULTIPLE products, but the ad must feature ONLY the selected product in the '## Featured product' block. Make that product's fidelity to its attached reference photo(s) the TOP priority. Do NOT depict, name, or blend in any of the brand's other products; keep the rest of the brand presence to its colors, logo, and voice."
COMPOSE_OUTPUT_INSTRUCTION = (
    "Return a JSON object with all six fields: prompt (the complete image-generation instructions), "
    "title (a 2-4 word ad name), source_media ('none', 'screen', or 'product'; null only if the source media slot cannot be determined), "
    "target_media ('none', 'screen', or 'product'; the media the ADAPTED brand creative actually needs), "
    "adapted_subject (one short sentence describing the brand subject/action that replaces the source subject; null only when no subject adaptation is needed), "
    "and reference_ids (the stable IDs of the brand references the final prompt requires; use [] when none are required). "
    "Put the full prompt inside the prompt field, and include no prose outside the object."
)
SOURCE_AD_LABEL = "SOURCE AD (decide source_media from this image):"

CTX_BG = "Background: {bg} — this is the authoritative field colour for the ad. Preserve natural photographic scenes, photo bleed, texture, and split/multi-region layouts; use the assigned colour in their graphic/background roles rather than flattening the whole scene into a solid field. Do not substitute the brand's primary color for it."
CTX_TEXT = "Text: {ink} — headline and body text."
CTX_ACCENT = "Accent: {accent} — buttons and highlights only, never the dominant field."
CTX_READ = "Text must read clearly against whatever it sits on."
CTX_COLORS_KEEP = "Colors: KEEP the source ad's own background color(s) and text colors exactly as in the source image — do NOT recolor to a brand palette."
CTX_TYPO_KEEP = "Typography: KEEP the source ad's own typography — the same font family, weight, and case as in the source image. Do NOT swap in a brand font."
CTX_NO_LOGO = "Logo: render NO logo anywhere in the image — no brand mark, wordmark, icon, or lettermark. The finished ad must contain no logo at all. Do NOT invent, add, or imply a logo, and do not leave a placeholder for one."
CTX_LOGO = "Logo: the brand's REAL logo is attached as a reference image — reproduce it exactly as given; never redesign, restyle, or invent a logo. Place it directly on the existing background; do NOT add a solid bar, plate, box, card, or panel behind the logo."
CTX_FEATURED = "## Featured product (user-selected — the ad must feature THIS product, no other)"
CTX_GUIDANCE = "Creative guidance for THIS product (written by the brand team — you MUST follow it when composing this ad; it tells you how to depict / position this specific product and what to avoid):"
CTX_SIZE_REF = "Size: the attached size-reference image(s) show this product at its TRUE real-world scale beside people / hands / objects — reproduce that scale exactly (the same size relative to those people/hands/objects). Do NOT treat it as compact/handheld/mini or shrink it to fit a hand unless the reference shows that; the reference overrides any size guess. Use it ONLY for scale — never copy its hands, people, objects, or background."
CTX_SIZE_EST = "Size: estimate this product's real-world size from its declared weight / amount / volume / count (name, description, pricing, details above) and keep it at a physically-plausible scale relative to any hands, surfaces, and props."
CTX_NO_PHOTO = "No reference photo is available for this product — do not claim photo fidelity; describe it from the name/description only, and never borrow another product's appearance."
CTX_MANIFEST_HEADER = "## Available brand reference images (select by stable ID)"
CTX_PER_PRODUCT = "## Per-product creative guidance (brand-authored — follow the guidance for whichever product you feature)"
CTX_INSTRUCTIONS = "## Brand instructions (standing guidance from the brand kit — apply to every ad)"
CTX_USER = "## User instructions (highest priority)"
CTX_VARIANT = "## Variant directive"
ANGLE_LINE = "Messaging angle for THIS ad (lead the headline and visual with it): {angle}"

MANIFEST_SOURCE = "SOURCE TEMPLATE: visible to compose for source structure only; it is not a selectable brand reference."
MANIFEST_EMPTY = "NO brand reference assets are available. Return reference_ids=[] and do not claim a grounded product or UI reference."
MANIFEST_FOOTER = "In reference_ids, copy only IDs from this manifest. Whenever the prompt refers to one, use its exact {{ref:ID}} placeholder; never guess an image number."

LEARNINGS_HEADER = "## What we've learned about this brand's ads (from feedback — apply these)"
ADJUSTMENT_HEADER = "## Recurring rejection reasons for this brand — fix these (from the user's own feedback)"
REASON_DIRECTIVES = {
    "wrong_product": "PRODUCT ACCURACY (this brand keeps rejecting ads for the wrong product): the attached product reference photos are the ground truth. Reproduce that exact product — same shape, packaging, label, materials and proportions. Never substitute, restyle, relabel or invent a product. Stage it so more than one face/angle of the product reads clearly, so its real form is unambiguous.",
    "brand_or_logo_wrong": "LOGO ACCURACY (this brand keeps rejecting ads for a wrong or garbled logo): do NOT draw, letter or invent the logo or wordmark. The real logo is placed as a separate composited layer — leave a clean, flat, unobstructed area for it and render no other logo-like mark, badge, monogram or brand lettering anywhere in the image.",
    "off_brand": "BRAND FIDELITY (this brand keeps rejecting ads as off-brand): stay strictly inside the brand kit. Use ONLY the brand's palette — no invented accent colors, no off-palette gradients, no decorative colors outside the kit — plus the brand's typographic style and tone of voice. No generic stock-ad styling.",
    "text_garbled": "TEXT SAFETY (this brand keeps rejecting ads for garbled text): minimise text baked into the image. Any on-image copy must be a few short words in a simple, high-contrast weight. Leave clean flat space where the headline, subhead and CTA are composited on top as real type. Never render dense paragraphs, small print, or decorative lettering.",
    "weak_copy": "COPY (this brand keeps rejecting the copy as weak): write the headline and CTA in the brand's own voice with one concrete, specific benefit — never a generic slogan. Each variant must take a genuinely different angle rather than restating the same claim.",
    "ai_or_distorted": "REALISM (this brand keeps rejecting ads as AI-looking or distorted): the output must read as a real photograph, not a render. Avoid warped geometry, melted edges, duplicated or malformed hands and limbs, waxy poreless skin, and over-glossy CGI lighting. Prefer a simple, clean composition the model can render without artefacts.",
    "too_busy": "SIMPLICITY (this brand keeps rejecting ads as too busy): one focal point. Show the product, one short headline and at most one supporting element. No collage of badges, icons, stickers or callouts, no blocks of small text, and generous empty space around the subject.",
}
FEEDBACK_REASON_SOURCE = "feedback_reasons"
COMPOSE_INJECTION_LIMIT = 8

VARIANT_DIRECTIVES = [
    ("hook-question", "Variant: lead with a short provocative QUESTION as the headline hook instead of a statement."),
    ("benefit-direct", "Variant: make the headline a direct, concrete BENEFIT claim (what the customer gets), not a tagline."),
    ("social-proof", "Variant: frame the copy as SOCIAL PROOF (e.g. loved-by/typical-customer framing) while keeping the same layout."),
]
VARIANT_BRIEF_ANGLE_COPY = {
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
    "educational": "Teach one useful product fact, ingredient, feature, or use case in a clear visual way.",
}
MAX_CUSTOM_VARIANT_DIRECTIVE_CHARS = 5000

UNAVAILABLE_INSTRUCTIONS = {
    "logo": "The logo reference is unavailable and is not attached. Render no logo, wordmark, brand-name lettering, or substitute mark anywhere. Do not invent, approximate, or redraw one. This overrides every later logo instruction.",
    "screenshot": "A requested product screenshot is unavailable and is not attached. Do not invent or simulate software UI; use surviving references or a non-UI conceptual treatment.",
    "product": "A requested product photo is unavailable and is not attached. Do not invent packaging, labels, or product details; use surviving references or a non-literal composition.",
    "size_reference": "A requested size reference is unavailable and is not attached. Do not claim or depict exact scale from that missing image.",
    "user_upload": "A requested user-provided image is unavailable and is not attached. Do not invent its contents or imply that it is visible.",
    "own_ad": "A requested past-ad reference is unavailable and is not attached. Do not reproduce or invent that ad's visual details.",
}
OVERRIDE_HEADER = "REFERENCE AVAILABILITY OVERRIDE (HIGHEST PRIORITY):"

FONT_REFERENCE_PROMPT_LINE = (
    "TYPOGRAPHY IS SET BY THE FONT SPECIMEN. One attached reference (labeled FONT "
    "SPECIMEN in the image list) shows the ad's exact copy in the brand's real "
    "typeface. Every piece of on-image text — headline, subheadline, body, CTA, "
    "badges — MUST be set in that EXACT typeface: reproduce its letterforms, "
    "proportions, and weight. Do NOT substitute a different or generic font, and do "
    "NOT default to a decorative or serif style just because the scene looks premium "
    "— match the FONT SPECIMEN. Its plain background and any small gray captions are "
    "guides only; never render them into the ad."
)

CANVAS_ADAPTATION = (
    "\n\nCANVAS ADAPTATION: the output canvas is {target} ({orientation}), but the source ad's layout was composed for a {template_ratio} canvas. RECOMPOSE the layout for the {target} canvas — re-stack and re-stage the elements and extend the background to fill the space naturally. "
    "NEVER stretch, elongate, squash, or distort any element to fill the canvas. All text must keep natural glyph proportions (no stretched or condensed letterforms), and the product keeps its true real-world proportions."
)

# Playbook text, not server text: make-static-ads-compose departure 4 ("no specific font").
NO_FONT_INSTRUCTION = "TYPOGRAPHY — set all text in a clean, legible typeface that suits the brand and the layout."
NO_FONT_CONTEXT = "Typography: no specific font — set all text in a clean, legible typeface that suits the brand and the layout."

# ---------------------------------------------------------------------------------------------------------------------
# Constants from the server.
# ---------------------------------------------------------------------------------------------------------------------

MAX_AUTO_REFERENCE_IMAGES = 3
MAX_ATTACHED_SIZE_REFS = 3
STRUCTURE_ONLY_SOURCE_KINDS = {"competitor_scrape", "community_source", "curated"}
THIRD_PARTY_SOURCE_KINDS = {"competitor_scrape", "curated"}
REMIX_ENGINES = [
    "nano_banana_2", "nano_banana_pro", "gpt_image_2", "gpt_image_2_5_flare", "gpt_image_2_5_sunburst",
    "fal_flux_kontext", "reve", "ideogram_v4", "seedream_v5_pro", "qwen_image_3", "ideogram_v3_remix",
]
GPT_IMAGE_ENGINES = {"gpt_image_2", "gpt_image_2_5_flare", "gpt_image_2_5_sunburst"}
DEFAULT_ENGINE = "gpt_image_2_5_flare"
CONTENT_POLICY_FALLBACK_ENGINE = "nano_banana_pro"
GPT_IMAGE_MAX_IMAGES = 16
NANO_BANANA_PRO_MAX_IMAGES = 6
AD_RATIOS = ["1:1", "4:5", "9:16", "16:9", "3:4"]
ADS_RENDER_PROMPT_MAX = 12000
ROLES = {"logo", "size_reference", "screenshot", "product", "own_ad", "user_upload"}
MEDIA = ("none", "screen", "product")
GENERIC_FAMILIES = {
    "sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui", "ui-sans-serif", "ui-serif",
    "ui-monospace", "ui-rounded", "-apple-system", "blinkmacsystemfont", "math", "emoji", "inherit", "initial", "unset",
}
# Departure 3 applies only when the heading resolves to one of these plain system faces.
SYSTEM_FACES = {"inter", "arial", "helvetica", "helvetica neue", "roboto", "arimo", "system ui", "sans serif"}
REFERENCE_PLACEHOLDER = re.compile(r"\{\{ref:([a-z0-9][a-z0-9._:-]*)\}\}", re.IGNORECASE)


# ---------------------------------------------------------------------------------------------------------------------
# Small JS-parity helpers.
# ---------------------------------------------------------------------------------------------------------------------

def nn(*values):
    """JS `a ?? b ?? c`: the first value that is not None."""
    for v in values:
        if v is not None:
            return v
    return None


def js_str(v):
    """JS template-literal interpolation of a JSON value."""
    if v is None:
        return "null"
    if v is True:
        return "true"
    if v is False:
        return "false"
    return str(v)


def js_join(values, sep):
    """JS `array.join(sep)`: null and undefined become empty strings."""
    return sep.join("" if v is None else js_str(v) for v in values)


def js_slice(s, n):
    """JS `s.slice(0, n)`: counts UTF-16 code units, not code points. A split surrogate pair is dropped."""
    out, units = [], 0
    for ch in s:
        w = 2 if ord(ch) > 0xFFFF else 1
        if units + w > n:
            break
        out.append(ch)
        units += w
    return "".join(out)


def js_trim(s):
    return s.strip() if isinstance(s, str) else s


def canonical_id(i):
    return i.strip().lower()


# ---------------------------------------------------------------------------------------------------------------------
# §6.3 typography (typographyLine, familyForRole, sanitizeFontFamily).
# ---------------------------------------------------------------------------------------------------------------------

def sanitize_font_family(raw):
    if not raw:
        return None
    name = raw.split(",")[0].strip()
    if not name or name.startswith("var("):
        return None
    name = re.sub(r"^['\"]+|['\"]+\Z", "", name).strip()
    if name.lower() in GENERIC_FAMILIES:
        return None
    name = re.sub(r"^__", "", name)
    name = re.sub(r"_Fallback(?=_|\Z)", "", name, count=1, flags=re.IGNORECASE)
    name = re.sub(r"_[0-9a-f]{4,8}\Z", "", name, flags=re.IGNORECASE)
    name = re.sub(r"[-_]v?[0-9]+\Z", "", name, flags=re.IGNORECASE)
    name = re.sub(r"[-_]+", " ", name).strip()
    if not name:
        return None
    if name.lower() in GENERIC_FAMILIES:
        return None
    words = re.split(r"\s+", name)
    return " ".join(w if (w == w.upper() and len(w) <= 3) else w[0].upper() + w[1:].lower() for w in words)


def family_for_role(role, kit):
    typ = kit.get("typography")
    fonts = kit.get("fonts")
    typ = typ if isinstance(typ, dict) else {}
    fonts = fonts if isinstance(fonts, dict) else {}
    families = fonts.get("families") if isinstance(fonts.get("families"), list) else []
    user_chose = typ.get("source") == "user"
    extracted = nn(fonts.get("heading"), families[0] if families else None)
    if role == "accent":
        if user_chose:
            return nn(typ.get("accent"), typ.get("heading"), extracted)
        return nn(extracted, typ.get("accent"), typ.get("heading"))
    if role == "body":
        if user_chose:
            return nn(typ.get("body"), fonts.get("body"))
        return nn(fonts.get("body"), families[-1] if families else None, typ.get("body"))
    if user_chose:
        return nn(typ.get("heading"), extracted)
    return nn(extracted, typ.get("heading"))


def typography_line_parts(heading, heading_desc, body, body_desc, accent, accent_desc):
    accent_part = (", accent in " + js_str(accent) + (" (" + js_str(accent_desc) + ")" if accent_desc else "")) if accent else ""
    return (
        "Typography: headings in " + js_str(heading) + " (" + js_str(heading_desc) + "), body in " + js_str(body)
        + " (" + js_str(body_desc) + ")" + accent_part + " — render text in this EXACT font family, in its own letterforms."
    )


def resolved_families(kit):
    typo = kit.get("typography")
    if not isinstance(typo, dict) or not typo:
        raise ComposeError(
            "kit.typography is missing. The server then uses its curated font library, which an agent cannot see "
            "(composer.md §12). Set font to \"pairing\" or \"none\", or fill kit.typography with heading, body and "
            "their descriptors."
        )
    heading = nn(sanitize_font_family(family_for_role("heading", kit)), typo.get("heading"))
    body = nn(sanitize_font_family(family_for_role("body", kit)), typo.get("body"))
    return typo, heading, body


def typography_line(kit):
    typo, heading, body = resolved_families(kit)
    for key in ("headingDescriptor", "bodyDescriptor"):
        if typo.get(key) is None:
            raise ComposeError("kit.typography.%s is missing; the server line would print 'undefined'." % key)
    return typography_line_parts(heading, typo.get("headingDescriptor"), body, typo.get("bodyDescriptor"),
                                 typo.get("accent"), typo.get("accentDescriptor"))


def pairing_line(p):
    for key in ("heading", "heading_descriptor", "body", "body_descriptor"):
        if not p.get(key):
            raise ComposeError("font_pairing.%s is required when font is \"pairing\"." % key)
    return typography_line_parts(p["heading"], p["heading_descriptor"], p["body"], p["body_descriptor"],
                                 p.get("accent"), p.get("accent_descriptor"))


# ---------------------------------------------------------------------------------------------------------------------
# §2 flags and path.
# ---------------------------------------------------------------------------------------------------------------------

def price_for_display(pricing):
    s = (pricing or "").strip() if isinstance(pricing, str) else ("" if pricing is None else str(pricing).strip())
    if not s:
        return None
    if re.fullmatch(r"free", s, flags=re.IGNORECASE):
        return "Free"
    figures = [float(x) for x in re.findall(r"[0-9]+(?:\.[0-9]+)?", s.replace(",", ""))]
    if figures and all(f == 0 for f in figures):
        return "Free"
    return s


def resolve(ad):
    """Every decision the server makes before composing (composer.md §2, §3, §4), plus the playbook departures."""
    if not isinstance(ad, dict):
        raise ComposeError("ad.json must be a JSON object.")
    kit = ad.get("kit")
    template = ad.get("template")
    if not isinstance(kit, dict):
        raise ComposeError("ad.json needs a kit object (brand_read kit, detail full).")
    if not isinstance(template, dict):
        raise ComposeError("ad.json needs a template object (ads_template_read).")
    warnings, departures = [], []
    source_kind = template.get("source_kind")

    # §2.2 + departure 5: structure-only when the brand does not own the template.
    server_structure_only = source_kind in STRUCTURE_ONLY_SOURCE_KINDS
    brand_owned = template.get("brand_owned")
    if brand_owned is None:
        brand_owned = not server_structure_only
    structure_only = server_structure_only or brand_owned is False
    if structure_only and not server_structure_only:
        departures.append(5)
    blueprint = media_slot = None
    if structure_only:
        st = ad.get("structure") or {}
        blueprint = st.get("blueprint_instruction")
        if not isinstance(blueprint, str) or not blueprint:
            raise ComposeError(
                "This template is structure-only (not the brand's own ad), so structure.blueprint_instruction is "
                "required: run structure-blueprint.md first. The source image must never reach the composer."
            )
        slot = st.get("media_slot")
        media_slot = "screen" if slot == "screen" else "none" if slot == "none" else "product"
        if st.get("reduced_mechanic"):
            departures.append(2)

    # §2.1 styling flags; departures 3 and 4 for the font.
    third_party = source_kind in THIRD_PARTY_SOURCE_KINDS
    apply_colors = ad.get("apply_brand_colors", True)
    if apply_colors is None:
        apply_colors = True
    if third_party and not apply_colors:
        warnings.append("composer.md §2.1: %s templates always restyle to brand colours; the template's colours were "
                        "not kept. Tell the marketer." % source_kind)
        apply_colors = True
    font = ad.get("font") or "brand"
    if font not in ("brand", "template", "pairing", "none"):
        raise ComposeError('font must be "brand", "template", "pairing" or "none".')
    if third_party and font == "template":
        warnings.append("composer.md §2.1: %s templates always use the brand font; the template's font was not kept. "
                        "Tell the marketer." % source_kind)
        font = "brand"
    apply_font = font != "template"
    if font == "pairing":
        departures.append(3)
        try:
            _, heading, _ = resolved_families(kit)
        except ComposeError:
            heading = None
        if heading and heading.lower() not in SYSTEM_FACES and not ad.get("brand_font_unavailable"):
            warnings.append('Departure 3 is for a plain system face; this brand\'s heading font is "%s". Check the '
                            "pairing is really wanted." % heading)
    if font == "none":
        departures.append(4)

    # §2.3 logo.
    no_logo = bool(ad.get("no_logo"))
    has_logo_ref = bool(kit.get("logoUrl")) and not no_logo

    # §3 scheme.
    scheme = ad.get("scheme")
    if scheme:
        for key in ("background", "ink", "accent"):
            if not scheme.get(key):
                raise ComposeError("scheme.%s is required (use schemes.py output, or null for no scheme)." % key)
        scheme = dict(scheme, on_accent=readable_ink(scheme["accent"]))
    else:
        scheme = None

    # §4.1 references.
    all_refs = kit.get("referenceImages") or []
    auto_refs = [r for r in all_refs if r.get("kind") != "own_ad"] + [r for r in all_refs if r.get("kind") == "own_ad"]
    requested = (ad.get("product_name") or "").strip()
    selected, refs = None, auto_refs[:MAX_AUTO_REFERENCE_IMAGES]
    if requested:
        match = next((p for p in (kit.get("products") or [])
                      if (p.get("name") or "").strip().lower() == requested.lower()), None)
        if not match:
            warnings.append('product_name "%s" is not in kit.products; the server falls back to auto references '
                            "(composer.md §4.1)." % requested)
        else:
            refs = [r for r in all_refs if r.get("productName") == match["name"]][:MAX_AUTO_REFERENCE_IMAGES]
            if not refs:
                refs = [r for r in all_refs if r.get("kind") == "website_screenshot"][:MAX_AUTO_REFERENCE_IMAGES]
            rec = ad.get("product") or {}

            def field(snake, camel):
                return nn(rec.get(snake), match.get(camel))

            selected = {
                "name": match["name"],
                "description": field("description", "description"),
                "pricing": field("pricing", "pricing"),
                "offers": field("offers", "offers"),
                "notes": field("notes", "notes"),
                "aiCreativeNotes": field("ai_creative_notes", "aiCreativeNotes"),
                "hasImage": len(refs) > 0,
                "sizeReferenceUrls": list(nn(rec.get("size_reference_urls"), match.get("sizeReferenceUrls"), []))
                [:MAX_ATTACHED_SIZE_REFS],
            }
    uploads = [u for u in (ad.get("user_uploads") or [])
               if isinstance(u, str) and re.match(r"^https?://", u, flags=re.IGNORECASE)][:MAX_AUTO_REFERENCE_IMAGES]
    if uploads:
        refs = [{"url": u, "productName": selected["name"] if selected else None, "kind": "user_upload"}
                for u in uploads]
        if selected:
            selected = dict(selected, hasImage=True)

    # §4.2 inventory.
    assets = []
    if has_logo_ref:
        assets.append({"id": "logo", "url": kit["logoUrl"], "role": "logo"})
    for i, url in enumerate((selected or {}).get("sizeReferenceUrls") or []):
        assets.append({"id": "size-reference-%d" % (i + 1), "url": url, "role": "size_reference",
                       "productName": selected["name"]})
    counters = {"own_ad": 0, "screenshot": 0, "user_upload": 0, "product": 0}
    for r in refs:
        kind = r.get("kind")
        role = {"own_ad": "own_ad", "website_screenshot": "screenshot", "user_upload": "user_upload"}.get(kind, "product")
        counters[role] += 1
        prefix = {"own_ad": "own-ad", "screenshot": "screenshot", "user_upload": "user-upload", "product": "product"}[role]
        a = {"id": "%s-%d" % (prefix, counters[role]), "url": r.get("url"), "role": role,
             "productName": r.get("productName")}
        if role == "user_upload":
            a["userIndex"] = counters[role]
        assets.append(a)

    products = kit.get("products") or []
    product_led = len(products) > 1 and selected is not None
    proof_points = ad.get("proof_points") or []
    if proof_points and product_led:
        departures.append(1)
    elif proof_points:
        warnings.append("proof_points (departure 1) is used only on the product-led path; this brand's own Proof "
                        "points line is already in the context.")

    # §6.6 user instructions and §6.7 variant directive.
    base = (ad.get("user_instructions") or "").strip()
    angle = (ad.get("messaging_angle") or "").strip()
    if not angle or angle.lower() in base.lower():
        user_prompt = base or None
    else:
        user_prompt = "\n\n".join(x for x in [base, ANGLE_LINE.format(angle=angle)] if x)
    variant_directive = None
    variant = ad.get("variant") or {}
    if variant.get("brief") is not None:
        brief = variant["brief"]
        key = brief.get("angle") or "auto"
        if key not in VARIANT_BRIEF_ANGLE_COPY:
            raise ComposeError('variant.brief.angle "%s" is not a VARIANT_BRIEF_ANGLE_COPY key (composer.md §6.7).' % key)
        message = (brief.get("message") or "").strip()
        if len(message) > 700:
            warnings.append("variant.brief.message is longer than the server's 700-character limit.")
        lines = ["Variant brief: " + VARIANT_BRIEF_ANGLE_COPY[key]]
        if message:
            lines.append("Use this exact messaging direction for this variant: " + message)
        variant_directive = js_slice("\n".join(lines), MAX_CUSTOM_VARIANT_DIRECTIVE_CHARS)
    elif variant.get("index") is not None:
        k = int(variant["index"])
        if k > 0:
            variant_directive = VARIANT_DIRECTIVES[(k - 1) % len(VARIANT_DIRECTIVES)][1]

    if ad.get("content_policy_recompose"):
        departures.append(6)

    return {
        "ad": ad, "kit": kit, "template": template, "structure_only": structure_only, "blueprint": blueprint,
        "media_slot": media_slot, "apply_colors": apply_colors, "apply_font": apply_font, "font": font,
        "no_logo": no_logo, "has_logo_ref": has_logo_ref, "scheme": scheme, "selected": selected, "refs": refs,
        "assets": assets, "product_led": product_led, "proof_points": proof_points if product_led else [],
        "user_prompt": user_prompt, "has_user_prompt": bool(base), "variant_directive": variant_directive,
        "warnings": warnings, "departures": sorted(set(departures)),
    }


# ---------------------------------------------------------------------------------------------------------------------
# §6.5 learnings.
# ---------------------------------------------------------------------------------------------------------------------

def learnings_block(ad):
    rows = [r for r in (ad.get("learnings") or []) if isinstance(r, dict)]
    blocks = []
    top = rows[:COMPOSE_INJECTION_LIMIT]
    if top:
        def bucket(kind):
            return ["- " + js_str(r.get("text")) for r in top if r.get("kind") == kind]
        sections = [LEARNINGS_HEADER]
        for label, kind in (("ALWAYS (non-negotiable):", "must"), ("AVOID:", "dont"), ("PREFER:", "do"),
                            ("Template guidance:", "template_hint"), ("Notes:", "insight")):
            b = bucket(kind)
            if b:
                sections += [label] + b
        if len(sections) > 1:
            blocks.append("\n".join(sections))
    reasons = ad.get("recurring_rejection_reasons")
    if reasons is None:
        reasons = []
        for r in rows:
            if r.get("source") == FEEDBACK_REASON_SOURCE and isinstance(r.get("text"), str):
                head, _, tail = r["text"].partition("):")
                reasons = re.findall(r"([a-z_]+) ×[0-9]+", tail if tail else head)
                break
    seen, directives = set(), []
    for reason in reasons:
        if reason in REASON_DIRECTIVES and reason not in seen:
            seen.add(reason)
            directives.append(REASON_DIRECTIVES[reason])
    if directives:
        blocks.append("\n".join([ADJUSTMENT_HEADER] + ["- " + d for d in directives]))
    return "\n\n".join(blocks) if blocks else None


# ---------------------------------------------------------------------------------------------------------------------
# §6 context and §5 instructions.
# ---------------------------------------------------------------------------------------------------------------------

def attachment_manifest(st):
    lines = [] if st["structure_only"] else [MANIFEST_SOURCE]
    for a in st["assets"]:
        ph = "{{ref:%s}}" % a["id"]
        role = a["role"]
        if role == "logo":
            lines.append("[ID: %s] Brand logo. If the prompt explicitly refers to it, write %s." % (a["id"], ph))
        elif role == "size_reference":
            lines.append("[ID: %s] Size reference for %s (SCALE ONLY). Select it only with a physical-product target; "
                         "take no scene or appearance from it. Refer to it as %s."
                         % (a["id"], nn(a.get("productName"), "the selected product"), ph))
        elif role == "screenshot":
            lines.append("[ID: %s] Real product UI screenshot. Select it only when target_media='screen'; reproduce "
                         "its interface faithfully. Refer to it as %s." % (a["id"], ph))
        elif role == "own_ad":
            lines.append("[ID: %s] One of the brand's OWN past ads (a finished advertisement). Style cue only — it can "
                         "NEVER satisfy target_media='product' or 'screen'. Select it only to echo the brand's look, "
                         "and refer to it as %s." % (a["id"], ph))
        elif role == "user_upload":
            lines.append("[ID: %s] User-provided image #%s. Follow the user's assigned role; refer to it as %s."
                         % (a["id"], nn(a.get("userIndex"), "?"), ph))
        else:
            of = (" of " + a["productName"]) if a.get("productName") else ""
            lines.append("[ID: %s] Real product photo%s. Select it only when target_media='product'; reproduce it "
                         "faithfully. Refer to it as %s." % (a["id"], of, ph))
    lines.append(MANIFEST_FOOTER if st["assets"] else MANIFEST_EMPTY)
    return lines


def build_context(st):
    kit, t, sel = st["kit"], st["template"], st["selected"]
    ad_products = [p for p in (kit.get("products") or []) if p.get("adEligibility") != "hidden"]
    spec = t.get("remix_spec")
    spec_prompt = spec.get("prompt") if isinstance(spec, dict) and isinstance(spec.get("prompt"), str) else None
    product_led = st["product_led"]

    source_lines = []
    if not st["structure_only"]:
        source_lines = ["## Source template", "Title: " + js_str(t.get("title"))]
        if t.get("description"):
            source_lines.append("Description: " + js_str(t["description"]))
        if t.get("layout_type"):
            source_lines.append("Layout: " + js_str(t["layout_type"]))
        if t.get("style_tags"):
            source_lines.append("Style: " + js_join(t["style_tags"], ", "))
        if t.get("mood_tags"):
            source_lines.append("Mood: " + js_join(t["mood_tags"], ", "))
        if t.get("text_complexity"):
            source_lines.append("Text density: %s (mirror this — see text rule)" % t["text_complexity"])
        if spec_prompt:
            source_lines += ["", "## Template remix instructions (authoritative — follow them)", spec_prompt]

    name = js_str(kit.get("name"))
    brand = ["## Brand", "Name: " + name,
             'Brand name casing: write the name exactly as "%s" — preserve its capitalization, do not uppercase or '
             "title-case it." % name]
    if kit.get("description"):
        brand.append("What they do: " + js_str(kit["description"]))
    if not product_led and kit.get("audience"):
        brand.append("Audience: " + js_str(kit["audience"]))
    if kit.get("voice"):
        brand.append("Voice: " + js_str(kit["voice"]))
    if not product_led:
        if kit.get("brandType"):
            brand.append("Brand type: " + js_str(kit["brandType"]))
        if kit.get("valueProps"):
            brand.append("Value props: " + js_join(kit["valueProps"], " | "))
        if kit.get("proofPoints"):
            brand.append("Proof points: " + js_join(kit["proofPoints"], " | "))
        if kit.get("websiteUrl"):
            brand.append("Website: " + js_str(kit["websiteUrl"]))
    elif st["proof_points"]:
        brand.append("Proof points: " + js_join(st["proof_points"], " | "))  # departure 1
    if kit.get("messagingAngles"):
        brand.append("Messaging angles (available copy directions — lead with the one that best fits this ad): "
                     + " | ".join("%s — %s" % (js_str(a.get("name")), js_str(a.get("statement")))
                                  for a in kit["messagingAngles"][:6]))
    if st["apply_colors"]:
        sc = st["scheme"]
        if sc:
            brand += [CTX_BG.format(bg=sc["background"]), CTX_TEXT.format(ink=sc["ink"]),
                      CTX_ACCENT.format(accent=sc["accent"]), CTX_READ]
        else:
            for label, key in (("Primary color: ", "primaryColor"), ("Accent color: ", "accentColor"),
                               ("Brand background colour: ", "backgroundColor"), ("Brand text colour: ", "textColor"),
                               ("How this brand uses colour: ", "paletteRead")):
                if kit.get(key):
                    brand.append(label + js_str(kit[key]))
            if kit.get("palette") and len(kit["palette"]) > 1:
                brand.append("Brand palette (an unordered set, not a ranking): " + js_join(kit["palette"], ", "))
    else:
        brand.append(CTX_COLORS_KEEP)
    if not st["apply_font"]:
        brand.append(CTX_TYPO_KEEP)
    elif st["font"] == "none":
        brand.append(NO_FONT_CONTEXT)
    elif st["font"] == "pairing":
        brand.append(pairing_line(st["ad"].get("font_pairing") or {}))
    else:
        brand.append(typography_line(kit))
    if not sel and ad_products:
        brand.append("Products: " + ", ".join(js_str(p.get("name")) for p in ad_products[:4]))
    if st["no_logo"]:
        brand.append(CTX_NO_LOGO)
    elif kit.get("logoUrl"):
        brand.append(CTX_LOGO)

    featured = []
    if sel:
        featured = [CTX_FEATURED, "Name: " + sel["name"]]
        if sel.get("description"):
            featured.append("Description: " + js_str(sel["description"]))
        price = price_for_display(sel.get("pricing"))
        if price:
            featured.append("Price: " + price)
        if sel.get("offers"):
            featured.append("Current offer: " + js_str(sel["offers"]))
        if sel.get("notes"):
            featured += ["Product details:", js_slice(sel["notes"], 1200)]
        if sel.get("aiCreativeNotes"):
            featured += [CTX_GUIDANCE, js_slice(sel["aiCreativeNotes"], 1200)]
        featured.append(CTX_SIZE_REF if sel.get("sizeReferenceUrls") else CTX_SIZE_EST)
        if not sel["hasImage"]:
            featured.append(CTX_NO_PHOTO)

    guidance = []
    if not sel:
        guidance = ["- %s: %s" % (p["name"], js_slice(p["aiCreativeNotes"].strip(), 600))
                    for p in ad_products if (p.get("aiCreativeNotes") or "").strip()][:8]

    lines = source_lines + [""]
    if product_led:
        lines += featured + [""] + brand
    else:
        lines += brand
        if featured:
            lines += [""] + featured
    lines += ["", CTX_MANIFEST_HEADER] + attachment_manifest(st)
    if guidance:
        lines += ["", CTX_PER_PRODUCT] + guidance
    if not product_led:
        for doc_name, text in (kit.get("docs") or {}).items():
            lines += ["", "## Brand research — " + doc_name, "" if text is None else js_str(text)]
    if (kit.get("instructions") or "").strip():
        lines += ["", CTX_INSTRUCTIONS, kit["instructions"].strip()]
    block = learnings_block(st["ad"])
    if block and block.strip():
        lines += ["", block.strip()]
    if st["user_prompt"] and st["user_prompt"].strip():
        lines += ["", CTX_USER, st["user_prompt"].strip()]
    if st["variant_directive"]:
        lines += ["", CTX_VARIANT, st["variant_directive"]]
    return "\n".join(lines)


def build_compose_input(ad):
    """composer.md §5 + §6: the exact text the server sends to the composer model."""
    st = resolve(ad)
    return assemble_compose_input(st), st


def assemble_compose_input(st):
    sc, sel = st["scheme"], st["selected"]
    so = st["structure_only"]
    lines = [L1_STRUCTURE if so else L1_NORMAL, L2_STRUCTURE if so else L2_NORMAL]
    if so:
        lines.append(st["blueprint"])
    lines += [ADAPT_SUBJECT, TARGET_CONTRACT]
    if so:
        lines.append(SCENE)
    lines.append(PHOTOREALISM)
    if any(r.get("kind") == "user_upload" for r in st["refs"]):
        lines.append(USER_UPLOADS)
    if st["apply_colors"]:
        if sc:
            lines.append(COLORS_BY_ROLE.format(background=sc["background"], ink=sc["ink"], accent=sc["accent"],
                                               on_accent=sc["on_accent"]))
        else:
            lines.append(COLORS_RESTYLE)
    else:
        lines.append(COLORS_KEEP)
    if not st["apply_font"]:
        lines.append(TYPO_KEEP)
    elif st["font"] == "none":
        lines.append(NO_FONT_INSTRUCTION)
    else:
        lines.append(TYPO_SURGICAL)
    lines += [NAME_PRODUCT, PRODUCT_FIDELITY, ON_PRODUCT_TEXT, STAGING]
    lines.append(SIZE_REFS if sel and sel.get("sizeReferenceUrls") else SIZE_ESTIMATE)
    if st["no_logo"]:
        lines.append(NO_LOGO)
    else:
        lines.append(LOGO_ATTACHED + (LOGO_LETTERING.format(ink=sc["ink"]) if sc else ""))
    lines += [TEXT_DENSITY, SAFE_MARGIN, COHERENT_COPY, SOURCE_TEXT, CLAIMS, SIGNATURE, MEDIA_RULE, DEVICE_SCREENS]
    if sel and not sel["hasImage"]:
        lines.append(NO_PHOTO_PRODUCT.format(name=sel["name"]))
    if st["product_led"]:
        lines.append(PRODUCT_LED)
    lines += [COMPOSE_OUTPUT_INSTRUCTION, "", build_context(st)]
    return "\n".join(lines)


# ---------------------------------------------------------------------------------------------------------------------
# §7 answer checks, §8 gating, manifest and placeholders.
# ---------------------------------------------------------------------------------------------------------------------

def role_fits(role, media):
    if role == "logo":
        return True
    if role in ("user_upload", "own_ad"):
        return False
    if media == "screen":
        return role == "screenshot"
    if media == "product":
        return role in ("product", "size_reference")
    return False


def select_target_assets(assets, source_media, target_media, reference_ids, metadata_present, has_user_prompt, warnings):
    def mandatory(a):
        return a["role"] == "logo" or (a["role"] == "user_upload" and has_user_prompt)

    if not metadata_present or target_media is None:
        if source_media is None:
            return list(assets)
        return [a for a in assets if mandatory(a) or role_fits(a["role"], source_media)]
    by_id = {canonical_id(a["id"]): a for a in assets}
    selected = set(canonical_id(i) for i in reference_ids)
    for i in reference_ids:
        if canonical_id(i) not in by_id:
            warnings.append('composer selected unknown reference id "%s"; ignored (the server does the same).' % i)
            selected.discard(canonical_id(i))
    for i in list(selected):
        a = by_id[i]
        if a["role"] not in ("user_upload", "own_ad") and not role_fits(a["role"], target_media):
            warnings.append('composer selected %s reference "%s" for target_media=%s; dropped (the server does the '
                            "same)." % (a["role"], i, target_media))
            selected.discard(i)
    grounding = [a for a in assets if a["role"] not in ("logo", "user_upload") and role_fits(a["role"], target_media)]
    if target_media != "none" and grounding and not any(canonical_id(a["id"]) in selected for a in grounding):
        warnings.append("composer selected no grounding reference for target_media=%s; attaching %d compatible "
                        "reference(s) (the server does the same)." % (target_media, len(grounding)))
        for a in grounding:
            selected.add(canonical_id(a["id"]))
    physical = any(a["role"] == "product" and canonical_id(a["id"]) in selected for a in assets)
    return [a for a in assets if mandatory(a) or canonical_id(a["id"]) in selected
            or (physical and a["role"] == "size_reference")]


def final_image_manifest(slots):
    lines = ["Input images, in order:"]
    for i, s in enumerate(slots):
        n, role = i + 1, s["role"]
        if role == "template":
            lines.append("Image %d: the source ad template — recreate its layout and composition." % n)
        elif role == "logo":
            lines.append("Image %d: the brand's real logo — reproduce it exactly as given." % n)
        elif role == "size_reference":
            lines.append("Image %d: size reference (SCALE ONLY) — take only the product's true real-world scale from "
                         "it; never copy its hands, people, objects, or background." % n)
        elif role == "screenshot":
            lines.append("Image %d: website screenshot of the brand's real product UI — reproduce the on-screen "
                         "interface faithfully, presented on a screen, never as a physical product." % n)
        elif role == "own_ad":
            lines.append("Image %d: one of the brand's OWN past ads — a finished advertisement, not a product. Take "
                         "only brand cues from it (palette, type, tone, how they shoot their work); never reproduce "
                         "its layout, headline, or copy, and never treat it as a product photo." % n)
        elif role == "user_upload":
            idx = (" #%s" % s["userIndex"]) if s.get("userIndex") else ""
            pn = (" (%s)" % s["productName"]) if s.get("productName") else ""
            lines.append("Image %d: user-provided image%s%s — use it exactly as the instructions below direct; if no "
                         "role is given, treat it as the real product photo and reproduce it faithfully." % (n, idx, pn))
        elif role == "font_reference":
            lines.append("Image %d: FONT SPECIMEN (typography authority) — the ad's exact text copy pre-rendered in the "
                         "brand's REAL typeface on a plain white card. Every piece of on-image text MUST use this "
                         "exact typeface — copy its letterforms, proportions, and weight; do not substitute or default "
                         "to another style. Its white background and gray captions are guides only, never render "
                         "them." % n)
        else:
            of = (" of " + s["productName"]) if s.get("productName") else ""
            lines.append("Image %d: real product photo%s — reproduce it faithfully: same packaging, label, shape, and "
                         "true proportions; never invent or alter it." % (n, of))
    return "\n".join(lines)


def reconcile_unavailable(prompt, slots, unavailable, logo_state="unavailable"):
    attached = set(canonical_id(s["id"]) for s in slots if s.get("id"))
    known = {canonical_id(a["id"]): a["role"] for a in unavailable}
    reconciled = {}
    for m in REFERENCE_PLACEHOLDER.finditer(prompt):
        i = canonical_id(m.group(1))
        if i in attached:
            continue
        if i == "logo":
            if logo_state != "attached":
                reconciled[i] = ("logo", logo_state)
            continue
        role = known.get(i)
        if role:
            reconciled[i] = (role, "unavailable")
    if not reconciled:
        return prompt, []

    def repl(m):
        res = reconciled.get(canonical_id(m.group(1)))
        if not res:
            return m.group(0)
        if res[1] == "composited":
            return "[the real logo will be composited after rendering — leave its area clear]"
        return "[unavailable %s reference — omit it]" % res[0].replace("_", " ")

    body = REFERENCE_PLACEHOLDER.sub(repl, prompt)
    degradations = [{"id": i, "role": r, "reason": "unavailable"} for i, (r, s) in reconciled.items()
                    if s == "unavailable"]
    instructions = [UNAVAILABLE_INSTRUCTIONS[r] for r, s in reconciled.values()]
    override = "\n".join([OVERRIDE_HEADER] + ["- " + x for x in instructions])
    return override + "\n\n" + body, degradations


def resolve_placeholders(prompt, slots):
    positions = {}
    for idx, s in enumerate(slots):
        if not s.get("id"):
            continue
        i = s["id"].lower()
        if i in positions:
            raise ComposeError("Duplicate reference id in final manifest: " + s["id"])
        positions[i] = idx + 1

    def repl(m):
        pos = positions.get(m.group(1).lower())
        if not pos:
            raise ComposeError(
                'Prompt requires reference "%s" but it is not attached to this render. The server fails the ad here. '
                "Edit answer.json: remove that placeholder from prompt (or pick a reference that fits target_media), "
                "then run final again." % m.group(1))
        return "Image %d" % pos

    return REFERENCE_PLACEHOLDER.sub(repl, prompt)


def final_prompt_result(body, slots, unavailable=(), logo_state="unavailable"):
    reconciled, degradations = reconcile_unavailable(body, slots, list(unavailable), logo_state)
    return final_image_manifest(slots) + "\n\n" + resolve_placeholders(reconciled, slots), degradations


def with_ratio_adaptation(prompt, target, template_ratio):
    if not template_ratio or template_ratio == target:
        return prompt
    orientation = {"9:16": "vertical portrait", "4:5": "portrait", "16:9": "horizontal landscape"}.get(target, "square")
    return prompt + CANVAS_ADAPTATION.format(target=target, orientation=orientation, template_ratio=template_ratio)


def resolve_engine(batch_engine, template_engine):
    if batch_engine in REMIX_ENGINES:
        return batch_engine
    if template_engine == "gpt_image_2":
        return DEFAULT_ENGINE
    if template_engine in REMIX_ENGINES:
        return template_engine
    return DEFAULT_ENGINE


def max_images(engine):
    if engine in GPT_IMAGE_ENGINES:
        return GPT_IMAGE_MAX_IMAGES
    if engine == "nano_banana_pro":
        return NANO_BANANA_PRO_MAX_IMAGES
    return float("inf")


def reads_specimen(engine):
    return engine in GPT_IMAGE_ENGINES or engine == "nano_banana_pro"


def fallback_engine(engine):
    return DEFAULT_ENGINE if engine == "nano_banana_pro" else CONTENT_POLICY_FALLBACK_ENGINE


def check_answer(answer):
    if not isinstance(answer, dict):
        raise ComposeError("answer.json must be one JSON object with the six composer fields.")
    prompt = answer.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        raise ComposeError("answer.prompt must be a non-blank string.")
    title = answer.get("title")
    if not isinstance(title, str) or not title.strip():
        raise ComposeError("answer.title must be a non-blank string.")
    for key in ("source_media", "target_media"):
        if answer.get(key) is not None and answer[key] not in MEDIA:
            raise ComposeError("answer.%s must be 'none', 'screen', 'product' or null." % key)
    if answer.get("adapted_subject") is not None and not isinstance(answer["adapted_subject"], str):
        raise ComposeError("answer.adapted_subject must be a string or null.")
    if not isinstance(answer.get("reference_ids"), list):
        raise ComposeError("answer.reference_ids must be an array (use [] when none).")


def build_final(ad, answer):
    """composer.md §7 checks, §8, §9, §10 and the §11 ads_render arguments."""
    st = resolve(ad)
    check_answer(answer)
    warnings = st["warnings"]
    t = st["template"]
    viewed = t.get("source_image_viewed", True) is not False
    if st["structure_only"]:
        source_media = st["media_slot"] or "product"
    else:
        source_media = answer.get("source_media") if viewed else None
    target_media = answer.get("target_media") if answer.get("target_media") in MEDIA else None
    adapted = answer.get("adapted_subject")
    adapted = adapted.strip() if isinstance(adapted, str) and adapted.strip() else None
    ids = []
    for i in answer["reference_ids"]:
        if isinstance(i, str) and canonical_id(i) and canonical_id(i) not in ids:
            ids.append(canonical_id(i))
    # Server: target_media set, adapted_subject set, or reference_ids is an array. check_answer requires the array.
    metadata_present = True
    prompt = answer["prompt"]

    # §7 placeholder check (the server fails the whole ad).
    unselected = []
    for m in REFERENCE_PLACEHOLDER.finditer(prompt):
        i = canonical_id(m.group(1))
        if i not in ids and i != "logo" and i not in unselected:
            unselected.append(i)
    if unselected:
        raise ComposeError("Compose prompt referenced unselected asset id(s): %s. Add them to reference_ids or remove "
                           "the placeholders (composer.md §7), then run final again." % ", ".join(unselected))

    # §8.1 gate, §8.2 unavailable, §8.3 order.
    selected_assets = select_target_assets(st["assets"], source_media, target_media, ids, metadata_present,
                                           st["has_user_prompt"], warnings)
    unavailable_ids = set(canonical_id(i) for i in (ad.get("unavailable_reference_ids") or []))
    missing = [a for a in selected_assets if canonical_id(a["id"]) in unavailable_ids]
    attached = [a for a in selected_assets if canonical_id(a["id"]) not in unavailable_ids]
    if not st["structure_only"] and not t.get("source_image_url"):
        raise ComposeError("template.source_image_url is required on the normal path (it is Image 1).")
    image_urls = ([] if st["structure_only"] else [t["source_image_url"]]) + [a["url"] for a in attached]
    slots = ([] if st["structure_only"] else [{"role": "template"}]) + [
        {"id": a["id"], "role": a["role"], "userIndex": a.get("userIndex"), "productName": a.get("productName")}
        for a in attached]
    logo_state = "intentionally_omitted" if st["no_logo"] else "unavailable"
    body, degradations = reconcile_unavailable(prompt, slots, missing, logo_state)
    final_prompt, _ = final_prompt_result(body, slots)
    pre_specimen_prompt = final_prompt

    # §9 font specimen.
    engine = resolve_engine(ad.get("engine"), t.get("remix_engine"))
    if ad.get("engine") and ad["engine"] not in REMIX_ENGINES:
        raise ComposeError('engine "%s" is not a GooseWorks engine.' % ad["engine"])
    budget = min(max_images(engine), max_images(fallback_engine(engine)))
    specimen = {"eligible": False, "inserted": False, "url": None, "reason": None}
    if st["font"] == "none":
        specimen["reason"] = "no specific font (departure 4)"
    elif not st["apply_font"]:
        specimen["reason"] = "brand font is off (KEEP SOURCE)"
    elif not reads_specimen(engine):
        specimen["reason"] = "engine %s does not read a font specimen" % engine
    elif not len(image_urls) < budget:
        specimen["reason"] = "already %d images; a specimen needs fewer than %s" % (len(image_urls), budget)
    else:
        specimen["eligible"] = True
    url = ad.get("font_specimen_url")
    if url and specimen["eligible"]:
        at = min(1, len(image_urls))
        image_urls = image_urls[:at] + [url] + image_urls[at:]
        slots = slots[:at] + [{"role": "font_reference"}] + slots[at:]
        final_prompt, _ = final_prompt_result(FONT_REFERENCE_PROMPT_LINE + "\n\n" + body, slots)
        specimen.update(inserted=True, url=url)
    elif url:
        warnings.append("font_specimen_url ignored: not eligible (%s)." % specimen["reason"])
    elif specimen["eligible"]:
        specimen["reason"] = ("eligible: extract the copy from specimen_input_prompt (font-specimen.md §2), render "
                              "and upload the card, set font_specimen_url, and run final again; or record why none.")

    # §10 engine cap (departure 6: no cross-model fallback engine, so only the project engine).
    cap = max_images(engine)
    if len(image_urls) > cap:
        kept = slots[:int(cap)]
        dropped = [{"id": s["id"], "role": s["role"]} for s in slots[int(cap):]
                   if s.get("id") and s["role"] not in ("template", "font_reference")]
        final_prompt, more = final_prompt_result(body, kept, dropped, logo_state)
        degradations += more
        slots, image_urls = kept, image_urls[:int(cap)]
        warnings.append("engine %s takes at most %d images; the rest were dropped and marked unavailable." % (engine, cap))

    title = answer["title"].strip()
    renders = []
    for ratio in ad.get("ratios") or []:
        if ratio not in AD_RATIOS:
            raise ComposeError('ratio "%s" is not one of %s.' % (ratio, ", ".join(AD_RATIOS)))
        p = with_ratio_adaptation(final_prompt, ratio, t.get("ratio"))
        if len(p) > ADS_RENDER_PROMPT_MAX:
            warnings.append("the %s prompt is %d characters; ads_render takes at most %d." % (ratio, len(p),
                                                                                            ADS_RENDER_PROMPT_MAX))
        args = {"brand_id": ad.get("brand_id"), "prompt": p, "image_urls": list(image_urls), "ratios": [ratio],
                "variants": 1}
        if engine != DEFAULT_ENGINE:
            args["engine"] = engine
        args["title"] = title
        if st["selected"]:
            args["product_name"] = st["selected"]["name"]
        args["dry_run"] = True
        renders.append({"ratio": ratio, "prompt": p, "image_urls": list(image_urls), "ads_render": args})
    if not renders:
        raise ComposeError("ad.json needs at least one entry in ratios.")

    out = {
        "title": title,
        "structure_only": st["structure_only"],
        "source_media": source_media,
        "target_media": target_media,
        "adapted_subject": adapted,
        "reference_ids": ids,
        "attached_references": [{"id": a["id"], "role": a["role"], "url": a["url"]} for a in attached],
        "degradations": degradations,
        "engine": engine,
        "font_specimen": specimen,
        "renders": renders,
        "departures_used": st["departures"],
        "warnings": warnings,
    }
    if specimen["eligible"] and not specimen["inserted"]:
        out["specimen_input_prompt"] = pre_specimen_prompt
    return out


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main(argv):
    if len(argv) >= 3 and argv[1] == "input":
        text, st = build_compose_input(_load(argv[2]))
        sys.stdout.write(text + "\n")
        for w in st["warnings"]:
            sys.stderr.write("warning: " + w + "\n")
        if not st["structure_only"]:
            sys.stderr.write("note: the server then sends the label \"%s\" and the source image %s. View that image "
                             "before answering.\n" % (SOURCE_AD_LABEL, st["template"].get("source_image_url")))
        return 0
    if len(argv) >= 4 and argv[1] == "final":
        out = build_final(_load(argv[2]), _load(argv[3]))
        sys.stdout.write(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
        return 0
    sys.stderr.write(__doc__.split("\n\n")[2] + "\n")
    return 2


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except ComposeError as e:
        sys.stderr.write("compose.py: %s\n" % e)
        sys.exit(1)
