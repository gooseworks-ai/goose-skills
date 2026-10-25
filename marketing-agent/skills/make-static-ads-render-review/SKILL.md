---
name: make-static-ads-render-review
description: >-
  Step of make-static-ads: a fresh judge checks every render against its concept-board row and the official product photos, one retry inside the marketer's approval, then the claims and set checks; records each verdict in tags and the batch file. Run make-static-ads instead; not for direct use.
version: 0.10.0
---

# render-review

Shared principles for reviewing generated media (looking vs reading metadata, unseen images): the `honest-review` skill (`../honest-review/SKILL.md`). Checks and their severities: `../make-static-ads/references/review-rubric.md`. This file is the one home of the retry rule.

**Reads:** each render (`gooseworks:ads_creative_read` `creative_id`, `include: ["renders"]`), its board row (level, style and template), its exact prompt and copy, `profile.md` with two of the brand's own ads, the official product photos or UI screenshots, and the logo.
**Writes:** per render the verdict and the failed checks; retries; the drop list; tags; all of it in the batch file.

0. **Failed or empty render.** Say so in one line. Read the job (`gooseworks:job_get`): charged, or no charge shown → it counts as this ad and ratio's first try; its one retry (step 5) is still covered; clearly uncharged → submit the same quoted request once more, outside the retry. If that fails too, stop for that ad and ratio and tell the marketer.
1. **Place the logo on every try** (unless the marketer said none; then, as with no shell, the raw render is the kept version): on a shell host run `../make-static-ads/scripts/place_logo.py` with the real logo file (corner and width as the prompt left clear), upload the result with `gooseworks:media_upload` (`scope: "brand"`, `kind: "image"`, `source: {type: "bytes"}`, base64, under 8 MB), and `gooseworks:ads_save` it with the raw render's creative as `parent_creative_id`. This logo version is what the judge sees, what gets the tags, and what the marketer receives; tag the raw render `superseded`. Record the box the script prints. No shell: the marketer's choice (playbook Step 2, or graphic-request step 3): a clear corner they fill, or the model's logo; the raw render is then the kept version.
2. **The judge.** A fresh subagent gets only: the kept version (step 1), the product photos or screenshots and logo, the exact on-image copy, the board row's visual idea, style, protected choice, level, and the template's image with its description, `profile.md` with two of the brand's own ads, and the rubric. Not the conversation. It runs every rubric check except 1, 7, 12, 17, 19, 20, 21 and 29, and returns each failed check's number and severity with one sentence each. It works in the rubric's Order. For software, the screen must match the real screenshot in layout, colours and its large labels; soft small UI text is a NOTE, never a retry. No subagents → you judge from exactly those inputs, and the batch file says so.
3. **Your checks**, on every try: 1 by Pass B of the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`: invented badges, stars, prices, changed words); 7 by the price rule (`../make-static-ads/references/claims-and-policy.md` §2); 21 against the copy (12 and 17 ran at the copy step; re-run them only on changed copy); 20 against the permissions on file; 29 against the made-before list; for a direct competitor's template, 22's side-by-side with both logos covered.
4. **Verdict**, in this order:
   - Label drift only (scene, shape and pose pass): the free repair first. A shell host may patch the official label's real pixels in with `../make-static-ads/scripts/repair_patch.py` (`../make-static-ads/scripts/repair_patch.md`), then judge the patched image again in full; keep the original render. A seam, altered geometry or wrong product still fails.
   - A stray mark or small artifact outside the protected choice and the words: a free pixel fix on a shell host, then judged again in full.
   - A fault only in the copy around the image → fix the copy (free), run Pass A and the policy check on the new line; no re-render.
   - A BLOCK no re-render can fix (5, 20, a copied template) → drop the ad and say why, or offer a new board row with its own quote. A REMAKE no re-render can fix → `judge:needs-review`, shown to the marketer.
   - Try 1: any other BLOCK or REMAKE → retry (step 5); NOTEs only → pass. Never retry for logo drift (step 1 places the real logo) or tiny pack print.
   - Try 2: a BLOCK → drop the ad; a REMAKE → `judge:needs-review`, shown to the marketer with the reason; NOTEs only → `judge:pass`. Never a third render without a new quote and yes.
5. **The retry** (one per ad and ratio, covered by the Step 7 yes at its quoted price). The same prompt plus one line: "Fix exactly this, change nothing else: <the failure>". Spell out misdrawn words letter by letter. A lost idea (the event didn't happen) is fixed by rewriting the scene sentences. A rewritten prompt or changed words go through Pass A and the policy check again, and changed words are shown to the marketer before it is sent. `dry_run: true` first; a price above the quote needs a new yes.
6. **Content refusal.** The model refused → remove the line or visual that triggered it, re-check claims, show the marketer what changed, `dry_run: true` again (a new price needs a new yes), then send once more. That is this ad and ratio's retry.
7. **The set.** After all renders: rubric check 19. Do two images say the same thing?
8. **Record.** In the batch file: verdict per try, who judged, and each retry's creative id next to the one it replaces. The marketer gets one image per ad and ratio (the kept try). Tags on each kept version (step 1), as `../make-static-ads/references/handoff-format.md` §1 lists (read current tags, merge, write once, lower-case), including `judge:pass` / `judge:needs-review` / `judge:unjudged` and `try:1` / `try:2`; earlier tries get `superseded`, and a raw render only when a logo version replaced it. Render feedback follows the `honest-review` skill §5.

Can't see images on this host → each render is unjudged: no retry, marked "not checked by eye", with a three-item checklist for the marketer (e.g. "read the headline letter by letter; check the label; look for any badge or star we did not ask for").

**Done:** every ad and ratio has one kept image (logo placed, its corner left clear, the model's logo, or none, as chosen) that passed, is flagged for the marketer's look, or was dropped with the reason; all of it is in the batch file and tags.
