---
name: make-static-ads-compose
description: >-
  Step of the make-static-ads playbook: composes every ad exactly as GooseWorks' server composer does — the marketer's chat words as the User instructions, the ad's concept as its Variant brief — and records the final prompt and ordered image list per ad and ratio, ready for a quoted render. Run make-static-ads instead; not for direct use.
version: 0.5.2
---

# compose

The script implements `../make-static-ads/references/composer.md`, the retained server reference. Standard shell runs read the prepared rule/context files rather than also reading that entire manual. This atom says how this playbook fills the composer's slots. **The composer input is `composer.md` §5–§6 filled from the sources below, plus the departures listed in "Playbook departures". Departure 7 names when the concept owns the scene instead of the template, including ratio adaptation.**

**Read:** the selected run.json row, its linked ad.json, real kit/rules/product and the complete files returned by prepare. The run contract is `../make-static-ads/references/workflow.md`. Load structure-blueprint only for a layout reference; font-specimen only when eligible; fonts-and-color for a requested nondefault font/palette. For manual shell-free assembly use the relevant composer.md sections in full.
**Write:** ad.json, prepared input files, answer.json and final.json. Final CLI output is unquoted render_spec data; the reviewed-quote operation in `../make-static-ads/scripts/README.md` requires the exact claims/policy review before producing dry-run calls. All records belong to the same batch.

## Order of work, per ad

Use the rows below in order; the script supplies their fixed server text. Row 11 (the quoted `ads_render` call) is the playbook's Steps 8–9; row 12 (judge and one retry) is the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`).

| Row | What this playbook puts in it |
|---|---|
| 1 Inputs (§1) | Read the kit and learnings once per batch, the product record per featured product. Images the marketer attached in this chat → `gooseworks:media_upload`, then they are user uploads (§4) only when owned/approved for actual generation. Other brands' references stay text-only. |
| 2 Flags and path (§2) | From the Step 2 answers: logo → `no_logo`; colours → `../make-static-ads/references/fonts-and-color.md` §4 (brand / template / fresh palette); font → §1 (brand / a pairing / no specific font). §2.1 still forces colours and font on for `competitor_scrape` and `curated` sources — say so if the marketer asked for the template's look on one of those. **Structure-only follows ownership, not `source_kind`:** any template of another brand is structure-only, including one registered as `upload` with `ads_template_create`. §2.2's table covers only templates the server imports itself. For a layout reference, extract its structure with structure-blueprint.md in a fresh subagent where available. Mechanism/craft uses its selected authored scene. |
| 3 Colour (§3) | Brand colours → §3 as written, once per batch, seed = the batch file name (`../make-static-ads/scripts/schemes.py`). Fresh palette → the agent's palette per ad (`fonts-and-color.md` §4) as the assigned scheme. Logo colours are never changed (`fonts-and-color.md` §5). Running-ads colours → that palette per ad (`../make-static-ads/references/fonts-and-color.md` §4) as the assigned scheme. Reconcile named scene/background colours with that scheme before preparing; a changed selected scene goes back into run.json and is recomposed, rather than leaving conflicting colours in the prompt. |
| 4 References (§4) | As written. A structure-only template's image is never in the list. |
| 5 Blueprint | Structure-only ads only (`structure-blueprint.md`). A direct competitor's template ("layout only", `../make-static-ads/references/references-and-remix.md` §5) gets the reduced blueprint (departure 2). |
| 6 Composer input (§5, §6) | **Write `ad.json`** with the values below, the selected creative_direction unchanged and `workflow:{run_path,ad_id,run_sha256}`, then use the prepared-input operation in `../make-static-ads/scripts/README.md` and read every bounded file in `files_to_read`, in order (the complete ad context and shared rules). Later ads may reuse shared rules only when already read in this conversation; the script omits them only on an exact match. Keep the complete current context. The scripts guide describes manifest reuse: after actually reading an earlier manifest in this same conversation, reuse only exact verified parts; read every new files_to_read entry. A fresh agent starts without reuse. The returned `input_sha256` binds the answer to that input; it proves correspondence, not that an agent understood it. Departures go in as `ad.json` fields (`proof_points`, `font: "pairing"` / `"none"`, `template.brand_owned`, `structure.reduced_mechanic`, `content_policy_recompose`). No shell: assemble `composer.md` §5–§6 by hand, in full. **User instructions (§6.6):** the marketer's own chat words for this ask, trimmed, unchanged — never rewritten, summarised or added to. Words meant for one ad only ("make #3 darker") go to that ad only. **Variant brief (§6.7, the brief form):** below. Leave out §6.6's "Messaging angle for THIS ad" line; the Variant brief already carries the concept, so it is said once. **Proof points:** departure 1. **Typography (§6.3):** as written, except departures 3 and 4. |
| 7 Answer as the composer (§7) | Answer the assembled input literally, as one JSON object saved to `answer.json`, including its `input_sha256`. For fresh concepts carry `creative_direction.exact_copy` and `protected_decision` verbatim in the prompt. The script checks their presence; Step 7 checks their truth and Step 10 checks the image. |
| 8 Final prompt (§8) | Use the finalization operation in `../make-static-ads/scripts/README.md`. It runs the placeholder check, gates and orders the references, builds the manifest, resolves `{{ref:ID}}`, adds the CANVAS ADAPTATION block per ratio and prints an unquoted render_spec per ratio with the checked run digest. On an error, fix `answer.json` and run it again. Review its exact prompts/images for claims and policy, then use the scripts guide’s reviewed-quote operation; use the resulting dry-run requests unchanged. |
| 9 Font specimen (§9) | `font-specimen.md`, when the `final` output says eligible: make the card from its `specimen_input_prompt` (`../make-static-ads/scripts/specimen.py`), set `font_specimen_url` in `ad.json`, run `final` again. |
| 10 Cap and ratios (§10) | One base prompt per ratio the ad's placements need. |

## The Variant brief — one per ad

```text
Variant brief: «angle directive»
Use this exact messaging direction for this variant: «message»
```

- **«angle directive»** = the `VARIANT_BRIEF_ANGLE_COPY` entry (`composer.md` §6.7) that fits the concept's angle family and framework. Use the directive text from §6.7 verbatim, never the key:

| Angle family (`angles-and-hooks.md` §3) | Entry |
|---|---|
| Problem → solution; problem / agitate | `problem` |
| Mechanism; demo / feature callouts | `product-proof` |
| Social proof, review card, press quote, stat card | `social-proof` |
| Us vs them / old way vs new | `comparison` |
| Identity / belonging; aspiration | `aspiration` |
| Objection handling | `objection` |
| Founder story; gift / occasion; one persona's moment | `use-case` |
| Offer / urgency (live offer only) | `offer` |
| Curiosity / news; educational / myth-buster | `educational` |
| Listicle / reasons-why | `benefit` |
| A question hook the concept was built on | `hook-question` |

- **«message»** = one or two plain sentences: who it is for, why they buy, the proof worded as the brand brain records it (a usable fact, `../make-static-ads/references/claims-and-policy.md` §2), and the hook direction from ad-copy. A real review or founder line meant to appear verbatim is quoted with its attribution ("use this review verbatim, attributed to …"). A sale or "was/now" price appears only when the marketer said yes at Step 2; never an invented end date or urgency.
- **The concept stays intact.** The message line is the grid row's concept. A `layout` reference keeps the blueprint. A `mechanism` reference contributes a functional relationship, with new props and scene. A `craft` reference contributes only photographic or material treatment. The template's audience, claims and copy never enter it. The concept's proof appears on the image; when the layout has no room for it, it goes in the primary text (the `make-static-ads-ad-copy` skill (`../make-static-ads-ad-copy/SKILL.md`)) and the batch file says so.

## Playbook departures from the server

Each one is marked in the batch file where it applied. Everything not listed here follows `composer.md` as written.

| # | Overrides | Departure |
|---|---|---|
| 1 | `composer.md` §6.2 | **Proof always reaches the composer.** When the brand has many products, §6.2 leaves proof points, value props and audience out of the brand block. Add them back for the featured product under `Proof points:` — its usable facts only. |
| 2 | `structure-blueprint.md` (signature mechanic) | **Direct competitor → layout only.** Before composing, cut the blueprint's `signature_mechanic` down to the kind of mechanic ("a search bar with a typed query", "a day calendar", "one portrait photo with a big headline") and drop its scene. The picture idea, prop and photo treatment come from the concept, never the competitor; "preserve the signature mechanic" applies to the reduced mechanic. The judge gets the same reduced blueprint (the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`)). |
| 3 | `composer.md` §6.3 | **Typography, plain system face or unusable brand font.** When the §6.3 family for a designed headline resolves to a plain system face (Inter, Arial, Helvetica, Roboto, a generic sans), or to a brand font with no Google Fonts match or metric clone (set `brand_font_unavailable: true` in `ad.json`), and the marketer picked a pairing from `../make-static-ads/references/fonts-and-color.md` at Step 2: put that pairing's families in the `Typography:` line (descriptor from the pairing's "feel") and render the specimen from it. Native frames (notes-app, tweet, text message) keep the system face. |
| 4 | `composer.md` §6.3 | **No specific font** (Step 2): replace the TYPOGRAPHY instruction with "set all text in a clean, legible typeface that suits the brand and the layout"; no family, no specimen. |
| 5 | `composer.md` §2.2 | **Structure-only follows ownership** (row 2). |
| 7 | Source layout, scene, text density and signature invariants | **Concept-directed scene.** Fill `creative_direction` (`../make-static-ads/scripts/README.md`). On `mechanism` or `craft`, the script replaces the source-layout instructions, excludes source pixels even for an owned template, and uses the authored scene and its `structure.media_slot`. The reference remains registered for provenance. `layout` retains the original layout path. A direct competitor accepts `layout` only. Product fidelity, factual claims, policy and spend gates still apply. |
| 8 | `composer.md` §6.5 | **Keep every mandatory rule.** Preserve all must/dont rows regardless of rank; cap only optional do/template_hint/insight rows at eight. This intentionally differs from the server’s first-eight-total reference. |
| 6 | `composer.md` §11 (content-policy fallback) | A render the image model refuses is re-composed without the line or visual that triggered it (the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`) step 3), not sent to a fallback engine. |

## Record per ad

Template id and whether it ran structure-only; the User instructions as sent; the Variant brief; the composer's answer; per ratio the final prompt and `image_urls` in order; the font specimen URL or why none; the colour scheme; the departures used. Include `creative_direction` and the input receipt. The judge and the batch file read these back.
