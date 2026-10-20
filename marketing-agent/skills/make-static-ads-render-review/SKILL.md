---
name: make-static-ads-render-review
description: >-
  Step of the make-static-ads playbook: judges every render exactly as GooseWorks' server judge does, retries once with the server's own retry note inside the yes already given, then runs the playbook's extra checks, drops what still fails and records each verdict in tags and the batch file. Run make-static-ads instead; not for direct use.
version: 0.4.2
---

# render-review

The judge is `../make-static-ads/references/judge.md`, the server's rubric copied verbatim. The shared principles for reviewing generated media (by eye vs automatic read, unseen items) are the `honest-review` skill (`../honest-review/SKILL.md`). This atom is the order of work.

**Reads:** each render (`gooseworks:ads_creative_read` `creative_id`, `include: ["renders","plan"]`); per ad and ratio, the compose record (final prompt, image list, scheme, blueprint, composer answer, departures used); the product photos and logo; the template image (normal path for the judge; for a "layout only" template, the main agent only, for rubric check 22 — never the judge); `../make-static-ads/references/judge.md`, `../make-static-ads/references/review-rubric.md`.
**Writes:** per render the judge's checklist, verdict and notes; retries; the drop list; tags on each creative; all of it in the batch file.

1. **The blind judge.** Assemble `judge.md` §3 with this ad's values from its compose record: the brand name, the colour piece from its scheme, the flags, template id, variant label, the blueprint — for a direct competitor, the **reduced** blueprint (compose departure 2) — the adapted subject, source and target media, and the colour roles. Add the two judge departures below. Give a fresh subagent that assembled instruction, `judge.md` §4 and the images in §2's order. Nothing else: never the composing conversation. A host with no subagents → the agent judges from exactly the same inputs. Apply §5's pass rule. Judge each field on what is visible; never argue a failure away. Each ratio is judged on its own.
2. **Retry once (`judge.md` §6–7).** A `retry` verdict on try 1 → the render's base prompt plus the server's retry note, same images, same ratio, `dry_run: true` first, then submit. This retry is inside the marketer's yes (Step 8 said "if an image fails my check I redo it once, at the same price"); a quote above the price shown → stop and ask. Note choice: a correctly written word drawn with a wrong or garbled letter is a drawing fault → the "Fix exactly that; change nothing else" note, with the word spelled out ("the word must read 'treads' letter by letter"); the copy note only when the words themselves were wrong. Try 2 still fails → flagged `needs_review`; when it fails more checklist items than try 1, show both and say which the server would have kept.
3. **Content-policy refusal.** A render the image model refuses → re-compose the ad (the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`), departure 6) without the line or visual that triggered it, then send it once more. That is the ad's one retry. Say plainly what was removed and why.
4. **Then the playbook's extra checks:** Pass B of the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`) on what was drawn, and `../make-static-ads/references/review-rubric.md` checks 1–29 in order; stop at the first BLOCK. A BLOCK or REMAKE on try 1 that the judge passed → use the render's one retry anyway, with `judge.md` §7's note form and the failure in one sentence as the notes. A competitor copy or a lost concept is fixed by re-composing (a new picture idea or words), not by the retry note alone. Still there after the retry → a BLOCK drops the ad, a REMAKE drops it unless it is a taste call (then a NOTE for the human); say why ("dropped: invented seal survived the retry"). Never a third render without a new quote and yes.
5. **Set diversity.** After every render is judged, re-run rubric check 19 on the set.
6. **Cannot see the image?** The render is unjudged (`judge.md` §6): no retry, flagged, and the ad is marked "not checked by eye" with a three-item checklist for the human (`review-rubric.md`, last section).
7. **Extra placements** on an approved render: a new ratio is a new base prompt (compose row 10) and a quoted `gooseworks:ads_render` call, judged the same way.
8. **Record** per `judge.md` §8: the full trace in the batch file; tags on the creative (`judge:pass`, `judge:needs-review`, `judge:unjudged`, `try:1`, `try:2`, `superseded`) merged into the set from `../make-static-ads/references/handoff-format.md` §2 with `gooseworks:ads_creative_update` — read the current tags, merge, write once, lower-case. Render `feedback` carries only the marketer's own ratings and words; the judge and the playbook's checks go to tags and the batch file.

## Judge departures from the server

Appended to the assembled `judge.md` §3 instruction, each marked in the batch file.

| # | Departure |
|---|---|
| J1 | **The ad's usable facts.** Append: ` Facts this ad may state: «the featured product's facts, its price and sale price, and its usable facts». A claim matching one of these is grounded.` — so `claims_grounded` judges against the brand's real facts, not only what the photos show. |
| J2 | **Accent text.** When the composer's answer or the blueprint sets the headline in the accent colour, or text in `on_accent` on an accent panel, append to the colour piece: ` Text set in «scheme.accent», or in «on_accent» on a «scheme.accent» panel, also follows the scheme.` The server's "ALL text should be «scheme.ink»" otherwise fails layouts its own composer writes. |
