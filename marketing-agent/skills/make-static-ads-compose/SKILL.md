---
name: make-static-ads-compose
description: >-
  Step of the make-static-ads playbook: composes every ad exactly as GooseWorks' server composer does — the marketer's chat words as the User instructions, the ad's concept as its Variant brief — and records the final prompt and ordered image list per ad and ratio, ready for a quoted render. Run make-static-ads instead; not for direct use.
version: 0.4.2
---

# compose

The method is `../make-static-ads/references/composer.md`: the server's own rules, copied verbatim. This atom says how this playbook fills the composer's slots. **The composer input is `composer.md` §5–§6 filled from the sources below, plus the departures listed in "Playbook departures"; nothing more.**

**Reads:** per ad, its grid row (concept-grid) and the hook direction from its copy row (ad-copy); its template (find-references), read with `gooseworks:ads_template_read` `template_id`; the brand kit, learnings and featured product as `composer.md` §1 lists them (once per batch); the Step 2 answers (logo, colours, font); `../make-static-ads/references/structure-blueprint.md`, `../make-static-ads/references/font-specimen.md`, `../make-static-ads/references/fonts-and-color.md`.
**Writes:** per ad: the Variant brief, the assembled composer input (a file on a shell host), the composer's six-field answer, and per ratio the final prompt and the ordered `image_urls`; the font specimen (or why none); structure-only yes/no. All of it goes into the batch file.

## Order of work, per ad

Run `composer.md` §0's table, rows 1–10, in order. Row 11 (the quoted `ads_render` call) is the playbook's Steps 8–9; row 12 (judge and one retry) is the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`).

| Row | What this playbook puts in it |
|---|---|
| 1 Inputs (§1) | Read the kit and learnings once per batch, the product record per featured product. Images the marketer attached in this chat → `gooseworks:media_upload`, then they are user uploads (§4). |
| 2 Flags and path (§2) | From the Step 2 answers: logo → `no_logo`; colours → `../make-static-ads/references/fonts-and-color.md` §4 (brand / template / fresh palette); font → §1 (brand / a pairing / no specific font). §2.1 still forces colours and font on for `competitor_scrape` and `curated` sources — say so if the marketer asked for the template's look on one of those. **Structure-only follows ownership, not `source_kind`:** any template of another brand is structure-only, including one registered as `upload` with `ads_template_create`. §2.2's table covers only templates the server imports itself. Structure-only → run `structure-blueprint.md` first, in a fresh subagent where the host has one. |
| 3 Colour (§3) | Brand colours → §3 as written, once per batch, seed = the batch file name (`../make-static-ads/scripts/schemes.py`). Fresh palette → the agent's palette per ad (`fonts-and-color.md` §4) as the assigned scheme. Logo colours are never changed (`fonts-and-color.md` §5). |
| 4 References (§4) | As written. A structure-only template's image is never in the list. |
| 5 Blueprint | Structure-only ads only (`structure-blueprint.md`). A direct competitor's template ("layout only", `../make-static-ads/references/references-and-remix.md` §5) gets the reduced blueprint (departure 2). |
| 6 Composer input (§5, §6) | **User instructions (§6.6):** the marketer's own chat words for this ask, trimmed, unchanged — never rewritten, summarised or added to. Words meant for one ad only ("make #3 darker") go to that ad only. **Variant brief (§6.7, the brief form):** below. Leave out §6.6's "Messaging angle for THIS ad" line; the Variant brief already carries the concept, so it is said once. **Proof points:** departure 1. **Typography (§6.3):** as written, except departures 3 and 4. |
| 7 Answer as the composer (§7) | Answer the assembled input literally; the composer writes the on-image words under its own text-density, copy and claims rules. Run the placeholder check. |
| 8 Final prompt (§8) | As written. |
| 9 Font specimen (§9) | `font-specimen.md`, when eligible (`../make-static-ads/scripts/specimen.py`). |
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
- **The template is the shape; the concept is the message.** The message line is the grid row's concept, whatever template was picked. The template's own message, metaphor and audience never enter it. The concept's proof appears on the image; when the layout has no room for it, it goes in the primary text (the `make-static-ads-ad-copy` skill (`../make-static-ads-ad-copy/SKILL.md`)) and the batch file says so.

## Playbook departures from the server

Each one is marked in the batch file where it applied. Everything not listed here follows `composer.md` as written.

| # | Overrides | Departure |
|---|---|---|
| 1 | `composer.md` §6.2 | **Proof always reaches the composer.** When the brand has many products, §6.2 leaves proof points, value props and audience out of the brand block. Add them back for the featured product under `Proof points:` — its usable facts only. |
| 2 | `structure-blueprint.md` (signature mechanic) | **Direct competitor → layout only.** Before composing, cut the blueprint's `signature_mechanic` down to the kind of mechanic ("a search bar with a typed query", "a day calendar", "one portrait photo with a big headline") and drop its scene. The picture idea, prop and photo treatment come from the concept, never the competitor; "preserve the signature mechanic" applies to the reduced mechanic. The judge gets the same reduced blueprint (the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`)). |
| 3 | `composer.md` §6.3 | **Typography, plain system face.** When the §6.3 family for a designed headline resolves to a plain system face (Inter, Arial, Helvetica, Roboto, a generic sans) and the marketer picked a pairing from `../make-static-ads/references/fonts-and-color.md` at Step 2: put that pairing's families in the `Typography:` line (descriptor from the pairing's "feel") and render the specimen from it. Native frames (notes-app, tweet, text message) keep the system face. |
| 4 | `composer.md` §6.3 | **No specific font** (Step 2): replace the TYPOGRAPHY instruction with "set all text in a clean, legible typeface that suits the brand and the layout"; no family, no specimen. |
| 5 | `composer.md` §2.2 | **Structure-only follows ownership** (row 2). |
| 6 | `composer.md` §11 (content-policy fallback) | A render the image model refuses is re-composed without the line or visual that triggered it (the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`) step 3), not sent to a fallback engine. |

## Record per ad

Template id and whether it ran structure-only; the User instructions as sent; the Variant brief; the composer's answer; per ratio the final prompt and `image_urls` in order; the font specimen URL or why none; the colour scheme; the departures used. The judge and the batch file read these back.
