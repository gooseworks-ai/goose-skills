---
name: fix-writer
description: Internal step of improve-search-visibility. Turns one fix drawn from the page map into a finished, paste-ready change with its gap, location, owner, minutes, time to show, risk and undo. Also writes page briefs in make-content's brief input shape. Not user-invoked.
---

# fix-writer

**Reads:** `../../references/finished-fix-examples.md`, `../../references/gap-to-fix.md`, `../../references/prioritising.md`; `../../references/page-map.md`; the page map row the fix or brief comes from; the brand's voice; product records; the CMS and who ships (from intake). Claims are decided by `../../../../atoms/claims-gate/ATOM.md`, run over every finished fix in SKILL step 4 — this atom never decides a claim itself.

**Does:**
1. Write the change itself: the exact title/meta/H1/opening paragraph, Q&A block, markup, field values, robots line, listing text or drafted inclusion request — in the CMS's terms (where in Shopify / WordPress / Webflow it goes; markup as an edit to the theme's existing block with live values, never a second hard-coded block).
2. **Facts in the draft:** mark every sentence that states a fact with its source (a "Claims you may use" fact, a product record field, or [PROOF NEEDED]) so the claims gate can keep, rewrite or cut it. The live page supplies plain product facts only (name, price, size, listed ingredients, how to use) — re-read prices from it; ratings and review counts appear only as a "Claims you may use" fact, or in markup that mirrors reviews shown on the page. Competitor facts come only from the competitor's own page, read this run and cited with its date — never from a list or a review site — and only if the human allows naming rivals.
3. **Two versions of every fix.** For the report's "What to do" section, plain words only: what changes and where, who does it and how long, why it's in the top five (the gap it closes, said as the buyer question it fixes — never a question id), how we'll know it worked. For the report's last section, "For whoever edits your site": the finished copy, field values or code and exactly where it goes, plus time to show, risk and undo.
4. **Page briefs** ("needed" rows of the page map, not counted in the five) to `search/briefs/<page-slug>.md` in the exact shape in `../../references/page-map.md` (make-content's brief input).

**Writes:** both versions into the report, the working copy into `search/fixes/<date>.md`; brief files. Briefs name the questions they answer in words, not ids.
**Never:** "add an FAQ", "improve E-E-A-T" or any instruction without the finished text; invented stats, prices, dates or reviews; FAQ markup promised as a rich result.
