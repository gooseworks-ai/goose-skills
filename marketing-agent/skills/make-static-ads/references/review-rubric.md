# Review rubric — every render, every ratio

The playbook's extra checks, run after the server's judge (`judge.md`) on every render. Severity decides what happens: **BLOCK** — never ships (fixed by the render's one retry, or dropped); **REMAKE** — fixed by the one retry, else dropped or, for a taste call, shown as a NOTE; **NOTE** — label for the human. Feedback reason codes in brackets are for the **human's** verdicts only (see "Record every verdict" below).

| # | Check | How a senior checks | Severity |
|---|---|---|---|
| 1 | Claims in everything | Every claim-bearing span in copy, on-image text, badges, and what the visual implies — Pass B of `claims-and-policy.md`. Numbers exact, qualifiers present and legible | BLOCK |
| 2 | Invented text and marks | Zoom each render: seals ("Derm approved"), stars, prices, "SALE", laurels, a competitor's logo carried over from the template [`text_garbled`, `brand_or_logo_wrong`] | BLOCK |
| 3 | Right product | Against the product photos: shape, lid/cap, label wording, colourway, size, no duplicated or mirrored product, no gibberish label [`wrong_product`, `ai_or_distorted`] | BLOCK |
| 4 | Personal attributes (Meta) | No "you/your" asserting a health condition, body trait, age, finances etc. A reviewer describing themselves is fine | BLOCK → rewrite |
| 5 | Before/after, outcome imagery | No split before/after (unless gated OK), no dull-vs-glowing, no zoomed flaws, no unrealistic results, nothing that makes people feel bad about their body | BLOCK → re-concept |
| 6 | Fake UI, fake people | No fake play buttons, close-X, notification badges; no fake DMs or texts from "customers"; no AI person presented as a customer. A search-bar or notes-app frame is fine as a clearly stylised device in the brand's own words; it fails when it imitates a real platform's results or a real person | BLOCK |
| 7 | Offer, price, stock | Price, currency, code, terms and end date match the product record and the marketer's words; product in stock | BLOCK |
| 8 | Spelling | Read every word letter by letter at full size; models swap letters and drop accents [`text_garbled`] | BLOCK → the judge's retry |
| 9 | Thumb-stop | Squint at phone width: one focal point, contrast in greyscale. Would the first glance stop a scroll? | REMAKE |
| 10 | One message | Say the ad in ten words or fewer without "and" | REMAKE |
| 11 | Legible on a phone | Headline ≤ 2 lines (≤ 8 words; a confirmed claim worded as recorded, or a real quote, may run longer if it still reads in two lines), one support line at most, qualifier readable | REMAKE |
| 12 | Text load | On-image text small; primary text does not repeat the image text | REMAKE |
| 13 | Safe zones (9:16) | Nothing important in the top ~14%, bottom ~20–35% or right rail; 9:16 re-laid-out, not centre-cropped | REMAKE |
| 14 | Product or proof visible | Recognisable within a second in every ratio — unless the archetype is deliberately pure-text native (label it) | REMAKE / NOTE |
| 15 | Brand fit, for its archetype | Palette, type, logo unstretched and right colour, voice and banned words. A UGC/native ad should look native; a hero should look premium. "Performs but isn't us" is the human's call [`off_brand`] | REMAKE / NOTE |
| 16 | AI tells | Waxy skin, extra or merged fingers, melted type, impossible reflections, nonsense background text [`ai_or_distorted`] | REMAKE |
| 17 | CTA fits stage and destination | Usually Learn more for cold education, Shop now / Get offer for warm and offers — but Shop now often wins cold for low-price DTC; a CTA the brief wants tested is a test variable | NOTE |
| 18 | Hook is tension, not feature | First line names the buyer's situation or a surprising specific, ideally in their words; "luxurious hydration" fails (our copy — fix it, no engine reason code) | REMAKE |
| 19 | Set diversity | `creative-taxonomy.md` §4 still holds after retries and drops: cover the text — no two ads look alike; no two share reason to buy + framework + visual style | REMAKE set |
| 20 | Rights | No celebrity or lookalike, no third-party trademark, competitor ads used for structure only, creator/model permission on file | BLOCK |
| 21 | Destination match | The destination shows the product, offer and promise of the ad | NOTE (flag to analyze-performance's page audit) |
| 22 | Template followed, not copied | Layout and signature mechanic of the template are there; none of its words, product, logo, people or colours. For a direct competitor's template ("layout only"), the main agent — never the judge — puts the render beside the template image with both logos covered: could a buyer take ours for theirs? (`references-and-remix.md` §5) | REMAKE / BLOCK if copied |
| 23 | Composed prompt followed | Every on-image word in the composed prompt is drawn, and nothing else; type, colours and logo / no logo as the prompt says | REMAKE |
| 24 | Logo matches the kit | Same shape, letters and colours as the kit logo file; recoloured or redrawn = fail | REMAKE |
| 25 | Bodies and products in use | Feet and shoes face the right way, garments are worn correctly, hands look natural; a floating product has a believable shadow or is clearly a cut-out graphic | REMAKE |
| 26 | Product used for what it is for | A casual shoe is not shown sprinting; a mug is not a vase | REMAKE |
| 27 | Text inside its panel | No line crosses a band or card edge; nothing is cut off at the canvas edge | REMAKE |
| 28 | Concept intact | The image still speaks to the grid row's persona and reason to buy. A proof missing from the image moves into the primary text first (free, no retry); only a picture or headline that speaks to someone else uses the retry | REMAKE |
| 29 | Not a repeat | No example content (search query, names, on-screen numbers) copied from an ad on the made-before list | REMAKE |

## The server's judge comes first

Every render is judged with `judge.md` (its checklist, pass rule and one retry) before these checks. `ads_render` creatives are never judged by the server, so the agent's judge is the only one; read its result from the batch record, never from a flag on the creative. A check here that the judge already failed is not counted twice.

**What juniors miss:** 1 (implied and imported claims), 2 (invented seals), 4 (second-person attributes), 7 (narrowed offer terms), 11 (illegible qualifier), 13 (a 9:16 headline under the Reels caption).

**Loop rule.** One retry per render (`judge.md` §7 — the judge's, or one of these checks on try 1, in the same note form), inside the yes already given. Still failing a BLOCK after it → drop it and list it ("dropped: invented seal survived the retry"). Never a third render without a new quote and yes. Never show a failing ad "with caveats".

**When you cannot see the image.** Some hosts return only links. Then the render is unjudged (`judge.md` §6): no retry, flagged `needs_review`. Compare the composed prompt's on-image words with the creative's detail (`ads_creative_read` `include: ["renders","plan"]`) and mark the ad "not visually checked" with a three-item checklist for the human (e.g. "read the headline letter by letter; check the jar's lid; look for any badge or star we did not ask for"). Never present an unseen render as checked.

**Record every verdict** in the batch file and the creative's tags (`judge.md` §8). Render feedback (`ads_creative_update` `feedback`) carries **only the human's own verdicts** in their words: `rating` `happy` only on the human's pick; `sad` + `reasons` only for faults the human names. The agent's judge and these checks never go into feedback — it trains the brand's learned rules. Durable lessons — "template X carries a competitor seal", "the model garbles our wordmark at small sizes" — are offered to the human and saved through the shared save-learning atom (the `save-learning` skill (`../../save-learning/SKILL.md`)) only on their confirmation, in their words.
