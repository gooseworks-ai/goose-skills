# Hand-off format — what the marketer and sibling playbooks receive

## 1. Tags and naming

Write with `gooseworks:ads_creative_update` `patch.tags`. Read the creative's current tags, merge, and write the whole set once; everything lower-case (keys and values, hyphenated):

`made-by:make-static-ads` · `batch:<yyyy-mm-dd>` · `concept:<c1, c2, …>` (the board row) · `angle:<a-nn from the angle bank, else a short slug>` · `type:<angle type, map below>` · `level:<close|balanced|bold>` · `template:<first 8 characters of the template id>` · `mode:<fresh|iterate|rotation|fix>` · `test:<short-slug>` · `offer-ends:<yyyymmdd>` (promo ads) · `claims:<pass|cuts|facts-only>` · `judge:<pass|needs-review|unjudged>` · `try:<1|2>` · `superseded` · `picked` (only on the marketer's decision)

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

The concept board from `board.md`, trimmed for the marketer, with the templates as images (`../../make-static-ads-find-references/SKILL.md` §5):

| # | Angle (yours / new) | Message | Visual idea | On-image text (per slot) | Template | Why it's ours (fact or customer words, source) | Quote |
|---|---|---|---|---|---|---|---|

Above it: what was read ("Read: 14 reviews, 20 of ~300 live Meta ads, 15 X posts, the homepage; LinkedIn not checked"), the creativity level and who chose it, the angles and who chose them, and a short version of the brand profile (positioning, angles, look). Below it: the critic's main objection and what changed, cut lines with what would confirm them, open flags, the sentence "If an image fails my check I redo it once, at the same price.", and one question: "Go ahead with these quotes?" Prompts, fonts and palettes stay in the batch file; show them when asked.

## 3. The finished set (Step 9)

Per ad, one image (the kept try):

| # | Angle · message | Visual idea | Template · level | On-image text (as drawn) | Primary text (A / B) | Headline | Description | CTA | Destination | Claims and platform rules | Check result | Link |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

Write the check columns in plain words ("safe to say", "cut 'never oily': nothing on file confirms it", "passed my check on the second try", "please read the headline letter by letter"). Then, in this order (the same content goes into `ads/batches/<YYYY-MM-DD>-<slug>.md`, `reading-the-brain.md` §7):
1. **Cut lines:** `line → ad → why → proof that would restore it`.
2. **Copy variants** (if made), under each parent ad.
3. **Flags:** taste calls, regulated-category notes, renders still failing after the retry, anything not checked by eye.
4. **A suggested test:** for example one ad per angle at the same budget. The structure is the marketer's call.
5. **What I checked / what you should check.**
6. **Your pick:** "Tell me which to run; I'll mark them approved for launch."
