# Hand-off format — what the human and the sibling playbooks receive

Load at Step 7 (plan table) and Step 10 (finished set).

## 1. Definitions

- **An ad** = one concept: one hook, one visual idea, one copy set, delivered in every ratio its placements need. "Ten ads" = ten concepts ≈ twenty to thirty images. Dry-run with those ratios.
- **A cell** = the ads inside one angle that differ in one thing (hook *or* archetype), so the angle wins or loses as a unit.

## 2. Tags and naming (so results trace back)

Write with `gooseworks:ads_creative_update` `patch.tags`. **Everything lower-case** (the server stores tags lower-case, and queries must match): keys and values, hyphenated:

`angle:<a-nn from the angle bank (e.g. angle:a-07), else a short slug>` · `type:<angle type, e.g. problem_fix>` · `archetype:<slug>` · `hook:<n>` · `stage:<unaware|problem|solution|product|most>` · `batch:<yyyy-mm-dd>` · `mode:<fresh|iterate|rotation|fix>` · `test:<short-slug>` · `offer-ends:<yyyymmdd>` (e.g. `offer-ends:20261031`) (promo ads) · `claims:<pass|cuts|facts-only>` · `src:<first 8 characters of the template or creative id>` · `picked` (only on the human's run decision)

**Tags replace the whole set.** Read the creative's current tags, merge, and write the full set once; add `picked` later the same way. Picks are also written in the batch file, which stays the record of truth while tag writes are unverified (server-needs).

Readable name for the human and the ad account: `brand_product_angle_stage_hook#_archetype_ratio_yyyy-mm-dd` (lower-case).

## 3. The plan table (shown at the spend gate, Step 7)

| # | Angle — they buy because… (source) | Stage | Archetype | Source template | On-image text | Claims | Ratios |
|---|---|---|---|---|---|---|---|

Below it: cut lines, open flags, test question, each concept's quote line exactly as the engine returned it, a note that remakes are priced and asked separately, and one question: "Go ahead with these N quotes?"

## 4. The finished set (Step 10)

Per ad:

| # | Angle (source) | Stage / driver | Archetype | On-image text | Primary text (2 versions) | Headline | Description | CTA | Destination | Safe to say? | Platform rules | Look at | Link |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Write the check columns in plain words ("safe to say", "cut 'never oily' — needs approval", "rewritten for Meta's rule on personal traits", "please read the headline letter by letter"). Claim ids and check names go into tags and the batch file, not the chat.

Then, in this order (and the same content into `ads/batches/<YYYY-MM-DD>-<slug>.md` with creative ids — `reading-the-brain.md` §7):
1. **Cut lines** — `line → ad → why → proof that would restore it`.
2. **Flags for the human** — taste calls, regulated-category notes, listed variants used, "not visually checked" items.
3. **Recommended test structure** for run-paid-campaigns — e.g. "Cell A: angle test, one ad per angle, same copy; Cell B: two hooks inside the winning angle". Structure is theirs to decide; this is a suggestion.
4. **What I checked / what you should check.**
5. **Your pick** — "Tell me which to run; I'll mark them approved for launch."

## 5. A worked example — what excellent looks like

*Hypothetical brand "Fern & Field", Barrier Cream 50 ml, in stock, Meta feed + Stories. Approved claims on file: C1 "Clinically shown to increase skin hydration for up to 72 hours." (qualifier: "Corneometer study, 32 participants, single application"); C2 "Fragrance-free."; C3 "Non-greasy finish."; C4 "Made with 5 ceramides."; C5 "Rated 4.8/5 from 12,400+ reviews." (as of 30 Sep). Customer words on file: V1 "my face felt tight by 11am"; V2 "I forgot I was wearing it"; V3 "the first rich cream that doesn't pill under my sunscreen"; V4 "my sister keeps stealing it"; V5 "I have oily skin and was scared it'd be too heavy". Label directions on file: apply morning and night. Founder story on file: F1 "I wanted one cream I didn't have to think about." — Mara, founder. Offer on file: 15% off first order, code HELLO15, ends 20 Oct.*

| # | Angle — they buy because… | Stage | Archetype | On-image text | Claims |
|---|---|---|---|---|---|
| A1 | Dryness comes back by noon; this lasts | Problem | Notes-app native | "11am. Skin already feels tight." | V1 as pain, in brand voice (not posed as a quote); C1 verbatim + qualifier in primary text. **Cut** a "things I reapply before lunch: ~~moisturiser~~" joke — it implies a no-reapply-by-lunch result C1 does not state |
| A2 | Same angle, proof-led | Problem | Big-number stat | "Clinically shown to increase skin hydration for up to 72 hours*" + legible qualifier | C1 verbatim (a shorter "Up to 72h hydration*" would need to be a listed variant — cut, restore-proof: add it in learn-my-brand) |
| B1 | A rich cream without the greasy feel | Solution | Benefit stack beside the jar (no rival column — "most rich creams are greasy" is a comparative needing proof) | "Non-greasy finish. Fragrance-free." | C3, C2 verbatim. **Cut** "doesn't pill under SPF" → needs a layering test approved via learn-my-brand |
| B2 | Same angle, sensory | Solution | Texture macro | "Rich. Non-greasy finish." | "Rich" puffery + C3 verbatim; V5 verbatim and attributed in the long primary text as the reviewer's worry (pain only — no oily-skin suitability claim; "non-greasy finish" is all C3 says) |
| B3 | Same angle, proof | Product | Review card | "I forgot I was wearing it." — <reviewer, source> | V2 verbatim, attributed, own customer with permission; no stars (the reviewer's own rating is not on file). V3 card **cut** — it imports the pilling claim |
| C1 | Lots of people already rate it (angle label only, never copy) | Product | Stat / proof card (no per-review stars, no invented reviews) | "Rated 4.8/5 from 12,400+ reviews." (as of 30 Sep) | C5 verbatim, dated — verify current |
| C2 | Same angle, humour | Product | Lo-fi shelf photo, sticky note "MINE" | "The jar that keeps going missing." | Brand-written puffery in third person, hook source V4 (not posed as a customer post); C5 verbatim in primary text |
| D1 | One rich cream for morning and night | Unaware | Flat lay, the jar alone on a clean shelf | "One jar. Morning and night." | Product fact: label directions; C4, C2 verbatim in primary text. **Cut** "Skip steps 2–9" and the nine-faded-bottles visual — both imply it replaces serums and SPF |
| D2 | Same angle, founder | Problem | Handwritten founder note | "I wanted one cream I didn't have to think about. — Mara" | F1 verbatim — the founder's own words from the brain |
| E1 | Try it for less | Most-aware | Hero + offer band | "15% off your first order. HELLO15. Ends Tue 20 Oct." | Offer matches record — "first order", not "first jar" |

Why it is excellent: every on-image line is a signed claim verbatim, a plain product fact, an offer matching the record, puffery, or a real attributed quote — and every cut, in words or pictures, is shown; five different reasons to buy; every awareness stage; hooks traceable to customer words or approved claims; cuts shown with restore-proof; variants inside an angle differ in hook or format, never message; CTA follows awareness (Learn more cold, Shop now warm); five visual grammars. The junior set — ten versions of "hydration that lasts" on different backgrounds, all Shop now, all brand-speak — tests nothing and fatigues all at once.
