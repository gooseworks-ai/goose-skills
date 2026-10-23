---
name: make-static-ads-render-review
description: >-
  Step of make-static-ads: a fresh judge checks every render against its concept-board row and the official product photos, one retry inside the marketer's approval, then the claims and set checks; records each verdict in tags and the batch file. Run make-static-ads instead; not for direct use.
version: 0.7.1
---

# render-review

Shared principles for reviewing generated media (looking vs reading metadata, unseen images): the `honest-review` skill (`../honest-review/SKILL.md`). Checks: `../make-static-ads/references/review-rubric.md`.

**Reads:** each render (`gooseworks:ads_creative_read` `creative_id`, `include: ["renders"]`), its board row (level and template), its exact prompt, `profile.md` with two of the brand's own ads, the official product photos and logo.
**Writes:** per render the verdict and the failed checks; retries; the drop list; tags; all of it in the batch file.

1. **The judge.** A fresh subagent gets only: the render, the product photos and logo, the exact on-image copy, the board row's visual idea, protected choice, level and template description, `profile.md` with two of the brand's own ads, and the rubric. Not the conversation. It returns pass / retry / fail with the failed check numbers and one sentence per failure. Its first questions: is the protected choice visible at thumbnail size? Does it look like this brand's ad (profile, own ads), with its logo? Is the frame full, or a headline on empty space? At close and balanced, did it keep the template's layout and text slots? Is it the right product (shape, label, colours)? Does every word read exactly as written? No subagents → you judge from exactly those inputs, and the batch file says so.
2. **One retry.** A retry verdict → the same prompt plus one line: "Fix exactly this, change nothing else: <the failure>". Spell out misdrawn words letter by letter. `dry_run: true` first; this retry is inside the approval only at the quoted price. A lost idea (the event didn't happen) is fixed by rewriting the scene sentences, not by a note.
3. **Content refusal.** The model refused → remove the line or visual that triggered it, re-check claims, send once more. That is the ad's retry. Say what was removed.
4. **Claims on what was drawn.** Pass B of the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`): invented badges, stars, prices, changed words.
5. **Label drift only.** When scene, shape and pose pass and only the printed label drifted, a shell host may patch the official label's real pixels in with `../make-static-ads/scripts/repair_patch.py` (`../make-static-ads/scripts/README.md`), then judge the patched image again in full. Keep the original render. A seam, altered geometry or wrong product still fails.
6. **Still failing after the retry** → a BLOCK drops the ad; anything else is shown to the marketer as needing their look, with the reason. Never a third render without a new quote and yes.
7. **The set.** After all renders: rubric check 19. Do two images say the same thing?
8. **Record.** In the batch file: verdict per try, who judged. Tags on each creative (read current tags, merge, write once, lower-case): `judge:pass` / `judge:needs-review` / `judge:unjudged`, `try:1` / `try:2`, `superseded`. Render `feedback` carries only the marketer's own words.

Can't see images on this host → each render is unjudged: no retry, marked "not checked by eye", with a three-item checklist for the marketer (`review-rubric.md`, last section).
