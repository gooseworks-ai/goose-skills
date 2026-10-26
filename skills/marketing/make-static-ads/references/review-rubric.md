# Review rubric — every render, every ratio

The checks run on every render. Who runs which, and what each severity leads to (retry, drop, flag): the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`) steps 2–4. **BLOCK** never ships; **REMAKE** needs a fix or the marketer's look; **NOTE** is a label for the marketer. Reason codes in brackets are for the marketer's own verdicts only (the `honest-review` skill (`../../honest-review/SKILL.md`) §5).

| # | Check | How a senior checks | Severity |
|---|---|---|---|
| 1 | Claims in everything | Every claim-bearing span in copy, on-image text, badges, and what the visual implies — Pass B of the `make-static-ads-claims-extract` skill. Numbers exact, qualifiers present and legible | BLOCK |
| 2 | Invented text and marks | Zoom each render: seals ("Derm approved"), stars, prices, "SALE", laurels, a competitor's logo carried over from the template [`text_garbled`, `brand_or_logo_wrong`] | BLOCK |
| 3 | Right product | When the ad shows the product, against the product photos: shape, lid/cap, label wording, colourway, size, no duplicated or mirrored product, no gibberish label [`wrong_product`, `ai_or_distorted`] | BLOCK |
| 4 | Personal attributes (Meta) | No "you/your" asserting a health condition, body trait, age, finances etc. A reviewer describing themselves is fine | BLOCK → rewrite |
| 5 | Before/after, outcome imagery | No split before/after (unless gated OK), no dull-vs-glowing, no zoomed flaws, no unrealistic results, nothing that makes people feel bad about their body | BLOCK → re-concept |
| 6 | Fake UI, fake people | No fake play buttons, close-X, notification badges; no fake DMs or texts from "customers"; no AI person presented as a customer. A search-bar or notes-app frame is fine as a clearly stylised device in the brand's own words; it fails when it imitates a real platform's results or a real person | BLOCK |
| 7 | Offer, price, stock | Price, currency, code, terms and end date follow the price rule (`claims-and-policy.md` §2); product in stock | BLOCK |
| 8 | Spelling | Read every word letter by letter at full size; models swap letters and drop accents [`text_garbled`] | BLOCK → the judge's retry |
| 9 | Thumb-stop | Squint at phone width: one focal point, contrast in greyscale. Would the first glance stop a scroll? | REMAKE |
| 10 | One message | Say the ad in ten words or fewer without "and" | REMAKE |
| 11 | Legible on a phone | Every slot the template has is filled; each line reads at 375 px wide; headline ≤ 2 lines; qualifier legible | REMAKE |
| 12 | Copy not repeated | The primary text does not repeat the image text | NOTE |
| 13 | Safe zones (9:16) | Nothing important in the zones `prompts.md` §4 names; 9:16 re-laid-out, not centre-cropped | REMAKE |
| 14 | Product or proof visible | Recognisable within a second in every ratio (for software, the real UI or mascot), unless the template is deliberately text-only (label it) | REMAKE / NOTE |
| 15 | Brand fit | Next to two of the brand's own ads (`profile.md`) it reads as the same brand: voice, look, type, logo unstretched and right colour, banned words. "Performs but isn't us" is the marketer's call | REMAKE / NOTE |
| 16 | AI tells | Waxy skin, extra or merged fingers, melted type, impossible reflections, nonsense background text; motion with no cause in the frame (oil pouring from a bottle nobody holds); grain, noise or speckle the style didn't ask for (`prompts.md` §3.1) [`ai_or_distorted`] | REMAKE |
| 17 | CTA fits stage and destination | Usually Learn more for cold education, Shop now / Get offer for warm and offers — but Shop now often wins cold for low-price DTC; a CTA the brief wants tested is a test variable | NOTE |
| 18 | Hook is tension, not feature | First line names the buyer's situation or a surprising specific, ideally in their words; "luxurious hydration" fails (our copy — fix it, no engine reason code) | REMAKE |
| 19 | No repeats | No two ads in the set share a message; the set follows the style rule in `levels.md`; against live and recent ads, at least one of message, visual idea or template changed (the `make-static-ads-concept-grid` skill (`../../make-static-ads-concept-grid/SKILL.md`) §6) | REMAKE set |
| 20 | Rights | No celebrity or lookalike, no third-party trademark, competitor ads used for structure only, creator/model permission on file; app-store badges only per Apple/Google badge rules | BLOCK |
| 21 | Destination match | The destination shows the product, offer and promise of the ad | NOTE (flag to analyze-performance's page audit) |
| 22 | Template used as its level says, not copied | Close and balanced keep the template's layout and text slots; bold keeps only its device or look. None of another brand's words, product, logo or people appear. For a direct competitor's template, the main agent also puts the render beside it with both logos covered (render-review step 3) | REMAKE / BLOCK if copied |
| 23 | Prompt followed | Every on-image word in the composed prompt is drawn, and nothing else; type, colours and logo / no logo as the prompt says | REMAKE |
| 24 | Logo matches the kit | The placed logo (render-review step 1) is the real file, unstretched, readable on its plate. On a no-shell host a drawn logo that drifted is a NOTE, never a retry | NOTE |
| 25 | Bodies and products in use | Feet and shoes face the right way, garments are worn correctly, hands look natural; a floating product has a believable shadow or is clearly a cut-out graphic | REMAKE |
| 26 | Product used for what it is for | A casual shoe is not shown sprinting; a mug is not a vase | REMAKE |
| 27 | Text inside its panel | No line crosses a band or card edge; nothing is cut off at the canvas edge | REMAKE |
| 28 | Idea intact | The board row's physical event happened and its protected choice is visible at thumbnail size. A polished image that lost the event is a failed ad | REMAKE |
| 29 | Example content not copied | No example content (search query, names, on-screen numbers) copied from an ad on the made-before list | REMAKE |
| 30 | Fills the frame | No large empty areas the template doesn't have; the template's elements are all there with real content; not a symbol standing in for the real thing; any ad, screen or page shown inside it looks finished (no blank pills or placeholder bars) | REMAKE |

## Order

Check 28 first: if the idea didn't happen, nothing else matters. Then 15 (brand fit), 30 (fills the frame), 22 (template per level), 3 (right product), 8 (spelling) and 2 (invented marks); claims (1) are the main agent's.

Retries, unseen images and recording verdicts: the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`).
