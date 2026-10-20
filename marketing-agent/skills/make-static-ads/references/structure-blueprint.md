# Human version

- **What this is:** the legal guard for reference ads the brand does not own. Instead of copying a competitor's or library ad, the server has a "layout analyst" describe it as an abstract wireframe plus style categories: no colours, no font names, no copy, no description of the photo. The brand's ad is then built from that blueprint and the brand kit alone.
- **When it runs:** on every normal batch, for templates whose source is a competitor import, a community ad or the curated library. The brand's own uploads and own scraped ads skip it and are remixed directly.
- **The rule that matters:** after extraction, the source image goes to **neither** the composer nor the image model, and the judge does not see it either.
- **Copied from the server.** Extraction prompt, output fields and their descriptions, the text the blueprint becomes, and the colour flip are all verbatim from gooseworks-app `origin/dev` (commit `42a3dec20`, read 2026-10-19).
- **Sources:** `apps/api/src/services/ad-structure-blueprint.service.ts` — schema 21–339, `treatmentLines` 649, `sceneLines` 735, `renderBlueprintInstruction` 751, `extractionPrompt` 801, `minimalStructureBlueprint` 859, `extractStructureBlueprint` 1011. `ad-remix-pipeline.service.ts` — `STRUCTURE_ONLY_SOURCE_KINDS` 2506, `readStructureOnlyIntent` 2551, `withAssignedTargetScheme` 2613, `resolveStructureOnlyBlueprint` 2645, image order 4385. `ad-remix-batches.service.ts` — `resolveStructureOnlyAutoMarker` 2814.
- **The one thing an agent cannot copy:** on the server the analyst and the composer are different calls, so the composer never saw the pixels. An agent that looks at the image is both. Use a subagent for the extraction when the host allows it; otherwise follow the self-check below.

---

# Agent version

## 1. When it applies

| `template.source_kind` (from `gooseworks:ads_template_read { template_id }`) | Path |
|---|---|
| `competitor_scrape`, `community_source`, `curated` | **structure-only** (this file) |
| anything else (`upload`, `scraped_meta`, null) | normal remix (`composer.md`) |

The server stamps every non-grid batch with `{enabled: true, auto: true}` and then gates on the template row's own `source_kind`, so nothing a caller sends can turn structure-only off for a non-owned template. Edits and exact re-renders of an existing render never extract.

## 2. What changes on the structure-only path

- The extraction analyst is the **only** step that looks at the source image.
- The composer gets the blueprint text instead of the image; the `## Source template` context block (title, description, tags, remix spec) is dropped (`composer.md` §5, §6.1).
- The final image list has **no template slot**; brand images only (`composer.md` §8.3).
- The judge gets no source image; it judges against the blueprint (`judge.md`).
- `source_media` for reference gating comes from the blueprint's media slot, not the composer.

## 3. Isolation (Agent adaptation)

- **Host can start a subagent:** give it the image URL, the template's `title`, `layout_type`, `text_complexity`, and §4–§5 of this file. It returns only the JSON object. The composing agent never views the image.
- **No subagent:** extract, then compose from the rendered blueprint text alone. Before rendering, re-read the composed prompt and remove anything about the source that the blueprint does not state: a hex or colour name, a typeface, a person's look, a prop, a product, a slogan or any wording.

## 4. The extraction prompt (verbatim, `extractionPrompt` 801)

The server sends this text, then the label `COMPETITOR AD (extract structure only):`, then the image (resized to fit 1600×1600). Lines joined with `\n`; the three context lines appear only when the value exists.

```text
You are a layout ANALYST for an ad-generation system.
You are shown a COMPETITOR's ad. Your job is to extract its ABSTRACT, FUNCTIONAL structure so a DIFFERENT brand can build its OWN ad in the same shape — WITHOUT copying anything that belongs to the competitor.

HARD RULES — the output MUST NOT contain, and you must NOT let influence any field:
- NO color hex values and NO color names. Describe only the colour STRUCTURE: light/dark/mid/split, mono/duo/multi, where the single accent sits, soft or strong contrast, flat/gradient/texture/photo-bleed surface.
- NO typeface or font names. Describe only the type CLASS and its treatment: scale, weight, case, width, broad classification (grotesk / humanist sans / serif / slab / display / script / mono), alignment, hierarchy.
- NO description of the specific photograph: never the person's appearance, age, clothing, the product's look, props, or anything that identifies the competitor. Describe only the imagery TREATMENT (kind: photo / illustration / 3D render / flat graphic / collage / screenshot / none; lighting class; setting class; framing; whether hands or a person appear; finish) and the SCENE as a scenario CLASS (below).
- NO verbatim or paraphrased copy — never write the competitor's actual words, headline, tagline, or CTA text. Text slots carry only a ROLE and a coarse position.
- NO competitor brand name, logo, mascot, or wordmark.

Extract ONLY: the layout archetype, the signature MECHANIC described functionally (what the device does structurally), the media-slot type, the coarse text-slot roles + 3x3-grid positions + hierarchy, the overall text density, the tone descriptor, the coarse media/logo positions, the TREATMENT classes (imagery, typography, colour structure), and the SCENE class (setting, activity, time of day, subjects).
SCENE — a scenario CATEGORY that thousands of ads share, never this photograph: the setting class, what the subject is DOING as an action category in plain functional words, the time of day, and how many people. Two ads with the same treatment are DIFFERENT ads because of their scene, so always fill it in for imagery that shows a place or an action; use setting 'none' only for layouts with no scene.
Think of it as a wireframe plus a style SPEC SHEET: boxes, roles, and style CLASSES — never content, never identity. Every treatment field is a fixed CATEGORY: pick the closest one, and leave a field out entirely rather than guessing.

Source title (context only): «template.title»
Declared layout: «template.layout_type»
Declared text complexity: «template.text_complexity»
```

## 5. Output: one JSON object, these fields only (`structureBlueprintSchema` 21)

Required unless marked optional. No extra keys anywhere. Descriptions are the server's, verbatim.

| Field | Allowed values | Server description |
|---|---|---|
| `layout_archetype` | `hero_product`, `text_hero`, `quote_testimonial`, `before_after`, `comparison_table`, `feature_callouts`, `device_mockup`, `notification_ui`, `search_bar`, `grid_collage`, `lifestyle_scene`, `other` | "The reusable layout FAMILY this ad belongs to — its functional structure, not its visual look." |
| `signature_mechanic` | string, hard cap 600 chars | "The distinctive creative DEVICE in functional terms (e.g. 'benefit arrows radiating from the hero', 'incoming-call lock-screen UI', 'split us-vs-them table'). Describe WHAT IT DOES structurally — never the competitor's specific product, colors, imagery, or wording. Keep this UNDER 400 characters — it is a description, not a paragraph; a longer one is rejected outright." |
| `media_slot` | `none`, `screen`, `product`, `person`, `abstract` | "The imagery slot the layout provides: 'none' = text/shapes only; 'screen' = a device/app UI surface; 'product' = a physical product hero; 'person' = a human subject; 'abstract' = a conceptual/graphic field. Take this from the LAYOUT, not from what the competitor sells." |
| `text_density` | `none`, `minimal`, `moderate`, `dense` | "How much copy the layout carries overall: none / minimal (1 short line) / moderate (headline + subhead) / dense (multiple copy blocks)." |
| `tone` | string, max 120 | "The ad's emotional register in 1-4 words (e.g. 'bold and playful', 'clinical and trustworthy', 'aspirational'). A descriptor only — never quote the competitor's copy." |
| `text_slots` | array (kept: first 10) of `{role, position, emphasis}` | "The text elements by ROLE + coarse position + hierarchy, at most 10. NEVER include the competitor's actual words — only the functional role of each slot." |
| `text_slots[].role` | `eyebrow`, `headline`, `subhead`, `body`, `cta`, `badge`, `price`, `disclaimer` | "The functional role of this text element." |
| `text_slots[].position` | `top_left`, `top_center`, `top_right`, `mid_left`, `mid_center`, `mid_right`, `bottom_left`, `bottom_center`, `bottom_right` | "Coarse 3x3-grid position of this text slot." |
| `text_slots[].emphasis` | `primary`, `secondary`, `tertiary` | "Visual prominence of this slot relative to the others (hierarchy only)." |
| `media_position` | the 9 grid positions, `full_bleed`, `none` | "Coarse position of the hero/media slot on a 3x3 grid, or 'full_bleed' / 'none'." |
| `logo_position` | `top_left`, `top_center`, `top_right`, `bottom_left`, `bottom_center`, `bottom_right`, `none` | "Coarse position of the brand logo lockup, or 'none'." |
| `treatment` (optional) | object below | "The source's visual TREATMENT as style CLASSES only. Describe the CATEGORY, never the content: no hex values, no colour names, no typeface names, no subject, scene, product, person, prop, or copy." |
| `treatment.imagery.kind` | `photo`, `illustration`, `render_3d`, `flat_graphic`, `collage`, `screenshot`, `none` | "The CLASS of imagery the layout uses — never what it depicts." |
| `treatment.imagery.lighting` | `studio`, `natural`, `dramatic`, `flat`, `na` | "Lighting class. 'na' when there is no photographic imagery." |
| `treatment.imagery.setting` | `studio_sweep`, `interior`, `outdoor`, `abstract_field`, `ui_surface`, `na` | "The CLASS of setting, never the specific place, scene, or props." |
| `treatment.imagery.framing` | `close_up`, `mid`, `wide`, `na` | "How tightly the subject is framed." |
| `treatment.imagery.human_presence` | `none`, `hands`, `partial`, `full` | "Whether a person appears and how much — never who, or what they look like." |
| `treatment.imagery.finish` | `clean`, `matte`, `glossy`, `grain`, `textured` | "Surface finish of the imagery." |
| `treatment.typography.headline_scale` | `small`, `large`, `oversized` | "Headline size relative to the canvas." |
| `treatment.typography.weight` | `light`, `regular`, `heavy` | — |
| `treatment.typography.case` | `sentence`, `title`, `caps`, `mixed` | — |
| `treatment.typography.width` | `condensed`, `normal`, `wide` | — |
| `treatment.typography.type_class` | `grotesk`, `humanist_sans`, `serif`, `slab`, `display`, `script`, `mono` | "The broad type CLASSIFICATION — never the typeface's name." |
| `treatment.typography.alignment` | `left`, `center`, `right`, `mixed` | — |
| `treatment.typography.hierarchy_contrast` | `flat`, `moderate`, `strong` | "How sharply the type sizes differ between the slots." |
| `treatment.colour_structure.scheme` | `light`, `dark`, `mid`, `split` | "Overall value structure of the canvas — NOT which colours are used." |
| `treatment.colour_structure.count` | `mono`, `duo`, `multi` | "How many distinct colours the design works in." |
| `treatment.colour_structure.accent_placement` | `cta_only`, `headline`, `background_block`, `none` | "Where the single loudest colour is spent." |
| `treatment.colour_structure.contrast` | `soft`, `strong` | — |
| `treatment.colour_structure.surface` | `flat`, `gradient`, `texture`, `photo_bleed` | "How the background field is treated." |
| `scene` (optional) | object below | "The source's SCENE as a scenario CATEGORY: setting class, functional activity, time of day, how many people. Never the person's appearance, the product, props, or anything identifying the source." |
| `scene.setting` | `kitchen`, `living_room`, `bedroom`, `bathroom`, `home_office`, `office`, `cafe`, `restaurant`, `gym`, `outdoors_nature`, `outdoors_urban`, `street`, `vehicle`, `retail`, `studio_seamless`, `other`, `none` | "Where the scene takes place, as a category. 'none' when the layout has no scene." |
| `scene.activity` | string, max 80 | "What the subject is DOING, in plain functional words — an action category, not a description of this photo. Never appearance, clothing, the product's look, or the brand." |
| `scene.time_of_day` | `morning`, `day`, `golden_hour`, `night`, `na` | — |
| `scene.subjects` | `none`, `hands_only`, `one_person`, `two_people`, `group` | — |

Every `treatment` and `scene` sub-field is optional: leave it out rather than guess. A value outside its list is dropped by the server.

**Cannot view the image** (the server's fallback after two invalid answers, `minimalStructureBlueprint` 859): `layout_archetype` from `template.layout_type` keywords (before+after → `before_after`; comparison; testimonial/quote; notification; search; device/mockup; collage/grid; lifestyle; feature/callout; text → `text_hero`; hero/product → `hero_product`; else `other`); `text_density` from `text_complexity` (`low` → `minimal`, `medium` → `moderate`, `high` → `dense`, else `moderate`); `media_slot` `none` for text_hero, `screen` for device/notification/search, `product` for hero_product, `person` for lifestyle, else `abstract`; `signature_mechanic` "A clear composition with one primary focal area and supporting brand copy."; `tone` "clear and brand-led"; slots: none for density `none`, else a primary headline at top_center, plus a secondary body at mid_center (moderate, dense), plus a tertiary cta at bottom_center (dense); `media_position` `none` when media_slot is `none` else `mid_center`; `logo_position` `none`; no treatment, no scene. Mark the ad "extraction degraded".

## 6. Adjust to this ad's colour scheme (`withAssignedTargetScheme` 2613)

Only when the ad has an assigned scheme (`composer.md` §3) **and** `treatment.colour_structure.scheme` is `light` or `dark`: set it to `light` if the scheme's `background_is_light` is true, else `dark`. `mid` and `split` stay. This adjusted object is the **effective blueprint**; render the text from it.

## 7. The text the composer gets (`renderBlueprintInstruction` 751, verbatim)

Underscores in enum values become spaces (`top_left` → `top left`). Lines joined with `\n`.

```text
STRUCTURE-ONLY BLUEPRINT (derived from a competitor ad you must NOT reproduce).
«header»
- Layout archetype: «layout_archetype»
- Signature mechanic (recreate the DEVICE, not the competitor's imagery): «signature_mechanic»
- Media slot: «media_slot» (positioned: «media_position»)
- Overall text density: «text_density» — carry roughly this much copy, written fresh in the brand's voice.
- Tone: «tone»
«scene line, if any»
«treatment lines, if any»
- Logo position: «logo_position»
- Text slots (role + coarse position + hierarchy — write NEW brand copy for each; the competitor's words are unknown to you by design):
«one line per slot: "  - «emphasis» «role» at «position»", or "  - (no text slots)"»
```

`«header»` when there is at least one treatment line:
```text
Build the brand's ad to this FUNCTIONAL structure using the brand kit ALONE. Do NOT reproduce any competitor palette, typeface, photography, logo, mascot, wordmark, or wording — only this abstract layout and the style CLASSES below. A class such as 'studio lighting', 'condensed caps' or 'dark scheme' names a CATEGORY that thousands of ads share; it is never the source's own colour, typeface, or photograph, and you must realise it with the brand's assets.
```
otherwise:
```text
Build the brand's ad to this FUNCTIONAL structure using the brand kit ALONE. Do NOT reproduce any competitor palette, typeface, photography, logo, mascot, wordmark, or wording — only this abstract layout.
```

Scene line (`sceneLines` 735) — only when `scene.setting` is present and not `none`. Parts, in order, joined `, `: setting; activity (trimmed, if any); time_of_day (if not `na`); subjects (if any).
```text
- Scene (a SCENARIO to adapt to the brand, not a photo to copy — stage the brand's own customer doing this kind of thing in this kind of place): «parts».
```

Treatment lines (`treatmentLines` 649). Values `na` are skipped.

- Imagery, when `imagery.kind` is `none`:
```text
  - Imagery: none — text, type and shapes only, no photo or illustration.
```
- Imagery otherwise (only if any part exists), parts joined `, `: kind; `«lighting» light`; setting; `«framing» framing`; human_presence → `hands visible` / `a person partly in frame` / `a full person in frame` / `no people`; `«finish» finish`:
```text
  - Imagery: «parts».
```
- Typography (only if any part exists): first part = headline_scale, weight, case, width, type_class joined by spaces; then `«alignment»-aligned`; then `«hierarchy_contrast» hierarchy`; parts joined `, `:
```text
  - Typography: «parts». Use the brand's own font family inside this treatment.
```
- Colour structure (only if any part exists), parts joined `, `: `«scheme» scheme`; `«count» palette`; accent_placement → `accent on «value»` or, for `none`, `no single accent`; `«contrast» contrast`; `«surface» surface`:
```text
  - Colour structure: «parts». The brand colour scheme assigned to this ad fills these roles — do NOT reuse the source's own colours.
```
- When at least one of the three lines exists, they are preceded by:
```text
Treatment (match the CLASS of the source, and fill it with the brand's own assets and colours):
```

## 8. What leaves this step

| Output | Goes to |
|---|---|
| Rendered text (§7) | `composer.md` §5 line 2 (`«blueprint instruction»`) and the judge's target if the JSON is unavailable |
| Effective blueprint JSON (§6) | the judge's target contract (`judge.md` §2) |
| `structureMediaSlot`: `screen` → `screen`; `none` → `none`; `product`, `person`, `abstract` → `product` | `composer.md` §7 (`source_media`) and reference gating |
| "extraction degraded" flag | the batch record |

The source image URL goes **nowhere else**: not into `image_urls`, not into the judge.
