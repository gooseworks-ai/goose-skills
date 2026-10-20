---
name: render-review
description: Internal step of make-static-ads. Judges every render exactly as GooseWorks' server judge does, retries once with the server's own retry note inside the yes already given, then runs the playbook's extra checks, drops what still fails and records each verdict in tags and the batch file.
---

# render-review

The judge is `references/judge.md`, the server's rubric copied verbatim. The shared principles for reviewing generated media (by eye vs automatic read, unseen items) are `../../../../atoms/honest-review/ATOM.md`. This atom is the order of work.

**Reads:** each render (`gooseworks:ads_creative_read` `creative_id`, `include: ["renders","plan"]`); per ad and ratio, the final prompt and image list from compose; the product photos and logo; the template image (normal path for the judge; for a "layout only" template, the main agent only, for the side-by-side test — never the judge); `references/judge.md`, `references/review-rubric.md`.
**Writes:** per render the judge's checklist, verdict and notes; retries; the drop list; tags on each creative; all of it in the batch file.

1. **Judge every render with `judge.md`** — §2 (what it sees, in order), §3 (the instruction), §4 (the checklist), §5 (the pass rule). Where the host can start a subagent, give a fresh one only judge.md §2–§4 and the images, never the composing conversation. Also give it the list of facts this ad may state (the featured product's facts, its price and sale price, and the claims the brain marks `confirmed` or `found` on the brand's site or kit), so `claims_grounded` judges against the brand's real facts, not only what the photos show. Judge each field on what is visible; never argue a failure away. Each ratio is judged on its own.
2. **Retry once (`judge.md` §6–7).** A `retry` verdict on try 1 → the render's base prompt plus the server's retry note, same images, same ratio, `dry_run: true` first, then submit. This retry is inside the marketer's yes (Step 8 said "if an image fails my check I redo it once, at the same price"); a quote above the price shown → stop and ask. Try 2 still fails → it is flagged `needs_review`; when it fails more checklist items than try 1, show both and say which the server would have kept.
3. **Content-policy refusal.** A render the image model refuses → re-compose the ad (`atoms/compose/ATOM.md`) without the line or visual that triggered it, then send it once more. That is the ad's one retry. Say plainly what was removed and why.
4. **Then the playbook's extra checks:** Pass B of `atoms/claims-extract/ATOM.md` on what was drawn, and `references/review-rubric.md` checks 1–23 in order; stop at the first BLOCK. A BLOCK or REMAKE on try 1 that the judge passed → use the render's one retry anyway, with `judge.md` §7's note form and the failure as the notes. Still there after the retry → a BLOCK drops the ad, a REMAKE drops it unless it is a taste call (then a NOTE for the human); say why ("dropped: invented seal survived the retry"). Never a third render without a new quote and yes.
5. **Set diversity.** After every render is judged, re-run rubric check 19 on the set.
6. **Cannot see the image?** The render is unjudged (`judge.md` §6): no retry, flagged, and the ad is marked "not checked by eye" with a three-item checklist for the human (`review-rubric.md`, last section).
7. **Extra placements** on an approved render: a new ratio is a new base prompt (compose row 10) and a quoted `gooseworks:ads_render` call, judged the same way.
8. **Record** per `judge.md` §8: the full trace in the batch file; tags on the creative (`judge:pass`, `judge:needs-review`, `judge:unjudged`, `try:1`, `try:2`, `superseded`) merged into the set from `references/handoff-format.md` §2 with `gooseworks:ads_creative_update` — read the current tags, merge, write once, lower-case. **Never write the judge or the playbook's checks into `feedback`**: feedback is the human's channel and trains the brand's learned rules; it carries only the marketer's own ratings and words.

## Fixes from the 19 Oct test runs

- **Which retry note.** A correctly written word drawn with a wrong or garbled letter is a drawing fault, not a copy fault: use the "Fix exactly that; change nothing else" note and spell the word out ("the word must read 'treads' letter by letter"). Use the copy note only when the words themselves were wrong (a claim cut, a line that doesn't parse).
- **Checks the judge missed — always run them, and a failure uses the retry:**
  - logo: same shape, letters and colours as the kit logo file (recoloured = fail);
  - bodies and products in use: feet and shoes facing the right way, garments worn correctly, hands natural;
  - the product used for what it is for (a casual shoe is not shown sprinting; a mug is not a vase);
  - text inside its panel: no line crossing a band or card edge, nothing cut off at the canvas edge;
  - a floating product has a believable shadow or is clearly a cut-out graphic;
  - **the concept is intact:** the image still speaks to the row's persona and reason to buy. A proof missing from the image is moved into the primary text first (free, no retry); only a picture or headline that speaks to someone else uses the retry;
  - **not a competitor copy:** for a direct competitor's template, the main agent (not the judge) puts the render beside the template image, logos covered (`references/references-and-remix.md` §5) — could a buyer take ours for theirs?;
  - **not a repeat:** no example content (search query, names, on-screen numbers) copied from an ad on the "made before" list.
  Put the failure in the retry note's notes, in one sentence. A competitor copy or a lost concept is fixed by re-composing (a new picture idea or words), not by the retry note alone.
