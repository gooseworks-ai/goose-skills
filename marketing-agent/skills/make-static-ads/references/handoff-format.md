# Hand-off format — what the human and the sibling playbooks receive


## 1. Definitions

- **A concept** = one persona, one reason to buy, one proof.
- **An ad** = one execution of a concept: one look (framework, style, composition), one hook, one copy set, delivered in every ratio its placements need. "Ten ads" = ten executions, usually of 3–5 concepts ≈ twenty to thirty images. One dry run per ad and ratio (each ratio is its own composed prompt, `composer.md` §10–11).
- **A cell** = the ads inside one concept, which differ in look (and may differ in hook), so the concept wins or loses as a unit.

## 2. Tags and naming (so results trace back)

Write with `gooseworks:ads_creative_update` `patch.tags`. **Everything lower-case** (the server stores tags lower-case, and queries must match): keys and values, hyphenated:

`concept:<c1, c2, …>` (the concept the ad executes — results are read per concept) · `angle:<a-nn from the angle bank (e.g. angle:a-07), else a short slug>` · `persona:<slug>` · `emotion:<slug>` · `style:<lofi|hifi|graphic|illustrated|lifestyle>` · `type:<angle type, e.g. problem_fix>` · `archetype:<slug>` · `hook:<n>` · `stage:<unaware|problem|solution|product|most>` · `batch:<yyyy-mm-dd>` · `mode:<fresh|iterate|rotation|fix>` · `test:<short-slug>` · `offer-ends:<yyyymmdd>` (e.g. `offer-ends:20261031`) (promo ads) · `claims:<pass|cuts|facts-only>` · `src:<first 8 characters of the template or creative id>` · `structure-only` (templates the brand doesn't own) · the judge's tags `judge:<pass|needs-review|unjudged>`, `try:<1|2>`, `superseded` (`judge.md` §8) · `picked` (only on the human's run decision)

**Tags replace the whole set.** Read the creative's current tags, merge, and write the full set once; add `picked` later the same way. Tags save to the creative's `user_tags`; picks are also written in the batch file, which stays the record of truth.

Readable name for the human and the ad account: `brand_product_angle_stage_hook#_archetype_ratio_yyyy-mm-dd` (lower-case).

## 3. The plan table (shown at the spend gate, Step 8)

| # | Concept | Persona | Reason to buy — they buy because… (source) | Proof (brain status) | Framework · style | Template (advertiser, Ad Library link) | Structure-only | Ratios |
|---|---|---|---|---|---|---|---|---|

Above it: the coverage note ("Already running: … New here: …") and the lever tally (`creative-taxonomy.md` §4). Below it: cut lines with what would confirm them, open flags, the test question, each ad's quote line exactly as the engine returned it, the sentence "If an image fails my check I redo it once, at the same price.", and one question: "Go ahead with these quotes?" Font, palette and logo per ad, the on-image words the composer wrote and the full prompts stay in the batch file; show them in chat only when the marketer asks.

## 4. The finished set (Step 12)

Per ad:

| # | Concept · persona · reason to buy (source) · proof | Emotion / stage | Framework · style | Template | On-image text (as drawn) | Primary text (2 versions) | Headline | Description | CTA | Destination | Safe to say? | Platform rules | Check result | Look at | Link |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Write the check columns in plain words ("safe to say", "cut 'never oily' — nothing on file confirms it", "rewritten for Meta's rule on personal traits", "passed my check on the second try", "please read the headline letter by letter"). Brain statuses, judge checklists and check names go into tags and the batch file, not the chat.

Then, in this order (and the same content into `ads/batches/<YYYY-MM-DD>-<slug>.md` with creative ids, each ad's final prompt and image list per ratio, and its judge result per try — `reading-the-brain.md` §7):
1. **Cut lines** — `line → ad → why → proof that would restore it`.
2. **Copy variants** (if made) — under each parent ad: the image, its text, its font; to run as text options inside one flexible ad.
3. **Flags for the human** — taste calls, regulated-category notes, renders that still failed the judge after the retry (`needs_review`), "not visually checked" items.
4. **Recommended test structure** for run-paid-campaigns — e.g. "Cell A: angle test, one ad per angle, same copy; Cell B: two hooks inside the winning angle". Structure is theirs to decide; this is a suggestion.
5. **What I checked / what you should check.**
6. **Your pick** — "Tell me which to run; I'll mark them approved for launch."

## 5. A worked example — what excellent looks like

*Hypothetical brand "Fern & Field", Barrier Cream 50 ml, in stock, Meta feed + Stories. Brain facts on file, all `confirmed`: C1 "Clinically shown to increase skin hydration for up to 72 hours." (qualifier: "Corneometer study, 32 participants, single application"); C2 "Fragrance-free."; C3 "Non-greasy finish."; C4 "Made with 5 ceramides."; C5 "Rated 4.8/5 from 12,400+ reviews." (as of 30 Sep). Customer words on file: V1 "my face felt tight by 11am"; V2 "I forgot I was wearing it"; V3 "the first rich cream that doesn't pill under my sunscreen"; V4 "my sister keeps stealing it"; V5 "I have oily skin and was scared it'd be too heavy". Label directions on file: apply morning and night. Founder story on file: F1 "I wanted one cream I didn't have to think about." — Mara, founder. Offer on file: 15% off first order, code HELLO15, ends 20 Oct.*

| # | Angle — they buy because… | Stage | Archetype | On-image text | Claims |
|---|---|---|---|---|---|
| A1 | Dryness comes back by noon; this lasts | Problem | Notes-app native | "11am. Skin already feels tight." | V1 as pain, in brand voice (not posed as a quote); C1 verbatim + qualifier in primary text. **Cut** a "things I reapply before lunch: ~~moisturiser~~" joke — it implies a no-reapply-by-lunch result C1 does not state |
| A2 | Same angle, proof-led | Problem | Big-number stat | "Clinically shown to increase skin hydration for up to 72 hours*" + legible qualifier | C1 verbatim (a shorter "Up to 72h hydration*" is a new claim — cut; restore: confirm that wording in the brand brain) |
| B1 | A rich cream without the greasy feel | Solution | Benefit stack beside the jar (no rival column — "most rich creams are greasy" is a comparative needing proof) | "Non-greasy finish. Fragrance-free." | C3, C2 verbatim. **Cut** "doesn't pill under SPF" → needs a layering test the brain marks `confirmed` |
| B2 | Same angle, sensory | Solution | Texture macro | "Rich. Non-greasy finish." | "Rich" puffery + C3 verbatim; V5 verbatim and attributed in the long primary text as the reviewer's worry (pain only — no oily-skin suitability claim; "non-greasy finish" is all C3 says) |
| B3 | Same reason, new proof (concept c3) | Product | Review card | "I forgot I was wearing it." — <reviewer, source> | V2 verbatim, attributed, own customer with permission; no stars (the reviewer's own rating is not on file). V3 card **cut** — it imports the pilling claim |
| C1 | Lots of people already rate it (angle label only, never copy) | Product | Stat / proof card (no per-review stars, no invented reviews) | "Rated 4.8/5 from 12,400+ reviews." (as of 30 Sep) | C5 verbatim, dated — verify current |
| C2 | Same angle, humour | Product | Lo-fi shelf photo, sticky note "MINE" | "The jar that keeps going missing." | Brand-written puffery in third person, hook source V4 (not posed as a customer post); C5 verbatim in primary text |
| D1 | One rich cream for morning and night | Unaware | Flat lay, the jar alone on a clean shelf | "One jar. Morning and night." | Product fact: label directions; C4, C2 verbatim in primary text. **Cut** "Skip steps 2–9" and the nine-faded-bottles visual — both imply it replaces serums and SPF |
| D2 | Same angle, founder | Problem | Handwritten founder note | "I wanted one cream I didn't have to think about. — Mara" | F1 verbatim — the founder's own words from the brain |
| E1 | Try it for less | Most-aware | Hero + offer band | "15% off your first order. HELLO15. Ends Tue 20 Oct." | Offer matches record — "first order", not "first jar" |

Concepts in this example: **c1** dryness comes back by noon (A1, A2); **c2** rich without the greasy feel, proof = confirmed texture claims (B1, B2); **c3** the same reason with a different proof — a real customer review — so it is its own concept (B3); **c4** lots of people rate it (C1, C2); **c5** one cream, morning and night (D1, D2); **c6** the live offer (E1). Persona: the hypothetical brand has one segment on file (people who want one simple, rich moisturiser), so there is no persona column; a brand with several segments adds one. A2's and D2's headlines run past eight words because each is a confirmed claim or the founder's real words used verbatim, and both still read in two lines.

Why it is excellent: every on-image line is a confirmed claim worded as recorded, a plain product fact, an offer matching the record, puffery, or a real attributed quote — and every cut, in words or pictures, is shown; five different reasons to buy, each in one to three looks; awareness matched to each ad's job (cold concepts problem- and solution-aware; proof and offer ads for warm audiences — this example serves both); hooks traceable to customer words or confirmed claims; cuts shown with restore-proof; variants inside an angle differ in hook or format, never message; CTA follows awareness (Learn more cold, Shop now warm); five visual grammars. The junior set — ten versions of "hydration that lasts" on different backgrounds, all Shop now, all brand-speak — tests nothing and fatigues all at once.
