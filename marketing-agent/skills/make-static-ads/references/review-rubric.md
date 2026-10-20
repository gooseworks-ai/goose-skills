# Review rubric — every render, every ratio

Load at Step 9. Severity decides what happens: **BLOCK** — never ships (fix or drop); **REMAKE** — fix before the set is shown; **NOTE** — label for the human. Engine reason codes for `gooseworks:ads_creative_update` feedback in brackets.

| # | Check | How a senior checks | Severity |
|---|---|---|---|
| 1 | Claims in everything | Every claim-bearing span in copy, on-image text, badges, and what the visual implies — Pass B of `claims-and-policy.md`. Numbers exact, qualifiers present and legible | BLOCK |
| 2 | Invented text and marks | Zoom each render: seals ("Derm approved"), stars, prices, "SALE", laurels, a competitor's logo carried over from the template [`text_garbled`, `brand_or_logo_wrong`] | BLOCK |
| 3 | Right product | Against the product photos: shape, lid/cap, label wording, colourway, size, no duplicated or mirrored product, no gibberish label [`wrong_product`, `ai_or_distorted`] | BLOCK |
| 4 | Personal attributes (Meta) | No "you/your" asserting a health condition, body trait, age, finances etc. A reviewer describing themselves is fine | BLOCK → rewrite |
| 5 | Before/after, outcome imagery | No split before/after (unless gated OK), no dull-vs-glowing, no zoomed flaws, no unrealistic results, nothing that makes people feel bad about their body | BLOCK → re-concept |
| 6 | Fake UI, fake people | No fake play buttons, close-X, notification badges; no fake DMs or texts from "customers"; no AI person presented as a customer. A search-bar or notes-app frame is fine as a clearly stylised device in the brand's own words; it fails when it imitates a real platform's results or a real person | BLOCK |
| 7 | Offer, price, stock | Price, currency, code, terms and end date match the product record and the marketer's words; product in stock | BLOCK |
| 8 | Spelling | Read every word letter by letter at full size; models swap letters and drop accents [`text_garbled`] | BLOCK → quoted remix |
| 9 | Thumb-stop | Squint at phone width: one focal point, contrast in greyscale. Would the first glance stop a scroll? | REMAKE |
| 10 | One message | Say the ad in ten words or fewer without "and" | REMAKE |
| 11 | Legible on a phone | Headline ≤ 2 lines (~7 words), one support line at most, qualifier readable | REMAKE |
| 12 | Text load | On-image text small; primary text does not repeat the image text | REMAKE |
| 13 | Safe zones (9:16) | Nothing important in the top ~14%, bottom ~20–35% or right rail; 9:16 re-laid-out, not centre-cropped | REMAKE |
| 14 | Product or proof visible | Recognisable within a second in every ratio — unless the archetype is deliberately pure-text native (label it) | REMAKE / NOTE |
| 15 | Brand fit, for its archetype | Palette, type, logo unstretched and right colour, voice and banned words. A UGC/native ad should look native; a hero should look premium. "Performs but isn't us" is the human's call [`off_brand`] | REMAKE / NOTE |
| 16 | AI tells | Waxy skin, extra or merged fingers, melted type, impossible reflections, nonsense background text [`ai_or_distorted`] | REMAKE |
| 17 | CTA fits stage and destination | Usually Learn more for cold education, Shop now / Get offer for warm and offers — but Shop now often wins cold for low-price DTC; a CTA the brief wants tested is a test variable | NOTE |
| 18 | Hook is tension, not feature | First line names the buyer's situation or a surprising specific, ideally in their words; "luxurious hydration" fails (our copy — fix it, no engine reason code) | REMAKE |
| 19 | Set diversity | Diversity test still holds after remakes; no two ads in an angle share hook and visual | REMAKE set |
| 20 | Rights | No celebrity or lookalike, no third-party trademark, competitor ads used for structure only, creator/model permission on file | BLOCK |
| 21 | Destination match | The destination shows the product, offer and promise of the ad | NOTE (flag to analyze-performance's page audit) |

**What juniors miss:** 1 (implied and imported claims), 2 (invented seals), 4 (second-person attributes), 7 (narrowed offer terms), 11 (illegible qualifier), 13 (a 9:16 headline under the Reels caption).

**Loop rule.** At most two remake rounds per ad, each on its own yes. Still failing → drop it and list it ("dropped: invented seal survived two edits"). Never show a failing ad "with caveats".

**When you cannot see the image.** Some hosts return only links. Then: rely on the engine's own judge result, read `ads_creative_read` detail (`include: ["renders","plan"]`) for the composed prompt and the on-image text it asked for, and mark the ad "not visually checked" with a three-item checklist for the human (e.g. "read the headline letter by letter; check the jar's lid; look for any badge or star we did not ask for"). Never present an unseen render as checked.

**Record every verdict.** `ads_creative_update` feedback: `rating` `happy` only on the human's pick; `sad` + `reasons` only for engine faults (garbled text, wrong product, distortion, off-brand render); a strategic rejection (wrong angle, our copy choice) goes in the `comment` without `sad`, so the engine's quality loop learns the right lesson. Durable lessons — "template X carries a competitor seal", "the model garbles our wordmark at small sizes" — are offered to the human and saved through the shared save-learning atom (`../../save-learning/SKILL.md`) only on their confirmation, in their words.
