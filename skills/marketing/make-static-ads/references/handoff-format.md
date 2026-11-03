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

Short, in this order:

1. **Above the cards**, three lines: what was read ("Read: 14 reviews, 20 of ~300 live Meta ads, 15 X posts, the homepage; LinkedIn not checked"); the level and angles, and who chose them; the brand's look in one line.
2. **One card per ad:**
   - **The template sheet**, shown to the marketer as the `make-static-ads-find-references` skill (`../../make-static-ads-find-references/SKILL.md`) §5 says: the chosen template (A) and two alternates (B, C) in other styles, each captioned with its source and style.
   - **Angle** (yours / new) · **Message** · **Visual idea** (one sentence) · **Style**
   - **On-image text**, slot by slot, exactly as it will be drawn
   - **Why it's ours:** the product fact or customer words behind it, with the source
   - **Quote:** credits for each ratio
3. **Below the cards**, a few lines: the critic's main objection and what changed; cut lines with what would confirm them; open flags; anything the run check marked skipped, and why; this sentence word for word: "If an image fails my check I redo it once, at the same price."
4. **The question**, with the question tool when the host has one (playbook Step 2): "Go ahead with these quotes?" Options: "Yes, make them as quoted" (Recommended), "Swap a template first", "Change or drop an ad"; when no critic ran, add "Tell me which rows to cut". "Swap a template" → one question per ad (up to four per call): "Template for ad <n>?" A (Recommended), B, C.

No real product photos: no quotes; end with "Send me real photos (or I can make them first) and I'll quote these."

Prompts, fonts and palettes stay in the batch file; show them when asked.

## 3. The finished set (Step 9)

One card per ad, with a "Based on" sheet on top, shown to the marketer the same way (`../scripts/template_sheet.py --no-chosen`: the template, then the kept image with its logo as chosen; no shell: the two images side by side):
- Angle · message · visual idea · style · template · level
- On-image text as drawn
- Primary text A and B · link headline · description · CTA · destination
- Claims and platform rules · check result · link

Write the check lines in plain words ("safe to say", "cut 'never oily': nothing on file confirms it", "passed my check on the second try", "please read the headline letter by letter"). Then, in this order (the same content goes into `ads/batches/<YYYY-MM-DD>-<slug>.md`, `reading-the-brain.md` §7):
1. **Cut lines:** `line → ad → why → proof that would restore it`.
2. **Copy variants** (if made), under each parent ad.
3. **Flags and what you should check:** taste calls, regulated-category notes, renders still failing after the retry, anything not checked by eye, and what I checked.
4. **A suggested test:** for example one ad per angle at the same budget. The structure is the marketer's call.
5. **Your pick:** "Tell me which to run; I'll mark them approved for launch."
