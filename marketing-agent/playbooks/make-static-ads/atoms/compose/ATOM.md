---
name: compose
description: Internal step of make-static-ads. Composes every ad exactly as GooseWorks' server composer does — the marketer's chat words as the User instructions, the ad's concept as its Variant brief — and records the final prompt and ordered image list per ad and ratio, ready for a quoted render.
---

# compose

The method is `references/composer.md`: the server's own rules, copied verbatim. This atom only says how this playbook fills the composer's slots. **Add nothing else to the prompt** — no second brief, no extra rules, no on-image text written outside the composer.

**Reads:** per ad, its grid row (concept-grid) and the hook direction from its copy row (ad-copy); its template (find-references), read with `gooseworks:ads_template_read` `template_id`; the brand kit, learnings and featured product as `composer.md` §1 lists them (once per batch); the marketer's look answers from Step 2 (logo, colours, font); `references/structure-blueprint.md`, `references/font-specimen.md`, `references/fonts-and-color.md`.
**Writes:** per ad: the assembled composer input (a file on a shell host), the composer's six-field answer, and per ratio the final prompt and the ordered `image_urls`; the font specimen (or why none); structure-only yes/no. All of it goes into the batch file.

## Order of work, per ad

Run `composer.md` §0's table, rows 1–10, in order. Row 11 (the quoted `ads_render` call) is the playbook's Steps 8–9; row 12 (judge and one retry) is `atoms/render-review/ATOM.md`.

| Row | What this playbook puts in it |
|---|---|
| 1 Inputs (§1) | Read the kit and learnings once per batch, the product record per featured product. Images the marketer attached in this chat → `gooseworks:media_upload`, then they are user uploads (§4). |
| 2 Flags and path (§2) | From the Step 2 answers: logo → `no_logo`; colours → `references/fonts-and-color.md` §4 (brand / template / fresh palette); font → §1 (brand / uploaded file / a pairing / no specific font). §2.1 still forces colours and font on for `competitor_scrape` and `curated` sources — say so if the marketer asked for the template's look on one of those. A template the brand doesn't own → structure-only (§2.2): run `structure-blueprint.md` first, in a fresh subagent where the host has one. |
| 3 Colour (§3) | Brand colours → §3 as written, once per batch, seed = the batch file name. Fresh palette → the agent's palette per ad (`fonts-and-color.md` §4) as the assigned scheme. Logo colours are never changed (`fonts-and-color.md` §5). |
| 4 References (§4) | As written. |
| 5 Blueprint | Structure-only ads only (`structure-blueprint.md`). **Direct competitor ("layout only", `references-and-remix.md` §5) — a playbook departure from the server:** before composing, cut the blueprint's `signature_mechanic` down to the kind of mechanic ("a search bar with a typed query", "a day calendar", "one portrait photo with a big headline") and drop its scene. The picture idea, prop and photo treatment come from the concept, never the competitor; the composer's "preserve the signature mechanic" applies to that reduced mechanic. Mark it in the batch file. |
| 6 Composer input (§5, §6) | **User instructions (§6.6):** the marketer's own chat words for this ask, trimmed, unchanged — never rewritten, summarised or added to. Words meant for one ad only ("make #3 darker") go to that ad only. **Variant brief (§6.7, the brief form):** the concept row, below. Leave out §6.6's "Messaging angle for THIS ad" line; the Variant brief already carries the concept, so it is said once. **Typography (§6.3):** as written, except the improvement below. |
| 7 Answer as the composer (§7) | Answer the assembled input literally; the composer writes the on-image words under its own text-density, copy and claims rules. Run the placeholder check. |
| 8 Final prompt (§8) | As written. |
| 9 Font specimen (§9) | `font-specimen.md`, when eligible. |
| 10 Cap and ratios (§10) | One base prompt per ratio the ad's placements need. |

## The Variant brief — one per ad

```text
Variant brief: «angle directive»
Use this exact messaging direction for this variant: «message»
```

- **«angle directive»** = the `VARIANT_BRIEF_ANGLE_COPY` entry (`composer.md` §6.7) that fits the concept's angle family and framework:

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

Use the directive text from §6.7 verbatim, never the key.
- **«message»** = one or two plain sentences: who it is for, why they buy, the proof (worded as the brand brain records it — `confirmed`, or `found` on the brand's site, kit or product record; `references/claims-and-policy.md` §2), and the hook direction from ad-copy. A real review or founder line meant to appear verbatim is quoted with its attribution ("use this review verbatim, attributed to …"). Nothing the brain marks `guess` or `unknown`.
- **The concept survives the template.** The message line is the grid row's concept, whatever template was picked. The template's own message, metaphor and audience never enter it. The concept's proof appears on the image; when the layout has no room for it, it goes in the primary text (`atoms/ad-copy/ATOM.md`) and the batch file says so.

## Typography improvement (only when the font is a plain system face)

When the §6.3 family for a designed headline resolves to a plain system face (Inter, Arial, Helvetica, Roboto, or a generic sans) and the marketer picked a pairing from `references/fonts-and-color.md` at Step 2: put that pairing's families in the `Typography:` line in place of the system face (descriptor from the pairing's "feel"), and render the font specimen from it (`font-specimen.md` — every pairing is on Google Fonts, so it is a real face). Mark it in the batch file as "playbook improvement: font". Native frames (notes-app, tweet, text message) keep the system face. Any other font → the server's line as written.

## Record per ad

Template id and whether it ran structure-only; the User instructions as sent; the Variant brief; the composer's answer; per ratio the final prompt and `image_urls` in order; the font specimen URL or why none; the colour scheme. The judge and the batch file read these back.

## Fixes from the 19 Oct test runs (playbook rules on top of the composer)

- **Proof always reaches the composer.** When the brand has many products, `composer.md` §6.2 leaves proof points, value props and audience out of the brand block. Add them back for the featured product: its facts and the claims the brain marks `confirmed` or `found` on the brand's site or kit, under `Proof points:`.
- **Headline in the accent colour is allowed** when the blueprint puts the accent on the headline; the judge's `brand_colors_ok` passes it.
- **No-copy templates.** A template with no headline makes an ad with no words (the composer mirrors text density). Use one only when the marketer picked it; otherwise prefer templates that carry a headline (`atoms/find-references/ATOM.md`).
- **Offers.** A sale price or "was/now" price on the product record is a plain product fact: the composer may show it when the marketer said yes at Step 2. Never invent an end date or urgency.
