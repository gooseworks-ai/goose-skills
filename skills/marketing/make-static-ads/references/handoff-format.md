# Hand-off format — what the marketer and sibling playbooks receive

## 1. Tags and naming

Write with `gooseworks:ads_creative_update` `patch.tags`. Read the creative's current tags, merge, and write the whole set once; everything lower-case (keys and values, hyphenated):

`made-by:make-static-ads` · `batch:<yyyy-mm-dd>` · `concept:<yyyymmdd>-c<n>` (the board row; the date keeps ids unique across batches) · `style:<slug>` · `angle:<a-nn from the angle bank, else a short slug>` · `type:<angle type, map below>` · `level:<close|balanced|bold>` · `template:<library template id, first 8 characters; or meta-<advertiser-slug>; or own-<creative id, first 8>>` · `mode:<fresh|iterate|rotation|fix>` · `test:<short slug of the test question, e.g. hook-vs-proof>` · `offer-ends:<yyyymmdd>` (promo ads) · `claims:<pass|cuts|facts-only>` · `judge:<pass|needs-review|unjudged>` · `try:<1|2>` · `superseded` · `picked` (only on the marketer's decision)

| Angle family | `type:` |
|---|---|
| Problem → solution | problem_fix |
| How it works / demo | how_it_works / demo |
| Reviews, press, proof | proof |
| Old way vs new | old_vs_new |
| Identity, aspiration, occasion | identity / desire |
| Objection | objection |
| Founder or origin | story |
| Offer | offer |
| Curiosity or news | curiosity / news |

Picks are also written in the batch file, which stays the record of truth. Readable name for the ad account: `brand_product_angle_level_ratio_yyyy-mm-dd`.

## 2. The board at the spend gate (Step 7)

One message, in this order:

1. **Above the cards:** what was read ("Read: 14 reviews, 20 of ~300 live Meta ads, 15 X posts, the homepage; LinkedIn not checked"), the creativity level and who chose it, the angles and who chose them, and the brand profile in three lines (positioning, angles, look).
2. **One card per ad**, in a grid where the host can show images, else one block per ad:
   - **Angle** (yours / new) · **Message** · **Visual idea** (one sentence) · **Style**
   - **On-image text**, slot by slot, exactly as it will be drawn
   - **Template:** its image, with its source; then the **two alternates** as images, each with its style ("Swap to B for a lifestyle photo instead")
   - **Why it's ours:** the product fact or customer words behind it, with the source
   - **Quote:** credits for each ratio
3. **Below the cards:** the critic's main objection and what changed; cut lines with what would confirm them; open flags; this sentence word for word: "If an image fails my check I redo it once, at the same price."; and one question: "Go ahead with these quotes?" (when no critic ran: "Go ahead with these quotes, or tell me which rows to cut first?")

No real product photos: no quotes; end with "Send me real photos (or I can make them first) and I'll quote these."

Prompts, fonts and palettes stay in the batch file; show them when asked.

## 3. The finished set (Step 9)

One card per ad, with the kept image (logo placed, or its corner left clear) on top:
- Angle · message · visual idea · style · template · level
- On-image text as drawn
- Primary text A and B · link headline · description · CTA · destination
- Claims and platform rules · check result · link

Write the check lines in plain words ("safe to say", "cut 'never oily': nothing on file confirms it", "passed my check on the second try", "please read the headline letter by letter"). Then, in this order (the same content goes into `ads/batches/<YYYY-MM-DD>-<slug>.md`, `reading-the-brain.md` §7):
1. **Cut lines:** `line → ad → why → proof that would restore it`.
2. **Copy variants** (if made), under each parent ad.
3. **Flags:** taste calls, regulated-category notes, renders still failing after the retry, anything not checked by eye.
4. **A suggested test:** for example one ad per angle at the same budget. The structure is the marketer's call.
5. **What I checked / what you should check.**
6. **Your pick:** "Tell me which to run; I'll mark them approved for launch."
